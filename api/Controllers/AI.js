/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const aiService = require('../Services/aiService');
const { sendError } = require('../utils/respond');

module.exports.generateMitigation = async function generateMitigation(req, res) {
    try {
        const response = await aiService.generateMitigation(req);

        res.status(200).json(response);
    } catch (error) {
        sendError(res, error);
    }
};
