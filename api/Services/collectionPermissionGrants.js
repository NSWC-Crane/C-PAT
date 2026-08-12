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
const SmError = require('../utils/error');

const schema = config.database.schema;
const CONVERSION_CHUNK_SIZE = 1000;

function pairKey(userId, collectionId) {
    return `${userId}:${collectionId}`;
}

async function lockDirectPermissionsForUser(connection, userId, collectionIds) {
    if (collectionIds.length === 0) {
        return;
    }

    await connection.query(`SELECT accessLevel FROM ${schema}.collectiondirectpermissions WHERE userId = ? AND collectionId IN (?) FOR UPDATE`, [
        userId,
        collectionIds,
    ]);
}

async function lockDirectPermissionsForCollection(connection, userIds, collectionId) {
    if (userIds.length === 0) {
        return;
    }

    await connection.query(`SELECT accessLevel FROM ${schema}.collectiondirectpermissions WHERE collectionId = ? AND userId IN (?) FOR UPDATE`, [
        collectionId,
        userIds,
    ]);
}

function emptyRevocationPlan() {
    return { removals: [], downgrades: [], unaffected: [] };
}

function emptyGrantPlan() {
    return { additions: [], updates: [], downgrades: [], unchanged: [], excluded: [] };
}

function classifyRevocation(row) {
    const entry = {
        userId: row.userId,
        collectionId: row.collectionId,
        collectionName: row.collectionName,
        currentAccessLevel: row.currentAccessLevel,
    };

    if (row.targetAccessLevel === 0) {
        return { bucket: 'removals', entry };
    }

    if (row.targetAccessLevel < row.currentAccessLevel) {
        return { bucket: 'downgrades', entry: { ...entry, targetAccessLevel: row.targetAccessLevel } };
    }

    return { bucket: 'unaffected', entry };
}

async function recomputeEffectivePermission(connection, userId, collectionId) {
    const [directRows] = await connection.query(
        `SELECT accessLevel FROM ${schema}.collectiondirectpermissions WHERE userId = ? AND collectionId = ? FOR UPDATE`,
        [userId, collectionId]
    );

    const [grantRows] = await connection.query(
        `SELECT accessLevel FROM ${schema}.collectionpermissiongrants WHERE userId = ? AND collectionId = ? FOR UPDATE`,
        [userId, collectionId]
    );

    const effectiveAccessLevel = Math.max(0, ...directRows.map(row => row.accessLevel), ...grantRows.map(row => row.accessLevel));

    if (effectiveAccessLevel === 0) {
        await connection.query(`DELETE FROM ${schema}.collectionpermissions WHERE userId = ? AND collectionId = ?`, [userId, collectionId]);
        return null;
    }

    await connection.query(
        `INSERT INTO ${schema}.collectionpermissions (userId, collectionId, accessLevel)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel)`,
        [userId, collectionId, effectiveAccessLevel]
    );

    return effectiveAccessLevel;
}

async function getTeamFloor(connection, userId, collectionId) {
    const [rows] = await connection.query(
        `SELECT g.accessLevel, t.assignedTeamName
         FROM ${schema}.collectionpermissiongrants g
         INNER JOIN ${schema}.assignedteams t
            ON t.assignedTeamId = g.assignedTeamId
         WHERE g.userId = ? AND g.collectionId = ?
         ORDER BY t.assignedTeamName
         FOR SHARE OF g`,
        [userId, collectionId]
    );

    if (rows.length === 0) {
        return { teamFloor: null, coveringTeams: [] };
    }

    const teamFloor = Math.max(...rows.map(row => row.accessLevel));

    return {
        teamFloor,
        coveringTeams: rows.filter(row => row.accessLevel === teamFloor).map(row => row.assignedTeamName),
    };
}

async function convertGrantChunk(connection, assignedTeamId, departing) {
    const pairPlaceholders = departing.map(() => '(?, ?)').join(', ');
    const pairParams = departing.flatMap(pair => [pair.userId, pair.collectionId]);

    const [directRows] = await connection.query(
        `SELECT userId, collectionId, accessLevel FROM ${schema}.collectiondirectpermissions
         WHERE (userId, collectionId) IN (${pairPlaceholders})
         FOR UPDATE`,
        pairParams
    );

    const [grantRows] = await connection.query(
        `SELECT userId, collectionId, assignedTeamId, accessLevel FROM ${schema}.collectionpermissiongrants
         WHERE (userId, collectionId) IN (${pairPlaceholders})
         FOR UPDATE`,
        pairParams
    );

    const directLevels = new Map(directRows.map(row => [pairKey(row.userId, row.collectionId), row.accessLevel]));
    const departingLevels = new Map();
    const survivingLevels = new Map();

    for (const row of grantRows) {
        const key = pairKey(row.userId, row.collectionId);

        if (Number(row.assignedTeamId) === Number(assignedTeamId)) {
            departingLevels.set(key, row.accessLevel);
        } else {
            survivingLevels.set(key, Math.max(survivingLevels.get(key) ?? 0, row.accessLevel));
        }
    }

    const conversions = [];

    for (const pair of departing) {
        const key = pairKey(pair.userId, pair.collectionId);
        const departingLevel = departingLevels.get(key) ?? 0;
        const retainedLevel = Math.max(directLevels.get(key) ?? 0, survivingLevels.get(key) ?? 0);

        if (departingLevel > retainedLevel) {
            conversions.push([pair.userId, pair.collectionId, departingLevel]);
        }
    }

    if (conversions.length === 0) {
        return;
    }

    await connection.query(
        `INSERT INTO ${schema}.collectiondirectpermissions (userId, collectionId, accessLevel)
         VALUES ?
         ON DUPLICATE KEY UPDATE accessLevel = GREATEST(collectiondirectpermissions.accessLevel, VALUES(accessLevel))`,
        [conversions]
    );
}

async function convertGrantsToDirect(connection, { userId, assignedTeamId, collectionId }) {
    const filters = ['g.assignedTeamId = ?'];
    const params = [assignedTeamId];

    if (userId) {
        filters.push('g.userId = ?');
        params.push(userId);
    }

    if (collectionId) {
        filters.push('g.collectionId = ?');
        params.push(collectionId);
    }

    const [departing] = await connection.query(
        `SELECT g.userId, g.collectionId
         FROM ${schema}.collectionpermissiongrants g
         WHERE ${filters.join(' AND ')}
         ORDER BY g.userId, g.collectionId`,
        params
    );

    for (let offset = 0; offset < departing.length; offset += CONVERSION_CHUNK_SIZE) {
        await convertGrantChunk(connection, assignedTeamId, departing.slice(offset, offset + CONVERSION_CHUNK_SIZE));
    }
}

async function buildGrantPlan(connection, userId, assignedTeamId, accessLevel) {
    const sql = `SELECT atp.collectionId,
                        c.collectionName,
                        cp.accessLevel AS currentAccessLevel,
                        x.userId IS NOT NULL AS isExcluded,
                        GREATEST(
                            COALESCE(d.accessLevel, 0),
                            COALESCE((SELECT MAX(o.accessLevel)
                                      FROM ${schema}.collectionpermissiongrants o
                                      WHERE o.userId = ? AND o.collectionId = atp.collectionId AND o.assignedTeamId <> ?), 0),
                            ?
                        ) AS prospectiveAccessLevel
                 FROM ${schema}.assignedteampermissions atp
                 INNER JOIN ${schema}.collection c
                    ON c.collectionId = atp.collectionId
                 LEFT JOIN ${schema}.collectionpermissions cp
                    ON cp.userId = ? AND cp.collectionId = atp.collectionId
                 LEFT JOIN ${schema}.collectiondirectpermissions d
                    ON d.userId = ? AND d.collectionId = atp.collectionId
                 LEFT JOIN ${schema}.collectiongrantexclusions x
                    ON x.userId = ? AND x.assignedTeamId = ? AND x.collectionId = atp.collectionId
                 WHERE atp.assignedTeamId = ?
                 ORDER BY c.collectionName`;

    const [rows] = await connection.query(sql, [userId, assignedTeamId, accessLevel, userId, userId, userId, assignedTeamId, assignedTeamId]);

    const plan = { additions: [], updates: [], downgrades: [], unchanged: [], excluded: [] };

    for (const row of rows) {
        const entry = { collectionId: row.collectionId, collectionName: row.collectionName };

        if (row.isExcluded) {
            plan.excluded.push({ ...entry, currentAccessLevel: row.currentAccessLevel, wouldGrantAccessLevel: row.prospectiveAccessLevel });
        } else if (row.currentAccessLevel === null) {
            plan.additions.push({ ...entry, accessLevel: row.prospectiveAccessLevel });
        } else if (row.prospectiveAccessLevel > row.currentAccessLevel) {
            plan.updates.push({ ...entry, oldAccessLevel: row.currentAccessLevel, newAccessLevel: row.prospectiveAccessLevel });
        } else if (row.prospectiveAccessLevel < row.currentAccessLevel) {
            plan.downgrades.push({ ...entry, oldAccessLevel: row.currentAccessLevel, newAccessLevel: row.prospectiveAccessLevel });
        } else {
            plan.unchanged.push({ ...entry, accessLevel: row.currentAccessLevel });
        }
    }

    return plan;
}

async function prepareGrantPlan(connection, userId, assignedTeamId, accessLevel, includeCollectionIds) {
    await connection.query(`SELECT collectionId FROM ${schema}.assignedteampermissions WHERE assignedTeamId = ? FOR SHARE`, [assignedTeamId]);

    await clearGrantExclusions(connection, userId, assignedTeamId, includeCollectionIds);

    return await buildGrantPlan(connection, userId, assignedTeamId, accessLevel);
}

async function applyGrantPlan(connection, userId, assignedTeamId, accessLevel, plan) {
    if (accessLevel < 1 || accessLevel > 4) {
        return;
    }

    const collectionIds = [...plan.additions, ...plan.updates, ...plan.downgrades, ...plan.unchanged].map(entry => entry.collectionId);

    if (collectionIds.length === 0) {
        return;
    }

    await lockDirectPermissionsForUser(connection, userId, collectionIds);

    await connection.query(
        `INSERT INTO ${schema}.collectionpermissiongrants (userId, collectionId, assignedTeamId, accessLevel)
         VALUES ?
         ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel)`,
        [collectionIds.map(collectionId => [userId, collectionId, assignedTeamId, accessLevel])]
    );

    await recomputeEffectivePermissionsForUser(connection, userId, collectionIds);
}

async function buildCoverageGrantPlan(connection, assignedTeamId, collectionId) {
    const sql = `SELECT uat.userId,
                        u.fullName,
                        u.userName,
                        uat.accessLevel AS teamAccessLevel,
                        cp.accessLevel AS currentAccessLevel,
                        GREATEST(
                            COALESCE(d.accessLevel, 0),
                            COALESCE((SELECT MAX(o.accessLevel)
                                      FROM ${schema}.collectionpermissiongrants o
                                      WHERE o.userId = uat.userId AND o.collectionId = ? AND o.assignedTeamId <> ?), 0),
                            uat.accessLevel
                        ) AS prospectiveAccessLevel
                 FROM ${schema}.userassignedteams uat
                 INNER JOIN ${schema}.user u
                    ON u.userId = uat.userId
                 LEFT JOIN ${schema}.collectionpermissions cp
                    ON cp.userId = uat.userId AND cp.collectionId = ?
                 LEFT JOIN ${schema}.collectiondirectpermissions d
                    ON d.userId = uat.userId AND d.collectionId = ?
                 WHERE uat.assignedTeamId = ? AND uat.accessLevel BETWEEN 1 AND 4
                 ORDER BY u.fullName, u.userName`;

    const [rows] = await connection.query(sql, [collectionId, assignedTeamId, collectionId, collectionId, assignedTeamId]);

    const plan = { additions: [], updates: [], unchanged: [] };

    for (const row of rows) {
        const entry = {
            userId: row.userId,
            fullName: row.fullName,
            userName: row.userName,
            teamAccessLevel: row.teamAccessLevel,
            currentAccessLevel: row.currentAccessLevel ?? null,
        };

        if (row.currentAccessLevel === null) {
            plan.additions.push({ ...entry, newAccessLevel: row.prospectiveAccessLevel });
        } else if (row.prospectiveAccessLevel > row.currentAccessLevel) {
            plan.updates.push({ ...entry, newAccessLevel: row.prospectiveAccessLevel });
        } else {
            plan.unchanged.push({ ...entry, accessLevel: row.currentAccessLevel });
        }
    }

    return plan;
}

async function prepareCoverageGrantPlan(connection, assignedTeamId, collectionId) {
    await connection.query(`SELECT userId FROM ${schema}.userassignedteams WHERE assignedTeamId = ? FOR SHARE`, [assignedTeamId]);

    return await buildCoverageGrantPlan(connection, assignedTeamId, collectionId);
}

async function recomputeEffectivePermissionsForUser(connection, userId, collectionIds) {
    if (collectionIds.length === 0) {
        return;
    }

    await lockDirectPermissionsForUser(connection, userId, collectionIds);

    await connection.query(`SELECT accessLevel FROM ${schema}.collectionpermissiongrants WHERE userId = ? AND collectionId IN (?) FOR UPDATE`, [
        userId,
        collectionIds,
    ]);

    await connection.query(
        `INSERT INTO ${schema}.collectionpermissions (userId, collectionId, accessLevel)
         SELECT ?, s.collectionId, MAX(s.accessLevel)
         FROM (
            SELECT collectionId, accessLevel FROM ${schema}.collectiondirectpermissions WHERE userId = ? AND collectionId IN (?) AND accessLevel > 0
            UNION ALL
            SELECT collectionId, accessLevel FROM ${schema}.collectionpermissiongrants WHERE userId = ? AND collectionId IN (?) AND accessLevel > 0
         ) s
         GROUP BY s.collectionId
         ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel)`,
        [userId, userId, collectionIds, userId, collectionIds]
    );

    await connection.query(
        `DELETE cp FROM ${schema}.collectionpermissions cp
         WHERE cp.userId = ? AND cp.collectionId IN (?)
           AND NOT EXISTS (SELECT 1 FROM ${schema}.collectiondirectpermissions d WHERE d.userId = cp.userId AND d.collectionId = cp.collectionId AND d.accessLevel > 0)
           AND NOT EXISTS (SELECT 1 FROM ${schema}.collectionpermissiongrants g WHERE g.userId = cp.userId AND g.collectionId = cp.collectionId AND g.accessLevel > 0)`,
        [userId, collectionIds]
    );
}

async function recomputeEffectivePermissionsForCollection(connection, userIds, collectionId) {
    if (userIds.length === 0) {
        return;
    }

    await lockDirectPermissionsForCollection(connection, userIds, collectionId);

    await connection.query(`SELECT accessLevel FROM ${schema}.collectionpermissiongrants WHERE collectionId = ? AND userId IN (?) FOR UPDATE`, [
        collectionId,
        userIds,
    ]);

    await connection.query(
        `INSERT INTO ${schema}.collectionpermissions (userId, collectionId, accessLevel)
         SELECT s.userId, ?, MAX(s.accessLevel)
         FROM (
            SELECT userId, accessLevel FROM ${schema}.collectiondirectpermissions WHERE collectionId = ? AND userId IN (?) AND accessLevel > 0
            UNION ALL
            SELECT userId, accessLevel FROM ${schema}.collectionpermissiongrants WHERE collectionId = ? AND userId IN (?) AND accessLevel > 0
         ) s
         GROUP BY s.userId
         ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel)`,
        [collectionId, collectionId, userIds, collectionId, userIds]
    );

    await connection.query(
        `DELETE cp FROM ${schema}.collectionpermissions cp
         WHERE cp.collectionId = ? AND cp.userId IN (?)
           AND NOT EXISTS (SELECT 1 FROM ${schema}.collectiondirectpermissions d WHERE d.userId = cp.userId AND d.collectionId = cp.collectionId AND d.accessLevel > 0)
           AND NOT EXISTS (SELECT 1 FROM ${schema}.collectionpermissiongrants g WHERE g.userId = cp.userId AND g.collectionId = cp.collectionId AND g.accessLevel > 0)`,
        [collectionId, userIds]
    );
}

async function clearGrantExclusions(connection, userId, assignedTeamId, collectionIds) {
    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
        return;
    }

    await connection.query(`DELETE FROM ${schema}.collectiongrantexclusions WHERE userId = ? AND assignedTeamId = ? AND collectionId IN (?)`, [
        userId,
        assignedTeamId,
        collectionIds.map(Number),
    ]);
}

async function clearCoverageExclusions(connection, assignedTeamId, collectionId) {
    await connection.query(`DELETE FROM ${schema}.collectiongrantexclusions WHERE assignedTeamId = ? AND collectionId = ?`, [assignedTeamId, collectionId]);
}

function assertCoveragePlanMatchesPreview(plan, previewedMembers) {
    const proposals = [...plan.additions, ...plan.updates];

    if (!Array.isArray(previewedMembers)) {
        if (proposals.length === 0) {
            return;
        }

        throw new SmError.ClientError('previewedMembers is required when the team has members whose access would change');
    }

    const previewedByMember = new Map(previewedMembers.map(member => [Number(member.userId), member]));
    const currentByMember = new Map();

    for (const [bucket, entries] of [
        ['additions', plan.additions],
        ['updates', plan.updates],
        ['unchanged', plan.unchanged],
    ]) {
        for (const entry of entries) {
            currentByMember.set(Number(entry.userId), { bucket, teamAccessLevel: entry.teamAccessLevel, newAccessLevel: entry.newAccessLevel });
        }
    }

    const memberDiverged = memberId => {
        const previewed = previewedByMember.get(memberId);
        const current = currentByMember.get(memberId);

        if (!previewed || !current) {
            return true;
        }

        if (previewed.bucket !== current.bucket) {
            return true;
        }

        if (previewed.teamAccessLevel != null && Number(previewed.teamAccessLevel) !== current.teamAccessLevel) {
            return true;
        }

        return previewed.newAccessLevel != null && current.newAccessLevel != null && Number(previewed.newAccessLevel) !== current.newAccessLevel;
    };

    const diverged = [...new Set([...previewedByMember.keys(), ...currentByMember.keys()])].filter(memberDiverged);

    if (diverged.length > 0) {
        throw new SmError.ConflictError(
            `The team's membership or permissions changed since this was previewed, so the choices made no longer describe ${diverged.length} member${diverged.length === 1 ? '' : 's'}. Review the change again before applying it.`
        );
    }
}

async function applyCoverageGrantPlan(connection, assignedTeamId, collectionId, plan, grantUserIds, excludedBy, previewedMembers) {
    assertCoveragePlanMatchesPreview(plan, previewedMembers);

    const selected = new Set((grantUserIds ?? []).map(Number));

    const applied = { additions: [], updates: [] };
    const excluded = [];

    for (const addition of plan.additions) {
        if (selected.has(Number(addition.userId))) {
            applied.additions.push(addition);
        } else {
            excluded.push(addition);
        }
    }

    for (const update of plan.updates) {
        if (selected.has(Number(update.userId))) {
            applied.updates.push(update);
        } else {
            excluded.push(update);
        }
    }

    const grantRows = [...applied.additions, ...applied.updates, ...plan.unchanged].map(entry => [
        entry.userId,
        collectionId,
        assignedTeamId,
        entry.teamAccessLevel,
    ]);

    if (excluded.length > 0) {
        await connection.query(
            `INSERT INTO ${schema}.collectiongrantexclusions (userId, collectionId, assignedTeamId, excludedBy)
             VALUES ?
             ON DUPLICATE KEY UPDATE excludedBy = VALUES(excludedBy)`,
            [excluded.map(entry => [entry.userId, collectionId, assignedTeamId, excludedBy ?? null])]
        );
    }

    if (grantRows.length > 0) {
        await lockDirectPermissionsForCollection(
            connection,
            grantRows.map(row => row[0]),
            collectionId
        );

        await connection.query(
            `INSERT INTO ${schema}.collectionpermissiongrants (userId, collectionId, assignedTeamId, accessLevel)
             VALUES ?
             ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel)`,
            [grantRows]
        );
    }

    await recomputeEffectivePermissionsForCollection(
        connection,
        grantRows.map(row => row[0]),
        collectionId
    );

    return {
        additions: applied.additions.length,
        updates: applied.updates.length,
        unchanged: plan.unchanged.length,
        excluded: excluded.length,
    };
}

async function buildRevocationPlan(connection, userId, assignedTeamId) {
    const sql = `SELECT g.userId,
                        g.collectionId,
                        c.collectionName,
                        cp.accessLevel AS currentAccessLevel,
                        GREATEST(
                            COALESCE(d.accessLevel, 0),
                            COALESCE((SELECT MAX(o.accessLevel)
                                      FROM ${schema}.collectionpermissiongrants o
                                      WHERE o.userId = g.userId AND o.collectionId = g.collectionId AND o.assignedTeamId <> g.assignedTeamId), 0)
                        ) AS targetAccessLevel
                 FROM ${schema}.collectionpermissiongrants g
                 INNER JOIN ${schema}.collection c
                    ON c.collectionId = g.collectionId
                 LEFT JOIN ${schema}.collectionpermissions cp
                    ON cp.userId = g.userId AND cp.collectionId = g.collectionId
                 LEFT JOIN ${schema}.collectiondirectpermissions d
                    ON d.userId = g.userId AND d.collectionId = g.collectionId
                 WHERE g.userId = ? AND g.assignedTeamId = ?
                 ORDER BY c.collectionName`;

    const [rows] = await connection.query(sql, [userId, assignedTeamId]);

    const plan = emptyRevocationPlan();

    for (const row of rows) {
        if (row.currentAccessLevel === null) {
            continue;
        }

        const { bucket, entry } = classifyRevocation(row);
        plan[bucket].push(entry);
    }

    return plan;
}

async function buildCoverageRevocationPlan(connection, assignedTeamId, collectionId) {
    const sql = `SELECT g.userId,
                        g.collectionId,
                        c.collectionName,
                        u.fullName,
                        u.userName,
                        cp.accessLevel AS currentAccessLevel,
                        GREATEST(
                            COALESCE(d.accessLevel, 0),
                            COALESCE((SELECT MAX(o.accessLevel)
                                      FROM ${schema}.collectionpermissiongrants o
                                      WHERE o.userId = g.userId AND o.collectionId = g.collectionId AND o.assignedTeamId <> g.assignedTeamId), 0)
                        ) AS targetAccessLevel
                 FROM ${schema}.collectionpermissiongrants g
                 INNER JOIN ${schema}.collection c
                    ON c.collectionId = g.collectionId
                 INNER JOIN ${schema}.user u
                    ON u.userId = g.userId
                 LEFT JOIN ${schema}.collectionpermissions cp
                    ON cp.userId = g.userId AND cp.collectionId = g.collectionId
                 LEFT JOIN ${schema}.collectiondirectpermissions d
                    ON d.userId = g.userId AND d.collectionId = g.collectionId
                 WHERE g.assignedTeamId = ? AND g.collectionId = ?
                 ORDER BY u.fullName, u.userName`;

    const [rows] = await connection.query(sql, [assignedTeamId, collectionId]);

    const plan = emptyRevocationPlan();

    for (const row of rows) {
        if (row.currentAccessLevel === null) {
            continue;
        }

        const { bucket, entry } = classifyRevocation(row);
        plan[bucket].push({ ...entry, fullName: row.fullName, userName: row.userName });
    }

    return plan;
}

async function grantedCollectionIdsForUser(connection, userId, assignedTeamId) {
    const [rows] = await connection.query(`SELECT DISTINCT collectionId FROM ${schema}.collectionpermissiongrants WHERE userId = ? AND assignedTeamId = ?`, [
        userId,
        assignedTeamId,
    ]);

    return rows.map(row => row.collectionId);
}

async function grantedUserIdsForCoverage(connection, assignedTeamId, collectionId) {
    const [rows] = await connection.query(`SELECT DISTINCT userId FROM ${schema}.collectionpermissiongrants WHERE assignedTeamId = ? AND collectionId = ?`, [
        assignedTeamId,
        collectionId,
    ]);

    return rows.map(row => row.userId);
}

module.exports = {
    emptyRevocationPlan,
    emptyGrantPlan,
    grantedCollectionIdsForUser,
    grantedUserIdsForCoverage,
    recomputeEffectivePermission,
    recomputeEffectivePermissionsForUser,
    recomputeEffectivePermissionsForCollection,
    lockDirectPermissionsForUser,
    lockDirectPermissionsForCollection,
    getTeamFloor,
    convertGrantsToDirect,
    clearCoverageExclusions,
    buildGrantPlan,
    prepareGrantPlan,
    applyGrantPlan,
    buildCoverageGrantPlan,
    prepareCoverageGrantPlan,
    applyCoverageGrantPlan,
    buildRevocationPlan,
    buildCoverageRevocationPlan,
};
