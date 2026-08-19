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
