/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const appConfigurationService = require('../Services/appConfigurationService');
const { sendError } = require('../utils/respond');

module.exports.getAppConfiguration = async function getAppConfiguration(_req, res) {
    try {
        const appConfiguration = await appConfigurationService.getAppConfiguration();
        res.status(200).json(appConfiguration);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.putAppConfiguration = async function putAppConfiguration(req, res) {
    try {
        const appConfiguration = await appConfigurationService.putAppConfiguration(req);
        res.status(200).json(appConfiguration);
    } catch (error) {
        sendError(res, error);
    }
};
