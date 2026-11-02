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

const CHUNK_SIZE = 1000;

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

function toDate(unixSeconds) {
    return new Date(Number(unixSeconds) * 1000);
}

function sightingKey(finding) {
    return `${finding.host.hostKey}|${finding.pluginID}|${finding.port}|${finding.protocol}`;
}

/**
 * Nessus Professional only knows the current scan, so C-PAT records when each
 * host/plugin pair was first and last observed per scan to back firstSeen.
 * Returns true when this history had not been recorded before.
 */
async function recordSightings(snapshot) {
    const { scanId, historyId, scanEnd, findings } = snapshot;

    if (!historyId || !scanEnd) return false;

    return await withConnection(async connection => {
        const [recorded] = await connection.query(`SELECT 1 FROM ${config.database.schema}.nessus_scan_snapshot WHERE scanId = ? AND historyId = ?`, [
            scanId,
            historyId,
        ]);

        if (recorded.length) return false;

        const seen = new Set();
        const rows = [];

        for (const finding of findings) {
            const key = sightingKey(finding);

            if (seen.has(key)) continue;
            seen.add(key);
            rows.push([scanId, finding.host.hostKey, Number(finding.pluginID), finding.port, finding.protocol, toDate(scanEnd), toDate(scanEnd)]);
        }

        await connection.beginTransaction();

        try {
            for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                await connection.query(
                    `INSERT INTO ${config.database.schema}.nessus_sighting (scanId, hostKey, pluginID, port, protocol, firstSeen, lastSeen)
                     VALUES ? AS incoming
                     ON DUPLICATE KEY UPDATE firstSeen = LEAST(firstSeen, incoming.firstSeen), lastSeen = GREATEST(lastSeen, incoming.lastSeen)`,
                    [rows.slice(i, i + CHUNK_SIZE)]
                );
            }

            await connection.query(
                `INSERT INTO ${config.database.schema}.nessus_scan_snapshot (scanId, historyId, scanEnd, recordedAt) VALUES (?, ?, ?, UTC_TIMESTAMP(3))`,
                [scanId, historyId, toDate(scanEnd)]
            );
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        }

        return true;
    });
}

async function loadFirstSeen(scanId) {
    return await withConnection(async connection => {
        const [rows] = await connection.query(
            `SELECT hostKey, pluginID, port, protocol, UNIX_TIMESTAMP(firstSeen) AS firstSeen FROM ${config.database.schema}.nessus_sighting WHERE scanId = ?`,
            [scanId]
        );

        return new Map(rows.map(row => [`${row.hostKey}|${row.pluginID}|${row.port}|${row.protocol}`, String(row.firstSeen)]));
    });
}

/** Records the snapshot's sightings and stamps firstSeen onto its findings. */
async function applySightings(snapshot) {
    try {
        await recordSightings(snapshot);

        const firstSeen = await loadFirstSeen(snapshot.scanId);

        for (const finding of snapshot.findings) {
            const seen = firstSeen.get(sightingKey(finding));

            if (seen) finding.firstSeen = seen;
        }
    } catch (err) {
        logger.writeError('nessus', 'sightings', { scanId: snapshot.scanId, error: serializeError(err) });
    }

    return snapshot;
}

module.exports = { recordSightings, loadFirstSeen, applySightings };
