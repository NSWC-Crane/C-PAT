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

exports.postPermission = async function postPermission(req, res, next) {
    if (!req.body.userId) {
        console.info('postPermissions userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.collectionId) {
        console.info('postPermission collectionId not provided.');
        return next({
            status: 400,
            errors: {
                oldCollectionId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        console.info('postPermission accessLevel not provided.');
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "INSERT INTO poamtracking.collectionpermissions (accessLevel, userId, collectionId) VALUES (?, ?, ?);";
            await connection.query(sql_query, [req.body.accessLevel, req.body.userId, req.body.collectionId]);

            const message = {
                userId: req.body.userId,
                collectionId: req.body.collectionId,
                accessLevel: req.body.accessLevel,
            };
            return message;
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async (connection) => {
                let fetchSql = "SELECT * FROM poamtracking.collectionpermissions WHERE userId = ? AND collectionId = ?";
                const [existingPermission] = await connection.query(fetchSql, [req.body.userId, req.body.collectionId]);
                return existingPermission[0];
            });
        }
        else {
            console.error("error: ", error);
            return { null: "null" };
        }
    }
}

exports.putPermission = async function putPermission(req, res, next) {
    if (!req.body.userId) {
        console.info('postPermissions userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.oldCollectionId) {
        console.info('putPermissions oldCollectionId not provided.');
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        console.info('postPermission accessLevel not provided.');
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE poamtracking.collectionpermissions SET collectionId = ?, accessLevel = ? WHERE userId = ? AND collectionId = ?;";
            await connection.query(sql_query, [req.body.newCollectionId, req.body.accessLevel, req.body.userId, req.body.oldCollectionId]);

            const message = {
                userId: req.body.userId,
                collectionId: req.body.newCollectionId,
                accessLevel: req.body.accessLevel,
            };
            return message;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.deletePermission = async function deletePermission(req, res, next) {
    if (!req.params.userId) {
        console.info('getPermissions_UserCollection userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.collectionId) {
        console.info('getPermissions_UserCollection collectionId not provided.');
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM  poamtracking.collectionpermissions WHERE userId = ? AND collectionId = ?";
            await connection.query(sql, [req.params.userId, req.params.collectionId]);

            return { permissions: [] };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}