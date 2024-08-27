/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const uuid = require('uuid')
const onFinished = require('on-finished')
const onHeaders = require('on-headers')
const config = require('./config')


const _log = console.log
for (const method of ['log', 'error', 'warn', 'trace', 'debug']) {
    console[method] = function () {
        writeError('logger', 'consoleIntercept', { method, arguments })
    }
}

const writeDebug = config.log.level == 4 ? function writeDebug() {
    write(4, ...arguments)
} : () => { }

const writeInfo = config.log.level >= 3 ? function writeInfo() {
    write(3, ...arguments)
} : () => { }

const writeWarn = config.log.level >= 2 ? function writeWarn() {
    write(2, ...arguments)
} : () => { }

const writeError = config.log.level >= 1 ? function writeError() {
    write(1, ...arguments)
} : () => { }


async function write(level, component, type, data) {
    try {
        const date = new Date().toISOString()
        _log(JSON.stringify({ date, level, component, type, data }))
    }
    catch (e) {
        const date = new Date().toISOString()
        _log(JSON.stringify({ date, level: 1, component: 'logger', type: 'error', data: { message: e.message, stack: e.stack } }))
    }
}

const atob = (data) => Buffer.from(data, 'base64').toString('ascii')

const serializeUserObject = ({ username, display, privileges }) => ({ username, fullname: display, privileges })

function sanitizeHeaders() {
    let { authorization, ...headers } = this
    if (authorization !== undefined) {
        headers.authorization = true
        if (config.log.mode !== 'combined') {
            const payload = authorization.match(/^Bearer [[A-Za-z0-9-_=]+\.([[A-Za-z0-9-_=]+?)\./)?.[1]
            if (payload) {
                headers.accessToken = JSON.parse(atob(payload))
            }
        }
    }
    else {
        headers.authorization = false
    }
    return headers
}

function serializeRequest(req) {
    req.headers.toJSON = sanitizeHeaders
    if (config.log.mode === 'combined') {
        req.headers.accessToken = req.access_token
    }
    return {
        requestId: req.requestId,
        date: req._startTime,
        source: req.ip,
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.query.elevate === true || req.query.elevate === 'true' || config.log.level === 4 ? req.body : undefined
    }
}

function recordStartTime() {
    this._startTime = new Date()
}

function requestLogger(req, res, next) {

    req._startAt = undefined;
    req._startTime = undefined;
    res._startAt = undefined;
    res._startTime = undefined;
    res.svcStatus = {};

    let responseBody;
    if (req.query.elevate === true || req.query.elevate === 'true') {
        responseBody = ''
        const originalSend = res.send
        res.send = function (chunk) {
            responseBody += chunk
            originalSend.apply(res, arguments)
            res.end()
        }
    }

    recordStartTime.call(req)

    function logRequest() {
        req.requestId = uuid.v1()
        writeInfo('rest', 'request', serializeRequest(req))
    }

    function logResponse() {
        res._startTime = res._startTime ?? new Date()
        if (config.log.mode === 'combined') {
            writeInfo(req.component || 'rest', 'transaction', {
                request: serializeRequest(res.req),
                response: {
                    date: res._startTime,
                    status: res.finished ? res.statusCode : undefined,
                    clientTerminated: res.destroyed ? true : undefined,
                    headers: res.finished ? res.getHeaders() : undefined,
                    errorBody: res.errorBody,
                    responseBody
                },
                retries: res.svcStatus?.retries,
                durationMs: Number(res._startTime - req._startTime)
            })
        }
        else {
            writeInfo(req.component || 'rest', 'response', {
                requestId: res.req.requestId,
                status: res.statusCode,
                headers: res.getHeaders(),
                errorBody: res.errorBody,
                retries: res.svcStatus?.retries,
            })
        }
    }

    if (config.log.mode !== 'combined') {
        logRequest()
    }
    onHeaders(res, recordStartTime)
    onFinished(res, logResponse)
    next()
}

function serializeEnvironment() {
    let env = {}
    for (const [key, value] of Object.entries(process.env)) {
        if (/^(NODE|CPAT)_/.test(key)) {
            env[key] = key === 'CPAT_DB_PASSWORD' ? '*' : value
        }
    }
    return env
}

module.exports = {
    requestLogger,
    sanitizeHeaders,
    serializeRequest,
    serializeEnvironment,
    writeError,
    writeWarn,
    writeInfo,
    writeDebug
}