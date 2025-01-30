/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const permissionService = require('../Services/permissionsService');


module.exports.getCollectionPermissions = async function getCollectionPermissions(req, res, next) {
    try {
        const permissions = await permissionService.getCollectionPermissions(req, res, next);
        res.status(200).json(permissions);
    } catch (error) {
        if (error.message === 'collectionId is required') {
            res.status(400).json({ error: 'Validation Error', detail: 'collectionId is required' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postPermission = async function postPermission(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const permission = await permissionService.postPermission(userId, elevate, req);
        res.status(201).json(permission);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putPermission = async function putPermission(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const permission = await permissionService.putPermission(userId, elevate, req);
        res.status(200).json(permission);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deletePermission = async function deletePermission(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        await permissionService.deletePermission(userId, elevate, req);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};