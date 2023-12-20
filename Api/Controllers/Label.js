/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const labelService = require('../Services/mysql/labelService')


module.exports.getLabels = async function getLabels(req, res, next){
        // res.status(201).json({message: "getLabels Method called successfully"})
        var labels = await labelService.getLabels(req,res,next); 
        res.status(201).json(labels)
}

module.exports.getLabel = async function getLabel(req, res, next){
        // res.status(201).json({message: "getLabel Method called successfully"});
        var label = await labelService.getLabel(req,res,next); 
        res.status(201).json(label)
}

module.exports.postLabel = async function postLabel(req, res, next){
        //res.status(201).json({message: "post:Label Method called successfully"});
        var label = await labelService.postLabel(req,res,next); 
        res.status(201).json(label)
}

module.exports.putLabel = async function putLabel(req, res, next){
        // res.status(201).json({message: "putLabel Method called successfully"});
        var label = await labelService.putLabel(req,res,next); 
        res.status(201).json(label)
}

module.exports.deleteLabel= async function deleteLabel(req, res, next){
        // res.status(201).json({message: "deleteLabel Method called successfully"});
        var label = await labelService.deleteLabel(req,res,next); 
        res.status(201).json(label)
}