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

exports.getAppConfiguration = async function getAppConfiguration(req, res, next) {
    try {
        return await withConnection(async connection => {
            let sql = `SELECT * FROM ${config.database.schema}.appconfiguration;`;
            let [rowAppConfiguration] = await connection.query(sql);

            const appConfiguration = rowAppConfiguration.map(row => ({
                settingName: row.settingName,
                settingValue: row.settingValue,
            }));

            return appConfiguration;
        });
    } catch (error) {
        next(error);
    }
};

exports.postAppConfiguration = async function postAppConfiguration(req, res, next) {
    if (!req.body.settingName) {
        return next({
            status: 400,
            errors: {
                settingName: 'is required',
            },
        });
    }
    if (!req.body.settingValue) {
        return next({
            status: 400,
            errors: {
                settingValue: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql_query = `INSERT INTO ${config.database.schema}.appconfiguration (settingName, settingValue) VALUES (?, ?)`;
            await connection.query(sql_query, [req.body.settingName, req.body.settingValue]);

            let sql = `SELECT * FROM ${config.database.schema}.appconfiguration WHERE settingName = ?`;
            let [rowAppConfiguration] = await connection.query(sql, [req.body.settingName]);

            const appConfiguration = {
                settingName: rowAppConfiguration[0].settingName,
                settingValue: rowAppConfiguration[0].settingValue,
            };
            return appConfiguration;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.putAppConfiguration = async function putAppConfiguration(req, res, next) {
    if (!req.body.settingName) {
        return next({
            status: 400,
            errors: {
                settingName: 'is required',
            },
        });
    }
    if (!req.body.settingValue) {
        return next({
            status: 400,
            errors: {
                settingValue: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql_query = `UPDATE ${config.database.schema}.appconfiguration SET settingValue = ? WHERE settingName = ?`;
            await connection.query(sql_query, [req.body.settingValue, req.body.settingName]);

            const appConfiguration = {
                settingName: req.body.settingName,
                settingValue: req.body.settingValue,
            };
            return appConfiguration;
        });
    } catch (error) {
        return { error: error.message };
    }
};
