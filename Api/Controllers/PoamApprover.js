/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamApproverService = require('../Services/mysql/poamApproverService')

module.exports.getPoamApprovers = async function getPoamApprovers(req, res, next){
        //res.status(201).json({message: "getPoamApprovers Method called successfully"})
        var poamApprovers = await poamApproverService.getPoamApprovers(req,res,next); 
        //console.log("returning poamApprovers: ", poamApprovers)
        res.status(201).json(poamApprovers)
}

module.exports.getPoamApproversByCollectionUser = async function getPoamApproversByCollectionUser(req, res, next){
        //res.status(201).json({message: "getPoamApprovers Method called successfully"})
        var poamApprovers = await poamApproverService.getPoamApproversByCollectionUser(req,res,next); 
        //console.log("returning poamApprovers: ", poamApprovers)
        res.status(201).json(poamApprovers)
}

module.exports.postPoamApprover = async function postPoamApprover(req, res, next){
        //res.status(201).json({message: "postPoamApprover Method called successfully"});
        var poamApprover = await poamApproverService.postPoamApprover(req,res,next); 
        //console.log("returning poamApprover: ", poamApprover)
        res.status(201).json(poamApprover)
}

module.exports.putPoamApprover = async function putPoamApprover(req, res, next){
        // res.status(201).json({message: "putPoamApprover Method called successfully"});
        var poamApprover = await poamApproverService.putPoamApprover(req,res,next); 
        //console.log("returning poamApprover: ", poamApprover)
        res.status(201).json(poamApprover)
}

module.exports.deletePoamApprover= async function deletePoamApporver(req, res, next){
        // res.status(201).json({message: "deletePoamApprover Method called successfully"});
        var poamApprover = await poamApproverService.deletePoamAprover(req,res,next);
       // console.log("returning poamApprover: ", poamApprover); 
        res.status(201).json(poamApprover)
}
