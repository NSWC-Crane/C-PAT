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

exports.getAllNotifications = async function getAllNotifications(userId) {
    return await withConnection(async connection => {
        const sql = `SELECT * FROM ${config.database.schema}.notification WHERE userId = ? ORDER BY timestamp DESC`;
        const [rows] = await connection.query(sql, [userId]);
        return rows;
    });
};

exports.getUnreadNotifications = async function getUnreadNotifications(userId) {
    return await withConnection(async connection => {
        const sql = `SELECT * FROM ${config.database.schema}.notification WHERE notification.read = 0 AND userId = ? ORDER BY timestamp DESC`;
        const [rows] = await connection.query(sql, [userId]);
        return rows;
    });
};

exports.getUnreadNotificationCount = async function getUnreadNotificationCount(userId) {
    return await withConnection(async connection => {
        const sql = `SELECT COUNT(userId) AS NotificationCount FROM ${config.database.schema}.notification WHERE notification.read = 0 AND userId = ?`;
        const [rows] = await connection.query(sql, [userId]);
        return rows[0].NotificationCount.toString();
    });
};

exports.dismissNotification = async function dismissNotification(userId, notificationId) {
    return await withConnection(async connection => {
        const existsSql = `SELECT notificationId FROM ${config.database.schema}.notification WHERE notificationId = ? AND userId = ?`;
        const [existing] = await connection.query(existsSql, [notificationId, userId]);

        if (existing.length === 0) {
            throw new SmError.NotFoundError('Notification not found');
        }

        const dismissSql = `UPDATE ${config.database.schema}.notification SET notification.read = 1 WHERE notificationId = ? AND userId = ?`;
        await connection.query(dismissSql, [notificationId, userId]);

        const unreadSql = `SELECT * FROM ${config.database.schema}.notification WHERE notification.read = 0 AND userId = ? ORDER BY timestamp DESC`;
        const [unreadNotifications] = await connection.query(unreadSql, [userId]);

        return unreadNotifications;
    });
};

exports.dismissAllNotifications = async function dismissAllNotifications(userId) {
    return await withConnection(async connection => {
        const sql = `UPDATE ${config.database.schema}.notification SET notification.read = 1 WHERE userId = ?`;
        const [result] = await connection.query(sql, [userId]);

        if (result.affectedRows === 0) {
            throw new SmError.NotFoundError('No notifications found for the user');
        }
    });
};

exports.deleteNotification = async function deleteNotification(userId, notificationId) {
    return await withConnection(async connection => {
        const sql = `DELETE FROM ${config.database.schema}.notification WHERE notificationId = ? AND userId = ?`;
        const [result] = await connection.query(sql, [notificationId, userId]);

        if (result.affectedRows === 0) {
            throw new SmError.NotFoundError('Notification not found');
        }
    });
};

exports.deleteAllNotifications = async function deleteAllNotifications(userId) {
    return await withConnection(async connection => {
        const sql = `DELETE FROM ${config.database.schema}.notification WHERE userId = ?`;
        const [result] = await connection.query(sql, [userId]);

        if (result.affectedRows === 0) {
            throw new SmError.NotFoundError('Notification not found');
        }
    });
};
