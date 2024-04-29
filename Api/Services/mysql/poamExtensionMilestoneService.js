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
const config = require('../../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');

async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
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
            console.info("getPoamExtensionMilestones poamId not provided.");
            throw new Error('POAM ID is required');
        }

        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql, [poamId]);
            var poamExtensionMilestones = rows.map(row => ({ ...row }));
            return { poamExtensionMilestones };
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
};

exports.postPoamExtensionMilestone = async function postPoamExtensionMilestone(poamId, requestBody) {
    try {
        if (!poamId) {
            console.info("postPoamExtensionMilestone poamId not provided.");
            throw {
                status: 400,
                errors: {
                    poamId: "is required",
                },
            };
        }

        requestBody.ExtensionMilestoneDate = normalizeDate(requestBody.ExtensionMilestoneDate);
        if (!requestBody.ExtensionMilestoneComments) requestBody.ExtensionMilestoneComments = null;
        if (!requestBody.ExtensionMilestoneStatus) requestBody.ExtensionMilestoneStatus = null;

        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.poamExtensionMilestones (poamId, ExtensionMilestoneDate, ExtensionMilestoneComments, ExtensionMilestoneStatus) VALUES (?, ?, ?, ?)`;
            await connection.query(sql_query, [
                poamId,
                requestBody.ExtensionMilestoneDate,
                requestBody.ExtensionMilestoneComments,
                requestBody.ExtensionMilestoneStatus,
            ]);

            let sql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?";
            let [rows] = await connection.query(sql, [poamId]);

            var poamExtensionMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let action = `POAM ExtensionMilestone Created.<br>
ExtensionMilestone Date: ${normalizeDate(requestBody.ExtensionMilestoneDate)}<br>
ExtensionMilestone Comment: ${requestBody.ExtensionMilestoneComments}`;

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamExtensionMilestone };
        });
    } catch (error) {
        console.error("error: ", error);
        throw error;
    }
};

exports.putPoamExtensionMilestone = async function putPoamExtensionMilestone(poamId, ExtensionMilestoneId, requestBody) {
    try {
        if (!poamId) {
            console.info("putPoamExtensionMilestone poamId not provided.");
            throw {
                status: 400,
                errors: {
                    poamId: "is required",
                },
            };
        }

        if (!ExtensionMilestoneId) {
            console.info("putCollectionExtensionMilestone ExtensionMilestoneId not provided.");
            throw {
                status: 400,
                errors: {
                    ExtensionMilestoneId: "is required",
                },
            };
        }

        requestBody.ExtensionMilestoneDate = normalizeDate(requestBody.ExtensionMilestoneDate);
        if (!requestBody.ExtensionMilestoneComments) requestBody.ExtensionMilestoneComments = null;
        if (!requestBody.ExtensionMilestoneStatus) requestBody.ExtensionMilestoneStatus = null;

        return await withConnection(async (connection) => {
            let getExtensionMilestoneSql = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ? AND ExtensionMilestoneId = ?";
            let [existingExtensionMilestone] = await connection.query(getExtensionMilestoneSql, [poamId, ExtensionMilestoneId]);

            let sql_query = `UPDATE cpat.poamExtensionMilestones SET ExtensionMilestoneDate = ?, ExtensionMilestoneComments = ?, ExtensionMilestoneStatus = ? WHERE poamId = ? AND ExtensionMilestoneId = ?`;
            await connection.query(sql_query, [
                requestBody.ExtensionMilestoneDate,
                requestBody.ExtensionMilestoneComments,
                requestBody.ExtensionMilestoneStatus,
                poamId,
                ExtensionMilestoneId,
            ]);

            sql_query = "SELECT * FROM cpat.poamExtensionMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql_query, [poamId]);

            var poamExtensionMilestone = rows.map(row => ({ ...row }));

            if (requestBody.poamLog && requestBody.poamLog.length > 0) {
                let userId = requestBody.poamLog[0].userId;
                let actionParts = ["POAM ExtensionMilestone Updated."];

                if (normalizeDate(existingExtensionMilestone[0].ExtensionMilestoneDate) !== normalizeDate(requestBody.ExtensionMilestoneDate)) {
                    actionParts.push(`Previous ExtensionMilestone Date: ${normalizeDate(existingExtensionMilestone[0].ExtensionMilestoneDate)}<br>
New ExtensionMilestone Date: ${normalizeDate(requestBody.ExtensionMilestoneDate)}`);
                }

                if (existingExtensionMilestone[0].ExtensionMilestoneComments !== requestBody.ExtensionMilestoneComments) {
                    actionParts.push(`Previous ExtensionMilestone Comment: ${existingExtensionMilestone[0].ExtensionMilestoneComments}<br>
New ExtensionMilestone Comment: ${requestBody.ExtensionMilestoneComments}`);
                }

                if (existingExtensionMilestone[0].ExtensionMilestoneStatus !== requestBody.ExtensionMilestoneStatus) {
                    actionParts.push(`Previous ExtensionMilestone Status: ${existingExtensionMilestone[0].ExtensionMilestoneStatus}<br>
New ExtensionMilestone Status: ${requestBody.ExtensionMilestoneStatus}`);
                }

                let action = actionParts.join("<br>");

                let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, action, userId]);
            }
            return { poamExtensionMilestone };
        });
    } catch (error) {
        console.error("error: ", error);
        throw error;
    }
};

exports.deletePoamExtensionMilestone = async function deletePoamExtensionMilestone(poamId, ExtensionMilestoneId, requestBody) {
    try {
        if (!poamId) {
            console.info("deleteCollectionExtensionMilestone poamId not provided.");
            throw {
                status: 400,
                errors: {
                    poamId: "is required",
                },
            };
        }

        if (!ExtensionMilestoneId) {
            console.info("deleteCollectionExtensionMilestone ExtensionMilestoneId not provided.");
            throw {
                status: 400,
                errors: {
                    ExtensionMilestoneId: "is required",
                },
            };
        }

        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.poamExtensionMilestones WHERE poamId= ? AND ExtensionMilestoneId = ?";
            await connection.query(sql, [poamId, ExtensionMilestoneId]);

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
        console.error("error: ", error);
        throw error;
    }
};