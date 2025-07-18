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
const mysql = require('mysql2');
const usersService = require('./usersService');
const marketplaceService = require('./marketplaceService');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

function normalizeBoolean(value) {
    if (value === null || value === undefined) return null;
    return value === 1 || value === true;
}

exports.getPoamApprovers = async function getPoamApprovers(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    }

    try {
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
    } catch (error) {
        return { error: error.message };
    }
};

exports.getPoamApproversByCollection = async function getPoamApproversByCollection(req, res, next) {
    if (!req.params.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            },
        });
    }

    try {
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
    } catch (error) {
        return { error: error.message };
    }
};

exports.postPoamApprover = async function postPoamApprover(req, res, next) {
    if (!req.body.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    }
    if (!req.body.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            },
        });
    }

    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    try {
        return await withConnection(async connection => {
            let sql_query = `
                INSERT INTO ${config.database.schema}.poamapprovers (poamId, userId, approvalStatus, approvedDate, comments)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.query(sql_query, [
                req.body.poamId,
                req.body.userId,
                req.body.approvalStatus,
                req.body.approvedDate,
                req.body.comments,
            ]);

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
        if (error.code === 'ER_DUP_ENTRY') {
            return await withConnection(async connection => {
                let fetchSql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
                const [existingApprover] = await connection.query(fetchSql, [req.body.poamId, req.body.userId]);
                return existingApprover[0];
            });
        } else {
            return { error: error.message };
        }
    }
};

exports.putPoamApprover = async function putPoamApprover(req, res, next) {
    if (!req.body.poamId || !req.body.userId) {
        return next({
            status: 400,
            errors: {
                message: 'poamId and userId are required',
            },
        });
    }
    if (!req.body.approvalStatus) req.body.approvalStatus = 'Not Reviewed';
    if (!req.body.approvedDate) req.body.approvedDate = null;
    if (!req.body.comments) req.body.comments = null;

    try {
        return await withConnection(async connection => {
            await connection.beginTransaction();

            try {
                let checkApprovalSql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
                const [existingApproval] = await connection.query(checkApprovalSql, [req.body.poamId, req.body.userId]);

                const isNewOrChangedApproval =
                    existingApproval.length === 0 ||
                    (existingApproval[0].approvalStatus !== req.body.approvalStatus &&
                        (req.body.approvalStatus === 'Approved' ||
                            req.body.approvalStatus === 'Rejected' ||
                            req.body.approvalStatus === 'False-Positive'));

                if (isNewOrChangedApproval && !config.client.features.marketplaceDisabled) {
                    const approverPoints = await marketplaceService.getUserPoints(req.body.userId);
                    const newApproverPoints = approverPoints.points + 10;
                    await usersService.updateUserPoints({
                        body: {
                            userId: req.body.userId,
                            points: newApproverPoints,
                        },
                    });

                    const approverNotification = {
                        title: 'Points Awarded for POAM Review',
                        message: `10 points have been added to your points balance for reviewing POAM ${req.body.poamId}.`,
                        userId: req.body.userId,
                    };
                    const approverNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(approverNotificationSql, [
                        req.body.userId,
                        approverNotification.title,
                        approverNotification.message,
                    ]);
                }

                let sql_query = `
                    UPDATE ${config.database.schema}.poamapprovers
                    SET approvalStatus = ?, approvedDate = ?, comments = ?
                    WHERE poamId = ? AND userId = ?;
                `;
                await connection.query(sql_query, [
                    req.body.approvalStatus,
                    req.body.approvedDate,
                    req.body.comments,
                    req.body.poamId,
                    req.body.userId,
                ]);

                let fullName = 'Unknown User';
                let userSql = `SELECT fullName FROM ${config.database.schema}.user WHERE userId = ?`;
                const [user] = await connection.query(userSql, [req.body.userId]);
                if (user[0]) {
                    fullName = user[0].fullName;
                }

                const poamSql = `SELECT submitterId, rawSeverity, hqs, collectionId FROM ${config.database.schema}.poam WHERE poamId = ?`;
                const [poamResult] = await connection.query(poamSql, [req.body.poamId]);
                const submitterId = poamResult[0].submitterId;
                const rawSeverity = poamResult[0].rawSeverity;
                const collectionId = poamResult[0].collectionId;
                const hqs = poamResult[0].hqs;

                if (req.body.approvalStatus === 'Approved' || req.body.approvalStatus === 'False-Positive') {
                    const userPoints = await marketplaceService.getUserPoints(submitterId);
                    if (!normalizeBoolean(hqs) && normalizeBoolean(req.body.hqs)) {
                        if (!config.client.features.marketplaceDisabled) {
                            const newHqsPoints = userPoints.points + 30;
                            await usersService.updateUserPoints({
                                body: {
                                    userId: submitterId,
                                    points: newHqsPoints,
                                },
                            });
                            const hqsNotification = {
                                title: `High Quality Submission`,
                                message: `30 points have been added to your points balance for a High Quality submission on POAM ${req.body.poamId}.`,
                                userId: submitterId,
                            };
                            const hqsNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                            await connection.query(hqsNotificationSql, [submitterId, hqsNotification.title, hqsNotification.message]);
                        }
                        const hqsPoamSql = `UPDATE ${config.database.schema}.poam SET hqs = 1 WHERE poamId = ?`;
                        await connection.query(hqsPoamSql, [req.body.poamId]);
                    } else if (normalizeBoolean(hqs) && !normalizeBoolean(req.body.hqs)) {
                        const hqsPoamSql = `UPDATE ${config.database.schema}.poam SET hqs = 0 WHERE poamId = ?`;
                        await connection.query(hqsPoamSql, [req.body.poamId]);
                    } else if (!config.client.features.marketplaceDisabled) {
                        const newPoints = userPoints.points + 15;
                        await usersService.updateUserPoints({
                            body: {
                                userId: submitterId,
                                points: newPoints,
                            },
                        });

                        const pointsNotification = {
                            title: `POAM Review Points`,
                            message: `15 points have been added to your points balance for review of POAM ${req.body.poamId}.`,
                            userId: submitterId,
                        };
                        const pointsNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                        await connection.query(pointsNotificationSql, [submitterId, pointsNotification.title, pointsNotification.message]);
                    }

                    let notificationMessage = `POAM ${req.body.poamId} has been reviewed by ${fullName}.`;
                    if (normalizeBoolean(req.body.hqs)) {
                        notificationMessage = `POAM ${req.body.poamId} has been reviewed and marked as High Quality by ${fullName}.`;
                    }

                    const notification = {
                        title: `POAM reviewed by ${fullName}`,
                        message: notificationMessage,
                        userId: submitterId,
                    };
                    const notificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(notificationSql, [submitterId, notification.title, notification.message]);
                }

                let action = `POAM ${req.body.poamId} has been marked as ${req.body.approvalStatus.toLowerCase()} by ${fullName}. Approver Comments: ${req.body.comments}.`;
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

                const permissionSql = `SELECT userId FROM ${config.database.schema}.collectionpermissions WHERE collectionId = ? AND accessLevel = 4`;
                const [permissionResult] = await connection.query(permissionSql, [collectionId]);
                const isApproverInPermissions = permissionResult.some(p => p.userId === req.userObject.userId);

                if (req.body.approvalStatus === 'Approved' || req.body.approvalStatus === 'False-Positive') {
                    if ((rawSeverity === 'CAT I - Critical' || rawSeverity === 'CAT I - High') && !isApproverInPermissions) {
                        for (const perm of permissionResult) {
                            const cat1Notification = {
                                title: 'CAT-I POAM Pending Review',
                                message: `POAM ${req.body.poamId} has been reviewed and is pending CAT-I Approver review.`,
                                userId: perm.userId,
                            };
                            const cat1NotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                            await connection.query(cat1NotificationSql, [perm.userId, cat1Notification.title, cat1Notification.message]);
                        }
                        sql_query = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
                        await connection.query(sql_query, ['Pending CAT-I Approval', req.body.poamId]);
                    } else {
                        if (req.body.approvalStatus === 'Approved') {
                            sql_query = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
                            await connection.query(sql_query, ['Approved', req.body.poamId]);

                            const statusNotification = {
                                title: `POAM status changed to Approved`,
                                message: `POAM ${req.body.poamId} has met the approval requirements. POAM Status has changed to Approved.`,
                                userId: submitterId,
                            };
                            const statusNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                            await connection.query(statusNotificationSql, [
                                submitterId,
                                statusNotification.title,
                                statusNotification.message,
                            ]);
                        } else if (req.body.approvalStatus === 'False-Positive') {
                            sql_query = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
                            await connection.query(sql_query, ['False-Positive', req.body.poamId]);

                            const statusNotification = {
                                title: `POAM status changed to False-Positive`,
                                message: `POAM ${req.body.poamId} has met the review requirements. POAM Status has changed to False-Positive.`,
                                userId: submitterId,
                            };
                            const statusNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                            await connection.query(statusNotificationSql, [
                                submitterId,
                                statusNotification.title,
                                statusNotification.message,
                            ]);
                        }
                    }
                } else if (req.body.approvalStatus === 'Rejected') {
                    sql_query = `UPDATE ${config.database.schema}.poam SET status = ? WHERE poamId = ?`;
                    await connection.query(sql_query, ['Rejected', req.body.poamId]);

                    const rejectionNotification = {
                        title: `POAM Rejected`,
                        message: `POAM ${req.body.poamId} has been rejected. Please review the comments and make necessary changes.`,
                        userId: submitterId,
                    };
                    const rejectionNotificationSql = `INSERT INTO ${config.database.schema}.notification (userId, title, message) VALUES (?, ?, ?)`;
                    await connection.query(rejectionNotificationSql, [
                        submitterId,
                        rejectionNotification.title,
                        rejectionNotification.message,
                    ]);
                }

                let sql = `SELECT * FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
                let [row] = await connection.query(sql, [req.body.poamId, req.body.userId]);
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
    } catch (error) {
        return { error: error.message };
    }
};

exports.deletePoamApprover = async function deletePoamApprover(req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            },
        });
    }
    if (!req.params.userId) {
        return next({
            status: 400,
            errors: {
                userId: 'is required',
            },
        });
    }

    try {
        return await withConnection(async connection => {
            let sql = `DELETE FROM ${config.database.schema}.poamapprovers WHERE poamId = ? AND userId = ?`;
            await connection.query(sql, [req.params.poamId, req.params.userId]);

            if (req.userObject.userId) {
                let userSql = `SELECT fullName FROM ${config.database.schema}.user WHERE userId = ?`;
                const [user] = await connection.query(userSql, [req.params.userId]);
                const fullName = user[0] ? user[0].fullName : 'Unknown User';
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
    } catch (error) {
        return { error: error.message };
    }
};
