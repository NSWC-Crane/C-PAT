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

async function withTransaction(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        await connection.beginTransaction();
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } finally {
        connection.release();
    }
}

function requireElevation(elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }
}

function requireAccessLevel(value) {
    const accessLevel = Number.parseInt(value, 10);

    if (!Number.isInteger(accessLevel) || accessLevel < 1 || accessLevel > 4) {
        throw new SmError.ClientError('accessLevel must be an integer between 1 and 4');
    }

    return accessLevel;
}

module.exports.getTeamAssignments = async function getTeamAssignments(req) {
    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    return await withConnection(async connection => {
        let sql = `SELECT T1.*, T2.fullName, T2.userName, T2.email FROM ${config.database.schema}.userassignedteams T1
                   INNER JOIN ${config.database.schema}.user T2 ON t1.userId = t2.userId WHERE assignedTeamId = ?;`;

        let [rowAssignedTeams] = await connection.query(sql, [req.params.assignedTeamId]);
        return rowAssignedTeams.map(assignedTeam => ({
            ...assignedTeam,
        }));
    });
};

module.exports.getGrantPreview = async function getGrantPreview(_userId, elevate, req) {
    if (!req.params.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    requireElevation(elevate, req);

    const accessLevel = requireAccessLevel(req.query.accessLevel);

    return await withConnection(async connection => await grants.buildGrantPlan(connection, req.params.userId, req.params.assignedTeamId, accessLevel));
};

module.exports.getRevocationPreview = async function getRevocationPreview(_userId, elevate, req) {
    if (!req.params.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    requireElevation(elevate, req);

    return await withConnection(async connection => await grants.buildRevocationPlan(connection, req.params.userId, req.params.assignedTeamId));
};

module.exports.postTeamAssignment = async function postTeamAssignment(_userId, elevate, req) {
    if (!req.body.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.body.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    const accessLevel = requireAccessLevel(req.body.accessLevel);

    requireElevation(elevate, req);

    const { userId, assignedTeamId } = req.body;
    const includeCollectionIds = Array.isArray(req.body.includeCollectionIds) ? req.body.includeCollectionIds : [];

    return await dbUtils.retryOnDeadlock(
        async () =>
            await withTransaction(async connection => {
                const [teamRows] = await connection.query(
                    `SELECT assignedTeamId FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ? FOR SHARE`,
                    [assignedTeamId]
                );

                if (teamRows.length === 0) {
                    throw new SmError.NotFoundError('Assigned Team not found');
                }

                const [existingRows] = await connection.query(
                    `SELECT accessLevel FROM ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ? FOR UPDATE`,
                    [userId, assignedTeamId]
                );

                const created = existingRows.length === 0;
                const effectiveAccessLevel = created ? accessLevel : existingRows[0].accessLevel;

                if (created) {
                    await connection.query(`INSERT INTO ${config.database.schema}.userassignedteams (accessLevel, userId, assignedTeamId) VALUES (?, ?, ?)`, [
                        accessLevel,
                        userId,
                        assignedTeamId,
                    ]);
                }

                if (effectiveAccessLevel < 1 || effectiveAccessLevel > 4) {
                    return {
                        userId,
                        assignedTeamId,
                        accessLevel: effectiveAccessLevel,
                        created,
                        permissionChanges: grants.emptyGrantPlan(),
                    };
                }

                const plan = await grants.prepareGrantPlan(connection, userId, assignedTeamId, effectiveAccessLevel, includeCollectionIds);
                await grants.applyGrantPlan(connection, userId, assignedTeamId, effectiveAccessLevel, plan);

                return {
                    userId,
                    assignedTeamId,
                    accessLevel: effectiveAccessLevel,
                    created,
                    permissionChanges: plan,
                };
            })
    );
};

module.exports.putTeamAssignment = async function putTeamAssignment(_userId, elevate, req) {
    if (!req.body.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.body.oldAssignedTeamId) {
        throw new SmError.ClientError('oldAssignedTeamId is required');
    }

    if (req.body.newAssignedTeamId !== undefined) {
        throw new SmError.ClientError('newAssignedTeamId is no longer supported; remove the assignment and add one for the new team instead');
    }

    const requestedAccessLevel = req.body.accessLevel === undefined ? null : requireAccessLevel(req.body.accessLevel);

    requireElevation(elevate, req);

    const { userId, oldAssignedTeamId: assignedTeamId } = req.body;
    const includeCollectionIds = Array.isArray(req.body.includeCollectionIds) ? req.body.includeCollectionIds : [];

    return await dbUtils.retryOnDeadlock(
        async () =>
            await withTransaction(async connection => {
                const [result] = await connection.query(
                    `UPDATE ${config.database.schema}.userassignedteams SET accessLevel = COALESCE(?, accessLevel) WHERE userId = ? AND assignedTeamId = ?`,
                    [requestedAccessLevel, userId, assignedTeamId]
                );

                if (result.affectedRows === 0) {
                    throw new SmError.NotFoundError('Team assignment not found');
                }

                const [storedRows] = await connection.query(
                    `SELECT accessLevel FROM ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ? FOR UPDATE`,
                    [userId, assignedTeamId]
                );

                const accessLevel = storedRows[0].accessLevel;

                if (accessLevel < 1 || accessLevel > 4) {
                    return {
                        userId,
                        assignedTeamId,
                        accessLevel,
                        permissionChanges: grants.emptyGrantPlan(),
                    };
                }

                const plan = await grants.prepareGrantPlan(connection, userId, assignedTeamId, accessLevel, includeCollectionIds);
                await grants.applyGrantPlan(connection, userId, assignedTeamId, accessLevel, plan);

                return {
                    userId,
                    assignedTeamId,
                    accessLevel,
                    permissionChanges: plan,
                };
            })
    );
};

module.exports.deleteTeamAssignment = async function deleteTeamAssignment(_userId, elevate, req) {
    if (!req.params.userId) {
        throw new SmError.ClientError('userId is required');
    }

    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    requireElevation(elevate, req);

    const { userId, assignedTeamId } = req.params;
    const revokePermissions = req.query.revokePermissions === true || req.query.revokePermissions === 'true';

    return await dbUtils.retryOnDeadlock(
        async () =>
            await withTransaction(async connection => {
                await connection.query(
                    `SELECT accessLevel FROM ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ? FOR UPDATE`,
                    [userId, assignedTeamId]
                );

                const plan = revokePermissions ? await grants.buildRevocationPlan(connection, userId, assignedTeamId) : grants.emptyRevocationPlan();
                const affectedCollectionIds = revokePermissions ? await grants.grantedCollectionIdsForUser(connection, userId, assignedTeamId) : [];

                if (revokePermissions) {
                    await grants.lockDirectPermissionsForUser(connection, userId, affectedCollectionIds);
                } else {
                    await grants.convertGrantsToDirect(connection, { userId, assignedTeamId });
                }

                await connection.query(`DELETE FROM ${config.database.schema}.collectionpermissiongrants WHERE userId = ? AND assignedTeamId = ?`, [
                    userId,
                    assignedTeamId,
                ]);
                await connection.query(`DELETE FROM ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ?`, [
                    userId,
                    assignedTeamId,
                ]);

                if (revokePermissions) {
                    await grants.recomputeEffectivePermissionsForUser(connection, userId, affectedCollectionIds);
                }

                return { revoked: revokePermissions, permissionChanges: plan };
            })
    );
};
