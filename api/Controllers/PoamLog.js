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
const SmError = require('../utils/error');

module.exports.getPoamLogByPoamId = async function getPoamLogByPoamId(req, res) {
    try {
        const { poamId } = req.params;
        const poamLog = await poamLogService.getPoamLogByPoamId(poamId);
        res.status(200).json(poamLog);
    } catch (error) {
        if (error instanceof SmError.ClientError) {
            res.status(400).json({ error: error.message, detail: error.detail });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};
