/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const { v1: uuidv1 } = require('uuid');
const onFinished = require('on-finished');
const onHeaders = require('on-headers');
const config = require('./config');

const _log = console.log;
for (const method of ['log', 'error', 'warn', 'trace', 'debug']) {
    console[method] = function () {
        writeError('logger', 'consoleIntercept', { method, arguments });
    };
}

const writeDebug =
    config.log.level == 4
        ? function writeDebug() {
              write(4, ...arguments);
          }
        : () => {};

const writeInfo =
    config.log.level >= 3
        ? function writeInfo() {
              write(3, ...arguments);
          }
        : () => {};

const writeWarn =
    config.log.level >= 2
        ? function writeWarn() {
              write(2, ...arguments);
          }
        : () => {};

const writeError =
    config.log.level >= 1
        ? function writeError() {
              write(1, ...arguments);
          }
        : () => {};

const requestStats = {
    totalRequests: 0,
    totalApiRequests: 0,
    totalRequestDuration: 0,
    operationIds: {},
};

async function write(level, component, type, data) {
    try {
        const date = new Date().toISOString();
        _log(JSON.stringify({ date, level, component, type, data }));
    } catch (e) {
        const date = new Date().toISOString();
        _log(JSON.stringify({ date, level: 1, component: 'logger', type: 'error', data: { message: e.message, stack: e.stack } }));
    }
}

const atob = data => Buffer.from(data, 'base64').toString('ascii');

const serializeUserObject = ({ username, display, privileges }) => ({ username, fullname: display, privileges });

function sanitizeHeaders() {
    let { authorization, ...headers } = this;
    if (authorization !== undefined) {
        headers.authorization = true;
        if (config.log.mode !== 'combined') {
            const payload = authorization.match(/^Bearer [[A-Za-z0-9-_=]+\.([[A-Za-z0-9-_=]+?)\./)?.[1];
            if (payload) {
                headers.accessToken = JSON.parse(atob(payload));
            }
        }
    } else {
        headers.authorization = false;
    }
    return headers;
}

function serializeRequest(req) {
    req.headers.toJSON = sanitizeHeaders;
    if (config.log.mode === 'combined') {
        req.headers.accessToken = req.access_token;
    }
    return {
        requestId: req.requestId,
        date: req._startTime,
        source: req.ip,
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.query.elevate === true || req.query.elevate === 'true' || config.log.level === 4 ? req.body : undefined,
    };
}

function recordStartTime() {
    this._startTime = new Date();
}

function requestLogger(req, res, next) {
    req._startAt = undefined;
    req._startTime = undefined;
    res._startAt = undefined;
    res._startTime = undefined;
    res.svcStatus = {};

    let responseBody;
    res.sm_responseLength = 0;
    responseBody = '';
    const originalSend = res.send;
    res.send = function (chunk) {
        if (chunk !== undefined) {
            if (req.query.elevate === true || req.query.elevate === 'true') {
                responseBody += chunk;
            }
            res.sm_responseLength += chunk.length || 0;
        }
        originalSend.apply(res, arguments);
        res.end();
    };

    recordStartTime.call(req);

    function logRequest() {
        req.requestId = uuidv1();
        writeInfo('rest', 'request', serializeRequest(req));
    }

    function logResponse() {
        res._startTime = res._startTime ?? new Date();
        requestStats.totalRequests += 1;
        const durationMs = Number(res._startTime - req._startTime);

        requestStats.totalRequestDuration += durationMs;
        const operationId = res.req.openapi?.schema.operationId;
        let operationStats = {
            operationId,
            retries: res.svcStatus?.retries,
            durationMs,
        };

        if (operationId) {
            trackOperationStats(operationId, durationMs, res);
            if (config.log.optStats) {
                operationStats = {
                    ...operationStats,
                    ...requestStats.operationIds[operationId],
                };
            }
        }

        if (config.log.mode === 'combined') {
            writeInfo(req.component || 'rest', 'transaction', {
                request: serializeRequest(res.req),
                response: {
                    date: res._startTime,
                    status: res.finished ? res.statusCode : undefined,
                    clientTerminated: res.destroyed ? true : undefined,
                    headers: res.finished ? res.getHeaders() : undefined,
                    errorBody: res.errorBody,
                    responseBody,
                },
                operationStats,
            });
        } else {
            writeInfo(req.component || 'rest', 'response', {
                requestId: res.req.requestId,
                status: res.statusCode,
                headers: res.getHeaders(),
                errorBody: res.errorBody,
                operationStats,
            });
        }
    }

    if (config.log.mode !== 'combined') {
        logRequest();
    }
    onHeaders(res, recordStartTime);
    onFinished(res, logResponse);
    next();
}

function serializeEnvironment() {
    let env = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (/^(NODE|CPAT)_/.test(key)) {
            env[key] = key === 'CPAT_DB_PASSWORD' ? '*' : value;
        }
    }
    return env;
}

function trackOperationStats(operationId, durationMs, res) {
    const acceptsRequestBody = res.req.method === 'POST' || res.req.method === 'PUT' || res.req.method === 'PATCH';

    requestStats.totalApiRequests++;

    if (!requestStats.operationIds[operationId]) {
        requestStats.operationIds[operationId] = {
            totalRequests: 0,
            totalDuration: 0,
            elevatedRequests: 0,
            minDuration: Infinity,
            maxDuration: 0,
            maxDurationUpdates: 0,
            retried: 0,
            averageRetries: 0,
            totalResLength: 0,
            minResLength: Infinity,
            maxResLength: 0,
            clients: {},
            users: {},
            errors: {},
        };
        if (acceptsRequestBody) {
            requestStats.operationIds[operationId].totalReqLength = 0;
            requestStats.operationIds[operationId].minReqLength = Infinity;
            requestStats.operationIds[operationId].maxReqLength = 0;
        }
    }

    const stats = requestStats.operationIds[operationId];

    if (res.statusCode >= 500) {
        const code = res.errorBody?.code || 'nocode';
        stats.errors[code] = (stats.errors[code] || 0) + 1;
    }

    stats.minDuration = Math.min(stats.minDuration, durationMs);
    if (durationMs > stats.maxDuration) {
        stats.maxDuration = durationMs;
        stats.maxDurationUpdates++;
    }

    stats.totalRequests++;
    stats.totalDuration += durationMs;
    stats.totalResLength += res.sm_responseLength;
    stats.minResLength = Math.min(stats.minResLength, res.sm_responseLength);

    if (res.sm_responseLength > stats.maxResLength) {
        stats.maxResLength = res.sm_responseLength;
    }

    if (acceptsRequestBody) {
        const requestLength = parseInt(res.req.headers['content-length'] ?? '0');
        stats.totalReqLength += requestLength;
        stats.minReqLength = Math.min(stats.minReqLength, requestLength);
        if (requestLength > stats.maxReqLength) {
            stats.maxReqLength = requestLength;
        }
    }

    if (res.svcStatus?.retries) {
        stats.retried++;
        stats.averageRetries = runningAverage({
            currentAvg: stats.averageRetries,
            counter: stats.retried,
            newValue: res.svcStatus.retries,
        });
    }

    let userId = res.req.userObject?.userId || 'unknown';
    stats.users[userId] = (stats.users[userId] || 0) + 1;

    let client = res.req.access_token?.azp || 'unknown';
    stats.clients[client] = (stats.clients[client] || 0) + 1;

    if (res.req.query?.elevate === true) {
        stats.elevatedRequests = (stats.elevatedRequests || 0) + 1;
    }

    if (res.req.query?.projection?.length > 0) {
        stats.projections = stats.projections || {};
        for (const projection of res.req.query.projection) {
            stats.projections[projection] = stats.projections[projection] || {
                totalRequests: 0,
                minDuration: Infinity,
                maxDuration: 0,
                totalDuration: 0,
                retried: 0,
                averageRetries: 0,
                get averageDuration() {
                    return this.totalRequests ? Math.round(this.totalDuration / this.totalRequests) : 0;
                },
            };

            const projStats = stats.projections[projection];
            projStats.totalRequests++;
            projStats.minDuration = Math.min(projStats.minDuration, durationMs);
            projStats.maxDuration = Math.max(projStats.maxDuration, durationMs);
            projStats.totalDuration += durationMs;

            if (res.svcStatus?.retries) {
                projStats.retried++;
                projStats.averageRetries =
                    projStats.averageRetries + (res.svcStatus.retries - projStats.averageRetries) / projStats.retried;
            }
        }
    }

    function runningAverage({ currentAvg, counter, newValue }) {
        return currentAvg + (newValue - currentAvg) / counter;
    }
}

module.exports = {
    requestLogger,
    sanitizeHeaders,
    serializeRequest,
    serializeEnvironment,
    writeError,
    writeWarn,
    writeInfo,
    writeDebug,
    requestStats,
};
