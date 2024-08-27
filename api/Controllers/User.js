/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const userService = require('../Services/usersService');

module.exports.getUsers = async function getUsers(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const users = await userService.getUsers(elevate, userId);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCurrentUser = async function getCurrentUser(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const user = await userService.getCurrentUser(userId);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getUserByUserID = async function getUserByUserID(req, res, next) {
    try {
        const userId = req.params.userId;
        const requestorId = req.userObject.userId;
        const elevate = req.query.elevate;
        const user = await userService.getUserByUserID(requestorId, elevate, userId);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === "User not found") {
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
        if (error.message === "User update failed") {
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
        const points = req.body.points;
        const requestorId = req.userObject.userId;
        const userId = req.body.userId;
        const result = await userService.updateUserPoints(elevate, points, userId, requestorId);
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

module.exports.deleteUser = async function deleteUser(req, res, next) {
    try {
        const requestorId = req.userObject.userId;
        const elevate = req.query.elevate;
        const userId = req.params.userId;
        await userService.deleteUser(requestorId, elevate, userId);
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};