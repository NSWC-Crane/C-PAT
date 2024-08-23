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

exports.getUsers = async function getUsers(elevate, userId) {
    try {
        return await withConnection(async (connection) => {
            if (elevate) {
                const userSql = "SELECT * FROM user WHERE userId = ?";
                const [userRows] = await connection.query(userSql, [userId]);

                if (userRows.length === 0) {
                    throw new SmError.PrivilegeError('User not found');
                }

                const isAdmin = userRows[0].isAdmin;

                if (isAdmin !== 1) {
                    throw new SmError.PrivilegeError('User requesting Elevate without admin permissions.');
                }

                const allUsersSql = "SELECT * FROM cpat.user";
                const [allUsersRows] = await connection.query(allUsersSql);

                const users = await Promise.all(allUsersRows.map(async (user) => {
                    const permissionsSql = "SELECT * FROM cpat.collectionpermissions WHERE userId = ?";
                    const [permissionRows] = await connection.query(permissionsSql, [user.userId]);

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
                        points: user.points,
                        isAdmin: user.isAdmin,
                        lastClaims: user.lastClaims,
                        permissions: permissions
                    };
                }));

                return users;
            } else {
                throw new Error('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getCurrentUser = async function getCurrentUser(userId) {
    try {
        return await withConnection(async (connection) => {
            const sqlUser = "SELECT * FROM user WHERE userId = ?";
            const [userRows] = await connection.query(sqlUser, [userId]);

            if (userRows.length === 0) {
                return userRows[0];
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
                points: user.points,
                isAdmin: user.isAdmin,
                lastClaims: user.lastClaims,
                permissions: permissions
            }; 
            return userObject;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserByUserID = async function getUserByUserID(requestorId, elevate, userId) {
    try {
        return await withConnection(async (connection) => {
            if (elevate) {
                const userSql = "SELECT * FROM user WHERE userId = ?";
                const [userRows] = await connection.query(userSql, [requestorId]);

                if (userRows.length === 0) {
                    throw new SmError.PrivilegeError('User not found');
                }

                const isAdmin = userRows[0].isAdmin;

                if (isAdmin !== 1) {
                    throw new SmError.PrivilegeError('User requesting Elevate without admin permissions.');
                }

                let sql = "SELECT * FROM user WHERE userId = ?";
                const [userQueryRows] = await connection.query(sql, [userId]);

                if (userQueryRows.length === 0) {
                    return userQueryRows[0];
                }

                const user = userQueryRows[0];

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
                    points: user.points,
                    isAdmin: user.isAdmin,
                    lastClaims: user.lastClaims,
                    permissions: permissions
                };
            } else {
                throw new Error('Elevate parameter is required');
            }
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
                return userRows[0];
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
                points: user.points,
                isAdmin: user.isAdmin,
                lastClaims: user.lastClaims,
                permissions: permissions
            };
            return userObject;
        });
    } catch (error) {
        logger.writeError('Error in getUserByUserName:', error);
        throw error;
    }
};

exports.updateUser = async function updateUser(userId, elevate, req) {
    try {
        return await withConnection(async (connection) => {
            if (elevate) {
                const userSql = "SELECT * FROM user WHERE userId = ?";
                const [userRows] = await connection.query(userSql, [userId]);

                if (userRows.length === 0) {
                    throw new SmError.PrivilegeError('User not found');
                }

                const isAdmin = userRows[0].isAdmin;

                if (isAdmin !== 1) {
                    throw new SmError.PrivilegeError('User requesting Elevate without admin permissions.');
                }

            let sql = "UPDATE user SET firstName = ?, lastName = ?, email = ?, lastAccess = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, officeOrg = ?, defaultTheme = ?, isAdmin = ?, points = ? WHERE userId = ?";

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
                req.body.points,
                req.body.userId
            ]);

            sql = "SELECT * FROM user WHERE userId = ?";
            let [updatedUser] = await connection.query(sql, [req.body.userId]);

            return updatedUser[0];
            } else {
                throw new Error('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUserTheme = async function updateUserTheme(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "UPDATE user SET defaultTheme = ? WHERE userId = ?";

            await connection.query(sql, [
                req.body.defaultTheme,
                req.body.userId
            ]);

            return { success: true, message: 'Theme updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUserPoints = async function updateUserPoints(elevate, req) {
    try {
        return await withConnection(async (connection) => {
            let sql = "UPDATE user SET points = ? WHERE userId = ?";

            await connection.query(sql, [
                req.body.points,
                req.body.userId
            ]);

            return { success: true, message: 'User points updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.setUserData = async function setUserData(userObject, fields, newUser) {
    try {
        return await withConnection(async (connection) => {
            console.log("setUserData!@!@!@", userObject, fields, newUser);
            let insertColumns = ['userName']
            let updateColumns = ['userId = LAST_INSERT_ID(userId)']
            let binds = [userObject.userName]

            if (newUser && userObject.firstName) {
                insertColumns.push('firstName')
                updateColumns.push('firstName = VALUES(firstName)')
                binds.push(userObject.firstName)
            }
            if (newUser && userObject.lastName) {
                insertColumns.push('lastName')
                updateColumns.push('lastName = VALUES(lastName)')
                binds.push(userObject.lastName)
            }
            if (newUser && userObject.fullName) {
                insertColumns.push('fullName')
                updateColumns.push('fullName = VALUES(fullName)')
                binds.push(userObject.fullName)
            }
            if (newUser && userObject.email) {
                insertColumns.push('email')
                updateColumns.push('email = VALUES(email)')
                binds.push(userObject.email)
            }
            if (fields.lastAccess) {
                insertColumns.push('lastAccess')
                updateColumns.push('lastAccess = VALUES(lastAccess)')
                binds.push(fields.lastAccess)
            }
            if (fields.lastClaims) {
                insertColumns.push('lastClaims')
                updateColumns.push('lastClaims = VALUES(lastClaims)')
                binds.push(JSON.stringify(fields.lastClaims))
            }
            let sqlUpsert = `INSERT INTO cpat.user (
    ${insertColumns.join(',\n')}
  ) VALUES ? ON DUPLICATE KEY UPDATE 
    ${updateColumns.join(',\n')}`
            let [result] = await connection.query(sqlUpsert, [[binds]])
            return result;
        });
    } catch (error) {
        return { error: error.message };
    }
};


exports.setLastAccess = async function (userId, timestamp) {
    try {
        return await withConnection(async (connection) => {
            let sql = `UPDATE user SET lastAccess = ? where userId = ?`;
            await connection.query(sql, [timestamp, userId]);
            return true
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteUser = async function deleteUser(requestorId, elevate, userId) {
    try {
        return await withConnection(async (connection) => {
            if (elevate) {
                const userSql = "SELECT * FROM user WHERE userId = ?";
                const [userRows] = await connection.query(userSql, [requestorId]);

                if (userRows.length === 0) {
                    throw new SmError.PrivilegeError('User not found');
                }

                const isAdmin = userRows[0].isAdmin;

                if (isAdmin !== 1) {
                    throw new SmError.PrivilegeError('User requesting Elevate without admin permissions.');
                }

            let sql = 'DELETE FROM `user` WHERE `userId`= ?';
            await connection.query(sql, [userId]);

            logger.writeInfo("usersService", 'log', { event: 'removed account', userId: userId });
            logger.writeInfo("usersService", 'notification', { event: 'removed account', userId: userId });

            return { message: "User deleted" };
            } else {
                throw new Error('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};