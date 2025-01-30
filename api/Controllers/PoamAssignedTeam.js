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

exports.getPoamAssignedTeams = async function getPoamAssignedTeams(req, res, next) {
    try {
        const result = await poamAssignedTeamService.getPoamAssignedTeam();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while retrieving POAM assigned teams" });
    }
};

exports.getPoamAssignedTeamsByPoamId = async function getPoamAssignedTeamsByPoamId(req, res, next) {
    try {
        const result = await poamAssignedTeamService.getPoamAssignedTeamsByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while retrieving POAM assigned teams by poamId" });
    }
};

exports.postPoamAssignedTeam = async function postPoamAssignedTeam(req, res, next) {
    try {
        const assignedTeam = await poamAssignedTeamService.postPoamAssignedTeam(req, res, next);
        return res.status(201).json(assignedTeam);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while entering the POAM assigned team" });
    }
};

exports.deletePoamAssignedTeam = async function deletePoamAssignedTeam(req, res, next) {
    try {
        await poamAssignedTeamService.deletePoamAssignedTeam(req, res, next);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while deleting the POAM assigned team" });
    }
};