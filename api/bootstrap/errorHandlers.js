/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const logger = require('../utils/logger');
const smErrors = require('../utils/error');
const { serializeError } = require('../utils/serializeError');
const path = require('path');

function configureErrorHandlers(app) {
    const eovPath = path.dirname(require.resolve('express-openapi-validator'));
    const eovErrors = require(path.join(eovPath, 'framework', 'types.js'));
    app.use((err, req, res, next) => {
        if (!(err instanceof smErrors.SmError) && !(err instanceof eovErrors.HttpError)) {
            logger.writeError('rest', 'error', {
                request: logger.serializeRequest(req),
                error: serializeError(err),
            });
        }

        res.errorBody = { error: err.message, code: err.code, detail: err.detail };
        if (err.status === 500 || !err.status) res.errorBody.stack = err.stack;
        if (!res._headerSent) {
            res.status(err.status || 500)
                .header(err.headers)
                .json(res.errorBody);
        } else {
            res.write(JSON.stringify(res.errorBody) + '\n');
            res.end();
        }
    });
}

module.exports = configureErrorHandlers;
