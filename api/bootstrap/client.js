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
const writer = require('../utils/writer');
const logger = require('../utils/logger');
const config = require('../utils/config');

function serveClient(app) {
    if (config.client.disabled) {
        logger.writeDebug('serveClient', 'client', { message: 'client disabled' });
        return;
    }
    try {
        serveClientEnv(app);
        setupAngularRoutes(app);
        serveStaticFiles(app);
        logger.writeDebug('serveClient', 'client', { message: 'succeeded setting up client' });
    } catch (err) {
        logger.writeError('serveClient', 'client', { message: err.message, stack: err.stack });
    }
}

function getClientEnv() {
    const basePath = config.settings.basePath || '';
    const envJS = `
const CPAT = {
  Env: {
    basePath: "${basePath}",
    classification: "${config.settings.dodDeployment ? config.settings.setClassification : 'NONE'}",
    dod: ${config.settings.dodDeployment},
    version: "${config.version}",
    apiBase: "${config.client.apiBase}",
    oauth: {
        authority:  "${config.oauth.authority}",
        clientId: "${config.oauth.clientId}",
        refreshToken: {
          disabled: ${config.client.refreshToken.disabled}
        },
        extraScopes: "${config.client.extraScopes ?? ''}",
        scopePrefix: "${config.client.scopePrefix ?? ''}",
        claims: {
          scope: "${config.oauth.claims.scope}",
          username: "${config.oauth.claims.username}",
          servicename: "${config.oauth.claims.servicename}",
          fullname: "${config.oauth.claims.fullname}",
          firstname: "${config.oauth.claims.firstname}",
          lastname: "${config.oauth.claims.lastname}",
          privileges: "${config.oauth.claims.privilegesChain}",
          email: "${config.oauth.claims.email}"
        }
    },
    stigman: {
        clientId: "${config.stigman.clientId}",
        apiUrl: "${config.stigman.apiUrl}",
        scopePrefix: "${config.stigman.scopePrefix ?? ''}",
        extraScopes: "${config.stigman.extraScopes ?? ''}",
    },
    features: {
        marketplaceDisabled: ${config.client.features.marketplaceDisabled},
        docsDisabled: ${config.docs.disabled},
        swaggerUiEnabled: ${config.swaggerUi.enabled},
        aiEnabled: ${config.ai.enabled},
        tenableEnabled: ${config.tenable.enabled}
    }
  }
}`;
    return envJS;
}

function serveClientEnv(app) {
    const envJS = getClientEnv();
    app.get('/cpat/Env.js', function (req, res) {
        req.component = 'static';
        writer.writeWithContentType(res, { payload: envJS, contentType: 'application/javascript' });
    });
}
function serveStaticFiles(app) {
    const staticPath = path.join(__dirname, '../', config.client.directory);
    logger.writeDebug('serveStaticFiles', 'client', { client_static: staticPath });

    const expressStatic = express.static(staticPath, {
        setHeaders: (res, path) => {
            if (path.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
        },
    });

    app.use('/', (req, res, next) => {
        req.component = 'static';
        expressStatic(req, res, next);
    });
}

function setupAngularRoutes(app) {
    const angularRoutes = [
        '/admin-processing',
        '/admin-processing/app-info',
        '/asset-processing',
        '/import-processing/stigmanager-import',
        '/import-processing/tenable-import',
        '/label-processing',
        '/marketplace',
        '/poam-processing',
        '/poam-processing/poam-manage',
        '/poam-processing/poam-approve/:poamId',
        '/poam-processing/poam-details/:poamId',
        '/poam-processing/poam-extend/:poamId',
        '/poam-processing/poam-log/:poamId',
        '/notifications',
        '/consent',
    ];

    const serveIndexWithBaseHref = (req, res) => {
        const indexPath = path.join(__dirname, '..', config.client.directory, 'index.html');

        fs.readFile(indexPath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Error loading application');
                return;
            }

            const basePath = config.settings.basePath || '';
            const baseHref = basePath ? (basePath.endsWith('/') ? basePath : basePath + '/') : '/';

            const modifiedHtml = data.replace(/<base\s+href="[^"]*">/i, `<base href="${baseHref}">`);

            res.setHeader('Content-Type', 'text/html');
            res.send(modifiedHtml);
        });
    };

    angularRoutes.forEach(route => {
        app.get(route, serveIndexWithBaseHref);
    });

    app.get('/', serveIndexWithBaseHref);
}

module.exports = {
    serveClient,
};
