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

exports.getCollectionApprovers = async function getCollectionApprovers(req, res, next) {
	//console.log("getCollectionApprovers (Service) ...");
	if (!req.params.collectionId) {
		console.info('getCollectionApprovers colledtionId not provided.');
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
		
		let sql = "SELECT T1.*,T2.firstName, T2.lastName, T2.fullName, T2.userEmail FROM  poamtracking.collectionapprovers T1 " + 
		"INNER JOIN poamtracking.user T2 ON t1.userId = t2.userId WHERE collectionId = ?;"

		let [rows] = await connection.query(sql, req.params.collectionId)
		await connection.release()

		var size = Object.keys(rows).length

		var collectionApprovers = []

		for (let counter = 0; counter < size; counter++) {
			collectionApprovers.push({
				...rows[counter]
			});
		}

		return { collectionApprovers };

	}
	catch (error) {
		let errorResponse = { null: "null" }
		return errorResponse;
	}
}

exports.postCollectionApprover = async function postCollectionApprover(req, res, next) {
	if (!req.body.collectionId) {
		console.info('postCollectionApprover collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}
	if (!req.body.userId) {
		console.info('postCollectionApprover userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	if (!req.body.status) {
		console.info('postCollectionApprover status not provided.');
		return next({
			status: 422,
			errors: {
				statusId: 'is required',
			}
		});
	}
	let connection
	try {

		connection = await dbUtils.pool.getConnection();

		let sql_query = `INSERT INTO poamtracking.collectionapprovers (collectionId, userId, status) values (?, ?, ?)`

		await connection.query(sql_query, [req.body.collectionId, req.body.userId, req.body.status]);
		await connection.release();

		connection = await dbUtils.pool.getConnection();
		let sql = "SELECT * FROM poamtracking.collectionapprovers WHERE collectionId = ? AND userId = ?";
		let row = await connection.query(sql, [req.body.collectionId, req.body.userId]);

		await connection.release();
		//console.log("row: ", row[0]);

		var size = Object.keys(row).length

		var collectionApprover = []

		for (let counter = 0; counter < size; counter++) {
			collectionApprover.push({
				...row[counter]
			});

			
		}
		return ({collectionApprover})
	}
	catch (error) {
			console.log("error: ", error);
			let errorResponse = { null: "null" }
			if (connection) await connection.release()
			return errorResponse;
		}
	}

exports.putCollectionApprover = async function putCollectionApprover(req, res, next) {
	if (!req.body.collectionId) {
		console.info('putCollectionApprover collectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}
	if (!req.body.userId) {
		console.info('putCollectionApprover userId not provided.');
		return next({
			status: 422,
			errors: {
				userId: 'is required',
			}
		});
	}

	if (!req.body.status) {
		console.info('putCollectionApprover status not provided.');
		return next({
			status: 422,
			errors: {
				statusId: 'is required',
			}
		});
	}
	let connection
	try {

		connection = await dbUtils.pool.getConnection()

		let sql_query = "UPDATE poamtracking.collectionapprovers SET status= ? WHERE collectionId = ? AND userId = ?";

		await connection.query(sql_query, [req.body.status, req.body.collectionId, req.body.userId])
		await connection.release()

		connection = await dbUtils.pool.getConnection();
		let sql = "SELECT * FROM poamtracking.collectionapprovers WHERE collectionId = ? AND userId = ?";
		let row = await connection.query(sql, [req.body.collectionId, req.body.userId]);

		await connection.release();


		var size = Object.keys(row).length

		var collectionApprover = []

		for (let counter = 0; counter < size; counter++) {
			collectionApprover.push({
				...row[counter]
			});

			
		}
		return ({ collectionApprover })
	}
		catch (error) {
			console.log("error: ", error);
			let errorResponse = { null: "null" }
			await connection.release()
			return errorResponse;
		}
	}

	exports.deleteCollectionAprover = async function deleteCollectionApprover(req, res, next) {
		if (!req.params.collectionId) {
			console.info('deleteCollectionApprover collectionId not provided.');
			return next({
				status: 422,
				errors: {
					collectionId: 'is required',
				}
			});
		}
		if (!req.params.userId) {
			console.info('deleteCollectionApprover userId not provided.');
			return next({
				status: 422,
				errors: {
					userId: 'is required',
				}
			});
		}
		let connection
		try {
			
			connection = await dbUtils.pool.getConnection()
			let sql = "DELETE FROM  poamtracking.collectionapprovers WHERE collectionId = ? AND userId = ?";

			await connection.query(sql, [req.params.collectionId, req.params.userId])
			await connection.release()

			var collectionApprover = {delete: 'Success'}

			return collectionApprover;
		}
		catch (error) {
			console.log("error: ", error);
			let errorResponse = { null: "null" }
			await connection.release()
			return errorResponse;
		}
	}
