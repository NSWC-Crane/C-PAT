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

module.exports.getAssignedTeams = async function getAssignedTeams(req, res, next) {
    try {
        const assignedTeams = await assignedTeamsService.getAssignedTeams(req, res, next);
        res.status(200).json(assignedTeams);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAssignedTeam = async function getAssignedTeam(req, res, next) {
    try {
        const assignedTeam = await assignedTeamsService.getAssignedTeam(req, res, next);
        res.status(200).json(assignedTeam);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postAssignedTeam = async function postAssignedTeam(req, res, next) {
    try {
        const assignedTeam = await assignedTeamsService.postAssignedTeam(req, res, next);
        res.status(201).json(assignedTeam);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putAssignedTeam = async function putAssignedTeam(req, res, next) {
    try {
        const assignedTeam = await assignedTeamsService.putAssignedTeam(req, res, next);
        res.status(200).json(assignedTeam);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAssignedTeam = async function deleteAssignedTeam(req, res, next) {
    try {
        await assignedTeamsService.deleteAssignedTeam(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postAssignedTeamPermission = async function postAssignedTeamPermission(req, res, next) {
    try {
        const permission = await assignedTeamsService.postAssignedTeamPermission(req, res, next);
        res.status(201).json(permission);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAssignedTeamPermission = async function deleteAssignedTeamPermission(req, res, next) {
    try {
        const result = await assignedTeamsService.deleteAssignedTeamPermission(req, res, next);
        res.status(200).json(result);
    } catch (error) {
        if (error.status === 404) {
            res.status(404).json({ error: 'Not Found', detail: error.message });
        } else if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};