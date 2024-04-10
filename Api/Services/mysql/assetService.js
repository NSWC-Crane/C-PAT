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

exports.getAssets = async function getAssets(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM  poamtracking.asset ORDER BY assetName;"
            let [rowAssets] = await connection.query(sql);
            var assets = rowAssets.map(row => ({
                "assetId": row.assetId,
                "assetName": row.assetName,
                "description": row.description,
                "fullyQualifiedDomainName": row.fullyQualifiedDomainName,
                "collectionId": row.collectionId,
                "ipAddress": row.ipAddress,
                "macAddress": row.macAddress,
            }));
            return { assets };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getAssetsByCollection = async function getAssetsByCollection(collectionId, offset = 0, limit = 50) {
    try {
        if (!collectionId) {
            console.info('getAssetsByCollection collectionId not provided.');
            throw new Error('Collection ID is required');
        }
        return await withConnection(async (connection) => {
            const sql = "SELECT * FROM poamtracking.asset WHERE collectionId = ? ORDER BY assetName LIMIT ?, ?;";
            let [rowAssets] = await connection.query(sql, [collectionId, offset, limit]);
            var assets = rowAssets.map(row => ({
                "assetId": row.assetId,
                "assetName": row.assetName,
                "description": row.description,
                "fullyQualifiedDomainName": row.fullyQualifiedDomainName,
                "collectionId": row.collectionId,
                "ipAddress": row.ipAddress,
                "macAddress": row.macAddress,
            }));
            return { assets };
        });
    } catch (error) {
        console.error("Error in getAssetsByCollection: ", error);
        throw error;
    }
};

exports.getAsset = async function getAsset(req, res, next) {
    if (!req.params.assetId) {
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
            }
        });
    }
    try {
        return await withConnection(async (connection) => {
            const sql = "SELECT * FROM  poamtracking.asset WHERE assetId = ?";
            let [rowAssets] = await connection.execute(sql, [req.params.assetId]);
            if (rowAssets.length === 0) {
                const customError = new Error(`Asset with ID ${req.params.assetId} was not found`);
                customError.status = 404;
                throw customError;
            }
            const response = {
                asset: rowAssets.map(asset => ({
                    assetId: asset.assetId,
                    assetName: asset.assetName,
                    collectionId: asset.collectionId,
                    ipAddress: asset.ipAddress || "",
                    description: asset.description || "",
                    fullyQualifiedDomainName: asset.fullyQualifiedDomainName || "",
                    macAddress: asset.macAddress || ""
                }))
            };
            return response;
        });
    } catch (error) {
        next(error);
    }
};

exports.getAssetByName = async function getAssetByName(req, res, next) {
    if (!req.params.assetName) {
        return next({
            status: 422,
            errors: {
                assetName: 'is required',
            }
        });
    }
    try {
        return await withConnection(async (connection) => {
            const sql = "SELECT * FROM poamtracking.asset WHERE assetName = ?";
            let [rowAssets] = await connection.execute(sql, [req.params.assetName]);
            if (rowAssets.length === 0) {
                const customError = new Error(`Asset with name ${req.params.assetName} was not found`);
                customError.status = 404;
                throw customError;
            }
            const response = {
                asset: rowAssets.map(asset => ({
                    assetId: asset.assetId,
                    assetName: asset.assetName,
                    collectionId: asset.collectionId,
                    ipAddress: asset.ipAddress || "",
                    description: asset.description || "",
                    fullyQualifiedDomainName: asset.fullyQualifiedDomainName || "",
                    macAddress: asset.macAddress || ""
                }))
            };
            return response;
        });
    } catch (error) {
        next(error);
    }
};

exports.postAsset = async function postAsset(req, res, next) {
    if (!req.body.assetName) {
        console.info('postAsset assetName not provided.');
        return next({
            status: 422,
            errors: {
                assetName: 'is required',
            }
        });
    }
    if (!req.body.collectionId) {
        console.info('postAsset collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    if (!req.body.ipAddress) {
        console.info('postAsset ipAddressnot provided.');
        return next({
            status: 422,
            errors: {
                ipAddress: 'is required',
            }
        });
    }
    try {
        return await withConnection(async (connection) => {
            let sql_query = `
                INSERT INTO poamtracking.asset (assetName, fullyQualifiedDomainName,
                collectionId, description, ipAddress, macAddress) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(sql_query, [
                req.body.assetName, req.body.fullyQualifiedDomainName,
                req.body.collectionId, req.body.description, req.body.ipAddress,
                req.body.macAddress
            ]);
            let sql = "SELECT * FROM poamtracking.asset WHERE assetName = ?";
            let [rowAsset] = await connection.query(sql, [req.body.assetName]);
            if (req.body.labels) {
                let labels = req.body.labels;
                for (let label of labels) {
                    let sql_query = `
                        INSERT INTO poamtracking.assetLabels (assetId, labelId) 
                        VALUES (?, ?)
                    `;
                    await connection.query(sql_query, [rowAsset[0].assetId, label.labelId]);
                }
            }
            return rowAsset[0];
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.putAsset = async function putAsset(req, res, next) {
    if (!req.body.assetId) {
        console.info('putAsset assetId not provided.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
            }
        });
    }
    if (!req.body.assetName) {
        console.info('putAsset assetName not provided.');
        return next({
            status: 422,
            errors: {
                assetName: 'is required',
            }
        });
    }
    if (!req.body.collectionId) {
        console.info('putAsset collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    if (!req.body.ipAddress) {
        console.info('putAsset ipAddress not provided.');
        return next({
            status: 422,
            errors: {
                ipAddress: 'is required',
            }
        });
    }
    if (!req.body.description) req.body.description = "";
    if (!req.body.fullyQualifiedDomainName) req.body.fullyQualifiedDomainName = "";
    if (!req.body.macAddress) req.body.macAddress = "";
    try {
        return await withConnection(async (connection) => {
            let sql_query = `
                UPDATE poamtracking.asset 
                SET assetName = ?, fullyQualifiedDomainName = ?, 
                collectionId = ?, description = ?, ipAddress = ?, macAddress = ?
                WHERE assetId = ?
            `;
            await connection.query(sql_query, [
                req.body.assetName, req.body.fullyQualifiedDomainName,
                req.body.collectionId, req.body.description, req.body.ipAddress,
                req.body.macAddress, req.body.assetId
            ]);
            let sql = "SELECT * FROM poamtracking.asset WHERE assetId = ?";
            let [rowAsset] = await connection.query(sql, [req.body.assetId]);
            const message = {
                assetId: rowAsset[0].assetId,
                assetName: rowAsset[0].assetName,
                fullyQualifiedDomainName: rowAsset[0].fullyQualifiedDomainName,
                collectionId: rowAsset[0].collectionId,
                description: rowAsset[0].description,
                ipAddress: rowAsset[0].ipAddress,
                macAddress: rowAsset[0].macAddress,
            };
            return message;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.deleteAsset = async function deleteAsset(req, res, next) {
    if (!req.params.assetId) {
        console.info('deleteAsset assetId not provided.');
        return next({
            status: 422,
            errors: {
                assetId: 'is required',
            }
        });
    }
    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.asset WHERE assetId = ?";
            await connection.query(sql, [req.params.assetId]);
            return { asset: [] };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}