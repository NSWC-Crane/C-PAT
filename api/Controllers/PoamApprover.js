/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const poamApproverService = require('../Services/poamApproverService')

module.exports.getPoamApprovers = async function getPoamApprovers(req, res, next) {
    try {
        const poamApprovers = await poamApproverService.getPoamApprovers(req, res, next);
        res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req, res, next) {
    try {
        const poamApprovers = await poamApproverService.getPoamApproversByCollection(req, res, next);
        res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.postPoamApprover = async function postPoamApprover(req, res, next) {
    try {
        const poamApprover = await poamApproverService.postPoamApprover(req, res, next);
        if (poamApprover === null) {
            res.status(400).json({ error: 'Failed to create Poam Approver' });
        } else {
            res.status(201).json(poamApprover);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.putPoamApprover = async function putPoamApprover(req, res, next) {
    try {
        const poamApprover = await poamApproverService.putPoamApprover(req, res, next);
        if (poamApprover === null) {
            res.status(400).json({ error: 'Failed to update Poam Approver' });
        } else {
            res.status(200).json(poamApprover);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.deletePoamApprover = async function deletePoamApprover(req, res, next) {
    try {
        await poamApproverService.deletePoamApprover(req, res, next);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
