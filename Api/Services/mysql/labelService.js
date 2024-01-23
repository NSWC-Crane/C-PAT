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

exports.getLabels = async function getLabels(req, res, next) {
	console.log("getLabels (Service) ...");

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT * FROM  poamtracking.label ORDER BY labelName;"
		//console.log("getLabels sql: ", sql)

		let [rowLabels] = await connection.query(sql)
		console.log("rowLabels: ", rowLabels[0])
		await connection.release()

		var size = Object.keys(rowLabels).length

		var labels = []

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			labels.push({
				"labelId": rowLabels[counter].labelId,
				"labelName": rowLabels[counter].labelName,
				"description": rowLabels[counter].description,
				"poamCount": rowLabels[counter].poamCount
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		return { labels };

	}
	catch (error) {
		let errorResponse = { null: "null" }
		//await connection.release()
		return errorResponse;
	}
}

exports.getLabel = async function getLabel(req, res, next) {
	if (!req.params.labelId) {
		console.info('getLabel labelId not provided.');
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
		let sql = "SELECT * FROM  poamtracking.label WHERE labelId=" + req.params.labelId + ";"
		// console.log("getLabel sql: ", sql)

		let [rowLabel] = await connection.query(sql)
		console.log("rowLabel: ", rowLabel[0])
		await connection.release()

		var label = [rowLabel[0]]

		return { label };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		//await connection.release()
		return errorResponse;
	}
}

exports.postLabel = async function postLabel(req, res, next) {
	// res.status(201).json({ message: "postPermission (Service) Method called successfully" });
	// console.log("postPermission req.body: ", req.body)

	if (!req.body.labelName) {
		console.info('postLabel labelName not provided.');
		return next({
			status: 422,
			errors: {
				labelName: 'is required',
			}
		});
	}

	if (!req.body.poamCount) req.body.poamCount = 0;

	try {
		let connection
		connection = await dbUtils.pool.getConnection()

		let sql_query = `INSERT INTO poamtracking.label (labelName, description, poamCount) values (?, ?, ?)`

		//await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.poamCount])
		//await connection.release()
		await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.poamCount])
		await connection.release()

		let sql = "SELECT * FROM poamtracking.label WHERE labelName = '" + req.body.labelName + "';"
		let [rowLabel] = await connection.query(sql)
		console.log("rowLabel: ", rowLabel[0])
		await connection.release()		

		const message = new Object()
		message.labelId = rowLabel[0].labelId
		message.labelName = rowLabel[0].labelName
		message.description = rowLabel[0].description
		message.poamCount = rowLabel[0].poamCount
		return(message)
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.putLabel = async function putLabel(req, res, next) {
	// res.status(201).json({ message: "putPermission (Service) Method called successfully" });
		// console.log("postPermission req.body: ", req.body)
		if (!req.body.labelId) {
			console.info('putLabel labelId not provided.');
			return next({
				status: 422,
				errors: {
					labelId: 'is required',
				}
			});
		}
	
		if (!req.body.labelName) {
			console.info('putLabels labelName not provided.');
			return next({
				status: 422,
				errors: {
					labelName: 'is required',
				}
			});
		}
	
		if (!req.body.description) req.body.description = "";
		if (!req.body.poamCount) req.body.poamCount = 0;
	
		try {
			let connection
			connection = await dbUtils.pool.getConnection()
	
			let sql_query = "UPDATE poamtracking.label SET labelName= ?, description= ?, " +
				"poamCount= ? WHERE labelId = " + req.body.labelId + ";"
	
			await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.poamCount])
			await connection.release()
	
			const message = new Object()
			message.labelId = req.body.labelId
			message.labelName = req.body.labelName
			message.description = req.body.description
			message.poamCount = req.body.poamCount
			return(message)
		}
		catch (error) {
			let errorResponse = { null: "null" }
			await connection.release()
			return errorResponse;
		}
}

exports.deleteLabel = async function deleteLabel(req, res, next) {
	// res.status(201).json({ message: "deletePermission (Service) Method called successfully" });
	if (!req.params.labelId) {
		console.info('deleteLabel labelId not provided.');
		return next({
			status: 422,
			errors: {
				labelId: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()
		let sql = "DELETE FROM  poamtracking.label WHERE labelId=" + req.params.labelId + ";"
		//console.log("deleteLabel sql: ", sql)

		await connection.query(sql)
		// console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()

		var label = []
		
		return { label };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}
