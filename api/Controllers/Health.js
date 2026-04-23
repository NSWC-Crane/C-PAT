/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const healthService = require('../Services/healthService');

module.exports.getUptimeStatus = async function getUptimeStatus(req, res, next) {
    try {
        const status = await healthService.getUptimeStatus();
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
};
