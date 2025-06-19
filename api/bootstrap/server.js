/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const http = require('node:http');
const logger = require('../utils/logger');
const state = require('../utils/state');
const OperationSvc = require(`../Services/operationService`);
const { serializeError } = require('../utils/serializeError');
const config = require('../utils/config');
const { initializeDependencies } = require('./dependencies');

async function startServer(app, startTime) {
    const server = http.createServer(app);
    const onListenError = e => {
        logger.writeError('server', 'shutdown', {
            message: `Server failed establishing or while listening on port ${config.http.port}`,
            error: serializeError(e),
        });
        state.setState('fail');
    };
    server.on('error', onListenError);

    server.listen(config.http.port, async function () {
        server.removeListener('error', onListenError);
        logger.writeInfo('server', 'listening', {
            port: config.http.port,
            api: '/api',
            client: config.client.disabled ? undefined : '/',
            documentation: config.docs.disabled ? undefined : '/docs',
            swagger: config.swaggerUi.enabled ? '/api-docs' : undefined,
        });
        await initializeDependencies();
        await applyConfigurationSettings();
        logStartupDuration(startTime);
    });
}

async function applyConfigurationSettings() {
    if (config.settings.setClassification) {
        await OperationSvc.setConfigurationItem(
            'classification',
            config.settings.dodDeployment ? config.settings.setClassification : 'NONE'
        );
    }
    if (config.version) {
        await OperationSvc.setConfigurationItem('version', config.version);
    }
}

function logStartupDuration(startTime) {
    const endTime = process.hrtime.bigint();
    logger.writeInfo('server', 'started', {
        durationS: Number(endTime - startTime) / 1e9,
    });
}

module.exports = startServer;
