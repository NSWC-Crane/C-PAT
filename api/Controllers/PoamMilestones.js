/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamMilestoneService = require('../Services/poamMilestoneService');
const { sendError } = require('../utils/respond');

module.exports.getPoamMilestones = async function getPoamMilestones(req, res) {
    try {
        const poamMilestones = await poamMilestoneService.getPoamMilestones(req.params.poamId);

        res.status(200).json(poamMilestones);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamMilestone = async function postPoamMilestone(req, res) {
    try {
        const poamMilestone = await poamMilestoneService.postPoamMilestone(req.params.poamId, req);

        res.status(201).json(poamMilestone);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putPoamMilestone = async function putPoamMilestone(req, res) {
    try {
        const poamMilestone = await poamMilestoneService.putPoamMilestone(req.params.poamId, req.params.milestoneId, req);

        res.status(200).json(poamMilestone);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamMilestone = async function deletePoamMilestone(req, res) {
    try {
        await poamMilestoneService.deletePoamMilestone(req.params.poamId, req.params.milestoneId, req);

        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
