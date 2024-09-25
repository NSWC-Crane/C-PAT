/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const poamMilestoneService = require('../Services/poamMilestoneService')

module.exports.getPoamMilestones = async function getPoamMilestones(req, res, next) {
    try {
        const { poamId } = req.params;
        const poamMilestones = await poamMilestoneService.getPoamMilestones(poamId);
        res.status(200).json(poamMilestones);
    } catch (error) {
        if (error.message === 'POAM ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.postPoamMilestone = async function postPoamMilestone(req, res, next) {
    try {
        const { poamId } = req.params;
        const poamMilestone = await poamMilestoneService.postPoamMilestone(poamId, req);
        res.status(201).json(poamMilestone);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.putPoamMilestone = async function putPoamMilestone(req, res, next) {
    try {
        const { poamId, milestoneId } = req.params;
        const poamMilestone = await poamMilestoneService.putPoamMilestone(poamId, milestoneId, req);
        res.status(200).json(poamMilestone);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.deletePoamMilestone = async function deletePoamMilestone(req, res, next) {
    try {
        const { poamId, milestoneId } = req.params;
        await poamMilestoneService.deletePoamMilestone(poamId, milestoneId, req);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}