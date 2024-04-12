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
const userService = require('./usersService');
const tokenGenerator = require('../../utils/token-generator');
const refreshPayload = require('../../utils/refresh_payload');

async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.changeWorkspace = async (req, res, next) => {
    console.log("authService changeWorkspace req.body: ", req.body);
    if (!req.body.token) {
        console.info('Post node-api change-workspace: token not provided.');
        return res.status(400).json({ message: 'token not provided' });
    }

    try {
        const token = await tokenGenerator.refresh(req.body.token, {
            verify: { algorithms: ['HS256'] },
            mergePayload: { user: req.body.user },
            refreshPayload: refreshPayload,
        });
        console.log("tokenGenerator token returned: ", token);
        res.json({ token: token });
    } catch (err) {
        console.error('Post node-api change-workspace err: ' + JSON.stringify(err));
        next(err);
    }
};

exports.login = async (req, res, next) => {
    if (!req.body.email) {
        console.info('Post authService login: email or username not provided.');
        return next({ status: 400, errors: { email: 'is required' } });
    }

    try {
        const rowUser = await withConnection(async (connection) => {
            const sql = "SELECT * FROM user WHERE userEmail = ?";
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
                console.error('Post node-api login err: ' + JSON.stringify(err));
                return next(err);
            }
            if (!user) {
                return next({ status: 400, message: info.message });
            }
            console.log('login successful!', 'user:', user);
            const token = await userService.generateJWT('', '', user);
            await withConnection(async (connection) => {
                const sql = "UPDATE user SET lastAccess = NOW() WHERE userEmail = ?";
                await connection.query(sql, [req.body.email]);
            });
            return res.status(201).json({ token: token });
        })(req, res, next);
    } catch (error) {
        console.info('Post authService login: user login failed.', error);
        return next({ status: 400, message: "Login failed" });
    }
};

exports.logout = async (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Session NOT destroyed.");
            console.log(err);
        } else {
            console.log("Session has been destroyed.");
            return res.status(201).send({ success: true });
        }
    });
};

exports.register = async (req, res, next) => {
    try {
        console.log('authService register incoming req.body:', req.body);

        if (!req.body.email) {
            console.log('Post node-api register: email address required.');
            return next({ status: 400, message: 'Missing email', stack: new Error().stack });
        }

        if (!req.body.userName) {
            console.log('Post node-api register: userName required.');
            return next({ status: 400, message: 'Missing userName', stack: new Error().stack });
        }

        const existingUser = await withConnection(async (connection) => {
            let sql = "SELECT * FROM user WHERE userEmail = ? OR userName = ?";
            let [result] = await connection.query(sql, [req.body.email, req.body.userName]);
            return result[0];
        });

        if (existingUser) {
            const field = existingUser.userEmail === req.body.email ? 'email' : 'userName';
            console.info(`Post node-api register: ${field} exists.`, existingUser[field]);
            return next({ status: 500, message: `An account with this ${field} already exists`, stack: new Error().stack });
        }

        const user = await withConnection(async (connection) => {
            let sql = "INSERT INTO user (userName, userEmail, created, firstName, lastName, " +
                "lastCollectionAccessedId, accountStatus, fullName, defaultTheme) VALUES (?, ?, CURDATE(), ?, ?, 0 , 'PENDING', ?, 'default' )";
            await connection.query(sql, [
                req.body.userName,
                req.body.email,
                req.body.firstName,
                req.body.lastName,
                req.body.firstName + " " + req.body.lastName
            ]);

            sql = "SELECT * FROM user WHERE userName = ?";
            let [result] = await connection.query(sql, [req.body.userName]);
            return result[0];
        });

        if (!user) {
            console.info('Post node-api register: failed to create user.');
            return next({ status: 500, message: 'Failed to create user', stack: new Error().stack });
        }

        if (req.body.collectionAccessRequest) {
            await withConnection(async (connection) => {
                const sql_query = `INSERT INTO poamtracking.collectionpermissions (userId, collectionId, canOwn, canMaintain, canApprove, canView) VALUES (?, ?, ?, ?, ?, ?)`;
                for (const request of req.body.collectionAccessRequest) {
                    await connection.query(sql_query, [user.userId, request.collectionId, false, false, false]);
                }
            });
        }

        const token = await userService.generateJWT('', '', user);
        console.log("Register token: ", token);
        return res.status(201).json({ token: token });
    } catch (err) {
        console.error('Post node-api register err: ' + JSON.stringify(err));
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    if (!req.body.token) {
        console.info('Post node-api refresh-token: token not provided.');
        return res.status(401).json({ error: 'No token available' });
    }
    console.log('POST /refresh-token');
    try {
        const token = await tokenGenerator.refresh(req.body.token, {
            verify: { algorithms: ["HS256"], ignoreExpiration: true }, refreshPayload: refreshPayload
        }); return res.status(200).json({ token: token });
    } catch (err) { console.error('Post node-api refresh-token err: ' + JSON.stringify(err)); next(err); }
};