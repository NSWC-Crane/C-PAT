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

exports.getPoamAssignees = async function getPoamAssignees(req, res, next) {
        //console.log("getPoamAssignees (Service) ...");

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.userId, t2.fullName, t1.poamId, t3.description FROM  poamtracking.poamassignees t1 " +
                        "INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "ORDER BY t2.fullName"
                //console.log("getLabels sql: ", sql)

                let [rowPoamAssignees] = await connection.query(sql)
                console.log("rowPoamAssignees: ", rowPoamAssignees[0])
                await connection.release()

                var size = Object.keys(rowPoamAssignees).length

                var poamAssignees = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssignees.push({
                                "userId": rowPoamAssignees[counter].userId,
                                "fullName": rowPoamAssignees[counter].fullName,
                                "poamId": rowPoamAssignees[counter].poamId,
                                "description": rowPoamAssignees[counter].description,
                        });
                }

                return { poamAssignees };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamAssigneesByPoamId = async function getPoamAssigneesByPoamId(req, res, next) {
        //console.log("getPoamAssigneesByPoamId (Service) ...");
        if (!req.params.poamId) {
                console.info('getPoamAssigneesByPoamId poamId not provided.');
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
                let sql = "SELECT t1.userId, t2.firstName, t2.lastName, t2.fullName, t2.phoneNumber, t2.userEmail, t1.poamId, t3.description " +
                        "FROM  poamtracking.poamassignees t1 " +
                        "INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.poamId = " + req.params.poamId + " ORDER BY t2.fullName"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowPoamAssignees] = await connection.query(sql)
                console.log("rowPoamAssignees: ", rowPoamAssignees[0])
                await connection.release()

                var size = Object.keys(rowPoamAssignees).length

                var poamAssignees = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssignees.push({
                                "userId": rowPoamAssignees[counter].userId,
                                "fullName": rowPoamAssignees[counter].fullName,
                                "poamId": rowPoamAssignees[counter].poamId,
                                "description": rowPoamAssignees[counter].description,
                        });
                }

                return { poamAssignees };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamAssigneesByUserId = async function getPoamAssigneesByUserId(req, res, next) {
        //console.log("getPoamAssigneesByUserId (Service) ...");
        if (!req.params.userId) {
                console.info('getPoamAssigneesByUserId userId not provided.');
                return next({
                        status: 422,
                        errors: {
                                userId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.userId, t2.fullName, t1.poamId, t3.description FROM  poamtracking.poamassignees t1 " +
                        "INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.userId = " + req.params.userId + " ORDER BY t2.fullName"
                //console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowPoamAssignees] = await connection.query(sql)
                console.log("rowPoamAssignees: ", rowPoamAssignees[0])
                await connection.release()

                var size = Object.keys(rowPoamAssignees).length

                var poamAssignees = []

                for (let counter = 0; counter < size; counter++) {
                        // console.log("Before setting permissions size: ", size, ", counter: ",counter);

                        poamAssignees.push({
                                "userId": rowPoamAssignees[counter].userId,
                                "fullName": rowPoamAssignees[counter].fullName,
                                "poamId": rowPoamAssignees[counter].poamId,
                                "description": rowPoamAssignees[counter].description,
                        });
                }

                return { poamAssignees };

        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.getPoamAssignee = async function getPoamAssignee(req, res, next) {
        // res.status(201).json({ message: "getPoamAssignee (Service) Method called successfully" });

        if (!req.params.poamId) {
                console.info('getPoamAssignee poamId not provided.');
                return next({
                        status: 422,
                        errors: {
                                poamId: 'is required',
                        }
                });
        }

        if (!req.params.userId) {
                console.info('getPoamAssignee userId not provided.');
                return next({
                        status: 422,
                        errors: {
                                userId: 'is required',
                        }
                });
        }

        try {
                let connection
                connection = await dbUtils.pool.getConnection()
                let sql = "SELECT t1.userId, t2.fullName, t1.poamId, t3.description FROM  poamtracking.poamassignees t1 " +
                        "INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.userId = " + req.params.userId + " AND t1.poamId = " + req.params.poamId +
                        " ORDER BY t2.fullName"
                console.log("getAssetLabelsByAsset sql: ", sql)

                let [rowPoamAssignee] = await connection.query(sql)
                console.log("rowPoamAssignee: ", rowPoamAssignee[0])
                await connection.release()

                var poamAssignee = [rowPoamAssignee[0]]

                return { poamAssignee };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.postPoamAssignee = async function postPoamAssignee(req, res, next) {
        // res.status(201).json({ message: "postPoamAssignee (Service) Method called successfully" });

        if (!req.body.userId) {
                console.info('postPoamAssignee userId not provided.');
                return next({
                        status: 422,
                        errors: {
                                userId: 'is required',
                        }
                });
        }

        if (!req.body.poamId) {
                console.info('postPoamAssignee poamId not provided.');
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

                let sql_query = `INSERT INTO poamtracking.poamassignees (userId, poamId) 
                        values (?, ?)`

                await connection.query(sql_query, [req.body.userId, req.body.poamId])
                await connection.release()

                let sql = "SELECT t1.userId, t2.fullName, t1.poamId, t3.description FROM  poamtracking.poamassignees t1 " +
                        "INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId " +
                        "INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId " +
                        "WHERE t1.userId = " + req.body.userId + " AND t1.poamId = " + req.body.poamId +
                        " ORDER BY t2.fullName"
                let [rowPoamAssignee] = await connection.query(sql)
                console.log("rowPoamAssignee: ", rowPoamAssignee[0])
                await connection.release()

                var poamAssignee = [rowPoamAssignee[0]]

                return { poamAssignee };
        }
        catch (error) {
                console.log("error: ", error)
                let errorResponse = { null: "null" }
                //await connection.release()
                return errorResponse;
        }
}

exports.putPoamAssignee = async function putPoamAssignee(req, res, next) {
        // res.status(201).json({ message: "putPoamAssignee (Service) Method called successfully" });

        if (!req.body.userId) {
                console.info('putPoamAssignee userId not provided.');
                return next({
                        status: 422,
                        errors: {
                                userId: 'is required',
                        }
                });
        }

        if (!req.body.poamId) {
                console.info('putPoamAssignee poamId not provided.');
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
                message.userId = req.body.userId
                message.poamId = req.body.poamId

                return (message)
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}

exports.deletePoamAssignee = async function deletePoamAssignee(req, res, next) {
        // res.status(201).json({ message: "deletePoamAssignee (Service) Method called successfully" });
        if (!req.params.userId) {
                console.info('deletePoamAssignee userId not provided.');
                return next({
                        status: 422,
                        errors: {
                                userId: 'is required',
                        }
                });
        }

        if (!req.params.poamId) {
                console.info('deletePoamAssignee poamId not provided.');
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
                let sql = "DELETE FROM  poamtracking.poamassignees WHERE userId=" + req.params.userId +
                        " AND poamId = " + req.params.poamId + ";"
                //console.log("deleteLabel sql: ", sql)

                await connection.query(sql)
               
                await connection.release()

                var poamAssignee = []

                return { poamAssignee };
        }
        catch (error) {
                let errorResponse = { null: "null" }
                await connection.release()
                return errorResponse;
        }
}