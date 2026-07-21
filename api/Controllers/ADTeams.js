/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const adTeamsService = require('../Services/adTeamsService');
const { sendError } = require('../utils/respond');

module.exports.getADTeamsList = async function getADTeamsList(_req, res) {
    try {
        const adTeams = await adTeamsService.getADTeamsList();
        res.status(200).json(adTeams);
    } catch (error) {
        sendError(res, error);
    }
};
