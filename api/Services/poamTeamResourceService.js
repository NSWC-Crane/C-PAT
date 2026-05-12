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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamTeamResources = async function getPoamTeamResources() {
    return await withConnection(async connection => {
        let sql = `
            SELECT ptr.resourceId, ptr.poamId, ptr.assignedTeamId, ptr.resourceText, ptr.isActive,
                   at.assignedTeamName
            FROM ${config.database.schema}.poamteamresources ptr
            INNER JOIN ${config.database.schema}.assignedteams at ON ptr.assignedTeamId = at.assignedTeamId
            ORDER BY at.assignedTeamName
        `;
        let [rowPoamTeamResources] = await connection.query(sql);
        const poamTeamResources = rowPoamTeamResources.map(row => ({
            resourceId: row.resourceId,
            poamId: row.poamId,
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            resourceText: row.resourceText,
            isActive: row.isActive == null ? null : Boolean(row.isActive),
        }));
        return { poamTeamResources };
    });
};

exports.getPoamTeamResourcesByPoamId = async function getPoamTeamResourcesByPoamId(poamId) {
    if (!poamId) {
        throw new Error('getPoamTeamResourcesByPoamId: poamId is required');
    }

    return await withConnection(async connection => {
        let sql = `
            SELECT ptr.resourceId, ptr.poamId, ptr.assignedTeamId, ptr.resourceText, ptr.isActive,
                   at.assignedTeamName
            FROM ${config.database.schema}.poamteamresources ptr
            INNER JOIN ${config.database.schema}.assignedteams at ON ptr.assignedTeamId = at.assignedTeamId
            WHERE ptr.poamId = ?
            ORDER BY at.assignedTeamName
        `;
        let [rowPoamTeamResources] = await connection.query(sql, [poamId]);
        const poamTeamResources = rowPoamTeamResources.map(row => ({
            resourceId: row.resourceId,
            poamId: row.poamId,
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            resourceText: row.resourceText,
            isActive: row.isActive == null ? null : Boolean(row.isActive),
        }));
        return poamTeamResources;
    });
};

exports.postPoamTeamResource = async function postPoamTeamResource(req, res, next) {
    if (!req.body.assignedTeamId) {
        throw new Error('postPoamTeamResource: assignedTeamId is required');
    }

    if (!req.body.poamId) {
        throw new Error('postPoamTeamResource: poamId is required');
    }

    return await withConnection(async connection => {
        try {
            let fetchSql = `SELECT resourceId, poamId, assignedTeamId, resourceText, isActive FROM ${config.database.schema}.poamteamresources WHERE assignedTeamId = ? AND poamId = ?`;
            const [existingTeamResource] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);

            if (existingTeamResource.length > 0) {
                let updateSql = `UPDATE ${config.database.schema}.poamteamresources SET isActive = true WHERE resourceId = ?`;
                await connection.query(updateSql, [existingTeamResource[0].resourceId]);

                const result = { ...existingTeamResource[0] };
                result.isActive = result.isActive == null ? null : Boolean(result.isActive);
                return result;
            }

            let addSql = `INSERT INTO ${config.database.schema}.poamteamresources (poamId, assignedTeamId, resourceText, isActive) VALUES (?, ?, ?, ?)`;
            await connection.query(addSql, [
                req.body.poamId,
                req.body.assignedTeamId,
                req.body.resourceText || '',
                req.body.isActive == undefined ? true : req.body.isActive,
            ]);

            let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
            const [team] = await connection.query(assignedTeamSql, [req.body.assignedTeamId]);
            const teamName = team[0] ? team[0].assignedTeamName : 'Unknown Team';

            let action = `Team Resources was created for ${teamName}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            let fetchNewSql = `SELECT resourceId, poamId, assignedTeamId, resourceText, isActive FROM ${config.database.schema}.poamteamresources WHERE assignedTeamId = ? AND poamId = ?`;
            const [newTeamResource] = await connection.query(fetchNewSql, [req.body.assignedTeamId, req.body.poamId]);

            if (newTeamResource.length > 0) {
                const result = { ...newTeamResource[0] };
                result.isActive = result.isActive == null ? null : Boolean(result.isActive);
                return result;
            } else {
                throw new Error('Team Resource not found after insertion');
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return await withConnection(async connection => {
                    let fetchSql = `SELECT resourceId, poamId, assignedTeamId, resourceText, isActive FROM ${config.database.schema}.poamteamresources WHERE assignedTeamId = ? AND poamId = ?`;
                    const [existingTeamResource] = await connection.query(fetchSql, [req.body.assignedTeamId, req.body.poamId]);
                    if (existingTeamResource.length > 0) {
                        const result = { ...existingTeamResource[0] };
                        result.isActive = result.isActive == null ? null : Boolean(result.isActive);
                        return result;
                    } else {
                        return existingTeamResource[0];
                    }
                });
            } else {
                return { error: error.message };
            }
        }
    });
};

exports.updatePoamTeamResource = async function updatePoamTeamResource(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('updatePoamTeamResource: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('updatePoamTeamResource: poamId is required');
    }
    if (req.body.resourceText === undefined) {
        throw new Error('updatePoamTeamResource: resourceText is required');
    }

    return await withConnection(async connection => {
        try {
            let updateSql = `UPDATE ${config.database.schema}.poamteamresources SET resourceText = ? WHERE assignedTeamId = ? AND poamId = ?`;
            await connection.query(updateSql, [req.body.resourceText, req.params.assignedTeamId, req.params.poamId]);

            let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
            const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
            const teamName = team[0] ? team[0].assignedTeamName : 'Unknown Team';

            let action = `Team Resources was updated for ${teamName}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

            let fetchSql = `SELECT resourceId, poamId, assignedTeamId, resourceText, isActive FROM ${config.database.schema}.poamteamresources WHERE assignedTeamId = ? AND poamId = ?`;
            const [teamResource] = await connection.query(fetchSql, [req.params.assignedTeamId, req.params.poamId]);

            if (teamResource.length > 0) {
                const result = { ...teamResource[0] };
                result.isActive = result.isActive == null ? null : Boolean(result.isActive);
                return result;
            } else {
                throw new Error('Team Resource not found after update');
            }
        } catch (error) {
            return { error: error.message };
        }
    });
};

exports.updatePoamTeamResourceStatus = async function updatePoamTeamResourceStatus(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('updatePoamTeamResourceStatus: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('updatePoamTeamResourceStatus: poamId is required');
    }
    if (req.body.isActive === undefined) {
        throw new Error('updatePoamTeamResourceStatus: isActive is required');
    }

    return await withConnection(async connection => {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await connection.beginTransaction();

                try {
                    let lockSql = `SELECT resourceId FROM ${config.database.schema}.poamteamresources
                                   WHERE assignedTeamId = ? AND poamId = ?
                                   FOR UPDATE`;
                    const [existingRecord] = await connection.query(lockSql, [req.params.assignedTeamId, req.params.poamId]);

                    if (existingRecord.length === 0) {
                        throw new Error('Team Resource not found');
                    }

                    let updateSql = `UPDATE ${config.database.schema}.poamteamresources
                                     SET isActive = ?
                                     WHERE assignedTeamId = ? AND poamId = ?`;
                    await connection.query(updateSql, [req.body.isActive, req.params.assignedTeamId, req.params.poamId]);

                    let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams
                                           WHERE assignedTeamId = ?`;
                    const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
                    const teamName = team[0] ? team[0].assignedTeamName : 'Unknown Team';

                    let fetchSql = `SELECT resourceId, poamId, assignedTeamId, resourceText, isActive
                                    FROM ${config.database.schema}.poamteamresources
                                    WHERE assignedTeamId = ? AND poamId = ?`;
                    const [teamResource] = await connection.query(fetchSql, [req.params.assignedTeamId, req.params.poamId]);

                    await connection.commit();

                    if (teamResource.length > 0) {
                        const result = { ...teamResource[0] };
                        result.isActive = result.isActive == null ? null : Boolean(result.isActive);
                        result.assignedTeamName = teamName;
                        return result;
                    } else {
                        throw new Error('Team Resource not found after status update');
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

exports.deletePoamTeamResource = async function deletePoamTeamResource(req, res, next) {
    if (!req.params.assignedTeamId) {
        throw new Error('deletePoamTeamResource: assignedTeamId is required');
    }
    if (!req.params.poamId) {
        throw new Error('deletePoamTeamResource: poamId is required');
    }

    await withConnection(async connection => {
        let assignedTeamSql = `SELECT assignedTeamName FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
        const [team] = await connection.query(assignedTeamSql, [req.params.assignedTeamId]);
        const teamName = team[0] ? team[0].assignedTeamName : 'Unknown Team';

        let sql = `DELETE FROM ${config.database.schema}.poamteamresources WHERE assignedTeamId = ? AND poamId = ?`;
        await connection.query(sql, [req.params.assignedTeamId, req.params.poamId]);

        let action = `Team Resources was deleted for ${teamName}.`;
        let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
        await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);
    });
};
