/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const proxy = require('express-http-proxy');
const config = require('./config');
const tenableTls = require('./tenableTls');
const logger = require('./logger');
const SmError = require('./error');
const { stripTrailingSlashes } = require('./url');
const packageJson = require('../package.json');

const FORWARDED_HEADERS = ['content-type', 'accept-encoding'];
const UPSTREAM_PREFIX = '/rest';

function encodeQueryComponent(value) {
    return encodeURIComponent(value).replaceAll('%2C', ',');
}

function buildQueryString(query) {
    const parts = [];

    for (const [key, value] of Object.entries(query || {})) {
        if (value === undefined || value === null) continue;

        const serialized = Array.isArray(value) ? value.join(',') : String(value);

        parts.push(`${encodeQueryComponent(key)}=${encodeQueryComponent(serialized)}`);
    }

    return parts.length ? `?${parts.join('&')}` : '';
}

function describeUpstreamError(err) {
    const message = err?.message ?? String(err);

    return err?.code ? `${message} (${err.code})` : message;
}

function buildProxyHandler(resolveUpstreamPath) {
    return proxy(stripTrailingSlashes(config.tenable.url), {
        timeout: config.tenable.timeout,
        proxyReqPathResolver: function (req) {
            return UPSTREAM_PREFIX + resolveUpstreamPath(req) + buildQueryString(req.query);
        },
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
            const headers = {};

            FORWARDED_HEADERS.forEach(name => {
                const value = srcReq.headers[name];

                if (typeof value === 'string') {
                    headers[name] = value;
                }
            });

            headers['x-apikey'] = `accesskey=${config.tenable.accessKey}; secretkey=${config.tenable.secretKey};`;
            headers['content-type'] = headers['content-type'] || 'application/json';
            headers['user-agent'] = `Integration/${packageJson.version} (NAVSEA; CPAT; Build/${packageJson.version})`;

            proxyReqOpts.headers = headers;
            proxyReqOpts.rejectUnauthorized = false;

            if (tenableTls.clientCert) {
                proxyReqOpts.cert = tenableTls.clientCert;
            }
            if (tenableTls.clientKey) {
                proxyReqOpts.key = tenableTls.clientKey;
            }

            return proxyReqOpts;
        },
        userResDecorator: function (_proxyRes, proxyResData) {
            return proxyResData;
        },
        proxyErrorHandler: function (err, res, next) {
            const detail = `Tenable request failed: ${describeUpstreamError(err)}`;

            logger.writeError('tenable', 'upstream', { message: detail, request: logger.serializeRequest(res.req) });
            next(new SmError.BadGatewayError(detail));
        },
    });
}

function createTenableProxy(resolveUpstreamPath) {
    let handler;

    return function (req, res, next) {
        if (!config.tenable.enabled || !stripTrailingSlashes(config.tenable.url)) {
            return next(new SmError.ServiceUnavailableError('The Tenable integration is not configured for this deployment.'));
        }

        handler ??= buildProxyHandler(resolveUpstreamPath);

        return handler(req, res, next);
    };
}

module.exports = { createTenableProxy };
