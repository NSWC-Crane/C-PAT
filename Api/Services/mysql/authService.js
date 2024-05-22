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
const passport = require('passport');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.changeWorkspace = async (req, res, next) => {
    if (!req.body.token) {
        return res.status(400).json({ message: 'token not provided' });
    }

    try {
        const payload = jwt.verify(req.body.token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] });
        payload.user = req.body.user;
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { algorithm: 'HS256', expiresIn: '2 days' });
        res.json({ token: token });
    } catch (err) {
        return { error: error.message };
    }
};

exports.generateJWT = function (user, jwtSignOptions) {
    const payload = {
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
        defaultTheme: user.defaultTheme
    };

    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { ...jwtSignOptions, algorithm: 'HS256', expiresIn: '2 days' });
};

exports.login = async (req, res, next) => {
    if (!req.body.email) {
        return next({ status: 400, errors: { email: 'is required' } });
    }

    try {
        const rowUser = await withConnection(async (connection) => {
            const sql = "SELECT * FROM user WHERE email = ?";
            const [result] = await connection.query(sql, [req.body.email]);
            return result[0];
        });

        if (!rowUser) {
            return next({ status: 400, errors: { email: 'Not found' } });
        }

        req.body.username = rowUser.userName;
        req.body.lastCollectionAccessedId = rowUser.lastCollectionAccessedId;

        return await passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next({ status: 400, message: info.message });
            }
            const token = exports.generateJWT(user, {});
            await withConnection(async (connection) => {
                const sql = "UPDATE user SET lastAccess = NOW() WHERE email = ?";
                await connection.query(sql, [req.body.email]);
            });
            return res.status(201).json({ token: token });
        })(req, res, next);
    } catch (error) {
        return next({ status: 400, message: `Login failed: ${error}` });
    }
};

exports.logout = async (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            logger.writeError("Session NOT destroyed: ", err);
        } else {
            return res.status(201).send({ success: true });
        }
    });
};

exports.register = async (req, res, next) => {
    try {
        if (!req.body.email) {
            return next({ status: 400, message: 'Missing email', stack: new Error().stack });
        }

        if (!req.body.userName) {
            return next({ status: 400, message: 'Missing userName', stack: new Error().stack });
        }

        const existingUser = await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE email = ? OR userName = ?";
            let [result] = await connection.query(sql, [req.body.email, req.body.userName]);
            return result[0];
        });

        if (existingUser) {
            const field = existingUser.email === req.body.email ? 'email' : 'userName';
            return next({ status: 500, message: `An account with this ${field} already exists`, stack: new Error().stack });
        }

        const user = await withConnection(async (connection) => {
            let sql = "INSERT INTO user (userName, email, created, firstName, lastName, " +
                "lastCollectionAccessedId, accountStatus, fullName, officeOrg, defaultTheme) VALUES (?, ?, CURDATE(), ?, ?, 0 , 'PENDING', ?, ?, 'dark' )";
            await connection.query(sql, [
                req.body.userName,
                req.body.email,
                req.body.firstName,
                req.body.lastName,
                req.body.firstName + " " + req.body.lastName,
                req.body.officeOrg || " "
            ]);

            sql = "SELECT * FROM user WHERE userName = ?";
            let [result] = await connection.query(sql, [req.body.userName]);
            return result[0];
        });

        if (!user) {
            return next({ status: 500, message: 'Failed to create user', stack: new Error().stack });
        }

        if (req.body.collectionAccessRequest) {
            await withConnection(async (connection) => {
                const sql_query = `INSERT INTO cpat.collectionpermissions (userId, collectionId, accessLevel, lastAccess) VALUES (?, ?, ?, ?)`;
                for (const request of req.body.collectionAccessRequest) {
                    await connection.query(sql_query, [user.userId, request.collectionId, 1]);
                }
            });
        }

        const token = exports.generateJWT(user, {});
        return res.status(201).json({ token: token });
    } catch (err) {
        return { error: error.message };
    }
};