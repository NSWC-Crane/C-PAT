/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamMilestoneService = require('../Services/mysql/poamMilestoneService')

module.exports.getPoamMilestones = async function getPoamMilestones(req, res, next){
        //res.status(201).json({message: "getPoamMilestones Method called successfully"})
        var poamMilestones = await poamMilestoneService.getPoamMilestones(req,res,next); 
        //console.log("returning poamMilestones: ", poamMilestones)
        res.status(200).json(poamMilestones)
}

module.exports.postPoamMilestones = async function postPoamMilestones(req, res, next){
        //res.status(201).json({message: "postPoamMilestone Method called successfully"});
        var poamMilestone = await poamMilestoneService.postPoamMilestone(req,res,next); 
        //console.log("returning poamMilestone: ", poamMilestone)
        res.status(201).json(poamMilestone)
}

module.exports.putPoamMilestones = async function putPoamMilestones(req, res, next){
        // res.status(201).json({message: "putPoamMilestone Method called successfully"});
        var poamMilestone = await poamMilestoneService.putPoamMilestone(req,res,next); 
        //console.log("returning poamMilestone: ", poamMilestone)
        res.status(200).json(poamMilestone)
}

module.exports.deletePoamMilestones = async function deletePoamMilestones(req, res, next){
        // res.status(201).json({message: "deletePoamMilestone Method called successfully"});
        var poamMilestone = await poamMilestoneService.deletePoamMilestone(req,res,next);
       // console.log("returning poamMilestone: ", poamMilestone); 
        res.status(204).json(poamMilestone)
}
