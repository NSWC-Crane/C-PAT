/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { STIGManagerPoamAssetsTableComponent } from './stigManagerPoamAssetsTable.component';
import { SharedService } from '../../../../common/services/shared.service';
import { AssetDeltaService } from '../../../admin-processing/asset-delta/asset-delta.service';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { createMockMessageService } from '../../../../../testing/mocks/service-mocks';

const mockPoamAssets = [
  {
    groupId: 'V-001',
    assets: [
      { name: 'Asset1', assetId: 101 },
      { name: 'Asset2', assetId: 102 }
    ]
  },
  {
    groupId: 'V-002',
    assets: [{ name: 'Asset3', assetId: 103 }]
  }
];

const mockAssetDetails = [
  { assetId: 101, fqdn: 'asset1.example.com', ip: '10.0.0.1', mac: 'AA:BB', labels: [{ name: 'prod' }], description: 'Desc1', collection: { collectionId: 7 } },
  { assetId: 102, fqdn: 'asset2.example.com', ip: '10.0.0.2', mac: 'CC:DD', labels: [], description: 'Desc2', collection: { collectionId: 7 } }
];

const mockAssetDeltaList = {
  assets: [
    {
      key: 'asset1',
      assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }]
    }
  ]
};

describe('STIGManagerPoamAssetsTableComponent', () => {
  let component: STIGManagerPoamAssetsTableComponent;
  let fixture: ComponentFixture<STIGManagerPoamAssetsTableComponent>;
  let mockSharedService: any;
  let mockAssetDeltaService: any;
  let mockCsvExportService: any;
  let mockMessageService: any;
  let mockTable: any;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };
  });

  beforeEach(async () => {
    mockTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn() };

    mockSharedService = {
      selectedCollection: of(7),
      getPOAMAssetsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockPoamAssets])),
      getAssetDetailsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockAssetDetails]))
    };

    mockAssetDeltaService = {
      getAssetDeltaListByCollection: vi.fn().mockReturnValue(of(mockAssetDeltaList))
    };

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [STIGManagerPoamAssetsTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SharedService, useValue: mockSharedService },
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: CsvExportService, useValue: mockCsvExportService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(STIGManagerPoamAssetsTableComponent);
    component = fixture.componentInstance;
    component.stigmanCollectionId = 42;
    component.groupId = 'V-001';
    component.associatedVulnerabilities = [];
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default affectedAssets to empty array', () => {
      expect(component.affectedAssets).toEqual([]);
    });

    it('should default combinedAssets to empty array', () => {
      expect(component.combinedAssets).toEqual([]);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default filterValue to empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should default activeTab to "all"', () => {
      expect(component.activeTab).toBe('all');
    });

    it('should default loading to true', () => {
      expect(component.loading).toBe(true);
    });

    it('should default assetsByTeam to empty object', () => {
      expect(component.assetsByTeam).toEqual({});
    });

    it('should default teamTabs to empty array', () => {
      expect(component.teamTabs).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to sharedService.selectedCollection', () => {
      component.ngOnInit();
      expect(component.selectedCollection).toBe(7);
    });

    it('should call initColumnsAndFilters', () => {
      const spy = vi.spyOn(component, 'initColumnsAndFilters');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call loadAssetDeltaList', () => {
      const spy = vi.spyOn(component, 'loadAssetDeltaList');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should initialize teamTabs with "all" entry', () => {
      component.ngOnInit();
      expect(component.teamTabs[0]).toMatchObject({ teamId: 'all', teamName: 'All Assets' });
    });

    it('should call loadData when stigmanCollectionId and groupId are set', () => {
      const spy = vi.spyOn(component, 'loadData');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error message when groupId is missing', () => {
      component.groupId = '';
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should not call loadData when groupId is missing', () => {
      component.groupId = '';
      const spy = vi.spyOn(component, 'loadData');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call loadData when stigmanCollectionId is 0', () => {
      component.stigmanCollectionId = 0;
      const spy = vi.spyOn(component, 'loadData');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('initColumnsAndFilters', () => {
    beforeEach(() => {
      component.initColumnsAndFilters();
    });

    it('should set 7 columns', () => {
      expect(component.cols.length).toBe(7);
    });

    it('should include assetName column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('assetName');
    });

    it('should include fqdn column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('fqdn');
    });

    it('should include ip column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('ip');
    });

    it('should set exportColumns from cols', () => {
      expect(component.exportColumns.length).toBe(7);
      expect(component.exportColumns[0]).toHaveProperty('title');
      expect(component.exportColumns[0]).toHaveProperty('dataKey');
    });

    it('should call resetColumnSelections', () => {
      const spy = vi.spyOn(component, 'resetColumnSelections');

      component.initColumnsAndFilters();
      expect(spy).toHaveBeenCalled();
    });

    it('should set selectedColumns to all cols', () => {
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should call getAssetDeltaListByCollection', () => {
      component.ngOnInit();
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalled();
    });

    it('should set assetDeltaList from response', () => {
      component.ngOnInit();
      expect(component.assetDeltaList).toBe(mockAssetDeltaList);
    });

    it('should set assetDeltaList to empty array when response is null', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of(null));
      component.ngOnInit();
      expect(component.assetDeltaList).toEqual([]);
    });

    it('should show error message when service fails', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(throwError(() => new Error('Delta error')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('loadData', () => {
    it('should call getPOAMAssetsFromSTIGMAN with stigmanCollectionId', () => {
      component.ngOnInit();
      expect(mockSharedService.getPOAMAssetsFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should build asset list from matching poam assets', () => {
      component.ngOnInit();
      expect(component.affectedAssets.length).toBeGreaterThan(0);
    });

    it('should deduplicate assets by assetId', () => {
      const duplicatePoamAssets = [
        { groupId: 'V-001', assets: [{ name: 'Asset1', assetId: 101 }] },
        { groupId: 'V-002', assets: [{ name: 'Asset1', assetId: 101 }] }
      ];

      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(duplicatePoamAssets));
      component.ngOnInit();
      const ids = component.affectedAssets.map((a) => a.assetId);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should merge sourceVulnIds for duplicate assets', () => {
      const duplicatePoamAssets = [
        { groupId: 'V-001', assets: [{ name: 'Asset1', assetId: 101 }] },
        { groupId: 'V-002', assets: [{ name: 'Asset1', assetId: 101 }] }
      ];

      component.associatedVulnerabilities = ['V-002'];
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(duplicatePoamAssets));
      component.ngOnInit();
      const asset = component.affectedAssets.find((a) => a.assetId === 101);

      expect(asset?.sourceVulnIds).toContain('V-001');
      expect(asset?.sourceVulnIds).toContain('V-002');
    });

    it('should include associatedVulnerabilities in search', () => {
      component.associatedVulnerabilities = ['V-002'];
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of([...mockPoamAssets]));
      component.ngOnInit();
      const asset3 = component.affectedAssets.find((a) => a.assetId === 103);

      expect(asset3).toBeTruthy();
    });

    it('should handle object-form associatedVulnerabilities', () => {
      component.associatedVulnerabilities = [{ associatedVulnerability: 'V-002' }];
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of([...mockPoamAssets]));
      component.ngOnInit();
      const asset3 = component.affectedAssets.find((a) => a.assetId === 103);

      expect(asset3).toBeTruthy();
    });

    it('should show error message when getPOAMAssetsFromSTIGMAN fails', () => {
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set loading to false on fetch error', () => {
      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.ngOnInit();
      expect(component.loading).toBe(false);
    });
  });

  describe('loadAssetDetails', () => {
    it('should call getAssetDetailsFromSTIGMAN with stigmanCollectionId', () => {
      component.ngOnInit();
      expect(mockSharedService.getAssetDetailsFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should enrich affectedAssets with fqdn from details', () => {
      component.ngOnInit();
      const asset = component.affectedAssets.find((a) => a.assetId === 101);

      expect(asset?.fqdn).toBe('asset1.example.com');
    });

    it('should enrich affectedAssets with ip from details', () => {
      component.ngOnInit();
      const asset = component.affectedAssets.find((a) => a.assetId === 101);

      expect(asset?.ip).toBe('10.0.0.1');
    });

    it('should set totalRecords to affectedAssets length', () => {
      component.ngOnInit();
      expect(component.totalRecords).toBe(component.affectedAssets.length);
    });

    it('should set loading to false on complete', () => {
      component.ngOnInit();
      expect(component.loading).toBe(false);
    });

    it('should use mappedAssets as fallback when no assetDetails returned', () => {
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));
      const mapped = [{ assetId: 101, assetName: 'Asset1', sourceVulnIds: ['V-001'] }];

      component.loadAssetDetails(mapped);
      expect(component.affectedAssets).toEqual(mapped);
    });

    it('should show error and fallback to mappedAssets on service failure', () => {
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Detail error')));
      const mapped = [{ assetId: 101, assetName: 'Asset1', sourceVulnIds: ['V-001'] }];

      component.loadAssetDetails(mapped);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.affectedAssets).toEqual(mapped);
    });

    it('should set loading to false on detail error', () => {
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Detail error')));
      component.loadAssetDetails([]);
      expect(component.loading).toBe(false);
    });
  });

  describe('matchAssetsWithTeams', () => {
    beforeEach(() => {
      component.assetDeltaList = mockAssetDeltaList;
      component.affectedAssets = [{ assetId: 101, assetName: 'Asset1', fqdn: 'asset1.example.com', sourceVulnIds: ['V-001'] }];
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];
    });

    it('should return early when assetDeltaList has no assets', () => {
      component.assetDeltaList = {};
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam).toEqual({});
    });

    it('should assign teams to matching assets', () => {
      component.matchAssetsWithTeams();
      const asset = component.affectedAssets.find((a) => a.assetId === 101);

      expect(asset?.assignedTeams).toBeDefined();
      expect(asset?.assignedTeams[0].assignedTeamId).toBe('team1');
    });

    it('should populate assetsByTeam map', () => {
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam['team1']).toBeDefined();
    });

    it('should call createTeamTabs after matching', () => {
      const spy = vi.spyOn(component, 'createTeamTabs');

      component.matchAssetsWithTeams();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle assets with assignedTeam (non-array) form', () => {
      component.assetDeltaList = {
        assets: [
          {
            key: 'asset1',
            assignedTeam: { assignedTeamId: 'team2', assignedTeamName: 'Team Beta' }
          }
        ]
      };
      component.matchAssetsWithTeams();
      const asset = component.affectedAssets.find((a) => a.assetId === 101);

      expect(asset?.assignedTeams?.[0].assignedTeamId).toBe('team2');
    });
  });

  describe('createTeamTabs', () => {
    beforeEach(() => {
      component.affectedAssets = [{ assetId: 101, assetName: 'Asset1', assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }] }];
      component.assetsByTeam = {
        team1: [{ assetId: 101, assetName: 'Asset1', assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }]
      };
    });

    it('should always include "all" tab first', () => {
      component.createTeamTabs();
      expect(component.teamTabs[0].teamId).toBe('all');
    });

    it('should add a tab for each team in assetsByTeam', () => {
      component.createTeamTabs();
      expect(component.teamTabs.length).toBe(2);
    });

    it('should set correct teamName for team tab', () => {
      component.createTeamTabs();
      const teamTab = component.teamTabs.find((t) => t.teamId === 'team1');

      expect(teamTab?.teamName).toBe('Team Alpha');
    });

    it('should set assets for each team tab', () => {
      component.createTeamTabs();
      const teamTab = component.teamTabs.find((t) => t.teamId === 'team1');

      expect(teamTab?.assets.length).toBe(1);
    });
  });

  describe('updateTableReferences', () => {
    it('should clear the tableMap and repopulate from teamTabs', () => {
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];
      component.updateTableReferences();
      expect((component as any).tableMap.size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset filterValue to empty string', () => {
      component.filterValue = 'test';
      component.clear();
      expect(component.filterValue).toBe('');
    });

    it('should call clear on active table when available', () => {
      (component as any).tableMap.set('all', mockTable);
      component.activeTab = 'all';
      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should not throw when no active table is found', () => {
      component.activeTab = 'nonexistent';
      expect(() => component.clear()).not.toThrow();
    });
  });

  describe('onGlobalFilter', () => {
    it('should call filterGlobal on active table with input value', () => {
      (component as any).tableMap.set('all', mockTable);
      component.activeTab = 'all';
      const event = { target: { value: 'search' } } as any;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search', 'contains');
    });

    it('should not throw when no active table is found', () => {
      component.activeTab = 'nonexistent';
      const event = { target: { value: 'search' } } as any;

      expect(() => component.onGlobalFilter(event)).not.toThrow();
    });
  });

  describe('exportCSV', () => {
    beforeEach(() => {
      component.initColumnsAndFilters();
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [{ assetId: 101, assetName: 'Asset1', sourceVulnIds: ['V-001'], labels: [{ name: 'prod' }], assignedTeams: [{ assignedTeamName: 'Alpha' }] }] }];
      component.activeTab = 'all';
    });

    it('should call csvExportService.exportToCsv', () => {
      component.exportCSV();
      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
    });

    it('should pass filename containing groupId', () => {
      component.exportCSV();
      const callArgs = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(callArgs[1].filename).toContain('V-001');
    });

    it('should show warn message when no assets to export', () => {
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];
      component.affectedAssets = [];
      component.exportCSV();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should process labels array to string', () => {
      component.exportCSV();
      const data = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(data[0].labels).toBe('prod');
    });

    it('should process assignedTeams array to string', () => {
      component.exportCSV();
      const data = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(data[0].teamAssigned).toBe('Alpha');
    });

    it('should process sourceVulnIds array to string', () => {
      component.exportCSV();
      const data = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(data[0].sourceVulnIds).toBe('V-001');
    });
  });

  describe('resetColumnSelections', () => {
    it('should set selectedColumns to cols', () => {
      component.initColumnsAndFilters();
      component.selectedColumns = [];
      component.resetColumnSelections();
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call multiSelect().hide() when overlayVisible is true', () => {
      const mockMs = { overlayVisible: true, hide: vi.fn(), show: vi.fn() };

      (component as any).multiSelect = () => mockMs;
      component.toggleAddColumnOverlay();
      expect(mockMs.hide).toHaveBeenCalled();
    });

    it('should call multiSelect().show() when overlayVisible is false', () => {
      const mockMs = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };

      (component as any).multiSelect = () => mockMs;
      component.toggleAddColumnOverlay();
      expect(mockMs.show).toHaveBeenCalled();
    });

    it('should not throw when multiSelect is undefined', () => {
      (component as any).multiSelect = () => undefined;
      expect(() => component.toggleAddColumnOverlay()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
