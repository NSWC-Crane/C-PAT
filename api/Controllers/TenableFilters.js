/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const tenableFilterService = require('../Services/tenableFilterService');
const { sendError } = require('../utils/respond');

module.exports.getTenableFilters = async function getTenableFilters(req, res) {
    try {
        const tenableFilters = await tenableFilterService.getTenableFilters(req);
        res.status(200).json(tenableFilters);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getTenableFilter = async function getTenableFilter(req, res) {
    try {
        const tenableFilter = await tenableFilterService.getTenableFilter(req);
        res.status(200).json(tenableFilter);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postTenableFilter = async function postTenableFilter(req, res) {
    try {
        const tenableFilter = await tenableFilterService.postTenableFilter(req);
        res.status(201).json(tenableFilter);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putTenableFilter = async function putTenableFilter(req, res) {
    try {
        const tenableFilter = await tenableFilterService.putTenableFilter(req);
        res.status(200).json(tenableFilter);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteTenableFilter = async function deleteTenableFilter(req, res) {
    try {
        await tenableFilterService.deleteTenableFilter(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
