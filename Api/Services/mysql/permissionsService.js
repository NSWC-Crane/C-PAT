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

exports.getPermissions_User = async function getPermissions_User(req, res, next) {
	//console.log("getPermissions_User (Service) body: ",req.params.userId);

	if (!req.params.userId) {
		console.info('getPermissions_User userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT * FROM  poamtracking.collectionpermissions WHERE userId=" + req.params.userId + ";"
		// console.log("getPermissions_User sql: ", sql)

		let [rowPermissions] = await connection.query(sql)
		// console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var size = Object.keys(rowPermissions).length

		var permissions = {
			permissions: []
		}

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			permissions.permissions.push({
				"userId": rowPermissions[counter].userId,
				"collectionId": rowPermissions[counter].collectionId,
				"canOwn": rowPermissions[counter].canOwn,
				"canMaintain": rowPermissions[counter].canMaintain,
				"canApprove": rowPermissions[counter].canApprove
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		//console.log("returning: ",permissions)
		return { permissions };

	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.getPermissions_Collection = async function getPermissions_Collection(req, res, next) {
	// res.status(201).json({ message: "getPermissions_Collection (Service) Method called successfully" });

	if (!req.params.collectionId) {
		console.info('getPermissions_Collection collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT T1.*,T2.firstName, T2.lastName, T2.fullName, T2.phoneNumber, T2.userEmail FROM  poamtracking.collectionpermissions T1 " + 
			"INNER JOIN poamtracking.user T2 ON t1.userId = t2.userId WHERE collectionId = ?;"
		// console.log("getPermissions_User sql: ", sql)

		let [rowPermissions] = await connection.query(sql, req.params.collectionId)
		console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var size = Object.keys(rowPermissions).length

		var permissions = {
			permissions: []
		}

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			permissions.permissions.push({ 
				...rowPermissions[counter]
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		//console.log("returning: ",permissions)
		return { permissions };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.getPermissions_UserCollection = async function getPermissions_UserCollection(req, res, next) {
	// res.status(201).json({ message: "getPermissions_UserCollection (Service) Method called successfully" });
	if (!req.params.userId) {
		console.info('getPermissions_UserCollection userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	if (!req.params.collectionId) {
		console.info('getPermissions_UserCollection collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT * FROM  poamtracking.collectionpermissions WHERE userId=" + req.params.userId +
			" AND collectionId=" + req.params.collectionId + ";"
		// console.log("getPermissions_User sql: ", sql)

		let [rowPermissions] = await connection.query(sql)
		// console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var size = Object.keys(rowPermissions).length

		var permissions = {
			permissions: []
		}

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			permissions.permissions.push({
				"userId": rowPermissions[counter].userId,
				"collectionId": rowPermissions[counter].collectionId,
				"canOwn": rowPermissions[counter].canOwn,
				"canMaintain": rowPermissions[counter].canMaintain,
				"canApprove": rowPermissions[counter].canApprove
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		//console.log("returning: ",permissions)
		return { permissions };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.postPermission = async function postPermission(req, res, next) {
	// res.status(201).json({ message: "postPermission (Service) Method called successfully" });
	// console.log("postPermission req.body: ", req.body)
	if (!req.body.userId) {
		console.info('postPermissions userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	if (!req.body.collectionId) {
		console.info('postPermissions collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}

	if (!req.body.canOwn) req.body.canOwn = 0;
	if (!req.body.canMaintain) req.body.canMaintain = 0;
	if (!req.body.canApprove) req.body.canApprove = 0;

	try {
		let connection
		connection = await dbUtils.pool.getConnection()

		let sql_query = `INSERT INTO poamtracking.collectionpermissions (userId, collectionId, canOwn, canMaintain, canApprove) values (?, ?, ?, ?, ?)`

		await connection.query(sql_query, [req.body.userId, req.body.collectionId, req.body.canOwn, req.body.canMaintain, req.body.canApprove])
		await connection.release()

		const message = new Object()
		message.userId = req.body.userId
		message.collectionId = req.body.collectionId
		message.canOwn = req.body.canOwn
		message.canMaintain = req.body.canMaintain
		message.canApprove = req.body.canApprove
		return(message)
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.putPermission = async function putPermission(req, res, next) {
	// res.status(201).json({ message: "putPermission (Service) Method called successfully" });
		// console.log("postPermission req.body: ", req.body)
		if (!req.body.userId) {
			console.info('postPermissions userId not provided.');
			return next({
				status: 422,
				errors: {
					userId: 'is required',
				}
			});
		}
	
		if (!req.body.collectionId) {
			console.info('postPermissions collectionId not provided.');
			return next({
				status: 422,
				errors: {
					collectionId: 'is required',
				}
			});
		}
	
		if (!req.body.canOwn) req.body.canOwn = 0;
		if (!req.body.canMaintain) req.body.canMaintain = 0;
		if (!req.body.canApprove) req.body.canApprove = 0;
	
		try {
			let connection
			connection = await dbUtils.pool.getConnection()
	
			let sql_query = "UPDATE poamtracking.collectionpermissions SET canOwn= ?, canMaintain= ?, " +
				"canApprove= ? WHERE userId = " + req.body.userId + " AND collectionId = " + req.body.collectionId + ";"
	
			await connection.query(sql_query, [req.body.canOwn, req.body.canMaintain, req.body.canApprove])
			await connection.release()
	
			const message = new Object()
			message.userId = req.body.userId
			message.collectionId = req.body.collectionId
			message.canOwn = req.body.canOwn
			message.canMaintain = req.body.canMaintain
			message.canApprove = req.body.canApprove
			return(message)
		}
		catch (error) {
			let errorResponse = { null: "null" }
			await connection.release()
			return errorResponse;
		}
}

exports.deletePermission = async function deletePermission(req, res, next) {
	// res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
	if (!req.params.userId) {
		console.info('getPermissions_UserCollection userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	if (!req.params.collectionId) {
		console.info('getPermissions_UserCollection collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "DELETE FROM  poamtracking.collectionpermissions WHERE userId=" + req.params.userId +
			" AND collectionId=" + req.params.collectionId + ";"
		console.log("deletePermissions sql: ", sql)

		await connection.query(sql)
		// console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var permissions = {
			permissions: []
		}

		
		return { permissions };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}
