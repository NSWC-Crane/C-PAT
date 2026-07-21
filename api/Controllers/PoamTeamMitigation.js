/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamTeamMitigationService = require('../Services/poamTeamMitigationService');
const { sendError } = require('../utils/respond');

module.exports.getPoamTeamMitigations = async function getPoamTeamMitigations(_req, res) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigations();

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamTeamMitigationsByPoamId = async function getPoamTeamMitigationsByPoamId(req, res) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigationsByPoamId(req.params.poamId);

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamTeamMitigation = async function postPoamTeamMitigation(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.postPoamTeamMitigation(req);

        res.status(201).json(teamMitigation);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updatePoamTeamMitigation = async function updatePoamTeamMitigation(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigation(req);

        res.status(200).json(teamMitigation);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.updatePoamTeamMitigationStatus = async function updatePoamTeamMitigationStatus(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigationStatus(req);

        res.status(200).json(teamMitigation);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamTeamMitigation = async function deletePoamTeamMitigation(req, res) {
    try {
        await poamTeamMitigationService.deletePoamTeamMitigation(req);

        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
