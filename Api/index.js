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
const writer = require('./utils/writer.js');
var RateLimit = require('express-rate-limit');
const { middleware: openApiMiddleware, resolvers } = require('express-openapi-validator');

const eovPath = path.dirname(require.resolve('express-openapi-validator'))
const eovErrors = require(path.join(eovPath, 'framework', 'types.js'))

process.on('uncaughtException', (err, origin) => {
    logger.writeError('app', 'uncaught', serializeError(err))
})
process.on('unhandledRejection', (reason, promise) => {
    logger.writeError('app', 'unhandled', { reason, promise })
})

const app = express();


const limiter = RateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(limiter);
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
        },
        fileUploader: false
    })
);

if (config.swaggerUi.enabled) {
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

if (!config.docs.disabled) {
    app.use('/docs', express.static(path.join(__dirname, config.docs.docsDirectory)))
    logger.writeDebug('index', 'client', { message: 'succeeded setting up documentation' })
} else {
    logger.writeDebug('index', 'client', { message: 'documentation disabled' })
}

app.use(express.static(path.join(__dirname, config.client.directory), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

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
    version: "${config.version}",
    apiBase: "${config.client.apiBase}",
    oauth: {
        authority:  "${config.client.authority}",
        clientId: "${config.client.clientId}",
        refreshToken: {
          disabled: ${config.client.refreshToken.disabled}
        },
        extraScopes: "${config.client.extraScopes ?? ''}",
        scopePrefix: "${config.client.scopePrefix ?? ''}",
        claims: {
          scope: "${config.oauth.claims.scope}",
          username: "${config.oauth.claims.username}",
          servicename: "${config.oauth.claims.servicename}",
          name: "${config.oauth.claims.name}",
          privileges: "${config.oauth.claims.privileges}",
          email: "${config.oauth.claims.email}"
        }
    }
  }
}    
`
        app.get('/js/Env.js', function (req, res) {
            req.component = 'static'
            writer.writeWithContentType(res, { payload: envJS, contentType: "application/javascript" })
        })
        logger.writeDebug('index', 'client', { client_static: path.join(__dirname, directory) })
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

app.get('*', limiter, (req, res) => {
    res.sendFile(path.join(__dirname, config.client.directory, 'index.html'));
});

async function startServer(app) {
    let db = require(`./Services/mysql/utils`)
    try {
        await Promise.all([auth.initializeAuth(), db.initializeDatabase()])
    }
    catch (e) {
        logger.writeError('index', 'shutdown', { message: 'Failed to setup dependencies', error: serializeError(e) });
        process.exit(1);
    }
    const server = http.createServer(app).listen(config.http.port, function () {
        const endTime = process.hrtime.bigint()
        logger.writeInfo('index', 'started', {
            durationS: Number(endTime - startTime) / 1e9,
            port: config.http.port,
            api: '/api',
            client: config.client.disabled ? undefined : '/',
            documentation: config.docs.disabled ? undefined : '/docs',
            swagger: config.swaggerUi.enabled ? '/api-docs' : undefined
        })
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

