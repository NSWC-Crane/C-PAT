/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const poamLogService = require('../Services/mysql/poamLogService')


module.exports.getPoamLogByPoamId = async function getPoamLogByPoamId(req, res, next) {
    try {
        var poamLog = await poamLogService.getPoamLogByPoamId(req, res, next);
        res.status(201).json(poamLog);
    } catch (error) {
        next(error);
    }
};