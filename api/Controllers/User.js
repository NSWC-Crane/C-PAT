/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const userService = require('../Services/usersService');
const { sendError } = require('../utils/respond');

module.exports.getUsers = async function getUsers(req, res) {
    try {
        const users = await userService.getUsers(req.query.elevate, req);
        res.status(200).json(users);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCurrentUser = async function getCurrentUser(req, res) {
    try {
        const user = await userService.getCurrentUser(req);
        res.status(200).json(user);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getUserByUserID = async function getUserByUserID(req, res) {
    try {
        const user = await userService.getUserByUserID(req, req.query.elevate);
        res.status(200).json(user);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.createUser = async function createUser(req, res) {
    try {
        const createdUser = await userService.createUser(req.query.elevate, req);
        res.status(201).json(createdUser);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updateUser = async function updateUser(req, res) {
    try {
        const updatedUser = await userService.updateUser(req.userObject.userId, req.query.elevate, req);
        res.status(200).json(updatedUser);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updateUserTheme = async function updateUserTheme(req, res) {
    try {
        await userService.updateUserTheme(req.userObject.userId, req.body.defaultTheme);
        res.status(200).json({ message: 'Theme updated successfully' });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updateUserPoints = async function updateUserPoints(req, res) {
    try {
        await userService.updateUserPoints(req.query.elevate, req);
        res.status(200).json({ message: 'User points updated successfully' });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updateUserLastCollectionAccessed = async function updateUserLastCollectionAccessed(req, res) {
    try {
        await userService.updateUserLastCollectionAccessed(req.userObject.userId, req.body.lastCollectionAccessedId);
        res.status(200).json({ message: 'User lastCollectionAccessedId updated successfully' });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.disableUser = async function disableUser(req, res) {
    try {
        await userService.disableUser(Number.parseInt(req.params.userId), req.query.elevate, req);
        res.status(200).json({
            success: true,
            message: 'User disabled successfully',
        });
    } catch (error) {
        sendError(res, error);
    }
};
