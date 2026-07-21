/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamLabelService = require('../Services/poamLabelService');
const { sendError } = require('../utils/respond');

module.exports.getPoamLabels = async function getPoamLabels(req, res) {
    try {
        const poamLabels = await poamLabelService.getPoamLabels(req.params.collectionId);
        res.status(200).json(poamLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailablePoamLabels = async function getAvailablePoamLabels(req, res) {
    try {
        const poamLabels = await poamLabelService.getAvailablePoamLabels(req);
        res.status(200).json(poamLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamsByLabel = async function getPoamsByLabel(req, res) {
    try {
        const poams = await poamLabelService.getPoamsByLabel(req.params.labelId);
        res.status(200).json(poams);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(req, res) {
    try {
        const poamLabels = await poamLabelService.getPoamLabelsByPoam(req.params.poamId);
        res.status(200).json(poamLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamLabelByLabel = async function getPoamLabelByLabel(req, res) {
    try {
        const poamLabels = await poamLabelService.getPoamLabelsByLabel(req.params.labelId);
        res.status(200).json(poamLabels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamLabel = async function getPoamLabel(req, res) {
    try {
        const poamLabel = await poamLabelService.getPoamLabel(req.params.poamId, req.params.labelId);
        res.status(200).json(poamLabel);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamLabel = async function postPoamLabel(req, res) {
    try {
        const poamLabel = await poamLabelService.postPoamLabel(req);
        res.status(201).json(poamLabel);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamLabel = async function deletePoamLabel(req, res) {
    try {
        await poamLabelService.deletePoamLabel(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
