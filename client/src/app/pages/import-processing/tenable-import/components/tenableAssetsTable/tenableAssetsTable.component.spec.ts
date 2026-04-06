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
import { of, throwError, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableAssetsTableComponent } from './tenableAssetsTable.component';
import { ImportService } from '../../../import.service';
import { AssetDeltaService } from '../../../../admin-processing/asset-delta/asset-delta.service';
import { CsvExportService } from '../../../../../common/utils/csv-export.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

const mockAnalysisResult = {
  response: {
    results: [
      {
        pluginID: '12345',
        name: 'Test Plugin',
        family: { name: 'Web Servers' },
        severity: { name: 'High' },
        vprScore: '7.5',
        hostUUID: 'uuid-1',
        netbiosName: 'HOST1',
        dnsName: 'host1.example.com',
        macAddress: 'AA:BB:CC:DD:EE:01',
        lastSeen: '1700000000',
        firstSeen: '1690000000',
        hasBeenMitigated: '0'
      },
      {
        pluginID: '99999',
        name: 'Another Plugin',
        family: { name: 'General' },
        severity: { name: 'Medium' },
        vprScore: '5.0',
        hostUUID: 'uuid-2',
        netbiosName: 'HOST2',
        dnsName: 'host2.example.com',
        macAddress: 'AA:BB:CC:DD:EE:02',
        lastSeen: '1700000000',
        firstSeen: '1690000000',
        hasBeenMitigated: '1'
      }
    ],
    totalRecords: 2
  }
};

describe('TenableAssetsTableComponent', () => {
  let component: TenableAssetsTableComponent;
  let fixture: ComponentFixture<TenableAssetsTableComponent>;
  let mockImportService: any;
  let mockAssetDeltaService: any;
  let mockCsvExportService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let mockTable: any;
  let mockMultiSelect: any;
  let selectedCollectionSubject: Subject<any>;

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
    selectedCollectionSubject = new Subject();
    mockTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn() };
    mockMultiSelect = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ ...mockAnalysisResult })),
      getTenablePlugin: vi.fn().mockReturnValue(of({ response: { id: 12345, description: 'Plugin desc', xrefs: '', vprContext: null } }))
    };

    mockAssetDeltaService = {
      getAssetDeltaListByCollection: vi.fn().mockReturnValue(of({ assets: [] }))
    };

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableAssetsTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ImportService, useValue: mockImportService },
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: CsvExportService, useValue: mockCsvExportService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableAssetsTableComponent);
    component = fixture.componentInstance;
    (component as any).tables = () => [];
    (component as any).multiSelect = () => mockMultiSelect;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default affectedAssets to empty array', () => {
      expect(component.affectedAssets).toEqual([]);
    });

    it('should default isLoading to true', () => {
      expect(component.isLoading).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default filterValue to empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should default displayDialog to false', () => {
      expect(component.displayDialog).toBe(false);
    });

    it('should default is30DayFilterActive to false', () => {
      expect(component.is30DayFilterActive).toBe(false);
    });

    it('should default activeTab to "all"', () => {
      expect(component.activeTab).toBe('all');
    });

    it('should default assetProcessing to false', () => {
      expect(component.assetProcessing).toBe(false);
    });

    it('should default associatedVulnerabilities to empty array', () => {
      expect(component.associatedVulnerabilities).toEqual([]);
    });

    it('should default cveReferences to empty array', () => {
      expect(component.cveReferences).toEqual([]);
    });

    it('should default iavReferences to empty array', () => {
      expect(component.iavReferences).toEqual([]);
    });

    it('should default otherReferences to empty array', () => {
      expect(component.otherReferences).toEqual([]);
    });
  });

  describe('initColumnsAndFilters', () => {
    it('should set 16 base columns when pluginID and tenableRepoId are not set', () => {
      component.pluginID = undefined as any;
      component.tenableRepoId = undefined as any;
      component.initColumnsAndFilters();
      expect(component.cols.length).toBe(16);
    });

    it('should add 3 POAM columns when pluginID and tenableRepoId are set', () => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.initColumnsAndFilters();
      expect(component.cols.length).toBe(19);
    });

    it('should include firstSeen and lastSeen columns when pluginID is set', () => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.initColumnsAndFilters();
      const fields = component.cols.map((c: any) => c.field);

      expect(fields).toContain('firstSeen');
      expect(fields).toContain('lastSeen');
      expect(fields).toContain('hasBeenMitigated');
    });

    it('should set exportColumns matching cols', () => {
      component.pluginID = undefined as any;
      component.tenableRepoId = undefined as any;
      component.initColumnsAndFilters();
      expect(component.exportColumns.length).toBe(component.cols.length);
    });

    it('should set selectedColumns to default subset', () => {
      component.pluginID = undefined as any;
      component.tenableRepoId = undefined as any;
      component.initColumnsAndFilters();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('pluginName');
      expect(fields).toContain('severity');
      expect(fields).toContain('ips');
    });

    it('should include lastSeen in selectedColumns when pluginID is set', () => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.initColumnsAndFilters();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('lastSeen');
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should set assetDeltaList from service response', () => {
      const mockDelta = { assets: [{ key: 'host1', assignedTeams: [] }] };

      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of(mockDelta));
      component.selectedCollection = 7;
      component.loadAssetDeltaList();
      expect(component.assetDeltaList).toEqual(mockDelta);
    });

    it('should default to empty array when response is null', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of(null));
      component.loadAssetDeltaList();
      expect(component.assetDeltaList).toEqual([]);
    });

    it('should show error on service failure', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.loadAssetDeltaList();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('getAffectedAssetsForAllPlugins', () => {
    beforeEach(() => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.associatedVulnerabilities = [];
    });

    it('should set isLoading to true at start', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: [], totalRecords: 0 } }));
      component.getAffectedAssetsForAllPlugins();
    });

    it('should call postTenableAnalysis', () => {
      component.getAffectedAssetsForAllPlugins();
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should populate affectedAssets from results', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.affectedAssets.length).toBe(2);
    });

    it('should set totalRecords to affectedAssets length', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.totalRecords).toBe(2);
    });

    it('should set isLoading to false on success', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.isLoading).toBe(false);
    });

    it('should map family name from nested object', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.affectedAssets[0].family).toBe('Web Servers');
    });

    it('should map severity name from nested object', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.affectedAssets[0].severity).toBe('High');
    });

    it('should mark hasBeenMitigated as "Previously Mitigated" when value is "1"', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      const mitigated = component.affectedAssets.find((a) => a.hostUUID === 'uuid-2');

      expect(mitigated?.hasBeenMitigated).toBe('Previously Mitigated');
    });

    it('should mark hasBeenMitigated as "False" when value is "0"', () => {
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      const notMitigated = component.affectedAssets.find((a) => a.hostUUID === 'uuid-1');

      expect(notMitigated?.hasBeenMitigated).toBe('False');
    });

    it('should deduplicate assets by hostUUID/netbios/dns/mac key', () => {
      const dupResult = {
        response: {
          results: [
            { pluginID: '12345', name: 'P1', family: { name: 'F1' }, severity: { name: 'High' }, hostUUID: 'uuid-1', netbiosName: 'HOST1', dnsName: 'd1.com', macAddress: 'AA', lastSeen: '1700000000', firstSeen: '1690000000', hasBeenMitigated: '0' },
            { pluginID: '99999', name: 'P2', family: { name: 'F1' }, severity: { name: 'High' }, hostUUID: 'uuid-1', netbiosName: 'HOST1', dnsName: 'd1.com', macAddress: 'AA', lastSeen: '1700000000', firstSeen: '1690000000', hasBeenMitigated: '0' }
          ],
          totalRecords: 2
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValue(of(dupResult));
      component.assetDeltaList = { assets: [] };
      component.getAffectedAssetsForAllPlugins();
      expect(component.affectedAssets.length).toBe(1);
    });

    it('should include 30-day filter when is30DayFilterActive is true', () => {
      component.is30DayFilterActive = true;
      component.getAffectedAssetsForAllPlugins();
      const callArgs = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filters = callArgs.query.filters;
      const lastSeenFilter = filters.find((f: any) => f.filterName === 'lastSeen');

      expect(lastSeenFilter).toBeDefined();
    });

    it('should include associatedVulnerability IDs in filter', () => {
      component.associatedVulnerabilities = ['99999', { associatedVulnerability: '88888' }];
      component.getAffectedAssetsForAllPlugins();
      const callArgs = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const pluginFilter = callArgs.query.filters.find((f: any) => f.filterName === 'pluginID');

      expect(pluginFilter.value).toContain('99999');
      expect(pluginFilter.value).toContain('88888');
    });

    it('should show error when response has no results', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: null }));
      component.getAffectedAssetsForAllPlugins();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error on service failure', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      component.getAffectedAssetsForAllPlugins();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('getAffectedAssetsByPluginId', () => {
    it('should return an Observable of mapped assets', () => {
      component.getAffectedAssetsByPluginId('12345', 99).subscribe((assets) => {
        expect(assets.length).toBe(2);
        expect(assets[0].family).toBe('Web Servers');
      });
    });

    it('should set sourcePluginID on each asset', () => {
      component.getAffectedAssetsByPluginId('12345', 99).subscribe((assets) => {
        expect(assets[0].sourcePluginID).toBe('12345');
      });
    });

    it('should return empty array on service error', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      component.getAffectedAssetsByPluginId('12345', 99).subscribe((assets) => {
        expect(assets).toEqual([]);
      });
    });

    it('should show error message on service failure', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      component.getAffectedAssetsByPluginId('12345', 99).subscribe(() => {});
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('matchAssetsWithTeams', () => {
    it('should return early when assetDeltaList has no assets', () => {
      component.assetDeltaList = null;
      component.affectedAssets = [{ netbiosName: 'HOST1', dnsName: 'host1.com' }];
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam).toEqual({});
    });

    it('should match assets by netbiosName to delta key', () => {
      component.assetDeltaList = {
        assets: [
          {
            key: 'host1',
            assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }]
          }
        ]
      };
      component.affectedAssets = [{ netbiosName: 'HOST1', dnsName: 'other.com', hostUUID: 'u1', macAddress: 'AA' }];
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam['team1']).toBeDefined();
    });

    it('should match assets by dnsName to delta key', () => {
      component.assetDeltaList = {
        assets: [
          {
            key: 'host1',
            assignedTeams: [{ assignedTeamId: 'team2', assignedTeamName: 'Team Beta' }]
          }
        ]
      };
      component.affectedAssets = [{ netbiosName: 'OTHER', dnsName: 'host1.example.com', hostUUID: 'u1', macAddress: 'AA' }];
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam['team2']).toBeDefined();
    });

    it('should not duplicate teams on same asset', () => {
      component.assetDeltaList = {
        assets: [
          { key: 'host1', assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }] },
          { key: 'host1.example', assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }] }
        ]
      };
      component.affectedAssets = [{ netbiosName: 'HOST1.EXAMPLE', dnsName: 'host1.example.com', hostUUID: 'u1', macAddress: 'AA' }];
      component.matchAssetsWithTeams();
      const asset = component.affectedAssets[0];

      expect(asset.assignedTeams?.length).toBe(1);
    });

    it('should build assetsByTeam with matched assets', () => {
      component.assetDeltaList = {
        assets: [{ key: 'host1', assignedTeams: [{ assignedTeamId: 'team1', assignedTeamName: 'Team Alpha' }] }]
      };
      component.affectedAssets = [
        { netbiosName: 'HOST1', dnsName: 'd1.com', hostUUID: 'u1', macAddress: 'AA' },
        { netbiosName: 'HOST2', dnsName: 'd2.com', hostUUID: 'u2', macAddress: 'BB' }
      ];
      component.matchAssetsWithTeams();
      expect(component.assetsByTeam['team1'].length).toBe(1);
    });
  });

  describe('createTeamTabs', () => {
    it('should always include "all" tab as first element', () => {
      component.affectedAssets = [];
      component.assetsByTeam = {};
      component.createTeamTabs();
      expect(component.teamTabs[0].teamId).toBe('all');
    });

    it('should create a tab for each team with assets', () => {
      component.affectedAssets = [];
      component.assetsByTeam = {
        team1: [{ assignedTeamName: 'Team Alpha', hostUUID: 'u1' }],
        team2: [{ assignedTeamName: 'Team Beta', hostUUID: 'u2' }]
      };
      component.createTeamTabs();
      expect(component.teamTabs.length).toBe(3);
    });

    it('should use assignedTeamName from first asset in team', () => {
      component.affectedAssets = [];
      component.assetsByTeam = {
        team1: [{ assignedTeamName: 'Alpha Team', hostUUID: 'u1' }]
      };
      component.createTeamTabs();
      const teamTab = component.teamTabs.find((t) => t.teamId === 'team1');

      expect(teamTab?.teamName).toBe('Alpha Team');
    });

    it('should not create tab for empty teams', () => {
      component.affectedAssets = [];
      component.assetsByTeam = { team1: [] };
      component.createTeamTabs();
      expect(component.teamTabs.length).toBe(1);
    });
  });

  describe('lazyOrNot', () => {
    const event = { first: 0, rows: 25 } as any;

    it('should call getAffectedAssetsByPluginId when pluginID set and not assetProcessing', () => {
      const spy = vi.spyOn(component, 'getAffectedAssetsByPluginId').mockReturnValue(of([]));

      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.assetProcessing = false;
      component.lazyOrNot(event);
      expect(spy).toHaveBeenCalledWith('12345', 99);
    });

    it('should call getAffectedAssets when assetProcessing is true', () => {
      const spy = vi.spyOn(component, 'getAffectedAssets').mockImplementation(() => {});

      component.pluginID = undefined as any;
      component.assetProcessing = true;
      component.lazyOrNot(event);
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  describe('formatTimestamp', () => {
    it('should return undefined for undefined input', () => {
      expect(component.formatTimestamp(undefined)).toBeUndefined();
    });

    it('should return undefined for "-1"', () => {
      expect(component.formatTimestamp('-1')).toBeUndefined();
    });

    it('should return date string for unix timestamp string', () => {
      const result = component.formatTimestamp('1700000000');

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return as-is for slash-formatted date strings', () => {
      expect(component.formatTimestamp('11/14/2023')).toBe('11/14/2023');
    });

    it('should return empty string for invalid timestamp', () => {
      expect(component.formatTimestamp('not-a-number-and-not-slash')).toBe('');
    });
  });

  describe('parseVprContext', () => {
    it('should parse valid JSON array', () => {
      component.parseVprContext('[{"key":"val"}]');
      expect(component.parsedVprContext).toEqual([{ key: 'val' }]);
    });

    it('should set empty array on invalid JSON', () => {
      component.parseVprContext('not-json');
      expect(component.parsedVprContext).toEqual([]);
    });
  });

  describe('parseReferences', () => {
    it('should parse CVE references', () => {
      component.parseReferences('CVE:CVE-2023-1234');
      expect(component.cveReferences).toEqual([{ type: 'CVE', value: 'CVE-2023-1234' }]);
    });

    it('should parse IAVB references', () => {
      component.parseReferences('IAVB:2023-B-0001');
      expect(component.iavReferences).toEqual([{ type: 'IAVB', value: '2023-B-0001' }]);
    });

    it('should parse IAVA references', () => {
      component.parseReferences('IAVA:2023-A-0001');
      expect(component.iavReferences.length).toBe(1);
    });

    it('should parse other references', () => {
      component.parseReferences('BID:12345');
      expect(component.otherReferences).toEqual([{ type: 'BID', value: '12345' }]);
    });

    it('should handle multiple references', () => {
      component.parseReferences('CVE:CVE-2023-1234 IAVB:2023-B-0001 BID:99');
      expect(component.cveReferences.length).toBe(1);
      expect(component.iavReferences.length).toBe(1);
      expect(component.otherReferences.length).toBe(1);
    });

    it('should strip trailing comma from reference value', () => {
      component.parseReferences('CVE:CVE-2023-1234,');
      expect(component.cveReferences[0].value).toBe('CVE-2023-1234');
    });
  });

  describe('getCveUrl / getIavUrl', () => {
    it('getCveUrl should include the CVE id', () => {
      const url = component.getCveUrl('CVE-2023-1234');

      expect(url).toContain('CVE-2023-1234');
    });

    it('getIavUrl should include the IAV number', () => {
      const url = component.getIavUrl('2023-A-0001');

      expect(url).toContain('2023-A-0001');
    });
  });

  describe('getSeverityStyling', () => {
    it('should return "danger" for Critical', () => {
      expect(component.getSeverityStyling('Critical')).toBe('danger');
    });

    it('should return "danger" for High', () => {
      expect(component.getSeverityStyling('High')).toBe('danger');
    });

    it('should return "warn" for Medium', () => {
      expect(component.getSeverityStyling('Medium')).toBe('warn');
    });

    it('should return "info" for Low', () => {
      expect(component.getSeverityStyling('Low')).toBe('info');
    });

    it('should return "info" for Info', () => {
      expect(component.getSeverityStyling('Info')).toBe('info');
    });

    it('should return "info" for unknown severity', () => {
      expect(component.getSeverityStyling('Unknown')).toBe('info');
    });
  });

  describe('filter30Days', () => {
    it('should toggle is30DayFilterActive from false to true', () => {
      component.is30DayFilterActive = false;
      vi.spyOn(component, 'getAffectedAssetsForAllPlugins').mockImplementation(() => {});

      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.filter30Days();
      expect(component.is30DayFilterActive).toBe(true);
    });

    it('should toggle is30DayFilterActive from true to false', () => {
      component.is30DayFilterActive = true;
      vi.spyOn(component, 'getAffectedAssetsForAllPlugins').mockImplementation(() => {});

      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.filter30Days();
      expect(component.is30DayFilterActive).toBe(false);
    });

    it('should call getAffectedAssetsForAllPlugins when pluginID and tenableRepoId are set', () => {
      const spy = vi.spyOn(component, 'getAffectedAssetsForAllPlugins').mockImplementation(() => {});

      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.filter30Days();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getAffectedAssets when assetProcessing is true', () => {
      const spy = vi.spyOn(component, 'getAffectedAssets').mockImplementation(() => {});

      component.assetProcessing = true;
      component.tenableRepoId = 99;
      component.pluginID = undefined as any;
      component.filter30Days();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should call activeTable.clear() when table is found in tableMap', () => {
      (component as any).tableMap.set('all', mockTable);
      component.activeTab = 'all';
      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset filterValue to empty string', () => {
      component.filterValue = 'some filter';
      (component as any).tableMap.set('all', mockTable);
      component.activeTab = 'all';
      component.clear();
      expect(component.filterValue).toBe('');
    });
  });

  describe('onGlobalFilter', () => {
    it('should call filterGlobal on active table', () => {
      (component as any).tableMap.set('all', mockTable);
      component.activeTab = 'all';
      const event = { target: { value: 'search term' } } as any;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search term', 'contains');
    });
  });

  describe('exportCSV', () => {
    beforeEach(() => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.initColumnsAndFilters();
    });

    it('should show warn message when no assets to export', () => {
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];
      component.affectedAssets = [];
      component.activeTab = 'all';
      component.exportCSV();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should call csvExportService.exportToCsv when assets exist', () => {
      component.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [{ pluginID: '12345', assignedTeams: [], sourcePluginIDs: ['12345'] }] }];
      component.activeTab = 'all';
      component.exportCSV();
      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
    });

    it('should flatten assignedTeams array to string in export', () => {
      component.teamTabs = [
        {
          teamId: 'all',
          teamName: 'All',
          assets: [
            {
              pluginID: '12345',
              assignedTeams: [{ assignedTeamName: 'Alpha' }, { assignedTeamName: 'Beta' }],
              sourcePluginIDs: ['12345']
            }
          ]
        }
      ];
      component.activeTab = 'all';
      component.exportCSV();
      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0].teamAssigned).toBe('Alpha, Beta');
    });

    it('should flatten sourcePluginIDs array to string in export', () => {
      component.teamTabs = [
        {
          teamId: 'all',
          teamName: 'All',
          assets: [{ pluginID: '12345', sourcePluginIDs: ['11111', '22222'] }]
        }
      ];
      component.activeTab = 'all';
      component.exportCSV();
      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0].sourcePluginIDs).toBe('11111, 22222');
    });

    it('should use fallback affectedAssets when no matching tab', () => {
      component.teamTabs = [];
      component.affectedAssets = [{ pluginID: '12345', sourcePluginIDs: ['12345'] }];
      component.activeTab = 'all';
      component.exportCSV();
      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
    });
  });

  describe('resetColumnSelections', () => {
    it('should filter selectedColumns to default fields', () => {
      component.pluginID = undefined as any;
      component.tenableRepoId = undefined as any;
      component.initColumnsAndFilters();
      component.selectedColumns = [];
      component.resetColumnSelections();
      expect(component.selectedColumns.length).toBeGreaterThan(0);
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('severity');
      expect(fields).not.toContain('firstSeen');
    });

    it('should include lastSeen when pluginID is set', () => {
      component.pluginID = '12345';
      component.tenableRepoId = 99;
      component.initColumnsAndFilters();
      component.resetColumnSelections();
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('lastSeen');
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
