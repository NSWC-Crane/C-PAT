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

//User permissions are now included in the user object, try getCurrentUser or getUsers instead
//module.exports.getPermissions_User = async function getPermissions_User(req, res, next){
//        //res.status(201).json({message: "getPermissions_User Method Called successfully"})
//        var permissions = await permissionService.getPermissions_User(req,res,next); 
//        res.status(201).json(permissions)
//}

module.exports.getPermissions_Collection = async function getPermissions_Collection(req, res, next){
        //res.status(201).json({message: "getPermissions_Collection Method called successfully"})
        var permissions = await permissionService.getPermissions_Collection(req,res,next); 
        res.status(201).json(permissions)
}

module.exports.getPermissions_UserCollection = async function getPermissions_UserCollection(req, res, next){
        //res.status(201).json({message: "getPermissions_UserCollection Method called successfully"});
        var permissions = await permissionService.getPermissions_UserCollection(req,res,next); 
        res.status(201).json(permissions)
}

module.exports.postPermission = async function postPermission(req, res, next){
        //res.status(201).json({message: "postPermission Method called successfully"});
        var permission = await permissionService.postPermission(req,res,next); 
        res.status(201).json(permission)
}

module.exports.putPermission = async function putPermission(req, res, next){
        //res.status(201).json({message: "putPermission Method called successfully"});
        var permission = await permissionService.putPermission(req,res,next); 
        res.status(201).json(permission)
}

module.exports.deletePermission = async function deletePermission(req, res, next){
        // res.status(201).json({message: "deletePermission Method called successfully"});
        var permission = await permissionService.deletePermission(req,res,next); 
        res.status(201).json(permission)
}