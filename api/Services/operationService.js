/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
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

exports.getConfiguration = async function () {
    try {
        return await withConnection(async (connection) => {
            let sql = `SELECT * from config`
            let [rows] = await connection.query(sql)
            let config = {}
            for (const row of rows) {
                config[row.key] = row.value
            }
            return (config)
        });
    }
    catch (err) {
        throw ({ status: 500, message: err.message, stack: err.stack })
    }
}

exports.setConfigurationItem = async function (key, value) {
    try {
        return await withConnection(async (connection) => {
        let sql = 'INSERT INTO config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)'
            await connection.query(sql, [key, value])
        return (true)
        });
    }
    catch (err) {
        throw ({ status: 500, message: err.message, stack: err.stack })
    }
}

exports.deleteConfigurationItem = async function (key) {
    try {
        return await withConnection(async (connection) => {
            let sql = 'DELETE FROM config WHERE `key` = ?';
            await connection.query(sql, [key]);
            return true;
        });
    } catch (err) {
        throw { status: 500, message: err.message, stack: err.stack };
    }
};