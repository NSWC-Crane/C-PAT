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
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamAttachmentsByPoamId = async function (req, res, next) {
    if (!req.params.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT attachmentId, poamId, filename, fileSize, mimeType, uploadDate, uploadedBy
                FROM ${config.database.schema}.poamattachments
                WHERE poamId = ?
            `;
            let [rowPoamAttachments] = await connection.query(sql, [req.params.poamId]);
            return rowPoamAttachments.map(row => ({
                attachmentId: row.attachmentId,
                poamId: row.poamId,
                filename: row.filename,
                fileSize: row.fileSize,
                mimeType: row.mimeType,
                uploadDate: row.uploadDate,
                uploadedBy: row.uploadedBy
            }));
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.downloadPoamAttachment = async function (req, res, next) {
    if (!req.params.poamId || !req.params.attachmentId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
                attachmentId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let sql = `
                SELECT filename, fileSize, mimeType, fileContent
                FROM ${config.database.schema}.poamattachments
                WHERE poamId = ? AND attachmentId = ?
            `;
            let [[attachment]] = await connection.query(sql, [req.params.poamId, req.params.attachmentId]);

            if (!attachment) {
                return null;
            }

            return {
                filename: attachment.filename,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                fileContent: attachment.fileContent
            };
        });
    } catch (error) {
        return { error: error.message };
    }
};

async function validateFile(file) {
    if (file.size > 5242880) {
        throw new SmError.UnprocessableError('File size exceeds 5MB limit');
    }

    const allowedMimeTypes = [
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'application/vnd.ms-excel.template.macroEnabled.12',
        'application/vnd.ms-excel.template',

        // Word
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-word.document.macroEnabled.12',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'application/vnd.ms-word.template.macroEnabled.12',

        // PowerPoint
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
        'application/vnd.openxmlformats-officedocument.presentationml.template',
        'application/vnd.ms-powerpoint.template.macroEnabled.12',

        // PDF
        'application/pdf',

        // Text
        'text/plain',
        'application/rtf',

        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',

        // Other
        'text/csv',
        'application/xml',
        'text/xml',
        'application/json',
        'application/vnd.ms-outlook',
        'application/octet-stream'
    ];
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
        throw new SmError.UnprocessableError('Invalid file type');
    }

    const allowedExtensions = ['.xls', '.xlsx', '.xlsm', '.xlsb', '.xltx', '.xltm', '.xlt',
        '.doc', '.docx', '.docm', '.dotx', '.dotm', '.dot', '.ppt', '.pptx', '.pptm',
        '.potx', '.potm', '.pot', '.pdf', '.txt', '.rtf', '.jpg', '.jpeg', '.png',
        '.gif', '.bmp', '.tiff', '.tif', '.svg', '.csv', '.xml', '.json', '.msg'
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        throw new SmError.UnprocessableError('Invalid file extension');
    }

    const magicNumbers = file.buffer.toString('hex', 0, 4).toLowerCase();

    if (['4d5a', '5a4d'].includes(magicNumbers)) {
        throw new SmError.UnprocessableError();
    }

    if (magicNumbers === '504b') {
        const officeExtensions = ['.xlsx', '.docx', '.pptx', '.xlsm', '.docm', '.pptm', '.xltx', '.dotx', '.potx'];
        if (!officeExtensions.includes(fileExtension)) {
            throw new SmError.UnprocessableError('Potential ZIP file detected');
        }
    }

    if (magicNumbers === '7f45') {
        const nextBytes = file.buffer.toString('hex', 4, 6).toLowerCase();
        if (nextBytes === '4c') {
            throw new SmError.UnprocessableError();
        }
    }

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    return { isValid: true, hash };
}

exports.postPoamAttachment = async function (req, res, next, userId) {
    const file = req.files[0];
    if (!req.body.poamId) {
        return next({
            status: 400,
            errors: {
                poamId: 'is required',
            }
        });
    }
    if (!file) {
        return next({
            status: 400,
            errors: {
                file: 'is required',
            }
        });
    }

    try {
        const validationResult = await validateFile(file);
        if (!validationResult.isValid) {
            return { error: 'File validation failed' };
        }

        return await withConnection(async (connection) => {
            const fileHash = validationResult.hash;

            let sql = `INSERT INTO ${config.database.schema}.poamattachments
                (poamId, filename, fileSize, mimeType, uploadedBy, fileContent, fileHash)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            let [result] = await connection.query(sql, [
                req.body.poamId,
                file.originalname,
                file.size,
                file.mimetype,
                userId,
                file.buffer,
                fileHash
            ]);

            if (result.insertId) {
                let fetchSql = `SELECT attachmentId, poamId, filename, fileSize, mimeType, uploadDate, uploadedBy
                                FROM ${config.database.schema}.poamattachments
                                WHERE attachmentId = ?`;
                let [[newAttachment]] = await connection.query(fetchSql, [result.insertId]);

                let action = `File "${file.originalname}" was attached to POAM.`;
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.body.poamId, action, userId]);

                return newAttachment;
            }
            return null;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.deletePoamAttachment = async function (req, res, next, userId) {
    if (!req.params.attachmentId || !req.params.poamId) {
        return next({
            status: 400,
            errors: {
                attachmentId: 'is required',
                poamId: 'is required',
            }
        });
    }

    try {
        return await withConnection(async (connection) => {
            let fetchSql = `SELECT filename FROM ${config.database.schema}.poamattachments WHERE attachmentId = ? AND poamId = ?`;
            let [[attachment]] = await connection.query(fetchSql, [req.params.attachmentId, req.params.poamId]);

            if (!attachment) {
                return { error: 'Attachment not found' };
            }

            let sql = `DELETE FROM ${config.database.schema}.poamattachments WHERE attachmentId = ? AND poamId = ?`;
            await connection.query(sql, [req.params.attachmentId, req.params.poamId]);

            if (userId) {
                let action = `File "${attachment.filename}" was removed from POAM.`;
                let logSql = `INSERT INTO ${config.database.schema}.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
                await connection.query(logSql, [req.params.poamId, action, userId]);
            }
            return { message: 'Attachment deleted successfully' };
        });
    } catch (error) {
        return { error: error.message };
    }
};