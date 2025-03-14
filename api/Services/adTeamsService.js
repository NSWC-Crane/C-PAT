/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const config = require('../utils/config')
const dbUtils = require('./utils')
const mysql = require('mysql2')

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getADTeamsList = async function getADTeamsList(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT DISTINCT value FROM cpat.assetdeltalist ORDER BY value;"
            let [rowADTeams] = await connection.query(sql);
            return rowADTeams.map(row => row.value);
        });
    } catch (error) {
        next(error);
    }
}