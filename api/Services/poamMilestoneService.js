/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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
                }
            });
        }

        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.poammilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql, [poamId]);
            const poamMilestones = rows.map(row => ({ ...row }));
            return { poamMilestones };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoamMilestone = async function postPoamMilestone(poamId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        }

        requestBody.milestoneDate = normalizeDate(requestBody.milestoneDate);
        if (!requestBody.milestoneComments) requestBody.milestoneComments = null;
        if (!requestBody.milestoneStatus) requestBody.milestoneStatus = null;

        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.poamMilestones (poamId, milestoneDate, milestoneComments, milestoneStatus) VALUES (?, ?, ?, ?)`;
            await connection.query(sql_query, [
                poamId,
                requestBody.milestoneDate,
                requestBody.milestoneComments,
                requestBody.milestoneStatus,
            ]);

            let sql = "SELECT * FROM cpat.poamMilestones WHERE poamId = ?";
            let [rows] = await connection.query(sql, [poamId]);

            const poamMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let action = `POAM Milestone Created.<br>
Milestone Date: ${normalizeDate(requestBody.milestoneDate)}<br>
Milestone Comment: ${requestBody.milestoneComments}`;

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamMilestone };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putPoamMilestone = async function putPoamMilestone(poamId, milestoneId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        } else if (!milestoneId) {
            return next({
                status: 400,
                errors: {
                    milestoneId: 'is required',
                }
            });
        }

        requestBody.milestoneDate = normalizeDate(requestBody.milestoneDate);
        if (!requestBody.milestoneComments) requestBody.milestoneComments = null;
        if (!requestBody.milestoneStatus) requestBody.milestoneStatus = null;

        return await withConnection(async (connection) => {
            let getMilestoneSql = "SELECT * FROM cpat.poammilestones WHERE poamId = ? AND milestoneId = ?";
            let [existingMilestone] = await connection.query(getMilestoneSql, [poamId, milestoneId]);

            let sql_query = `UPDATE cpat.poammilestones SET milestoneDate = ?, milestoneComments = ?, milestoneStatus = ? WHERE poamId = ? AND milestoneId = ?`;
            await connection.query(sql_query, [
                requestBody.milestoneDate,
                requestBody.milestoneComments,
                requestBody.milestoneStatus,
                poamId,
                milestoneId,
            ]);

            sql_query = "SELECT * FROM cpat.poamMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql_query, [poamId]);

            const poamMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let actionParts = ["POAM Milestone Updated."];

                if (normalizeDate(existingMilestone[0].milestoneDate) !== normalizeDate(requestBody.milestoneDate)) {
                    actionParts.push(`Previous Milestone Date: ${normalizeDate(existingMilestone[0].milestoneDate)}<br>
New Milestone Date: ${normalizeDate(requestBody.milestoneDate)}`);
                }

                if (existingMilestone[0].milestoneComments !== requestBody.milestoneComments) {
                    actionParts.push(`Previous Milestone Comment: ${existingMilestone[0].milestoneComments}<br>
New Milestone Comment: ${requestBody.milestoneComments}`);
                }

                if (existingMilestone[0].milestoneStatus !== requestBody.milestoneStatus) {
                    actionParts.push(`Previous Milestone Status: ${existingMilestone[0].milestoneStatus}<br>
New Milestone Status: ${requestBody.milestoneStatus}`);
                }

                let action = actionParts.join("<br>");

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamMilestone };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deletePoamMilestone = async function deletePoamMilestone(poamId, milestoneId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        } else if (!milestoneId) {
            return next({
                status: 400,
                errors: {
                    milestoneId: 'is required',
                }
            });
        }

        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.poammilestones WHERE poamId= ? AND milestoneId = ?";
            await connection.query(sql, [poamId, milestoneId]);

            const action = `Milestone Deleted.`;
            if (requestBody.requestorId) {
                if (requestBody.extension == true) {
                    action = `Extension milestone deleted.`;
                }
                else {
                    action = `POAM milestone deleted.`;
                }
                let logSql = "INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [poamId, action, requestBody.requestorId]);
            }
            return {};
        });
    } catch (error) {
        return { error: error.message };
    }
};