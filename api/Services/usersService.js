/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const dbUtils = require('./utils');
const logger = require('../utils/logger');
const SmError = require('../utils/error');
const config = require('../utils/config');

const privilegeGetter = new Function('obj', 'return obj?.' + config.oauth.claims.privilegesChain + ' || [];');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getUsers = async function getUsers(elevate, req) {
    try {
        return await withConnection(async connection => {
            if (elevate && req.userObject.isAdmin === true) {
                const allUsersSql = `SELECT * FROM ${config.database.schema}.user`;
                const [allUsersRows] = await connection.query(allUsersSql);
                const users = await Promise.all(
                    allUsersRows.map(async user => {
                        const permissionsSql = `SELECT * FROM ${config.database.schema}.collectionpermissions WHERE userId = ?`;
                        const [permissionRows] = await connection.query(permissionsSql, [user.userId]);
                        const permissions = permissionRows.map(permission => ({
                            userId: permission.userId,
                            collectionId: permission.collectionId,
                            accessLevel: permission.accessLevel,
                        }));

                        const assignedTeamSql = `SELECT * FROM ${config.database.schema}.userassignedteams WHERE userId = ?`;
                        const [assignedTeamsRows] = await connection.query(assignedTeamSql, [user.userId]);
                        const assignedTeams = assignedTeamsRows.map(assignedTeam => ({
                            assignedTeamId: assignedTeam.assignedTeamId,
                            accessLevel: assignedTeam.accessLevel,
                        }));

                        let isAdmin;
                        try {
                            isAdmin = privilegeGetter(user.lastClaims).includes('admin');
                        } catch (e) {
                            isAdmin = false;
                        }

                        return {
                            userId: user.userId,
                            userName: user.userName,
                            email: user.email,
                            phoneNumber: user.phoneNumber,
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
                            isAdmin: isAdmin,
                            lastClaims: user.lastClaims,
                            permissions: permissions,
                            assignedTeams: assignedTeams,
                        };
                    })
                );
                return users;
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getCurrentUser = async function getCurrentUser(req) {
    try {
        return await withConnection(async connection => {
            const sqlUser = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
            const [userRows] = await connection.query(sqlUser, [req.userObject.userId]);

            if (userRows.length === 0) {
                return userRows[0];
            }

            const user = userRows[0];

            const sqlPermissions = `SELECT * FROM ${config.database.schema}.collectionpermissions WHERE userId = ?`;
            const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

            const permissions = permissionRows.map(permission => ({
                userId: permission.userId,
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
            }));

            const assignedTeamSql = `SELECT * FROM ${config.database.schema}.userassignedteams WHERE userId = ?`;
            const [assignedTeamsRows] = await connection.query(assignedTeamSql, [user.userId]);
            const assignedTeams = assignedTeamsRows.map(assignedTeam => ({
                assignedTeamId: assignedTeam.assignedTeamId,
                accessLevel: assignedTeam.accessLevel,
            }));

            let isAdmin;
            try {
                isAdmin = privilegeGetter(user.lastClaims).includes('admin');
            } catch (e) {
                isAdmin = false;
            }

            const userObject = {
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                phoneNumber: user.phoneNumber,
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
                isAdmin: isAdmin,
                lastClaims: user.lastClaims,
                permissions: permissions,
                assignedTeams: assignedTeams,
            };
            return userObject;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserByUserID = async function getUserByUserID(req, elevate) {
    try {
        return await withConnection(async connection => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
                const [userQueryRows] = await connection.query(sql, [req.params.userId]);

                if (userQueryRows.length === 0) {
                    return userQueryRows[0];
                }

                const user = userQueryRows[0];

                const sqlPermissions = `SELECT * FROM ${config.database.schema}.collectionpermissions WHERE userId = ?`;
                const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

                const permissions = permissionRows.map(permission => ({
                    userId: permission.userId,
                    collectionId: permission.collectionId,
                    accessLevel: permission.accessLevel,
                }));

                const assignedTeamSql = `SELECT * FROM ${config.database.schema}.userassignedteams WHERE userId = ?`;
                const [assignedTeamsRows] = await connection.query(assignedTeamSql, [user.userId]);
                const assignedTeams = assignedTeamsRows.map(assignedTeam => ({
                    assignedTeamId: assignedTeam.assignedTeamId,
                    accessLevel: assignedTeam.accessLevel,
                }));

                let isAdmin;
                try {
                    isAdmin = privilegeGetter(user.lastClaims).includes('admin');
                } catch (e) {
                    isAdmin = false;
                }

                return {
                    userId: user.userId,
                    userName: user.userName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
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
                    isAdmin: isAdmin,
                    lastClaims: user.lastClaims,
                    permissions: permissions,
                    assignedTeams: assignedTeams,
                };
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserByUserName = async function getUserByUserName(userName) {
    try {
        return await withConnection(async connection => {
            let sql = `SELECT * FROM ${config.database.schema}.user WHERE userName = ?`;
            const [userRows] = await connection.query(sql, [userName]);
            if (userRows.length === 0) {
                return userRows[0];
            }

            const user = userRows[0];
            const sqlPermissions = `SELECT * FROM ${config.database.schema}.collectionpermissions WHERE userId = ?`;
            const [permissionRows] = await connection.query(sqlPermissions, [user.userId]);

            const permissions = permissionRows.map(permission => ({
                userId: permission.userId,
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
            }));

            let isAdmin;
            try {
                isAdmin = privilegeGetter(user.lastClaims).includes('admin');
            } catch (e) {
                isAdmin = false;
            }

            const userObject = {
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                phoneNumber: user.phoneNumber,
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
                isAdmin: isAdmin,
                lastClaims: user.lastClaims,
                permissions: permissions,
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
        return await withConnection(async connection => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql = `UPDATE ${config.database.schema}.user SET firstName = ?, lastName = ?, email = ?, phoneNumber = ?, lastAccess = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, officeOrg = ?, defaultTheme = ?, points = ? WHERE userId = ?`;

                await connection.query(sql, [
                    req.body.firstName,
                    req.body.lastName,
                    req.body.email,
                    req.body.phoneNumber,
                    req.body.lastAccess,
                    req.body.lastCollectionAccessedId,
                    req.body.accountStatus,
                    `${req.body.firstName} ${req.body.lastName}`,
                    req.body.officeOrg,
                    req.body.defaultTheme,
                    req.body.points,
                    req.body.userId,
                ]);

                sql = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
                let [updatedUser] = await connection.query(sql, [req.body.userId]);

                return updatedUser[0];
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUserTheme = async function updateUserTheme(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `UPDATE ${config.database.schema}.user SET defaultTheme = ? WHERE userId = ?`;

            await connection.query(sql, [req.body.defaultTheme, req.body.userId]);

            return { success: true, message: 'Theme updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUserPoints = async function updateUserPoints(elevate, req) {
    try {
        return await withConnection(async connection => {
            if (elevate && req.userObject.isAdmin === true) {
                let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;

                await connection.query(sql, [req.body.points, req.body.userId]);

                return { success: true, message: 'User points updated successfully' };
            } else {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.hourlyPoints = async function hourlyPoints(userId) {
    try {
        return await withConnection(async connection => {
            let findUserSql = `SELECT points from ${config.database.schema}.user WHERE userId = ?`;
            const [response] = await connection.query(findUserSql, [userId]);
            const points = response[0].points + 1;

            let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;
            await connection.query(sql, [points, userId]);
            return { success: true, message: 'User points updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.dailyPoints = async function dailyPoints(userId) {
    try {
        return await withConnection(async connection => {
            let findUserSql = `SELECT points from ${config.database.schema}.user WHERE userId = ?`;
            const [response] = await connection.query(findUserSql, [userId]);
            const points = response[0].points + 5;

            let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;
            await connection.query(sql, [points, userId]);
            return { success: true, message: 'User points updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateUserLastCollectionAccessed = async function updateUserLastCollectionAccessed(userId, lastCollectionAccessedId) {
    try {
        return await withConnection(async connection => {
            let sql = `UPDATE ${config.database.schema}.user SET lastCollectionAccessedId = ? WHERE userId = ?`;
            await connection.query(sql, [lastCollectionAccessedId, userId]);

            return { success: true, message: 'User lastCollectionAccessedId updated successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.setUserData = async function setUserData(userObject, fields, newUser) {
    try {
        return await withConnection(async connection => {
            let insertColumns = ['userName'];
            let updateColumns = ['userId = LAST_INSERT_ID(userId)'];
            let binds = [userObject.userName];

            if (newUser && userObject.firstName) {
                insertColumns.push('firstName');
                updateColumns.push('firstName = VALUES(firstName)');
                binds.push(userObject.firstName);
            }
            if (newUser && userObject.lastName) {
                insertColumns.push('lastName');
                updateColumns.push('lastName = VALUES(lastName)');
                binds.push(userObject.lastName);
            }
            if (newUser && userObject.fullName) {
                insertColumns.push('fullName');
                updateColumns.push('fullName = VALUES(fullName)');
                binds.push(userObject.fullName);
            }
            if (newUser && userObject.email) {
                insertColumns.push('email');
                updateColumns.push('email = VALUES(email)');
                binds.push(userObject.email);
            }
            if (fields.lastAccess) {
                insertColumns.push('lastAccess');
                updateColumns.push('lastAccess = VALUES(lastAccess)');
                binds.push(fields.lastAccess);
            }
            if (fields.lastClaims) {
                insertColumns.push('lastClaims');
                updateColumns.push('lastClaims = VALUES(lastClaims)');
                binds.push(JSON.stringify(fields.lastClaims));
            }
            let sqlUpsert = `INSERT INTO ${config.database.schema}.user (
    ${insertColumns.join(',\n')}
  ) VALUES ? ON DUPLICATE KEY UPDATE
    ${updateColumns.join(',\n')}`;
            let [result] = await connection.query(sqlUpsert, [[binds]]);
            return result;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.setLastAccess = async function (userId, timestamp) {
    try {
        return await withConnection(async connection => {
            let sql = `UPDATE ${config.database.schema}.user SET lastAccess = ? where userId = ?`;
            await connection.query(sql, [timestamp, userId]);
            return true;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.disableUser = async function disableUser(elevate, userId) {
    try {
        if (!userId || isNaN(userId)) {
            throw new Error('Invalid userId');
        }

        return await withConnection(async connection => {
            if (!elevate) {
                throw new SmError.PrivilegeError('Elevate parameter is required');
            }

            let deleteSql = `DELETE uat, cp
                      FROM ${config.database.schema}.userassignedteams uat, collectionpermissions cp
                      WHERE uat.userId = ? AND cp.userId = ?`;
            let updateSql = `UPDATE ${config.database.schema}.user SET accountStatus = 'DISABLED' WHERE userId = ?`;

            await connection.query(deleteSql, [userId, userId]);
            await connection.query(updateSql, [userId]);

            await this.updateUserLastCollectionAccessed(userId, 0);

            return { success: true, message: 'User disabled successfully' };
        });
    } catch (error) {
        if (error instanceof SmError.PrivilegeError) {
            throw error;
        }
        throw new Error(`Failed to disable user: ${error.message}`);
    }
};
