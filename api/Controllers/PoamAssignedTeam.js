/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamAssignedTeamService = require('../Services/poamAssignedTeamService');
const { sendError } = require('../utils/respond');

exports.getPoamAssignedTeams = async function getPoamAssignedTeams(_req, res) {
    try {
        const result = await poamAssignedTeamService.getPoamAssignedTeams();

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

exports.getPoamAssignedTeamsByPoamId = async function getPoamAssignedTeamsByPoamId(req, res) {
    try {
        const result = await poamAssignedTeamService.getPoamAssignedTeamsByPoamId(req.params.poamId);

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

exports.postPoamAssignedTeam = async function postPoamAssignedTeam(req, res) {
    try {
        const assignedTeam = await poamAssignedTeamService.postPoamAssignedTeam(req);

        res.status(201).json(assignedTeam);
    } catch (error) {
        sendError(res, error);
    }
};

exports.deletePoamAssignedTeam = async function deletePoamAssignedTeam(req, res) {
    try {
        await poamAssignedTeamService.deletePoamAssignedTeam(req);

        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
