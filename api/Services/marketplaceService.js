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



exports.getAllThemes = async function getAllThemes() {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT * FROM themes`;
            const [rows] = await connection.query(sql);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.purchaseTheme = async function purchaseTheme(userId, themeId) {
    try {
        return await withConnection(async (connection) => {
            const userQuery = `SELECT points FROM user WHERE userId = ?`;
            const [userRows] = await connection.query(userQuery, [userId]);
            if (userRows.length === 0) {
                return { success: false, message: 'User not found' };
            }
            const userPoints = userRows[0].points;

            const themeQuery = `SELECT cost FROM themes WHERE themeId = ?`;
            const [themeRows] = await connection.query(themeQuery, [themeId]);
            if (themeRows.length === 0) {
                return { success: false, message: 'Theme not found' };
            }
            const themeCost = themeRows[0].cost;

            if (userPoints < themeCost) {
                return { success: false, message: 'Not enough points' };
            }

            const deductPointsQuery = `UPDATE user SET points = points - ? WHERE userId = ?`;
            await connection.query(deductPointsQuery, [themeCost, userId]);

            const purchaseQuery = `INSERT INTO marketplace (themeId, userId) VALUES (?, ?)`;
            await connection.query(purchaseQuery, [themeId, userId]);

            return { success: true, message: 'Theme purchased successfully' };
        });
    } catch (error) {
        return { success: false, message: error.message };
    }
};

exports.getUserThemes = async function getUserThemes(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT themes.* FROM themes 
                         JOIN marketplace ON themes.themeId = marketplace.themeId 
                         WHERE marketplace.userId = ?`;
            const [rows] = await connection.query(sql, [userId]);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUserPoints = async function getUserPoints(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT userId, points FROM user WHERE userId = ?`;
            const [row] = await connection.query(sql, [userId]);
            return row[0];
        });
    } catch (error) {
        return { error: error.message };
    }
};