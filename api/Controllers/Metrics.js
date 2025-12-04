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

module.exports.getCollectionAssetLabel = async function getCollectionAssetLabel(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionAssetLabel(collectionId);
        if (getMetrics) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCollectionPoamLabel = async function getCollectionPoamLabel(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamLabel(collectionId);
        if (getMetrics) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCollectionPoamStatus = async function getCollectionPoamStatus(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamStatus(collectionId);
        if (getMetrics?.poamStatus) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCollectionPoamSeverity = async function getCollectionPoamSeverity(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamSeverity(collectionId);
        if (getMetrics?.poamSeverity) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getCollectionPoamScheduledCompletion = async function getCollectionPoamScheduledCompletion(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        const getMetrics = await metricsService.getCollectionPoamScheduledCompletion(collectionId);
        if (getMetrics?.poamScheduledCompletion) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailableAssetLabel = async function getAvailableAssetLabel(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailableAssetLabel(req);
        if (getMetrics) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailablePoamLabel = async function getAvailablePoamLabel(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailablePoamLabel(req);
        if (getMetrics) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailablePoamStatus = async function getAvailablePoamStatus(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailablePoamStatus(req);
        if (getMetrics?.poamStatus) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailablePoamSeverity = async function getAvailablePoamSeverity(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailablePoamSeverity(req);
        if (getMetrics?.poamSeverity) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailableMonthlyPoamSeverity = async function getAvailableMonthlyPoamSeverity(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailableMonthlyPoamSeverity(req);
        if (getMetrics?.poamSeverity) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailableMonthlyPoamStatus = async function getAvailableMonthlyPoamStatus(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailableMonthlyPoamStatus(req);
        if (getMetrics?.poamStatus) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

module.exports.getAvailablePoamScheduledCompletion = async function getAvailablePoamScheduledCompletion(req, res, next) {
    try {
        const getMetrics = await metricsService.getAvailablePoamScheduledCompletion(req);
        if (getMetrics?.poamScheduledCompletion) {
            res.status(200).json(getMetrics);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};
