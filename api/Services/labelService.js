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

exports.getLabels = async function getLabels(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.label WHERE collectionId = ? ORDER BY labelName;";
            let [rowLabels] = await connection.query(sql, [req.params.collectionId]);

            const labels = rowLabels.map(row => ({
                labelId: row.labelId,
                labelName: row.labelName,
                description: row.description,
                collectionId: row.collectionId,
            }));

            return labels;
        });
    } catch (error) {
        next(error);
    }
}

exports.getLabel = async function getLabel(req, res, next) {
    if (!req.params.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM cpat.label WHERE labelId = ? AND collectionId = ?";
            let [rowLabel] = await connection.query(sql, [req.params.labelId, req.params.collectionId]);

            const label = rowLabel.length > 0 ? [rowLabel[0]] : [];

            return { label };
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.postLabel = async function postLabel(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    } else if (!req.body.labelName) {
        return next({
            status: 400,
            errors: {
                labelName: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.label (labelName, description, collectionId) VALUES (?, ?, ?)`;
            await connection.query(sql_query, [req.body.labelName, req.body.description, req.params.collectionId]);

            let sql = "SELECT * FROM cpat.label WHERE labelName = ? AND collectionId = ?";
            let [rowLabel] = await connection.query(sql, [req.body.labelName, req.params.collectionId]);

            const message = {
                labelId: rowLabel[0].labelId,
                labelName: rowLabel[0].labelName,
                description: rowLabel[0].description,
                collectionId: rowLabel[0].collectionId
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.putLabel = async function putLabel(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    } else if (!req.body.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.body.labelName) {
        return next({
            status: 400,
            errors: {
                labelName: 'is required',
            }
        });
    } else if (!req.body.description) {
        req.body.description = "";
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.label SET labelName = ?, description = ? WHERE labelId = ? AND collectionId = ?";
            await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.labelId, req.params.collectionId]);

            const message = {
                labelId: req.body.labelId,
                collectionId: req.params.collectionId,
                labelName: req.body.labelName,
                description: req.body.description
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.deleteLabel = async function deleteLabel(req, res, next) {
    if (!req.params.labelId) {
        return next({
            status: 400,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM cpat.label WHERE labelId = ? AND collectionId = ?";
            await connection.query(sql, [req.params.labelId, req.params.collectionId]);

            return { label: [] };
        });
    } catch (error) {
        return { error: error.message };
    }
}