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
const config = require('../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')
const logger = require('../utils/logger')

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getCollections = async function getCollections(userNameInput, req, res, next) {
    if (userNameInput == "Registrant") {
        try {
            return await withConnection(async (connection) => {
                let sql = "SELECT collectionId, collectionName FROM cpat.collection;"
                let [row] = await connection.query(sql)
                var size = Object.keys(row).length

                var user = {
                    collections: []
                }

                for (let counter = 0; counter < size; counter++) {
                    user.collections.push({
                        "collectionId": row[counter].collectionId,
                        "collectionName": row[counter].collectionName
                    });
                }

                return user;
            });
        } catch (error) {
            return { error: error.message };
        }
    }
    let userId = 0
    let isAdmin = 0;
    let userName = "";
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userName = ?";
            let [row] = await connection.query(sql, [userNameInput]);
            userId = row[0].userId;
            isAdmin = row[0].isAdmin;
            userName = row[0].userName;

            var user = {
                collections: []
            }
            if (isAdmin == 1) {
                let sql2 = "SELECT * FROM collection;"
                let [row2] = await connection.query(sql2)
                var size = Object.keys(row2).length

                for (let counter = 0; counter < size; counter++) {
                    user.collections.push({
                        ...row2[counter]
                    });
                }

                return user.collections;
            } else {
                let sql = "SELECT * FROM collectionpermissions WHERE userId = ?";
                let [row2] = await connection.query(sql, [userId])
                var numberOfCollections = Object.keys(row2).length
                var nonAdminCollections = {
                    collections: []
                }
                for (let counter = 0; counter < numberOfCollections; counter++) {
                    let sql3 = "SELECT * FROM collection WHERE collectionId = ?";
                    let [row3] = await connection.query(sql3, [row2[counter].collectionId])
                    nonAdminCollections.collections.push({
                        "collectionId": row3[0].collectionId,
                        "collectionName": row3[0].collectionName,
                        "description": row3[0].description,
                        "created": row3[0].created,
                        "assetCount": row3[0].assetCount,
                        "poamCount": row3[0].poamCount
                    });
                }

                return nonAdminCollections.collections;
            }
        });
    }
    catch (error) {
        return { error: error.message };
    }
}

exports.getCollectionBasicList = async function getCollectionBasicList(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            const sql = "SELECT collectionId, collectionName FROM collection";
            const [rows] = await connection.query(sql);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postCollection = async function postCollection(req, res, next) {
    if (!req.body.collectionName) req.body.collectionName = undefined
    if (!req.body.description) req.body.description = ""
    if (!req.body.assetCount) req.body.assetCount = 0;
    if (!req.body.poamCount) req.body.poamCount = 0;

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.collection (collectionName, description, assetCount, poamCount) VALUES (?, ?, ?, ?) `
            await connection.query(sql_query, [req.body.collectionName, req.body.description, 0, 0, 0])
            let sql = "SELECT * FROM cpat.collection WHERE collectionId = LAST_INSERT_ID();"
            let [rowCollection] = await connection.query(sql)

            var collection = rowCollection[0]
            return (collection)
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.putCollection = async function putCollection(req, res, next) {
    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    if (!req.body.collectionName) req.body.collectionName = undefined;
    if (!req.body.description) req.body.description = "";
    if (!req.body.assetCount) req.body.assetCount = 0;
    if (!req.body.poamCount) req.body.poamCount = 0;

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.collection SET collectionName=?, description=?, assetCount= ?, poamCount= ? WHERE collectionId = ?";
            await connection.query(sql_query, [
                req.body.collectionName,
                req.body.description,
                req.body.assetCount,
                req.body.poamCount,
                req.body.collectionId
            ]);

            const message = new Object();
            message.collectionId = req.body.collectionId;
            message.collectionName = req.body.collectionName;
            message.description = req.body.description;
            message.assetCount = req.body.assetCount;
            message.poamCount = req.body.poamCount;
            return message;
        });
    }
    catch (error) {
        return { error: error.message };
    }
}