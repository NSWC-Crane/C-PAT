/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const userTeamAssignmentService = require('../Services/userTeamAssignmentService');


module.exports.getTeamAssignments = async function getTeamAssignments(req, res, next) {
    try {
        const teamAssignments = await userTeamAssignmentService.getTeamAssignments(req, res, next);
        res.status(200).json(teamAssignments);
    } catch (error) {
        if (error.message === 'assignedTeamId is required') {
            res.status(400).json({ error: 'Validation Error', detail: 'assignedTeamId is required' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postTeamAssignment = async function postTeamAssignment(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const teamAssignment = await userTeamAssignmentService.postTeamAssignment(userId, elevate, req);
        res.status(201).json(teamAssignment);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putTeamAssignment = async function putTeamAssignment(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        const teamAssignment = await userTeamAssignmentService.putTeamAssignment(userId, elevate, req);
        res.status(200).json(teamAssignment);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteTeamAssignment = async function deleteTeamAssignment(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const elevate = req.query.elevate;
        await userTeamAssignmentService.deleteTeamAssignment(userId, elevate, req);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};