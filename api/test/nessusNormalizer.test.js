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
const normalizer = require('../utils/nessus/nessusNormalizer');

const xml = fs.readFileSync(path.join(__dirname, 'fixtures', 'nessus', 'scan-small.nessus'), 'utf8');
const SCAN = { scanId: '42', scanName: 'Fixture Scan', historyId: 7, scanEnd: '1761560000' };

function snapshot() {
    const snap = normalizer.buildSnapshot(parseNessusXml(xml), SCAN);

    normalizer.applyFamilyIds(snap, [
        { id: '1', name: 'Misc.' },
        { id: '2', name: 'Policy Compliance' },
    ]);

    return snap;
}

test('parses hosts, items and list-valued children from a .nessus export', () => {
    const parsed = parseNessusXml(xml);

    assert.equal(parsed.reportName, 'Fixture Scan');
    assert.equal(parsed.hosts.length, 2);
    assert.equal(parsed.hosts[0].properties['host-ip'], '10.0.0.5');
    assert.deepEqual(parsed.hosts[0].items[0].cve, ['CVE-2020-0001', 'CVE-2020-0002']);
    assert.deepEqual(parsed.hosts[0].items[0].xref, ['IAVA:2020-A-0001', 'MSFT:MS20-001']);
});

test('rejects documents that are not Nessus v2 exports', () => {
    assert.throws(() => parseNessusXml('<root/>'), /NessusClientData_v2/);
});

test('normalizes hosts with stable keys and scan-level lastSeen', () => {
    const snap = snapshot();
    const [web, db] = snap.hosts;

    assert.equal(web.hostUUID, '11111111-2222-3333-4444-555555555555');
    assert.equal(web.dnsName, 'web01.example.mil');
    assert.equal(web.macAddress, '00:11:22:33:44:55');
    assert.equal(web.osCPE, 'cpe:/o:microsoft:windows_server_2019');
    assert.equal(web.credentialed, true);

    assert.equal(db.dnsName, 'db01.example.mil');
    assert.match(db.hostUUID, /^[0-9a-f]{40}$/);
    assert.equal(db.hostUUID, normalizer.buildSnapshot(parseNessusXml(xml), SCAN).hosts[1].hostUUID);

    assert.equal(snap.findings.length, 7);
    assert.ok(snap.findings.every(f => f.lastSeen === '1761560000'));
    assert.equal(snap.findings[0].firstSeen, '1761559200');
});

test('listvuln and vulndetails rows carry the Tenable field contract', () => {
    const snap = snapshot();
    const smb = snap.findings.find(f => f.pluginID === '57608');
    const row = normalizer.toListVulnRow(smb, snap);

    assert.equal(row.name, 'SMB Signing not required');
    assert.deepEqual(row.severity, { id: '4', name: 'Critical', description: '' });
    assert.deepEqual(row.family, { id: '1', name: 'Misc.', type: 'active' });
    assert.equal(row.port, '445');
    assert.equal(row.protocol, 'TCP');
    assert.equal(row.netbiosName, 'WEB01');
    assert.deepEqual(row.repository, { id: '42', name: 'Fixture Scan', description: '' });
    assert.equal(row.hasBeenMitigated, '0');

    const details = normalizer.toVulnDetailsRow(smb, snap);

    assert.equal(details.pluginName, 'SMB Signing not required');
    assert.equal(details.xref, 'CVE#CVE-2020-0001, CVE#CVE-2020-0002, IAVA#2020-A-0001, MSFT#MS20-001');
    assert.equal(details.exploitAvailable, 'Yes');
    assert.equal(details.exploitFrameworks, 'metasploit');
    assert.equal(details.epssScore, '94.12');
    assert.equal(details.version, '1.21');
    assert.equal(details.pluginPubDate, String(Date.UTC(2012, 0, 19) / 1000));
    assert.equal(details.patchPubDate, '-1');
    assert.equal(details.pluginText, '<plugin_output>Signing is not required on the remote SMB server.</plugin_output>');
    assert.match(details.xref, /IAV[ABT]\s*#\s*(\d{4}-[A-Z]-\d{4})/);
});

test('plugin shape uses colon-separated xrefs for the client reference parser', () => {
    const snap = snapshot();
    const plugin = normalizer.toTenablePlugin(snap.plugins.get('57608'));

    assert.equal(plugin.id, '57608');
    assert.equal(plugin.xrefs, 'CVE:CVE-2020-0001, CVE:CVE-2020-0002, IAVA:2020-A-0001, MSFT:MS20-001');
    assert.equal(plugin.exploitAvailable, 'true');
    assert.equal(plugin.vprContext, '[]');
    assert.equal(plugin.sourceFile, 'smb_signing_not_required.nasl');
    assert.equal('xrefs' in plugin && !Array.isArray(plugin.xrefs), true);
});

test('pluginFromAttributes maps the /plugins/plugin response like a ReportItem', () => {
    const plugin = normalizer.pluginFromAttributes({
        id: 57608,
        name: 'SMB Signing not required',
        family_name: 'Misc.',
        attributes: [
            { attribute_name: 'cve', attribute_value: 'CVE-2020-0001' },
            { attribute_name: 'xref', attribute_value: 'IAVA:2020-A-0001' },
            { attribute_name: 'risk_factor', attribute_value: 'Critical' },
            { attribute_name: 'plugin_publication_date', attribute_value: '2012/01/19' },
        ],
    });

    assert.equal(plugin.id, '57608');
    assert.equal(plugin.riskFactor, 'Critical');
    assert.deepEqual(
        plugin.xrefs.map(x => `${x.type}:${x.value}`),
        ['CVE:CVE-2020-0001', 'IAVA:2020-A-0001']
    );
});

test('sumid groups findings by plugin with totals and host counts', () => {
    const snap = snapshot();
    const rows = normalizer.toSumIdRows(snap.findings);
    const tls = rows.find(r => r.pluginID === '104743');

    assert.equal(rows.length, 5);
    assert.equal(tls.total, '2');
    assert.equal(tls.hostTotal, '2');
    assert.equal(tls.severity.name, 'Medium');
    assert.equal(tls.acrScore, null);
});

test('sumip scores hosts with Tenable severity weights', () => {
    const snap = snapshot();
    const rows = normalizer.toSumIpRows(snap.findings, snap);
    const web = rows.find(r => r.ip === '10.0.0.5');

    assert.equal(web.score, String(40 + 3));
    assert.equal(web.severityCritical, '1');
    assert.equal(web.severityMedium, '1');
    assert.equal(web.severityInfo, '1');
    assert.equal(web.repository.name, 'Fixture Scan');
});

test('sumseverity and sumdnsname aggregate counts', () => {
    const snap = snapshot();
    const severities = Object.fromEntries(normalizer.toSumSeverityRows(snap.findings).map(r => [r.severity.name, r.count]));

    assert.deepEqual(severities, { Critical: '2', Medium: '2', Info: '2', High: '1' });

    const dns = normalizer.toSumDnsNameRows(snap.findings, snap).find(r => r.dnsName === 'db01.example.mil');

    assert.equal(dns.total, '4');
});

test('sumremediation derives stable solution ids from solution text', () => {
    const snap = snapshot();
    const rows = normalizer.toSumRemediationRows(snap.findings, snap);
    const tls = rows.find(r => r.solution.startsWith('Enable support for TLS'));

    assert.ok(rows.every(r => /^42-\d+$/.test(r.solutionID)));
    assert.equal(tls.hostTotal, '2');
    assert.equal(tls.total, '2');
    assert.equal(tls.pluginID, '104743');
    assert.match(tls.scorePctg, /%$/);
    assert.ok(!rows.some(r => r.solution === 'n/a'), 'informational findings are not solutions');

    const group = normalizer.buildSolutionGroups(snap.findings).find(g => `42-${g.index}` === tls.solutionID);

    assert.equal(group.findings.length, 2);
    assert.equal(
        normalizer.toSumRemediationRows(
            snap.findings.filter(f => f.pluginID === '104743'),
            snap
        )[0].solutionID,
        tls.solutionID,
        'ids survive filtering'
    );
});

test('host search rows expose credentialed source and null ACR/AES', () => {
    const snap = snapshot();
    const row = normalizer.toHostSearchRow(snap.hosts[1], snap, []);

    assert.equal(row.name, 'db01.example.mil');
    assert.deepEqual(row.source, [{ type: 'nessus' }]);
    assert.deepEqual(row.acr, { score: null, lastEvaluatedTime: null });
    assert.equal(row.lastSeen, '1761560000');
});

test('compliance family is typed as compliance for the pluginType filter', () => {
    const snap = snapshot();

    assert.equal(snap.plugins.get('21157').family.type, 'compliance');
    assert.equal(snap.plugins.get('21157').family.id, '2');
});
