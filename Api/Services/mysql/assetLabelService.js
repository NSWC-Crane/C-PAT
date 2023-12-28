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

exports.getAssetLabels = async function getAssetLabels(req, res, next) {
        //console.log("getAssetLabels (Service) ...");

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.assetId, assetName, t1.labelId, labelName FROM  poamtracking.assetlabels t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "ORDER BY t3.labelName"
                // SELECT t1.assetId, assetName, t1.labelId, labelName FROM  assetlabels t1 
                // INNER JOIN asset t2 ON t1.assetId = t2.assetId 
                // INNER JOIN label t3 ON t1.labelId = t3.labelId
                //console.log("getLabels sql: ", sql)

                let [rowAssetLabels] = await connection.query(sql)
                console.log("rowAssets: ", rowAssetLabels[0])
                await connection.release()

                var size = Object.keys(rowAssetLabels).length

                var assetLabels = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        assetLabels.push({
                                "assetId": rowAssetLabels[counter].assetId,
                                "assetName": rowAssetLabels[counter].assetName,
                                "labelId": rowAssetLabels[counter].labelId,
                                "labelName": rowAssetLabels[counter].labelName,
                        });
                }

                return { assetLabels };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getAssetLabelsByAsset = async function getAssetLabelsByAsset(req, res, next) {
        //console.log("getAssetLabels (Service) ...");
        if (!req.params.assetId) {
                console.info('getAssetLabelByAsset assetId not provided.');
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
                let sql = "SELECT t1.assetId, assetName, t1.labelId, labelName FROM  poamtracking.assetlabels t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.assetId = " + req.params.assetId + " ORDER BY t3.labelName"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowAssetLabels] = await connection.query(sql)
                console.log("rowAssets: ", rowAssetLabels[0])
                await connection.release()

                var size = Object.keys(rowAssetLabels).length

                var assetLabels = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        assetLabels.push({
                                "assetId": rowAssetLabels[counter].assetId,
                                "assetName": rowAssetLabels[counter].assetName,
                                "labelId": rowAssetLabels[counter].labelId,
                                "labelName": rowAssetLabels[counter].labelName,
                        });
                }

                return { assetLabels };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getAssetLabelsByLabel = async function getAssetLabelsByLabel(req, res, next) {
        //console.log("getAssetLabels (Service) ...");
        if (!req.params.labelId) {
                console.info('getAssetLabelByLabel labelId not provided.');
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
                        "WHERE t1.labelId = " + req.params.labelId + " ORDER BY t3.labelName"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowAssetLabels] = await connection.query(sql)
                console.log("rowAssets: ", rowAssetLabels[0])
                await connection.release()

                var size = Object.keys(rowAssetLabels).length

                var assetLabels = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        assetLabels.push({
                                "assetId": rowAssetLabels[counter].assetId,
                                "assetName": rowAssetLabels[counter].assetName,
                                "labelId": rowAssetLabels[counter].labelId,
                                "labelName": rowAssetLabels[counter].labelName,
                        });
                }

                return { assetLabels };

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

exports.postAssetLabel = async function posAssetLabel(req, res, next) {
        // res.status(201).json({ message: "postAsset (Service) Method called successfully" });

        if (!req.body.assetId) {
                console.info('postAssetLabel assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.body.labelId) {
                console.info('postAssetLabel labelId not provided.');
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

                let sql_query = `INSERT INTO poamtracking.assetlabels (assetId, labelId) 
                        values (?, ?)`

                await connection.query(sql_query, [req.body.assetId, req.body.labelId])
                await connection.release()

                let sql = "SELECT t1.assetId, assetName, t1.labelId, labelName FROM  poamtracking.assetlabels t1 " +
                        "INNER JOIN poamtracking.asset t2 ON t1.assetId = t2.assetId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.assetId = " + req.body.assetId + " AND t1.labelId = " + req.body.labelId +
                        " ORDER BY t3.labelName"
                let [rowAssetLabel] = await connection.query(sql)
                console.log("rowAssetLabel: ", rowAssetLabel[0])
                await connection.release()

                var assetLabel = [rowAssetLabel[0]]

                return { assetLabel };
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.putAssetLabel = async function putAssetLabel(req, res, next) {
        // res.status(201).json({ message: "putAssetLabel(Service) Method called successfully" });

        if (!req.body.assetId) {
                console.info('putAssetLabel assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.body.labelId) {
                console.info('putAssetLabel labelId not provided.');
                return next({
                        status: 422,
                        errors: {
                                labelId: 'is required',
                        }
                });
        }

        try {
                // Noting to update, only unique index, if we get here, just return what was sent in.

                const message = new Object()
                message.assetId = req.body.assetId
                message.labelId = req.body.labelId

                return (message)
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}

exports.deleteAssetLabel = async function deleteAssetLabel(req, res, next) {
        // res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
        if (!req.params.assetId) {
                console.info('deleteAssetLabel assetId not provided.');
                return next({
                        status: 422,
                        errors: {
                                assetId: 'is required',
                        }
                });
        }

        if (!req.params.assetId) {
                console.info('deleteAssetLabel labelId not provided.');
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
                let sql = "DELETE FROM  poamtracking.assetlabels WHERE assetId=" + req.params.assetId +
                        " AND labelId = " + req.params.labelId + ";"
                //console.log("deleteLabel sql: ", sql)

                await connection.query(sql)
                // console.log("rowPermissions: ", rowPermissions[0])
                await connection.release()

                var assetLabel = []

                return { assetLabel };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}