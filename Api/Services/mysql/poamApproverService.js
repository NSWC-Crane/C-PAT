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

exports.getPoamApprovers = async function getPoamApprovers(req, res, next) {
	//console.log("getPoamApprovers (Service) ...");
	if (!req.params.poamId) {
		console.info('getPoamApprovers poamId not provided.');
		return next({
			status: 422,
			errors: {
				poamId: 'is required',
			}
		});
	}
	let connection
	try {

		connection = await dbUtils.pool.getConnection()
		let sql = "SELECT T1.*,T2.firstName, T2.lastName, T2.fullName, T2.phoneNumber, T2.userEmail FROM  poamtracking.poamapprovers T1 " +
			"INNER JOIN poamtracking.user T2 ON t1.userId = t2.userId WHERE poamId = ?;"
		//console.log("getLabels sql: ", sql)

		let [rows] = await connection.query(sql, req.params.poamId)

		//console.log("rows: ", rows[0])
		await connection.release()

		var size = Object.keys(rows).length

		var poamApprovers = []

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			poamApprovers.push({
				...rows[counter]
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		return { poamApprovers };

	}
	catch (error) {
		let errorResponse = { null: "null" }
		//await connection.release()
		return errorResponse;
	}
}

exports.postPoamApprover = async function postPoamApprover(req, res, next) {
	// res.status(201).json({ message: "postPermission (Service) Method called successfully" });
	//console.log("postPoamAprover req.body: ", req.body)

	if (!req.body.poamId) {
		console.info('postPoamApprover poamId not provided.');
		return next({
			status: 422,
			errors: {
				poamId: 'is required',
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

	if (!req.body.approved) req.body.approved = 'Not Reviewed';
	if (!req.body.approvedDate) req.body.approvedDate = null;
	if (!req.body.comments) req.body.comments = null;
	let connection
	try {

		connection = await dbUtils.pool.getConnection()

		let sql_query = `INSERT INTO poamtracking.poamapprovers (poamId, userId, approved, approvedDate, comments) values (?, ?, ?, ?, ?)`

		//await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.poamCount])
		//await connection.release()
		await connection.query(sql_query, [req.body.poamId, req.body.userId, req.body.approved, req.body.approvedDate, req.body.comments])
		await connection.release()

		let sql = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = " + req.body.poamId + " AND userId = " + req.body.userId + ";"
		let [row] = await connection.query(sql)
		//console.log("row: ", row[0])
		await connection.release()


		var size = Object.keys(row).length

		var poamApprover = []

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			poamApprover.push({
				...row[counter]
			});

		}
		return ({ poamApprover })
	}
	catch (error) {
		console.log("error: ", error);
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.getPoamApproversByCollectionUser = async function getPoamApproversByCollectionUser(req, res, next) {
	//console.log("getPoamApprovers (Service) ...");
	if (!req.params.collectionId) {
		console.info('getPoamApproversByCollectionUser colectionId not provided.');
		return next({
			status: 422,
			errors: {
				collectionId: 'is required',
			}
		});
	}
	if (!req.params.userId) {
		console.info('getPoamApprovers userId not provided.');
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
		let sql = `SELECT T1.*,T2.firstName, T2.lastName, T2.fullName, T2.phoneNumber, T2.userEmail FROM  poamtracking.poamapprovers T1 ` +
			`INNER JOIN poamtracking.user T2 ON T1.userId = T2.userId ` +
			`INNER JOIN poamtracking.poam T3 ON T1.poamId = T3.poamId WHERE T3.collectionId = ? AND T1. userId = ?`
		//console.log("getLabels sql: ", sql)

		let [rows] = await connection.query(sql, [req.params.collectionId, req.params.userId])

		console.log("rows: ", rows[0])
		await connection.release()

		var size = Object.keys(rows).length

		var poamApprovers = []

		for (let counter = 0; counter < size; counter++) {
			// console.log("Before setting permissions size: ", size, ", counter: ",counter);

			poamApprovers.push({
				...rows[counter]
			});
			// console.log("After setting permissions size: ", size, ", counter: ",counter);
			// if (counter + 1 >= size) break;
		}

		return { poamApprovers };

	}
	catch (error) {
		console.log("error: ", error)
		let errorResponse = { null: "null" }
		//await connection.release()
		return errorResponse;
	}
}

exports.putPoamApprover = async function putPoamApprover(req, res, next) {
	// res.status(201).json({ message: "putPermission (Service) Method called successfully" });
	// console.log("putPoamApprover req.body: ", req.body)
	if (!req.body.poamId) {
		console.info('putPoamApprover poamId not provided.');
		return next({
			status: 422,
			errors: {
				poamId: 'is required',
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

	if (!req.body.approved) req.body.approved = 'Not Reviewed';
	if (!req.body.approvedDate) req.body.approvedDate = null;
	if (!req.body.comments) req.body.comments = null;

	let connection
	try {

		connection = await dbUtils.pool.getConnection()

		let sql_query = "UPDATE poamtracking.poamapprovers SET approved= ?, approvedDate = ?, comments = ? WHERE poamId = " + req.body.poamId + " AND userId = " + req.body.userId + ";"

		await connection.query(sql_query, [req.body.approved, req.body.approvedDate, req.body.comments])

		if (req.body.approved === 'Rejected') {
			// If one approver rejects, we must reject the POAM
			sql_query = "UPDATE poamtracking.poam SET status = ? WHERE poamId = ?;"
			await connection.query(sql_query, ["Rejected", req.body.poamId])
		} else {
			// if all approvers Approved, then we approve the POAM
			sql_query = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND approved != 'Approved';"
			let [rows] = await connection.query(sql_query, [req.body.poamId])
			if (Object.keys(rows).length == 0) {
				sql_query = "UPDATE poamtracking.poam SET status = ? WHERE poamId = ?;"
				await connection.query(sql_query, ["Approved", req.body.poamId])
			}
		}

		// return the updated row
		sql_query = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND userId = ?;"
		let [rows] = await connection.query(sql_query, [req.body.poamId, req.body.userId])

		await connection.release()

		var size = Object.keys(rows).length
		var poamApprover = []

		for (let counter = 0; counter < size; counter++) {

			poamApprover.push({ ...rows[counter] });
		}

		return ({ poamApprover })

	}
	catch (error) {
		console.log("error: ", error);
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}

exports.deletePoamAprover = async function deletePoamApprover(req, res, next) {
	// res.status(201).json({ message: "deleteColectionApprover (Service) Method called successfully" });
	if (!req.params.poamId) {
		console.info('deleteCollectionApprover poamId not provided.');
		return next({
			status: 422,
			errors: {
				poamId: 'is required',
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
		let sql = "DELETE FROM  poamtracking.poamapprovers WHERE poamId=" + req.params.poamId + " AND userId = " + req.params.userId + ";"
		//console.log("deleteLabel sql: ", sql)

		await connection.query(sql)
		// console.log("rowPermissions: ", rowPermissions[0])
		await connection.release()


		var poamApprover = { delete: 'Success' }

		return poamApprover;
	}
	catch (error) {
		console.log("error: ", error);
		let errorResponse = { null: "null" }
		await connection.release()
		return errorResponse;
	}
}
