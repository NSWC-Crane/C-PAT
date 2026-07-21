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

module.exports.getUsers = async function getUsers(elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    return await withConnection(async connection => {
        const allUsersSql = `SELECT * FROM ${config.database.schema}.user`;
        const [allUsersRows] = await connection.query(allUsersSql);

        return await Promise.all(
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
                } catch {
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
    });
};

module.exports.getCurrentUser = async function getCurrentUser(req) {
    return await withConnection(async connection => {
        const sqlUser = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
        const [userRows] = await connection.query(sqlUser, [req.userObject.userId]);

        if (userRows.length === 0) {
            throw new SmError.NotFoundError('User not found');
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
        } catch {
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
    });
};

module.exports.getUserByUserID = async function getUserByUserID(req, elevate) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    return await withConnection(async connection => {
        let sql = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
        const [userQueryRows] = await connection.query(sql, [req.params.userId]);

        if (userQueryRows.length === 0) {
            throw new SmError.NotFoundError('User not found');
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
        } catch {
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
    });
};

module.exports.getUserByUserName = async function getUserByUserName(userName) {
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
        } catch {
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
};

module.exports.updateUser = async function updateUser(_userId, elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    req.body.defaultTheme = req.body.defaultTheme || null;

    return await withConnection(async connection => {
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

        if (updatedUser.length === 0) {
            throw new SmError.NotFoundError('User not found');
        }

        return updatedUser[0];
    });
};

module.exports.updateUserTheme = async function updateUserTheme(userId, defaultTheme) {
    return await withConnection(async connection => {
        let sql = `UPDATE ${config.database.schema}.user SET defaultTheme = ? WHERE userId = ?`;

        await connection.query(sql, [defaultTheme, userId]);
    });
};

module.exports.setUserPoints = async function setUserPoints(userId, points) {
    return await withConnection(async connection => {
        let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;

        await connection.query(sql, [points, userId]);
    });
};

module.exports.updateUserPoints = async function updateUserPoints(elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    return await module.exports.setUserPoints(req.body.userId, req.body.points);
};

module.exports.hourlyPoints = async function hourlyPoints(userId) {
    return await withConnection(async connection => {
        let findUserSql = `SELECT points from ${config.database.schema}.user WHERE userId = ?`;
        const [response] = await connection.query(findUserSql, [userId]);

        if (response.length === 0) {
            throw new SmError.NotFoundError('User not found');
        }

        let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;
        await connection.query(sql, [response[0].points + 1, userId]);
    });
};

module.exports.dailyPoints = async function dailyPoints(userId) {
    return await withConnection(async connection => {
        let findUserSql = `SELECT points from ${config.database.schema}.user WHERE userId = ?`;
        const [response] = await connection.query(findUserSql, [userId]);

        if (response.length === 0) {
            throw new SmError.NotFoundError('User not found');
        }

        let sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;
        await connection.query(sql, [response[0].points + 5, userId]);
    });
};

module.exports.updateUserLastCollectionAccessed = async function updateUserLastCollectionAccessed(userId, lastCollectionAccessedId) {
    return await withConnection(async connection => {
        let sql = `UPDATE ${config.database.schema}.user SET lastCollectionAccessedId = ? WHERE userId = ?`;
        await connection.query(sql, [lastCollectionAccessedId, userId]);
    });
};

module.exports.createUser = async function createUser(elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    const userName = (req.body.userName || '').trim();
    if (!userName) {
        throw new SmError.ClientError('userName is required');
    }
    if (userName.length > 100) {
        throw new SmError.ClientError('userName must be 100 characters or fewer');
    }

    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || null;
    const accountStatus = req.body.accountStatus || 'ACTIVE';

    return await withConnection(async connection => {
        let insertSql = `INSERT INTO ${config.database.schema}.user (userName, firstName, lastName, fullName, email, phoneNumber, officeOrg, accountStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        let result;
        try {
            [result] = await connection.query(insertSql, [
                userName,
                firstName,
                lastName,
                fullName,
                req.body.email || 'None Provided',
                req.body.phoneNumber || '',
                req.body.officeOrg || 'UNKNOWN',
                accountStatus,
            ]);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new SmError.UnprocessableError('A user with this username already exists');
            }
            throw error;
        }

        let sql = `SELECT * FROM ${config.database.schema}.user WHERE userId = ?`;
        const [userRows] = await connection.query(sql, [result.insertId]);
        const user = userRows[0];

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
            isAdmin: false,
            lastClaims: user.lastClaims,
            permissions: [],
            assignedTeams: [],
        };
    });
};

module.exports.setUserData = async function setUserData(userObject, fields, newUser) {
    return await withConnection(async connection => {
        let insertColumns = ['userName'];
        let updateColumns = ['userId = LAST_INSERT_ID(userId)'];
        let binds = [userObject.userName];

        const identityUpdate = (column, newUserExpr) =>
            newUser ? newUserExpr : `${column} = IF(${column} = '' OR ${column} IS NULL, VALUES(${column}), ${column})`;

        if (userObject.firstName) {
            insertColumns.push('firstName');
            updateColumns.push(identityUpdate('firstName', 'firstName = VALUES(firstName)'));
            binds.push(userObject.firstName);
        }
        if (userObject.lastName) {
            insertColumns.push('lastName');
            updateColumns.push(identityUpdate('lastName', 'lastName = VALUES(lastName)'));
            binds.push(userObject.lastName);
        }
        if (userObject.fullName) {
            insertColumns.push('fullName');
            updateColumns.push(identityUpdate('fullName', 'fullName = VALUES(fullName)'));
            binds.push(userObject.fullName);
        }
        if (userObject.email) {
            insertColumns.push('email');
            updateColumns.push(identityUpdate('email', 'email = VALUES(email)'));
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
};

module.exports.setLastAccess = async function (userId, timestamp) {
    return await withConnection(async connection => {
        let sql = `UPDATE ${config.database.schema}.user SET lastAccess = ? where userId = ?`;
        await connection.query(sql, [timestamp, userId]);
        return true;
    });
};

module.exports.disableUser = async function disableUser(userId, elevate, req) {
    if (!elevate || req.userObject.isAdmin !== true) {
        throw new SmError.PrivilegeError('Elevate parameter is required');
    }

    if (!userId || Number.isNaN(userId)) {
        throw new SmError.ClientError('Invalid userId');
    }

    await withConnection(async connection => {
        await connection.beginTransaction();

        try {
            await connection.query(`DELETE FROM ${config.database.schema}.userassignedteams WHERE userId = ?`, [userId]);
            await connection.query(`DELETE FROM ${config.database.schema}.collectionpermissions WHERE userId = ?`, [userId]);
            await connection.query(`UPDATE ${config.database.schema}.user SET accountStatus = 'DISABLED' WHERE userId = ?`, [userId]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });

    await module.exports.updateUserLastCollectionAccessed(userId, 0);
};
