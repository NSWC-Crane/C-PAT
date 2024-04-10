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

exports.getPermissions_UserCollection = async function getPermissions_UserCollection(req, res, next) {
    if (!req.params.userId) {
        console.info('getPermissions_UserCollection userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.collectionId) {
        console.info('getPermissions_UserCollection collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM  poamtracking.collectionpermissions WHERE userId = ? AND collectionId = ?";
            let [rowPermissions] = await connection.query(sql, [req.params.userId, req.params.collectionId]);

            var permissions = {
                permissions: rowPermissions.map(row => ({
                    userId: row.userId,
                    collectionId: row.collectionId,
                    canOwn: row.canOwn,
                    canMaintain: row.canMaintain,
                    canApprove: row.canApprove,
                    canView: row.canView
                }))
            };

            return permissions;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.postPermission = async function postPermission(req, res, next) {
    if (!req.body.userId) {
        console.info('postPermissions userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.collectionId) {
        console.info('postPermission collectionId not provided.');
        return next({
            status: 422,
            errors: {
                oldCollectionId: 'is required',
            }
        });
    }

    if (!req.body.canOwn) req.body.canOwn = 0;
    if (!req.body.canMaintain) req.body.canMaintain = 0;
    if (!req.body.canApprove) req.body.canApprove = 0;
    if (!req.body.canView) req.body.canView = 1;

    try {
        return await withConnection(async (connection) => {
            let sql_query = "INSERT INTO poamtracking.collectionpermissions (canOwn, canMaintain, canApprove, canView, userId, collectionId) VALUES (?, ?, ?, ?, ?, ?);";
            await connection.query(sql_query, [req.body.canOwn, req.body.canMaintain, req.body.canApprove, req.body.canView, req.body.userId, req.body.collectionId]);

            const message = {
                userId: req.body.userId,
                collectionId: req.body.collectionId,
                canOwn: req.body.canOwn,
                canMaintain: req.body.canMaintain,
                canApprove: req.body.canApprove,
                canView: req.body.canView
            };
            return message;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.putPermission = async function putPermission(req, res, next) {
    if (!req.body.userId) {
        console.info('postPermissions userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.oldCollectionId) {
        console.info('putPermissions oldCollectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    if (!req.body.canOwn) req.body.canOwn = 0;
    if (!req.body.canMaintain) req.body.canMaintain = 0;
    if (!req.body.canApprove) req.body.canApprove = 0;
    if (!req.body.canView) req.body.canView = 1;

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE poamtracking.collectionpermissions SET collectionId= ?, canOwn= ?, canMaintain= ?, canApprove= ?, canView= ? WHERE userId = ? AND collectionId = ?;";
            await connection.query(sql_query, [req.body.newCollectionId, req.body.canOwn, req.body.canMaintain, req.body.canApprove, req.body.canView, req.body.userId, req.body.oldCollectionId]);

            const message = {
                userId: req.body.userId,
                collectionId: req.body.collectionId,
                canOwn: req.body.canOwn,
                canMaintain: req.body.canMaintain,
                canApprove: req.body.canApprove,
                canView: req.body.canView
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
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.collectionId) {
        console.info('getPermissions_UserCollection collectionId not provided.');
        return next({
            status: 422,
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