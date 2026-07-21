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
const SmError = require('../utils/error');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

module.exports.getAssignedTeams = async function getAssignedTeams() {
    return await withConnection(async connection => {
        let sql = `
            SELECT
                t.assignedTeamId,
                t.assignedTeamName,
                t.adTeam,
                GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
            FROM ${config.database.schema}.assignedteams t
            LEFT JOIN ${config.database.schema}.assignedteampermissions p
                ON t.assignedTeamId = p.assignedTeamId
            LEFT JOIN ${config.database.schema}.collection c
                ON p.collectionId = c.collectionId
            GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
        `;
        let [rowAssignedTeams] = await connection.query(sql);
        const assignedTeams = rowAssignedTeams.map(row => ({
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            adTeam: row.adTeam,
            permissions: row.collectionData
                ? row.collectionData.split(',').map(data => {
                      const [id, name] = data.split(':');
                      return {
                          collectionId: Number.parseInt(id),
                          collectionName: name || '',
                      };
                  })
                : [],
        }));
        return assignedTeams;
    });
};

module.exports.getAssignedTeam = async function getAssignedTeam(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT
                t.assignedTeamId,
                t.assignedTeamName,
                t.adTeam,
                GROUP_CONCAT(CONCAT(p.collectionId, ':', c.collectionName) SEPARATOR ',') as collectionData
            FROM ${config.database.schema}.assignedteams t
            LEFT JOIN ${config.database.schema}.assignedteampermissions p
                ON t.assignedTeamId = p.assignedTeamId
            LEFT JOIN ${config.database.schema}.collection c
                ON p.collectionId = c.collectionId
            WHERE t.assignedTeamId = ?
            GROUP BY t.assignedTeamId, t.assignedTeamName, t.adTeam
        `;
        let [rowAssignedTeam] = await connection.query(sql, [req.params.assignedTeamId]);

        if (rowAssignedTeam.length === 0) {
            throw new SmError.NotFoundError('Assigned Team not found');
        }

        const row = rowAssignedTeam[0];
        return {
            assignedTeamId: row.assignedTeamId,
            assignedTeamName: row.assignedTeamName,
            adTeam: row.adTeam,
            permissions: row.collectionData
                ? row.collectionData.split(',').map(data => {
                      const [id, name] = data.split(':');
                      return {
                          collectionId: Number.parseInt(id),
                          collectionName: name || '',
                      };
                  })
                : [],
        };
    });
};

module.exports.postAssignedTeam = async function postAssignedTeam(req) {
    return await withConnection(async connection => {
        let sql_query = `INSERT INTO ${config.database.schema}.assignedteams (assignedTeamName, adTeam) VALUES (?, ?)`;
        await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam]);

        let sql = `SELECT * FROM ${config.database.schema}.assignedteams WHERE assignedTeamName = ?`;
        let [rowAssignedTeam] = await connection.query(sql, [req.body.assignedTeamName]);

        const assignedTeam = {
            assignedTeamId: rowAssignedTeam[0].assignedTeamId,
            assignedTeamName: rowAssignedTeam[0].assignedTeamName,
            adTeam: rowAssignedTeam[0].adTeam,
        };
        return assignedTeam;
    });
};

module.exports.putAssignedTeam = async function putAssignedTeam(req) {
    return await withConnection(async connection => {
        let sql_query = `UPDATE ${config.database.schema}.assignedteams SET assignedTeamName = ?, adTeam = ? WHERE assignedTeamId = ?`;
        await connection.query(sql_query, [req.body.assignedTeamName, req.body.adTeam, req.body.assignedTeamId]);

        const assignedTeam = {
            assignedTeamId: req.body.assignedTeamId,
            assignedTeamName: req.body.assignedTeamName,
            adTeam: req.body.adTeam,
        };
        return assignedTeam;
    });
};

module.exports.deleteAssignedTeam = async function deleteAssignedTeam(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.assignedteams WHERE assignedTeamId = ?`;
        await connection.query(sql, [req.params.assignedTeamId]);

        return { assignedTeam: [] };
    });
};

module.exports.postAssignedTeamPermission = async function postAssignedTeamPermission(req) {
    return await withConnection(async connection => {
        const { assignedTeamId, collectionId } = req.body;

        let sql = `
            INSERT INTO ${config.database.schema}.assignedteampermissions
            (assignedTeamId, collectionId)
            VALUES (?, ?)
        `;

        await connection.query(sql, [assignedTeamId, collectionId]);

        return {
            assignedTeamId,
            collectionId,
        };
    });
};

module.exports.deleteAssignedTeamPermission = async function deleteAssignedTeamPermission(req) {
    return await withConnection(async connection => {
        const { assignedTeamId, collectionId } = req.params;

        let sql = `
            DELETE FROM ${config.database.schema}.assignedteampermissions
            WHERE assignedTeamId = ? AND collectionId = ?
        `;

        const [result] = await connection.query(sql, [assignedTeamId, collectionId]);

        if (result.affectedRows === 0) {
            throw new SmError.NotFoundError('Permission not found');
        }

        return { success: true };
    });
};
