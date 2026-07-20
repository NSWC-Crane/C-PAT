/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const labelService = require('../Services/labelService');
const { sendError } = require('../utils/respond');

module.exports.getLabels = async function getLabels(req, res) {
    try {
        const labels = await labelService.getLabels(req);
        res.status(200).json(labels);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getLabel = async function getLabel(req, res) {
    try {
        const label = await labelService.getLabel(req);
        res.status(200).json(label);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postLabel = async function postLabel(req, res) {
    try {
        const label = await labelService.postLabel(req);
        res.status(201).json(label);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putLabel = async function putLabel(req, res) {
    try {
        const label = await labelService.putLabel(req);
        res.status(200).json(label);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteLabel = async function deleteLabel(req, res) {
    try {
        await labelService.deleteLabel(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
