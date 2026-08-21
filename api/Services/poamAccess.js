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
const SmError = require('../utils/error');

const READ_ACCESS_LEVEL = 1;
const WRITE_ACCESS_LEVEL = 2;
const APPROVAL_ACCESS_LEVEL = 3;
const CAT_I_ACCESS_LEVEL = 4;
const ADMIN_ACCESS_LEVEL = Number.MAX_SAFE_INTEGER;

const CAT_I_SEVERITIES = new Set(['CAT I - Critical', 'CAT I - High']);

function approvalLevelForSeverity(...severities) {
    return severities.some(severity => CAT_I_SEVERITIES.has(severity)) ? CAT_I_ACCESS_LEVEL : APPROVAL_ACCESS_LEVEL;
}

async function resolvePoamAccessLevel(connection, req, poamId) {
    if (req.userObject.isAdmin) return ADMIN_ACCESS_LEVEL;

    const sql = `
        SELECT cp.accessLevel
        FROM ${config.database.schema}.collectionpermissions cp
        INNER JOIN ${config.database.schema}.poam p ON p.collectionId = cp.collectionId
        WHERE cp.userId = ? AND p.poamId = ?
    `;
    const [rows] = await connection.query(sql, [req.userObject.userId, poamId]);

    return rows.length > 0 ? rows[0].accessLevel : 0;
}

async function assertPoamAccessLevel(connection, req, poamId, minAccessLevel, message) {
    const accessLevel = await resolvePoamAccessLevel(connection, req, poamId);

    if (accessLevel < minAccessLevel) {
        throw new SmError.PrivilegeError(message);
    }

    return accessLevel;
}

async function resolveCollectionAccessLevel(connection, req, collectionId) {
    if (req.userObject.isAdmin) return ADMIN_ACCESS_LEVEL;

    const sql = `SELECT accessLevel FROM ${config.database.schema}.collectionpermissions WHERE userId = ? AND collectionId = ?`;
    const [rows] = await connection.query(sql, [req.userObject.userId, collectionId]);

    return rows.length > 0 ? rows[0].accessLevel : 0;
}

async function assertCollectionAccessLevel(connection, req, collectionId, minAccessLevel, message) {
    const accessLevel = await resolveCollectionAccessLevel(connection, req, collectionId);

    if (accessLevel < minAccessLevel) {
        throw new SmError.PrivilegeError(message);
    }

    return accessLevel;
}

function assertActingAsSelf(req, userId, message) {
    if (req.userObject.isAdmin) return;

    const requested = Number(userId);
    const caller = Number(req.userObject.userId);

    if (!Number.isInteger(requested) || requested <= 0 || requested !== caller) {
        throw new SmError.PrivilegeError(message);
    }
}

module.exports = {
    READ_ACCESS_LEVEL,
    WRITE_ACCESS_LEVEL,
    APPROVAL_ACCESS_LEVEL,
    CAT_I_ACCESS_LEVEL,
    ADMIN_ACCESS_LEVEL,
    CAT_I_SEVERITIES,
    approvalLevelForSeverity,
    resolvePoamAccessLevel,
    assertPoamAccessLevel,
    resolveCollectionAccessLevel,
    assertCollectionAccessLevel,
    assertActingAsSelf,
};
