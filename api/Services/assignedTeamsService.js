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

function requireAdmin(req) {
    if (req.userObject?.isAdmin !== true) {
        throw new SmError.PrivilegeError('Administrator privileges are required');
    }
}

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

module.exports.getAssignedTeams = async function getAssignedTeams() {
    return await withConnection(async connection => {
        let sql = `
            SELECT
                t.assignedTeamId,
                t.assignedTeamName,
                t.adTeam,
                GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
            FROM ${config.database.schema}.assignedteams t
            LEFT JOIN ${config.database.schema}.assignedteampermissions p
                ON t.assignedTeamId = p.assignedTeamId
            LEFT JOIN ${config.database.schema}.collection c
                ON p.collectionId = c.collectionId
            GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
        `;
        let [rowAssignedTeams] = await connection.query(sql);
        const assignedTeams = rowAssignedTeams.map(row => ({
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            adTeam: row.adTeam,
            permissions: row.collectionData
                ? row.collectionData.split(',').map(data => {
                      const [id, name] = data.split(':');
                      return {
                          collectionId: Number.parseInt(id),
                          collectionName: name || '',
                      };
                  })
                : [],
        }));
        return assignedTeams;
    });
};

module.exports.getAssignedTeam = async function getAssignedTeam(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT
                t.assignedTeamId,
                t.assignedTeamName,
                t.adTeam,
                GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
            FROM ${config.database.schema}.assignedteams t
            LEFT JOIN ${config.database.schema}.assignedteampermissions p
                ON t.assignedTeamId = p.assignedTeamId
            LEFT JOIN ${config.database.schema}.collection c
                ON p.collectionId = c.collectionId
            WHERE t.assignedTeamId = ?
            GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
        `;
        let [rowAssignedTeam] = await connection.query(sql, [req.params.assignedTeamId]);

        if (rowAssignedTeam.length === 0) {
            throw new SmError.NotFoundError('Assigned Team not found');
        }

        const row = rowAssignedTeam[0];
        return {
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            adTeam: row.adTeam,
            permissions: row.collectionData
                ? row.collectionData.split(',').map(data => {
                      const [id, name] = data.split(':');
                      return {
                          collectionId: Number.parseInt(id),
                          collectionName: name || '',
                      };
                  })
                : [],
        };
    });
};

module.exports.postAssignedTeam = async function postAssignedTeam(req) {
    requireAdmin(req);

    return await dbUtils.retryOnDeadlock(
        async () =>
            await withConnection(async connection => {
                let sql_query = `INSERT INTO ${config.database.schema}.assignedteams (assignedTeamName, adTeam) VALUES (?, ?)`;
                const [result] = await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam]);

                const assignedTeam = {
                    assignedTeamId: result.insertId,
                    assignedTeamName: req.body.assignedTeamName,
                    adTeam: req.body.adTeam,
                };
                return assignedTeam;
            })
    );
};

module.exports.putAssignedTeam = async function putAssignedTeam(req) {
    requireAdmin(req);

    return await dbUtils.retryOnDeadlock(
        async () =>
            await withConnection(async connection => {
                let sql_query = `UPDATE ${config.database.schema}.assignedteams SET assignedTeamName = ?, adTeam = ? WHERE assignedTeamId = ?`;
                const [result] = await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam, req.body.assignedTeamId]);

                if (result.affectedRows === 0) {
                    throw new SmError.NotFoundError('Assigned Team not found');
                }

                const assignedTeam = {
                    assignedTeamId: req.body.assignedTeamId,
                    assignedTeamName: req.body.assignedTeamName,
                    adTeam: req.body.adTeam,
                };
                return assignedTeam;
            })
    );
};

module.exports.deleteAssignedTeam = async function deleteAssignedTeam(req) {
    requireAdmin(req);

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                await connection.query(`SELECT assignedTeamId FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ? FOR UPDATE`, [
                    req.params.assignedTeamId,
                ]);

                await connection.query(`SELECT userId FROM ${config.database.schema}.userassignedteams WHERE assignedTeamId = ? FOR UPDATE`, [
                    req.params.assignedTeamId,
                ]);

                await connection.query(`SELECT collectionId FROM ${config.database.schema}.assignedteampermissions WHERE assignedTeamId = ? FOR UPDATE`, [
                    req.params.assignedTeamId,
                ]);

                await grants.convertGrantsToDirect(connection, { assignedTeamId: req.params.assignedTeamId });

                let sql = `DELETE FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
                await connection.query(sql, [req.params.assignedTeamId]);

                return { assignedTeam: [] };
            })
    );
};

module.exports.postAssignedTeamPermission = async function postAssignedTeamPermission(req) {
    requireAdmin(req);

    const { assignedTeamId, collectionId } = req.body;
    const grantUserIds = Array.isArray(req.body.grantUserIds) ? req.body.grantUserIds : [];
    const previewedMembers = Array.isArray(req.body.previewedMembers) ? req.body.previewedMembers : undefined;

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                const [teamRows] = await connection.query(
                    `SELECT assignedTeamId FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ? FOR SHARE`,
                    [assignedTeamId]
                );

                if (teamRows.length === 0) {
                    throw new SmError.NotFoundError('Assigned Team not found');
                }

                const plan = await grants.prepareCoverageGrantPlan(connection, assignedTeamId, collectionId);

                let sql = `
            INSERT INTO ${config.database.schema}.assignedteampermissions
            (assignedTeamId, collectionId)
            VALUES (?, ?)
        `;

                try {
                    await connection.query(sql, [assignedTeamId, collectionId]);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        throw new SmError.ConflictError(
                            'This team already covers that collection, likely added by another administrator while the change was being previewed. Nothing was applied; review the coverage again.'
                        );
                    }

                    throw error;
                }

                const granted = await grants.applyCoverageGrantPlan(
                    connection,
                    assignedTeamId,
                    collectionId,
                    plan,
                    grantUserIds,
                    req.userObject?.userId ?? null,
                    previewedMembers
                );

                return {
                    assignedTeamId,
                    collectionId,
                    granted,
                    permissionChanges: plan,
                };
            })
    );
};

module.exports.getCoverageGrantPreview = async function getCoverageGrantPreview(req) {
    requireAdmin(req);

    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    return await withConnection(async connection => await grants.buildCoverageGrantPlan(connection, req.params.assignedTeamId, req.params.collectionId));
};

module.exports.getCoverageRevocationPreview = async function getCoverageRevocationPreview(req) {
    requireAdmin(req);

    if (!req.params.assignedTeamId) {
        throw new SmError.ClientError('assignedTeamId is required');
    }

    if (!req.params.collectionId) {
        throw new SmError.ClientError('collectionId is required');
    }

    return await withConnection(async connection => await grants.buildCoverageRevocationPlan(connection, req.params.assignedTeamId, req.params.collectionId));
};

module.exports.deleteAssignedTeamPermission = async function deleteAssignedTeamPermission(req) {
    requireAdmin(req);

    const { assignedTeamId, collectionId } = req.params;
    const revokePermissions = req.query.revokePermissions === true || req.query.revokePermissions === 'true';

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                const [coverage] = await connection.query(
                    `SELECT collectionId FROM ${config.database.schema}.assignedteampermissions WHERE assignedTeamId = ? AND collectionId = ? FOR UPDATE`,
                    [assignedTeamId, collectionId]
                );

                if (coverage.length === 0) {
                    throw new SmError.NotFoundError('Permission not found');
                }

                await grants.clearCoverageExclusions(connection, assignedTeamId, collectionId);

                const plan = revokePermissions
                    ? await grants.buildCoverageRevocationPlan(connection, assignedTeamId, collectionId)
                    : grants.emptyRevocationPlan();
                const affectedUserIds = revokePermissions ? await grants.grantedUserIdsForCoverage(connection, assignedTeamId, collectionId) : [];

                if (revokePermissions) {
                    await grants.lockDirectPermissionsForCollection(connection, affectedUserIds, collectionId);
                } else {
                    await grants.convertGrantsToDirect(connection, { assignedTeamId, collectionId });
                }

                await connection.query(`DELETE FROM ${config.database.schema}.collectionpermissiongrants WHERE assignedTeamId = ? AND collectionId = ?`, [
                    assignedTeamId,
                    collectionId,
                ]);

                let sql = `
            DELETE FROM ${config.database.schema}.assignedteampermissions
            WHERE assignedTeamId = ? AND collectionId = ?
        `;

                const [result] = await connection.query(sql, [assignedTeamId, collectionId]);

                if (result.affectedRows === 0) {
                    throw new SmError.NotFoundError('Permission not found');
                }

                if (revokePermissions) {
                    await grants.recomputeEffectivePermissionsForCollection(connection, affectedUserIds, collectionId);
                }

                return { success: true, revoked: revokePermissions, permissionChanges: plan };
            })
    );
};
