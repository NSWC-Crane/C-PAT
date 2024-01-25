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
const writeLog = require('../../utils/poam_logger')

exports.getCollectionPermissions = async function getCollectionPermissions(req, res, next) {
	// res.status(201).json({ message: "getCollectionPermissions (Service) Method called successfully" });

	if (!req.params.collectionId) {
		console.info('getCollectionPermissions collectionId not provided.');
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
		let sql = "SELECT T1.*,T2.firstName, T2.lastName, T2.fullName, T2.userEmail FROM  poamtracking.collectionpermissions T1 " +
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
exports.getCollections = async function getCollections(userNameInput, req, res, next) {
	// if "Registrant, then send back all id's and names"
	if (userNameInput == "Registrant") {
		try {
			let connection
			connection = await dbUtils.pool.getConnection()
			let sql = "SELECT collectionId, collectionName FROM poamtracking.collection;"
			let [row] = await connection.query(sql)
			var size = Object.keys(row).length

			var user = {
				collections: []
			}

			for (let counter = 0; counter < size; counter++) {
				user.collections.push({
					"collectionId": row[counter].collectionId,
					"collectionName": row[counter].collectionName
				});
			}

			// console.log(user);

			await connection.release()
			return user;
		} catch (error) {
			return { "null": "Undefined User" }
		}
	}
	//check if the user exists
	let userId = 0
	let isAdmin = 0;
	let userName = "";
	try {

		let connection
		connection = await dbUtils.pool.getConnection()
		//if user is admin check, if so dump all collections
		let sql = `SELECT * FROM user WHERE userName='${userNameInput}';`;
		let [row] = await connection.query(sql);
		userId = row[0].userId;
		isAdmin = row[0].isAdmin;
		userName = row[0].userName;
	}
	catch (error) {
		return { "null": "Undefined User" }
	}
	var user = {
		collections: []
	}
	if (isAdmin == 1) {
		// console.log("collectionService getCollections() user", userName,"can access these collections:")
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql2 = "SELECT * FROM collection;"
		let [row2] = await connection.query(sql2)
		// console.log(row2.foreach.collectionName)
		var size = Object.keys(row2).length

		for (let counter = 0; counter < size; counter++) {

			user.collections.push({
				...row2[counter]
			});
		}

		let response = user

		await connection.release()
		return response;
	} else {
		try {
			let connection
			connection = await dbUtils.pool.getConnection()
			let sql = "SELECT * FROM collectionpermissions WHERE userId='" + userId + "';"
			let [row2] = await connection.query(sql)
			//console.log(row2)
			var numberOfCollections = Object.keys(row2).length
			// console.log(numberOfCollections)
			var nonAdminCollections = {

				collections: []
			}
			for (let counter = 0; counter < numberOfCollections; counter++) {
				let sql3 = "SELECT * FROM collection WHERE collectionId='" + row2[counter].collectionId + "';"
				let [row3] = await connection.query(sql3)
				nonAdminCollections.collections.push({ "collectionId": row3[0].collectionId, "collectionName": row3[0].collectionName, "description": row3[0].description, "created": row3[0].created, "grantCount": row3[0].grantCount, "assetCount": row3[0].assetCount, "poamCount": row3[0].poamCount });
			}

			let response = nonAdminCollections
			// console.log(response)
			await connection.release()
			return response;
		}

		catch (error) {
			let errorReponse = { null: "No collections granted for selected user. " }
			await connection.release()
			return errorReponse

		}
	}

}
exports.getCollection = async function getCollection(userName, collectionId, req, res, next){
	function collectionObj(collectionId, collectionName, description, created, grantCount, poamCount)  {
		this.collectionId = collectionId
		this.collectionName = collectionName
		this.description = description
		this.created = created
		this.grantCount = grantCount
		this.poamCount = poamCount
	}

	// console.log("UserName: ", userName, ", collectionId: ", collectionId)
	
	try{
		let connection
		connection = await dbUtils.pool.getConnection()
		//if user is admin check, if so dump all collections
		let sql = "SELECT * FROM user WHERE userName='"+userName + "';"
		let[row] = await connection.query(sql)
		let userId = row[0].userId
		let isAdmin = row[0].isAdmin 
		 
		try{
		let sql = "SELECT * FROM collectionpermissions WHERE userId='"+userId + "' AND collectionId='"+collectionId +"';"
		let[row] = await connection.query(sql)
		let userName = row[0].userName


		}
		catch(error){

			try{
			
			if (!isAdmin) throw error("Not Authorized")
			// let sql = "SELECT * FROM adminpermissions WHERE userId='"+userId + "';"
			// let[row] = await connection.query(sql)
			// if(row[0].userId)
			// {
			// 	let isAdmin = true
			// }

			}
			catch(error){
				
				return {"null" : "User does not have access to this collection."}

			}
		}

	}
	catch(error)
	{
		return {"null" : "Undefined User"}
	}

	try{
		let connection
		connection = await dbUtils.pool.getConnection()
		//if user is admin check, if so dump all collections
		let sql = "SELECT * FROM collection WHERE collectionId="+collectionId + ";"
		let [row] = await connection.query(sql)
		// console.log("row: ", row[0])
		// let response = new collectionObj(row[0].collectionId, row[0].collectionName,row[0].description, row[0].created,row[0].grantCount,row[0].poamCount)
		let response = {...row[0]}
		await connection.release()
		return response
	}
	catch(error){
		return {"null" : "Invalid Collection ID"}
	}




}

exports.getCollectionPoamStats = async function getCollectionPoamStats( req, res, next){

	// console.log("collectionId: ",  req.params.collectionId)
	
	try{
		let connection
		connection = await dbUtils.pool.getConnection()
		//if user is admin check, if so dump all collections
		let sql = "SELECT status, COUNT(*) AS statusCount FROM poam WHERE collectionId = ?  GROUP BY status;"
		let [rows] = await connection.query(sql, [req.params.collectionId])
		// console.log("rows: ", rows)
		// let response = new collectionObj(row[0].collectionId, row[0].collectionName,row[0].description, row[0].created,row[0].grantCount,row[0].poamCount)
		
		await connection.release()
		var size = Object.keys(rows).length

		var poamStats = []

		for (let counter = 0; counter < size; counter++) {
				// console.log("Before setting permissions size: ", size, ", counter: ",counter);

				poamStats.push({
						...rows[counter]
				});
		}

		return {poamStats: poamStats} ;	 
	}
	catch(error)
	{
		return {"null" : "Undefined collection"}
	}
}
exports.postCollection = async function postCollection(req, res, next) {
	// console.log("inSide postCollection req.body: ", req.body)

	if (!req.body.collectionName) req.body.collectionName = undefined
	if (!req.body.description) req.body.description = ""
	if (!req.body.grantCount) req.body.grantCount = 0;
	if (!req.body.assetCount) req.body.assetCount = 0;
	if (!req.body.poamCount) req.body.poamCount = 0;

	try {
		let connection
		connection = await dbUtils.pool.getConnection()

		let sql_query = `INSERT INTO poamtracking.collection (collectionName, description, grantCount, assetCount, poamCount) VALUES (?, ?, ?, ?, ?) `
		await connection.query(sql_query, [req.body.collectionName, req.body.description, 0, 0, 0])
		let sql = "SELECT * FROM poamtracking.collection WHERE collectionId = LAST_INSERT_ID();"
		let [rowCollection] = await connection.query(sql)
		await connection.release()

		var collection = rowCollection[0]

		writeLog.writeLog(4, "colectionService", 'info', req.userObject.username,  req.userObject.displayName, { event: 'added collection', collectionName: req.body.collectionName, description: req.body.description })
		return (collection)
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.putCollection = async function putCollection(req, res, next) {
	// console.log("inSide putCollection req.body: ", req.body)
	if (!req.body.collectionId) {
		console.info('postPermissions collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}
	if (!req.body.collectionName) req.body.collectionName = undefined
	if (!req.body.description) req.body.description = ""
	if (!req.body.grantCount) req.body.grantCount = 0;
	if (!req.body.assetCount) req.body.assetCount = 0;
	if (!req.body.poamCount) req.body.poamCount = 0;

	try {
		let connection
		connection = await dbUtils.pool.getConnection()

		let sql = "SELECT * FROM poamtracking.collection WHERE collectionId = '" + req.body.collectionId + "';"
		let [currentCollection] = await connection.query(sql)

		let sql_query = "UPDATE poamtracking.collection SET collectionName=?, description=?, grantCount= ?, assetCount= ?, poamCount= ? WHERE collectionId = " + req.body.collectionId + ";"

		await connection.query(sql_query, [req.body.collectionName, req.body.description, req.body.grantCount, req.body.assetCount, req.body.poamCount])
		await connection.release()

		writeLog.writeLog(4, "colectionService", 'info', req.userObject.username,  req.userObject.displayName, { event: 'updated collection', collectionName: req.body.collectionName, description: req.body.description,
				grantcount: req.body.grantCount, assetCount: req.body.assetCount, poamCount: req.body.poamCount })

		const message = new Object()
		message.collectionId = req.body.collectionId
		message.collectionName = req.body.collectionName
		message.description = req.body.description
		message.grantCount = req.body.grantCount
		message.assetCount = req.body.assetCount
		message.poamCount = req.body.poamCount
		return (message)
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.deleteCollection = async function deleteCollection(body, projection, userObject){
		res.status(201).json({message: "deleteCollection (Service) Method called successfully"})
}
