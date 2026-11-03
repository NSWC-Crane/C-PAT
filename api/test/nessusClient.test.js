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

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { NessusClient } = require('../utils/nessusClient');
const { NessusCache } = require('../utils/nessus/nessusCache');

function startServer(handler) {
    return new Promise(resolve => {
        const server = http.createServer(handler);

        server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
    });
}

function settings(url, overrides = {}) {
    return { enabled: true, url, accessKey: 'AK', secretKey: 'SK', timeout: 2000, tls: {}, ...overrides };
}

test('client is unavailable until NESSUS_URL is configured', async () => {
    const client = new NessusClient({ settings: settings('', { enabled: false }), tls: {} });

    await assert.rejects(client.listScans(), err => err.status === 503);
});

test('requests carry API keys and parse JSON responses', async () => {
    const seen = [];
    const { server, url } = await startServer((req, res) => {
        seen.push({ url: req.url, apiKeys: req.headers['x-apikeys'], accept: req.headers.accept });
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ scans: [{ id: 5, name: 'Weekly' }], folders: [] }));
    });

    try {
        const client = new NessusClient({ settings: settings(url), tls: {} });
        const data = await client.listScans();

        assert.deepEqual(data.scans, [{ id: 5, name: 'Weekly' }]);
        assert.equal(seen[0].url, '/scans');
        assert.equal(seen[0].apiKeys, 'accessKey=AK; secretKey=SK');
        assert.equal(seen[0].accept, 'application/json');

        await client.getScanDetails(5, 9);
        assert.equal(seen[1].url, '/scans/5?history_id=9');
    } finally {
        server.close();
    }
});

test('exportScanFile requests, polls and downloads the .nessus file', async () => {
    const calls = [];
    let polls = 0;
    const { server, url } = await startServer((req, res) => {
        calls.push(`${req.method} ${req.url}`);

        if (req.method === 'POST' && req.url === '/scans/5/export?history_id=9') {
            let body = '';

            req.on('data', chunk => (body += chunk));
            req.on('end', () => {
                assert.deepEqual(JSON.parse(body), { format: 'nessus' });
                res.end(JSON.stringify({ file: 77, token: 'tok' }));
            });

            return;
        }

        if (req.url === '/scans/5/export/77/status') {
            polls += 1;

            return res.end(JSON.stringify({ status: polls < 2 ? 'loading' : 'ready' }));
        }

        if (req.url === '/scans/5/export/77/download') {
            res.setHeader('content-type', 'application/octet-stream');

            return res.end('<NessusClientData_v2/>');
        }

        res.statusCode = 404;
        res.end();
    });

    try {
        const client = new NessusClient({ settings: settings(url), tls: {} });
        const xml = await client.exportScanFile(5, 9, { pollIntervalMs: 5 });

        assert.equal(xml, '<NessusClientData_v2/>');
        assert.deepEqual(calls, [
            'POST /scans/5/export?history_id=9',
            'GET /scans/5/export/77/status',
            'GET /scans/5/export/77/status',
            'GET /scans/5/export/77/download',
        ]);
    } finally {
        server.close();
    }
});

test('non-2xx and unreachable upstreams surface as 502 bad gateway errors', async () => {
    const { server, url } = await startServer((req, res) => {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid Credentials' }));
    });

    try {
        const client = new NessusClient({ settings: settings(url), tls: {} });

        await assert.rejects(client.listScans(), err => err.status === 502 && /HTTP 401/.test(err.detail));
    } finally {
        server.close();
    }

    const port = server.address()?.port || 1;
    const offline = new NessusClient({ settings: settings(`http://127.0.0.1:${port}`), tls: {} });

    await assert.rejects(offline.listScans(), err => err.status === 502);
});

test('cache shares one in-flight load and evicts beyond its capacity', async () => {
    const cache = new NessusCache({ ttlMs: 10_000, maxEntries: 2 });
    let loads = 0;
    const loader = () => new Promise(resolve => setTimeout(() => resolve(`value-${++loads}`), 5));

    const [a, b] = await Promise.all([cache.load('k1', loader), cache.load('k1', loader)]);

    assert.equal(a, 'value-1');
    assert.equal(b, 'value-1');
    assert.equal(loads, 1);

    await cache.load('k2', loader);
    await cache.load('k3', loader);

    assert.equal(cache.get('k1'), undefined, 'least recently used entry is evicted');
    assert.equal(cache.get('k3'), 'value-3');

    const expiring = new NessusCache({ ttlMs: 1, maxEntries: 5 });

    expiring.set('k', 'v');
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(expiring.get('k'), undefined);
});
