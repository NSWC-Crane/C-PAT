/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamTeamResourceService = require('../Services/poamTeamResourceService');
const { sendError } = require('../utils/respond');

exports.getPoamTeamResources = async function getPoamTeamResources(_req, res) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResources();

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

exports.getPoamTeamResourcesByPoamId = async function getPoamTeamResourcesByPoamId(req, res) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResourcesByPoamId(req.params.poamId);

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

exports.postPoamTeamResource = async function postPoamTeamResource(req, res) {
    try {
        const teamResource = await poamTeamResourceService.postPoamTeamResource(req);

        res.status(201).json(teamResource);
    } catch (error) {
        sendError(res, error);
    }
};

exports.updatePoamTeamResource = async function updatePoamTeamResource(req, res) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResource(req);

        res.status(200).json(teamResource);
    } catch (error) {
        sendError(res, error);
    }
};

exports.updatePoamTeamResourceStatus = async function updatePoamTeamResourceStatus(req, res) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResourceStatus(req);

        res.status(200).json(teamResource);
    } catch (error) {
        sendError(res, error);
    }
};

exports.deletePoamTeamResource = async function deletePoamTeamResource(req, res) {
    try {
        await poamTeamResourceService.deletePoamTeamResource(req);

        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
