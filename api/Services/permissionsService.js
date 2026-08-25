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
const grants = require('./collectionPermissionGrants');
const poamAccess = require('./poamAccess');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

function requireAccessLevel(value) {
    const accessLevel = Number.parseInt(value, 10);

    if (!Number.isInteger(accessLevel) || accessLevel < 1 || accessLevel > 4) {
        throw new SmError.ClientError('accessLevel must be an integer between 1 and 4');
    }

    return accessLevel;
}

module.exports.getCollectionPermissions = async function getCollectionPermissions(req) {
    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    return await withConnection(async connection => {
        await poamAccess.assertCollectionAccessLevel(
            connection,
            req,
            req.params.collectionId,
            poamAccess.READ_ACCESS_LEVEL,
            'Access to this collection is required'
        );

        let sql = `SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.email
                   FROM ${config.database.schema}.collectionpermissions T1
                   INNER JOIN ${config.database.schema}.user T2 ON T1.userId = T2.userId
                   WHERE collectionId = ?;`;

        let [rowPermissions] = await connection.query(sql, [req.params.collectionId]);
        return rowPermissions.map(permission => ({
            ...permission,
        }));
    });
};

module.exports.getCollectionPermissionDetail = async function getCollectionPermissionDetail(elevate, req) {
    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    const collectionId = req.params.collectionId;

    return await dbUtils.withTransaction(async connection => {
        const effectiveSql = `SELECT T1.userId, T1.accessLevel, T2.firstName, T2.lastName, T2.fullName, T2.email
                              FROM ${config.database.schema}.collectionpermissions T1
                              INNER JOIN ${config.database.schema}.user T2 ON T1.userId = T2.userId
                              WHERE T1.collectionId = ?`;
        const directSql = `SELECT d.userId, d.accessLevel, d.grantedAt, d.grantedBy, gb.fullName AS grantedByName
                           FROM ${config.database.schema}.collectiondirectpermissions d
                           LEFT JOIN ${config.database.schema}.user gb ON gb.userId = d.grantedBy
                           WHERE d.collectionId = ?`;
        const grantsSql = `SELECT g.userId, g.assignedTeamId, g.accessLevel, g.grantedAt, t.assignedTeamName
                           FROM ${config.database.schema}.collectionpermissiongrants g
                           INNER JOIN ${config.database.schema}.assignedteams t ON t.assignedTeamId = g.assignedTeamId
                           WHERE g.collectionId = ?
                           ORDER BY t.assignedTeamName`;
        const exclusionsSql = `SELECT x.userId, x.assignedTeamId, x.excludedAt, t.assignedTeamName
                               FROM ${config.database.schema}.collectiongrantexclusions x
                               INNER JOIN ${config.database.schema}.assignedteams t ON t.assignedTeamId = x.assignedTeamId
                               WHERE x.collectionId = ?
                               ORDER BY t.assignedTeamName`;

        const [effectiveRows] = await connection.query(effectiveSql, [collectionId]);
        const [directRows] = await connection.query(directSql, [collectionId]);
        const [grantRows] = await connection.query(grantsSql, [collectionId]);
        const [exclusionRows] = await connection.query(exclusionsSql, [collectionId]);

        const numericCollectionId = Number(collectionId);
        const directByUser = new Map(directRows.map(row => [row.userId, row]));
        const grantsByUser = new Map();
        for (const row of grantRows) {
            const list = grantsByUser.get(row.userId) ?? [];
            list.push({
                collectionId: numericCollectionId,
                assignedTeamId: row.assignedTeamId,
                assignedTeamName: row.assignedTeamName,
                accessLevel: row.accessLevel,
                grantedAt: row.grantedAt,
            });
            grantsByUser.set(row.userId, list);
        }
        const exclusionsByUser = new Map();
        for (const row of exclusionRows) {
            const list = exclusionsByUser.get(row.userId) ?? [];
            list.push({
                collectionId: numericCollectionId,
                assignedTeamId: row.assignedTeamId,
                assignedTeamName: row.assignedTeamName,
                excludedAt: row.excludedAt,
            });
            exclusionsByUser.set(row.userId, list);
        }

        return effectiveRows.map(row => {
            const direct = directByUser.get(row.userId);
            return {
                userId: row.userId,
                accessLevel: row.accessLevel,
                firstName: row.firstName,
                lastName: row.lastName,
                fullName: row.fullName,
                email: row.email,
                direct: direct
                    ? { accessLevel: direct.accessLevel, grantedAt: direct.grantedAt, grantedBy: direct.grantedBy, grantedByName: direct.grantedByName }
                    : null,
                teamGrants: grantsByUser.get(row.userId) ?? [],
                exclusions: exclusionsByUser.get(row.userId) ?? [],
            };
        });
    });
};

module.exports.postPermission = async function postPermission(_userId, elevate, req) {
    if (!req.body.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.body.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    const accessLevel = requireAccessLevel(req.body.accessLevel);

    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    const { userId, collectionId } = req.body;

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                await connection.query(
                    `INSERT INTO ${config.database.schema}.collectiondirectpermissions (userId, collectionId, accessLevel, grantedBy)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel), grantedBy = VALUES(grantedBy)`,
                    [userId, collectionId, accessLevel, req.userObject.userId]
                );

                const effectiveAccessLevel = await grants.recomputeEffectivePermission(connection, userId, collectionId);
                const { teamFloor, coveringTeams } = await grants.getTeamFloor(connection, userId, collectionId);

                return {
                    userId,
                    collectionId,
                    accessLevel,
                    effectiveAccessLevel,
                    teamFloor,
                    coveringTeams,
                };
            })
    );
};

module.exports.putPermission = async function putPermission(_userId, elevate, req) {
    if (!req.body.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.body.oldCollectionId) {
        throw new SmError.ClientError('oldCollectionId is required');
    }

    if (req.body.newCollectionId !== undefined) {
        throw new SmError.ClientError('newCollectionId is no longer supported; delete the permission and create one on the new collection instead');
    }

    const accessLevel = requireAccessLevel(req.body.accessLevel);

    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    const { userId, oldCollectionId: collectionId } = req.body;

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                const [existing] = await connection.query(
                    `SELECT accessLevel FROM ${config.database.schema}.collectionpermissions WHERE userId = ? AND collectionId = ?`,
                    [userId, collectionId]
                );

                if (existing.length === 0) {
                    throw new SmError.NotFoundError('Permission not found');
                }

                await connection.query(
                    `INSERT INTO ${config.database.schema}.collectiondirectpermissions (userId, collectionId, accessLevel, grantedBy)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE accessLevel = VALUES(accessLevel), grantedBy = VALUES(grantedBy)`,
                    [userId, collectionId, accessLevel, req.userObject.userId]
                );

                const effectiveAccessLevel = await grants.recomputeEffectivePermission(connection, userId, collectionId);
                const { teamFloor, coveringTeams } = await grants.getTeamFloor(connection, userId, collectionId);

                return {
                    userId,
                    collectionId,
                    accessLevel,
                    effectiveAccessLevel,
                    teamFloor,
                    coveringTeams,
                };
            })
    );
};

module.exports.deletePermission = async function deletePermission(_userId, elevate, req) {
    if (!req.params.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    const { userId, collectionId } = req.params;

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                await connection.query(`DELETE FROM ${config.database.schema}.collectiondirectpermissions WHERE userId = ? AND collectionId = ?`, [
                    userId,
                    collectionId,
                ]);

                const effectiveAccessLevel = await grants.recomputeEffectivePermission(connection, userId, collectionId);
                const { teamFloor, coveringTeams } = await grants.getTeamFloor(connection, userId, collectionId);

                return {
                    userId: Number(userId),
                    collectionId: Number(collectionId),
                    removed: effectiveAccessLevel === null,
                    effectiveAccessLevel,
                    teamFloor,
                    coveringTeams,
                };
            })
    );
};
