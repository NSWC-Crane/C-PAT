/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const dbUtils = require('./utils');
const logger = require('../../utils/logger');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getUsers = async function getUsers() {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.user;";
            let [rows] = await connection.query(sql);

            const users = await Promise.all(rows.map(async (user) => {
                const sqlPermissions = "SELECT * FROM cpat.collectionpermissions WHERE userId = ?";
                const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

                const permissions = permissionRows.map(permission => ({
                    userId: permission.userId,
                    collectionId: permission.collectionId,
                    accessLevel: permission.accessLevel,
                }));

                return {
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
                    officeOrg: user.officeOrg,
                    defaultTheme: user.defaultTheme,
                    isAdmin: user.isAdmin,
                    permissions: permissions
                };
            }));

            return users;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getCurrentUser = async function getCurrentUser(email) {
    try {
        return await withConnection(async (connection) => {
            const sqlUser = "SELECT * FROM user WHERE email = ?";
            const [userRows] = await connection.query(sqlUser, [email]);

            if (userRows.length === 0) {
                throw new Error("User not found");
            }

            const user = userRows[0];

            const sqlPermissions = "SELECT * FROM cpat.collectionpermissions WHERE userId = ?";
            const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

            const permissions = permissionRows.map(permission => ({
                userId: permission.userId,
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
            }));

            return {
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
                officeOrg: user.officeOrg,
                defaultTheme: user.defaultTheme,
                isAdmin: user.isAdmin,
                permissions: permissions
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserByUserID = async function getUserByUserID(userId) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userId = ?";
            const [userRows] = await connection.query(sql, [userId]);

            if (userRows.length === 0) {
                throw new Error("User not found");
            }

            const user = userRows[0];

            const sqlPermissions = "SELECT * FROM cpat.collectionpermissions WHERE userId = ?";
            const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

            const permissions = permissionRows.map(permission => ({
                userId: permission.userId,
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
            }));

            return {
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
                officeOrg: user.officeOrg,
                defaultTheme: user.defaultTheme,
                isAdmin: user.isAdmin,
                permissions: permissions
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserByUserName = async function getUserByUserName(userName) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userName = ?";
            const [userRows] = await connection.query(sql, [userName]);

            if (userRows.length === 0) {
                throw new Error("User not found");
            }

            const user = userRows[0];
            const sqlPermissions = "SELECT * FROM cpat.collectionpermissions WHERE userId = ?";
            const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

            const permissions = permissionRows.map(permission => ({
                userId: permission.userId,
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
            }));

            const userObject = {
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
                officeOrg: user.officeOrg,
                defaultTheme: user.defaultTheme,
                isAdmin: user.isAdmin,
                permissions: permissions
            };
            return userObject;
        });
    } catch (error) {
        logger.writeError('Error in getUserByUserName:', error);
        throw error;
    }
};

exports.getBasicUserByUserID = async function getBasicUserByUserID(userId) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userId = ?";
            const [userRows] = await connection.query(sql, [userId]);

            if (userRows.length === 0) {
                throw new Error("User not found");
            }

            const user = userRows[0];

            return {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                officeOrg: user.officeOrg,
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUser = async function updateUser(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "UPDATE user SET firstName = ?, lastName = ?, email = ?, lastAccess = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, officeOrg = ?, defaultTheme = ?, isAdmin = ? WHERE userId = ?";

            await connection.query(sql, [
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                req.body.lastAccess,
                req.body.lastCollectionAccessedId,
                req.body.accountStatus,
                `${req.body.firstName} ${req.body.lastName}`,
                req.body.officeOrg,
                req.body.defaultTheme,
                req.body.isAdmin,
                req.body.userId
            ]);

            sql = "SELECT * FROM user WHERE userId = ?";
            let [updatedUser] = await connection.query(sql, [req.body.userId]);

            return updatedUser[0];
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteUserByUserID = async function deleteUserByUserID(userId, username, displayName) {
    try {
        return await withConnection(async (connection) => {
            let sql = 'DELETE FROM `user` WHERE `userId`= ?';
            await connection.query(sql, [userId]);

            logger.writeInfo("usersService", 'log', { event: 'removed account', userId: userId });
            logger.writeInfo("usersService", 'notification', { event: 'removed account', userId: userId });

            return { message: "User deleted" };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.loginout = async function loginout(req, res, next) {
    let message = { message: "" };
    if (req.body.inout == 'logIn') {
        logger.writeInfo("usersService", 'info', { event: 'Logged In' });
        message.message = "Login Success";
    } else {
        logger.writeInfo("usersService", 'info', { event: 'Logged Out' });
        message.message = "Logout Success";
    }
    return message;
};

module.exports.deleteUserByUserID = async function deleteUserByUserID(userId, req, res, next) {
    return await withConnection(async (connection) => {
        let sql_query = 'DELETE FROM `user` WHERE `id`=' + userId;
        await connection.query(sql_query);

        logger.writeInfo("usersService", 'log', { event: 'removed account', userId: userId });
        logger.writeInfo("usersService", 'notification', { event: 'removed account', userId: userId });

        let messageReturned = new Object();
        messageReturned.text = "User deleted";
        return messageReturned;
    });
};

exports.refresh = async function refresh(userId, body, projection, userObject) {
    return await withConnection(async (connection) => {
        let sql = "SELECT * FROM user WHERE userId = ?";
        let [row] = await connection.query(sql, [userId]);
        return row[0];
    });
};