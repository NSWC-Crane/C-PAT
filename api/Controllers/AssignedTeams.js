/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const assignedTeamsService = require('../Services/assignedTeamsService');
const { sendError } = require('../utils/respond');

module.exports.getAssignedTeams = async function getAssignedTeams(_req, res) {
    try {
        const assignedTeams = await assignedTeamsService.getAssignedTeams();
        res.status(200).json(assignedTeams);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAssignedTeam = async function getAssignedTeam(req, res) {
    try {
        const assignedTeam = await assignedTeamsService.getAssignedTeam(req);
        res.status(200).json(assignedTeam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postAssignedTeam = async function postAssignedTeam(req, res) {
    try {
        const assignedTeam = await assignedTeamsService.postAssignedTeam(req);
        res.status(201).json(assignedTeam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putAssignedTeam = async function putAssignedTeam(req, res) {
    try {
        const assignedTeam = await assignedTeamsService.putAssignedTeam(req);
        res.status(200).json(assignedTeam);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAssignedTeam = async function deleteAssignedTeam(req, res) {
    try {
        await assignedTeamsService.deleteAssignedTeam(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postAssignedTeamPermission = async function postAssignedTeamPermission(req, res) {
    try {
        const permission = await assignedTeamsService.postAssignedTeamPermission(req);
        res.status(201).json(permission);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAssignedTeamPermission = async function deleteAssignedTeamPermission(req, res) {
    try {
        const result = await assignedTeamsService.deleteAssignedTeamPermission(req);
        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};
