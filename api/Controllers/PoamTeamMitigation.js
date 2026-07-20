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
const SmError = require('../utils/error');

exports.getPoamTeamMitigations = async function getPoamTeamMitigations(_req, res) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigations();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.getPoamTeamMitigationsByPoamId = async function getPoamTeamMitigationsByPoamId(req, res) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigationsByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.postPoamTeamMitigation = async function postPoamTeamMitigation(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.postPoamTeamMitigation(req);
        return res.status(201).json(teamMitigation);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.updatePoamTeamMitigation = async function updatePoamTeamMitigation(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigation(req);
        return res.status(200).json(teamMitigation);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.updatePoamTeamMitigationStatus = async function updatePoamTeamMitigationStatus(req, res) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigationStatus(req);
        return res.status(200).json(teamMitigation);
    } catch (error) {
        if (error instanceof SmError.NotFoundError) {
            return res.status(404).json({ error: error.message, detail: error.detail });
        }
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.deletePoamTeamMitigation = async function deletePoamTeamMitigation(req, res) {
    try {
        await poamTeamMitigationService.deletePoamTeamMitigation(req);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};
