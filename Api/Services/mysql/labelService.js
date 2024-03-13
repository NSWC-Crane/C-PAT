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
	if (!req.params.collectionId) {
		console.info('getLabel collectionId not provided.');
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
		let sql = "SELECT * FROM poamtracking.label WHERE collectionId = ? ORDER BY labelName;";
		let [rowLabels] = await connection.query(sql, [req.params.collectionId]);

		console.log("rowLabels: ", rowLabels[0])
		await connection.release()

		var size = Object.keys(rowLabels).length

		var labels = []

		for (let counter = 0; counter < size; counter++) {

			labels.push({
				"labelId": rowLabels[counter].labelId,
				"labelName": rowLabels[counter].labelName,
				"description": rowLabels[counter].description,
			});
		}

		return { labels };

	}
	catch (error) {
		let errorResponse = { null: "null" }
		return errorResponse;
	}
}

exports.getLabel = async function getLabel(req, res, next) {
	if (!req.params.labelId) {
		console.info('getLabel labelId not provided.');
		return next({
			status: 422,
			errors: {
				labelId: 'is required',
			}
		});
	} else if (!req.params.collectionId) {
		console.info('getLabel collectionId not provided.');
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
		let sql = "SELECT * FROM poamtracking.label WHERE labelId = ? AND collectionId = ?";
		let [rowLabel] = await connection.query(sql, [req.params.labelId, req.params.collectionId]);

		console.log("rowLabel: ", rowLabel[0])
		await connection.release()

		var label = [rowLabel[0]]

		return { label };
	}
	catch (error) {
		let errorResponse = { null: "null" }
		return errorResponse;
	}
}

exports.postLabel = async function postLabel(req, res, next) {
	if (!req.params.collectionId) {
		console.info('getLabel collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	} else if (!req.body.labelName) {
		console.info('postLabel labelName not provided.');
		return next({
			status: 422,
			errors: {
				labelName: 'is required',
			}
		});
	}

	try {
		let connection
		connection = await dbUtils.pool.getConnection()

		let sql_query = `INSERT INTO poamtracking.label (labelName, description, collectionId) VALUES (?, ?, ?)`;
		await connection.query(sql_query, [req.body.labelName, req.body.description, req.params.collectionId]);

		await connection.release()

		let sql = "SELECT * FROM poamtracking.label WHERE labelName = ? AND collectionId = ?";
		let [rowLabel] = await connection.query(sql, [req.body.labelName, req.params.collectionId]);

		console.log("rowLabel: ", rowLabel[0])
		await connection.release()		

		const message = new Object()
		message.labelId = rowLabel[0].labelId
		message.labelName = rowLabel[0].labelName
		message.description = rowLabel[0].description
		return(message)
	}
	catch (error) {
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.putLabel = async function putLabel(req, res, next) {
	if (!req.params.collectionId) {
		console.info('getLabel collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	} else if (!req.body.labelId) {
		console.info('putLabel labelId not provided.');
		return next({
			status: 422,
			errors: {
				labelId: 'is required',
			}
		});
	} else if (!req.body.labelName) {
		console.info('putLabels labelName not provided.');
		return next({
			status: 422,
			errors: {
				labelName: 'is required',
			}
		});
	} else if (!req.body.description) {
		req.body.description = "";
	}
	
		try {
			let connection
			connection = await dbUtils.pool.getConnection()
	
			let sql_query = "UPDATE poamtracking.label SET labelName = ?, description = ? WHERE labelId = ? AND collectionId = ?";
			await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.labelId, req.params.collectionId]);

			await connection.release()
	
			const message = new Object()
			message.labelId = req.body.labelId
			message.labelName = req.body.labelName
			message.description = req.body.description
			return(message)
		}
		catch (error) {
			let errorResponse = { null: "null" }
			await connection.release()
			return errorResponse;
		}
}

exports.deleteLabel = async function deleteLabel(req, res, next) {
	if (!req.params.labelId) {
		console.info('getLabel labelId not provided.');
		return next({
			status: 422,
			errors: {
				labelId: 'is required',
			}
		});
	} else if (!req.params.collectionId) {
		console.info('getLabel collectionId not provided.');
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
		let sql = "DELETE FROM poamtracking.label WHERE labelId = ? AND collectionId = ?";
		await connection.query(sql, [req.params.labelId, req.params.collectionId]);

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
