/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, it, expect } from 'vitest';
import { assetsForPoam, buildStigManagerIndex, buildTenableIndex, getAllVulnerabilityIds } from './collection-asset-index';

describe('collection-asset-index', () => {
  describe('getAllVulnerabilityIds', () => {
    it('should return an empty list when the POAM has no primary vulnerability', () => {
      expect(getAllVulnerabilityIds({ vulnerabilityId: null, associatedVulnerabilities: ['V-2'] })).toEqual([]);
      expect(getAllVulnerabilityIds({ vulnerabilityId: '', associatedVulnerabilities: [] })).toEqual([]);
    });

    it('should combine the primary and associated ids, deduplicated', () => {
      expect(getAllVulnerabilityIds({ vulnerabilityId: 'V-1', associatedVulnerabilities: ['V-2', 'V-1', '', 'V-3'] })).toEqual(['V-1', 'V-2', 'V-3']);
    });

    it('should match ids exactly as stored, without trimming, like POAM details', () => {
      expect(getAllVulnerabilityIds({ vulnerabilityId: 'V-1 ', associatedVulnerabilities: [' V-2'] })).toEqual(['V-1 ', ' V-2']);
    });

    it('should tolerate a missing associated list', () => {
      expect(getAllVulnerabilityIds({ vulnerabilityId: 'V-1', associatedVulnerabilities: undefined as any })).toEqual(['V-1']);
    });
  });

  describe('buildStigManagerIndex', () => {
    const findings = [
      {
        groupId: 'V-1',
        assets: [
          { assetId: 1, name: 'srv-01' },
          { assetId: 2, name: 'srv-02' },
          { assetId: 1, name: 'srv-01' }
        ]
      },
      { groupId: 'V-2', assets: [{ assetId: 2, name: 'srv-02' }] },
      { groupId: 'V-3' },
      { assets: [{ assetId: 9, name: 'orphan' }] }
    ];
    const details = [
      { assetId: 1, fqdn: 'srv-01.example.mil' },
      { assetId: '2', fqdn: 'srv-02.example.mil' }
    ];

    it('should index assets by groupId with fqdn joined by assetId', () => {
      const index = buildStigManagerIndex(findings, details);

      expect([...index.keys()]).toEqual(['V-1', 'V-2']);
      expect(index.get('V-1')).toEqual([
        { key: '1', assetName: 'srv-01', fqdn: 'srv-01.example.mil', source: 'STIG Manager' },
        { key: '2', assetName: 'srv-02', fqdn: 'srv-02.example.mil', source: 'STIG Manager' }
      ]);
    });

    it('should leave fqdn undefined when no detail row exists', () => {
      const index = buildStigManagerIndex([{ groupId: 'V-1', assets: [{ assetId: 7, name: 'srv-07' }] }], []);

      expect(index.get('V-1')).toEqual([{ key: '7', assetName: 'srv-07', fqdn: undefined, source: 'STIG Manager' }]);
    });

    it('should merge repeated groupIds and tolerate non-array input', () => {
      const index = buildStigManagerIndex(
        [
          { groupId: 'V-1', assets: [{ assetId: 1, name: 'a' }] },
          {
            groupId: 'V-1',
            assets: [
              { assetId: 2, name: 'b' },
              { assetId: 1, name: 'a' }
            ]
          }
        ],
        null as any
      );

      expect(index.get('V-1')?.map((asset) => asset.key)).toEqual(['1', '2']);
      expect(buildStigManagerIndex(null as any, undefined as any).size).toBe(0);
    });
  });

  describe('buildTenableIndex', () => {
    it('should index hosts by pluginID and dedupe by host identity', () => {
      const index = buildTenableIndex([
        { pluginID: '1001', hostUUID: 'u1', netbiosName: 'DOM\\WS-01', dnsName: 'ws-01.example.mil', macAddress: 'aa' },
        { pluginID: '1001', hostUUID: 'u1', netbiosName: 'DOM\\WS-01', dnsName: 'ws-01.example.mil', macAddress: 'aa' },
        { pluginID: 1001, hostUUID: 'u2', netbiosName: '', dnsName: 'ws-02.example.mil', macAddress: '' },
        { pluginID: '2002', hostUUID: 'u1', netbiosName: 'DOM\\WS-01', dnsName: 'ws-01.example.mil', macAddress: 'aa' },
        { hostUUID: 'u3', dnsName: 'no-plugin.example.mil' }
      ]);

      expect([...index.keys()]).toEqual(['1001', '2002']);
      expect(index.get('1001')).toEqual([
        { key: 'u1-DOM\\WS-01-ws-01.example.mil-aa', assetName: 'DOM\\WS-01', dnsName: 'ws-01.example.mil', source: 'Tenable' },
        { key: 'u2--ws-02.example.mil-', assetName: '', dnsName: 'ws-02.example.mil', source: 'Tenable' }
      ]);
      expect(index.get('2002')).toHaveLength(1);
    });

    it('should return an empty index for non-array input', () => {
      expect(buildTenableIndex(undefined as any).size).toBe(0);
    });
  });

  describe('assetsForPoam', () => {
    it('should union assets across vulnerability ids without duplicates', () => {
      const index = buildStigManagerIndex(
        [
          {
            groupId: 'V-1',
            assets: [
              { assetId: 1, name: 'a' },
              { assetId: 2, name: 'b' }
            ]
          },
          {
            groupId: 'V-2',
            assets: [
              { assetId: 2, name: 'b' },
              { assetId: 3, name: 'c' }
            ]
          }
        ],
        []
      );

      expect(assetsForPoam(index, ['V-1', 'V-2', 'V-9']).map((asset) => asset.assetName)).toEqual(['a', 'b', 'c']);
      expect(assetsForPoam(index, ['V-9'])).toEqual([]);
      expect(assetsForPoam(index, [])).toEqual([]);
    });
  });
});
