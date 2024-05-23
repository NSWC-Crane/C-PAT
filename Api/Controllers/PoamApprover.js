/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamApproverService = require('../Services/mysql/poamApproverService')

module.exports.getPoamApprovers = async function getPoamApprovers(req, res, next) {
    try {
        var poamApprovers = await poamApproverService.getPoamApprovers(req, res, next);
        res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req, res, next) {
    try {
        var poamApprovers = await poamApproverService.getPoamApproversByCollection(req, res, next);
        res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.getPoamApproversByCollectionUser = async function getPoamApproversByCollectionUser(req, res, next) {
    try {
        var poamApprovers = await poamApproverService.getPoamApproversByCollectionUser(req, res, next);
            res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.getPoamApproversByUserId = async function getPoamApproversByUserId(req, res, next) {
    try {
        var poamApprovers = await poamApproverService.getPoamApproversByUserId(req, res, next);
        res.status(200).json(poamApprovers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.postPoamApprover = async function postPoamApprover(req, res, next) {
    try {
        var poamApprover = await poamApproverService.postPoamApprover(req, res, next);
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
        var poamApprover = await poamApproverService.putPoamApprover(req, res, next);
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
