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
const config = require('../../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')

async function withConnection(callback) {
    const pool = dbUtils.getPool();
	const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamLabels = async function getPoamLabels(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getPoamLabels collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t2.collectionId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [req.params.collectionId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return { poamLabels };
        });
    } catch (error) {
        console.error("Error fetching POAM labels: ", error);
        return { "null": "Unable to fetch POAM labels" };
    }
}

exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamLabelByPoam poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [req.params.poamId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            console.log(rowPoamLabels);
            console.log(poamLabels);
            return { poamLabels };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getPoamLabelsByLabel = async function getPoamLabelsByLabel(req, res, next) {
    if (!req.params.labelId) {
        console.info('getPoamLabelByLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [req.params.labelId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return { poamLabels };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getPoamLabel = async function getPoamLabel(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamLabel poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    if (!req.params.labelId) {
        console.info('getPoamLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabel] = await connection.query(sql, [req.params.poamId, req.params.labelId]);
            var poamLabel = rowPoamLabel.length > 0 ? [rowPoamLabel[0]] : [];
            return { poamLabel };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.postPoamLabel = async function postPoamLabel(req, res, next) {
    if (!req.body.poamId) {
        console.info('postPoamLabel poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    if (!req.body.labelId) {
        console.info('postPoamLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO poamtracking.poamlabels (poamId, labelId) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.poamId, req.body.labelId]);

            if (req.body.poamLog[0].userId) {
            let labelSql = "SELECT labelName FROM poamtracking.label WHERE labelId = ?";
            const [label] = await connection.query(labelSql, [req.body.labelId]);
                const labelName = label[0] ? label[0].labelName : "Unknown Label";

            let action = `"${labelName}" label was added to the POAM.`;
            let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
            await connection.query(logSql, [req.body.poamId, action, req.body.poamLog[0].userId]);
        }
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabel] = await connection.query(sql, [req.body.poamId, req.body.labelId]);
            var poamLabel = [rowPoamLabel[0]];
            return { poamLabel };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.deletePoamLabel = async function deletePoamLabel(req, res, next) {
    if (!req.params.poamId) {
        console.info('deletePoamLabel poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    if (!req.params.labelId) {
        console.info('deletePoamLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.poamlabels WHERE poamId = ? AND labelId = ?";
            await connection.query(sql, [req.params.poamId, req.params.labelId]);

            if (req.body.requestorId) {
            let labelSql = "SELECT labelName FROM poamtracking.label WHERE labelId = ?";
            const [label] = await connection.query(labelSql, [req.params.labelId]);
            const labelName = label[0] ? label[0].labelName : "Unknown Label";

            let action = `"${labelName}" label was removed from the POAM.`;
            let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
            await connection.query(logSql, [req.params.poamId, action, req.body.requestorId]);
        }
            return { poamLabel: [] };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}