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
exports.getAllNotificationsByUserId = async function getAllNotificationsByUserId(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT * FROM cpat.notification WHERE userId = ? ORDER BY timestamp DESC`;
            const [rows] = await connection.query(sql, [userId]);
            return rows;
        });
    } catch (error) {
        console.error('Error in getAllNotificationsByUserId:', error);
        throw error;
    }
};

exports.getUnreadNotificationsByUserId = async function getUnreadNotificationsByUserId(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT * FROM cpat.notification WHERE notification.read = 0 AND userId = ? ORDER BY timestamp DESC`;
            const [rows] = await connection.query(sql, [userId]);
            return rows;
        });
    } catch (error) {
        console.error('Error in getUnreadNotificationsByUserId:', error);
        throw error;
    }
};

exports.getUnreadNotificationCountByUserId = async function getUnreadNotificationCountByUserId(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `SELECT COUNT(userId) AS NotificationCount FROM cpat.notification WHERE notification.read = 0 AND userId = ?`;
            const [rows] = await connection.query(sql, [userId]);
            const notificationCount = rows[0].NotificationCount.toString();
            return notificationCount;
        });
    } catch (error) {
        console.error('Error in getUnreadNotificationCountByUserId:', error);
        throw error;
    }
};

exports.dismissNotificationByNotificationId = async function dismissNotificationByNotificationId(notificationId, userId) {
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
        console.error('Error in dismissNotificationByNotificationId:', error);
        throw error;
    }
};

exports.dismissAllNotificationsByUserId = async function dismissAllNotificationsByUserId(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `UPDATE cpat.notification SET notification.read = 1 WHERE userId = ?`;
            const [result] = await connection.query(sql, [userId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        console.error('Error in dismissAllNotificationsByUserId:', error);
        throw error;
    }
};

exports.deleteNotificationByNotificationId = async function deleteNotificationByNotificationId(notificationId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `DELETE FROM cpat.notification WHERE notificationId = ?`;
            const [result] = await connection.query(sql, [notificationId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        console.error('Error in deleteNotificationByNotificationId:', error);
        throw error;
    }
};

exports.deleteAllNotificationsByUserId = async function deleteAllNotificationsByUserId(userId) {
    try {
        return await withConnection(async (connection) => {
            const sql = `DELETE FROM cpat.notification WHERE userId = ?`;
            const [result] = await connection.query(sql, [userId]);
            return result.affectedRows > 0;
        });
    } catch (error) {
        console.error('Error in deleteAllNotificationsByUserId:', error);
        throw error;
    }
};