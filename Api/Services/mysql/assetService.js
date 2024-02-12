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

exports.getAssets = async function getAssets(req, res, next) {
    console.log("getAssets (Service) ...");

    try {
            let connection
            connection = await dbUtils.pool.getConnection()
            let sql = "SELECT * FROM  poamtracking.asset ORDER BY assetName;"
            //console.log("getLabels sql: ", sql)

            let [rowAssets] = await connection.query(sql)
            console.log("rowAssets: ", rowAssets[0])
            await connection.release()

            var size = Object.keys(rowAssets).length

            var assets = []

            for (let counter = 0; counter < size; counter++) {
                    // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                    assets.push({
                            "assetId": rowAssets[counter].assetId,
                            "assetName": rowAssets[counter].assetName,
                            "description": rowAssets[counter].description,
                            "fullyQualifiedDomainName": rowAssets[counter].fullyqualifiedDomainName,
                            "collectionId": rowAssets[counter].collectionId,
                            "ipAddress": rowAssets[counter].ipAddress,
                            "macAddress": rowAssets[counter].macAddress,
                    });
            }

            return { assets };

    }
    catch (error) {
            let errorResponse = { null: "null" }
            //await connection.release()
            return errorResponse;
    }
}

exports.getAssetsByCollection = async function getAssetsByCollection(collectionId, offset = 0, limit = 50) {
    console.log("getAssetsByCollection (Service) ...", collectionId, offset, limit);
    let connection;
    try {
        if (!collectionId) {
            console.info('getAssetsByCollection collectionId not provided.');
            throw new Error('Collection ID is required');
        }

        connection = await dbUtils.pool.getConnection();
        const sql = "SELECT * FROM poamtracking.asset WHERE collectionId = ? ORDER BY assetName LIMIT ?, ?;";
        let [rowAssets] = await connection.query(sql, [collectionId, offset, limit]);
        console.log("rowAssets: ", rowAssets);

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
    } catch (error) {
        console.error("Error in getAssetsByCollection: ", error);
        throw error; // Or return a specific error object/format if preferred
    } finally {
        if (connection) await connection.release();
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

    let connection;
    try {
        connection = await dbUtils.pool.getConnection();

        const sql = "SELECT * FROM  poamtracking.asset WHERE assetId = ?"; 
        return connection.execute(sql, [req.params.assetId]) 
            .then(([rowAssets]) => {
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

            })  
            .finally(() => {
                 if (connection) connection.release(); 
            }); 

    } catch (error) {
        if (connection) connection.release(); 
        throw error;
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

    let connection;
    try {
        connection = await dbUtils.pool.getConnection();

        const sql = "SELECT * FROM poamtracking.asset WHERE assetName = ?";
        return connection.execute(sql, [req.params.assetName]) 
            .then(([rowAssets]) => {
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
            }) 
            .finally(() => {
                if (connection) connection.release(); 
            }); 

    } catch (error) {
        if (connection) connection.release(); 
        next(error); 
    }
};

exports.postAsset = async function posAsset(req, res, next) {
    // res.status(201).json({ message: "postAsset (Service) Method called successfully" });
    // console.log("postAsset req.body: ", req.body)

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

    // if (!req.body.nonComputing) {
    //         console.info('postAsset nonComputing not provided.');
    //         return next({
    //                 status: 422,
    //                 errors: {
    //                         nonComputing: 'is required',
    //                 }
    //         });
    // }

    try {
        let connection
        connection = await dbUtils.pool.getConnection()

        let sql_query = `INSERT INTO poamtracking.asset (assetName, fullyQualifiedDomainName,
                        collectionId, description, ipAddress, macAddress) 
                        values (?, ?, ?, ?, ?, ?)`

        await connection.query(sql_query, [req.body.assetName, req.body.fullyQualifiedDomainName,
        req.body.collectionId, req.body.description, req.body.ipAddress,
        req.body.macAddress])
        await connection.release()

        let sql = "SELECT * FROM poamtracking.asset WHERE assetName = '" + req.body.assetName + "';"
        let [rowAsset] = await connection.query(sql)
        console.log("rowAsset: ", rowAsset[0])
        await connection.release()

        // console.log("userId: ", user[0].userId)
        if (req.body.labels) {
            let labels = req.body.labels;
            // console.log("collectionRequest: ",collectionRequest)
            labels.forEach(async label => {
                connection = await dbUtils.pool.getConnection()

                let sql_query = `INSERT INTO poamtracking.assetLabels (assetId, labelId) values (?, ?)`

                await connection.query(sql_query, [rowAsset[0].assetId, label.labelId])
                await connection.release()
            });
        }

        var assetLabel = rowAsset[0]

        // const message = new Object()
        // message.assetId = rowAsset[0].assetId
        // message.assetName = rowAsset[0].assetName
        // message.fullyQualifiedDomainName = rowAsset[0].fullyQualifiedDomainName
        // message.collectionId = rowAsset[0].collectionId
        // message.description = rowAsset[0].description
        // message.ipAddress = rowAsset[0].ipAddress
        // message.macAddress = rowAsset[0].macAddress
        // message.nonComputing = rowAsset[0].nonComputing

        return (assetLabel)
    }
    catch (error) {
        console.log("error: ", error)
        let errorResponse = { null: "null" }
        //await connection.release()
        return errorResponse;
    }
}

exports.putAsset = async function putAsset(req, res, next) {
    // res.status(201).json({ message: "putPermission (Service) Method called successfully" });

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
        let connection
        connection = await dbUtils.pool.getConnection()

        let sql_query = "UPDATE poamtracking.asset SET assetName= ?, fullyQualifiedDomainName= ?, " +
            "collectionId= ?, description= ?, ipAddress= ?, macAddress= ? " +
            "WHERE assetId = " + req.body.assetId + ";"

        await connection.query(sql_query, [req.body.assetName, req.body.fullyQualifiedDomainName,
        req.body.collectionId, req.body.description, req.body.ipAddress,
        req.body.macAddress])
        await connection.release()

        let sql = "SELECT * FROM poamtracking.asset WHERE assetId = '" + req.body.assetId + "';"
        let [rowAsset] = await connection.query(sql)
        //console.log("rowAsset: ", rowAsset[0])
        await connection.release()

        const message = new Object()
        message.assetId = rowAsset[0].assetId
        message.assetName = rowAsset[0].assetName
        message.fullyQualifiedDomainName = rowAsset[0].fullyQualifiedDomainName
        message.collectionId = rowAsset[0].collectionId
        message.description = rowAsset[0].description
        message.ipAddress = rowAsset[0].ipAddress
        message.macAddress = rowAsset[0].macAddress
        // message.nonComputing = rowAsset[0].nonComputing
        return (message)
    }
    catch (error) {
        let errorResponse = { null: "null" }
        await connection.release()
        return errorResponse;
    }
}

exports.deleteAsset = async function deleteAsset(req, res, next) {
    // res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
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
        let connection
        connection = await dbUtils.pool.getConnection()
        let sql = "DELETE FROM  poamtracking.asset WHERE assetId=" + req.params.assetId + ";"
        //console.log("deleteLabel sql: ", sql)

        await connection.query(sql)
        // console.log("rowPermissions: ", rowPermissions[0])
        await connection.release()

        var asset = []

        return { asset };
    }
    catch (error) {
        let errorResponse = { null: "null" }
        await connection.release()
        return errorResponse;
    }
}