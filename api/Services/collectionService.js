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
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const logger = require('../utils/logger');
const SmError = require('../utils/error');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getCollections = async function getCollections(userId, elevate) {
    try {
        return await withConnection(async (connection) => {
            if (elevate) {
                let sql = "SELECT * FROM user WHERE userId = ?";
                let [rows] = await connection.query(sql, [userId]);
                if (rows.length === 0) {
                    throw new SmError.PrivilegeError('User not found');
                }
                let isAdmin = rows[0].isAdmin;
                const user = {
                    collections: []
                }
                if (isAdmin == 1) {
                    let sql2 = "SELECT * FROM collection;"
                    let [row2] = await connection.query(sql2)
                    const size = Object.keys(row2).length
                    for (let counter = 0; counter < size; counter++) {
                        user.collections.push({
                            ...row2[counter]
                        });
                    }
                    return user.collections;
                } else {
                    throw new SmError.PrivilegeError('User requesting Elevate without admin permissions.');
                }
            } else {
                let collectionSql = `
                SELECT c.*
                FROM collection c
                INNER JOIN collectionpermissions cp ON c.collectionId = cp.collectionId
                WHERE cp.userId = ?;
            `;
                let [collections] = await connection.query(collectionSql, [userId]);
                return collections.map(collection => ({
                    collectionId: collection.collectionId,
                    collectionName: collection.collectionName,
                    description: collection.description,
                    created: collection.created,
                }));
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
            const sql = "SELECT collectionId, collectionName, collectionOrigin, originCollectionId FROM collection";
            const [rows] = await connection.query(sql);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postCollection = async function postCollection(req, res, next) {
    if (!req.body.collectionName) {
        return next({
            status: 400,
            errors: {
                collectionName: 'is required',
            }
        });
    }
    if (!req.body.description) {
        req.body.description = ""
    }
    if (!req.body.collectionOrigin) {
        req.body.collectionOrigin = "C-PAT"
    }
    if (!req.body.originCollectionId) {
        req.body.originCollectionId = null;
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.collection (collectionName, description, collectionOrigin, originCollectionId) VALUES (?, ?, ?, ?) `
            await connection.query(sql_query, [req.body.collectionName, req.body.description, req.body.collectionOrigin, req.body.originCollectionId])
            let sql = "SELECT * FROM cpat.collection WHERE collectionId = LAST_INSERT_ID();"
            let [rowCollection] = await connection.query(sql)

            const collection = rowCollection[0]
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

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.collection SET collectionName=?, description=? WHERE collectionId = ?";
            await connection.query(sql_query, [
                req.body.collectionName,
                req.body.description,
                req.body.collectionId
            ]);

            const message = new Object();
            message.collectionId = req.body.collectionId;
            message.collectionName = req.body.collectionName;
            message.description = req.body.description;
            return message;
        });
    }
    catch (error) {
        return { error: error.message };
    }
}