/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const config = require('../utils/config');

module.exports.getPoamApproverRecipients = async function (connection, poamId) {
    const sql = `
        SELECT DISTINCT pa.userId
        FROM ${config.database.schema}.poamapprovers pa
        INNER JOIN ${config.database.schema}.poam p ON p.poamId = pa.poamId
        INNER JOIN ${config.database.schema}.collectionpermissions cp ON cp.userId = pa.userId AND cp.collectionId = p.collectionId
        WHERE pa.poamId = ? AND cp.accessLevel >= 3
    `;
    const [recipients] = await connection.query(sql, [poamId]);

    return recipients;
};
