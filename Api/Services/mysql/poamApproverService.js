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

async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamApprovers = async function getPoamApprovers(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamApprovers poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.userEmail
                FROM poamtracking.poamapprovers T1
                INNER JOIN poamtracking.user T2 ON T1.userId = T2.userId
                WHERE poamId = ?;
            `;
            let [rows] = await connection.query(sql, [req.params.poamId]);
            var poamApprovers = rows.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }));
            return poamApprovers;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getPoamApproversByCollection collectionId not provided.');
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.userEmail
                FROM poamtracking.poamapprovers T1
                INNER JOIN poamtracking.user T2 ON T1.userId = T2.userId
                INNER JOIN poamtracking.poam T3 ON T1.poamId = T3.poamId
                WHERE T3.collectionId = ?
            `;
            let [rows] = await connection.query(sql, [req.params.collectionId]);
            var poamApprovers = rows.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }));
            return poamApprovers;
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.getPoamApproversByCollectionUser = async function getPoamApproversByCollectionUser(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getPoamApproversByCollectionUser collectionId not provided.');
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    if (!req.params.userId) {
        console.info('getPoamApprovers userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.userEmail
                FROM poamtracking.poamapprovers T1
                INNER JOIN poamtracking.user T2 ON T1.userId = T2.userId
                INNER JOIN poamtracking.poam T3 ON T1.poamId = T3.poamId
                WHERE T3.collectionId = ? AND T1.userId = ?
            `;
            let [rows] = await connection.query(sql, [req.params.collectionId, req.params.userId]);
            var poamApprovers = rows.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }));
            return poamApprovers;
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.getPoamApproversByUserId = async function getPoamApproversByUserId(req, res, next) {
    if (!req.params.userId) {
        console.info('getPoamApproversByUserId userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.userEmail
                FROM poamtracking.poamapprovers T1
                INNER JOIN poamtracking.user T2 ON T1.userId = T2.userId
                INNER JOIN poamtracking.poam T3 ON T1.poamId = T3.poamId
                WHERE T1.userId = ?
            `;
            let [rows] = await connection.query(sql, [req.params.userId]);
            var poamApprovers = rows.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }));
            return poamApprovers;
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.postPoamApprover = async function postPoamApprover(req, res, next) {
    if (!req.body.poamId) {
        console.info('postPoamApprover poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }
    if (!req.body.userId) {
        console.info('postCollectionApprover userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    try {
        return await withConnection(async (connection) => {
            let sql_query = `
                INSERT INTO poamtracking.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.query(sql_query, [
                req.body.poamId, req.body.userId, req.body.approvalStatus,
                req.body.approvedDate, req.body.comments
            ]);

            if (req.body.poamLog[0].userId) {
                let userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
                const [user] = await connection.query(userSql, [req.body.userId]);
                const fullName = user[0] ? user[0].fullName : "Unknown User";
                let action = `${fullName} was added to the Approver List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.body.poamId, action, req.body.poamLog[0].userId]);
            } else {
                console.warn("No poamLog information provided for logging.");
            }

            let sql = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND userId = ?";
            let [row] = await connection.query(sql, [req.body.poamId, req.body.userId]);
            var poamApprover = row.map(row => ({ ...row }))[0];
            return poamApprover;
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async (connection) => {
                let fetchSql = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND userId = ?";
                const [existingApprover] = await connection.query(fetchSql, [req.body.poamId, req.body.userId]);
                return existingApprover[0];
            });
        }
        else {
            console.error("error: ", error);
            return { null: "null" };
        }
    }
};

exports.putPoamApprover = async function putPoamApprover(req, res, next) {
    if (!req.body.poamId) {
        console.info('putPoamApprover poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }
    if (!req.body.userId) {
        console.info('putCollectionApprover userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    try {
        return await withConnection(async (connection) => {
            let sql_query = `
                UPDATE poamtracking.poamapprovers
                SET approvalStatus = ?, approvedDate = ?, comments = ?
                WHERE poamId = ? AND userId = ?;
            `;
            await connection.query(sql_query, [
                req.body.approvalStatus, req.body.approvedDate, req.body.comments,
                req.body.poamId, req.body.userId
            ]);

            if (req.body.poamLog[0].userId) {
                let userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
                const [user] = await connection.query(userSql, [req.body.userId]);
                const fullName = user[0] ? user[0].fullName : "Unknown User";
                let action = `${fullName} was added to the Approver List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.body.poamId, action, req.body.poamLog[0].userId]);
            }

            if (req.body.approvalStatus === 'Rejected') {
                sql_query = "UPDATE poamtracking.poam SET status = ? WHERE poamId = ?;";
                await connection.query(sql_query, ["Rejected", req.body.poamId]);
            } else {
                sql_query = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND approvalStatus != 'Approved';";
                let [rows] = await connection.query(sql_query, [req.body.poamId]);
                if (rows.length === 0) {
                    sql_query = "UPDATE poamtracking.poam SET status = ? WHERE poamId = ?;";
                    await connection.query(sql_query, ["Approved", req.body.poamId]);
                }
            }

            sql_query = "SELECT * FROM poamtracking.poamapprovers WHERE poamId = ? AND userId = ?;";
            let [rows] = await connection.query(sql_query, [req.body.poamId, req.body.userId]);
            var poamApprover = rows.map(row => ({ ...row }));
            return { poamApprover };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}

exports.deletePoamApprover = async function deletePoamApprover(req, res, next) {
    if (!req.params.poamId) {
        console.info('deleteCollectionApprover poamId not provided.');
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }
    if (!req.params.userId) {
        console.info('deleteCollectionApprover userId not provided.');
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.poamapprovers WHERE poamId = ? AND userId = ?";
            await connection.query(sql, [req.params.poamId, req.params.userId]);

            if (req.body.requestorId) {
                let userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
                const [user] = await connection.query(userSql, [req.params.userId]);
                const fullName = user[0] ? user[0].fullName : "Unknown User";
                let action = `${fullName} was removed from the Approver List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.params.poamId, action, req.body.requestorId]);
            }
            return { delete: 'Success' };
        });
    } catch (error) {
        console.error("error: ", error);
        return { null: "null" };
    }
}