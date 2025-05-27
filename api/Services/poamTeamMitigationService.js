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

exports.getPoamTeamMitigations = async function getPoamTeamMitigations() {
    return await withConnection(async (connection) => {
        let sql = `
            SELECT ptm.mitigationId, ptm.poamId, ptm.assignedTeamId, ptm.mitigationText, ptm.isActive,
                   at.assignedTeamName
            FROM ${config.database.schema}.poamteammitigations ptm
            INNER JOIN ${config.database.schema}.assignedteams at ON ptm.assignedTeamId = at.assignedTeamId
            ORDER BY at.assignedTeamName
        `;
        let [rowPoamTeamMitigations] = await connection.query(sql);
        const poamTeamMitigations = rowPoamTeamMitigations.map(row => ({
            mitigationId: row.mitigationId,
            poamId: row.poamId,
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            mitigationText: row.mitigationText,
            isActive: row.isActive != null ? Boolean(row.isActive) : null
        }));
        return { poamTeamMitigations };
    });
};

exports.getPoamTeamMitigationsByPoamId = async function getPoamTeamMitigationsByPoamId(poamId) {
    if (!poamId) {
        throw new Error('getPoamTeamMitigationsByPoamId: poamId is required');
    }

    return await withConnection(async (connection) => {
        let sql = `
            SELECT ptm.mitigationId, ptm.poamId, ptm.assignedTeamId, ptm.mitigationText, ptm.isActive,
                   at.assignedTeamName
            FROM ${config.database.schema}.poamteammitigations ptm
            INNER JOIN ${config.database.schema}.assignedteams at ON ptm.assignedTeamId = at.assignedTeamId
            WHERE ptm.poamId = ?
            ORDER BY at.assignedTeamName
        `;
        let [rowPoamTeamMitigations] = await connection.query(sql, [poamId]);
        const poamTeamMitigations = rowPoamTeamMitigations.map(row => ({
            mitigationId: row.mitigationId,
            poamId: row.poamId,
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            mitigationText: row.mitigationText,
            isActive: row.isActive != null ? Boolean(row.isActive) : null
        }));
        return poamTeamMitigations;
    });
};

exports.postPoamTeamMitigation = async function postPoamTeamMitigation(req, res, next) {
    if (!req.body.assignedTeamId) {
        throw new Error('postPoamTeamMitigation: assignedTeamId is required');
    }

    if (!req.body.poamId) {
        throw new Error('postPoamTeamMitigation: poamId is required');
    }

    return await withConnection(async (connection) => {
        try {
            let fetchSql = `SELECT mitigationId, poamId, assignedTeamId, mitigationText, isActive FROM ${config.database.schema}.poamteammitigations WHERE assignedTeamId = ? AND poamId = ?`;
            const [existingTeamMitigation] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);

            if (existingTeamMitigation.length > 0) {
                let updateSql = `UPDATE ${config.database.schema}.poamteammitigations SET isActive = true WHERE mitigationId = ?`;
                await connection.query(updateSql, [existingTeamMitigation[0].mitigationId]);

                const result = { ...existingTeamMitigation[0] };
                result.isActive = result.isActive != null ? Boolean(result.isActive) : null;
                return result;
            }

            let addSql = `INSERT INTO ${config.database.schema}.poamteammitigations (poamId, assignedTeamId, mitigationText, isActive) VALUES (?, ?, ?, ?)`;
            await connection.query(addSql, [
                req.body.poamId,
                req.body.assignedTeamId,
                req.body.mitigationText || '',
                req.body.isActive !== undefined ? req.body.isActive : true
            ]);

            let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
            const [team] = await connection.query(assignedTeamSql, [req.body.assignedTeamId]);
            const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

            let action = `Team Mitigation was created for ${teamName}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            let fetchNewSql = `SELECT mitigationId, poamId, assignedTeamId, mitigationText, isActive FROM ${config.database.schema}.poamteammitigations WHERE assignedTeamId = ? AND poamId = ?`;
            const [newTeamMitigation] = await connection.query(fetchNewSql, [req.body.assignedTeamId, req.body.poamId]);

            if (newTeamMitigation.length > 0) {
                const result = { ...newTeamMitigation[0] };
                result.isActive = result.isActive != null ? Boolean(result.isActive) : null;
                return result;
            } else {
                throw new Error('Team Mitigation not found after insertion');
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return await withConnection(async (connection) => {
                    let fetchSql = `SELECT mitigationId, poamId, assignedTeamId, mitigationText, isActive FROM ${config.database.schema}.poamteammitigations WHERE assignedTeamId = ? AND poamId = ?`;
                    const [existingTeamMitigation] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);
                    if (existingTeamMitigation.length > 0) {
                        const result = { ...existingTeamMitigation[0] };
                        result.isActive = result.isActive != null ? Boolean(result.isActive) : null;
                        return result;
                    } else {
                        return existingTeamMitigation[0];
                    }
                });
            }
            else {
                return { error: error.message };
            }
        }
    });
};

exports.updatePoamTeamMitigation = async function updatePoamTeamMitigation(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('updatePoamTeamMitigation: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('updatePoamTeamMitigation: poamId is required');
    }
    if (req.body.mitigationText === undefined) {
        throw new Error('updatePoamTeamMitigation: mitigationText is required');
    }

    return await withConnection(async (connection) => {
        try {
            let updateSql = `UPDATE ${config.database.schema}.poamteammitigations SET mitigationText = ? WHERE assignedTeamId = ? AND poamId = ?`;
            await connection.query(updateSql, [req.body.mitigationText, req.params.assignedTeamId, req.params.poamId]);

            let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
            const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
            const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

            let action = `Team Mitigation was updated for ${teamName}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

            let fetchSql = `SELECT mitigationId, poamId, assignedTeamId, mitigationText, isActive FROM ${config.database.schema}.poamteammitigations WHERE assignedTeamId = ? AND poamId = ?`;
            const [teamMitigation] = await connection.query(fetchSql, [req.params.assignedTeamId, req.params.poamId]);

            if (teamMitigation.length > 0) {
                const result = { ...teamMitigation[0] };
                result.isActive = result.isActive != null ? Boolean(result.isActive) : null;
                return result;
            } else {
                throw new Error('Team Mitigation not found after update');
            }
        } catch (error) {
            return { error: error.message };
        }
    });
};

exports.updatePoamTeamMitigationStatus = async function updatePoamTeamMitigationStatus(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('updatePoamTeamMitigationStatus: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('updatePoamTeamMitigationStatus: poamId is required');
    }
    if (req.body.isActive === undefined) {
        throw new Error('updatePoamTeamMitigationStatus: isActive is required');
    }

    return await withConnection(async (connection) => {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await connection.beginTransaction();

                try {
                    let lockSql = `SELECT mitigationId FROM ${config.database.schema}.poamteammitigations
                                   WHERE assignedTeamId = ? AND poamId = ?
                                   FOR UPDATE`;
                    const [existingRecord] = await connection.query(lockSql, [req.params.assignedTeamId, req.params.poamId]);

                    if (existingRecord.length === 0) {
                        throw new Error('Team Mitigation not found');
                    }

                    let updateSql = `UPDATE ${config.database.schema}.poamteammitigations
                                     SET isActive = ?
                                     WHERE assignedTeamId = ? AND poamId = ?`;
                    await connection.query(updateSql, [req.body.isActive, req.params.assignedTeamId, req.params.poamId]);

                    let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams
                                           WHERE assignedTeamId = ?`;
                    const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
                    const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

                    let fetchSql = `SELECT mitigationId, poamId, assignedTeamId, mitigationText, isActive
                                    FROM ${config.database.schema}.poamteammitigations
                                    WHERE assignedTeamId = ? AND poamId = ?`;
                    const [teamMitigation] = await connection.query(fetchSql, [req.params.assignedTeamId, req.params.poamId]);

                    await connection.commit();

                    if (teamMitigation.length > 0) {
                        const result = { ...teamMitigation[0] };
                        result.isActive = result.isActive != null ? Boolean(result.isActive) : null;
                        return result;
                    } else {
                        throw new Error('Team Mitigation not found after status update');
                    }

                } catch (error) {
                    await connection.rollback();
                    throw error;
                }

            } catch (error) {
                if (error.code === 'ER_LOCK_DEADLOCK' && retryCount < maxRetries - 1) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 50));
                    continue;
                }
                return { error: error.message };
            }
        }

        return { error: 'Failed after maximum retry attempts due to deadlock' };
    });
};

exports.deletePoamTeamMitigation = async function deletePoamTeamMitigation(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('deletePoamTeamMitigation: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('deletePoamTeamMitigation: poamId is required');
    }

    await withConnection(async (connection) => {
        let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
        const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
        const teamName = team[0] ? team[0].assignedTeamName : "Unknown Team";

        let sql = `DELETE FROM ${config.database.schema}.poamteammitigations WHERE assignedTeamId = ? AND poamId = ?`;
        await connection.query(sql, [req.params.assignedTeamId, req.params.poamId]);

        let action = `Team Mitigation was deleted for ${teamName}.`;
        let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
        await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);
    });
};