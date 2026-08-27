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

const MAX_CHANGES_PER_REQUEST = 100;
const SKIPPED_CLOSED = 'closed';
const SKIPPED_NOT_IN_COLLECTION = 'not in collection';
const NOT_ATTEMPTED = 'Not attempted';

const schema = () => config.database.schema;

function requireElevatedAdmin(req) {
    if (!req.query?.elevate || req.userObject?.isAdmin !== true) {
        throw new SmError.PrivilegeError('Insufficient privileges. Elevate parameter and administrative privileges are required.');
    }
}

function requireCollectionId(req) {
    const collectionId = Number(req.params?.collectionId);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
        throw new SmError.ClientError('collectionId is required');
    }

    return collectionId;
}

function uniqueTeamIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value.map(Number).filter(id => Number.isInteger(id) && id > 0))];
}

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();

    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

async function requireCollection(collectionId) {
    const rows = await withConnection(async connection => {
        const [collectionRows] = await connection.query(`SELECT collectionId FROM ${schema()}.collection WHERE collectionId = ?`, [collectionId]);

        return collectionRows;
    });

    if (rows.length === 0) {
        throw new SmError.NotFoundError('Collection not found');
    }
}

function groupBy(rows, key) {
    const groups = new Map();

    for (const row of rows) {
        const list = groups.get(row[key]);

        if (list) {
            list.push(row);
        } else {
            groups.set(row[key], [row]);
        }
    }

    return groups;
}

module.exports.getCollectionTeamSyncSnapshot = async function getCollectionTeamSyncSnapshot(req) {
    requireElevatedAdmin(req);
    const collectionId = requireCollectionId(req);

    return await dbUtils.withTransaction(async connection => {
        const [collectionRows] = await connection.query(
            `SELECT collectionId, collectionType, originCollectionId FROM ${schema()}.collection WHERE collectionId = ?`,
            [collectionId]
        );

        if (collectionRows.length === 0) {
            throw new SmError.NotFoundError('Collection not found');
        }

        const [poamRows] = await connection.query(
            `SELECT poamId, vulnerabilityId, vulnerabilitySource, stigBenchmarkId, status, isGlobalFinding
             FROM ${schema()}.poam
             WHERE collectionId = ?
             ORDER BY poamId`,
            [collectionId]
        );
        const [vulnRows] = await connection.query(
            `SELECT v.poamId, v.associatedVulnerability
             FROM ${schema()}.poamassociatedvulnerabilities v
             INNER JOIN ${schema()}.poam p ON p.poamId = v.poamId
             WHERE p.collectionId = ?`,
            [collectionId]
        );
        const [teamRows] = await connection.query(
            `SELECT pat.poamId, pat.assignedTeamId, t.assignedTeamName, pat.automated
             FROM ${schema()}.poamassignedteams pat
             INNER JOIN ${schema()}.poam p ON p.poamId = pat.poamId
             INNER JOIN ${schema()}.assignedteams t ON t.assignedTeamId = pat.assignedTeamId
             WHERE p.collectionId = ?
             ORDER BY t.assignedTeamName`,
            [collectionId]
        );
        const [assetRows] = await connection.query(
            `SELECT DISTINCT pa.poamId, pa.assetId, a.assetName
             FROM ${schema()}.poamassets pa
             INNER JOIN ${schema()}.poam p ON p.poamId = pa.poamId
             LEFT JOIN ${schema()}.asset a ON a.assetId = pa.assetId AND a.collectionId = ?
             WHERE p.collectionId = ?`,
            [collectionId, collectionId]
        );

        const vulnsByPoam = groupBy(vulnRows, 'poamId');
        const teamsByPoam = groupBy(teamRows, 'poamId');
        const assetsByPoam = groupBy(assetRows, 'poamId');
        const collection = collectionRows[0];

        return {
            collectionId: collection.collectionId,
            collectionType: collection.collectionType,
            originCollectionId: collection.originCollectionId == null ? null : collection.originCollectionId,
            poams: poamRows.map(poam => ({
                poamId: poam.poamId,
                vulnerabilityId: poam.vulnerabilityId ?? null,
                vulnerabilitySource: poam.vulnerabilitySource ?? null,
                stigBenchmarkId: poam.stigBenchmarkId ?? null,
                status: poam.status,
                isGlobalFinding: Boolean(poam.isGlobalFinding),
                associatedVulnerabilities: (vulnsByPoam.get(poam.poamId) || []).map(row => row.associatedVulnerability),
                assignedTeams: (teamsByPoam.get(poam.poamId) || []).map(row => ({
                    assignedTeamId: row.assignedTeamId,
                    assignedTeamName: row.assignedTeamName,
                    automated: Boolean(row.automated),
                })),
                assets: (assetsByPoam.get(poam.poamId) || []).map(row => ({
                    assetId: row.assetId,
                    assetName: row.assetName,
                })),
            })),
        };
    });
};

module.exports.postCollectionTeamSync = async function postCollectionTeamSync(req) {
    requireElevatedAdmin(req);
    const collectionId = requireCollectionId(req);
    const changes = req.body?.changes;

    if (!Array.isArray(changes)) {
        throw new SmError.ClientError('changes is required');
    }

    if (changes.length > MAX_CHANGES_PER_REQUEST) {
        throw new SmError.ClientError(`changes may contain at most ${MAX_CHANGES_PER_REQUEST} POAMs per request`);
    }

    await requireCollection(collectionId);

    const userId = req.userObject.userId;
    const results = [];
    let aborted = false;

    for (const change of changes) {
        const poamId = change?.poamId ?? null;

        if (aborted) {
            results.push({ poamId, added: [], removed: [], error: NOT_ATTEMPTED });
            continue;
        }

        try {
            results.push(await applyPoamChange(collectionId, change, userId));
        } catch (error) {
            logger.writeError('collectionTeamSyncService', 'postCollectionTeamSync', {
                collectionId,
                poamId,
                userId,
                code: error?.code,
                message: error?.message,
            });
            results.push({ poamId, added: [], removed: [], error: error?.code ? `Database error (${error.code})` : 'Database error' });
            aborted = true;
        }
    }

    return { results };
};

async function applyPoamChange(collectionId, change, userId) {
    const poamId = Number(change?.poamId);
    const add = uniqueTeamIds(change?.add);
    const remove = uniqueTeamIds(change?.remove).filter(id => !add.includes(id));

    if (!Number.isInteger(poamId) || poamId <= 0) {
        return { poamId: change?.poamId ?? null, added: [], removed: [], error: 'poamId is required' };
    }

    try {
        return await dbUtils.retryOnDeadlock(
            async () =>
                await dbUtils.withTransaction(async connection => applyPoamChangeInTransaction(connection, { collectionId, poamId, add, remove, userId }))
        );
    } catch (error) {
        if (error instanceof SmError.SmError || !error?.sqlState) {
            throw error;
        }

        logger.writeError('collectionTeamSyncService', 'applyPoamChange', { collectionId, poamId, userId, code: error.code, message: error.message });

        return { poamId, added: [], removed: [], error: `Database error (${error.code || error.errno})` };
    }
}

async function applyPoamChangeInTransaction(connection, { collectionId, poamId, add, remove, userId }) {
    const [poamRows] = await connection.query(`SELECT poamId, status FROM ${schema()}.poam WHERE poamId = ? AND collectionId = ? FOR UPDATE`, [
        poamId,
        collectionId,
    ]);

    if (poamRows.length === 0) {
        return { poamId, added: [], removed: [], skipped: SKIPPED_NOT_IN_COLLECTION };
    }

    if (poamRows[0].status === 'Closed') {
        return { poamId, added: [], removed: [], skipped: SKIPPED_CLOSED };
    }

    const teamNames = await loadTeamNames(connection, [...add, ...remove]);
    const added = [];
    const removed = [];
    const unknown = [];

    for (const assignedTeamId of add) {
        if (!teamNames.has(assignedTeamId)) {
            unknown.push(assignedTeamId);
            continue;
        }

        if (await addAutomatedTeam(connection, { poamId, assignedTeamId, teamName: teamNames.get(assignedTeamId), userId })) {
            added.push(assignedTeamId);
        }
    }

    for (const assignedTeamId of remove) {
        if (await removeAutomatedTeam(connection, { poamId, assignedTeamId, teamName: teamNames.get(assignedTeamId) || 'Unknown Team', userId })) {
            removed.push(assignedTeamId);
        }
    }

    return unknown.length > 0 ? { poamId, added, removed, unknown } : { poamId, added, removed };
}

async function loadTeamNames(connection, assignedTeamIds) {
    const ids = [...new Set(assignedTeamIds)];

    if (ids.length === 0) {
        return new Map();
    }

    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.query(
        `SELECT assignedTeamId, assignedTeamName FROM ${schema()}.assignedteams WHERE assignedTeamId IN (${placeholders})`,
        ids
    );

    return new Map(rows.map(row => [row.assignedTeamId, row.assignedTeamName]));
}

async function writePoamLog(connection, poamId, action, userId) {
    await connection.query(`INSERT INTO ${schema()}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`, [poamId, action, userId]);
}

async function addAutomatedTeam(connection, { poamId, assignedTeamId, teamName, userId }) {
    const [existing] = await connection.query(`SELECT assignedTeamId FROM ${schema()}.poamassignedteams WHERE poamId = ? AND assignedTeamId = ? FOR UPDATE`, [
        poamId,
        assignedTeamId,
    ]);

    if (existing.length > 0) {
        return false;
    }

    await connection.query(`INSERT INTO ${schema()}.poamassignedteams (poamId, assignedTeamId, automated) VALUES (?, ?, 1)`, [poamId, assignedTeamId]);
    await writePoamLog(connection, poamId, `${teamName} was automatically added to the Assigned Team List by collection team sync.`, userId);
    await ensureTeamEntry(connection, TEAM_MITIGATION_ENTRY, { poamId, assignedTeamId, teamName, userId });
    await ensureTeamEntry(connection, TEAM_RESOURCE_ENTRY, { poamId, assignedTeamId, teamName, userId });

    return true;
}

async function removeAutomatedTeam(connection, { poamId, assignedTeamId, teamName, userId }) {
    const [result] = await connection.query(`DELETE FROM ${schema()}.poamassignedteams WHERE poamId = ? AND assignedTeamId = ? AND automated = 1`, [
        poamId,
        assignedTeamId,
    ]);

    if (!result || result.affectedRows === 0) {
        return false;
    }

    await writePoamLog(connection, poamId, `${teamName} was automatically removed from the Assigned Team List by collection team sync.`, userId);
    await connection.query(`UPDATE ${schema()}.${TEAM_MITIGATION_ENTRY.table} SET isActive = 0 WHERE poamId = ? AND assignedTeamId = ?`, [
        poamId,
        assignedTeamId,
    ]);
    await connection.query(`UPDATE ${schema()}.${TEAM_RESOURCE_ENTRY.table} SET isActive = 0 WHERE poamId = ? AND assignedTeamId = ?`, [
        poamId,
        assignedTeamId,
    ]);

    return true;
}

const TEAM_MITIGATION_ENTRY = {
    table: 'poamteammitigations',
    idColumn: 'mitigationId',
    textColumn: 'mitigationText',
    createdAction: teamName => `Team Mitigation was created for ${teamName}.`,
};

const TEAM_RESOURCE_ENTRY = {
    table: 'poamteamresources',
    idColumn: 'resourceId',
    textColumn: 'resourceText',
    createdAction: teamName => `Team Resources was created for ${teamName}.`,
};

async function ensureTeamEntry(connection, entry, { poamId, assignedTeamId, teamName, userId }) {
    const [rows] = await connection.query(
        `SELECT ${entry.idColumn}, isActive FROM ${schema()}.${entry.table} WHERE poamId = ? AND assignedTeamId = ? FOR UPDATE`,
        [poamId, assignedTeamId]
    );

    if (rows.length > 0) {
        if (!rows[0].isActive) {
            await connection.query(`UPDATE ${schema()}.${entry.table} SET isActive = 1 WHERE ${entry.idColumn} = ?`, [rows[0][entry.idColumn]]);
        }

        return;
    }

    await connection.query(`INSERT INTO ${schema()}.${entry.table} (poamId, assignedTeamId, ${entry.textColumn}, isActive) VALUES (?, ?, '', 1)`, [
        poamId,
        assignedTeamId,
    ]);
    await writePoamLog(connection, poamId, entry.createdAction(teamName), userId);
}

module.exports.MAX_CHANGES_PER_REQUEST = MAX_CHANGES_PER_REQUEST;
