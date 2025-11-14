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

exports.getPoamExtension = async function (poamId) {
    return withConnection(async connection => {
        let sql = `SELECT poamId, extensionDays, extensionDeadline, extensionJustification, scheduledCompletionDate FROM ${config.database.schema}.poam WHERE poamId = ?`;
        let [poamExtensions] = await connection.query(sql, [poamId]);
        return poamExtensions;
    });
};

exports.putPoamExtension = async function (req, res, next) {
    return withConnection(async connection => {
        try {
            let sql = `UPDATE ${config.database.schema}.poam SET
                extensionDays = ?,
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
                req.body.extensionDays,
                req.body.extensionJustification,
                req.body.mitigations,
                req.body.requiredResources,
                req.body.residualRisk,
                req.body.likelihood,
                req.body.localImpact,
                req.body.impactDescription,
                req.body.status,
                req.body.poamId,
            ];
            await connection.query(sql, params);

            let action = `POAM Updated. Status: ${req.body.status}`;
            if (req.body.extensionDays > 0) {
                let extensionDeadlineQuery = `SELECT extensionDeadline FROM ${config.database.schema}.poam WHERE poamId = ?`;
                let [[extensionDeadlineResult]] = await connection.query(extensionDeadlineQuery, [req.body.poamId]);
                if (extensionDeadlineResult) {
                    let extensionDeadline = new Date(extensionDeadlineResult.extensionDeadline);
                    let formattedDeadline = extensionDeadline.toLocaleDateString('en-US');
                    action += `<br>Extension time requested: ${req.body.extensionDays} days<br>Extension Justification: ${req.body.extensionJustification}<br>Deadline with Extension: ${formattedDeadline}`;
                }
            }
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            const selectSql = `SELECT 
                poamId,
                extensionDays,
                extensionJustification,
                mitigations,
                requiredResources,
                residualRisk,
                likelihood,
                localImpact,
                impactDescription,
                status
                FROM ${config.database.schema}.poam 
                WHERE poamId = ?`;

            const [[updatedPoam]] = await connection.query(selectSql, [req.body.poamId]);

            return updatedPoam;
        } catch (error) {
            return { error: error.message };
        }
    });
};

exports.deletePoamExtension = async function (poamId) {
    return withConnection(async connection => {
        let sql = `UPDATE ${config.database.schema}.poam SET extensionDays = 0, extensionJustification = NULL WHERE poamId = ?`;
        await connection.query(sql, [poamId]);
    });
};
