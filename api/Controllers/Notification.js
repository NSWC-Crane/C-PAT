/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const notificationService = require('../Services/notificationService');

module.exports.getAllNotifications = async function getAllNotifications(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const notifications = await notificationService.getAllNotifications(userId);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUnreadNotifications = async function getUnreadNotifications(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const notifications = await notificationService.getUnreadNotifications(userId);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUnreadNotificationCount = async function getUnreadNotificationCount(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const notificationCount = await notificationService.getUnreadNotificationCount(userId);

        res.status(200).json(notificationCount);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.dismissNotification = async function dismissNotification(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const notificationId = req.params.notificationId;
        const unreadNotifications = await notificationService.dismissNotification(userId, notificationId);

        if (unreadNotifications !== null) {
            res.status(200).json(unreadNotifications);
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.dismissAllNotifications = async function dismissAllNotifications(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const dismissed = await notificationService.dismissAllNotifications(userId);
        if (dismissed) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'No notifications found for the user' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.deleteNotification = async function deleteNotification(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const notificationId = req.params.notificationId;
        const deleted = await notificationService.deleteNotification(userId, notificationId);

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.deleteAllNotifications = async function deleteAllNotifications(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const deleted = await notificationService.deleteAllNotifications(userId);

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};