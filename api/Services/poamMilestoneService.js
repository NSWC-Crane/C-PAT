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

function normalizeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

exports.getPoamMilestones = async function getPoamMilestones(poamId) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `SELECT pm.*, at.assignedTeamName
                       FROM ${config.database.schema}.poammilestones pm
                       LEFT JOIN ${config.database.schema}.assignedteams at ON pm.assignedTeamId = at.assignedTeamId
                       WHERE pm.poamId = ?;`;
            let [rows] = await connection.query(sql, [poamId]);
            const poamMilestones = rows.map(row => ({ ...row }));
            return poamMilestones;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoamMilestone = async function postPoamMilestone(poamId, req) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        }

        if (req.body.milestoneDate) {
            req.body.milestoneDate = normalizeDate(req.body.milestoneDate);
        } else {
            req.body.milestoneDate = null;
        }
        if (req.body.milestoneChangeDate) {
            req.body.milestoneChangeDate = normalizeDate(req.body.milestoneChangeDate);
        } else {
            req.body.milestoneChangeDate = null;
        }
        if (!req.body.milestoneComments) req.body.milestoneComments = null;
        if (!req.body.milestoneChangeComments) req.body.milestoneChangeComments = null;
        if (!req.body.milestoneStatus) req.body.milestoneStatus = null;
        if (!req.body.assignedTeamId) req.body.assignedTeamId = null;
        return await withConnection(async connection => {
            let sql_query = `INSERT INTO ${config.database.schema}.poamMilestones (poamId, milestoneDate, milestoneComments, milestoneChangeComments, milestoneChangeDate, milestoneStatus, assignedTeamId) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            await connection.query(sql_query, [
                poamId,
                req.body.milestoneDate,
                req.body.milestoneComments,
                req.body.milestoneChangeComments,
                req.body.milestoneChangeDate,
                req.body.milestoneStatus,
                req.body.assignedTeamId,
            ]);

            let sql = `SELECT * FROM ${config.database.schema}.poamMilestones WHERE poamId = ?`;
            let [rows] = await connection.query(sql, [poamId]);

            const poamMilestone = rows.map(row => ({ ...row }));

            if (req.body.milestoneChangeComments) {
                let userId = req.userObject.userId;
                let action = `POAM Milestone Change Entered.<br>
Milestone Date: ${normalizeDate(req.body.milestoneChangeDate)}<br>
Milestone Comment: ${req.body.milestoneChangeComments}`;

                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            } else {
                let userId = req.userObject.userId;
                let action = `POAM Milestone Created.<br>
Milestone Date: ${normalizeDate(req.body.milestoneDate)}<br>
Milestone Comment: ${req.body.milestoneComments}`;

                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return poamMilestone;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putPoamMilestone = async function putPoamMilestone(poamId, milestoneId, req) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        } else if (!milestoneId) {
            return next({
                status: 400,
                errors: {
                    milestoneId: 'is required',
                },
            });
        }

        if (req.body.milestoneDate) {
            req.body.milestoneDate = normalizeDate(req.body.milestoneDate);
        } else {
            req.body.milestoneDate = null;
        }
        if (req.body.milestoneChangeDate) {
            req.body.milestoneChangeDate = normalizeDate(req.body.milestoneChangeDate);
        } else {
            req.body.milestoneChangeDate = null;
        }
        if (!req.body.milestoneComments) req.body.milestoneComments = null;
        if (!req.body.milestoneChangeComments) req.body.milestoneChangeComments = null;
        if (!req.body.milestoneStatus) req.body.milestoneStatus = null;
        if (!req.body.assignedTeamId) req.body.assignedTeamId = null;

        return await withConnection(async connection => {
            let getMilestoneSql = `SELECT * FROM ${config.database.schema}.poammilestones WHERE poamId = ? AND milestoneId = ?`;
            let [existingMilestone] = await connection.query(getMilestoneSql, [poamId, milestoneId]);

            let sql_query = `UPDATE ${config.database.schema}.poammilestones SET milestoneDate = ?, milestoneComments = ?, milestoneChangeDate = ?, milestoneChangeComments = ?, milestoneStatus = ?, assignedTeamId = ? WHERE poamId = ? AND milestoneId = ?`;
            await connection.query(sql_query, [
                req.body.milestoneDate,
                req.body.milestoneComments,
                req.body.milestoneChangeDate,
                req.body.milestoneChangeComments,
                req.body.milestoneStatus,
                req.body.assignedTeamId,
                poamId,
                milestoneId,
            ]);

            sql_query = `SELECT * FROM ${config.database.schema}.poamMilestones WHERE poamId = ?;`;
            let [rows] = await connection.query(sql_query, [poamId]);

            const poamMilestone = rows.map(row => ({ ...row }));

            let userId = req.userObject.userId;
            let actionParts = ['POAM Milestone Updated.'];

            if (normalizeDate(existingMilestone[0].milestoneDate) !== normalizeDate(req.body.milestoneDate)) {
                actionParts.push(`Previous Milestone Date: ${normalizeDate(existingMilestone[0].milestoneDate)}<br>
New Milestone Date: ${normalizeDate(req.body.milestoneChangeDate)}`);
            }

            if (existingMilestone[0].milestoneComments !== req.body.milestoneComments) {
                actionParts.push(`Previous Milestone Comment: ${existingMilestone[0].milestoneComments}<br>
New Milestone Comment: ${req.body.milestoneChangeComments}`);
            }

            if (existingMilestone[0].milestoneStatus !== req.body.milestoneStatus) {
                actionParts.push(`Previous Milestone Status: ${existingMilestone[0].milestoneStatus}<br>
New Milestone Status: ${req.body.milestoneStatus}`);
            }

            let action = actionParts.join('<br>');

            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [poamId, action, userId]);

            return poamMilestone;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deletePoamMilestone = async function deletePoamMilestone(poamId, milestoneId, req) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                },
            });
        } else if (!milestoneId) {
            return next({
                status: 400,
                errors: {
                    milestoneId: 'is required',
                },
            });
        }

        return await withConnection(async connection => {
            let sql = `DELETE FROM ${config.database.schema}.poammilestones WHERE poamId= ? AND milestoneId = ?`;
            await connection.query(sql, [poamId, milestoneId]);

            let action = `Milestone Deleted.`;
            if (req.body.extension === true) {
                action = `Extension milestone deleted.`;
            } else {
                action = `POAM milestone deleted.`;
            }
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [poamId, action, req.userObject.userId]);
            return {};
        });
    } catch (error) {
        return { error: error.message };
    }
};
