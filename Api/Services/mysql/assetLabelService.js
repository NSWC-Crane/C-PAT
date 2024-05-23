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
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getAssetLabels = async function getAssetLabels(req, res, next) {
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
                SELECT t1.assetId, assetName, t1.labelId, labelName 
                FROM cpat.assetlabels t1 
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId 
                INNER JOIN cpat.label t3 ON t1.labelId = t3.labelId 
                WHERE t3.collectionId = ?
                ORDER BY t3.labelName
            `;
            let [rowAssetLabels] = await connection.query(sql, [req.params.collectionId]);
            var assetLabels = rowAssetLabels.map((row) => ({
                "assetId": row.assetId,
                "assetName": row.assetName,
                "labelId": row.labelId,
                "labelName": row.labelName,
            }));
            return assetLabels.assetLabel;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAssetLabelsByAsset = async function getAssetLabelsByAsset(req, res, next) {
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
                SELECT t1.assetId, assetName, t1.labelId, labelName, t2.collectionId
                FROM cpat.assetlabels t1 
                INNER JOIN cpat.asset t2 ON t1.assetId = t2.assetId 
                INNER JOIN cpat.label t3 ON t1.labelId = t3.labelId 
                WHERE t1.assetId = ? 
                ORDER BY t3.labelName
            `;
            let [rowAssetLabels] = await connection.query(sql, [req.params.assetId]);
            var assetLabels = rowAssetLabels.map((row) => ({
                "assetId": row.assetId,
                "assetName": row.assetName,
                "labelId": row.labelId,
                "labelName": row.labelName,
                "collectionId": row.collectionId
            }));
            return assetLabels;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.getAssetLabelsByLabel = async function getAssetLabelsByLabel(req, res, next) {
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
                WHERE t1.labelId = ?
                ORDER BY t3.labelName
            `;
            let [rowAssetLabels] = await connection.query(sql, [req.params.labelId]);
            var assetLabels = rowAssetLabels.map((row) => ({
                "assetId": row.assetId,
                "assetName": row.assetName,
                "labelId": row.labelId,
                "labelName": row.labelName,
            }));
            return assetLabels.assetLabels;
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
            var assetLabel = rowAssetLabel.length > 0 ? [rowAssetLabel[0]] : [];
            return assetLabel.assetLabel;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.postAssetLabel = async function postAssetLabel(req, res, next) {
    if (!req.body.assetId) {
        return next({
            status: 400,
            errors: {
                assetId: 'is required',
            }
        });
    }
    if (!req.body.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            }
        });
    }
    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `
                INSERT INTO cpat.assetlabels (assetId, collectionId, labelId)
                VALUES (?, ?, ?)
            `;
            await connection.query(sql_query, [req.body.assetId, req.body.collectionId, req.body.labelId]);

            let sql = `
                SELECT t1.assetId, t1.collectionId, t1.labelId
                FROM cpat.assetlabels t1
                WHERE t1.assetId = ? AND t1.labelId = ?
            `;
            let [rowAssetLabel] = await connection.query(sql, [req.body.assetId, req.body.labelId]);

            var assetLabel = rowAssetLabel.length > 0 ? rowAssetLabel[0] : null;
            return (assetLabel);
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deleteAssetLabel = async function deleteAssetLabel(req, res, next) {
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
                DELETE FROM cpat.assetlabels 
                WHERE assetId = ? AND labelId = ?
            `;
            await connection.query(sql, [req.params.assetId, req.params.labelId]);
            return { assetLabel: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}