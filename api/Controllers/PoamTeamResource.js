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

exports.getPoamTeamResources = async function getPoamTeamResources(req, res, next) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResources();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while retrieving POAM team resources' });
    }
};

exports.getPoamTeamResourcesByPoamId = async function getPoamTeamResourcesByPoamId(req, res, next) {
    try {
        const result = await poamTeamResourceService.getPoamTeamResourcesByPoamId(req.params.poamId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while retrieving POAM team resources by poamId' });
    }
};

exports.postPoamTeamResource = async function postPoamTeamResource(req, res, next) {
    try {
        const teamResource = await poamTeamResourceService.postPoamTeamResource(req, res, next);
        return res.status(201).json(teamResource);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while entering the POAM team resource' });
    }
};

exports.updatePoamTeamResource = async function updatePoamTeamResource(req, res, next) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResource(req, res, next);
        return res.status(200).json(teamResource);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating the POAM team resource' });
    }
};

exports.updatePoamTeamResourceStatus = async function updatePoamTeamResourceStatus(req, res, next) {
    try {
        const teamResource = await poamTeamResourceService.updatePoamTeamResourceStatus(req, res, next);
        return res.status(200).json(teamResource);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating the POAM team resource status' });
    }
};

exports.deletePoamTeamResource = async function deletePoamTeamResource(req, res, next) {
    try {
        await poamTeamResourceService.deletePoamTeamResource(req, res, next);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while deleting the POAM team resource' });
    }
};
