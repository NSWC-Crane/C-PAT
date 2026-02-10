/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { AssetTeamMappingService, AssetData } from './asset-team-mapping.service';

describe('AssetTeamMappingService', () => {
  let service: AssetTeamMappingService;
  let mockMessageService: { add: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockMessageService = {
      add: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [AssetTeamMappingService, { provide: MessageService, useValue: mockMessageService }]
    });

    service = TestBed.inject(AssetTeamMappingService);
  });

  describe('getAssetName', () => {
    it('should return asset name when asset is found', () => {
      const assetList = [
        { assetId: 1, assetName: 'Server-01' },
        { assetId: 2, assetName: 'Server-02' },
        { assetId: 3, assetName: 'Workstation-01' }
      ];

      const result = service.getAssetName(2, assetList);

      expect(result).toBe('Server-02');
    });

    it('should return fallback string when asset is not found', () => {
      const assetList = [{ assetId: 1, assetName: 'Server-01' }];

      const result = service.getAssetName(999, assetList);

      expect(result).toBe('Asset ID: 999');
    });

    it('should return fallback string when asset list is empty', () => {
      const result = service.getAssetName(1, []);

      expect(result).toBe('Asset ID: 1');
    });
  });

  describe('compareAssetsAndAssignTeams', () => {
    const mockPoam = { poamId: 123 };
    const mockNewPoam = { poamId: 'ADDPOAM' };

    const mockAssetDeltaList = {
      assets: [
        {
          key: 'server-01',
          assignedTeams: [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha' }]
        },
        {
          key: 'workstation',
          assignedTeams: [{ assignedTeamId: 2, assignedTeamName: 'Team Beta' }]
        }
      ]
    };

    const mockAssetList = [
      { assetId: 1, assetName: 'server-01' },
      { assetId: 2, assetName: 'workstation-01' }
    ];

    describe('early returns', () => {
      it('should return existing teams when assetDeltaList is null', () => {
        const existingTeams = [{ assignedTeamId: 99, assignedTeamName: 'Existing Team' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, null, 'C-PAT', [], [], [], existingTeams);

        expect(result).toEqual(existingTeams);
      });

      it('should return existing teams when assetDeltaList.assets is undefined', () => {
        const existingTeams = [{ assignedTeamId: 99, assignedTeamName: 'Existing Team' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, {}, 'C-PAT', [], [], [], existingTeams);

        expect(result).toEqual(existingTeams);
      });

      it('should return existing teams when C-PAT collection has no poamAssets', () => {
        const existingTeams = [{ assignedTeamId: 99, assignedTeamName: 'Existing Team' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'C-PAT', [], [], mockAssetList, existingTeams);

        expect(result).toEqual(existingTeams);
      });

      it('should return existing teams when STIG Manager collection has no externalAssets', () => {
        const existingTeams = [{ assignedTeamId: 99, assignedTeamName: 'Existing Team' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], [], mockAssetList, existingTeams);

        expect(result).toEqual(existingTeams);
      });

      it('should return existing teams when Tenable collection has no externalAssets', () => {
        const existingTeams = [{ assignedTeamId: 99, assignedTeamName: 'Existing Team' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'Tenable', [], [], mockAssetList, existingTeams);

        expect(result).toEqual(existingTeams);
      });
    });

    describe('C-PAT collection type', () => {
      it('should add teams when poamAsset matches delta key exactly', () => {
        const poamAssets = [{ assetId: 1 }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'C-PAT', poamAssets, [], mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          poamId: 123,
          assignedTeamId: 1,
          assignedTeamName: 'Team Alpha',
          automated: true
        });
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'info',
          summary: 'Team Added',
          detail: 'Team Team Alpha was automatically added based on asset mapping'
        });
      });

      it('should not add team for partial match in C-PAT collection', () => {
        const poamAssets = [{ assetId: 2 }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'C-PAT', poamAssets, [], mockAssetList, []);

        expect(result).toHaveLength(0);
      });

      it('should use ADDPOAM as poamId for new POAMs', () => {
        const poamAssets = [{ assetId: 1 }];

        const result = service.compareAssetsAndAssignTeams(mockNewPoam, mockAssetDeltaList, 'C-PAT', poamAssets, [], mockAssetList, []);

        expect(result[0].poamId).toBe('ADDPOAM');
      });
    });

    describe('STIG Manager collection type', () => {
      it('should add teams when assetName contains delta key (partial match)', () => {
        const externalAssets: AssetData[] = [{ assetName: 'prod-server-01.domain.com', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });

      it('should add teams when dnsName contains delta key', () => {
        const externalAssets: AssetData[] = [{ assetName: 'other-name', dnsName: 'server-01.local', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });

      it('should add teams when fqdn contains delta key', () => {
        const externalAssets: AssetData[] = [{ assetName: 'other-name', fqdn: 'server-01.example.com', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });
    });

    describe('Tenable collection type', () => {
      it('should add teams when assetName contains delta key (partial match)', () => {
        const externalAssets: AssetData[] = [{ assetName: 'workstation-dept-a', source: 'Tenable' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'Tenable', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(2);
        expect(result[0].assignedTeamName).toBe('Team Beta');
      });

      it('should add teams when dnsName contains delta key', () => {
        const externalAssets: AssetData[] = [{ assetName: 'other', dnsName: 'workstation.local', source: 'Tenable' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'Tenable', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(2);
      });
    });

    describe('duplicate prevention', () => {
      it('should not add team if already assigned', () => {
        const externalAssets: AssetData[] = [{ assetName: 'server-01', source: 'STIG Manager' }];
        const existingTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha', automated: false }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, existingTeams);

        expect(result).toHaveLength(1);
        expect(mockMessageService.add).not.toHaveBeenCalled();
      });
    });

    describe('automated team removal', () => {
      it('should remove automated teams that no longer have matching assets for existing POAMs', () => {
        const externalAssets: AssetData[] = [{ assetName: 'completely-different-asset', source: 'STIG Manager' }];
        const existingTeams = [
          { assignedTeamId: 1, assignedTeamName: 'Team Alpha', automated: true },
          { assignedTeamId: 99, assignedTeamName: 'Manual Team', automated: false }
        ];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, existingTeams);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(99);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'info',
          summary: 'Team Removed',
          detail: 'Automated team Team Alpha was removed as it no longer has assets on this POAM'
        });
      });

      it('should NOT remove automated teams for new POAMs (ADDPOAM)', () => {
        const externalAssets: AssetData[] = [{ assetName: 'completely-different-asset', source: 'STIG Manager' }];
        const existingTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha', automated: true }];

        const result = service.compareAssetsAndAssignTeams(mockNewPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, existingTeams);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });

      it('should not remove manually assigned teams', () => {
        const externalAssets: AssetData[] = [{ assetName: 'no-match', source: 'STIG Manager' }];
        const existingTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha', automated: false }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, existingTeams);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });
    });

    describe('multiple teams and assets', () => {
      it('should add multiple teams from multiple assets', () => {
        const externalAssets: AssetData[] = [
          { assetName: 'server-01', source: 'STIG Manager' },
          { assetName: 'workstation-01', source: 'STIG Manager' }
        ];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(2);
        expect(result.map((t) => t.assignedTeamId).sort()).toEqual([1, 2]);
        expect(mockMessageService.add).toHaveBeenCalledTimes(2);
      });

      it('should handle delta asset with single assignedTeam instead of array', () => {
        const deltaWithSingleTeam = {
          assets: [
            {
              key: 'single-team-asset',
              assignedTeam: { assignedTeamId: 5, assignedTeamName: 'Single Team' }
            }
          ]
        };
        const externalAssets: AssetData[] = [{ assetName: 'single-team-asset', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, deltaWithSingleTeam, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(5);
        expect(result[0].assignedTeamName).toBe('Single Team');
      });
    });

    describe('case insensitivity', () => {
      it('should match asset names case-insensitively', () => {
        const externalAssets: AssetData[] = [{ assetName: 'SERVER-01', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
      });

      it('should match delta keys case-insensitively', () => {
        const deltaWithUpperCase = {
          assets: [
            {
              key: 'SERVER-01',
              assignedTeams: [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha' }]
            }
          ]
        };
        const externalAssets: AssetData[] = [{ assetName: 'server-01', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, deltaWithUpperCase, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(1);
      });
    });

    describe('edge cases', () => {
      it('should handle empty assetName gracefully', () => {
        const externalAssets: AssetData[] = [{ assetName: '', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(0);
      });

      it('should handle undefined assetName gracefully', () => {
        const externalAssets: AssetData[] = [{ assetName: undefined as any, source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result).toHaveLength(0);
      });

      it('should handle numeric poamId conversion', () => {
        const poamWithStringId = { poamId: '456' };
        const externalAssets: AssetData[] = [{ assetName: 'server-01', source: 'STIG Manager' }];

        const result = service.compareAssetsAndAssignTeams(poamWithStringId, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, []);

        expect(result[0].poamId).toBe(456);
      });

      it('should keep automated teams that still have matching assets', () => {
        const externalAssets: AssetData[] = [{ assetName: 'server-01', source: 'STIG Manager' }];
        const existingTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team Alpha', automated: true }];

        const result = service.compareAssetsAndAssignTeams(mockPoam, mockAssetDeltaList, 'STIG Manager', [], externalAssets, mockAssetList, existingTeams);

        expect(result).toHaveLength(1);
        expect(result[0].assignedTeamId).toBe(1);
        expect(mockMessageService.add).not.toHaveBeenCalled();
      });
    });
  });
});
