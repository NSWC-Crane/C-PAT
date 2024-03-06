/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

'use strict';
const dbUtils = require('./utils');

exports.getPoamExtension = async function (poamId) {
    let connection;
    try {
        connection = await dbUtils.pool.getConnection();
        let sql = "SELECT poamId, extensionTimeAllowed, extensionJustification, scheduledCompletionDate FROM poamtracking.poam WHERE poamId = ?";
        let [poamExtensions] = await connection.query(sql, [poamId]);

        return poamExtensions;

    } catch (error) {
        console.error("Error in getPoamExtension:", error);
        throw error;
    } finally {
        if (connection) await connection.release();
    }
};

exports.putPoamExtension = async function (extensionData) {
    let connection = await dbUtils.pool.getConnection();
    let sql = "UPDATE poamtracking.poam SET extensionTimeAllowed = ?, extensionJustification = ? WHERE poamId = ?";
    await connection.query(sql, [extensionData.extensionTimeAllowed, extensionData.extensionJustification, extensionData.poamId]);
    await connection.release();
    return extensionData;
};

exports.deletePoamExtension = async function ({ poamId }) {
    let connection = await dbUtils.pool.getConnection();
    let sql = "UPDATE poamtracking.poam SET extensionTimeAllowed = '', extensionJustification = '' WHERE poamId = ?";
    await connection.query(sql, [poamId]);
    await connection.release();
};
