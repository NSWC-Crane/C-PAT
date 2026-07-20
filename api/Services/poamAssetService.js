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

exports.getPoamAssets = async function getPoamAssets() {
    return await withConnection(async connection => {
        let sql = `
            SELECT t1.assetId, t2.assetName, t1.poamId
            FROM ${config.database.schema}.poamassets t1
            INNER JOIN ${config.database.schema}.asset t2 ON t1.assetId = t2.assetId
        `;
        let [rowPoamAssets] = await connection.query(sql);
        const poamAssets = rowPoamAssets.map(row => ({
            assetId: row.assetId,
            assetName: row.assetName,
            poamId: row.poamId,
        }));
        return poamAssets;
    });
};

exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT t1.assetId, assetName, t1.poamId
            FROM ${config.database.schema}.poamassets t1
            INNER JOIN ${config.database.schema}.asset t2 ON t1.assetId = t2.assetId
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
};

exports.getPoamAssetsByCollectionId = async function getPoamAssetsByCollectionId(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT DISTINCT pa.assetId, a.assetName, pa.poamId
            FROM ${config.database.schema}.poamassets pa
            INNER JOIN ${config.database.schema}.asset a ON pa.assetId = a.assetId
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
};

exports.deletePoamAssetByPoamId = async function deletePoamAssetByPoamId(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.poamassets WHERE poamId = ?`;
        await connection.query(sql, [req.params.poamId]);
        return { poamAsset: [] };
    });
};

exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT t1.assetId, t2.assetName, t1.poamId
            FROM ${config.database.schema}.poamassets t1
            INNER JOIN ${config.database.schema}.asset t2 ON t1.assetId = t2.assetId
            WHERE t1.assetId = ?
        `;
        let [rowPoamAssets] = await connection.query(sql, [req.params.assetId]);
        const poamAssets = rowPoamAssets.map(row => ({
            assetId: row.assetId,
            assetName: row.assetName,
            poamId: row.poamId,
        }));
        return poamAssets;
    });
};

exports.postPoamAsset = async function postPoamAsset(req) {
    try {
        return await withConnection(async connection => {
            let sql_query = `INSERT INTO ${config.database.schema}.poamassets (assetId, poamId) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.assetId, req.body.poamId]);

            let sql = `
                SELECT t1.assetId, t2.assetName, t1.poamId
                FROM ${config.database.schema}.poamassets t1
                INNER JOIN ${config.database.schema}.asset t2 ON t1.assetId = t2.assetId
                WHERE t1.poamId = ? AND t1.assetId = ?`;
            let [rowPoamAsset] = await connection.query(sql, [req.body.poamId, req.body.assetId]);
            const poamAsset = rowPoamAsset.length > 0 ? rowPoamAsset[0] : [];

            let assetNameQuery = `SELECT assetName FROM ${config.database.schema}.asset WHERE assetId = ?`;
            let [[assetNameResult]] = await connection.query(assetNameQuery, [req.body.assetId]);
            let assetName = 'Unknown Asset';
            if (assetNameResult) {
                assetName = assetNameResult.assetName;
            }
            let action = `${assetName} was added to the Asset List.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            return poamAsset;
        });
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            throw error;
        }
        return await withConnection(async connection => {
            let fetchSql = `SELECT * FROM ${config.database.schema}.poamassets WHERE assetId = ? AND poamId = ?`;
            const [existingAsset] = await connection.query(fetchSql, [req.body.assetId, req.body.poamId]);
            return existingAsset[0];
        });
    }
};

exports.deletePoamAsset = async function deletePoamAsset(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.poamassets WHERE assetId = ? AND poamId = ?`;
        await connection.query(sql, [req.params.assetId, req.params.poamId]);

        let assetNameQuery = `SELECT assetName FROM ${config.database.schema}.asset WHERE assetId = ?`;
        let [[assetNameResult]] = await connection.query(assetNameQuery, [req.params.assetId]);
        let assetName = 'Unknown Asset';
        if (assetNameResult) {
            assetName = assetNameResult.assetName;
        }
        let action = `${assetName} was removed from the Asset List.`;
        let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
        await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

        return { poamAsset: [] };
    });
};
