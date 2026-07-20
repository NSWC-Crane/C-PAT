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
const { sendError } = require('../utils/respond');

module.exports.getCollectionPermissions = async function getCollectionPermissions(req, res) {
    try {
        const permissions = await permissionService.getCollectionPermissions(req);
        res.status(200).json(permissions);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPermission = async function postPermission(req, res) {
    try {
        const permission = await permissionService.postPermission(req.userObject.userId, req.query.elevate, req);
        res.status(201).json(permission);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putPermission = async function putPermission(req, res) {
    try {
        const permission = await permissionService.putPermission(req.userObject.userId, req.query.elevate, req);
        res.status(200).json(permission);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePermission = async function deletePermission(req, res) {
    try {
        await permissionService.deletePermission(req.userObject.userId, req.query.elevate, req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
