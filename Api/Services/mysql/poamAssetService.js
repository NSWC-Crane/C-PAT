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

exports.getPoamAssets = async function getPoamAssets(req, res, next) {
        //console.log("getPoamAssets (Service) ...");

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.assetId, t2.assetName, t1.poamId, t3.description FROM  poamtracking.poamassets t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "ORDER BY t3.description"
                // SELECT t1.assetId, assetName, t1.labelId, labelName FROM  assetlabels t1 
                // INNER JOIN asset t2 ON t1.assetId = t2.assetId 
                // INNER JOIN label t3 ON t1.labelId = t3.labelId
                //console.log("getLabels sql: ", sql)

                let [rowPoamAssets] = await connection.query(sql)
                console.log("rowPoamAssets: ", rowPoamAssets[0])
                await connection.release()

                var size = Object.keys(rowPoamAssets).length

                var poamAssets = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssets.push({
                                "assetId": rowPoamAssets[counter].assetId,
                                "assetName": rowPoamAssets[counter].assetName,
                                "poamId": rowPoamAssets[counter].poamId,
                                "description": rowPoamAssets[counter].description,
                        });
                }

                return { poamAssets };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req, res, next) {
        //console.log("getAssetLabels (Service) ...");
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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.assetId, assetName, t1.poamId, t3.description " + 
                        "FROM  poamtracking.poamassets t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.poamId = " + req.params.poamId + " ORDER BY t3.description"
                console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowPoamAssets] = await connection.query(sql)
                console.log("rowPoamAssets: ", rowPoamAssets[0])
                await connection.release()

                var size = Object.keys(rowPoamAssets).length

                var poamAssets = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssets.push({
                                "assetId": rowPoamAssets[counter].assetId,
                                "assetName": rowPoamAssets[counter].assetName,
                                "poamId": rowPoamAssets[counter].poamId,
                                "description": rowPoamAssets[counter].description,
                        });
                }

                return { poamAssets };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req, res, next) {
        //console.log("getPoamAssets (Service) ...");
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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.assetId, t2.assetName, t1.poamId, t3.description FROM  poamtracking.poamassets t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.assetId = " + req.params.assetId + " ORDER BY t3.description"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowPoamAssets] = await connection.query(sql)
                console.log("rowPoamAssets: ", rowPoamAssets[0])
                await connection.release()

                var size = Object.keys(rowPoamAssets).length

                var poamAssets = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssets.push({
                                "assetId": rowPoamAssets[counter].assetId,
                                "assetName": rowPoamAssets[counter].assetName,
                                "poamId": rowPoamAssets[counter].poamId,
                                "description": rowPoamAssets[counter].description,
                        });
                }

                return { poamAssets };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getAssetLabel = async function getAssetLabel(req, res, next) {
        // res.status(201).json({ message: "getAssetLabel (Service) Method called successfully" });

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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.assetId, assetName, t1.labelId, labelName FROM  poamtracking.assetlabels t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.assetId = " + req.params.assetId + " AND t1.labelId = " + req.params.labelId +
                        " ORDER BY t3.labelName"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowAssetLabel] = await connection.query(sql)
                console.log("rowAssets: ", rowAssetLabel[0])
                await connection.release()

                var assetLabel = [rowAssetLabel[0]]

                return { assetLabel };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.postPoamAsset = async function postPoamAsset(req, res, next) {
        // res.status(201).json({ message: "postPoamAsset (Service) Method called successfully" });

        if (!req.body.assetId) {
                console.info('postPoamAsset assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.body.poamId) {
                console.info('postPoamAsset poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }


        try {
                let connection
                connection = await dbUtils.pool.getConnection()

                let sql_query = `INSERT INTO poamtracking.poamassets (assetId, poamId) 
                        values (?, ?)`

                await connection.query(sql_query, [req.body.assetId, req.body.poamId])
                await connection.release()

                let sql = "SELECT t1.assetId, t2.assetName, t1.poamId, t3.description FROM  poamtracking.poamassets t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.poamId = " + req.body.poamId + " AND t1.assetId = " + req.body.assetId +
                        " ORDER BY t3.description"
                let [rowPoamAsset] = await connection.query(sql)
                console.log("rowPoamAsset: ", rowPoamAsset[0])
                await connection.release()

                var poamAsset = [rowPoamAsset[0]]

                return { poamAsset };
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.putPoamAsset = async function putPoamAsset(req, res, next) {
        // res.status(201).json({ message: "putPoamAsset (Service) Method called successfully" });

        if (!req.body.assetId) {
                console.info('putPoamAsset assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.body.poamId) {
                console.info('putPoamAsset poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        try {
                // Noting to update, only unique index, if we get here, just return what was sent in.

                const message = new Object()
                message.assetId = req.body.assetId
                message.poamId = req.body.poamId

                return (message)
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}

exports.deletePoamAsset = async function deletePoamAsset(req, res, next) {
        // res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
        if (!req.params.assetId) {
                console.info('deletePoamAsset assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.params.poamId) {
                console.info('deletePoamAsset poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "DELETE FROM  poamtracking.poamassets WHERE assetId=" + req.params.assetId +
                        " AND poamId = " + req.params.poamId + ";"
                //console.log("deleteLabel sql: ", sql)

                await connection.query(sql)
                // console.log("rowPermissions: ", rowPermissions[0])
                await connection.release()

                var poamAsset = []

                return { poamAsset };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}