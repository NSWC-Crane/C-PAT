/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamAssigneeService = require('../Services/poamAssigneeService');

exports.getPoamAssignees = async function getPoamAssignees(req, res, next) {
    try {
        const result = await poamAssigneeService.getPoamAssignees();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while retrieving POAM assignees" });
    }
};

exports.getPoamAssigneesByPoamId = async function getPoamAssigneesByPoamId(req, res, next) {
    try {
        const result = await poamAssigneeService.getPoamAssigneesByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while retrieving POAM assignees by poamId" });
    }
};

exports.postPoamAssignee = async function postPoamAssignee(req, res, next) {
    try {
        const assignee = await poamAssigneeService.postPoamAssignee(req, res, next);
        return res.status(201).json(assignee);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while creating the POAM assignee" });
    }
};

exports.deletePoamAssignee = async function deletePoamAssignee(req, res, next) {
    try {
        await poamAssigneeService.deletePoamAssignee(req, res, next);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while deleting the POAM assignee" });
    }
};