/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const notificationService = require('../Services/notificationService');
const { sendError } = require('../utils/respond');

module.exports.getAllNotifications = async function getAllNotifications(req, res) {
    try {
        const notifications = await notificationService.getAllNotifications(req.userObject.userId);
        res.status(200).json(notifications);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getUnreadNotifications = async function getUnreadNotifications(req, res) {
    try {
        const notifications = await notificationService.getUnreadNotifications(req.userObject.userId);
        res.status(200).json(notifications);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getUnreadNotificationCount = async function getUnreadNotificationCount(req, res) {
    try {
        const notificationCount = await notificationService.getUnreadNotificationCount(req.userObject.userId);
        res.status(200).json(notificationCount);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.dismissNotification = async function dismissNotification(req, res) {
    try {
        const unreadNotifications = await notificationService.dismissNotification(req.userObject.userId, req.params.notificationId);
        res.status(200).json(unreadNotifications);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.dismissAllNotifications = async function dismissAllNotifications(req, res) {
    try {
        await notificationService.dismissAllNotifications(req.userObject.userId);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteNotification = async function deleteNotification(req, res) {
    try {
        await notificationService.deleteNotification(req.userObject.userId, req.params.notificationId);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAllNotifications = async function deleteAllNotifications(req, res) {
    try {
        await notificationService.deleteAllNotifications(req.userObject.userId);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
