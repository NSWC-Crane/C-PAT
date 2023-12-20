/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamAssigneeService = require('../Services/mysql/poamAssigneeService')

module.exports.getPoamAssignees = async function getPoamAssignees(req, res, next){
        // res.status(201).json({message: "getPoamAssignees Method called successfully"})
        var poamAssignees = await poamAssigneeService.getPoamAssignees(req,res,next); 
        res.status(201).json(poamAssignees)
}

module.exports.getPoamAssigneesByPoamId = async function getPoamAssigneesByPoamId(req, res, next){
        //res.status(201).json({message: "getPoamAssigneesByPoamId Method called successfully"});
        var poamAssignees = await poamAssigneeService.getPoamAssigneesByPoamId(req,res,next); 
        res.status(201).json(poamAssignees)
}

module.exports.getPoamAssigneesByUserId = async function getPoamAssigneesByUserId(req, res, next){
        //res.status(201).json({message: "getPoamAssigneesByUserId Method called successfully"});
        var poamAssignees = await poamAssigneeService.getPoamAssigneesByUserId(req,res,next); 
        res.status(201).json(poamAssignees)
}

module.exports.getPoamAssignee = async function getPoamAssignee(req, res, next){
        //res.status(201).json({message: "getPoamAssignee Method called successfully"});
        var poamAssignee = await poamAssigneeService.getPoamAssignee(req,res,next); 
        res.status(201).json(poamAssignee)
}

module.exports.postPoamAssignee = async function postPoamAssignee(req, res, next){
        //res.status(201).json({message: "postPoamAssignee Method called successfully"});
        var poamAssignee = await poamAssigneeService.postPoamAssignee(req,res,next); 
        res.status(201).json(poamAssignee)
}

module.exports.putPoamAssignee = async function putPoamAssignee(req, res, next){
        res.status(201).json({message: "putPoamAssignee Method called successfully, There is only a unique index on asset and label id's, nothing to update!!!"});
        // var poamAssignee = await poamAssigneeService.putPoamAssignee(req,res,next); 
        // res.status(201).json(poamAssignee)
}

module.exports.deletePoamAssignee = async function deletePoamAssignee(req, res, next){
        //res.status(201).json({message: "deletePoamAssignee Method called successfully"});
        var poamAssignee = await poamAssigneeService.deletePoamAssignee(req,res,next); 
        res.status(201).json(poamAssignee)
}

