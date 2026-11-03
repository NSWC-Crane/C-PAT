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
const config = require('./config');
const nessusTls = require('./nessusTls');
const logger = require('./logger');
const SmError = require('./error');
const { stripTrailingSlashes } = require('./url');
const packageJson = require('../package.json');

const MAX_CONCURRENT_REQUESTS = 3;
const EXPORT_POLL_INTERVAL_MS = 2000;

function describeError(err) {
    const message = err?.message ?? String(err);

    return err?.code ? `${message} (${err.code})` : message;
}

/**
 * Thin HTTP client for the Nessus Professional REST API. Unlike the Tenable.sc
 * proxy, responses are consumed by the API itself, so this returns parsed bodies.
 */
class NessusClient {
    constructor({ settings = config.nessus, tls = nessusTls } = {}) {
        this.settings = settings;
        this.tls = tls;
        this.active = 0;
        this.queue = [];
    }

    get enabled() {
        return !!this.settings.enabled && !!stripTrailingSlashes(this.settings.url);
    }

    assertEnabled() {
        if (!this.enabled) {
            throw new SmError.ServiceUnavailableError(
                'The Nessus integration is not configured for this deployment (NESSUS_URL, NESSUS_ACCESS_KEY and NESSUS_SECRET_KEY are required).'
            );
        }
    }

    async request(method, path, { query, body, responseType = 'json' } = {}) {
        this.assertEnabled();
        await this.acquire();

        try {
            return await this.send(method, path, { query, body, responseType });
        } finally {
            this.release();
        }
    }

    acquire() {
        if (this.active < MAX_CONCURRENT_REQUESTS) {
            this.active += 1;

            return Promise.resolve();
        }

        return new Promise(resolve => this.queue.push(resolve));
    }

    release() {
        const next = this.queue.shift();

        if (next) next();
        else this.active -= 1;
    }

    buildUrl(path, query) {
        const url = new URL(stripTrailingSlashes(this.settings.url) + path);

        for (const [key, value] of Object.entries(query || {})) {
            if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
        }

        return url;
    }

    requestOptions(method, payload) {
        const headers = {
            accept: 'application/json',
            'x-apikeys': `accessKey=${this.settings.accessKey}; secretKey=${this.settings.secretKey}`,
            'user-agent': `Integration/${packageJson.version} (NAVSEA; CPAT; Build/${packageJson.version})`,
        };

        if (payload) {
            headers['content-type'] = 'application/json';
            headers['content-length'] = Buffer.byteLength(payload);
        }

        const options = { method, headers, timeout: this.settings.timeout };

        if (this.tls.cert) options.cert = this.tls.cert;
        if (this.tls.key) options.key = this.tls.key;
        if (this.tls.ca) options.ca = this.tls.ca;
        if (this.settings.tls?.insecure) options.rejectUnauthorized = false;

        return options;
    }

    send(method, path, { query, body, responseType }) {
        const url = this.buildUrl(path, query);
        const payload = body === undefined ? null : JSON.stringify(body);
        const client = url.protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
            const fail = err => {
                const detail = `Nessus request failed: ${describeError(err)}`;

                logger.writeError('nessus', 'upstream', { message: detail, method, path });
                reject(new SmError.BadGatewayError(detail));
            };

            const req = client.request(url, this.requestOptions(method, payload), res => {
                const chunks = [];

                res.on('data', chunk => chunks.push(chunk));
                res.on('error', fail);
                res.on('end', () => {
                    const text = Buffer.concat(chunks).toString('utf8');

                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return fail(new Error(`${method} ${path} returned HTTP ${res.statusCode}${summarize(text)}`));
                    }

                    if (responseType === 'text') return resolve(text);

                    try {
                        resolve(text ? JSON.parse(text) : null);
                    } catch (err) {
                        fail(new Error(`${method} ${path} returned a non-JSON body: ${describeError(err)}`));
                    }
                });
            });

            req.on('timeout', () => req.destroy(new Error(`Request timed out after ${this.settings.timeout}ms`)));
            req.on('error', fail);

            if (payload) req.write(payload);
            req.end();
        });
    }

    serverStatus() {
        return this.request('GET', '/server/status');
    }

    listScans() {
        return this.request('GET', '/scans');
    }

    getScanDetails(scanId, historyId) {
        return this.request('GET', `/scans/${encodeURIComponent(scanId)}`, { query: { history_id: historyId } });
    }

    getPlugin(pluginId) {
        return this.request('GET', `/plugins/plugin/${encodeURIComponent(pluginId)}`);
    }

    getPluginFamilies() {
        return this.request('GET', '/plugins/families');
    }

    exportScan(scanId, historyId) {
        return this.request('POST', `/scans/${encodeURIComponent(scanId)}/export`, { query: { history_id: historyId }, body: { format: 'nessus' } });
    }

    exportStatus(scanId, fileId) {
        return this.request('GET', `/scans/${encodeURIComponent(scanId)}/export/${encodeURIComponent(fileId)}/status`);
    }

    downloadExport(scanId, fileId) {
        return this.request('GET', `/scans/${encodeURIComponent(scanId)}/export/${encodeURIComponent(fileId)}/download`, { responseType: 'text' });
    }

    /** Requests a .nessus export, waits for Nessus to build it, then downloads it. */
    async exportScanFile(scanId, historyId, { pollIntervalMs = EXPORT_POLL_INTERVAL_MS } = {}) {
        const { file } = await this.exportScan(scanId, historyId);

        await this.waitForExport(scanId, file, Date.now() + this.settings.timeout, pollIntervalMs);

        return this.downloadExport(scanId, file);
    }

    /** Polls the export status until Nessus reports it ready, failing on an export error or past the deadline. */
    async waitForExport(scanId, fileId, deadline, pollIntervalMs) {
        const { status } = await this.exportStatus(scanId, fileId);

        if (status === 'ready') return;

        if (status === 'error') {
            throw new SmError.BadGatewayError(`Nessus could not export scan ${scanId}.`);
        }

        if (Date.now() > deadline) {
            throw new SmError.BadGatewayError(`Nessus did not finish exporting scan ${scanId} within ${this.settings.timeout}ms.`);
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

        return this.waitForExport(scanId, fileId, deadline, pollIntervalMs);
    }
}

function summarize(text) {
    const trimmed = (text || '').trim();

    return trimmed ? `: ${trimmed.slice(0, 200)}` : '';
}

module.exports = { NessusClient, client: new NessusClient() };
