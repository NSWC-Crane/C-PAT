/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../utils/config');
const swaggerUi = require('swagger-ui-express');
const jsyaml = require('js-yaml');

function serveDocs(app) {
    if (config.docs.disabled) {
        logger.writeDebug('serveDocs', 'client', { message: 'documentation disabled' });
        return;
    }
    try {
        app.use('/docs', express.static(path.join(__dirname, '../', config.docs.docsDirectory)));
        logger.writeDebug('serveDocs', 'client', { message: 'succeeded setting up documentation' });
    } catch (err) {
        logger.writeError('serveDocs', 'client', { message: err.message, stack: err.stack });
    }
}

function initializeApiSpec() {
    const oasDoc = getOAS();
    config.definition = oasDoc;
    return oasDoc;
}

function serveApiDocs(app) {
    if (!config.definition) {
        throw new Error('API specification not initialized. Call initializeApiSpec() first.');
    }

    if (config.swaggerUi.enabled) {
        configureSwaggerUI(app, config.definition);
    } else {
        logger.writeDebug('serveApiDocs', 'SwaggerUI', { message: 'Swagger UI is disabled in configuration' });
    }
}

function getOAS() {
    const apiSpecPath = path.join(__dirname, '../specification/C-PAT.yaml');
    let spec = fs.readFileSync(apiSpecPath, 'utf8');
    let oasDoc = jsyaml.load(spec);
    let authority = config.oauth.authority;
    oasDoc.info.version = config.version;
    oasDoc.servers[0].url = config.swaggerUi.server;

    oasDoc.components.securitySchemes.oauth.openIdConnectUrl = `${authority}/.well-known/openid-configuration`;

    return oasDoc;
}

function configureSwaggerUI(app, oasDoc) {
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(oasDoc, null, {
            oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl,
            oauth: {
                usePkceWithAuthorizationCodeGrant: true,
            },
        })
    );
    app.get(['/swagger.json', '/openapi.json'], function (req, res) {
        res.json(oasDoc);
    });
    logger.writeDebug('configureSwaggerUI', 'client', { message: 'succeeded setting up swagger-ui' });
}

module.exports = { serveDocs, serveApiDocs, initializeApiSpec };
