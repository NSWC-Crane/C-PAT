/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamAssetService = require('../Services/mysql/poamAssetService')

module.exports.getPoamAssets = async function getPoamAssets(req, res, next){
        //res.status(201).json({message: "getPoamAssets Method called successfully"})
        var poamAssets = await poamAssetService.getPoamAssets(req,res,next); 
        res.status(201).json(poamAssets)
}

module.exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req, res, next){
        // res.status(201).json({message: "getPoamAssetsByPoamId Method called successfully"});
        var poamAssets = await poamAssetService.getPoamAssetsByPoamId(req,res,next); 
        res.status(201).json(poamAssets)
}

module.exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req, res, next){
        // res.status(201).json({message: "getPoamAssetsByAssetId Method called successfully"});
        var poamAssets = await poamAssetService.getPoamAssetsByAssetId(req,res,next); 
        res.status(201).json(poamAssets)
}

module.exports.getPoamAsset = async function getPoamAsset(req, res, next){
        res.status(201).json({message: "getPoamAsset Method called successfully"});
        // var poamAsset = await poamAssetService.getPoamAsset(req,res,next); 
        // res.status(201).json(poamAsset)
}

module.exports.postPoamAsset = async function postPoamAsset(req, res, next){
        // res.status(201).json({message: "postPoamAsset Method called successfully"});
        var poamAsset = await poamAssetService.postPoamAsset(req,res,next); 
        res.status(201).json(poamAsset)
}

module.exports.putPoamAsset = async function putPoamAsset(req, res, next){
        res.status(201).json({message: "putPoamAsset Method called successfully, There is only a unique index on poamId and assetId, nothing to update!!!"});
        // var poamAsset = await poamAssetService.putAsset(req,res,next); 
        // res.status(201).json(poamAsset)
}

module.exports.deletePoamAsset = async function deletePoamAsset(req, res, next){
        // res.status(201).json({message: "deletePoamAsset Method called successfully"});
        var poamAsset = await poamAssetService.deletePoamAsset(req,res,next); 
        res.status(201).json(poamAsset)
}

