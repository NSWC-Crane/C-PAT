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
const { sendError } = require('../utils/respond');

module.exports.getMessagesByPoamId = async function getMessagesByPoamId(req, res) {
    try {
        const messages = await poamChatService.getMessagesByPoamId(req);
        res.status(200).json(messages);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.createMessage = async function createMessage(req, res) {
    try {
        const message = await poamChatService.createMessage(req);
        res.status(201).json(message);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deleteMessage = async function deleteMessage(req, res) {
    try {
        await poamChatService.deleteMessage(req);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
