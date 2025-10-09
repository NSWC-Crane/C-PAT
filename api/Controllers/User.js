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
const SmError = require('../utils/error');

module.exports.getUsers = async function getUsers(req, res, next) {
    try {
        const elevate = req.query.elevate;
        const users = await userService.getUsers(elevate, req);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCurrentUser = async function getCurrentUser(req, res, next) {
    try {
        const user = await userService.getCurrentUser(req);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getUserByUserID = async function getUserByUserID(req, res, next) {
    try {
        const elevate = req.query.elevate;
        const user = await userService.getUserByUserID(req, elevate);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            res.status(200).json(user);
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.updateUser = async function updateUser(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const updatedUser = await userService.updateUser(userId, elevate, req);
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error.message === 'User update failed') {
            res.status(400).json({ error: 'Bad Request', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.updateUserTheme = async function updateUserTheme(req, res, next) {
    try {
        const result = await userService.updateUserTheme(req, res, next);
        if (result.success) {
            res.status(200).json(result.message);
        } else {
            res.status(400).json(result.message);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.updateUserPoints = async function updateUserPoints(req, res, next) {
    try {
        const elevate = req.query.elevate;
        const result = await userService.updateUserPoints(elevate, req);
        if (result.success) {
            res.status(200).json(result.message);
        } else {
            res.status(400).json(result.message);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.updateUserLastCollectionAccessed = async function updateUserLastCollectionAccessed(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const lastCollectionAccessedId = req.body.lastCollectionAccessedId;
        const result = await userService.updateUserLastCollectionAccessed(userId, lastCollectionAccessedId);
        if (result.success) {
            res.status(200).json(result.message);
        } else {
            res.status(400).json(result.message);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.disableUser = async function disableUser(req, res, next) {
    try {
        const elevate = req.query.elevate;
        const userId = Number.parseInt(req.params.userId);

        const result = await userService.disableUser(elevate, userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        if (error instanceof SmError.PrivilegeError) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                detail: error.message,
            });
        }
    }
};
