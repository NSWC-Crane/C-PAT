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

module.exports.getAssets = async function getAssets(req, res, next) {
    var assets = await assetService.getAssets(req, res, next);
    res.status(200).json(assets);
}

module.exports.getAsset = async function getAsset(req, res, next) {
        try {
            var asset = await assetService.getAsset(req, res, next);
            res.status(201).json(asset);
        } catch (error) {
            if (error.status === 404) {
                res.status(404).json({ error: error.message });
            } else {
                next(error);
            }
        }
    };

module.exports.getAssetByName = async function getAssetByName(req, res, next){
        try {
                var asset = await assetService.getAssetByName(req, res, next);
                res.status(201).json(asset);
            } catch (error) {
                if (error.status === 404) {
                    res.status(404).json({ error: error.message });
                } else {
                    next(error);
                }
            }
        };

module.exports.getAssetsByCollection = async function getAssetsByCollection(req, res, next) {
        try {
            const { collectionId } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = parseInt(req.query.limit) || 50;
    
            var response = await assetService.getAssetsByCollection(collectionId, offset, limit); 
            var assets = response.assets;
            
            res.status(200).json(assets);
        } catch (error) {
            console.error("Error in getAssetsByCollection:", error);
            next(error);
        }
    }
    
module.exports.postAsset = async function postAsset(req, res, next){
        var asset = await assetService.postAsset(req,res,next); 
        res.status(201).json(asset)
}

module.exports.putAsset = async function putAsset(req, res, next){
        var asset = await assetService.putAsset(req,res,next); 
        res.status(201).json(asset)
}

module.exports.deleteAsset= async function deleteAsset(req, res, next){
        var asset = await assetService.deleteAsset(req,res,next); 
        res.status(201).json(asset)
}

