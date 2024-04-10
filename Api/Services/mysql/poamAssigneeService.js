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
const mysql = require('mysql2');

async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamAssignees = async function getPoamAssignees(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.userId, t2.fullName, t1.poamId, t3.description
                FROM poamtracking.poamassignees t1
                INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                ORDER BY t2.fullName
            `;
            let [rowPoamAssignees] = await connection.query(sql);
            var poamAssignees = rowPoamAssignees.map(row => ({
                userId: row.userId,
                fullName: row.fullName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssignees };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
};

exports.getPoamAssigneesByPoamId = async function getPoamAssigneesByPoamId(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamAssigneesByPoamId poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.userId, t2.firstName, t2.lastName, t2.fullName, t2.userEmail, t1.poamId, t3.description
                FROM poamtracking.poamassignees t1
                INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.poamId = ?
                ORDER BY t2.fullName
            `;
            let [rowPoamAssignees] = await connection.query(sql, [req.params.poamId]);
            var poamAssignees = rowPoamAssignees.map(row => ({
                userId: row.userId,
                fullName: row.fullName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssignees };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
};

exports.getPoamAssigneesByUserId = async function getPoamAssigneesByUserId(req, res, next) {
    if (!req.params.userId) {
        console.info('getPoamAssigneesByUserId userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.userId, t2.fullName, t1.poamId, t3.description
                FROM poamtracking.poamassignees t1
                INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.userId = ?
                ORDER BY t2.fullName
            `;
            let [rowPoamAssignees] = await connection.query(sql, [req.params.userId]);
            var poamAssignees = rowPoamAssignees.map(row => ({
                userId: row.userId,
                fullName: row.fullName,
                poamId: row.poamId,
                description: row.description,
            }));
            return { poamAssignees };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
};

exports.getPoamAssignee = async function getPoamAssignee(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamAssignee poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    if (!req.params.userId) {
        console.info('getPoamAssignee userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT t1.userId, t2.fullName, t1.poamId, t3.description
                FROM poamtracking.poamassignees t1
                INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
                INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
                WHERE t1.userId = ? AND t1.poamId = ?
                ORDER BY t2.fullName
            `;
            let [rowPoamAssignee] = await connection.query(sql, [req.params.userId, req.params.poamId]);
            var poamAssignee = rowPoamAssignee.length > 0 ? [rowPoamAssignee[0]] : [];
            return { poamAssignee };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
};

exports.postPoamAssignee = async function postPoamAssignee(req, res, next) {
    if (!req.body.userId) {
        console.info('postPoamAssignee userId not provided.');
        return next({
            status: 422,
            errors: { userId: 'is required' },
        });
    }

    if (!req.body.poamId) {
        console.info('postPoamAssignee poamId not provided.');
        return next({
            status: 422,
            errors: { poamId: 'is required' },
        });
    }

    const { userId, poamId } = req.body;

    try {
        const response = await withConnection(async (connection) => {
            let addSql = "INSERT INTO poamtracking.poamassignees (poamId, userId) VALUES (?, ?)";
            await connection.query(addSql, [poamId, userId]);

            let userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
            const [user] = await connection.query(userSql, [userId]);
            const fullName = user[0] ? user[0].fullName : "Unknown User";

            if (req.body.poamLog[0].userId) {
                let action = `${fullName} was added to the Assignee List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [poamId, action, req.body.poamLog[0].userId]);
            }
            let fetchSql = "SELECT poamId, userId FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
            const [assignee] = await connection.query(fetchSql, [userId, poamId]);

            if (assignee.length > 0) {
                return assignee[0];
            } else {
                throw new Error('Assignee not found after insertion');
            }
        });

        return response;
    } catch (error) {
        console.error("Error in postPoamAssignee service: ", error);
        throw error;
    }
};

exports.deletePoamAssignee = async function deletePoamAssignee(req, res, next) {
    if (!req.params.userId) {
        console.info('deletePoamAssignee userId not provided.');
        return next({
            status: 422,
            errors: {
                userId: 'is required',
            }
        });
    }

    if (!req.params.poamId) {
        console.info('deletePoamAssignee poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }
    try {
        await withConnection(async (connection) => {
            const userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
            const [user] = await connection.query(userSql, [req.params.userId]);
            const fullName = user[0] ? user[0].fullName : "Unknown User";

            let sql = "DELETE FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
            await connection.query(sql, [req.params.userId, req.params.poamId]);

            if (req.body.requestorId) {
                let action = `${fullName} was removed from the Assignee List.`;
                let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.params.poamId, action, req.body.requestorId]);
            }
        });
        var poamAssignee = []

        return { poamAssignee };
    } catch (error) {
        console.error(error);
        return next({
            status: 500,
            errors: { message: "An error occurred while deleting the POAM assignee." }
        });
    }
};

