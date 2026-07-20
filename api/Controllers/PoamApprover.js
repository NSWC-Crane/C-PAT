/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamApproverService = require('../Services/poamApproverService');
const { sendError } = require('../utils/respond');

module.exports.getPoamApprovers = async function getPoamApprovers(req, res) {
    try {
        const poamApprovers = await poamApproverService.getPoamApprovers(req);
        res.status(200).json(poamApprovers);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req, res) {
    try {
        const poamApprovers = await poamApproverService.getPoamApproversByCollection(req);
        res.status(200).json(poamApprovers);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamApprover = async function postPoamApprover(req, res) {
    try {
        const poamApprover = await poamApproverService.postPoamApprover(req);
        res.status(201).json(poamApprover);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putPoamApprover = async function putPoamApprover(req, res) {
    try {
        const poamApprover = await poamApproverService.putPoamApprover(req);
        res.status(200).json(poamApprover);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamApprover = async function deletePoamApprover(req, res) {
    try {
        await poamApproverService.deletePoamApprover(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
