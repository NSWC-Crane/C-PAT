/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const poamAttachmentService = require('../Services/poamAttachmentService')

module.exports.getPoamAttachmentsByPoamId = async function getPoamAttachmentsByPoamId(req, res, next) {
    try {
        const poamAttachments = await poamAttachmentService.getPoamAttachmentsByPoamId(req, res, next);
        res.status(200).json(poamAttachments);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.downloadPoamAttachment = async function downloadPoamAttachment(req, res, next) {
    try {
        const attachment = await poamAttachmentService.downloadPoamAttachment(req, res, next);
        if (attachment) {
            res.setHeader('Content-Type', attachment.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
            res.setHeader('Content-Length', attachment.fileSize);
            res.status(200).send(attachment.fileContent);
        } else {
            res.status(404).json({ error: 'Attachment not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.postPoamAttachment = async function postPoamAttachment(req, res, next) {
    try {
        const userId = req.userObject.userId;
        const poamAttachments = await poamAttachmentService.postPoamAttachment(req, res, next, userId);
        if (poamAttachments === null) {
            res.status(400).json({ error: 'Failed to create poam Attachment' });
        } else {
            res.status(201).json(poamAttachments);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.deletePoamAttachment = async function deletePoamAttachment(req, res, next) {
    try {
        const userId = req.userObject.userId;
        await poamAttachmentService.deletePoamAttachment(req, res, next, userId);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};