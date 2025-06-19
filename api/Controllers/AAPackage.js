/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const aaPackageService = require('../Services/aaPackageService');

module.exports.getAAPackages = async function getAAPackages(req, res, next) {
    try {
        const aaPackages = await aaPackageService.getAAPackages(req, res, next);
        res.status(200).json(aaPackages);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.getAAPackage = async function getAAPackage(req, res, next) {
    try {
        const aaPackage = await aaPackageService.getAAPackage(req, res, next);
        res.status(200).json(aaPackage);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.postAAPackage = async function postAAPackage(req, res, next) {
    try {
        const aaPackage = await aaPackageService.postAAPackage(req, res, next);
        res.status(201).json(aaPackage);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.putAAPackage = async function putAAPackage(req, res, next) {
    try {
        const aaPackage = await aaPackageService.putAAPackage(req, res, next);
        res.status(200).json(aaPackage);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteAAPackage = async function deleteAAPackage(req, res, next) {
    try {
        await aaPackageService.deleteAAPackage(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};
