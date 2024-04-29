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
                    userEmail: user.userEmail,
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
        console.error('Error in getUsers:', error);
        throw error;
    }
};

exports.getCurrentUser = async function getCurrentUser(userEmail) {
    try {
        return await withConnection(async (connection) => {
            const sqlUser = "SELECT * FROM user WHERE userEmail = ?";
            const [userRows] = await connection.query(sqlUser, [userEmail]);

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
                userEmail: user.userEmail,
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
        console.error('Error in getCurrentUser:', error);
        throw error;
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
                userEmail: user.userEmail,
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
        console.error('Error in getUser:', error);
        throw error;
    }
};

exports.updateUser = async function updateUser(userId, userData) {
    try {
        return await withConnection(async (connection) => {
            let sql = "UPDATE user SET firstName = ?, lastName = ?, userEmail = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, officeOrg = ?, defaultTheme = ?, isAdmin = ? WHERE userId = ?";

            await connection.query(sql, [
                userData.firstName,
                userData.lastName,
                userData.userEmail,
                userData.lastCollectionAccessedId,
                userData.accountStatus,
                `${userData.firstName} ${userData.lastName}`,
                userData.officeOrg,
                userData.defaultTheme,
                userData.isAdmin,
                userId
            ]);

            sql = "SELECT * FROM user WHERE userId = ?";
            let [updatedUser] = await connection.query(sql, [userId]);

            if (updatedUser.length === 0) {
                throw new Error("User update failed");
            }

            writeLog.writeLog(3, "usersService", 'log', userData.userName, userData.fullName, { event: 'modified account', userId: userId });
            writeLog.writeLog(3, "usersService", 'notification', userData.userName, userData.fullName, { event: 'modified account', userId: userId });

            return updatedUser[0];
        });
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw error;
    }
};

exports.deleteUserByUserID = async function deleteUserByUserID(userId, username, displayName) {
    try {
        return await withConnection(async (connection) => {
            let sql = 'DELETE FROM `user` WHERE `userId`= ?';
            await connection.query(sql, [userId]);

            writeLog.writeLog(3, "usersService", 'log', username, displayName, { event: 'removed account', userId: userId });
            writeLog.writeLog(3, "usersService", 'notification', username, displayName, { event: 'removed account', userId: userId });

            return { message: "User deleted" };
        });
    } catch (error) {
        console.error('Error in deleteUserByUserID:', error);
        throw error;
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

exports.refresh = async function refresh(userId, body, projection, userObject) {
    return await withConnection(async (connection) => {
        let sql = "SELECT * FROM user WHERE userId = ?";
        let [row] = await connection.query(sql, [userId]);
        return row[0];
    });
};