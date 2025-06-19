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

exports.getTenableFilters = async function getTenableFilters(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `SELECT * FROM ${config.database.schema}.tenablefilters WHERE collectionId = ? ORDER BY filterName;`;
            let [rowTenableFilters] = await connection.query(sql, [req.params.collectionId]);

            const tenableFilters = rowTenableFilters.map(row => ({
                filterId: row.filterId,
                collectionId: row.collectionId,
                filterName: row.filterName,
                filter: row.filter,
                createdBy: row.createdBy,
            }));

            return tenableFilters;
        });
    } catch (error) {
        next(error);
    }
};

exports.getTenableFilter = async function getTenableFilter(req, res, next) {
    if (!req.params.filterId) {
        return next({
            status: 400,
            errors: {
                filterId: 'is required',
            },
        });
    } else if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `SELECT * FROM ${config.database.schema}.tenablefilters WHERE filterId = ? AND collectionId = ?`;
            let [rowTenableFilter] = await connection.query(sql, [req.params.filterId, req.params.collectionId]);

            const tenableFilter = rowTenableFilter.length > 0 ? [rowTenableFilter[0]] : [];

            return { tenableFilter };
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postTenableFilter = async function postTenableFilter(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    } else if (!req.body.filterName) {
        return next({
            status: 400,
            errors: {
                filterName: 'is required',
            },
        });
    } else if (!req.body.filter) {
        return next({
            status: 400,
            errors: {
                filter: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql_query = `INSERT INTO ${config.database.schema}.tenablefilters (filterName, filter, collectionId, createdBy) VALUES (?, ?, ?, ?)`;
            await connection.query(sql_query, [req.body.filterName, req.body.filter, req.params.collectionId, req.userObject.userName]);

            let sql = `SELECT * FROM ${config.database.schema}.tenablefilters WHERE filterName = ? AND collectionId = ?`;
            let [rowTenableFilter] = await connection.query(sql, [req.body.filterName, req.params.collectionId]);

            const message = {
                filterId: rowTenableFilter[0].filterId,
                filterName: rowTenableFilter[0].filterName,
                filter: rowTenableFilter[0].filter,
                collectionId: rowTenableFilter[0].collectionId,
                createdBy: rowTenableFilter[0].createdBy,
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putTenableFilter = async function putTenableFilter(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    } else if (!req.body.filterId) {
        return next({
            status: 400,
            errors: {
                filterId: 'is required',
            },
        });
    } else if (!req.body.filterName) {
        return next({
            status: 400,
            errors: {
                filterName: 'is required',
            },
        });
    } else if (!req.body.filter) {
        return next({
            status: 400,
            errors: {
                filter: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql_query = `UPDATE ${config.database.schema}.tenablefilters SET filterName = ?, filter = ? WHERE filterId = ? AND collectionId = ?`;
            await connection.query(sql_query, [req.body.filterName, req.body.filter, req.body.filterId, req.params.collectionId]);

            const message = {
                filterId: req.body.filterId,
                collectionId: req.params.collectionId,
                filterName: req.body.filterName,
                filter: req.body.filter,
            };
            return message;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteTenableFilter = async function deleteTenableFilter(req) {
    const { tenableFilterId, collectionId } = req.params;

    if (!tenableFilterId) {
        throw {
            status: 400,
            errors: { tenableFilterId: 'is required' },
        };
    }

    if (!collectionId) {
        throw {
            status: 400,
            errors: { collectionId: 'is required' },
        };
    }

    try {
        await withConnection(async connection => {
            const sql = `DELETE FROM ${config.database.schema}.tenablefilters WHERE filterId = ? AND collectionId = ?`;
            await connection.query(sql, [tenableFilterId, collectionId]);
        });
    } catch (error) {
        throw {
            status: 500,
            errors: { database: error.message },
        };
    }
};
