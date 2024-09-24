/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the 
! Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
'use strict';

const startTime = process.hrtime.bigint();
const logger = require('./utils/logger');
const smErrors = require('./utils/error');
const { serializeError } = require('./utils/serializeError');
const packageJson = require("./package.json")
logger.writeInfo('index', 'starting', {
    version: packageJson.version,
    env: logger.serializeEnvironment(),
    dirname: __dirname,
    cwd: process.cwd()
});
const config = require('./utils/config');
logger.writeInfo('index', 'configuration', config);

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const auth = require('./utils/auth');
const swaggerUi = require('swagger-ui-express');
const jsyaml = require('js-yaml');
const fs = require('fs');
const multer = require('multer');
const writer = require('./utils/writer.js');
const OperationSvc = require('./Services/operationService');
const { middleware: openApiMiddleware, resolvers } = require('express-openapi-validator');
const proxy = require('express-http-proxy');
const url = require('url');
const db = require(`./Services/utils`);
const depStatus = {
    db: 'waiting',
    auth: 'waiting'
}

const eovPath = path.dirname(require.resolve('express-openapi-validator'))
const eovErrors = require(path.join(eovPath, 'framework', 'types.js'))

process.on('uncaughtException', (err, origin) => {
    logger.writeError('app', 'uncaught', serializeError(err))
})
process.on('unhandledRejection', (reason, promise) => {
    logger.writeError('app', 'unhandled', { reason, promise })
})

const app = express();
let storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(config.http.maxUpload)
    }
});
app.use(express.urlencoded({ extended: true }))
app.use(express.json({
    strict: false,
    limit: parseInt(config.http.maxJsonBody)
}));
app.use(cors());
app.use(logger.requestLogger);
app.use(compression({
    filter: (req, res) => {
        if (req.noCompression) {
            return false
        }
        return compression.filter(req, res)
    }
}));

app.use((req, res, next) => {
    try {
        if ((depStatus.db === 'up' && depStatus.auth === 'up') || req.url.startsWith('/api/op/definition')) {
            next()
        } else {
            res.status(503).json({ status: depStatus })
        }
    } catch (e) {
        next(e)
    }
})


app.use('/api/tenable', proxy(config.tenable.url, {
    proxyReqPathResolver: function (req) {
        const baseUrl = config.tenable.url.endsWith('/')
            ? config.tenable.url.slice(0, -1)
            : config.tenable.url;
        const path = '/rest' + req.url.replace('/api/tenable', '');
        const fullUrl = url.resolve(baseUrl, path);

        return fullUrl;
    },
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
        const headersToRemove = ['host', 'referer', 'origin', 'cookie', 'user-agent', 'authorization'];
        headersToRemove.forEach(header => {
            delete proxyReqOpts.headers[header.toLowerCase()];
        });
        proxyReqOpts.headers['x-apikey'] = `accesskey=${config.tenable.accessKey}; secretkey=${config.tenable.secretKey};`;
        if (!proxyReqOpts.headers['Content-Type']) {
            proxyReqOpts.headers['Content-Type'] = 'application/json';
        }
        proxyReqOpts.headers['User-Agent'] = 'Integration/1.0 (NAVSEA; CPAT; Build/1.0)';
        proxyReqOpts.rejectUnauthorized = false;

        return proxyReqOpts;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        return proxyResData;
    },
    proxyErrorHandler: function (err, res, next) {
        res.status(500).send('Proxy error: ' + err.message);
        throw new smErrors.InternalError('Proxy error:', err);        
    }
}));

const apiSpecPath = path.join(__dirname, './specification/C-PAT.yaml');
app.use(
    '/api',
    openApiMiddleware({
        apiSpec: apiSpecPath,
        validateRequests: {
            coerceTypes: false,
            allowUnknownQueryParameters: false,
        },
        validateResponses: buildResponseValidationConfig(),
        validateApiSpec: true,
        $refParser: {
            mode: 'dereference',
        },
        operationHandlers: {
            basePath: path.join(__dirname, 'Controllers'),
            resolver: modulePathResolver,
        },
        validateSecurity: {
            handlers: {
                oauth: auth.verifyRequest
            }
        }
    })
);

app.use((err, req, res, next) => {
    if (!(err instanceof smErrors.SmError) && !(err instanceof eovErrors.HttpError)) {
        logger.writeError('rest', 'error', {
            request: logger.serializeRequest(req),
            error: serializeError(err)
        })
    }
    res.errorBody = { error: err.message, detail: err.detail, stack: err.stack }
    if (!res._headerSent) {
        res.status(err.status || 500).header(err.headers).json(res.errorBody)
    }
    else {
        res.write(JSON.stringify(res.errorBody) + '\n')
        res.end()
    }
})

run()

async function run() {
    try {
        if (!config.client.disabled) {
            await setupClient(app, config.client.directory)
            logger.writeDebug('index', 'client', { message: 'succeeded setting up client' })
        }
        else {
            logger.writeDebug('index', 'client', { message: 'client disabled' })
        }
        if (!config.docs.disabled) {
            app.use('/docs', express.static(path.join(__dirname, config.docs.docsDirectory)))
            logger.writeDebug('index', 'client', { message: 'succeeded setting up documentation' })
        } else {
            logger.writeDebug('index', 'client', { message: 'documentation disabled' })
        }

        let spec = fs.readFileSync(apiSpecPath, 'utf8')
        let oasDoc = jsyaml.load(spec)
        oasDoc.info.version = config.version
        if (oasDoc.servers && oasDoc.servers.length > 0) {
            oasDoc.servers[0].url = config.swaggerUi.server;
        } else {
            logger.writeError('index', 'openapi', { message: 'Missing or empty servers array in OpenAPI specification' });
        }
        oasDoc.components.securitySchemes.oauth.openIdConnectUrl = `${config.client.authority}/.well-known/openid-configuration`
        config.definition = oasDoc

        if (config.swaggerUi.enabled) {
            app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(oasDoc, null, {
                oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl,
                oauth: {
                    usePkceWithAuthorizationCodeGrant: true
                }
            }))
            app.get(['/swagger.json', '/openapi.json'], function (req, res) {
                res.json(oasDoc);
            })
            logger.writeDebug('index', 'client', { message: 'succeeded setting up swagger-ui' })
        }
        startServer(app)
    }
    catch (err) {
        logger.writeError(err.message);
        process.exit(1);
    }
}

async function setupClient(app, directory) {
    try {
        const envJS =
            `
const CPAT = {
  Env: {
    classification: "${config.settings.setClassification}",
    version: "${config.version}",
    apiBase: "${config.client.apiBase}",
    oauth: {
        authority:  "${config.client.authority}",
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
          privileges: "${config.oauth.claims.privileges}",
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
        marketplaceDisabled: ${config.client.features.marketplaceDisabled}
    }
  }
}    
`
        app.get('/cpat/Env.js', function (req, res) {
            req.component = 'static'
            writer.writeWithContentType(res, { payload: envJS, contentType: "application/javascript" })
        })
        logger.writeDebug('index', 'client', { client_static: path.join(__dirname, directory) })
        app.use(express.static(path.join(__dirname, directory), {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
            }
        }));
        const expressStatic = express.static(path.join(__dirname, directory))
        app.use('*', (req, res, next) => {
            req.component = 'static'
            expressStatic(req, res, next)
        })
    }
    catch (err) {
        logger.writeError('index', 'client', { message: err.message, stack: err.stack })
    }
}


async function startServer(app) {
    const server = http.createServer(app)
    server.listen(config.http.port, function () {
        logger.writeInfo('index', 'listening', {
            port: config.http.port,
            api: '/api',
            client: config.client.disabled ? undefined : '/',
            documentation: config.docs.disabled ? undefined : '/docs',
            swagger: config.swaggerUi.enabled ? '/api-docs' : undefined
        })
    })

    try {
        await Promise.all([auth.initializeAuth(depStatus), db.initializeDatabase(depStatus)])
    }
    catch (e) {
        logger.writeError('index', 'shutdown', { message: 'Failed to setup dependencies', error: serializeError(e) });
        process.exit(1);
    }

    if (config.settings.setClassification) {
        await OperationSvc.setConfigurationItem('classification', config.settings.setClassification)
    }
    if (config.version) {
        await OperationSvc.setConfigurationItem('version', config.version)
    }
    const endTime = process.hrtime.bigint()
    logger.writeInfo('index', 'started', {
        durationS: Number(endTime - startTime) / 1e9
    })
}

function modulePathResolver(handlersPath, route, apiDoc) {
    const pathKey = route.openApiRoute.substring(route.basePath.length);
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
    const controller = schema.tags[0]
    const method = schema['operationId']
    const modulePath = path.join(handlersPath, controller);
    const handler = require(modulePath);
    if (handler[method] === undefined) {
        throw new Error(
            `Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`,
        );
    }
    return handler[method];
}

function buildResponseValidationConfig() {
    if (config.settings.responseValidation == "logOnly") {
        return {
            onError: (error, body, req) => {
                logger.writeError('rest', 'responseValidation', {
                    error,
                    request: logger.serializeRequest(req),
                    body
                })
            }
        }
    }
    else {
        return false
    }
}