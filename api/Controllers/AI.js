/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const aiService = require('../Services/aiService');
const logger = require('../utils/logger');

module.exports.generateMitigation = async function generateMitigation(req, res, next) {
    try {
        const response = await aiService.generateMitigation(req, res, next);

        if (!res.headersSent && response) {
            res.status(200).json(response);
        }
    } catch (error) {
        logger.writeError('AI', 'generateMitigation', {
            error: error.message,
            prompt: req.body
        });

        if (!res.headersSent) {
            if (error.status === 400) {
                res.status(400).json({ error: 'Validation Error', detail: error.errors });
            } else {
                res.status(500).json({ error: 'Internal Server Error', detail: error.message });
            }
        }
    }
};