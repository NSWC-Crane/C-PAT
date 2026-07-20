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

exports.getLabels = async function getLabels(req) {
    return await withConnection(async connection => {
        let sql = `SELECT * FROM ${config.database.schema}.label WHERE collectionId = ? ORDER BY labelName;`;
        let [rowLabels] = await connection.query(sql, [req.params.collectionId]);

        const labels = rowLabels.map(row => ({
            labelId: row.labelId,
            labelName: row.labelName,
            description: row.description,
            collectionId: row.collectionId,
        }));

        return labels;
    });
};

exports.getLabel = async function getLabel(req) {
    return await withConnection(async connection => {
        let sql = `SELECT * FROM ${config.database.schema}.label WHERE labelId = ? AND collectionId = ?`;
        let [rowLabel] = await connection.query(sql, [req.params.labelId, req.params.collectionId]);

        const label = rowLabel.length > 0 ? [rowLabel[0]] : [];

        return { label };
    });
};

exports.postLabel = async function postLabel(req) {
    return await withConnection(async connection => {
        let sql_query = `INSERT INTO ${config.database.schema}.label (labelName, description, collectionId) VALUES (?, ?, ?)`;
        await connection.query(sql_query, [req.body.labelName, req.body.description, req.params.collectionId]);

        let sql = `SELECT * FROM ${config.database.schema}.label WHERE labelName = ? AND collectionId = ?`;
        let [rowLabel] = await connection.query(sql, [req.body.labelName, req.params.collectionId]);

        const message = {
            labelId: rowLabel[0].labelId,
            labelName: rowLabel[0].labelName,
            description: rowLabel[0].description,
            collectionId: rowLabel[0].collectionId,
        };
        return message;
    });
};

exports.putLabel = async function putLabel(req) {
    if (!req.body.description) {
        req.body.description = '';
    }

    return await withConnection(async connection => {
        let sql_query = `UPDATE ${config.database.schema}.label SET labelName = ?, description = ? WHERE labelId = ? AND collectionId = ?`;
        await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.labelId, req.params.collectionId]);

        const message = {
            labelId: req.body.labelId,
            collectionId: req.params.collectionId,
            labelName: req.body.labelName,
            description: req.body.description,
        };
        return message;
    });
};

exports.deleteLabel = async function deleteLabel(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.label WHERE labelId = ? AND collectionId = ?`;
        await connection.query(sql, [req.params.labelId, req.params.collectionId]);

        return { label: [] };
    });
};
