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
const mysql = require('mysql2');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getTeamAssignments = async function getTeamAssignments(req, res, next) {
    if (!req.params.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    }

    try {
        const assignedTeams = await withConnection(async (connection) => {
            let sql = `SELECT T1.*, T2.fullName, T2.userName, T2.email FROM ${config.database.schema}.userassignedteams T1
                       INNER JOIN ${config.database.schema}.user T2 ON t1.userId = t2.userId WHERE assignedTeamId = ?;`;

            let [rowAssignedTeams] = await connection.query(sql, [req.params.assignedTeamId]);
            return rowAssignedTeams.map(assignedTeam => ({
                ...assignedTeam
            }));
        });

        return assignedTeams;
    } catch (error) {
        return {
            error: error.message
        };
    }
}

exports.postTeamAssignment = async function postTeamAssignment(userId, elevate, req) {
    if (!req.body.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                oldAssignedTeamId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql_query = `INSERT INTO ${config.database.schema}.userassignedteams (accessLevel, userId, assignedTeamId) VALUES (?, ?, ?);`;
                await connection.query(sql_query, [req.body.accessLevel, req.body.userId, req.body.assignedTeamId]);

                const message = {
                    userId: req.body.userId,
                    assignedTeamId: req.body.assignedTeamId,
                    accessLevel: req.body.accessLevel,
                };
                return message;

            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async (connection) => {
                let fetchSql = `SELECT * FROM ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ?`;
                const [existingAssignedTeam] = await connection.query(fetchSql, [req.body.userId, req.body.assignedTeamId]);
                return existingAssignedTeam[0];
            });
        } else {
            return {
                error: error.message
            };
        }
    }
};

exports.putTeamAssignment = async function putTeamAssignment(userId, elevate, req) {
    if (!req.body.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.oldAssignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql_query = `UPDATE ${config.database.schema}.userassignedteams SET assignedTeamId = ?, accessLevel = ? WHERE userId = ? AND assignedTeamId = ?;`;
                await connection.query(sql_query, [req.body.newAssignedTeamId, req.body.accessLevel, req.body.userId, req.body.oldAssignedTeamId]);

                const message = {
                    userId: req.body.userId,
                    assignedTeamId: req.body.newAssignedTeamId,
                    accessLevel: req.body.accessLevel,
                };
                return message;
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return {
            error: error.message
        };
    }
};

exports.deleteTeamAssignment = async function deleteTeamAssignment(userId, elevate, req) {
    if (!req.params.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql = `DELETE FROM  ${config.database.schema}.userassignedteams WHERE userId = ? AND assignedTeamId = ?`;
                await connection.query(sql, [req.params.userId, req.params.assignedTeamId]);

                return {
                    assignedTeams: []
                };
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return {
            error: error.message
        };
    }
};