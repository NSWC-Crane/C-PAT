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

exports.getPoamTeamMitigations = async function getPoamTeamMitigations(req, res, next) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigations();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while retrieving POAM team mitigations' });
    }
};

exports.getPoamTeamMitigationsByPoamId = async function getPoamTeamMitigationsByPoamId(req, res, next) {
    try {
        const result = await poamTeamMitigationService.getPoamTeamMitigationsByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while retrieving POAM team mitigations by poamId' });
    }
};

exports.postPoamTeamMitigation = async function postPoamTeamMitigation(req, res, next) {
    try {
        const teamMitigation = await poamTeamMitigationService.postPoamTeamMitigation(req, res, next);
        return res.status(201).json(teamMitigation);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while entering the POAM team mitigation' });
    }
};

exports.updatePoamTeamMitigation = async function updatePoamTeamMitigation(req, res, next) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigation(req, res, next);
        return res.status(200).json(teamMitigation);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating the POAM team mitigation' });
    }
};

exports.updatePoamTeamMitigationStatus = async function updatePoamTeamMitigationStatus(req, res, next) {
    try {
        const teamMitigation = await poamTeamMitigationService.updatePoamTeamMitigationStatus(req, res, next);
        return res.status(200).json(teamMitigation);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating the POAM team mitigation status' });
    }
};

exports.deletePoamTeamMitigation = async function deletePoamTeamMitigation(req, res, next) {
    try {
        await poamTeamMitigationService.deletePoamTeamMitigation(req, res, next);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while deleting the POAM team mitigation' });
    }
};
