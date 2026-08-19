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
const SmError = require('../utils/error');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

function normalizeBoolean(value) {
    if (value === null || value === undefined) return null;
    return value === 1 || value === true;
}

const CAT_I_SEVERITIES = new Set(['CAT I - Critical', 'CAT I - High']);
const POINT_AWARDING_STATUSES = new Set(['Approved', 'Rejected', 'False-Positive']);
const POSITIVE_REVIEW_REQUIREMENTS = {
    Approved: 'approval',
    'False-Positive': 'review',
};

function isPositiveReview(approvalStatus) {
    return Object.hasOwn(POSITIVE_REVIEW_REQUIREMENTS, approvalStatus);
}

async function insertNotification(connection, userId, title, message) {
    const sql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
    await connection.query(sql, [userId, title, message]);
}

async function getUserPoints(connection, userId) {
    const sql = `SELECT points FROM ${config.database.schema}.user WHERE userId = ?`;
    const [rows] = await connection.query(sql, [userId]);
    return rows.length > 0 ? rows[0].points : null;
}

async function getUserFullName(connection, userId) {
    const sql = `SELECT fullName FROM ${config.database.schema}.user WHERE userId = ?`;
    const [rows] = await connection.query(sql, [userId]);
    return rows[0] ? rows[0].fullName : 'Unknown User';
}

async function awardPoints(connection, userId, currentPoints, amount, title, message) {
    if (config.client.features.marketplaceDisabled || currentPoints === null) return;
    const sql = `UPDATE ${config.database.schema}.user SET points = ? WHERE userId = ?`;
    await connection.query(sql, [currentPoints + amount, userId]);
    await insertNotification(connection, userId, title, message);
}

async function setPoamStatus(connection, poamId, status) {
    const sql = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
    await connection.query(sql, [status, poamId]);
}

async function setPoamHqs(connection, poamId, hqs) {
    const sql = `UPDATE ${config.database.schema}.poam SET hqs = ? WHERE poamId = ?`;
    await connection.query(sql, [hqs, poamId]);
}

async function isNewOrChangedApproval(connection, poamId, userId, approvalStatus) {
    const sql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
    const [existingApproval] = await connection.query(sql, [poamId, userId]);
    if (existingApproval.length === 0) return true;
    return existingApproval[0].approvalStatus !== approvalStatus && POINT_AWARDING_STATUSES.has(approvalStatus);
}

async function awardApproverReviewPoints(connection, poamId, userId, isNewOrChanged) {
    if (!isNewOrChanged || config.client.features.marketplaceDisabled) return;
    const approverPoints = await getUserPoints(connection, userId);
    await awardPoints(
        connection,
        userId,
        approverPoints,
        10,
        'Points Awarded for POAM Review',
        `10 points have been added to your points balance for reviewing POAM ${poamId}.`
    );
}

async function getPoamForReview(connection, poamId) {
    const sql = `SELECT submitterId, rawSeverity, hqs, collectionId FROM ${config.database.schema}.poam WHERE poamId = ?`;
    const [rows] = await connection.query(sql, [poamId]);
    if (rows.length === 0) {
        throw new SmError.NotFoundError('POAM not found');
    }
    return rows[0];
}

async function applyHighQualitySubmission(connection, poamId, submitterId, currentHqs, requestedHqs) {
    const submitterPoints = await getUserPoints(connection, submitterId);
    const wasHighQuality = normalizeBoolean(currentHqs);
    const isHighQuality = normalizeBoolean(requestedHqs);

    if (!wasHighQuality && isHighQuality) {
        await awardPoints(
            connection,
            submitterId,
            submitterPoints,
            30,
            'High Quality Submission',
            `30 points have been added to your points balance for a High Quality submission on POAM ${poamId}.`
        );
        await setPoamHqs(connection, poamId, 1);
        return;
    }

    if (wasHighQuality && !isHighQuality) {
        await setPoamHqs(connection, poamId, 0);
        return;
    }

    await awardPoints(
        connection,
        submitterId,
        submitterPoints,
        15,
        'POAM Review Points',
        `15 points have been added to your points balance for review of POAM ${poamId}.`
    );
}

async function notifySubmitterOfReview(connection, poamId, submitterId, fullName, isHighQuality) {
    const message = isHighQuality
        ? `POAM ${poamId} has been reviewed and marked as High Quality by ${fullName}.`
        : `POAM ${poamId} has been reviewed by ${fullName}.`;
    await insertNotification(connection, submitterId, `POAM reviewed by ${fullName}`, message);
}

async function requestCatIApproval(connection, poamId, catIApprovers) {
    for (const approver of catIApprovers) {
        await insertNotification(
            connection,
            approver.userId,
            'CAT-I POAM Pending Review',
            `POAM ${poamId} has been reviewed and is pending CAT-I Approver review.`
        );
    }
    await setPoamStatus(connection, poamId, 'Pending CAT-I Approval');
}

async function applyPoamStatusChange(connection, poamId, approvalStatus, reviewerId, poam) {
    if (approvalStatus === 'Rejected') {
        await setPoamStatus(connection, poamId, 'Rejected');
        await insertNotification(
            connection,
            poam.submitterId,
            'POAM Rejected',
            `POAM ${poamId} has been rejected. Please review the comments and make necessary changes.`
        );
        return;
    }

    if (!isPositiveReview(approvalStatus)) return;

    const permissionSql = `SELECT userId FROM ${config.database.schema}.collectionpermissions WHERE collectionId = ? AND accessLevel = 4`;
    const [catIApprovers] = await connection.query(permissionSql, [poam.collectionId]);
    const requiresCatIReview = CAT_I_SEVERITIES.has(poam.rawSeverity) && !catIApprovers.some(p => p.userId === reviewerId);

    if (requiresCatIReview) {
        await requestCatIApproval(connection, poamId, catIApprovers);
        return;
    }

    await setPoamStatus(connection, poamId, approvalStatus);
    await insertNotification(
        connection,
        poam.submitterId,
        `POAM status changed to ${approvalStatus}`,
        `POAM ${poamId} has met the ${POSITIVE_REVIEW_REQUIREMENTS[approvalStatus]} requirements. POAM Status has changed to ${approvalStatus}.`
    );
}

module.exports.getPoamApprovers = async function getPoamApprovers(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.email
            FROM ${config.database.schema}.poamapprovers T1
            INNER JOIN ${config.database.schema}.user T2 ON T1.userId = T2.userId
            WHERE poamId = ?;
        `;
        let [rows] = await connection.query(sql, [req.params.poamId]);
        const poamApprovers = rows.map(row => ({
            ...row,
            approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
        }));
        return poamApprovers;
    });
};

module.exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT T1.*, T2.firstName, T2.lastName, T2.fullName, T2.email
            FROM ${config.database.schema}.poamapprovers T1
            INNER JOIN ${config.database.schema}.user T2 ON T1.userId = T2.userId
            INNER JOIN ${config.database.schema}.poam T3 ON T1.poamId = T3.poamId
            WHERE T3.collectionId = ?
        `;
        let [rows] = await connection.query(sql, [req.params.collectionId]);
        const poamApprovers = rows.map(row => ({
            ...row,
            approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
        }));
        return poamApprovers;
    });
};

module.exports.postPoamApprover = async function postPoamApprover(req) {
    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    try {
        return await withConnection(async connection => {
            let sql_query = `
                INSERT INTO ${config.database.schema}.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.query(sql_query, [req.body.poamId, req.body.userId, req.body.approvalStatus, req.body.approvedDate, req.body.comments]);

            let userSql = `SELECT fullName FROM ${config.database.schema}.user WHERE userId = ?`;
            const [user] = await connection.query(userSql, [req.body.userId]);
            const fullName = user[0] ? user[0].fullName : 'Unknown User';
            let action = `${fullName} was added to the Approver List.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            const notification = {
                title: 'Added to Approver List',
                message: `You have been assigned as an approver for POAM ${req.body.poamId}.`,
                userId: req.body.userId,
            };
            const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
            await connection.query(notificationSql, [req.body.userId, notification.title, notification.message]);

            let sql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
            let [row] = await connection.query(sql, [req.body.poamId, req.body.userId]);
            const poamApprover = row.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }))[0];

            return poamApprover;
        });
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            throw error;
        }
        return await withConnection(async connection => {
            let fetchSql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
            const [existingApprover] = await connection.query(fetchSql, [req.body.poamId, req.body.userId]);
            return existingApprover[0];
        });
    }
};

module.exports.putPoamApprover = async function putPoamApprover(req) {
    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    return await withConnection(async connection => {
        await connection.beginTransaction();

        try {
            const { poamId, userId, approvalStatus } = req.body;

            const isNewOrChanged = await isNewOrChangedApproval(connection, poamId, userId, approvalStatus);
            await awardApproverReviewPoints(connection, poamId, userId, isNewOrChanged);

            let sql_query = `
                    UPDATE ${config.database.schema}.poamapprovers
                    SET approvalStatus = ?, approvedDate = ?, comments = ?
                    WHERE poamId = ? AND userId = ?;
                `;
            await connection.query(sql_query, [approvalStatus, req.body.approvedDate, req.body.comments, poamId, userId]);

            const fullName = await getUserFullName(connection, userId);
            const poam = await getPoamForReview(connection, poamId);

            if (isPositiveReview(approvalStatus)) {
                await applyHighQualitySubmission(connection, poamId, poam.submitterId, poam.hqs, req.body.hqs);
                await notifySubmitterOfReview(connection, poamId, poam.submitterId, fullName, normalizeBoolean(req.body.hqs));
            }

            let action = `POAM ${poamId} has been marked as ${approvalStatus.toLowerCase()} by ${fullName}. Approver Comments: ${req.body.comments}.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [poamId, action, req.userObject.userId]);

            await applyPoamStatusChange(connection, poamId, approvalStatus, req.userObject.userId, poam);

            let sql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
            let [row] = await connection.query(sql, [poamId, userId]);
            const poamApprover = row.map(row => ({
                ...row,
                approvedDate: row.approvedDate ? row.approvedDate.toISOString() : null,
            }))[0];

            await connection.commit();
            return poamApprover;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
};

module.exports.deletePoamApprover = async function deletePoamApprover(req) {
    return await withConnection(async connection => {
        let sql = `DELETE FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
        await connection.query(sql, [req.params.poamId, req.params.userId]);

        if (req.userObject.userId) {
            const fullName = await getUserFullName(connection, req.params.userId);
            let action = `${fullName} was removed from the Approver List.`;
            let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

            const notification = {
                title: 'Removed from POAM Approver list',
                message: `You have been removed from the Approver list for POAM ${req.params.poamId}.`,
                userId: req.params.userId,
            };
            const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
            await connection.query(notificationSql, [req.params.userId, notification.title, notification.message]);
        }
        return { delete: 'Success' };
    });
};
