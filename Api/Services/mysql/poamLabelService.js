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
            let connection = await dbUtils.pool.getConnection();
            let sql = "SELECT t1.poamId, t1.labelId, labelName FROM poamtracking.poamlabels t1 " +
                      "INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId " +
                      "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                      "WHERE t2.collectionId = ? " +
                      "ORDER BY t3.labelName";
    
            let [rowPoamLabels] = await connection.query(sql, [req.params.collectionId]);
            console.log("rowPoams: ", rowPoamLabels[0]);
            await connection.release();
    
            var size = Object.keys(rowPoamLabels).length;
    
            var poamLabels = [];
    
            for (let counter = 0; counter < size; counter++) {
                poamLabels.push({
                    "poamId": rowPoamLabels[counter].poamId,
                    "labelId": rowPoamLabels[counter].labelId,
                    "labelName": rowPoamLabels[counter].labelName,
                });
            }
    
            return { poamLabels };
    
        } catch (error) {
            console.error("Error fetching POAM labels: ", error);
            if (connection) await connection.release();
            let errorResponse = { "null": "Unable to fetch POAM labels" };
            return errorResponse;
        }
    }

exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(req, res, next) {
        //console.log("getPoamLabels (Service) ...");
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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.poamId, t1.labelId, labelName FROM  poamtracking.poamlabels t1 " +
                        "INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.poamId = " + req.params.poamId + " ORDER BY t3.labelName"
                //console.log("getPoamLabelsByPoam sql: ", sql)

                let [rowPoamLabels] = await connection.query(sql)
                console.log("rowPoams: ", rowPoamLabels[0])
                await connection.release()

                var size = Object.keys(rowPoamLabels).length

                var poamLabels = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamLabels.push({
                                "poamId": rowPoamLabels[counter].poamId,
                                "labelId": rowPoamLabels[counter].labelId,
                                "labelName": rowPoamLabels[counter].labelName,
                        });
                }

                return { poamLabels };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamLabelsByLabel = async function getPoamLabelsByLabel(req, res, next) {
        //console.log("getPoamLabels (Service) ...");
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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.poamId, t1.labelId, labelName FROM  poamtracking.poamlabels t1 " +
                        "INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.labelId = " + req.params.labelId + " ORDER BY t3.labelName"
                //console.log("getPoamLabelsByPoam sql: ", sql)

                let [rowPoamLabels] = await connection.query(sql)
                console.log("rowPoams: ", rowPoamLabels[0])
                await connection.release()

                var size = Object.keys(rowPoamLabels).length

                var poamLabels = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamLabels.push({
                                "poamId": rowPoamLabels[counter].poamId,
                                "labelId": rowPoamLabels[counter].labelId,
                                "labelName": rowPoamLabels[counter].labelName,
                        });
                }

                return { poamLabels };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamLabel = async function getPoamLabel(req, res, next) {
        // res.status(201).json({ message: "getPoamLabel (Service) Method called successfully" });

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
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.poamId, t1.labelId, labelName FROM  poamtracking.poamlabels t1 " +
                        "INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.poamId = " + req.params.poamId + " AND t1.labelId = " + req.params.labelId +
                        " ORDER BY t3.labelName"
                //console.log("getPoamLabelsByPoam sql: ", sql)

                let [rowPoamLabel] = await connection.query(sql)
                console.log("rowPoams: ", rowPoamLabel[0])
                await connection.release()

                var poamLabel = [rowPoamLabel[0]]

                return { poamLabel };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.postPoamLabel = async function posPoamLabel(req, res, next) {
        // res.status(201).json({ message: "postPoam (Service) Method called successfully" });

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
                let connection
                connection = await dbUtils.pool.getConnection()

                let sql_query = `INSERT INTO poamtracking.poamlabels (poamId, labelId) 
                        values (?, ?)`

                await connection.query(sql_query, [req.body.poamId, req.body.labelId])
                await connection.release()

                let sql = "SELECT t1.poamId, t1.labelId, labelName FROM  poamtracking.poamlabels t1 " +
                        "INNER JOIN poamtracking.poam t2 ON t1.poamId = t2.poamId " +
                        "INNER JOIN poamtracking.label t3 ON t1.labelId = t3.labelId " +
                        "WHERE t1.poamId = " + req.body.poamId + " AND t1.labelId = " + req.body.labelId +
                        " ORDER BY t3.labelName"
                let [rowPoamLabel] = await connection.query(sql)
                console.log("rowPoamLabel: ", rowPoamLabel[0])
                await connection.release()

                var poamLabel = [rowPoamLabel[0]]

                return { poamLabel };
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.putPoamLabel = async function putPoamLabel(req, res, next) {
        // res.status(201).json({ message: "putPoamLabel(Service) Method called successfully" });

        if (!req.body.poamId) {
                console.info('putPoamLabel poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        if (!req.body.labelId) {
                console.info('putPoamLabel labelId not provided.');
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
                message.poamId = req.body.poamId
                message.labelId = req.body.labelId

                return (message)
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}

exports.deletePoamLabel = async function deletePoamLabel(req, res, next) {
        // res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
        if (!req.params.poamId) {
                console.info('deletePoamLabel poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        if (!req.params.poamId) {
                console.info('deletePoamLabel labelId not provided.');
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
                let sql = "DELETE FROM  poamtracking.poamlabels WHERE poamId=" + req.params.poamId +
                        " AND labelId = " + req.params.labelId + ";"
                //console.log("deleteLabel sql: ", sql)

                await connection.query(sql)
                // console.log("rowPermissions: ", rowPermissions[0])
                await connection.release()

                var poamLabel = []

                return { poamLabel };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}