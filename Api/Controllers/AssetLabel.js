/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const assetLabelService = require('../Services/mysql/assetLabelService')

module.exports.getAssetLabels = async function getAssetLabels(req, res, next){
        // res.status(201).json({message: "getAssetLabels Method called successfully"})
        var assetLabels = await assetLabelService.getAssetLabels(req,res,next); 
        res.status(201).json(assetLabels)
}

module.exports.getAssetLabelByAsset = async function getAssetLabelByAsset(req, res, next){
        // res.status(201).json({message: "getAsseLabelByAsset Method called successfully"});
        var assetLabels = await assetLabelService.getAssetLabelsByAsset(req,res,next); 
        res.status(201).json(assetLabels)
}

module.exports.getAssetLabelByLabel = async function getAssetLabelByLabel(req, res, next){
        //res.status(201).json({message: "getAsseLabelByLabel Method called successfully"});
        var assetLabels = await assetLabelService.getAssetLabelsByLabel(req,res,next); 
        res.status(201).json(assetLabels)
}

module.exports.getAssetLabel = async function getAssetLabel(req, res, next){
        // res.status(201).json({message: "getAsseLabel Method called successfully"});
        var assetLabel = await assetLabelService.getAssetLabel(req,res,next); 
        res.status(201).json(assetLabel)
}

module.exports.postAssetLabel = async function postAssetLabel(req, res, next){
        // res.status(201).json({message: "post:AssetLabel Method called successfully"});
        var assetLabel = await assetLabelService.postAssetLabel(req,res,next); 
        res.status(201).json(assetLabel)
}

module.exports.putAssetLabel = async function putAssetLabel(req, res, next){
        res.status(201).json({message: "putAssetLabel Method called successfully, There is only a unique index on asset and label id's, nothing to update!!!"});
        // var assetLabel = await assetLabelService.putAsset(req,res,next); 
        // res.status(201).json(assetLabel)
}

module.exports.deleteAssetLabel= async function deleteAssetLabel(req, res, next){
        //res.status(201).json({message: "deleteAssetLabel Method called successfully"});
        var assetLabel = await assetLabelService.deleteAssetLabel(req,res,next); 
        res.status(201).json(assetLabel)
}

