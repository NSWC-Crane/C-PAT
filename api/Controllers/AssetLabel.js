/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const assetLabelService = require('../Services/assetLabelService');
const { sendError } = require('../utils/respond');

module.exports.getAssetLabels = async function getAssetLabels(req, res) {
    try {
        const assetLabels = await assetLabelService.getAssetLabels(req);
        res.status(200).json(assetLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetLabelsByAsset = async function getAssetLabelsByAsset(req, res) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByAsset(req);
        res.status(200).json(assetLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetLabelsByLabel = async function getAssetLabelsByLabel(req, res) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByLabel(req);
        res.status(200).json(assetLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssetLabel = async function getAssetLabel(req, res) {
    try {
        const assetLabel = await assetLabelService.getAssetLabel(req);
        res.status(200).json(assetLabel);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postAssetLabel = async function postAssetLabel(req, res) {
    try {
        const result = await assetLabelService.postAssetLabel(req);
        res.status(201).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAssetLabel = async function deleteAssetLabel(req, res) {
    try {
        await assetLabelService.deleteAssetLabel(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
