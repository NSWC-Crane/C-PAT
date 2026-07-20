/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamLogService = require('../Services/poamLogService');
const { sendError } = require('../utils/respond');

module.exports.getPoamLogByPoamId = async function getPoamLogByPoamId(req, res) {
    try {
        const poamLog = await poamLogService.getPoamLogByPoamId(req.params.poamId);

        res.status(200).json(poamLog);
    } catch (error) {
        sendError(res, error);
    }
};
