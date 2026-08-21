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
const dbUtils = require('./utils');
const logger = require('../utils/logger');
const SmError = require('../utils/error');
const { getPoamApproverRecipients } = require('./poamApproverRecipients');
const { APPROVAL_ACCESS_LEVEL, READ_ACCESS_LEVEL, WRITE_ACCESS_LEVEL, approvalLevelForSeverity, assertPoamAccessLevel } = require('./poamAccess');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

const PARTIAL_UPDATE_FIELDS = ['extensionJustification', 'mitigations', 'requiredResources', 'residualRisk', 'likelihood', 'localImpact', 'impactDescription'];
const APPROVAL_STATUSES = new Set(['Approved', 'Rejected']);
const EXTENSION_STATUSES = new Set(['Extension Requested', 'Approved', 'Rejected']);
const DEADLINE_NOTIFICATION_TYPES = ['30day', '7day', '1day', 'expired'];
const MAX_LOG_ACTION_LENGTH = 2000;
const MAX_LOGGED_JUSTIFICATION_LENGTH = 500;

function truncate(value, max) {
    if (typeof value !== 'string' || value.length <= max) {
        return value;
    }

    return value.slice(0, max - 1) + '…';
}

function buildExtensionUpdate(body) {
    const assignments = ['extensionDays = COALESCE(?, extensionDays)', 'status = COALESCE(?, status)'];
    const params = [body.extensionDays ?? null, body.status || null];

    for (const field of PARTIAL_UPDATE_FIELDS) {
        if (Object.hasOwn(body, field)) {
            assignments.push(`${field} = ?`);
            params.push(body[field] ?? null);
        }
    }

    params.push(body.poamId);

    return { sql: `UPDATE ${config.database.schema}.poam SET ${assignments.join(', ')} WHERE poamId = ?`, params };
}

async function extensionRequestContext(connection, poamId, extensionDays) {
    const sql = `
        SELECT
            DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today,
            DATE_FORMAT(CURDATE() + INTERVAL ? DAY, '%Y-%m-%d') AS expectedDeadline,
            h.extensionDays AS latestDays,
            DATE_FORMAT(h.extensionRequestedDate, '%Y-%m-%d') AS latestDate
        FROM (SELECT 1) anchor
        LEFT JOIN ${config.database.schema}.poamextensionhistory h
            ON h.extensionHistoryId = (SELECT MAX(extensionHistoryId) FROM ${config.database.schema}.poamextensionhistory WHERE poamId = ?)
    `;
    const [[context]] = await connection.query(sql, [extensionDays, poamId]);

    return context;
}

async function notifyPoamApprovers(connection, poamId, title, message) {
    const approvers = await getPoamApproverRecipients(connection, poamId);

    if (approvers.length === 0) {
        logger.writeWarn('poamExtensionService', 'notifyPoamApprovers', {
            poamId,
            title,
            reason: 'No approver holds accessLevel 3 or higher on the POAM collection; no notification was sent',
        });

        return;
    }

    const values = approvers.map(approver => [approver.userId, title, message]);
    const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES ?`;

    await connection.query(notificationSql, [values]);
}

function resolveExtensionPlan(body, existingPoam) {
    if (body.status != null && body.status !== existingPoam.status && !EXTENSION_STATUSES.has(body.status)) {
        throw new SmError.ClientError('status must be "Extension Requested", "Approved", "Rejected", or the POAM\'s current status');
    }

    const requestedDays = body.extensionDays ?? null;
    const storedDays = existingPoam.extensionDays ?? 0;
    const effectiveDays = requestedDays ?? storedDays;
    const explicitReanchor = body.reanchorDeadline === true;
    const legacyReanchor = body.reanchorDeadline === undefined && body.status === 'Extension Requested';

    if (explicitReanchor && effectiveDays <= 0) {
        throw new SmError.ClientError('reanchorDeadline requires extensionDays greater than zero');
    }

    if (body.reanchorDeadline === false && requestedDays > 0 && requestedDays !== storedDays) {
        throw new SmError.ClientError(
            'extensionDays cannot be changed while reanchorDeadline is false; reload the POAM to pick up its current extension and try again'
        );
    }

    return { storedDays, effectiveDays, reanchorRequested: (explicitReanchor || legacyReanchor) && effectiveDays > 0 };
}

async function clearDeadlineNotificationTracker(connection, poamId) {
    const sql = `DELETE FROM ${config.database.schema}.poam_notification_tracker WHERE poamId = ? AND notificationType IN (?)`;

    await connection.query(sql, [poamId, DEADLINE_NOTIFICATION_TYPES]);
}

async function applyDeadlineChange(connection, poamId, plan, noOpRerequest, existingPoam) {
    if (plan.reanchorRequested) {
        await connection.query(`UPDATE ${config.database.schema}.poam SET extensionDeadline = (CURDATE() + INTERVAL ? DAY) WHERE poamId = ?`, [
            plan.effectiveDays,
            poamId,
        ]);

        if (noOpRerequest) {
            return;
        }

        await connection.query(
            `INSERT INTO ${config.database.schema}.poamextensionhistory (poamId, extensionRequestedDate, extensionDays) VALUES (?, CURDATE(), ?)`,
            [poamId, plan.effectiveDays]
        );
        await clearDeadlineNotificationTracker(connection, poamId);
        await notifyPoamApprovers(connection, poamId, 'POAM Extension Requested', `POAM ${poamId} has an extension request pending Approver review.`);

        return;
    }

    if (plan.effectiveDays <= 0 && existingPoam.extensionDeadline) {
        await connection.query(`UPDATE ${config.database.schema}.poam SET extensionDeadline = NULL WHERE poamId = ?`, [poamId]);
        await clearDeadlineNotificationTracker(connection, poamId);
    }
}

function buildExtensionLogAction(updatedPoam, plan, existingPoam, deadlineDisplay, noOpRerequest) {
    let action = `POAM Updated. Status: ${updatedPoam.status}`;

    if (plan.reanchorRequested && !noOpRerequest) {
        const loggedJustification = truncate(updatedPoam.extensionJustification, MAX_LOGGED_JUSTIFICATION_LENGTH);

        action += `<br>Extension time requested: ${plan.effectiveDays} days<br>Extension Justification: ${loggedJustification}<br>Deadline with Extension: ${deadlineDisplay}`;
    }

    if (plan.effectiveDays <= 0 && plan.storedDays > 0) {
        action += `<br>Extension cleared: extension days set to 0 and the extension deadline removed (previously ${plan.storedDays} days, deadline ${existingPoam.extensionDeadlineDisplay || 'none'}).`;
    }

    return truncate(action, MAX_LOG_ACTION_LENGTH);
}

async function assertExtensionAccess(connection, req, poamId, minAccessLevel) {
    return await assertPoamAccessLevel(connection, req, poamId, minAccessLevel, 'User does not have permission to modify this POAM extension');
}

function assertApprovalAccess(accessLevel, requestedStatus, existingPoam) {
    if (!APPROVAL_STATUSES.has(requestedStatus) || requestedStatus === existingPoam.status) {
        return;
    }

    const requiredAccessLevel = requestedStatus === 'Approved' ? approvalLevelForSeverity(existingPoam.rawSeverity) : APPROVAL_ACCESS_LEVEL;

    if (accessLevel < requiredAccessLevel) {
        throw new SmError.PrivilegeError(
            requiredAccessLevel > APPROVAL_ACCESS_LEVEL
                ? 'A CAT-I POAM extension may only be approved by a CAT-I Approver'
                : 'User does not have permission to approve or reject this POAM extension'
        );
    }
}

module.exports.getPoamExtension = async function (req) {
    const poamId = req.params.poamId;

    return withConnection(async connection => {
        const sql = `
            SELECT
                poamId,
                extensionDays,
                DATE_FORMAT(extensionDeadline, '%Y-%m-%d') AS extensionDeadline,
                extensionJustification,
                DATE_FORMAT(scheduledCompletionDate, '%Y-%m-%d') AS scheduledCompletionDate,
                DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS serverToday
            FROM ${config.database.schema}.poam
            WHERE poamId = ?
        `;
        const [poamExtensions] = await connection.query(sql, [poamId]);

        if (poamExtensions.length === 0) {
            return poamExtensions;
        }

        await assertExtensionAccess(connection, req, poamId, READ_ACCESS_LEVEL);

        const historySql = `
            SELECT extensionHistoryId, DATE_FORMAT(extensionRequestedDate, '%Y-%m-%d') AS extensionRequestedDate, extensionDays
            FROM ${config.database.schema}.poamextensionhistory
            WHERE poamId = ?
            ORDER BY extensionRequestedDate ASC, extensionHistoryId ASC
        `;
        const [history] = await connection.query(historySql, [poamId]);

        poamExtensions[0].extensionHistory = history;

        return poamExtensions;
    });
};

module.exports.putPoamExtension = async function (req) {
    if (!req.body.poamId) {
        throw new SmError.ClientError('poamId is required');
    }

    const accessLevel = await withConnection(async connection => await assertExtensionAccess(connection, req, req.body.poamId, WRITE_ACCESS_LEVEL));

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                const existingSql = `SELECT extensionDays, status, rawSeverity, DATE_FORMAT(extensionDeadline, '%Y-%m-%d') AS extensionDeadline, DATE_FORMAT(extensionDeadline, '%c/%e/%Y') AS extensionDeadlineDisplay FROM ${config.database.schema}.poam WHERE poamId = ? FOR UPDATE`;
                const [[existingPoam]] = await connection.query(existingSql, [req.body.poamId]);

                if (!existingPoam) {
                    throw new SmError.NotFoundError('POAM not found');
                }

                assertApprovalAccess(accessLevel, req.body.status, existingPoam);

                const plan = resolveExtensionPlan(req.body, existingPoam);

                let noOpRerequest = false;

                if (plan.reanchorRequested) {
                    const context = await extensionRequestContext(connection, req.body.poamId, plan.effectiveDays);

                    noOpRerequest =
                        context.latestDays === plan.effectiveDays &&
                        context.latestDate === context.today &&
                        existingPoam.status === 'Extension Requested' &&
                        existingPoam.extensionDeadline === context.expectedDeadline;
                }

                const { sql, params } = buildExtensionUpdate(req.body);
                await connection.query(sql, params);

                await applyDeadlineChange(connection, req.body.poamId, plan, noOpRerequest, existingPoam);

                const selectSql = `SELECT
                    poamId,
                    extensionDays,
                    DATE_FORMAT(extensionDeadline, '%Y-%m-%d') AS extensionDeadline,
                    DATE_FORMAT(extensionDeadline, '%c/%e/%Y') AS extensionDeadlineDisplay,
                    extensionJustification,
                    mitigations,
                    requiredResources,
                    residualRisk,
                    likelihood,
                    localImpact,
                    impactDescription,
                    status
                    FROM ${config.database.schema}.poam
                    WHERE poamId = ?`;

                const [[updatedRow]] = await connection.query(selectSql, [req.body.poamId]);

                if (!updatedRow) {
                    throw new SmError.NotFoundError('POAM not found');
                }

                const { extensionDeadlineDisplay, ...updatedPoam } = updatedRow;
                const action = buildExtensionLogAction(updatedPoam, plan, existingPoam, extensionDeadlineDisplay, noOpRerequest);

                const logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

                return updatedPoam;
            })
    );
};

module.exports.deletePoamExtension = async function (req) {
    const poamId = req.params.poamId;

    await withConnection(async connection => {
        await assertExtensionAccess(connection, req, poamId, WRITE_ACCESS_LEVEL);
    });

    return await dbUtils.retryOnDeadlock(
        async () =>
            await dbUtils.withTransaction(async connection => {
                const existingSql = `SELECT status, extensionDeadline FROM ${config.database.schema}.poam WHERE poamId = ? FOR UPDATE`;
                const [[existingPoam]] = await connection.query(existingSql, [poamId]);

                if (!existingPoam) {
                    throw new SmError.NotFoundError('POAM not found');
                }

                const revertStatus = existingPoam.status === 'Extension Requested';
                const assignments = ['extensionDays = 0', 'extensionJustification = NULL', 'extensionDeadline = NULL'];
                const params = [];

                if (revertStatus) {
                    assignments.push('status = ?');
                    params.push('Submitted');
                }

                params.push(poamId);

                const sql = `UPDATE ${config.database.schema}.poam SET ${assignments.join(', ')} WHERE poamId = ?`;
                await connection.query(sql, params);

                if (existingPoam.extensionDeadline) {
                    await clearDeadlineNotificationTracker(connection, poamId);
                }

                let action = 'POAM extension removed. Extension days, justification, and extension deadline cleared.';

                if (revertStatus) {
                    action += `<br>POAM Status changed from Extension Requested to Submitted. The POAM re-enters standard expiry processing.`;

                    await notifyPoamApprovers(connection, poamId, 'POAM Pending Approval', `POAM ${poamId} has been submitted and is pending Approver review.`);
                }

                const logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [poamId, truncate(action, MAX_LOG_ACTION_LENGTH), req.userObject.userId]);
            })
    );
};
