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

exports.getAssignedTeams = async function getAssignedTeams(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT
                    t.assignedTeamId,
                    t.assignedTeamName,
                    t.adTeam,
                    GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
                FROM cpat.assignedteams t
                LEFT JOIN cpat.assignedteampermissions p
                    ON t.assignedTeamId = p.assignedTeamId
                LEFT JOIN cpat.collection c
                    ON p.collectionId = c.collectionId
                GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
            `;
            let [rowAssignedTeams] = await connection.query(sql);
            const assignedTeams = rowAssignedTeams.map(row => ({
                assignedTeamId: row.assignedTeamId,
                assignedTeamName: row.assignedTeamName,
                adTeam: row.adTeam,
                permissions: row.collectionData ?
                    row.collectionData.split(',').map(data => {
                        const [id, name] = data.split(':');
                        return {
                            collectionId: parseInt(id),
                            collectionName: name || ''
                        };
                    }) :
                    []
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
            let sql = `
                SELECT
                    t.assignedTeamId,
                    t.assignedTeamName,
                    t.adTeam,
                    GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
                FROM cpat.assignedteams t
                LEFT JOIN cpat.assignedteampermissions p
                    ON t.assignedTeamId = p.assignedTeamId
                LEFT JOIN cpat.collection c
                    ON p.collectionId = c.collectionId
                WHERE t.assignedTeamId = ?
                GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
            `;
            let [rowAssignedTeam] = await connection.query(sql, [req.params.assignedTeamId]);
            if (rowAssignedTeam.length === 0) {
                return { assignedTeam: [] };
            }
            const assignedTeam = [{
                assignedTeamId: rowAssignedTeam[0].assignedTeamId,
                assignedTeamName: rowAssignedTeam[0].assignedTeamName,
                adTeam: rowAssignedTeam[0].adTeam,
                permissions: rowAssignedTeam[0].collectionData ?
                    rowAssignedTeam[0].collectionData.split(',').map(data => {
                        const [id, name] = data.split(':');
                        return {
                            collectionId: parseInt(id),
                            collectionName: name || ''
                        };
                    }) :
                    []
            }];
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
            let sql_query = `INSERT INTO cpat.assignedteams (assignedTeamName, adTeam) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam ]);

            let sql = "SELECT * FROM cpat.assignedteams WHERE assignedTeamName = ?";
            let [rowAssignedTeam] = await connection.query(sql, [req.body.assignedTeamName]);

            const assignedTeam = {
                assignedTeamId: rowAssignedTeam[0].assignedTeamId,
                assignedTeamName: rowAssignedTeam[0].assignedTeamName,
                adTeam: rowAssignedTeam[0].adTeam
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
            let sql_query = "UPDATE cpat.assignedteams SET assignedTeamName = ?, adTeam = ? WHERE assignedTeamId = ?";
            await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam ]);

            const assignedTeam = {
                assignedTeamId: req.body.assignedTeamId,
                assignedTeamName: req.body.assignedTeamName,
                adTeam: req.body.adTeam
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

exports.postAssignedTeamPermission = async function postAssignedTeamPermission(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            const { assignedTeamId, collectionId } = req.body;

            let sql = `
                INSERT INTO cpat.assignedteampermissions
                (assignedTeamId, collectionId)
                VALUES (?, ?)
            `;

            await connection.query(sql, [assignedTeamId, collectionId]);

            return {
                assignedTeamId,
                collectionId
            };
        });
    } catch (error) {
        next(error);
    }
}

exports.deleteAssignedTeamPermission = async function deleteAssignedTeamPermission(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            const { assignedTeamId, collectionId } = req.params;

            let sql = `
                DELETE FROM cpat.assignedteampermissions
                WHERE assignedTeamId = ? AND collectionId = ?
            `;

            const [result] = await connection.query(sql, [assignedTeamId, collectionId]);

            if (result.affectedRows === 0) {
                throw {
                    status: 404,
                    message: 'Permission not found'
                };
            }

            return { success: true };
        });
    } catch (error) {
        next(error);
    }
}