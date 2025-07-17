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

module.exports.getAsset = async function getAsset(req, res, next) {
    try {
        const asset = await assetService.getAsset(req, res, next);
        res.status(200).json(asset);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetByName = async function getAssetByName(req, res, next) {
    try {
        const asset = await assetService.getAssetByName(req, res, next);
        res.status(200).json(asset);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetsByCollection = async function getAssetsByCollection(req, res, next) {
    try {
        const response = await assetService.getAssetsByCollection(req, res, next);
        const assets = response.assets;
        res.status(200).json(assets);
    } catch (error) {
        if (error.message === 'Collection ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postAsset = async function postAsset(req, res, next) {
    try {
        const asset = await assetService.postAsset(req, res, next);
        res.status(201).json(asset);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putAsset = async function putAsset(req, res, next) {
    try {
        const asset = await assetService.putAsset(req, res, next);
        res.status(200).json(asset);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAsset = async function deleteAsset(req, res, next) {
    try {
        await assetService.deleteAsset(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAssetsByPoamId = async function deleteAssetsByPoamId(req, res, next) {
    try {
        await assetService.deleteAssetsByPoamId(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetDeltaList = async function getAssetDeltaList(req, res, next) {
    try {
        const response = await assetService.getAssetDeltaList(req, res, next);
        res.status(200).json({
            assets: response.assets,
        });
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssetDeltaListByCollection = async function getAssetDeltaListByCollection(req, res, next) {
    try {
        const collectionId = req.params.collectionId;
        if (!collectionId) {
            return res.status(400).json({
                error: 'Validation Error',
                detail: 'Collection ID is required',
            });
        }

        const response = await assetService.getAssetDeltaListByCollection(req, res, next, collectionId);
        if (response.error) {
            return res.status(500).json({
                error: 'Internal Server Error',
                detail: response.error,
            });
        }

        res.status(200).json({
            assets: response.assets || [],
            assetDeltaUpdated: response.assetDeltaUpdated || null,
            emassHardwareListUpdated: response.emassHardwareListUpdated || null,
        });
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};
