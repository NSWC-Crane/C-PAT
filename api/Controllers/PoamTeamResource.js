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
const SmError = require('../utils/error');

exports.getPoamTeamResources = async function getPoamTeamResources(_req, res) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResources();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.getPoamTeamResourcesByPoamId = async function getPoamTeamResourcesByPoamId(req, res) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResourcesByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.postPoamTeamResource = async function postPoamTeamResource(req, res) {
    try {
        const teamResource = await poamTeamResourceService.postPoamTeamResource(req);
        return res.status(201).json(teamResource);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.updatePoamTeamResource = async function updatePoamTeamResource(req, res) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResource(req);
        return res.status(200).json(teamResource);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.updatePoamTeamResourceStatus = async function updatePoamTeamResourceStatus(req, res) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResourceStatus(req);
        return res.status(200).json(teamResource);
    } catch (error) {
        if (error instanceof SmError.NotFoundError) {
            return res.status(404).json({ error: error.message, detail: error.detail });
        }
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};

exports.deletePoamTeamResource = async function deletePoamTeamResource(req, res) {
    try {
        await poamTeamResourceService.deletePoamTeamResource(req);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};
