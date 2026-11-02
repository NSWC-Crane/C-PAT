/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const config = require('../utils/config');
const dbUtils = require('./utils');
const SmError = require('../utils/error');
const logger = require('../utils/logger');
const { serializeError } = require('../utils/serializeError');
const { client } = require('../utils/nessusClient');
const { NessusCache } = require('../utils/nessus/nessusCache');
const { parseNessusXml } = require('../utils/nessus/nessusXml');
const normalizer = require('../utils/nessus/nessusNormalizer');
const { compileFilters } = require('../utils/nessus/nessusFilterEngine');
const { applyQuery } = require('../utils/nessus/nessusQuery');
const sightings = require('./nessusSightingService');

const SCAN_INFO_TTL_MS = 60 * 1000;
const STALE_SCAN_DAYS = 30;

const snapshotCache = new NessusCache({ ttlMs: config.nessus.cacheTtl, maxEntries: config.nessus.cacheMaxScans });
const infoCache = new NessusCache({ ttlMs: SCAN_INFO_TTL_MS, maxEntries: 100 });

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

function envelope(response, warnings = []) {
    return { type: 'regular', response, error_code: 0, error_msg: '', warnings, timestamp: Math.floor(Date.now() / 1000) };
}

/** Scan ids attached to Nessus collections, used when a query names no repository. */
async function collectionScanIds() {
    return await withConnection(async connection => {
        const [rows] = await connection.query(
            `SELECT DISTINCT originCollectionId FROM ${config.database.schema}.collection WHERE collectionType = 'Nessus' AND originCollectionId > 0`
        );

        return rows.map(row => String(row.originCollectionId));
    });
}

async function getFamilies() {
    return infoCache.load('families', async () => {
        const data = await client.getPluginFamilies();

        return (data?.families || []).map(f => ({ id: String(f.id), name: f.name }));
    });
}

async function getScanInfo(scanId) {
    return infoCache.load(`scan:${scanId}`, async () => {
        const details = await client.getScanDetails(scanId);
        const completed = (details?.history || []).filter(h => h.status === 'completed').sort((a, b) => Number(b.history_id) - Number(a.history_id));
        const latest = completed[0];

        return {
            scanId: String(scanId),
            scanName: details?.info?.name || `Scan ${scanId}`,
            historyId: latest ? Number(latest.history_id) : null,
            scanEnd: normalizer.unixSeconds(latest?.last_modification_date || details?.info?.scan_end || details?.info?.timestamp),
        };
    });
}

async function loadSnapshot(scanId) {
    const info = await getScanInfo(scanId);

    return snapshotCache.load(`${info.scanId}:${info.historyId ?? 'current'}`, async () => {
        const xml = await client.exportScanFile(info.scanId, info.historyId);
        const snapshot = normalizer.buildSnapshot(parseNessusXml(xml), info);

        normalizer.applyFamilyIds(snapshot, await getFamilies());

        return sightings.applySightings(snapshot);
    });
}

/**
 * Loads the scans a query names. When it names none, every scan attached to a
 * Nessus collection is loaded and scans that fail to load are skipped with a
 * warning so one broken scan does not fail the whole query.
 */
async function resolveSnapshots(scanIds) {
    if (scanIds.length) {
        return { snapshots: await Promise.all(scanIds.map(loadSnapshot)), warnings: [] };
    }

    const ids = await collectionScanIds();
    const settled = await Promise.allSettled(ids.map(loadSnapshot));
    const warnings = [];

    settled.forEach((result, i) => {
        if (result.status === 'rejected') {
            logger.writeError('nessus', 'scanUnavailable', { scanId: ids[i], error: serializeError(result.reason) });
            warnings.push(`Nessus scan ${ids[i]} could not be loaded and was skipped.`);
        }
    });

    return { snapshots: settled.filter(r => r.status === 'fulfilled').map(r => r.value), warnings };
}

/** Every finding shares the scan's end time as Last Seen, so a stale scan vanishes behind the default 30-day window. */
function staleScanWarnings(snapshots) {
    const cutoff = Math.floor(Date.now() / 1000) - STALE_SCAN_DAYS * 24 * 60 * 60;

    return snapshots
        .filter(s => Number(s.scanEnd) && Number(s.scanEnd) < cutoff)
        .map(
            s =>
                `The latest completed run of scan "${s.scanName}" finished on ${new Date(Number(s.scanEnd) * 1000).toISOString().slice(0, 10)}, more than ${STALE_SCAN_DAYS} days ago. Widen the Last Seen filter or re-run the scan to see its findings.`
        );
}

function findingsFor(snapshot, predicate) {
    return snapshot.findings.filter(predicate);
}

/** Per-finding tools can page over findings before building rows when no sort is requested. */
const PER_FINDING_ROWS = {
    listvuln: normalizer.toListVulnRow,
    vulndetails: normalizer.toVulnDetailsRow,
    tenable_internal_vulndetails: normalizer.toVulnDetailsRow,
};

const TOOLS = {
    sumid: (snapshots, predicate) => normalizer.toSumIdRows(snapshots.flatMap(s => findingsFor(s, predicate))),
    sumseverity: (snapshots, predicate) => normalizer.toSumSeverityRows(snapshots.flatMap(s => findingsFor(s, predicate))),
    listvuln: (snapshots, predicate) => snapshots.flatMap(s => findingsFor(s, predicate).map(f => normalizer.toListVulnRow(f, s))),
    vulndetails: (snapshots, predicate) => snapshots.flatMap(s => findingsFor(s, predicate).map(f => normalizer.toVulnDetailsRow(f, s))),
    tenable_internal_vulndetails: (snapshots, predicate) => TOOLS.vulndetails(snapshots, predicate),
    sumip: (snapshots, predicate) => snapshots.flatMap(s => normalizer.toSumIpRows(findingsFor(s, predicate), s)),
    sumdnsname: (snapshots, predicate) => snapshots.flatMap(s => normalizer.toSumDnsNameRows(findingsFor(s, predicate), s)),
    sumremediation: (snapshots, predicate) => snapshots.flatMap(s => normalizer.toSumRemediationRows(findingsFor(s, predicate), s)),
};

async function analyze(body, toolOverride) {
    const query = body?.query || {};
    const tool = toolOverride || query.tool;
    const build = TOOLS[tool];

    if (!build) {
        throw new SmError.ClientError(`The analysis tool "${tool}" is not supported for Nessus Professional.`);
    }

    const { scanIds, predicate, warnings } = compileFilters(query.filters);
    const resolved = await resolveSnapshots(scanIds);
    const snapshots = resolved.snapshots;
    const rowFor = PER_FINDING_ROWS[tool];

    warnings.push(...resolved.warnings, ...staleScanWarnings(snapshots));

    if (rowFor && !(body.sortField || query.sortColumn)) {
        const page = applyQuery(
            snapshots.flatMap(s => findingsFor(s, predicate).map(f => [f, s])),
            body
        );

        return envelope({ ...page, results: page.results.map(([f, s]) => rowFor(f, s)) }, warnings);
    }

    return envelope(applyQuery(build(snapshots, predicate), body), warnings);
}

module.exports.runAnalysis = async function runAnalysis(req) {
    return analyze(req.body);
};

module.exports.runSolutions = async function runSolutions(req) {
    return analyze(req.body, 'sumremediation');
};

/** The solution with this id in every resolved scan, since ids derive from the solution text. */
async function solutionMatches(req) {
    const { scanIds } = compileFilters(req.body?.query?.filters);
    const index = Number(req.params.solutionId);
    const { snapshots } = await resolveSnapshots(scanIds);
    const matches = snapshots
        .map(snapshot => ({ snapshot, group: normalizer.buildSolutionGroups(snapshot.findings).find(g => g.index === index) }))
        .filter(match => match.group);

    if (!matches.length) {
        throw new SmError.NotFoundError(`Solution ${index} was not found.`);
    }

    return matches;
}

module.exports.solutionAssets = async function solutionAssets(req) {
    const matches = await solutionMatches(req);

    return envelope(
        applyQuery(
            matches.flatMap(({ snapshot, group }) => normalizer.toSumIpRows(group.findings, snapshot)),
            req.body
        )
    );
};

module.exports.solutionVulnerabilities = async function solutionVulnerabilities(req) {
    const matches = await solutionMatches(req);

    return envelope(applyQuery(normalizer.toSumIdRows(matches.flatMap(({ group }) => group.findings)), req.body).results);
};

function hostSearchScanId(body) {
    const clauses = body?.filters?.and || [];
    const clause = clauses.find(c => c?.property === 'repositoryHost');

    if (!clause?.value) {
        throw new SmError.ClientError('A repositoryHost filter naming the Nessus scan is required.');
    }

    return String(clause.value);
}

module.exports.runHostSearch = async function runHostSearch(req) {
    const snapshot = await loadSnapshot(hostSearchScanId(req.body));
    const byHost = new Map();

    for (const finding of snapshot.findings) {
        const list = byHost.get(finding.host.hostKey);

        if (list) list.push(finding);
        else byHost.set(finding.host.hostKey, [finding]);
    }

    return envelope(snapshot.hosts.map(host => normalizer.toHostSearchRow(host, snapshot, byHost.get(host.hostKey) || [])));
};

function pluginFromCache(pluginId) {
    for (const snapshot of snapshotCache.values()) {
        const plugin = snapshot.plugins.get(String(pluginId));

        if (plugin) return plugin;
    }

    return null;
}

module.exports.getPlugin = async function getPlugin(req) {
    const pluginId = req.params.pluginId;
    let plugin;

    try {
        plugin = normalizer.pluginFromAttributes(await client.getPlugin(pluginId));
    } catch (err) {
        plugin = pluginFromCache(pluginId);

        if (!plugin) throw err;
    }

    const families = await getFamilies().catch(() => []);
    const family = families.find(f => f.name === plugin.family.name);

    if (family) plugin.family.id = family.id;

    return envelope(normalizer.toTenablePlugin(plugin));
};

module.exports.getPluginFamilies = async function getPluginFamilies() {
    return envelope(await getFamilies());
};

module.exports.listScans = async function listScans() {
    const data = await client.listScans();
    const folders = new Map((data?.folders || []).map(f => [f.id, f]));

    const scans = (data?.scans || [])
        .filter(scan => folders.get(scan.folder_id)?.type !== 'trash')
        .map(scan => ({ id: String(scan.id), name: scan.name, description: folders.get(scan.folder_id)?.name || '' }));

    return envelope(scans);
};

module.exports.emptyUsable = async function emptyUsable() {
    return envelope({ usable: [], manageable: [] });
};

module.exports.emptyList = async function emptyList() {
    return envelope([]);
};

module.exports.invalidateScan = async function invalidateScan(req) {
    const scanId = String(req.params.scanId);

    infoCache.delete(`scan:${scanId}`);
    snapshotCache.deleteWhere(key => key.startsWith(`${scanId}:`));
};
