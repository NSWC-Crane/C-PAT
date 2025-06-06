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
const startTime = process.hrtime.bigint()
const express = require('express')
const logger = require('./utils/logger')
const state = require('./utils/state')
const signals = require('./bootstrap/signals')
const config = require('./utils/config')
const { serializeError } = require('./utils/serializeError')
const configureMiddleware = require('./bootstrap/middlewares.js')
const bootstrapUtils = require('./bootstrap/bootstrapUtils.js')
const client = require('./bootstrap/client.js')
const docs = require('./bootstrap/docs.js')
const startServer = require('./bootstrap/server')

signals.setupSignalHandlers()
bootstrapUtils.logAppConfig(config)

process.on('uncaughtException', (err, origin) => {
    logger.writeError('app', 'uncaught', serializeError(err))
})
process.on('unhandledRejection', (reason, promise) => {
    logger.writeError('app', 'unhandled', { reason, promise })
})

const app = express()
run()

function run() {
    try {
        docs.initializeApiSpec()
        configureMiddleware(app, config)

        client.serveClient(app)
        docs.serveDocs(app)
        docs.serveApiDocs(app)
        startServer(app, startTime)
    }
    catch (err) {
        logger.writeError('app', 'fatal', { message: err.message, stack: err.stack })
        state.setState('fail')
    }
}