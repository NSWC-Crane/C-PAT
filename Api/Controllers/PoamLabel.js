/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamLabelService = require('../Services/mysql/poamLabelService')

module.exports.getPoamLabels = async function getPoamLabels(req, res, next){
        // res.status(201).json({message: "getPoamLabels Method called successfully"})
        var poamLabels = await poamLabelService.getPoamLabels(req,res,next); 
        res.status(201).json(poamLabels)
}

module.exports.getPoamLabelByPoam = async function getPoamLabelByPoam(req, res, next){
        // res.status(201).json({message: "getAsseLabelByPoam Method called successfully"});
        var poamLabels = await poamLabelService.getPoamLabelsByPoam(req,res,next); 
        res.status(201).json(poamLabels)
}

module.exports.getPoamLabelByLabel = async function getPoamLabelByLabel(req, res, next){
        //res.status(201).json({message: "getAsseLabelByLabel Method called successfully"});
        var poamLabels = await poamLabelService.getPoamLabelsByLabel(req,res,next); 
        res.status(201).json(poamLabels)
}

module.exports.getPoamLabel = async function getPoamLabel(req, res, next){
        // res.status(201).json({message: "getAsseLabel Method called successfully"});
        var poamLabel = await poamLabelService.getPoamLabel(req,res,next); 
        res.status(201).json(poamLabel)
}

module.exports.postPoamLabel = async function postPoamLabel(req, res, next){
        // res.status(201).json({message: "post:PoamLabel Method called successfully"});
        var poamLabel = await poamLabelService.postPoamLabel(req,res,next); 
        res.status(201).json(poamLabel)
}

module.exports.putPoamLabel = async function putPoamLabel(req, res, next){
        res.status(201).json({message: "putPoamLabel Method called successfully, There is only a unique index on poam and label id's, nothing to update!!!"});
        // var poamLabel = await poamLabelService.putPoam(req,res,next); 
        // res.status(201).json(poamLabel)
}

module.exports.deletePoamLabel= async function deletePoamLabel(req, res, next){
        //res.status(201).json({message: "deletePoamLabel Method called successfully"});
        var poamLabel = await poamLabelService.deletePoamLabel(req,res,next); 
        res.status(201).json(poamLabel)
}

