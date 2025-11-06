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
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { middleware: openApiMiddleware } = require('express-openapi-validator');
const config = require('../utils/config');
const { modulePathResolver, buildResponseValidationConfig } = require('./bootstrapUtils');
const auth = require('../utils/auth');
const configureErrorHandlers = require('./errorHandlers');
const { requestLogger } = require('../utils/logger');
const state = require('../utils/state');
const logger = require('../utils/logger');
const proxy = require('express-http-proxy');
const url = require('url');
const RateLimit = require('express-rate-limit');

function configureMiddleware(app) {
    const middlewareConfigFunctions = [
        configureProxy,
        configureMulter,
        configureExpress,
        configureCors,
        configureRateLimit,
        configureLogging,
        configureCompression,
        configureServiceCheck,
        configureTenableProxy,
        configureAuth,
        configureOpenApi,
        configureErrorHandlers,
    ];

    logger.writeInfo('middleware', 'bootstrap', { message: 'configuring middleware' });

    for (const middlewareConfigFunction of middlewareConfigFunctions) {
        middlewareConfigFunction(app);
    }

    logger.writeInfo('middleware', 'bootstrap', { message: 'middleware configured' });
}

function configureProxy(app) {
    app.set('trust proxy', true);
}

function configureMulter(app) {
    let storage = multer.memoryStorage();
    const upload = multer({
        storage,
        limits: {
            fileSize: Number.parseInt(config.http.maxUpload),
        },
    });
}

function configureCors(app) {
    app.use(cors());
}

function configureRateLimit(app) {
    if (config.http.rateLimit) {
        const limiter = RateLimit({
            windowMs: 15 * 60 * 1000,
            max: Number.parseInt(config.http.rateLimit),
        });
        app.use(limiter);
    }
}

function configureLogging(app) {
    app.use(requestLogger);
}

function configureCompression(app) {
    app.use(
        compression({
            filter: (req, res) => {
                if (req.noCompression) {
                    return false;
                }
                return compression.filter(req, res);
            },
        })
    );
}

function configureServiceCheck(app) {
    app.use((req, res, next) => {
        try {
            if ((state.dependencyStatus.db && state.dependencyStatus.oidc) || req.url.startsWith('/api/op/definition')) {
                next();
            } else {
                res.status(503).json(state.apiState);
            }
        } catch (e) {
            next(e);
        }
    });
}

function configureTenableProxy(app) {
    if (config.tenable.enabled) {
        app.use(
            '/api/tenable',
            proxy(config.tenable.url, {
                proxyReqPathResolver: function (req) {
                    const baseUrl = config.tenable.url.endsWith('/') ? config.tenable.url.slice(0, -1) : config.tenable.url;
                    const path = '/rest' + req.url.replace('/api/tenable', '');
                    const fullUrl = url.resolve(baseUrl, path);

                    return fullUrl;
                },
                proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
                    const cleanHeaders = {};

                    Object.keys(srcReq.headers).forEach(key => {
                        const value = srcReq.headers[key];
                        if (typeof value === 'string') {
                            cleanHeaders[key.toLowerCase()] = value;
                        }
                    });

                    const headersToRemove = ['host', 'referer', 'origin', 'cookie', 'user-agent', 'authorization', 'accesstoken', 'accept'];

                    headersToRemove.forEach(header => {
                        delete cleanHeaders[header.toLowerCase()];
                    });

                    cleanHeaders['x-apikey'] = `accesskey=${config.tenable.accessKey}; secretkey=${config.tenable.secretKey};`;
                    if (!cleanHeaders['content-type']) {
                        cleanHeaders['content-type'] = 'application/json';
                    }
                    cleanHeaders['user-agent'] = 'Integration/1.0 (NAVSEA; CPAT; Build/1.0)';

                    proxyReqOpts.headers = cleanHeaders;
                    proxyReqOpts.rejectUnauthorized = false;

                    return proxyReqOpts;
                },
                userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
                    return proxyResData;
                },
                proxyErrorHandler: function (err, res, next) {
                    res.status(500).json({
                        error: 'Proxy error',
                        message: err.message,
                    });
                },
            })
        );
    }
}

function configureAuth(app) {
    app.use('/api', auth.validateToken);
    app.use('/api', auth.setupUser);
}

function configureExpress(app) {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.text());
    app.use(
        express.json({
            strict: false,
            limit: Number.parseInt(config.http.maxJsonBody),
        })
    );
}

function configureOpenApi(app) {
    const oasDoc = config.definition;

    if (!oasDoc) {
        throw new Error('OpenAPI specification not initialized. Ensure docs.serveApiDocs() is called before middleware configuration.');
    }

    app.use(
        '/api',
        openApiMiddleware({
            apiSpec: oasDoc,
            validateRequests: {
                coerceTypes: false,
                allowUnknownQueryParameters: false,
            },
            validateResponses: buildResponseValidationConfig(config.settings.responseValidation === 'logOnly'),
            validateApiSpec: true,
            $refParser: {
                mode: 'dereference',
            },
            operationHandlers: {
                basePath: path.join(__dirname, '../Controllers'),
                resolver: modulePathResolver,
            },
            validateSecurity: {
                handlers: {
                    oauth: auth.validateOauthSecurity,
                },
            },
        })
    );
}

module.exports = configureMiddleware;
