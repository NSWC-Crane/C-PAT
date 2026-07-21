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
const { sendError } = require('../utils/respond');

module.exports.getTeamAssignments = async function getTeamAssignments(req, res) {
    try {
        const teamAssignments = await userTeamAssignmentService.getTeamAssignments(req);
        res.status(200).json(teamAssignments);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postTeamAssignment = async function postTeamAssignment(req, res) {
    try {
        const teamAssignment = await userTeamAssignmentService.postTeamAssignment(req.userObject.userId, req.query.elevate, req);
        res.status(201).json(teamAssignment);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putTeamAssignment = async function putTeamAssignment(req, res) {
    try {
        const teamAssignment = await userTeamAssignmentService.putTeamAssignment(req.userObject.userId, req.query.elevate, req);
        res.status(200).json(teamAssignment);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteTeamAssignment = async function deleteTeamAssignment(req, res) {
    try {
        await userTeamAssignmentService.deleteTeamAssignment(req.userObject.userId, req.query.elevate, req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
