/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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