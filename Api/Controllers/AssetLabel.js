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

module.exports.getAssetLabels = async function getAssetLabels(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabels(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        next(error);
    }
};

module.exports.getAssetLabelsByAsset = async function getAssetLabelsByAsset(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByAsset(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        next(error);
    }
};

module.exports.getAssetLabelsByLabel = async function getAssetLabelsByLabel(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByLabel(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        next(error);
    }
};

module.exports.getAssetLabel = async function getAssetLabel(req, res, next) {
    try {
        const assetLabel = await assetLabelService.getAssetLabel(req, res, next);
        res.status(200).json(assetLabel);
    } catch (error) {
        next(error);
    }
};

module.exports.postAssetLabel = async function postAssetLabel(req, res, next) {
    try {
        const assetLabel = await assetLabelService.postAssetLabel(req, res, next);
        res.status(201).json(assetLabel);
    } catch (error) {
        next(error);
    }
};

module.exports.deleteAssetLabel = async function deleteAssetLabel(req, res, next) {
    try {
        await assetLabelService.deleteAssetLabel(req, res, next);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};