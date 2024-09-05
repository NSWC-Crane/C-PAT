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



exports.getAllNotifications = async function getAllNotifications(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT * FROM cpat.notification WHERE userId = ? ORDER BY timestamp DESC`;
            const [rows] = await connection.query(sql, [userId]);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUnreadNotifications = async function getUnreadNotifications(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT * FROM cpat.notification WHERE notification.read = 0 AND userId = ? ORDER BY timestamp DESC`;
            const [rows] = await connection.query(sql, [userId]);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.getUnreadNotificationCount = async function getUnreadNotificationCount(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT COUNT(userId) AS NotificationCount FROM cpat.notification WHERE notification.read = 0 AND userId = ?`;
            const [rows] = await connection.query(sql, [userId]);
            const notificationCount = rows[0].NotificationCount.toString();
            return notificationCount;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.dismissNotification = async function dismissNotification(userId, notificationId) {
    try {
        return await withConnection(async (connection) => {
            const userIdQuery = `SELECT userId FROM cpat.notification WHERE notificationId = ?`;
            const [userId] = await connection.query(userIdQuery, [notificationId]);

            const dismissSql = `UPDATE cpat.notification SET notification.read = 1 WHERE notificationId = ?`;
            await connection.query(dismissSql, [notificationId]);
            
            const unreadSql = `SELECT * FROM cpat.notification WHERE notification.read = 0 AND userId = ? ORDER BY timestamp DESC`;
            const [unreadNotifications] = await connection.query(unreadSql, [userId]);

            return unreadNotifications;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.dismissAllNotifications = async function dismissAllNotifications(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `UPDATE cpat.notification SET notification.read = 1 WHERE userId = ?`;
            const [result] = await connection.query(sql, [userId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteNotification = async function deleteNotification(userId, notificationId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `DELETE FROM cpat.notification WHERE notificationId = ? AND userId = ?`;
            const [result] = await connection.query(sql, [notificationId, userId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deleteAllNotifications = async function deleteAllNotifications(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `DELETE FROM cpat.notification WHERE userId = ?`;
            const [result] = await connection.query(sql, [userId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        return { error: error.message };
    }
};