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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getCollectionPermission = async function getCollectionPermission(userName, collectionId, req, res, next) {
    function collectionObj(collectionId, collectionName, description, created, poamCount) {
        this.collectionId = collectionId
        this.collectionName = collectionName
        this.description = description
        this.created = created
        this.poamCount = poamCount
    }

    try {
        let userInfo = await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userName = ?";
            let [row] = await connection.query(sql, [userName]);
            let userId = row[0].userId;
            let isAdmin = row[0].isAdmin;

            try {
                let sql = "SELECT * FROM collectionpermissions WHERE userId = ? AND collectionId = ?";
                let [row] = await connection.query(sql, [userId, collectionId]);
                let userName = row[0].userName;
                return { userId, isAdmin, userName };
            } catch (error) {
                if (!isAdmin) {
                    return { error: "User does not have access to this collection." };
                }
                return { userId, isAdmin };
            }
        });

        if (userInfo.error) {
            return { error: userInfo.error };
        }

        let collection = await withConnection(async (connection) => {
            let sql = "SELECT * FROM collection WHERE collectionId = ?";
            let [row] = await connection.query(sql, [collectionId]);
            return { ...row[0] };
        });

        return collection;
    } catch (error) {
        return { error: error.message };
    }
}

exports.getCollectionPermissions = async function getCollectionPermissions(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        const permissions = await withConnection(async (connection) => {
            let sql = "SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.email FROM cpat.collectionpermissions T1 " +
                "INNER JOIN cpat.user T2 ON t1.userId = t2.userId WHERE collectionId = ?;"

            let [rowPermissions] = await connection.query(sql, req.params.collectionId);
            return rowPermissions.map(permission => ({
                ...permission
            }));
        });

        return permissions;
    } catch (error) {
        return { error: error.message };
    }
}

exports.postPermission = async function postPermission(req, res, next) {
    if (!req.body.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                oldCollectionId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "INSERT INTO cpat.collectionpermissions (accessLevel, userId, collectionId) VALUES (?, ?, ?);";
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
                let fetchSql = "SELECT * FROM cpat.collectionpermissions WHERE userId = ? AND collectionId = ?";
                const [existingPermission] = await connection.query(fetchSql, [req.body.userId, req.body.collectionId]);
                return existingPermission[0];
            });
        }
        else {
            return { error: error.message };
        }
    }
}

exports.putPermission = async function putPermission(req, res, next) {
    if (!req.body.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.oldCollectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    if (!req.body.accessLevel) {
        return next({
            status: 400,
            errors: {
                accessLevel: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.collectionpermissions SET collectionId = ?, accessLevel = ? WHERE userId = ? AND collectionId = ?;";
            await connection.query(sql_query, [req.body.newCollectionId, req.body.accessLevel, req.body.userId, req.body.oldCollectionId]);

            const message = {
                userId: req.body.userId,
                collectionId: req.body.newCollectionId,
                accessLevel: req.body.accessLevel,
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deletePermission = async function deletePermission(req, res, next) {
    if (!req.params.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM  cpat.collectionpermissions WHERE userId = ? AND collectionId = ?";
            await connection.query(sql, [req.params.userId, req.params.collectionId]);

            return { permissions: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}