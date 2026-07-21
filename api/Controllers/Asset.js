/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const assetService = require('../Services/assetService');
const { sendError } = require('../utils/respond');

module.exports.getAsset = async function getAsset(req, res) {
    try {
        const asset = await assetService.getAsset(req);
        res.status(200).json(asset);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetByName = async function getAssetByName(req, res) {
    try {
        const asset = await assetService.getAssetByName(req);
        res.status(200).json(asset);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetsByCollection = async function getAssetsByCollection(req, res) {
    try {
        const response = await assetService.getAssetsByCollection(req);
        res.status(200).json(response.assets);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postAsset = async function postAsset(req, res) {
    try {
        const asset = await assetService.postAsset(req);
        res.status(201).json(asset);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putAsset = async function putAsset(req, res) {
    try {
        const asset = await assetService.putAsset(req);
        res.status(200).json(asset);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAsset = async function deleteAsset(req, res) {
    try {
        await assetService.deleteAsset(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAssetsByPoamId = async function deleteAssetsByPoamId(req, res) {
    try {
        await assetService.deleteAssetsByPoamId(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetDeltaList = async function getAssetDeltaList(_req, res) {
    try {
        const response = await assetService.getAssetDeltaList();
        res.status(200).json({
            assets: response.assets,
        });
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetDeltaListByCollection = async function getAssetDeltaListByCollection(req, res) {
    try {
        const response = await assetService.getAssetDeltaListByCollection(req.params.collectionId);
        res.status(200).json({
            assets: response.assets || [],
            assetDeltaUpdated: response.assetDeltaUpdated || null,
            emassHardwareListUpdated: response.emassHardwareListUpdated || null,
        });
    } catch (error) {
        sendError(res, error);
    }
};
