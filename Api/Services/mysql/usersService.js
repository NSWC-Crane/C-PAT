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
const config = require('../../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const tokenGenerator = require('../../utils/token-generator');
const auth = require('../../utils/auth');
const writeLog = require('../../utils/poam_logger');

async function withConnection(callback) {
    const pool = dbUtils.getPool();
	const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getUserObject = async function getUserObject(body, projection, userObject) {
    res.status(201).json({ message: "getUser (Service) Method Called successfully" });
};

exports.refresh = async function refresh(userId, body, projection, userObject) {
    return await withConnection(async (connection) => {
        let sql = "SELECT * FROM user WHERE userId = ?";
        let [row] = await connection.query(sql, [userId]);
        return row[0];
    });
};

exports.getUserByUserID = async function getUserByUserID(userId, body, projection, userObject) {
    return await withConnection(async (connection) => {
        let sql = "SELECT * FROM user WHERE userId = ?";
        let [row] = await connection.query(sql, [userId]);
        return row[0];
    });
};

exports.getCurrentUser = async function getCurrentUser(req) {
    if (!req.userObject || !req.userObject.email) {
        return { error: "User is not authenticated", status: 400 };
    }

    try {
        const userEmail = req.userObject.email;
        return await withConnection(async (connection) => {
            const sqlUser = "SELECT * FROM user WHERE userEmail = ?";
            const [rows] = await connection.query(sqlUser, [userEmail]);

            if (rows.length > 0) {
                const user = rows[0];

                const sqlPermissions = "SELECT * FROM poamtracking.collectionpermissions WHERE userId = ?";
                const [rowPermissions] = await connection.query(sqlPermissions, [user.userId]);

                const permissions = rowPermissions.map(permission => ({
                    userId: permission.userId,
                    collectionId: permission.collectionId,
                    canOwn: permission.canOwn,
                    canMaintain: permission.canMaintain,
                    canApprove: permission.canApprove,
                    canView: permission.canView
                }));

                const response = {
                    userId: user.userId,
                    userName: user.userName,
                    userEmail: user.userEmail,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    created: user.created,
                    lastAccess: user.lastAccess,
                    lastCollectionAccessedId: user.lastCollectionAccessedId,
                    accountStatus: user.accountStatus,
                    fullName: user.fullName,
                    defaultTheme: user.defaultTheme,
                    isAdmin: user.isAdmin,
                    permissions: permissions
                };

                return { data: response, status: 200 };
            } else {
                return { error: "User email not found", status: 404 };
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return { error: "Internal Server Error", status: 500 };
    }
};

exports.getUsers = async function getUsers(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.user;";
            let [rows] = await connection.query(sql);

            var size = Object.keys(rows).length;
            var users = {
                users: []
            };

            for (let counter = 0; counter < size; counter++) {
                const sqlPermissions = "SELECT * FROM poamtracking.collectionpermissions WHERE userId = ?";
                const [rowPermissions] = await connection.query(sqlPermissions, [rows[counter].userId]);

                const permissions = rowPermissions.map(permission => ({
                    userId: permission.userId,
                    collectionId: permission.collectionId,
                    canOwn: permission.canOwn,
                    canMaintain: permission.canMaintain,
                    canApprove: permission.canApprove,
                    canView: permission.canView
                }));

                users.users.push({
                    "userId": rows[counter].userId,
                    "userName": rows[counter].userName,
                    "userEmail": rows[counter].userEmail,
                    "firstName": rows[counter].firstName,
                    "lastName": rows[counter].lastName,
                    "created": rows[counter].created,
                    "lastAccess": rows[counter].lastAccess,
                    "lastCollectionAccessedId": rows[counter].lastCollectionAccessedId,
                    "accountStatus": rows[counter].accountStatus,
                    "fullName": rows[counter].fullName,
                    "defaultTheme": rows[counter].defaultTheme,
                    "isAdmin": rows[counter].isAdmin,
                    "permissions": permissions
                });
            }

            return { users };
        });
    } catch (error) {
        console.error('Error in getUsers:', error);
        return { error: "Internal Server Error", status: 500 };
    }
};

exports.getUserByNamePassword = async function getUserByNamePassword(username, callback) {
    function loginObj(userId, userName, email, created, lastAccess, firstName, lastName,
        lastCollectionAccessedId, defaultTheme) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.created = created;
        this.lastAccess = lastAccess;
        this.firstName = firstName;
        this.lastName = lastName;
        this.lastCollectionAccessedId = lastCollectionAccessedId;
        this.defaultTheme = defaultTheme;
        this.isAdmin = isAdmin;
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userName = ?";
            let [rowUser] = await connection.query(sql, [username]);

            let response = new loginObj(
                rowUser[0].userId,
                rowUser[0].userName,
                rowUser[0].userEmail,
                rowUser[0].created,
                rowUser[0].lastAcces ? rowUser[0].lastAcces : '',
                rowUser[0].firstName,
                rowUser[0].lastName,
                rowUser[0].lastCollectionAccessedId,
                rowUser[0].defaultTheme,
                rowUser[0].isAdmin
            );

            return callback(null, response);
        });
    } catch (error) {
        console.error(error);
        return callback(error);
    }
};

exports.updateUser = async function updateUser(req, res, next) {
    let userId = req.body.userId;

    if (!req.body.userEmail) {
        console.info('Post usersService updateUser: email not provided.');
        return next({
            status: 422,
            errors: {
                email: 'is required',
            }
        });
    }

    if (!req.body.userId) {
        console.info('Post usersService updateUser: userId not provided.');
        return next({
            status: 422,
            errors: {
                email: 'is required',
            }
        });
    }

    let updateSettingsOnly = (+req.body.updateSettingsOnly) ? +req.body.updateSettingsOnly : 0;

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * from user WHERE userId = ?";
            let [currentUser] = await connection.query(sql, [userId]);

            let fullName = `${req.body.firstName} ${req.body.lastName}`;
            sql = "UPDATE user SET firstName = ?, lastName = ?, userEmail = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, defaultTheme = ?, isAdmin = ? WHERE userId = ?";

            await connection.query(sql, [
                req.body.firstName,
                req.body.lastName,
                req.body.userEmail,
                req.body.lastCollectionAccessedId,
                req.body.accountStatus,
                fullName,
                req.body.defaultTheme,
                req.body.isAdmin,
                userId,
            ]);

            sql = "SELECT * from user WHERE userId = ?";
            let [rowUser] = await connection.query(sql, [userId]);

            if (rowUser[0] != undefined) {
                if (updateSettingsOnly != 1) {
                    writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'modified account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });
                    writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'modified account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });

                    if (rowUser[0].accountStatus == 'ACTIVE' && currentUser[0].accountStatus != 'ACTIVE') {
                        writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'enabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });
                        writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'enabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });
                    }

                    if (rowUser[0].accountStatus == 'EXPIRED' && currentUser[0].accountStatus != "EXPIRED") {
                        writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'disabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });
                        writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'disabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail });
                    }
                }

                res.status(201).json(rowUser[0]);
            } else {
                return next({
                    status: 422,
                    errors: {
                        message: 'update failed',
                    }
                });
            }
        });
    } catch (error) {
        console.info('Post usersService login: user login failed.', error);
        return next({
            status: 400,
            message: "Login failed"
        });
    }
};

exports.loginout = async function loginout(req, res, next) {
    let message = { message: "" };
    if (req.body.inout == 'logIn') {
        writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'logged in' });
        message.message = "Login Success";
    } else {
        writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'logged out' });
        message.message = "Logout Success";
    }
    return message;
};

module.exports.deleteUserByUserID = async function deleteUserByUserID(userId, req, res, next) {
    return await withConnection(async (connection) => {
        let sql_query = 'DELETE FROM `user` WHERE `id`=' + userId;
        await connection.query(sql_query);

        writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'removed account', userId: userId });
        writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'removed account', userId: userId });

        let messageReturned = new Object();
        messageReturned.text = "User deleted";
        return messageReturned;
    });
};

module.exports.generateJWT = async function (previousPayload, jwtSignOptions, user, req) {
    let payload = Object.assign({}, previousPayload, {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        created: user.created,
        lastAccess: user.lastAccess,
        lastCollectionAccessedId: user.lastCollectionAccessedId,
        accountStatus: user.accountStatus,
        fullName: user.fullName,
        defaultTheme: user.defaultTheme
    });

    if (payload.collections) {
        try {
            const permissions = "";
            if (!permissions) {
                console.log("deleting payload.collection...");
                delete payload.collections;
            } else {
                for (let permission in permissions) {
                    let assignedCollections = {
                        collectionId: permission.collectionId,
                        canOwn: permission.canOwn,
                        canMaintain: permission.canMaintain,
                        canApprove: permission.canApprove,
                        canView: permission.canView
                    };
                    payload.collections.push(assignedCollections);
                }
            }
        } catch (err) {
            console.log("ERROR: collections is missing from payload.");
            console.log(err);
            throw err;
        }
    } else if (this.lastCollectionAccessedId) {
        payload.lastCollectionAccessedId = this.lastCollectionAccessedId;
    } else if (user.accountStatus === 'Pending') {
        console.log("User account is pending, not setting payload...");
    } else {
        writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'No lastCollectionAccessedId, not setting payload.lastCollectionAccessedId at all...' });
    }

    return tokenGenerator.sign(payload, jwtSignOptions);
};