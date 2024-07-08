/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamLogService = require('../Services/poamLogService')

module.exports.getPoamLogByPoamId = async function getPoamLogByPoamId(req, res, next) {
    try {
        const { poamId } = req.params;
        const poamLog = await poamLogService.getPoamLogByPoamId(poamId);
        res.status(200).json(poamLog);
    } catch (error) {
        if (error.message === 'POAM ID is required') {
            res.status(400).json({ error: 'Validation Error', detail: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};