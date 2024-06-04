/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const notificationService = require('../Services/notificationService');

module.exports.getAllNotificationsByUserId = async function getAllNotificationsByUserId(req, res, next) {
    try {
        const userId = req.params.userId;
        const notifications = await notificationService.getAllNotificationsByUserId(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUnreadNotificationsByUserId = async function getUnreadNotificationsByUserId(req, res, next) {
    try {
        const userId = req.params.userId;
        const notifications = await notificationService.getUnreadNotificationsByUserId(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getUnreadNotificationCountByUserId = async function getUnreadNotificationCountByUserId(req, res, next) {
    try {
        const userId = req.params.userId;
        const notificationCount = await notificationService.getUnreadNotificationCountByUserId(userId);
        res.status(200).json(notificationCount);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.dismissNotificationByNotificationId = async function dismissNotificationByNotificationId(req, res, next) {
    try {
        const notificationId = req.params.notificationId;
        const unreadNotifications = await notificationService.dismissNotificationByNotificationId(notificationId);
        if (unreadNotifications !== null) {
            res.status(200).json(unreadNotifications);
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.dismissAllNotificationsByUserId = async function dismissAllNotificationsByUserId(req, res, next) {
    try {
        const userId = req.params.userId;
        const dismissed = await notificationService.dismissAllNotificationsByUserId(userId);
        if (dismissed) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'No notifications found for the user' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.deleteNotificationByNotificationId = async function deleteNotificationByNotificationId(req, res, next) {
    try {
        const notificationId = req.params.notificationId;
        const deleted = await notificationService.deleteNotificationByNotificationId(notificationId);

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.deleteAllNotificationsByUserId = async function deleteAllNotificationsByUserId(req, res, next) {
    try {
        const userId = req.params.userId;
        const deleted = await notificationService.deleteAllNotificationsByUserId(userId);

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};