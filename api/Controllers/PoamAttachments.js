/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const poamAttachmentService = require('../Services/poamAttachmentService');
const { sendError } = require('../utils/respond');

module.exports.getPoamAttachmentsByPoamId = async function getPoamAttachmentsByPoamId(req, res) {
    try {
        const poamAttachments = await poamAttachmentService.getPoamAttachmentsByPoamId(req);
        res.status(200).json(poamAttachments);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.downloadPoamAttachment = async function downloadPoamAttachment(req, res) {
    try {
        const attachment = await poamAttachmentService.downloadPoamAttachment(req);
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
        res.setHeader('Content-Length', attachment.fileSize);
        res.status(200).send(attachment.fileContent);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.postPoamAttachment = async function postPoamAttachment(req, res) {
    try {
        const poamAttachments = await poamAttachmentService.postPoamAttachment(req, req.userObject.userId);
        res.status(201).json(poamAttachments);
    } catch (error) {
        sendError(res, error);
    }
};

module.exports.deletePoamAttachment = async function deletePoamAttachment(req, res) {
    try {
        await poamAttachmentService.deletePoamAttachment(req, req.userObject.userId);
        res.status(204).send();
    } catch (error) {
        sendError(res, error);
    }
};
