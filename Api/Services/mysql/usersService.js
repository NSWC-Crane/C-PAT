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
const tokenGenerator = require('../../utils/token-generator');
const auth = require('../../utils/auth');
const writeLog = require('../../utils/poam_logger')

exports.getUserObject = async function getUserObject(body, projection, userObject) {
	var con = mysql.createConnection({
		host: process.env.USERSERVICE_DB_HOST,
		user: process.env.USERSERVICE_DB_USER,
		password: process.env.USERSERVICE_DB_PASSWORD,
		database: process.env.USERSERVICE_DB_DATABASE
	})
	con.connect(function (err) {
		if (err) throw err;
		con.query("INSERT into user(name, id, email)values('Boo', 004, 'spooky4u@navy.gov')")
		if (err) throw err;
	})
	res.status(201).json({ message: "getUser (Service) Method Called successfully" })
}

exports.refresh = async function refresh(userId, body, projection, userOnject) {

	let connection
	let sql = "SELECT * FROM user WHERE userId = ?";
	connection = await dbUtils.pool.getConnection();
	let [row] = await connection.query(sql, [userId]);

	await connection.release()
	return (row[0])
}

exports.getUserByUserID = async function getUserByUserID(userId, body, projection, userObject) {

	let connection
	let sql = "SELECT * FROM user WHERE userId = ?";
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql, [userId]);

	await connection.release()
	return (row[0])

}

exports.getCurrentUser = async function getCurrentUser(req) {
	if (!req.userObject || !req.userObject.email) {
		return { error: "User is not authenticated", status: 400 };
	}

	try {
		const userEmail = req.userObject.email;
		let connection = await dbUtils.pool.getConnection();
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

			await connection.release();
			return { data: response, status: 200 };
		} else {
			await connection.release();
			return { error: "User email not found", status: 404 };
		}
	} catch (error) {
		console.error('Error in getCurrentUser:', error);
		if (connection) await connection.release();
		return { error: "Internal Server Error", status: 500 };
	}
};

exports.getUsers = async function getUsers(req, res, next) {
	let connection;
	try {
		connection = await dbUtils.pool.getConnection();
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

		await connection.release();
		return { users };
	} catch (error) {
		console.error('Error in getUsers:', error);
		if (connection) await connection.release();
		return { error: "Internal Server Error", status: 500 };
	}
}

//Needs to be removed
exports.getUserByNamePassword = async function getUserByNamePassword(username, callback) {
	function loginObj(userId, userName, email, created, lastAccess, firstName, lastName,
		lastCollectionAccessedId, defaultTheme) {
		this.userId = userId
		this.userName = userName,
			this.email = email,
			this.created = created,
			this.lastAccess = lastAccess,
			this.firstName = firstName,
			this.lastName = lastName,
			this.lastCollectionAccessedId = lastCollectionAccessedId,
			this.defaultTheme = defaultTheme,
			this.isAdmin = isAdmin
	}

	try {
		let connection
		let sql = "SELECT * FROM user WHERE userName = ?";
		connection = await dbUtils.pool.getConnection()
		let [rowUser] = await connection.query(sql, [username]);

		let dt = new Date();
		let response = new loginObj(rowUser[0].userId,
			rowUser[0].userName,
			rowUser[0].userEmail,
			rowUser[0].created,
			(rowUser[0].lastAcces) ? rowUser[0].lastAcces : '',
			rowUser[0].firstName,
			rowUser[0].lastName,
			rowUser[0].lastCollectionAccessedId,
			rowUser[0].defaultTheme,
			rowUser[0].isAdmin
		);
		await connection.release()
		return callback(null, response);

	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
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
		let connection

		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT * from user WHERE userId = ?"
		let [currentUser] = await connection.query(sql, [userId]);

		let fullName = `${req.body.firstName} ${req.body.lastName}`;
		sql = "UPDATE user SET firstName = ?, lastName = ?, userEmail = ?, lastCollectionAccessedId = ?, accountStatus = ?, fullName = ?, defaultTheme = ?, isAdmin = ? WHERE userId = ?";

		await connection.query(sql,
			[
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
		sql = "SELECT * from user WHERE userId = ?"
		let [rowUser] = await connection.query(sql, [userId]);
		await connection.release()

		if (rowUser[0] != undefined) {
			if (updateSettingsOnly != 1) { // update logs if anything other than settings are updated
				// to meet requirement of STIG V222414
				writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'modified account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
				// to meet requirement of STIG V222418
				writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'modified account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
				if (rowUser[0].accountStatus == 'ACTIVE' && currentUser[0].accountStataus != 'ACTIVE') {
					// to meet requirement of STIG V222421
					writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'enabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
					// to meet requirement of STIG V222422
					writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'enabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
				}
				if (rowUser[0].accountStatus == 'EXPIRED' && currentUser[0].accountStataus != "EXPIRED") {
					// to meet requirement of STIG V222415
					writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'disabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
					// to meet requirement of STIG V222422
					writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'disabled account', userId: rowUser[0].userId, userName: rowUser[0].userName, userEmail: rowUser[0].userEmail })
				}
			}
			res.status(201).json(rowUser[0])
		} else {
			return next({
				status: 422,
				errors: {
					message: 'update failed',
				}
			});
		}
	}
	catch (error) {
		console.info('Post usersService login: user login failed.', error);
		return next({
			status: 400,
			message: "Login failed"
		});
	}
}

exports.loginout = async function loginout(req, res, next) {

	let message = { message: ""}
	if (req.body.inout == 'logIn') {
		writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'logged in'})
		message.message = "Login Success"
	} else {
		writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'logged out' })
		message.message = "Logout Success"
	}
	return (message);
}

module.exports.deleteUserByUserID = async function deleteUserByUserID(userId, req, res, next) {

	let connection
	let sql_query = 'DELETE FROM `user` WHERE `id`=' + userId
	connection = await dbUtils.pool.getConnection()
	let [row] = await connection.query(sql_query)
	await connection.release()
	// to meet requirement of STIG V222416
	writeLog.writeLog(3, "usersService", 'log', req.userObject.username, req.userObject.displayName, { event: 'removed account', userId: userId })
	// to meet requirement of STIG V222420
	writeLog.writeLog(3, "usersService", 'notification', req.userObject.username, req.userObject.displayName, { event: 'removed account', userId: userId })

	let messageReturned = new Object()
	messageReturned.text = "User deleted"
	// console.log("User with id: " + userId + " deleted")
	return (messageReturned)
}

/**
 * @param previousPayload (optional) The payload from the previous JWT
 * @param jwtSignOptions (optional) Options to sign JWT
 *
 * @description Overwrites previous payload with refreshed data, checks permissions, and
 * @returns JWT token.
 */
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
		accountStataus: user.accountStatus,
		fullName: user.fullName,
		defaultTheme: user.defaultTheme
	});

	if (payload.collections) {
		try {
			const permissions = ""
			if (!permissions) { console.log("deleting payload.collection..."); delete payload.collections; }
			else {

				for (permission in permissions) {
					let assigendCollections = {
						collectionId: permission.collectionId,
						canOwn: permission.canOwn,
						canMaintain: permission.canMaintain,
						canApprove: permission.canApprove,
						canView: permission.canView
					}
					payload.collections.push(assigendCollections);
				}
			}
		} catch (err) {
			console.log("ERROR: collections is missing from payload.");
			console.log(err);
			throw err
		}
	} else if (this.lastCollectionAccessedId) {
		payload.lastCollectionAccessedId = this.lastCollectionAccessedId;
	}
	else if (user.accountStataus === 'Pending') {
		console.log("User account is pending, not setting payload...");
	}
	else {
		writeLog.writeLog(4, "usersService", 'info', req.userObject.username, req.userObject.displayName, { event: 'No lastCollectionAccessedId, not setting payload.lastCollectionAccessedId at all...' })
	}
	return tokenGenerator.sign(payload, jwtSignOptions);
}