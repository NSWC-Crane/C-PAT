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

exports.getPoamLogByPoamId = async function getPoamLogByPoamId(req, res, next) {
    if (!req.params.poamId) {
        console.info('getPoamLogByPoamId poamId not provided.');
        return next({
            status: 422,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            const sql = `
                SELECT pl.timestamp, pl.action, u.fullName
                FROM poamtracking.poamlogs pl
                JOIN poamtracking.user u ON pl.userId = u.userId
                WHERE pl.poamId = ?
            `;
            const [rows] = await connection.query(sql, [req.params.poamId]);
            const poamLog = rows.map(row => ({
                Timestamp: row.timestamp,
                User: row.fullName,
                Action: row.action
            }));
            return { poamLog };
        });
    } catch (error) {
        console.error("Error fetching POAM log:", error);
        return next({
            status: 500,
            errors: { general: 'Internal server error' },
        });
    }
};