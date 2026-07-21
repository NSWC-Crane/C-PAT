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
const { sendError } = require('../utils/respond');

module.exports.getAAPackages = async function getAAPackages(_req, res) {
    try {
        const aaPackages = await aaPackageService.getAAPackages();
        res.status(200).json(aaPackages);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getAAPackage = async function getAAPackage(req, res) {
    try {
        const aaPackage = await aaPackageService.getAAPackage(req);
        res.status(200).json(aaPackage);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postAAPackage = async function postAAPackage(req, res) {
    try {
        const aaPackage = await aaPackageService.postAAPackage(req);
        res.status(201).json(aaPackage);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putAAPackage = async function putAAPackage(req, res) {
    try {
        const aaPackage = await aaPackageService.putAAPackage(req);
        res.status(200).json(aaPackage);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteAAPackage = async function deleteAAPackage(req, res) {
    try {
        await aaPackageService.deleteAAPackage(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
