/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const path = require('node:path');
const logger = require('../utils/logger');
const packageJson = require('../package.json');

function modulePathResolver(handlersPath, route, apiDoc) {
    const pathKey = route.openApiRoute.substring(route.basePath.length);
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
    const controller = schema.tags[0];
    const method = schema['operationId'];
    const modulePath = path.join(handlersPath, controller);
    const handler = require(modulePath);
    if (handler[method] === undefined) {
        throw new Error(`Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`);
    }
    return handler[method];
}

function buildResponseValidationConfig(willValidateResponse) {
    if (willValidateResponse) {
        return {
            onError: (error, body, req) => {
                logger.writeError('rest', 'responseValidation', {
                    error,
                    request: logger.serializeRequest(req),
                    body,
                });
            },
        };
    } else {
        return false;
    }
}

function logAppConfig(config) {
    logger.writeInfo('bootstrapUtils', 'starting bootstrap', {
        version: packageJson.version,
        env: logger.serializeEnvironment(),
        dirname: __dirname,
        cwd: process.cwd(),
    });
    logger.writeInfo('bootstrapUtils', 'configuration', config);
}

module.exports = {
    modulePathResolver,
    buildResponseValidationConfig,
    logAppConfig,
};
