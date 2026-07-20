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
const http = require('node:http');
const https = require('node:https');
const config = require('../utils/config');
const dbUtils = require('./utils');
const logger = require('../utils/logger');
const { serializeError } = require('../utils/serializeError');
const state = require('../utils/state');
const tenableTls = require('../utils/tenableTls');

function stripTrailingSlashes(url) {
    let end = url.length;
    while (end > 0 && url.codePointAt(end - 1) === 47) end--;
    return url.slice(0, end);
}

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

const CHECK_INTERVAL_MIN = 5;

function dateKey(d) {
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return String(d);
}

function coalesceMinutePoints(rows) {
    const byDate = new Map();
    let current = null;
    const flush = () => {
        if (!current) return;
        const list = byDate.get(current.date) ?? [];
        list.push({ startMinute: current.startMinute, endMinute: current.endMinute });
        byDate.set(current.date, list);
    };
    for (const r of rows) {
        const m = Number(r.minuteOfDay);
        if (current && current.date === r.date && current.endMinute === m) {
            current.endMinute = m + CHECK_INTERVAL_MIN;
        } else {
            flush();
            current = { date: r.date, startMinute: m, endMinute: m + CHECK_INTERVAL_MIN };
        }
    }
    flush();
    return byDate;
}

function buildChecks(rows, outagesByDate, unknownsByDate, includeUnknownMinutes) {
    return rows.map(r => {
        const key = dateKey(r.date);
        const check = {
            date: r.date,
            status: r.status,
            downtimeMinutes: Number(r.downtimeMinutes),
            outages: outagesByDate.get(key) ?? [],
        };
        if (includeUnknownMinutes) {
            check.unknownMinutes = Number(r.unknownMinutes);
            check.unknowns = unknownsByDate.get(key) ?? [];
        }
        return check;
    });
}

function resolveServiceStatus(latestValue, latestIsBackfill) {
    if (latestIsBackfill || latestValue == null) return 'unknown';
    return latestValue === 1 ? 'operational' : 'outage';
}

function resolveCpatStatus(latest) {
    if (!latest) return 'unknown';
    return latest.status === 1 ? 'operational' : 'outage';
}

function computeUptime(rows) {
    let totalKnownMinutes = 0;
    let totalDowntimeMinutes = 0;
    for (const r of rows) {
        const unknownMins = Number(r.unknownMinutes ?? 0);
        const knownMins = 1440 - unknownMins;
        if (knownMins <= 0) continue;
        totalKnownMinutes += knownMins;
        totalDowntimeMinutes += Number(r.downtimeMinutes);
    }
    if (totalKnownMinutes === 0) return null;
    return Number.parseFloat((((totalKnownMinutes - totalDowntimeMinutes) / totalKnownMinutes) * 100).toFixed(2));
}

async function checkStigManager(url, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response.ok ? 1 : 0;
    } catch (err) {
        logger.writeError('healthcheck', 'stigManagerHealthCheckFailed', {
            url,
            timeoutMs,
            error: serializeError(err),
        });
        return 0;
    } finally {
        clearTimeout(timer);
    }
}

function checkTenable(url, timeoutMs = 30_000) {
    return new Promise(resolve => {
        const isHttps = new URL(url).protocol === 'https:';
        const client = isHttps ? https : http;
        const requestOptions = { timeout: timeoutMs };
        if (isHttps) {
            requestOptions.rejectUnauthorized = false;
            if (tenableTls.clientCert) {
                requestOptions.cert = tenableTls.clientCert;
            }
            if (tenableTls.clientKey) {
                requestOptions.key = tenableTls.clientKey;
            }
        }

        const handleFailure = err => {
            logger.writeError('healthcheck', 'tenableHealthCheckFailed', {
                url,
                timeoutMs,
                error: serializeError(err),
            });
            resolve(0);
        };

        try {
            const req = client.request(url, requestOptions, res => {
                const ok = res.statusCode >= 200 && res.statusCode < 300;
                res.resume();
                resolve(ok ? 1 : 0);
            });
            req.on('timeout', () => req.destroy(new Error(`Request timed out after ${timeoutMs}ms`)));
            req.on('error', handleFailure);
            req.end();
        } catch (err) {
            handleFailure(err);
        }
    });
}

exports.recordHealthCheck = async function recordHealthCheck() {
    const start = Date.now();
    let dbUp = false;
    let response_ms = null;

    try {
        await withConnection(async connection => {
            await connection.query('SELECT 1');
            response_ms = Date.now() - start;
            dbUp = true;
        });
    } catch {
        dbUp = false;
    }

    if (!dbUp) return;

    await exports.backfillDowntime();

    const oidcUp = state.dependencyStatus.oidc ? 1 : 0;
    const systemUp = dbUp && oidcUp ? 1 : 0;

    const stigmanBaseUrl = stripTrailingSlashes(config.stigman.apiUrl);
    const tenableBaseUrl = stripTrailingSlashes(config.tenable.url);
    const stigmanStatus = config.stigman.enabled ? await checkStigManager(`${stigmanBaseUrl}/op/configuration`) : null;

    const tenableStatus = config.tenable.enabled ? await checkTenable(`${tenableBaseUrl}/rest/system`) : null;

    try {
        await withConnection(async connection => {
            await connection.query(
                `INSERT INTO ${config.database.schema}.healthcheck (checked_at, status, response_ms, db_status, oidc_status, stigman_status, tenable_status) VALUES (UTC_TIMESTAMP(3), ?, ?, ?, ?, ?, ?)`,
                [systemUp, response_ms, dbUp ? 1 : 0, oidcUp, stigmanStatus, tenableStatus]
            );
        });
    } catch (err) {
        logger.writeError('healthcheck', 'recordHealthCheckFailed', { error: serializeError(err) });
    }
};

exports.backfillDowntime = async function backfillDowntime() {
    const INTERVAL_MS = 5 * 60 * 1000;
    const MAX_LOOKBACK_MS = 31 * 24 * 60 * 60 * 1000;

    try {
        await withConnection(async connection => {
            const [rows] = await connection.query(`SELECT checked_at FROM ${config.database.schema}.healthcheck ORDER BY checked_at DESC LIMIT 1`);

            if (!rows.length) return;

            const lastCheck = new Date(rows[0].checked_at);
            const now = new Date();
            const earliest = new Date(now.getTime() - MAX_LOOKBACK_MS);
            let t = new Date(lastCheck.getTime() + INTERVAL_MS);

            if (t < earliest) t = earliest;

            const limit = new Date(now.getTime() - INTERVAL_MS);

            if (t > limit) return;

            const timestamps = [];
            while (t <= limit) {
                timestamps.push(new Date(t));
                t = new Date(t.getTime() + INTERVAL_MS);
            }

            if (!timestamps.length) return;

            const values = timestamps.map(ts => [ts, 0, null, 0, 0, null, null]);
            await connection.query(
                `INSERT INTO ${config.database.schema}.healthcheck
                 (checked_at, status, response_ms, db_status, oidc_status, stigman_status, tenable_status)
                 VALUES ?`,
                [values]
            );
        });
    } catch (err) {
        logger.writeError('healthcheck', 'backfillDowntimeFailed', { error: serializeError(err) });
    }
};

exports.pruneOldHealthChecks = async function pruneOldHealthChecks() {
    try {
        await withConnection(async connection => {
            await connection.query(`DELETE FROM ${config.database.schema}.healthcheck WHERE checked_at < UTC_TIMESTAMP(3) - INTERVAL 31 DAY`);
        });
    } catch (err) {
        logger.writeError('healthcheck', 'pruneOldHealthChecksFailed', { error: serializeError(err) });
    }
};

exports.getUptimeStatus = async function getUptimeStatus() {
    return await withConnection(async connection => {
        const [cpatRows] = await connection.query(`
            SELECT
                DATE(checked_at) AS date,
                MIN(status) AS status,
                SUM(CASE WHEN status = 0 THEN 5 ELSE 0 END) AS downtimeMinutes
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
            GROUP BY DATE(checked_at)
            ORDER BY date ASC
        `);

        const [cpatOutagePoints] = await connection.query(`
            SELECT
                DATE_FORMAT(checked_at, '%Y-%m-%d') AS date,
                HOUR(checked_at) * 60 + MINUTE(checked_at) AS minuteOfDay
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
              AND status = 0
            ORDER BY checked_at ASC
        `);

        const [oidcRows] = await connection.query(`
            SELECT
                DATE(checked_at) AS date,
                CASE WHEN MAX(CASE WHEN response_ms IS NULL THEN 1 ELSE 0 END) = 1
                     THEN NULL
                     ELSE MIN(oidc_status) END AS status,
                SUM(CASE WHEN oidc_status = 0 AND response_ms IS NOT NULL THEN 5 ELSE 0 END) AS downtimeMinutes,
                SUM(CASE WHEN response_ms IS NULL THEN 5 ELSE 0 END) AS unknownMinutes
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
            GROUP BY DATE(checked_at)
            ORDER BY date ASC
        `);

        const [oidcOutagePoints] = await connection.query(`
            SELECT
                DATE_FORMAT(checked_at, '%Y-%m-%d') AS date,
                HOUR(checked_at) * 60 + MINUTE(checked_at) AS minuteOfDay
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
              AND oidc_status = 0 AND response_ms IS NOT NULL
            ORDER BY checked_at ASC
        `);

        const [unknownPoints] = await connection.query(`
            SELECT
                DATE_FORMAT(checked_at, '%Y-%m-%d') AS date,
                HOUR(checked_at) * 60 + MINUTE(checked_at) AS minuteOfDay
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
              AND response_ms IS NULL
            ORDER BY checked_at ASC
        `);

        const [responseRows] = await connection.query(`
            SELECT checked_at AS timestamp, response_ms
            FROM ${config.database.schema}.healthcheck
            WHERE checked_at >= UTC_TIMESTAMP(3) - INTERVAL 24 HOUR
            ORDER BY checked_at ASC
        `);

        const [latestRows] = await connection.query(`
            SELECT status, oidc_status, stigman_status, tenable_status, response_ms
            FROM ${config.database.schema}.healthcheck
            ORDER BY checked_at DESC
            LIMIT 1
        `);

        const latest = latestRows[0] || null;
        const latestIsBackfill = latest?.response_ms == null && latest?.status === 0;

        const cpatOutages = coalesceMinutePoints(cpatOutagePoints);
        const oidcOutages = coalesceMinutePoints(oidcOutagePoints);
        const unknowns = coalesceMinutePoints(unknownPoints);

        const result = {
            cpat: {
                currentStatus: resolveCpatStatus(latest),
                uptimePercent: computeUptime(cpatRows),
                checks: buildChecks(cpatRows, cpatOutages, null, false),
            },
            oidc: {
                currentStatus: resolveServiceStatus(latest?.oidc_status, latestIsBackfill),
                uptimePercent: computeUptime(oidcRows),
                checks: buildChecks(oidcRows, oidcOutages, unknowns, true),
            },
            responseTimeSeries: responseRows.map(r => ({
                timestamp: r.timestamp,
                response_ms: r.response_ms,
            })),
        };

        if (config.stigman.enabled) {
            result.stigman = await buildOptionalService(connection, {
                column: 'stigman_status',
                latestValue: latest?.stigman_status,
                latestIsBackfill,
                unknowns,
            });
        }

        if (config.tenable.enabled) {
            result.tenable = await buildOptionalService(connection, {
                column: 'tenable_status',
                latestValue: latest?.tenable_status,
                latestIsBackfill,
                unknowns,
            });
        }

        return result;
    });
};

async function buildOptionalService(connection, { column, latestValue, latestIsBackfill, unknowns }) {
    const [aggregateRows] = await connection.query(`
        SELECT
            DATE(checked_at) AS date,
            CASE WHEN MAX(CASE WHEN response_ms IS NULL THEN 1 ELSE 0 END) = 1
                 THEN NULL
                 ELSE MIN(${column}) END AS status,
            SUM(CASE WHEN ${column} = 0 AND response_ms IS NOT NULL THEN 5 ELSE 0 END) AS downtimeMinutes,
            SUM(CASE WHEN response_ms IS NULL THEN 5 ELSE 0 END) AS unknownMinutes
        FROM ${config.database.schema}.healthcheck
        WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
        GROUP BY DATE(checked_at)
        ORDER BY date ASC
    `);

    const [outagePoints] = await connection.query(`
        SELECT
            DATE_FORMAT(checked_at, '%Y-%m-%d') AS date,
            HOUR(checked_at) * 60 + MINUTE(checked_at) AS minuteOfDay
        FROM ${config.database.schema}.healthcheck
        WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
          AND ${column} = 0 AND response_ms IS NOT NULL
        ORDER BY checked_at ASC
    `);

    return {
        available: true,
        currentStatus: resolveServiceStatus(latestValue, latestIsBackfill),
        uptimePercent: computeUptime(aggregateRows),
        checks: buildChecks(aggregateRows, coalesceMinutePoints(outagePoints), unknowns, true),
    };
}
