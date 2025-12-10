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
const logger = require('../utils/logger');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.checkPoamDeadlineNotifications = async function checkPoamDeadlineNotifications() {
    try {
        return await withConnection(async connection => {
            const notificationsSent = {
                halfway: 0,
                '30day': 0,
                '7day': 0,
                '1day': 0,
                expired: 0,
            };

            await processHalfwayNotifications(connection, notificationsSent);
            await process30DayNotifications(connection, notificationsSent);
            await process7DayNotifications(connection, notificationsSent);
            await process1DayNotifications(connection, notificationsSent);
            await processExpiredNotifications(connection, notificationsSent);

            logger.writeInfo('scheduledTasks', 'poamDeadlineNotifications', {
                message: 'POAM deadline notification check completed',
                notificationsSent,
            });

            return notificationsSent;
        });
    } catch (error) {
        logger.writeError('scheduledTasks', 'poamDeadlineNotifications', {
            message: 'Error checking POAM deadline notifications',
            error: error.message,
        });
        throw error;
    }
};

async function processHalfwayNotifications(connection, notificationsSent) {
    const sql = `
        SELECT p.poamId, p.submitterId, p.ownerId,
               p.created, p.scheduledCompletionDate
        FROM ${config.database.schema}.poam p
        WHERE p.status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive', 'Extension Requested')
          AND p.extensionDeadline IS NULL
          AND p.scheduledCompletionDate IS NOT NULL
          AND p.created IS NOT NULL
          AND CURDATE() >= DATE_ADD(p.created, INTERVAL DATEDIFF(p.scheduledCompletionDate, p.created) / 2 DAY)
          AND NOT EXISTS (
              SELECT 1 FROM ${config.database.schema}.poam_notification_tracker t
              WHERE t.poamId = p.poamId AND t.notificationType = 'halfway'
          )
    `;

    const [poams] = await connection.query(sql);

    for (const poam of poams) {
        await sendNotificationToOwnerAndSubmitter(
            connection,
            poam,
            'halfway',
            'POAM Halfway Reminder',
            `POAM ${poam.poamId} is halfway to its scheduled completion date.`
        );
        notificationsSent.halfway++;
    }
}

async function process30DayNotifications(connection, notificationsSent) {
    const sql = `
        SELECT p.poamId, p.submitterId, p.ownerId,
               COALESCE(p.extensionDeadline, p.scheduledCompletionDate) AS effectiveDeadline
        FROM ${config.database.schema}.poam p
        WHERE p.status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive')
          AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) IS NOT NULL
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) <= 30
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) > 7
          AND NOT EXISTS (
              SELECT 1 FROM ${config.database.schema}.poam_notification_tracker t
              WHERE t.poamId = p.poamId AND t.notificationType = '30day'
          )
    `;

    const [poams] = await connection.query(sql);

    for (const poam of poams) {
        const daysRemaining = Math.ceil((new Date(poam.effectiveDeadline) - new Date()) / (1000 * 60 * 60 * 24));
        await sendNotificationToOwnerAndSubmitter(
            connection,
            poam,
            '30day',
            'POAM 30-Day Deadline Warning',
            `POAM ${poam.poamId} is scheduled for completion in approximately ${daysRemaining} days.`
        );
        notificationsSent['30day']++;
    }
}

async function process7DayNotifications(connection, notificationsSent) {
    const sql = `
        SELECT p.poamId, p.submitterId, p.ownerId,
               COALESCE(p.extensionDeadline, p.scheduledCompletionDate) AS effectiveDeadline
        FROM ${config.database.schema}.poam p
        WHERE p.status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive')
          AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) IS NOT NULL
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) <= 7
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) > 1
          AND NOT EXISTS (
              SELECT 1 FROM ${config.database.schema}.poam_notification_tracker t
              WHERE t.poamId = p.poamId AND t.notificationType = '7day'
          )
    `;

    const [poams] = await connection.query(sql);

    for (const poam of poams) {
        const daysRemaining = Math.ceil((new Date(poam.effectiveDeadline) - new Date()) / (1000 * 60 * 60 * 24));
        await sendNotificationToOwnerAndSubmitter(
            connection,
            poam,
            '7day',
            'POAM 7-Day Deadline Warning',
            `POAM ${poam.poamId} is scheduled for completion in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
        );
        notificationsSent['7day']++;
    }
}

async function process1DayNotifications(connection, notificationsSent) {
    const sql = `
        SELECT p.poamId, p.submitterId, p.ownerId,
               COALESCE(p.extensionDeadline, p.scheduledCompletionDate) AS effectiveDeadline
        FROM ${config.database.schema}.poam p
        WHERE p.status NOT IN ('Draft', 'Expired', 'Closed', 'False-Positive')
          AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) IS NOT NULL
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) <= 1
          AND DATEDIFF(COALESCE(p.extensionDeadline, p.scheduledCompletionDate), CURDATE()) > 0
          AND NOT EXISTS (
              SELECT 1 FROM ${config.database.schema}.poam_notification_tracker t
              WHERE t.poamId = p.poamId AND t.notificationType = '1day'
          )
    `;

    const [poams] = await connection.query(sql);

    for (const poam of poams) {
        const daysRemaining = Math.ceil((new Date(poam.effectiveDeadline) - new Date()) / (1000 * 60 * 60 * 24));
        await sendNotificationToOwnerAndSubmitter(
            connection,
            poam,
            '1day',
            'POAM Final Deadline Warning',
            `POAM ${poam.poamId} is scheduled for completion ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}.`
        );
        notificationsSent['1day']++;
    }
}

async function processExpiredNotifications(connection, notificationsSent) {
    const sql = `
        SELECT p.poamId, p.submitterId, p.ownerId,
               COALESCE(p.extensionDeadline, p.scheduledCompletionDate) AS effectiveDeadline
        FROM ${config.database.schema}.poam p
        WHERE p.status NOT IN ('Draft', 'Closed', 'False-Positive')
          AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) IS NOT NULL
          AND COALESCE(p.extensionDeadline, p.scheduledCompletionDate) < CURDATE()
          AND NOT EXISTS (
              SELECT 1 FROM ${config.database.schema}.poam_notification_tracker t
              WHERE t.poamId = p.poamId AND t.notificationType = 'expired'
          )
    `;

    const [poams] = await connection.query(sql);

    for (const poam of poams) {
        await sendNotificationToOwnerAndSubmitter(connection, poam, 'expired', 'POAM Expired', `POAM ${poam.poamId} has expired.`);
        notificationsSent.expired++;
    }
}

async function sendNotificationToOwnerAndSubmitter(connection, poam, notificationType, title, message) {
    const userIds = new Set();

    if (poam.submitterId && poam.submitterId !== 0) {
        userIds.add(poam.submitterId);
    }

    if (poam.ownerId && poam.ownerId !== 0) {
        userIds.add(poam.ownerId);
    }

    for (const userId of userIds) {
        const notificationSql = `
            INSERT INTO ${config.database.schema}.notification (userId, title, message)
            VALUES (?, ?, ?)
        `;
        await connection.query(notificationSql, [userId, title, message]);
    }

    const trackerSql = `
        INSERT INTO ${config.database.schema}.poam_notification_tracker (poamId, notificationType)
        VALUES (?, ?)
    `;
    await connection.query(trackerSql, [poam.poamId, notificationType]);
}
