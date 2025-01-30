/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamLabelService = require('../Services/poamLabelService')

module.exports.getPoamLabels = async function getPoamLabels(req, res, next) {
    try {
        const { collectionId } = req.params;
        const poamLabels = await poamLabelService.getPoamLabels(collectionId);
        res.status(200).json(poamLabels);
    } catch (error) {
        if (error.message === 'Collection ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getAvailablePoamLabels = async function getAvailablePoamLabels(req, res, next) {
    try {
        const poamLabels = await poamLabelService.getAvailablePoamLabels(req);
        res.status(200).json(poamLabels);
    } catch (error) {
        if (error.message === 'User ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getPoamLabelsByPoam = async function getPoamLabelsByPoam(req, res, next) {
    try {
        const { poamId } = req.params;
        const poamLabels = await poamLabelService.getPoamLabelsByPoam(poamId);
        res.status(200).json(poamLabels);
    } catch (error) {
        if (error.message === 'POAM ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getPoamLabelByLabel = async function getPoamLabelByLabel(req, res, next) {
    try {
        const { labelId } = req.params;
        const poamLabels = await poamLabelService.getPoamLabelsByLabel(labelId);
        res.status(200).json(poamLabels);
    } catch (error) {
        if (error.message === 'Label ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.getPoamLabel = async function getPoamLabel(req, res, next) {
    try {
        const { poamId, labelId } = req.params;
        const poamLabel = await poamLabelService.getPoamLabel(poamId, labelId);
        res.status(200).json(poamLabel);
    } catch (error) {
        if (error.message === 'POAM ID and Label ID are required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.postPoamLabel = async function postPoamLabel(req, res, next) {
    try {
        const poamLabel = await poamLabelService.postPoamLabel(req, res, next);
        res.status(201).json(poamLabel);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.deletePoamLabel = async function deletePoamLabel(req, res, next) {
    try {
        await poamLabelService.deletePoamLabel(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}