/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamService = require('../Services/poamService');
const { sendError } = require('../utils/respond');

module.exports.getAvailablePoams = async function getAvailablePoams(req, res) {
    try {
        const poams = await poamService.getAvailablePoams(req.userObject.userId, req);

        res.status(200).json(poams);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoam = async function getPoam(req, res) {
    try {
        const poam = await poamService.getPoam(req);

        res.status(200).json(poam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamsByCollectionId = async function getPoamsByCollectionId(req, res) {
    try {
        const poams = await poamService.getPoamsByCollectionId(req);

        res.status(200).json(poams);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamsByOwnership = async function getPoamsByOwnership(req, res) {
    try {
        const poams = await poamService.getPoamsByOwnership(req);

        res.status(200).json(poams);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getVulnerabilityIdsWithPoam = async function getVulnerabilityIdsWithPoam(_req, res) {
    try {
        const vulnerabilityIds = await poamService.getVulnerabilityIdsWithPoam();

        res.status(200).json(vulnerabilityIds);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getVulnerabilityIdsWithPoamByCollection = async function getVulnerabilityIdsWithPoamByCollection(req, res) {
    try {
        const vulnerabilityIds = await poamService.getVulnerabilityIdsWithPoamByCollection(req);

        res.status(200).json(vulnerabilityIds);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getVulnerabilityIdsWithTaskOrderByCollection = async function getVulnerabilityIdsWithTaskOrderByCollection(req, res) {
    try {
        const vulnerabilityIds = await poamService.getVulnerabilityIdsWithTaskOrderByCollection(req);

        res.status(200).json(vulnerabilityIds);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoam = async function postPoam(req, res) {
    try {
        const poam = await poamService.postPoam(req);

        res.status(201).json(poam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putPoam = async function putPoam(req, res) {
    try {
        const poam = await poamService.putPoam(req);

        res.status(200).json(poam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updatePoamStatus = async function updatePoamStatus(req, res) {
    try {
        const poam = await poamService.updatePoamStatus(req);

        res.status(200).json(poam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoam = async function deletePoam(req, res) {
    try {
        await poamService.deletePoam(req);

        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
