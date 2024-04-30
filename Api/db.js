/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the 
! Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const config = require('./utils/config');

module.exports = {
    initializeDatabase: async () => {
        const db = require(`./Services/${config.database.type}/utils`);
        try {
            await db.initializeDatabase();
        } catch (e) {
            console.log(e);
        }
    },
};