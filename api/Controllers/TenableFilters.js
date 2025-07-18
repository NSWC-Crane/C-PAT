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

module.exports.getTenableFilters = async function getTenableFilters(req, res, next) {
    try {
        const tenableFilters = await tenableFilterService.getTenableFilters(req, res, next);
        res.status(200).json(tenableFilters);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getTenableFilter = async function getTenableFilter(req, res, next) {
    try {
        const tenableFilter = await tenableFilterService.getTenableFilter(req, res, next);
        res.status(200).json(tenableFilter);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postTenableFilter = async function postTenableFilter(req, res, next) {
    try {
        const tenableFilter = await tenableFilterService.postTenableFilter(req, res, next);
        res.status(201).json(tenableFilter);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putTenableFilter = async function putTenableFilter(req, res, next) {
    try {
        const tenableFilter = await tenableFilterService.putTenableFilter(req, res, next);
        res.status(200).json(tenableFilter);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteTenableFilter = async function deleteTenableFilter(req, res, next) {
    try {
        await tenableFilterService.deleteTenableFilter(req);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.errors || error.message });
        }
    }
};
