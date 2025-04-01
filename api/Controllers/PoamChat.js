/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamChatService = require('../Services/poamChatService');

module.exports.getMessagesByPoamId = async function getMessagesByPoamId(req, res, next) {
    try {
        const messages = await poamChatService.getMessagesByPoamId(req, res, next);
        res.status(200).json(messages);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.createMessage = async function createMessage(req, res, next) {
    try {
        const message = await poamChatService.createMessage(req, res, next);
        res.status(201).json(message);
    } catch (error) {
        if (error.status === 400) {
            res.status(400).json({ error: 'Validation Error', detail: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};

module.exports.deleteMessage = async function deleteMessage(req, res, next) {
    try {
        await poamChatService.deleteMessage(req, res, next);
        res.status(204).send();
    } catch (error) {
        if (error.status === 404) {
            res.status(404).json({ error: 'Not Found', detail: 'Message not found' });
        } else if (error.status === 403) {
            res.status(403).json({ error: 'Forbidden', detail: 'Not authorized to delete this message' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    }
};