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

		let [rowPermissions] = await connection.query(sql, req.params.collectionId)
		console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var size = Object.keys(rowPermissions).length

		var permissions = {
			permissions: []
		}

		for (let counter = 0; counter < size; counter++) {
			permissions.permissions.push({
				...rowPermissions[counter]
			});
		}

		return { permissions };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}
exports.getCollections = async function getCollections(userNameInput, req, res, next) {
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
		let sql = "SELECT * FROM user WHERE userName = ?";
		let [row] = await connection.query(sql, [userNameInput]);
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
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql2 = "SELECT * FROM collection;"
		let [row2] = await connection.query(sql2)
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
			let sql = "SELECT * FROM collectionpermissions WHERE userId = ?";
			let [row2] = await connection.query(sql, [userId])
			var numberOfCollections = Object.keys(row2).length
			var nonAdminCollections = {

				collections: []
			}
			for (let counter = 0; counter < numberOfCollections; counter++) {
				let sql3 = "SELECT * FROM collection WHERE collectionId = ?";
				let [row3] = await connection.query(sql3, [row2[counter].collectionId])
				nonAdminCollections.collections.push({ "collectionId": row3[0].collectionId, "collectionName": row3[0].collectionName, "description": row3[0].description, "created": row3[0].created, "grantCount": row3[0].grantCount, "assetCount": row3[0].assetCount, "poamCount": row3[0].poamCount });
			}

			let response = nonAdminCollections
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
	
	try{
		let connection
		connection = await dbUtils.pool.getConnection()
		//if user is admin check, if so dump all collections
		let sql = "SELECT * FROM user WHERE userName = ?";
		let [row] = await connection.query(sql, [userName]);
		let userId = row[0].userId
		let isAdmin = row[0].isAdmin 
		 
		try{
			let sql = "SELECT * FROM collectionpermissions WHERE userId = ? AND collectionId = ?";
			let [row] = await connection.query(sql, [userId, collectionId]);
		let userName = row[0].userName


		}
		catch(error){

			try{
			
			if (!isAdmin) throw error("Not Authorized")
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
		let sql = "SELECT * FROM collection WHERE collectionId = ?";
		let [row] = await connection.query(sql, [collectionId])
		let response = {...row[0]}
		await connection.release()
		return response
	}
	catch(error){
		return {"null" : "Invalid Collection ID"}
	}
}

exports.getCollectionBasicList = async function getCollectionBasicList(req, res, next) {
		try {
			const connection = await dbUtils.pool.getConnection();
			const sql = "SELECT collectionId, collectionName FROM collection";
			const [rows] = await connection.query(sql);
		await connection.release();

		return rows;
	} catch (error) {
		console.error(error);
		throw error;
	}
};
exports.getCollectionAssetLabel = async function getCollectionAssetLabel(req, res, next) {
	let connection;
	try {
		connection = await dbUtils.pool.getConnection();
		let sql = `
            SELECT l.labelName, COUNT(pl.labelId) AS labelCount
            FROM poamtracking.assetlabels pl
            INNER JOIN poamtracking.asset p ON pl.assetId = p.assetId
            INNER JOIN poamtracking.label l ON pl.labelId = l.labelId
            WHERE p.collectionId = ?
            GROUP BY l.labelName;
        `;
		let [rows] = await connection.query(sql, [req.params.collectionId]);

		let assetLabel = rows.map(row => ({
			label: row.labelName,
			labelCount: row.labelCount
		}));

		return { assetLabel };
	} catch (error) {
		console.error("Error fetching asset label counts: ", error);
		throw new Error("Unable to fetch asset label counts");
	} finally {
		if (connection) await connection.release();
	}
}

exports.getCollectionPoamStatus = async function getCollectionPoamStatus( req, res, next){
	
	try{
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT status, COUNT(*) AS statusCount FROM poam WHERE collectionId = ?  GROUP BY status;"
		let [rows] = await connection.query(sql, [req.params.collectionId])
		
		await connection.release()
		var size = Object.keys(rows).length

		var poamStatus = []

		for (let counter = 0; counter < size; counter++) {
				poamStatus.push({
						...rows[counter]
				});
		}

		return {poamStatus: poamStatus} ;	 
	}
	catch(error)
	{
		return {"null" : "Undefined collection"}
	}
}

exports.getCollectionPoamLabel = async function getCollectionPoamLabel(req, res, next) {
    let connection;
    try {
        connection = await dbUtils.pool.getConnection();
        let sql = `
            SELECT l.labelName, COUNT(pl.labelId) AS labelCount
            FROM poamtracking.poamlabels pl
            INNER JOIN poamtracking.poam p ON pl.poamId = p.poamId
            INNER JOIN poamtracking.label l ON pl.labelId = l.labelId
            WHERE p.collectionId = ?
            GROUP BY l.labelName;
        `;
        let [rows] = await connection.query(sql, [req.params.collectionId]);

        let poamLabel = rows.map(row => ({
            label: row.labelName,
            labelCount: row.labelCount
        }));

        return { poamLabel }; 
    } catch (error) {
        console.error("Error fetching POAM label counts: ", error);
        throw new Error("Unable to fetch POAM label counts");
    } finally {
        if (connection) await connection.release();
    }
}


exports.getCollectionPoamSeverity = async function getCollectionPoamSeverity(req, res, next) {

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT rawSeverity, COUNT(*) AS severityCount FROM poam WHERE collectionId = ?  GROUP BY rawSeverity;"
		let [rows] = await connection.query(sql, [req.params.collectionId])

		await connection.release()
		var size = Object.keys(rows).length

		var poamSeverity = []

		for (let counter = 0; counter < size; counter++) {
			poamSeverity.push({
				severity: rows[counter].rawSeverity,
				severityCount: rows[counter].severityCount
			});
		}

		return { poamSeverity: poamSeverity };
	}
	catch (error) {
		return { "null": "Undefined collection" }
	}
}

exports.getCollectionPoamEstimatedCompletion = async function getCollectionPoamEstimatedCompletion(req, res, next) {
	try {
		let connection = await dbUtils.pool.getConnection();
		let sql = `
            SELECT
                scheduledCompletionDate,
                extensionTimeAllowed,
                DATEDIFF(
                    DATE_ADD(scheduledCompletionDate, INTERVAL IFNULL(extensionTimeAllowed, 0) DAY),
                    CURDATE()
                ) AS daysUntilCompletion
            FROM poam
            WHERE collectionId = ?
        `;

		let [rows] = await connection.query(sql, [req.params.collectionId]);
		await connection.release();

		let buckets = {
			"OVERDUE": 0,
			"< 30 Days": 0,
			"30-60 Days": 0,
			"60-90 Days": 0,
			"90-180 Days": 0,
			"180-365 Days": 0,
			"> 365 Days": 0,
		};

		rows.forEach(row => {
			let days = row.daysUntilCompletion;
			if (days <= 0) buckets["OVERDUE"]++;
			else if (days <= 30) buckets["< 30 Days"]++;
			else if (days <= 60) buckets["30-60 Days"]++;
			else if (days <= 90) buckets["60-90 Days"]++;
			else if (days <= 180) buckets["90-180 Days"]++;
			else if (days <= 365) buckets["180-365 Days"]++;
			else if (days > 365) buckets["> 365 Days"]++;
		});

		let poamEstimatedCompletion = Object.keys(buckets).map(key => ({
			estimatedCompletion: key,
			estimatedCompletionCount: buckets[key],
		}));

		return { poamEstimatedCompletion };
	} catch (error) {
		console.error("Error fetching POAM estimated completion data:", error);
		return { "error": "Failed to fetch POAM estimated completion data" };
	}
}

exports.postCollection = async function postCollection(req, res, next) {
	let connection;

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
    } catch (error) {
        if (connection) {
            await connection.release();
        }
        let errorResponse = { error: "An error occurred while attempting to add a collection." };
        console.error(error);
        return errorResponse;
    }
}

exports.putCollection = async function putCollection(req, res, next) {
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

		let sql = "SELECT * FROM poamtracking.collection WHERE collectionId = ?";
		let [currentCollection] = await connection.query(sql, [req.body.collectionId]);

		let sql_query = "UPDATE poamtracking.collection SET collectionName=?, description=?, grantCount= ?, assetCount= ?, poamCount= ? WHERE collectionId = ?";

		await connection.query(sql_query, [req.body.collectionName, req.body.description, req.body.grantCount, req.body.assetCount, req.body.poamCount, req.body.collectionId])
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
