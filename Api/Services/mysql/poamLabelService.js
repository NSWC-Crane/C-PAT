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

exports.getPoamLabels = async function getPoamLabels(collectionId) {
    try {
        if (!collectionId) {
            console.info('getPoamLabels collectionId not provided.');
            throw new Error('Collection ID is required');
        }

        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t2.collectionId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [collectionId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return poamLabels;
        });
    } catch (error) {
        console.error("Error fetching POAM labels: ", error);
        throw error;
    }
}

exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(poamId) {
    try {
        if (!poamId) {
            console.info('getPoamLabelsByPoam poamId not provided.');
            throw new Error('POAM ID is required');
        }

        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [poamId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return poamLabels;
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.getPoamLabelsByLabel = async function getPoamLabelsByLabel(labelId) {
    try {
        if (!labelId) {
            console.info('getPoamLabelByLabel labelId not provided.');
            throw new Error('Label ID is required');
        }

        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabels] = await connection.query(sql, [labelId]);
            var poamLabels = rowPoamLabels.map(row => ({
                poamId: row.poamId,
                labelId: row.labelId,
                labelName: row.labelName,
            }));
            return { poamLabels };
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.getPoamLabel = async function getPoamLabel(poamId, labelId) {
    try {
        if (!poamId || !labelId) {
            console.info('getPoamLabel poamId or labelId not provided.');
            throw new Error('POAM ID and Label ID are required');
        }

        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.poamId, t1.labelId, labelName
                FROM poamtracking.poamlabels t1
                INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.poamId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowPoamLabel] = await connection.query(sql, [poamId, labelId]);
            var poamLabel = rowPoamLabel.length > 0 ? rowPoamLabel[0] : {};
            return { poamLabel };
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.postPoamLabel = async function postPoamLabel(req, res, next) {
    if (!req.body.poamId) {
        console.info('postPoamLabel poamId not provided.');
        throw {
            status: 400,
            errors: {
                poamId: 'is required',
            }
        };
    }

    if (!req.body.labelId) {
        console.info('postPoamLabel labelId not provided.');
        throw {
            status: 400,
            errors: {
                labelId: 'is required',
            }
        };
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
            var poamLabel = rowPoamLabel[0];
            return poamLabel;
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async (connection) => {
                let fetchSql = "SELECT * FROM poamtracking.poamlabels WHERE labelId = ? AND poamId = ?";
                const [existingLabel] = await connection.query(fetchSql, [req.body.labelId, req.body.poamId]);
                return existingLabel[0];
            });
        }
        else {
            console.error("error: ", error);
            throw { status: 500, message: "Unable to create POAM label" };
        }
    }
}

exports.deletePoamLabel = async function deletePoamLabel(req, res, next) {
    if (!req.params.poamId) {
        console.info('deletePoamLabel poamId not provided.');
        throw {
            status: 400,
            errors: {
                poamId: 'is required',
            }
        };
    }

    if (!req.params.labelId) {
        console.info('deletePoamLabel labelId not provided.');
        throw {
            status: 400,
            errors: {
                labelId: 'is required',
            }
        };
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
            return {};
        });
    } catch (error) {
        console.error(error);
        throw { status: 500, message: "Unable to delete POAM label" };
    }
}