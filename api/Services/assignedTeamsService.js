/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
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

exports.getAssignedTeams = async function getAssignedTeams(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.assignedteams;";
            let [rowAssignedTeams] = await connection.query(sql);

            const assignedTeams = rowAssignedTeams.map(row => ({
                assignedTeamId: row.assignedTeamId,
                assignedTeamName: row.assignedTeamName
            }));

            return assignedTeams;
        });
    } catch (error) {
        next(error);
    }
}

exports.getAssignedTeam = async function getAssignedTeam(req, res, next) {
    if (!req.params.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.assignedteams WHERE assignedTeamId = ?";
            let [rowAssignedTeam] = await connection.query(sql, [req.params.assignedTeamId]);

            const assignedTeam = rowAssignedTeam.length > 0 ? [rowAssignedTeam[0]] : [];

            return { assignedTeam };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.postAssignedTeam = async function postAssignedTeam(req, res, next) {
    if (!req.body.assignedTeamName) {
        return next({
            status: 400,
            errors: {
                assignedTeamName: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.assignedteams (assignedTeamName) VALUES (?)`;
            await connection.query(sql_query, [req.body.assignedTeamName]);

            let sql = "SELECT * FROM cpat.assignedteams WHERE assignedTeamName = ?";
            let [rowAssignedTeam] = await connection.query(sql, [req.body.assignedTeamName]);

            const assignedTeam = {
                assignedTeamId: rowAssignedTeam[0].assignedTeamId,
                assignedTeamName: rowAssignedTeam[0].assignedTeamName
            };
            return assignedTeam;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.putAssignedTeam = async function putAssignedTeam(req, res, next) {
    if (!req.body.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    } else if (!req.body.assignedTeamName) {
        return next({
            status: 400,
            errors: {
                assignedTeamName: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.assignedteams SET assignedTeamName = ? WHERE assignedTeamId = ?";
            await connection.query(sql_query, [req.body.assignedTeamName, req.body.assignedTeamId]);

            const assignedTeam = {
                assignedTeamId: req.body.assignedTeamId,
                assignedTeamName: req.body.assignedTeamName
            };
            return assignedTeam;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deleteAssignedTeam = async function deleteAssignedTeam(req, res, next) {
    if (!req.params.assignedTeamId) {
        return next({
            status: 400,
            errors: {
                assignedTeamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.assignedteams WHERE assignedTeamId = ?";
            await connection.query(sql, [req.params.assignedTeamId]);

            return { assignedTeam: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}