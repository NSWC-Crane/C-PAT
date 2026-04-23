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
const schedule = require('node-schedule');
const logger = require('../utils/logger');
const poamNotificationService = require('./poamNotificationService');
const healthService = require('./healthService');

const jobs = {};

exports.initializeScheduledTasks = function initializeScheduledTasks() {
    logger.writeInfo('scheduledTasks', 'init', { message: 'Initializing scheduled tasks' });

    healthService.backfillDowntime().catch(error => {
        logger.writeError('scheduledTasks', 'backfillDowntime', {
            message: 'Error during startup downtime backfill',
            error: error.message,
        });
    });

    jobs.poamDeadlineNotifications = schedule.scheduleJob('0 1 * * *', async () => {
        logger.writeInfo('scheduledTasks', 'poamDeadlineNotifications', {
            message: 'Starting daily POAM deadline notification check',
        });

        try {
            const result = await poamNotificationService.checkPoamDeadlineNotifications();
            logger.writeInfo('scheduledTasks', 'poamDeadlineNotifications', {
                message: 'Daily POAM deadline notification check completed',
                result,
            });
        } catch (error) {
            logger.writeError('scheduledTasks', 'poamDeadlineNotifications', {
                message: 'Error during daily POAM deadline notification check',
                error: error.message,
            });
        }
    });

    jobs.healthCheck = schedule.scheduleJob('*/5 * * * *', async () => {
        try {
            await healthService.recordHealthCheck();
        } catch (error) {
            logger.writeError('scheduledTasks', 'healthCheck', {
                message: 'Error recording health check',
                error: error.message,
            });
        }
    });

    jobs.healthCheckPrune = schedule.scheduleJob('0 2 * * *', async () => {
        logger.writeInfo('scheduledTasks', 'healthCheckPrune', { message: 'Pruning old health check records' });
        try {
            await healthService.pruneOldHealthChecks();
        } catch (error) {
            logger.writeError('scheduledTasks', 'healthCheckPrune', {
                message: 'Error pruning health check records',
                error: error.message,
            });
        }
    });

    logger.writeInfo('scheduledTasks', 'init', {
        message: 'Scheduled tasks initialized',
        tasks: [
            {
                name: 'poamDeadlineNotifications',
                schedule: 'Daily at 01:00',
                nextRun: jobs.poamDeadlineNotifications?.nextInvocation()?.toISOString() || 'Not scheduled',
            },
            {
                name: 'healthCheck',
                schedule: 'Every 5 minutes',
                nextRun: jobs.healthCheck?.nextInvocation()?.toISOString() || 'Not scheduled',
            },
            {
                name: 'healthCheckPrune',
                schedule: 'Daily at 02:00',
                nextRun: jobs.healthCheckPrune?.nextInvocation()?.toISOString() || 'Not scheduled',
            },
        ],
    });
};

exports.shutdownScheduledTasks = function shutdownScheduledTasks() {
    logger.writeInfo('scheduledTasks', 'shutdown', { message: 'Shutting down scheduled tasks' });

    for (const [name, job] of Object.entries(jobs)) {
        if (job) {
            job.cancel();
            logger.writeInfo('scheduledTasks', 'shutdown', { message: `Cancelled job: ${name}` });
        }
    }
};

exports.getScheduledTasksStatus = function getScheduledTasksStatus() {
    const status = {};

    for (const [name, job] of Object.entries(jobs)) {
        status[name] = {
            nextRun: job?.nextInvocation()?.toISOString() || null,
            running: job ? true : false,
        };
    }

    return status;
};

exports.runPoamDeadlineNotificationsNow = async function runPoamDeadlineNotificationsNow() {
    logger.writeInfo('scheduledTasks', 'poamDeadlineNotifications', {
        message: 'Manually triggering POAM deadline notification check',
    });

    try {
        const result = await poamNotificationService.checkPoamDeadlineNotifications();
        return result;
    } catch (error) {
        logger.writeError('scheduledTasks', 'poamDeadlineNotifications', {
            message: 'Error during manual POAM deadline notification check',
            error: error.message,
        });
        throw error;
    }
};
