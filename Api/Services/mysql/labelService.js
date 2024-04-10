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

exports.getLabels = async function getLabels(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getLabel collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.label WHERE collectionId = ? ORDER BY labelName;";
            let [rowLabels] = await connection.query(sql, [req.params.collectionId]);

            var labels = rowLabels.map(row => ({
                labelId: row.labelId,
                labelName: row.labelName,
                description: row.description,
            }));

            return { labels };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.getLabel = async function getLabel(req, res, next) {
    if (!req.params.labelId) {
        console.info('getLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.params.collectionId) {
        console.info('getLabel collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "SELECT * FROM poamtracking.label WHERE labelId = ? AND collectionId = ?";
            let [rowLabel] = await connection.query(sql, [req.params.labelId, req.params.collectionId]);

            var label = rowLabel.length > 0 ? [rowLabel[0]] : [];

            return { label };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.postLabel = async function postLabel(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getLabel collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    } else if (!req.body.labelName) {
        console.info('postLabel labelName not provided.');
        return next({
            status: 422,
            errors: {
                labelName: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO poamtracking.label (labelName, description, collectionId) VALUES (?, ?, ?)`;
            await connection.query(sql_query, [req.body.labelName, req.body.description, req.params.collectionId]);

            let sql = "SELECT * FROM poamtracking.label WHERE labelName = ? AND collectionId = ?";
            let [rowLabel] = await connection.query(sql, [req.body.labelName, req.params.collectionId]);

            const message = {
                labelId: rowLabel[0].labelId,
                labelName: rowLabel[0].labelName,
                description: rowLabel[0].description
            };
            return message;
        });
    } catch (error) {
        console.error("Error in postLabel: ", error);
        throw error;
    }
}

exports.putLabel = async function putLabel(req, res, next) {
    if (!req.params.collectionId) {
        console.info('getLabel collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    } else if (!req.body.labelId) {
        console.info('putLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.body.labelName) {
        console.info('putLabels labelName not provided.');
        return next({
            status: 422,
            errors: {
                labelName: 'is required',
            }
        });
    } else if (!req.body.description) {
        req.body.description = "";
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE poamtracking.label SET labelName = ?, description = ? WHERE labelId = ? AND collectionId = ?";
            await connection.query(sql_query, [req.body.labelName, req.body.description, req.body.labelId, req.params.collectionId]);

            const message = {
                labelId: req.body.labelId,
                labelName: req.body.labelName,
                description: req.body.description
            };
            return message;
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}

exports.deleteLabel = async function deleteLabel(req, res, next) {
    if (!req.params.labelId) {
        console.info('getLabel labelId not provided.');
        return next({
            status: 422,
            errors: {
                labelId: 'is required',
            }
        });
    } else if (!req.params.collectionId) {
        console.info('getLabel collectionId not provided.');
        return next({
            status: 422,
            errors: {
                collectionId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = "DELETE FROM poamtracking.label WHERE labelId = ? AND collectionId = ?";
            await connection.query(sql, [req.params.labelId, req.params.collectionId]);

            return { label: [] };
        });
    } catch (error) {
        console.error(error);
        return { null: "null" };
    }
}