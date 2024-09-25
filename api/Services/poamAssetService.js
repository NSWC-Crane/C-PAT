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
const config = require('../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')

async function withConnection(callback) {
	const connection = await dbUtils.pool.getConnection();
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
                SELECT t1.assetId, t2.assetName, t1.poamId
                FROM cpat.poamassets t1
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId
            `;
            let [rowPoamAssets] = await connection.query(sql);
            const poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
            }));
            return { poamAssets };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.assetId, assetName, t1.poamId
                FROM cpat.poamassets t1
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId
                WHERE t1.poamId = ?
            `;
            let [rowPoamAssets] = await connection.query(sql, [req.params.poamId]);
            const poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
            }));
            return poamAssets;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getPoamAssetsByCollectionId = async function getPoamAssetsByCollectionId(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT DISTINCT pa.assetId, a.assetName, pa.poamId
                FROM cpat.poamassets pa
                INNER JOIN cpat.asset a ON pa.assetId = a.assetId
                WHERE a.collectionId = ?
            `;
            let [rowPoamAssets] = await connection.query(sql, [req.params.collectionId]);
            const poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
            }));
            return poamAssets;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deletePoamAssetByPoamId = async function deletePoamAssetByPoamId(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.poamassets WHERE poamId = ?";
            await connection.query(sql, [req.params.poamId]);
            return { poamAsset: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req, res, next) {
    if (!req.params.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId
                FROM cpat.poamassets t1
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId
                WHERE t1.assetId = ?
            `;
            let [rowPoamAssets] = await connection.query(sql, [req.params.assetId]);
            const poamAssets = rowPoamAssets.map(row => ({
                assetId: row.assetId,
                assetName: row.assetName,
                poamId: row.poamId,
            }));
            return { poamAssets };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAssetLabel = async function getAssetLabel(req, res, next) {
    if (!req.params.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            }
        });
    }

    if (!req.params.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.assetId, assetName, t1.labelId, labelName
                FROM cpat.assetlabels t1
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId
                INNER JOIN cpat.label t3 ON t1.labelId = t3.labelId
                WHERE t1.assetId = ? AND t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowAssetLabel] = await connection.query(sql, [req.params.assetId, req.params.labelId]);
            const assetLabel = rowAssetLabel.length > 0 ? [rowAssetLabel[0]] : [];
            return { assetLabel };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.postPoamAsset = async function postPoamAsset(req, res, next) {
    if (!req.body.assetId || !req.body.poamId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.poamassets (assetId, poamId) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.assetId, req.body.poamId]);

            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId
                FROM cpat.poamassets t1
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId
                WHERE t1.poamId = ? AND t1.assetId = ?`;
            let [rowPoamAsset] = await connection.query(sql, [req.body.poamId, req.body.assetId]);
            const poamAsset = rowPoamAsset.length > 0 ? rowPoamAsset[0] : [];

            let assetNameQuery = `SELECT assetName FROM cpat.asset WHERE assetId = ?`;
            let [[assetNameResult]] = await connection.query(assetNameQuery, [req.body.assetId]);
            let assetName = "Unknown Asset";
            if (assetNameResult) {
                assetName = assetNameResult.assetName;
            }
                let action = `${assetName} was added to the Asset List.`;
                let logSql = "INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);
            
            return poamAsset;
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async (connection) => {
                let fetchSql = "SELECT * FROM cpat.poamassets WHERE assetId = ? AND poamId = ?";
                const [existingAsset] = await connection.query(fetchSql, [req.body.assetId, req.body.poamId]);
                return existingAsset[0];
            });
        }
        else {
            return { error: error.message };
        }
    }
};

exports.deletePoamAsset = async function deletePoamAsset(req, res, next) {
    if (!req.params.assetId || !req.params.poamId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.poamassets WHERE assetId = ? AND poamId = ?";
            await connection.query(sql, [req.params.assetId, req.params.poamId]);

                let assetNameQuery = `SELECT assetName FROM cpat.asset WHERE assetId = ?`;
                let [[assetNameResult]] = await connection.query(assetNameQuery, [req.params.assetId]);
                let assetName = "Unknown Asset";
                if (assetNameResult) {
                    assetName = assetNameResult.assetName;
                }
                    let action = `${assetName} was removed from the Asset List.`;
                    let logSql = "INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

            return { poamAsset: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
};