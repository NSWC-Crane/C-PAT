/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamAssetService = require('../Services/poamAssetService');
const { sendError } = require('../utils/respond');

module.exports.getPoamAssets = async function getPoamAssets(_req, res) {
    try {
        const poamAssets = await poamAssetService.getPoamAssets();
        res.status(200).json(poamAssets);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamAssetsByPoamId = async function getPoamAssetsByPoamId(req, res) {
    try {
        const poamAssets = await poamAssetService.getPoamAssetsByPoamId(req);
        res.status(200).json(poamAssets);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamAssetsByCollectionId = async function getPoamAssetsByCollectionId(req, res) {
    try {
        const poamAssets = await poamAssetService.getPoamAssetsByCollectionId(req);
        res.status(200).json(poamAssets);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamAssetByPoamId = async function deletePoamAssetByPoamId(req, res) {
    try {
        await poamAssetService.deletePoamAssetByPoamId(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamAssetsByAssetId = async function getPoamAssetsByAssetId(req, res) {
    try {
        const poamAssets = await poamAssetService.getPoamAssetsByAssetId(req);
        res.status(200).json(poamAssets);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamAsset = async function postPoamAsset(req, res) {
    try {
        const poamAsset = await poamAssetService.postPoamAsset(req);
        res.status(201).json(poamAsset);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamAsset = async function deletePoamAsset(req, res) {
    try {
        await poamAssetService.deletePoamAsset(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
