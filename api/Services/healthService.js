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
const config = require('../utils/config');
const dbUtils = require('./utils');
const logger = require('../utils/logger');
const { serializeError } = require('../utils/serializeError');
const state = require('../utils/state');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

async function checkExternalService(url, timeoutMs = 15_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response.ok ? 1 : 0;
    } catch (err) {
        logger.writeError('healthcheck', 'externalServiceCheckFailed', {
            url,
            timeoutMs,
            error: serializeError(err),
        });
        return 0;
    } finally {
        clearTimeout(timer);
    }
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

    const stigmanBaseUrl = config.stigman.apiUrl.replace(/\/+$/, '');
    const tenableBaseUrl = config.tenable.url.replace(/\/+$/, '');
    const stigmanStatus = config.stigman.enabled ? await checkExternalService(`${stigmanBaseUrl}/op/configuration`) : null;

    const tenableStatus = config.tenable.enabled ? await checkExternalService(`${tenableBaseUrl}/rest/system`) : null;

    try {
        await withConnection(async connection => {
            await connection.query(
                `INSERT INTO ${config.database.schema}.healthcheck (checked_at, status, response_ms, db_status, oidc_status, stigman_status, tenable_status) VALUES (UTC_TIMESTAMP(3), ?, ?, ?, ?, ?, ?)`,
                [systemUp, response_ms, dbUp ? 1 : 0, oidcUp, stigmanStatus, tenableStatus]
            );
        });
    } catch {}
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

            if (t < earliest) t = new Date(earliest.getTime());

            const limit = new Date(now.getTime() - INTERVAL_MS);

            if (t > limit) return;

            const timestamps = [];
            while (t <= limit) {
                timestamps.push(new Date(t));
                t = new Date(t.getTime() + INTERVAL_MS);
            }

            if (!timestamps.length) return;

            // status=0: C-PAT was definitely down.
            // response_ms=null serves as the backfill marker as real recordHealthCheck rows always have a response_ms.
            // db_status/oidc_status=0: NOT NULL columns use 0. Detection is via response_ms.
            const values = timestamps.map(ts => [ts, 0, null, 0, 0, null, null]);
            await connection.query(
                `INSERT INTO ${config.database.schema}.healthcheck
                 (checked_at, status, response_ms, db_status, oidc_status, stigman_status, tenable_status)
                 VALUES ?`,
                [values]
            );
        });
    } catch {}
};

exports.pruneOldHealthChecks = async function pruneOldHealthChecks() {
    try {
        await withConnection(async connection => {
            await connection.query(`DELETE FROM ${config.database.schema}.healthcheck WHERE checked_at < UTC_TIMESTAMP(3) - INTERVAL 31 DAY`);
        });
    } catch {}
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

        const computeUptime = rows => {
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
        };

        const result = {
            cpat: {
                currentStatus: latest ? (latest.status === 1 ? 'operational' : 'outage') : 'unknown',
                uptimePercent: computeUptime(cpatRows),
                checks: cpatRows.map(r => ({
                    date: r.date,
                    status: r.status,
                    downtimeMinutes: Number(r.downtimeMinutes),
                })),
            },
            oidc: {
                currentStatus: latestIsBackfill ? 'unknown' : latest ? (latest.oidc_status === 1 ? 'operational' : 'outage') : 'unknown',
                uptimePercent: computeUptime(oidcRows),
                checks: oidcRows.map(r => ({
                    date: r.date,
                    status: r.status,
                    downtimeMinutes: Number(r.downtimeMinutes),
                    unknownMinutes: Number(r.unknownMinutes),
                })),
            },
            responseTimeSeries: responseRows.map(r => ({
                timestamp: r.timestamp,
                response_ms: r.response_ms,
            })),
        };

        if (config.stigman.enabled) {
            const [stigmanRows] = await connection.query(`
                SELECT
                    DATE(checked_at) AS date,
                    CASE WHEN MAX(CASE WHEN response_ms IS NULL THEN 1 ELSE 0 END) = 1
                         THEN NULL
                         ELSE MIN(stigman_status) END AS status,
                    SUM(CASE WHEN stigman_status = 0 AND response_ms IS NOT NULL THEN 5 ELSE 0 END) AS downtimeMinutes,
                    SUM(CASE WHEN response_ms IS NULL THEN 5 ELSE 0 END) AS unknownMinutes
                FROM ${config.database.schema}.healthcheck
                WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
                GROUP BY DATE(checked_at)
                ORDER BY date ASC
            `);

            const latestStigman = latest?.stigman_status;
            result.stigman = {
                available: true,
                currentStatus: latestIsBackfill ? 'unknown' : latestStigman == null ? 'unknown' : latestStigman === 1 ? 'operational' : 'outage',
                uptimePercent: computeUptime(stigmanRows),
                checks: stigmanRows.map(r => ({
                    date: r.date,
                    status: r.status,
                    downtimeMinutes: Number(r.downtimeMinutes),
                    unknownMinutes: Number(r.unknownMinutes),
                })),
            };
        }

        if (config.tenable.enabled) {
            const [tenableRows] = await connection.query(`
                SELECT
                    DATE(checked_at) AS date,
                    CASE WHEN MAX(CASE WHEN response_ms IS NULL THEN 1 ELSE 0 END) = 1
                         THEN NULL
                         ELSE MIN(tenable_status) END AS status,
                    SUM(CASE WHEN tenable_status = 0 AND response_ms IS NOT NULL THEN 5 ELSE 0 END) AS downtimeMinutes,
                    SUM(CASE WHEN response_ms IS NULL THEN 5 ELSE 0 END) AS unknownMinutes
                FROM ${config.database.schema}.healthcheck
                WHERE checked_at >= UTC_DATE() - INTERVAL 30 DAY
                GROUP BY DATE(checked_at)
                ORDER BY date ASC
            `);

            const latestTenable = latest?.tenable_status;
            result.tenable = {
                available: true,
                currentStatus: latestIsBackfill ? 'unknown' : latestTenable == null ? 'unknown' : latestTenable === 1 ? 'operational' : 'outage',
                uptimePercent: computeUptime(tenableRows),
                checks: tenableRows.map(r => ({
                    date: r.date,
                    status: r.status,
                    downtimeMinutes: Number(r.downtimeMinutes),
                    unknownMinutes: Number(r.unknownMinutes),
                })),
            };
        }

        return result;
    });
};
