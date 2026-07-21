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
        await connection.release();
    }
}

module.exports.getMessagesByPoamId = async function getMessagesByPoamId(req) {
    return await withConnection(async connection => {
        let sql = `
            SELECT pc.messageId, pc.userId, pc.poamId, pc.text, pc.createdAt,
                   u.firstName, u.lastName, u.userName
            FROM ${config.database.schema}.poamchat pc
            JOIN ${config.database.schema}.user u ON pc.userId = u.userId
            WHERE pc.poamId = ?
            ORDER BY pc.createdAt ASC
        `;
        let [rows] = await connection.query(sql, [req.params.poamId]);
        const messages = rows.map(row => ({
            messageId: row.messageId,
            userId: row.userId,
            poamId: row.poamId,
            text: row.text,
            createdAt: row.createdAt ? row.createdAt.toISOString() : null,
            user: {
                firstName: row.firstName,
                lastName: row.lastName,
                userName: row.userName,
            },
        }));
        return messages;
    });
};

module.exports.createMessage = async function createMessage(req) {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

    if (text === '') {
        throw new SmError.ClientError('text is required and cannot be empty');
    }

    return await withConnection(async connection => {
        let checkSql = `SELECT 1 FROM ${config.database.schema}.poam WHERE poamId = ?`;
        let [checkRows] = await connection.query(checkSql, [req.params.poamId]);

        if (checkRows.length === 0) {
            throw new SmError.NotFoundError('POAM not found');
        }

        let sql = `
            INSERT INTO ${config.database.schema}.poamchat (userId, poamId, text, createdAt)
            VALUES (?, ?, ?, NOW())
        `;

        let [result] = await connection.query(sql, [req.userObject.userId, req.params.poamId, text]);

        let selectSql = `
            SELECT pc.messageId, pc.userId, pc.poamId, pc.text, pc.createdAt,
                   u.firstName, u.lastName, u.userName
            FROM ${config.database.schema}.poamchat pc
            JOIN ${config.database.schema}.user u ON pc.userId = u.userId
            WHERE pc.messageId = ?
        `;
        let [messages] = await connection.query(selectSql, [result.insertId]);

        if (messages.length !== 1) {
            throw new Error('Failed to create message');
        }

        return {
            messageId: messages[0].messageId,
            userId: messages[0].userId,
            poamId: messages[0].poamId,
            text: messages[0].text,
            createdAt: messages[0].createdAt ? messages[0].createdAt.toISOString() : null,
            user: {
                firstName: messages[0].firstName,
                lastName: messages[0].lastName,
                userName: messages[0].userName,
            },
        };
    });
};

module.exports.deleteMessage = async function deleteMessage(req) {
    return await withConnection(async connection => {
        let checkSql = `SELECT userId FROM ${config.database.schema}.poamchat WHERE messageId = ?`;
        let [checkRows] = await connection.query(checkSql, [req.params.messageId]);

        if (checkRows.length === 0) {
            throw new SmError.NotFoundError('Message not found');
        }

        if (checkRows[0].userId !== req.userObject.userId) {
            throw new SmError.PrivilegeError('Not authorized to delete this message');
        }

        let sql = `DELETE FROM ${config.database.schema}.poamchat WHERE messageId = ?`;
        let [result] = await connection.query(sql, [req.params.messageId]);

        if (result.affectedRows !== 1) {
            throw new Error('Failed to delete message');
        }

        return { success: true };
    });
};
