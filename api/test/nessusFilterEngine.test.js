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
const fs = require('node:fs');
const path = require('node:path');
const { parseNessusXml } = require('../utils/nessus/nessusXml');
const { buildSnapshot } = require('../utils/nessus/nessusNormalizer');
const { compileFilters, dateWindow, ipRange } = require('../utils/nessus/nessusFilterEngine');
const { applyQuery } = require('../utils/nessus/nessusQuery');

const xml = fs.readFileSync(path.join(__dirname, 'fixtures', 'nessus', 'scan-small.nessus'), 'utf8');
const NOW = 1761600000;
const snap = buildSnapshot(parseNessusXml(xml), { scanId: '42', scanName: 'Fixture Scan', historyId: 7, scanEnd: '1761560000' });

function filter(filterName, value, operator = '=') {
    return { id: filterName, filterName, operator, type: 'vuln', isPredefined: true, value };
}

function ids(filters) {
    const { predicate } = compileFilters(filters, { nowSeconds: NOW });

    return snap.findings.filter(predicate).map(f => `${f.pluginID}@${f.host.ip}`);
}

test('repository filter yields scan ids and no predicate', () => {
    const compiled = compileFilters([filter('repository', [{ id: '42' }])]);

    assert.deepEqual(compiled.scanIds, ['42']);
    assert.equal(snap.findings.filter(compiled.predicate).length, snap.findings.length);
    assert.deepEqual(compileFilters([filter('repository', '7')]).scanIds, ['7']);
});

test('pluginID, severity and exploitAvailable filters', () => {
    assert.deepEqual(ids([filter('pluginID', '57608,201408')]), ['57608@10.0.0.5', '201408@10.0.0.6']);
    assert.deepEqual(ids([filter('pluginID', '19506', '!=')]).length, 5);
    assert.deepEqual(ids([filter('severity', '3,4')]).sort(), ['201408@10.0.0.6', '21157@10.0.0.6', '57608@10.0.0.5']);
    assert.deepEqual(ids([filter('exploitAvailable', 'true')]), ['57608@10.0.0.5']);
    assert.equal(ids([filter('exploitAvailable', 'false')]).length, 6);
});

test('text filters support contains, exact and pcre operators', () => {
    assert.equal(ids([filter('pluginName', 'seol')]).length, 1);
    assert.equal(ids([filter('pluginName', '^TLS.*Detection$', 'pcre')]).length, 2);
    assert.equal(ids([filter('pluginText', 'Credentialed checks : no')]).length, 1);
    assert.equal(ids([filter('dnsName', 'web01.example.mil')]).length, 3);
    assert.equal(ids([filter('dnsName', 'WEB01,db01', '~')]).length, 7);
    assert.equal(ids([filter('netbiosName', 'web', '~=')]).length, 3);
    assert.equal(ids([filter('operatingSystem', 'ubuntu')]).length, 4);
});

test('ip filter accepts single addresses, lists, CIDR and ranges', () => {
    assert.equal(ids([filter('ip', '10.0.0.5')]).length, 3);
    assert.equal(ids([filter('ip', '10.0.0.5,10.0.0.6')]).length, 7);
    assert.equal(ids([filter('ip', '10.0.0.0/30')]).length, 0);
    assert.equal(ids([filter('ip', '10.0.0.4/30')]).length, 7);
    assert.equal(ids([filter('ip', '10.0.0.6-10.0.0.9')]).length, 4);
    assert.equal(ids([filter('ip', '10.0.0.5', '!=')]).length, 4);
    assert.deepEqual(ipRange('192.168.1.0/24'), [3232235776, 3232236031]);
});

test('port, protocol and family filters', () => {
    assert.equal(ids([filter('port', '443')]).length, 2);
    assert.equal(ids([filter('port', '1', '>=')]).length, 3);
    assert.equal(ids([filter('protocol', '6')]).length, 7);
    assert.equal(ids([filter('protocol', '17')]).length, 0);
    assert.equal(ids([filter('family', [{ id: 'Settings' }])]).length, 2);
});

test('xref style filters match CVE, IAV and wildcard patterns', () => {
    assert.deepEqual(ids([filter('xref', 'IAVA|20*,IAVB|20*')]), ['57608@10.0.0.5']);
    assert.deepEqual(ids([filter('cveID', 'CVE-2020-0002')]), ['57608@10.0.0.5']);
    assert.deepEqual(ids([filter('iavmID', '2020-A-0001')]), ['57608@10.0.0.5']);
    assert.deepEqual(ids([filter('msbulletinID', 'MS20-001')]), ['57608@10.0.0.5']);
    assert.equal(ids([filter('xref', 'IAVA|20*', '!=')]).length, 6);
});

test('pluginType separates compliance from active findings', () => {
    assert.deepEqual(ids([filter('pluginType', 'compliance')]), ['21157@10.0.0.6']);
    assert.equal(ids([filter('pluginType', 'active')]).length, 6);
});

test('score ranges and none values', () => {
    assert.deepEqual(ids([filter('vprScore', '9-10')]), ['57608@10.0.0.5']);
    assert.equal(ids([filter('vprScore', 'none')]).length, 4);
    assert.equal(ids([filter('cvssV3BaseScore', '6-7')]).length, 2);
    assert.deepEqual(ids([filter('epssScore', '90-100')]), ['57608@10.0.0.5']);
});

test('date filters use the Tenable day-window grammar', () => {
    assert.equal(ids([filter('lastSeen', '0:30')]).length, 7);
    assert.equal(ids([filter('lastSeen', '30:all')]).length, 0);
    assert.equal(ids([filter('pluginPublished', '30:all')]).length, 6, 'the compliance item has no publication date');
    assert.equal(ids([filter('pluginPublished', '0:30')]).length, 0);
    assert.equal(ids([filter('patchPublished', 'none')]).length, 5);
    assert.deepEqual(ids([filter('seolDate', '30:all')]), ['201408@10.0.0.6']);
    assert.equal(ids([filter('lastSeen', 'All')]).length, 7);

    const [from, to] = dateWindow('7:all', NOW);

    assert.equal(from, Number.NEGATIVE_INFINITY);
    assert.equal(to, NOW - 7 * 86400);
    assert.ok(Array.isArray(dateWindow('lastQuarter', NOW)));
    assert.equal(dateWindow('bogus', NOW), undefined);
});

test('pcre patterns that could backtrack catastrophically match nothing', () => {
    assert.equal(ids([filter('pluginText', '(a+)+$', 'pcre')]).length, 0);
    assert.equal(ids([filter('pluginName', 'x'.repeat(300), 'pcre')]).length, 0);
    assert.equal(ids([filter('pluginName', 'TLS.*Detection', 'pcre')]).length, 2);
});

test('unsupported and unknown filters are skipped with warnings', () => {
    const compiled = compileFilters([filter('asset', [{ id: '1' }]), filter('mysteryFilter', 'x'), filter('mitigatedStatus', 'never')], { nowSeconds: NOW });

    assert.equal(compiled.warnings.length, 2);
    assert.match(compiled.warnings[0], /asset filter is not supported/);
    assert.equal(snap.findings.filter(compiled.predicate).length, 7);
    assert.equal(ids([filter('mitigatedStatus', 'previously')]).length, 0);
});

test('presets used by the Tenable tabs combine correctly', () => {
    const thirtyPlus = ids([filter('severity', '1,2,3,4'), filter('lastSeen', '0:30'), filter('pluginPublished', '30:all')]);
    const seol = ids([filter('pluginName', 'SEoL'), filter('seolDate', '30:all'), filter('severity', '1,2,3,4'), filter('lastSeen', '0:30')]);

    assert.equal(thirtyPlus.length, 4);
    assert.deepEqual(seol, ['201408@10.0.0.6']);
});

test('applyQuery sorts numerically or by nested id and paginates', () => {
    const rows = [
        { pluginID: '2', severity: { id: '1' }, total: '10' },
        { pluginID: '10', severity: { id: '4' }, total: '9' },
        { pluginID: '3', severity: { id: '2' }, total: '100' },
    ];

    const byTotal = applyQuery(rows, { sortField: 'total', sortDir: 'desc', query: { startOffset: 0, endOffset: 2 } });

    assert.deepEqual(
        byTotal.results.map(r => r.pluginID),
        ['3', '2']
    );
    assert.equal(byTotal.totalRecords, '3');
    assert.equal(byTotal.returnedRecords, 2);

    const bySeverity = applyQuery(rows, { query: { sortColumn: 'severity', sortDirection: 'asc' } });

    assert.deepEqual(
        bySeverity.results.map(r => r.severity.id),
        ['1', '2', '4']
    );

    const unsorted = applyQuery(rows, { query: { startOffset: 1 } });

    assert.equal(unsorted.results.length, 2);
    assert.equal(unsorted.endOffset, '3');
});
