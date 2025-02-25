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
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamAssignedTeams = async function getPoamAssignedTeams() {
    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.assignedTeamId, t2.assignedTeamName, t1.automated, t1.poamId, t3.status
            FROM cpat.poamassignedteams t1
            INNER JOIN cpat.assignedteams t2 ON t1.assignedTeamId = t2.assignedTeamId
            INNER JOIN cpat.poam t3 ON t1.poamId = t3.poamId
            ORDER BY t2.assignedTeamName
        `;
        let [rowPoamAssignedTeams] = await connection.query(sql);
        const poamAssignedTeams = rowPoamAssignedTeams.map(row => ({
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            automated: row.automated,
            poamId: row.poamId,
            status: row.status,
        }));
        return { poamAssignedTeams };
    });
};

exports.getPoamAssignedTeamsByPoamId = async function getPoamAssignedTeamsByPoamId(poamId) {
    if (!poamId) {
        throw new Error('getPoamAssignedTeamsByPoamId: poamId is required');
    }

    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.assignedTeamId, t1.automated, t1.poamId, t2.assignedTeamName, t3.status
            FROM cpat.poamassignedteams t1
            INNER JOIN cpat.assignedteams t2 ON t1.assignedTeamId = t2.assignedTeamId
            INNER JOIN cpat.poam t3 ON t1.poamId = t3.poamId
            WHERE t1.poamId = ?
            ORDER BY t2.assignedTeamName
        `;
        let [rowPoamAssignedTeams] = await connection.query(sql, [poamId]);
        const poamAssignedTeams = rowPoamAssignedTeams.map(row => ({
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            automated: row.automated,
            poamId: row.poamId,
            status: row.status,
        }));
        return poamAssignedTeams;
    });
};


exports.postPoamAssignedTeam = async function postPoamAssignedTeam(req, res, next) {
    if (!req.body.assignedTeamId) {
        throw new Error('postPoamAssignedTeam: assignedTeamId is required');
    }

    if (!req.body.poamId) {
        throw new Error('postPoamAssignedTeam: poamId is required');
    }

    return await withConnection(async (connection) => {
        try {
            let fetchSql = "SELECT poamId, assignedTeamId, automated FROM cpat.poamassignedteams WHERE assignedTeamId = ? AND poamId = ?";
            const [existingAssignedTeam] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);

            if (existingAssignedTeam.length > 0) {
                return existingAssignedTeam[0];
            }

            let addSql = "INSERT INTO cpat.poamassignedteams (poamId, assignedTeamId, automated) VALUES (?, ?, ?)";
            await connection.query(addSql, [req.body.poamId, req.body.assignedTeamId, req.body.automated ? req.body.automated : false ]);

            let assignedTeamSql = "SELECT assignedTeamName FROM cpat.assignedteams WHERE assignedTeamId = ?";
            const [team] = await connection.query(assignedTeamSql, [req.body.assignedTeamId]);
            const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

                let action = `${teamName} was added to the Assigned Team List.`;
                let logSql = "INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            let fetchNewSql = "SELECT poamId, assignedTeamId, automated FROM cpat.poamassignedteams WHERE assignedTeamId = ? AND poamId = ?";
            const [newAssignedTeam] = await connection.query(fetchNewSql, [req.body.assignedTeamId, req.body.poamId]);

            if (newAssignedTeam.length > 0) {
                return newAssignedTeam[0];
            } else {
                throw new Error('Assigned Team not found after insertion');
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return await withConnection(async (connection) => {
                    let fetchSql = "SELECT poamId, assignedTeamId, automated FROM cpat.poamassignedteams WHERE assignedTeamId = ? AND poamId = ?";
                    const [existingAssignedTeam] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);
                    return existingAssignedTeam[0];
                });
            }
            else {
                return { error: error.message };
            }
        }
    });
};

exports.deletePoamAssignedTeam = async function deletePoamAssignedTeam(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('deletePoamAssignedTeam: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('deletePoamAssignedTeam: poamId is required');
    }

    await withConnection(async (connection) => {
        let assignedTeamSql = "SELECT assignedTeamName FROM cpat.assignedteams WHERE assignedTeamId = ?";
        const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
        const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

        let sql = "DELETE FROM cpat.poamassignedteams WHERE assignedTeamId = ? AND poamId = ?";
        await connection.query(sql, [req.params.assignedTeamId, req.params.poamId]);

            let action = `${teamName} was removed from the Assigned Team List.`;
        let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);
    });
};