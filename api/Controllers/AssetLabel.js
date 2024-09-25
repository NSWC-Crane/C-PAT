/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const assetLabelService = require('../Services/assetLabelService')

module.exports.getAssetLabels = async function getAssetLabels(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabels(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetLabelsByAsset = async function getAssetLabelsByAsset(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByAsset(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        if (error.message === 'assetId is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getAssetLabelsByLabel = async function getAssetLabelsByLabel(req, res, next) {
    try {
        const assetLabels = await assetLabelService.getAssetLabelsByLabel(req, res, next);
        res.status(200).json(assetLabels);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetLabel = async function getAssetLabel(req, res, next) {
    try {
        const assetLabel = await assetLabelService.getAssetLabel(req, res, next);
        res.status(200).json(assetLabel);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postAssetLabel = async function postAssetLabel(req, res, next) {
    try {
        const result = await assetLabelService.postAssetLabel(req, res, next);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'assetId is required' || error.message === 'labelId is required' || error.message === 'collectionId is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAssetLabel = async function deleteAssetLabel(req, res, next) {
    try {
        await assetLabelService.deleteAssetLabel(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};