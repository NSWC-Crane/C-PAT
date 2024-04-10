/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const permissionService = require('../Services/mysql/permissionsService')

module.exports.getPermissions_UserCollection = async function getPermissions_UserCollection(req, res, next){
        var permissions = await permissionService.getPermissions_UserCollection(req,res,next); 
        res.status(201).json(permissions)
}

module.exports.postPermission = async function postPermission(req, res, next){
        var permission = await permissionService.postPermission(req,res,next); 
        res.status(201).json(permission)
}

module.exports.putPermission = async function putPermission(req, res, next){
        var permission = await permissionService.putPermission(req,res,next); 
        res.status(201).json(permission)
}

module.exports.deletePermission = async function deletePermission(req, res, next){
        var permission = await permissionService.deletePermission(req,res,next); 
        res.status(201).json(permission)
}