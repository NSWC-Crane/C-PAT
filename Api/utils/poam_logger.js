/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

// Ensure no other code will write to the console
const _log = console.log
exports.writeLog = async function writeLog(level, component, type, modifiedById, modifiedByName, data) {
    // _log({message: "writeLog (Service) Method called successfully"})
    try {
        const date = new Date().toISOString()
        _log(JSON.stringify({date, level, component, type, modifiedById, modifiedByName, data}))  
      }
      catch (e) {
        const date = new Date().toISOString()
        _log(JSON.stringify({date, level:1, component:'logger', type:'error', data: { message: e.message, stack: e.stack}}))  
      }
}
