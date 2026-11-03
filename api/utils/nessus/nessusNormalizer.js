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
const crypto = require('node:crypto');

const SEVERITY_NAMES = ['Info', 'Low', 'Medium', 'High', 'Critical'];
const SEVERITY_SCORE_WEIGHT = [0, 1, 3, 10, 40];
const COMPLIANCE_FAMILY = 'Policy Compliance';
const MAX_PLUGIN_OUTPUT = 64 * 1024;
const NO_DATE = '-1';

const XREF_TAGS = {
    cve: 'CVE',
    bid: 'BID',
    iava: 'IAVA',
    iavb: 'IAVB',
    iavt: 'IAVT',
    msft: 'MSFT',
    mskb: 'MSKB',
    cert: 'CERT',
    cwe: 'CWE',
    osvdb: 'OSVDB',
    'edb-id': 'EDB-ID',
};

function isIp(value) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value || '');
}

function unixSeconds(value) {
    const n = Number(value);

    return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : '';
}

/** Nessus plugin dates are YYYY/MM/DD; Tenable reports unix seconds as strings. */
function dateToUnix(value) {
    if (!value) return NO_DATE;

    const match = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(value);

    if (!match) {
        const parsed = Date.parse(value);

        return Number.isNaN(parsed) ? NO_DATE : String(Math.floor(parsed / 1000));
    }

    return String(Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000));
}

function parseHostTimestamp(properties, tsKey, textKey) {
    const ts = unixSeconds(properties[tsKey]);

    if (ts) return ts;

    const parsed = Date.parse(properties[textKey] || '');

    return Number.isNaN(parsed) ? '' : String(Math.floor(parsed / 1000));
}

function yesNo(value) {
    return value === 'true' ? 'Yes' : 'No';
}

function stripRevision(version) {
    const match = /\$Revision:([^$]*)\$/.exec(version || '');

    return match ? match[1].trim() : version || '';
}

function familyType(familyName, pluginType) {
    return familyName === COMPLIANCE_FAMILY || pluginType === 'compliance' ? 'compliance' : 'active';
}

function buildXrefs(item) {
    const xrefs = [];

    for (const [tag, type] of Object.entries(XREF_TAGS)) {
        for (const value of item[tag] || []) {
            xrefs.push({ type, value });
        }
    }

    for (const raw of item.xref || []) {
        const idx = raw.indexOf(':');

        if (idx > 0) {
            xrefs.push({ type: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() });
        }
    }

    const seen = new Set();

    return xrefs.filter(ref => {
        const key = `${ref.type}:${ref.value}`;

        if (seen.has(key)) return false;
        seen.add(key);

        return true;
    });
}

function formatXrefs(xrefs, separator) {
    return xrefs.map(ref => `${ref.type}${separator}${ref.value}`).join(', ');
}

function exploitFrameworks(item) {
    return Object.keys(item)
        .filter(key => key.startsWith('exploit_framework_') && item[key] === 'true')
        .map(key => key.slice('exploit_framework_'.length))
        .join(', ');
}

function osCpe(properties) {
    for (const [key, value] of Object.entries(properties)) {
        if (/^cpe(-\d+)?$/.test(key) && value.startsWith('cpe:/o:')) return value;
    }

    return '';
}

function toHost(reportHost, scan) {
    const p = reportHost.properties;
    const ip = p['host-ip'] || (isIp(reportHost.name) ? reportHost.name : '');
    const dnsName = p['host-fqdn'] || p['host-rdns'] || (isIp(reportHost.name) ? '' : reportHost.name);
    const macAddress = (p['mac-address'] || '').split(/\r?\n/)[0].trim();
    const hostUUID = p['host-uuid'] || crypto.createHash('sha256').update(`${scan.scanId}:${ip}:${dnsName}:${macAddress}`).digest('hex').slice(0, 40);

    return {
        hostKey: hostUUID,
        hostUUID,
        uuid: p['tenable_agent_uuid'] || p['agent-uuid'] || '',
        ip,
        dnsName,
        netbiosName: p['netbios-name'] || '',
        macAddress,
        operatingSystem: p['operating-system'] || '',
        osCPE: osCpe(p),
        systemType: p['system-type'] || '',
        credentialed: p['Credentialed_Scan'] === 'true',
        hostStart: parseHostTimestamp(p, 'HOST_START_TIMESTAMP', 'HOST_START'),
        hostEnd: parseHostTimestamp(p, 'HOST_END_TIMESTAMP', 'HOST_END'),
    };
}

function toPlugin(item) {
    return {
        id: item.pluginID,
        name: item.pluginName,
        family: { id: '', name: item.pluginFamily || '', type: familyType(item.pluginFamily, item.plugin_type) },
        type: item.plugin_type || '',
        description: item.description || '',
        synopsis: item.synopsis || '',
        solution: item.solution || '',
        seeAlso: (item.see_also || []).join('\n'),
        riskFactor: item.risk_factor || '',
        stigSeverity: item.stig_severity || '',
        vprScore: item.vpr_score || '',
        epssScore: item.epss_score ? String(Math.round(Number(item.epss_score) * 10000) / 100) : '',
        baseScore: item.cvss_base_score || '',
        temporalScore: item.cvss_temporal_score || '',
        cvssVector: item.cvss_vector || '',
        cvssV3BaseScore: item.cvss3_base_score || '',
        cvssV3TemporalScore: item.cvss3_temporal_score || '',
        cvssV3Vector: item.cvss3_vector || '',
        cvssV4BaseScore: item.cvss4_base_score || '',
        cvssV4Vector: item.cvss4_vector || '',
        cpe: (item.cpe || []).join('\n'),
        exploitAvailable: item.exploit_available === 'true' ? 'true' : 'false',
        exploitEase: item.exploitability_ease || '',
        exploitFrameworks: exploitFrameworks(item),
        checkType: item.plugin_type || '',
        vulnPubDate: dateToUnix(item.vuln_publication_date),
        patchPubDate: dateToUnix(item.patch_publication_date),
        pluginPubDate: dateToUnix(item.plugin_publication_date),
        pluginModDate: dateToUnix(item.plugin_modification_date),
        seolDate: dateToUnix(item.seol_date),
        sourceFile: item.fname || '',
        version: stripRevision(item.script_version),
        xrefs: buildXrefs(item),
    };
}

/**
 * GET /plugins/plugin/{id} returns {id, name, family_name, attributes:[{attribute_name, attribute_value}]}
 * whose attribute names match the .nessus ReportItem child elements.
 */
function pluginFromAttributes(nessusPlugin) {
    const item = { pluginID: String(nessusPlugin.id), pluginName: nessusPlugin.name || '', pluginFamily: nessusPlugin.family_name || '' };

    for (const { attribute_name: name, attribute_value: value } of nessusPlugin.attributes || []) {
        if (Object.hasOwn(XREF_TAGS, name) || name === 'xref' || name === 'see_also' || name === 'cpe') {
            item[name] ??= [];
            item[name].push(value);
        } else {
            item[name] = value;
        }
    }

    return toPlugin(item);
}

function toFinding(host, item, plugin) {
    return {
        host,
        plugin,
        pluginID: item.pluginID,
        severity: Number.parseInt(item.severity, 10) || 0,
        port: Number.parseInt(item.port, 10) || 0,
        protocol: (item.protocol || '').toUpperCase(),
        pluginOutput: (item.plugin_output || '').slice(0, MAX_PLUGIN_OUTPUT),
        firstSeen: host.hostStart,
        lastSeen: host.hostEnd,
    };
}

/**
 * Builds the in-memory snapshot of one scan: normalized hosts, per-host
 * findings, and the plugin index used for GET /plugin/{id} fallbacks.
 */
function buildSnapshot(parsed, scan) {
    const plugins = new Map();
    const hosts = [];
    const findings = [];

    for (const reportHost of parsed.hosts) {
        const host = toHost(reportHost, scan);

        hosts.push(host);

        for (const item of reportHost.items) {
            let plugin = plugins.get(item.pluginID);

            if (!plugin) {
                plugin = toPlugin(item);
                plugins.set(item.pluginID, plugin);
            }

            findings.push(toFinding(host, item, plugin));
        }
    }

    const scanEnd = scan.scanEnd || hosts.reduce((max, h) => (h.hostEnd > max ? h.hostEnd : max), '');

    for (const finding of findings) {
        finding.lastSeen = scanEnd || finding.lastSeen;
        if (!finding.firstSeen) finding.firstSeen = finding.lastSeen;
    }

    return { ...scan, scanEnd, hosts, findings, plugins };
}

function applyFamilyIds(snapshot, families) {
    const byName = new Map(families.map(f => [f.name, String(f.id)]));

    for (const plugin of snapshot.plugins.values()) {
        plugin.family.id = byName.get(plugin.family.name) || plugin.family.id || '';
    }
}

function severityObject(level) {
    return { id: String(level), name: SEVERITY_NAMES[level] || 'Info', description: '' };
}

function repositoryObject(snapshot) {
    return { id: String(snapshot.scanId), name: snapshot.scanName, description: '' };
}

function hostFields(host) {
    return {
        ip: host.ip,
        ips: host.ip,
        dnsName: host.dnsName,
        dns: host.dnsName,
        netbiosName: host.netbiosName,
        macAddress: host.macAddress,
        uuid: host.uuid,
        hostUUID: host.hostUUID,
        operatingSystem: host.operatingSystem,
        osCPE: host.osCPE,
    };
}

function toListVulnRow(finding, snapshot) {
    const { plugin } = finding;

    return {
        pluginID: finding.pluginID,
        name: plugin.name,
        family: plugin.family,
        severity: severityObject(finding.severity),
        vprScore: plugin.vprScore,
        cvssV3BaseScore: plugin.cvssV3BaseScore,
        ...hostFields(finding.host),
        port: String(finding.port),
        protocol: finding.protocol,
        firstSeen: finding.firstSeen,
        lastSeen: finding.lastSeen,
        hasBeenMitigated: '0',
        acrScore: '',
        assetExposureScore: '',
        repository: repositoryObject(snapshot),
    };
}

/** Plugin fields that vulndetails rows rename or format instead of copying through. */
const VULN_ROW_RENAMED_FIELDS = new Set(['xrefs', 'name', 'id', 'family', 'type', 'seeAlso']);

function toVulnDetailsRow(finding, snapshot) {
    const { plugin } = finding;
    const attributes = Object.fromEntries(Object.entries(plugin).filter(([key]) => !VULN_ROW_RENAMED_FIELDS.has(key)));

    return {
        ...toListVulnRow(finding, snapshot),
        ...attributes,
        pluginName: plugin.name,
        pluginInfo: `${plugin.id} (${finding.port}/${finding.protocol}) ${plugin.name}`,
        pluginText: finding.pluginOutput ? `<plugin_output>${finding.pluginOutput}</plugin_output>` : '',
        exploitAvailable: yesNo(plugin.exploitAvailable),
        xref: formatXrefs(plugin.xrefs, '#'),
        seeAlso: plugin.seeAlso,
        acceptRisk: '0',
        recastRisk: '0',
        acceptRiskRuleComment: '',
        recastRiskRuleComment: '',
        acrLastEvaluatedTime: '',
    };
}

function toTenablePlugin(plugin) {
    const { xrefs, seeAlso, ...rest } = plugin;

    return {
        ...rest,
        xrefs: formatXrefs(xrefs, ':'),
        seeAlso,
        vprContext: '[]',
        cvssV4BaseScore: plugin.cvssV4BaseScore,
    };
}

function groupBy(items, keyFn) {
    const groups = new Map();

    for (const item of items) {
        const key = keyFn(item);
        const group = groups.get(key);

        if (group) group.push(item);
        else groups.set(key, [item]);
    }

    return groups;
}

function maxNumeric(values) {
    let max = '';

    for (const value of values) {
        if (value !== '' && (max === '' || Number(value) > Number(max))) max = value;
    }

    return max;
}

function toSumIdRows(findings) {
    return [...groupBy(findings, f => f.pluginID).values()].map(group => {
        const { plugin } = group[0];

        return {
            pluginID: plugin.id,
            name: plugin.name,
            family: plugin.family,
            severity: severityObject(Math.max(...group.map(f => f.severity))),
            vprScore: plugin.vprScore,
            cvssV3BaseScore: plugin.cvssV3BaseScore,
            exploitAvailable: yesNo(plugin.exploitAvailable),
            total: String(group.length),
            hostTotal: String(new Set(group.map(f => f.host.hostKey)).size),
            acrScore: null,
            assetExposureScore: null,
        };
    });
}

function severityCounts(group) {
    const counts = [0, 0, 0, 0, 0];

    for (const finding of group) counts[finding.severity] += 1;

    return counts;
}

function hostScore(counts) {
    return counts.reduce((sum, count, level) => sum + count * SEVERITY_SCORE_WEIGHT[level], 0);
}

function toSumIpRows(findings, snapshot) {
    return [...groupBy(findings, f => f.host.hostKey).values()].map(group => {
        const counts = severityCounts(group);

        return {
            ...hostFields(group[0].host),
            repository: repositoryObject(snapshot),
            score: String(hostScore(counts)),
            total: String(group.length),
            severityInfo: String(counts[0]),
            severityLow: String(counts[1]),
            severityMedium: String(counts[2]),
            severityHigh: String(counts[3]),
            severityCritical: String(counts[4]),
            vprScore: maxNumeric(group.map(f => f.plugin.vprScore)),
            lastSeen: group[0].lastSeen,
            acrScore: '',
            assetExposureScore: '',
        };
    });
}

function toSumSeverityRows(findings) {
    return [...groupBy(findings, f => f.severity).entries()].map(([level, group]) => ({
        severity: severityObject(level),
        count: String(group.length),
    }));
}

function toSumDnsNameRows(findings, snapshot) {
    return [...groupBy(findings, f => f.host.dnsName).values()].map(group => {
        const counts = severityCounts(group);

        return {
            dnsName: group[0].host.dnsName,
            repository: repositoryObject(snapshot),
            score: String(hostScore(counts)),
            total: String(group.length),
            severityInfo: String(counts[0]),
            severityLow: String(counts[1]),
            severityMedium: String(counts[2]),
            severityHigh: String(counts[3]),
            severityCritical: String(counts[4]),
        };
    });
}

/** Stable 31-bit hash of the solution text, used as the numeric part of a solution id. */
function solutionIndex(solution) {
    let hash = 0x811c9dc5;

    for (const char of solution) {
        hash = Math.imul(hash ^ char.codePointAt(0), 0x01000193);
    }

    return hash >>> 1 || 1;
}

/**
 * Groups findings by plugin solution text. Solution ids derive from the text
 * itself, so they stay stable across filters, sort orders and scans.
 */
function buildSolutionGroups(findings) {
    return [
        ...groupBy(
            findings.filter(f => f.plugin.solution && f.severity > 0),
            f => f.plugin.solution
        ).entries(),
    ].map(([solution, group]) => ({
        index: solutionIndex(solution),
        solution,
        findings: group,
    }));
}

function toSumRemediationRows(findings, snapshot) {
    const totalScore = findings.reduce((sum, f) => sum + SEVERITY_SCORE_WEIGHT[f.severity], 0);

    return buildSolutionGroups(findings).map(group => {
        const score = group.findings.reduce((sum, f) => sum + SEVERITY_SCORE_WEIGHT[f.severity], 0);
        const plugins = [...new Set(group.findings.map(f => f.pluginID))];
        const msbulletins = [...new Set(group.findings.flatMap(f => f.plugin.xrefs.filter(x => x.type === 'MSFT').map(x => x.value)))];

        return {
            solutionID: `${snapshot.scanId}-${group.index}`,
            solution: group.solution,
            scorePctg: totalScore ? `${Math.round((score / totalScore) * 10000) / 100}%` : '0%',
            hostTotal: String(new Set(group.findings.map(f => f.host.hostKey)).size),
            total: String(group.findings.length),
            vprScore: maxNumeric(group.findings.map(f => f.plugin.vprScore)),
            cvssV3BaseScore: maxNumeric(group.findings.map(f => f.plugin.cvssV3BaseScore)),
            pluginID: plugins.join(','),
            msbulletinID: msbulletins.join(','),
            cpe: group.findings[0].plugin.cpe,
            remediationList: plugins.map(id => ({ pluginID: id })),
        };
    });
}

function toHostSearchRow(host, snapshot, hostFindings) {
    return {
        id: host.hostKey,
        uuid: host.uuid || host.hostUUID,
        name: host.dnsName || host.netbiosName || host.ip,
        ipAddress: host.ip,
        os: host.operatingSystem,
        systemType: host.systemType,
        macAddress: host.macAddress,
        netBios: host.netbiosName,
        dns: host.dnsName,
        firstSeen: hostFindings[0]?.firstSeen || host.hostStart || snapshot.scanEnd,
        lastSeen: snapshot.scanEnd || host.hostEnd,
        source: [{ type: host.credentialed ? 'nessus-credentialed' : 'nessus' }],
        acr: { score: null, lastEvaluatedTime: null },
        aes: { score: null },
        repository: repositoryObject(snapshot),
    };
}

module.exports = {
    NO_DATE,
    SEVERITY_NAMES,
    unixSeconds,
    buildSnapshot,
    applyFamilyIds,
    pluginFromAttributes,
    toListVulnRow,
    toVulnDetailsRow,
    toTenablePlugin,
    toSumIdRows,
    toSumIpRows,
    toSumSeverityRows,
    toSumDnsNameRows,
    toSumRemediationRows,
    buildSolutionGroups,
    toHostSearchRow,
    dateToUnix,
};
