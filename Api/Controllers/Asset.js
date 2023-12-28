/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const assetService = require('../Services/mysql/assetService')

module.exports.getAssets = async function getAssets(req, res, next){
        //res.status(201).json({message: "getAssets Method called successfully"})
        var assets = await assetService.getAssets(req,res,next); 
        res.status(201).json(assets)
}

module.exports.getAsset = async function getAsset(req, res, next){
        //res.status(201).json({message: "getAsset Method called successfully"});
        var asset = await assetService.getAsset(req,res,next); 
        res.status(201).json(asset)
}

module.exports.getAssetsByCollection = async function getAssetsByCollection(req, res, next){
        //res.status(201).json({message: "getAssetsByCollection Method called successfully"})
        var assets = await assetService.getAssetsByCollection(req,res,next); 
        res.status(201).json(assets)
}

module.exports.postAsset = async function postAsset(req, res, next){
        // res.status(201).json({message: "post:Asset Method called successfully"});
        var asset = await assetService.postAsset(req,res,next); 
        res.status(201).json(asset)
}

module.exports.putAsset = async function putAsset(req, res, next){
        //res.status(201).json({message: "putAsset Method called successfully"});
        var asset = await assetService.putAsset(req,res,next); 
        res.status(201).json(asset)
}

module.exports.deleteAsset= async function deleteAsset(req, res, next){
        // res.status(201).json({message: "deleteAsset Method called successfully"});
        var asset = await assetService.deleteAsset(req,res,next); 
        res.status(201).json(asset)
}

