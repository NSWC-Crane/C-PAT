/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const iavService = require('../Services/iavService');
const { sendError } = require('../utils/respond');

module.exports.getVramDataUpdatedDate = async function getVramDataUpdatedDate(_req, res) {
    try {
        const vramUpdatedDate = await iavService.getVramDataUpdatedDate();

        res.status(200).json(vramUpdatedDate);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getIAVTableData = async function getIAVTableData(_req, res) {
    try {
        const iavTableData = await iavService.getIAVTableData();

        res.status(200).json(iavTableData);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.mapIAVPluginIds = async function mapIAVPluginIds(req, res) {
    try {
        const result = await iavService.mapIAVPluginIds(req.body);

        res.status(200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getIAVPluginIds = async function getIAVPluginIds(_req, res) {
    try {
        const iavPluginIDs = await iavService.getIAVPluginIds();

        res.status(200).json(iavPluginIDs);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.getIAVInfoForPlugins = async function getIAVInfoForPlugins(req, res) {
    try {
        const iavInfo = await iavService.getIAVInfoForPlugins(req.body.pluginIDs);

        res.status(200).json(iavInfo);
    } catch (error) {
        sendError(res, error);
    }
};
