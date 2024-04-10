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

exports.getPoamMilestones = async function getPoamMilestones(req, res, next) {
    if (!req.params.poamId) {
        console.info("getPoamMilestones poamId not provided.");
        return next({
            status: 422,
            errors: {
                poamId: "is required",
            },
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.poammilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql, [req.params.poamId]);
            var poamMilestones = rows.map(row => ({ ...row }));
            return { poamMilestones };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
};

exports.postPoamMilestone = async function postPoamMilestone(req, res, next) {
    if (!req.params.poamId) {
        console.info("postPoamMilestone poamId not provided.");
        return next({
            status: 422,
            errors: {
                poamId: "is required",
            },
        });
    }

    req.body.milestoneDate = normalizeDate(req.body.milestoneDate);
    if (!req.body.milestoneComments) req.body.milestoneComments = null;
    if (!req.body.milestoneStatus) req.body.milestoneStatus = null;

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO poamtracking.poamMilestones (poamId, milestoneDate, milestoneComments, milestoneStatus) VALUES (?, ?, ?, ?)`;
            await connection.query(sql_query, [
                req.params.poamId,
                req.body.milestoneDate,
                req.body.milestoneComments,
                req.body.milestoneStatus,
            ]);

            let sql = "SELECT * FROM poamtracking.poamMilestones WHERE poamId = ?";
            let [rows] = await connection.query(sql, [req.params.poamId]);

            var poamMilestone = rows.map(row => ({ ...row }));

            if (req.body.poamLog && req.body.poamLog.length > 0) {
                let userId = req.body.poamLog[0].userId;
                let action = `POAM Milestone Created.<br>
Milestone Date: ${normalizeDate(req.body.milestoneDate)}<br>
Milestone Comment: ${req.body.milestoneComments}`;

                let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.params.poamId, action, userId]);
            }
            console.log("poamMilestone: ", poamMilestone);
            return { poamMilestone };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
};

exports.putPoamMilestone = async function putPoamMilestone(req, res, next) {
    if (!req.params.poamId) {
        console.info("putPoamMilestone poamId not provided.");
        return next({
            status: 422,
            errors: {
                poamId: "is required",
            },
        });
    }

    if (!req.params.milestoneId) {
        console.info("putCollectionMilestone milestoneId not provided.");
        return next({
            status: 422,
            errors: {
                userId: "is required",
            },
        });
    }

    req.body.milestoneDate = normalizeDate(req.body.milestoneDate);
    if (!req.body.milestoneComments) req.body.milestoneComments = null;
    if (!req.body.milestoneStatus) req.body.milestoneStatus = null;

    try {
        return await withConnection(async (connection) => {
            let getMilestoneSql = "SELECT * FROM poamtracking.poammilestones WHERE poamId = ? AND milestoneId = ?";
            let [existingMilestone] = await connection.query(getMilestoneSql, [req.params.poamId, req.params.milestoneId]);

            let sql_query = `UPDATE poamtracking.poammilestones SET milestoneDate = ?, milestoneComments = ?, milestoneStatus = ? WHERE poamId = ? AND milestoneId = ?`;
            await connection.query(sql_query, [
                req.body.milestoneDate,
                req.body.milestoneComments,
                req.body.milestoneStatus,
                req.params.poamId,
                req.params.milestoneId,
            ]);

            sql_query = "SELECT * FROM poamtracking.poamMilestones WHERE poamId = ?;";
            let [rows] = await connection.query(sql_query, [req.params.poamId]);

            var poamMilestone = rows.map(row => ({ ...row }));

            if (req.body.poamLog && req.body.poamLog.length > 0) {
                let userId = req.body.poamLog[0].userId;
                let actionParts = ["POAM Milestone Updated."];

                if (normalizeDate(existingMilestone[0].milestoneDate) !== normalizeDate(req.body.milestoneDate)) {
                    actionParts.push(`Previous Milestone Date: ${normalizeDate(existingMilestone[0].milestoneDate)}<br>
New Milestone Date: ${normalizeDate(req.body.milestoneDate)}`);
                }

                if (existingMilestone[0].milestoneComments !== req.body.milestoneComments) {
                    actionParts.push(`Previous Milestone Comment: ${existingMilestone[0].milestoneComments}<br>
New Milestone Comment: ${req.body.milestoneComments}`);
                }

                if (existingMilestone[0].milestoneStatus !== req.body.milestoneStatus) {
                    actionParts.push(`Previous Milestone Status: ${existingMilestone[0].milestoneStatus}<br>
New Milestone Status: ${req.body.milestoneStatus}`);
                }

                let action = actionParts.join("<br>");

                let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.params.poamId, action, userId]);
            }
            console.log("poamMilestone: ", poamMilestone);
            return { poamMilestone };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
};
exports.deletePoamMilestone = async function deletePoamMilestone(req, res, next) {
    if (!req.params.poamId) {
        console.info("deleteCollectionMilestone poamId not provided.");
        return next({
            status: 422,
            errors: {
                poamId: "is required",
            },
        });
    }

    if (!req.params.milestoneId) {
        console.info("deleteCollectionMilestone milestoneId not provided.");
        return next({
            status: 422,
            errors: {
                milestoneId: "is required",
            },
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.poammilestones WHERE poamId= ? AND milestoneId = ?";
            await connection.query(sql, [req.params.poamId, req.params.milestoneId]);

            let action = `Milestone Deleted.`;
            if (req.body.requestorId) {
                if (req.body.extension == true) {
                    action = `Extension milestone deleted.`;
                }
                else {
                    action = `POAM milestone deleted.`;
                }
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.params.poamId, action, req.body.requestorId]);
            }
            return { delete: "Success" };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
};