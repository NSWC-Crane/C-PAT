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

exports.getPoamAssets = async function getPoamAssets(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId, t3.description
                FROM poamtracking.poamassets t1
                INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                ORDER BY t3.description
            `;
            let [rowPoamAssets] = await connection.query(sql);
            var poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssets };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamAssetsByPoamIs poamId not provided.');
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
                SELECT t1.assetId, assetName, t1.poamId, t3.description
                FROM poamtracking.poamassets t1
                INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.poamId = ?
                ORDER BY t3.description
            `;
            let [rowPoamAssets] = await connection.query(sql, [req.params.poamId]);
            var poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssets };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.deletePoamAssetByPoamId = async function deletePoamAssetByPoamId(req, res, next) {
    if (!req.params.poamId) {
        console.info('deletePoamAssetByPoamId poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.poamassets WHERE poamId = ?";
            await connection.query(sql, [req.params.poamId]);
            return { poamAsset: [] };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req, res, next) {
    if (!req.params.assetId) {
        console.info('getPoamAssetsByAssetId assetId not provided.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId, t3.description
                FROM poamtracking.poamassets t1
                INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.assetId = ?
                ORDER BY t3.description
            `;
            let [rowPoamAssets] = await connection.query(sql, [req.params.assetId]);
            var poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssets };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getAssetLabel = async function getAssetLabel(req, res, next) {
    if (!req.params.assetId) {
        console.info('getAssetLabel assetId not provided.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
            }
        });
    }

    if (!req.params.labelId) {
        console.info('getAssetLabel labelId not provided.');
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
                SELECT t1.assetId, assetName, t1.labelId, labelName
                FROM poamtracking.assetlabels t1
                INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId
                WHERE t1.assetId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowAssetLabel] = await connection.query(sql, [req.params.assetId, req.params.labelId]);
            var assetLabel = rowAssetLabel.length > 0 ? [rowAssetLabel[0]] : [];
            return { assetLabel };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.postPoamAsset = async function postPoamAsset(req, res, next) {
    if (!req.body.assetId || !req.body.poamId) {
        console.info('postPoamAsset: assetId and poamId are required.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO poamtracking.poamassets (assetId, poamId) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.assetId, req.body.poamId]);

            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId, t3.description
                FROM poamtracking.poamassets t1
                INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.poamId = ? AND t1.assetId = ?
                ORDER BY t3.description`;
            let [rowPoamAsset] = await connection.query(sql, [req.body.poamId, req.body.assetId]);
            var poamAsset = rowPoamAsset.length > 0 ? [rowPoamAsset[0]] : [];
            if (req.body.poamLog[0].userId) {
            let assetNameQuery = `SELECT assetName FROM poamtracking.asset WHERE assetId = ?`;
            let [[assetNameResult]] = await connection.query(assetNameQuery, [req.body.assetId]);
            let assetName = "Unknown Asset";
            if (assetNameResult) {
                assetName = assetNameResult.assetName;
            }
                let action = `${assetName} was added to the Asset List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.body.poamId, action, req.body.poamLog[0].userId]);
            }

            return { poamAsset };
        });
    } catch (error) {
        console.error("Error in postPoamAsset:", error);
        return { null: "null" };
    }
};

exports.deletePoamAsset = async function deletePoamAsset(req, res, next) {
    if (!req.params.assetId || !req.params.poamId) {
        console.info('deletePoamAsset: assetId and poamId are required.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.poamassets WHERE assetId = ? AND poamId = ?";
            await connection.query(sql, [req.params.assetId, req.params.poamId]);

            if (req.body.requestorId) {
                let assetNameQuery = `SELECT assetName FROM poamtracking.asset WHERE assetId = ?`;
                let [[assetNameResult]] = await connection.query(assetNameQuery, [req.params.assetId]);
                let assetName = "Unknown Asset";
                if (assetNameResult) {
                    assetName = assetNameResult.assetName;
                }
                    let action = `${assetName} was removed from the Asset List.`;
                    let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.params.poamId, action, req.body.requestorId]);
            }
            return { poamAsset: [] };
        });
    } catch (error) {
        console.error("Error in deletePoamAsset:", error);
        return { null: "null" };
    }
};