/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and ExtensionMilestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
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

exports.getPoamExtensionMilestones = async function getPoamExtensionMilestones(poamId) {
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
            let sql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql, [poamId]);
            const poamExtensionMilestones = rows.map(row => ({ ...row }));
            return { poamExtensionMilestones };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoamExtensionMilestone = async function postPoamExtensionMilestone(poamId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        }

        requestBody.extensionMilestoneDate = normalizeDate(requestBody.extensionMilestoneDate);
        if (!requestBody.extensionMilestoneComments) requestBody.extensionMilestoneComments = null;
        if (!requestBody.extensionMilestoneStatus) requestBody.extensionMilestoneStatus = null;

        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.poamExtensionMilestones (poamId, extensionMilestoneDate, extensionMilestoneComments, extensionMilestoneStatus) VALUES (?, ?, ?, ?)`;
            await connection.query(sql_query, [
                poamId,
                requestBody.extensionMilestoneDate,
                requestBody.extensionMilestoneComments,
                requestBody.extensionMilestoneStatus,
            ]);

            let sql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?";
            let [rows] = await connection.query(sql, [poamId]);

            const poamExtensionMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let action = `POAM extensionMilestone Created.<br>
ExtensionMilestone Date: ${normalizeDate(requestBody.extensionMilestoneDate)}<br>
ExtensionMilestone Comment: ${requestBody.extensionMilestoneComments}`;

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamExtensionMilestone };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putPoamExtensionMilestone = async function putPoamExtensionMilestone(poamId, extensionMilestoneId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        } else if (!extensionMilestoneId) {
            return next({
                status: 400,
                errors: {
                    extensionMilestoneId: 'is required',
                }
            });
        }
        requestBody.extensionMilestoneDate = normalizeDate(requestBody.extensionMilestoneDate);
        if (!requestBody.extensionMilestoneComments) requestBody.extensionMilestoneComments = null;
        if (!requestBody.extensionMilestoneStatus) requestBody.extensionMilestoneStatus = null;

        return await withConnection(async (connection) => {
            let getExtensionMilestoneSql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ? AND extensionMilestoneId = ?";
            let [existingExtensionMilestone] = await connection.query(getExtensionMilestoneSql, [poamId, extensionMilestoneId]);

            let sql_query = `UPDATE cpat.poamExtensionMilestones SET extensionMilestoneDate = ?, extensionMilestoneComments = ?, extensionMilestoneStatus = ? WHERE poamId = ? AND extensionMilestoneId = ?`;
            await connection.query(sql_query, [
                requestBody.extensionMilestoneDate,
                requestBody.extensionMilestoneComments,
                requestBody.extensionMilestoneStatus,
                poamId,
                extensionMilestoneId,
            ]);

            sql_query = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql_query, [poamId]);

            const poamExtensionMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let actionParts = ["POAM ExtensionMilestone Updated."];

                if (normalizeDate(existingExtensionMilestone[0].extensionMilestoneDate) !== normalizeDate(requestBody.extensionMilestoneDate)) {
                    actionParts.push(`Previous ExtensionMilestone Date: ${normalizeDate(existingExtensionMilestone[0].extensionMilestoneDate)}<br>
New ExtensionMilestone Date: ${normalizeDate(requestBody.extensionMilestoneDate)}`);
                }

                if (existingExtensionMilestone[0].extensionMilestoneComments !== requestBody.extensionMilestoneComments) {
                    actionParts.push(`Previous ExtensionMilestone Comment: ${existingExtensionMilestone[0].extensionMilestoneComments}<br>
New ExtensionMilestone Comment: ${requestBody.extensionMilestoneComments}`);
                }

                if (existingExtensionMilestone[0].extensionMilestoneStatus !== requestBody.extensionMilestoneStatus) {
                    actionParts.push(`Previous ExtensionMilestone Status: ${existingExtensionMilestone[0].extensionMilestoneStatus}<br>
New ExtensionMilestone Status: ${requestBody.extensionMilestoneStatus}`);
                }

                let action = actionParts.join("<br>");

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamExtensionMilestone };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deletePoamExtensionMilestone = async function deletePoamExtensionMilestone(poamId, extensionMilestoneId, requestBody) {
    try {
        if (!poamId) {
            return next({
                status: 400,
                errors: {
                    poamId: 'is required',
                }
            });
        } else if (!extensionMilestoneId) {
            return next({
                status: 400,
                errors: {
                    extensionMilestoneId: 'is required',
                }
            });
        }

        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.poamExtensionMilestones WHERE poamId= ? AND extensionMilestoneId = ?";
            await connection.query(sql, [poamId, extensionMilestoneId]);

            let action = `ExtensionMilestone Deleted.`;
            if (requestBody.requestorId) {
                if (requestBody.extension == true) {
                    action = `Extension ExtensionMilestone deleted.`;
                }
                else {
                    action = `POAM ExtensionMilestone deleted.`;
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