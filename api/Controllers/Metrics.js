/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const metricsService = require('../Services/metricsService');
const { sendError } = require('../utils/respond');

module.exports.getCollectionAssetLabel = async function getCollectionAssetLabel(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionAssetLabel(collectionId);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionPoamLabel = async function getCollectionPoamLabel(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamLabel(collectionId);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionPoamStatus = async function getCollectionPoamStatus(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamStatus(collectionId);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionPoamSeverity = async function getCollectionPoamSeverity(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamSeverity(collectionId);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionPoamScheduledCompletion = async function getCollectionPoamScheduledCompletion(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamScheduledCompletion(collectionId);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailableAssetLabel = async function getAvailableAssetLabel(req, res) {
    try {
        const getMetrics = await metricsService.getAvailableAssetLabel(req);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailablePoamLabel = async function getAvailablePoamLabel(req, res) {
    try {
        const getMetrics = await metricsService.getAvailablePoamLabel(req);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailablePoamStatus = async function getAvailablePoamStatus(req, res) {
    try {
        const getMetrics = await metricsService.getAvailablePoamStatus(req);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailablePoamSeverity = async function getAvailablePoamSeverity(req, res) {
    try {
        const getMetrics = await metricsService.getAvailablePoamSeverity(req);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getCollectionPoamMTTR = async function getCollectionPoamMTTR(req, res) {
    try {
        const collectionId = req.params.collectionId;
        const months = Number.parseInt(req.query?.months, 10) || 12;
        const getMetrics = await metricsService.getCollectionPoamMTTR(collectionId, months);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAvailablePoamMTTR = async function getAvailablePoamMTTR(req, res) {
    try {
        const getMetrics = await metricsService.getAvailablePoamMTTR(req);
        res.status(200).json(getMetrics);
    } catch (error) {
        sendError(res, error);
    }
};
