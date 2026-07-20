/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const SmError = require('./error');
const logger = require('./logger');
const { serializeError } = require('./serializeError');

function sendError(res, error) {
    if (res.headersSent) {
        return;
    }

    if (error instanceof SmError.SmError) {
        res.status(error.status).json({ error: error.message, detail: error.detail });
    } else {
        logger.writeError('rest', 'error', {
            request: res.req ? logger.serializeRequest(res.req) : undefined,
            error: serializeError(error),
        });
        res.status(500).json({ error: 'Internal Server Error', detail: 'An unexpected error occurred.' });
    }
}

module.exports = { sendError };
