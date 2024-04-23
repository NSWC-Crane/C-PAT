/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and ExtensionMilestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamExtensionMilestoneService = require('../Services/mysql/poamExtensionMilestoneService')

module.exports.getPoamExtensionMilestones = async function getPoamExtensionMilestones(req, res, next) {
    try {
        const { poamId } = req.params;
        var poamExtensionMilestones = await poamExtensionMilestoneService.getPoamExtensionMilestones(poamId);
        res.status(200).json(poamExtensionMilestones);
    } catch (error) {
        if (error.message === 'POAM ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.postPoamExtensionMilestone = async function postPoamExtensionMilestone(req, res, next) {
    try {
        const { poamId } = req.params;
        var poamExtensionMilestone = await poamExtensionMilestoneService.postPoamExtensionMilestone(poamId, req.body);
        res.status(201).json(poamExtensionMilestone);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.putPoamExtensionMilestone = async function putPoamExtensionMilestone(req, res, next) {
    try {
        const { poamId, ExtensionMilestoneId } = req.params;
        var poamExtensionMilestone = await poamExtensionMilestoneService.putPoamExtensionMilestone(poamId, ExtensionMilestoneId, req.body);
        res.status(200).json(poamExtensionMilestone);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}

module.exports.deletePoamExtensionMilestone = async function deletePoamExtensionMilestone(req, res, next) {
    try {
        const { poamId, ExtensionMilestoneId } = req.params;
        await poamExtensionMilestoneService.deletePoamExtensionMilestone(poamId, ExtensionMilestoneId, req.body);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
}