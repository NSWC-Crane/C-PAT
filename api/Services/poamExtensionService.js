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

async function withConnection(callback) {
	const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

exports.getPoamExtension = async function (poamId) {
    return withConnection(async (connection) => {
        let sql = `SELECT poamId, extensionTimeAllowed, extensionJustification, scheduledCompletionDate FROM ${config.database.schema}.poam WHERE poamId = ?`;
        let [poamExtensions] = await connection.query(sql, [poamId]);
        return poamExtensions;
    });
};

exports.putPoamExtension = async function (req, res, next) {
    return withConnection(async (connection) => {
        try {
            let sql = `UPDATE ${config.database.schema}.poam SET
                extensionTimeAllowed = ?,
                extensionJustification = ?,
                mitigations = ?,
                requiredResources = ?,
                residualRisk = ?,
                likelihood = ?,
                localImpact = ?,
                impactDescription = ?,
                status = ?
                WHERE poamId = ?`;

            const params = [
                req.body.extensionTimeAllowed,
                req.body.extensionJustification,
                req.body.mitigations,
                req.body.requiredResources,
                req.body.residualRisk,
                req.body.likelihood,
                req.body.localImpact,
                req.body.impactDescription,
                req.body.status,
                req.body.poamId
            ];
            const [result] = await connection.query(sql, params);

                let action = `POAM Updated. Status: ${req.body.status}`;
                if (req.body.extensionTimeAllowed > 0) {
                    let scheduledCompletionDateQuery = `SELECT scheduledCompletionDate FROM ${config.database.schema}.poam WHERE poamId = ?`;
                    let [[scheduledCompletionDateResult]] = await connection.query(scheduledCompletionDateQuery, [req.body.poamId]);
                    if (scheduledCompletionDateResult) {
                        let scheduledCompletionDate = new Date(scheduledCompletionDateResult.scheduledCompletionDate);
                        let deadlineWithExtension = new Date(scheduledCompletionDate.getTime() + req.body.extensionTimeAllowed * 24 * 60 * 60 * 1000);
                        let formattedDeadline = deadlineWithExtension.toLocaleDateString("en-US");
                        action += `<br>Extension time requested: ${req.body.extensionTimeAllowed} days<br>Extension Justification: ${req.body.extensionJustification}<br>Deadline with Extension: ${formattedDeadline}`;
                    }
                }
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            return result;
        } catch (error) {
            return { error: error.message };
        }
    });
};

exports.deletePoamExtension = async function ({ poamId }) {
    return withConnection(async (connection) => {
        let sql = `UPDATE ${config.database.schema}.poam SET extensionTimeAllowed = NULL, extensionJustification = NULL WHERE poamId = ?`;
        await connection.query(sql, [poamId]);
    });
};