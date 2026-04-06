/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TenableHighRiskAssetsTableComponent } from './tenableHighRiskAssetsTable.component';
import { ImportService } from '../../../import.service';

const makeAnalysisResponse = (results: any[], totalRecords = results.length) => ({
  response: {
    results,
    totalRecords: String(totalRecords)
  }
});

const mockAssetRaw = {
  ip: '192.168.1.10',
  dnsName: 'host.example.com',
  netbiosName: 'DOMAIN\\HOST',
  score: '850',
  total: '30',
  severityInfo: '5',
  severityLow: '4',
  severityMedium: '10',
  severityHigh: '8',
  severityCritical: '2'
};

const mockAssetRawNoDns = {
  ip: '10.0.0.5',
  dnsName: '',
  netbiosName: 'DOMAIN\\HOST2',
  score: '300',
  total: '15',
  severityInfo: '0',
  severityLow: '2',
  severityMedium: '5',
  severityHigh: '3',
  severityCritical: '1'
};

describe('TenableHighRiskAssetsTableComponent', () => {
  let component: TenableHighRiskAssetsTableComponent;
  let fixture: ComponentFixture<TenableHighRiskAssetsTableComponent>;
  let mockImportService: any;

  const createMockTable = () => ({
    clear: vi.fn(),
    filterGlobal: vi.fn()
  });

  const setupTableMock = () => {
    const mockTable = createMockTable();

    Object.defineProperty(component, 'highRiskAssetTable', { get: () => () => mockTable, configurable: true });

    return mockTable;
  };

  const triggerNgOnChanges = (repoId: number, previousValue?: number) => {
    const changes: SimpleChanges = {
      tenableRepoId: new SimpleChange(previousValue ?? null, repoId, previousValue === undefined)
    };

    component.tenableRepoId = repoId;
    component.ngOnChanges(changes);
  };

  beforeEach(async () => {
    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of(makeAnalysisResponse([mockAssetRaw])))
    };

    await TestBed.configureTestingModule({
      imports: [TenableHighRiskAssetsTableComponent],
      providers: [{ provide: ImportService, useValue: mockImportService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableHighRiskAssetsTableComponent);
    component = fixture.componentInstance;
    component.tenableRepoId = 42;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial signal state', () => {
    it('should initialize highRiskAssets as empty array', () => {
      expect(component.highRiskAssets()).toEqual([]);
    });

    it('should initialize highRiskAssetsTotalRecords as 0', () => {
      expect(component.highRiskAssetsTotalRecords()).toBe(0);
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize selectedHost as null', () => {
      expect(component.selectedHost()).toBeNull();
    });

    it('should initialize displayDialog as false', () => {
      expect(component.displayDialog()).toBe(false);
    });

    it('should initialize filterValue as empty string', () => {
      expect(component.filterValue).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should call loadHighRiskAssets when tenableRepoId changes to a truthy value', () => {
      triggerNgOnChanges(42);
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should not call loadHighRiskAssets when tenableRepoId is 0', () => {
      triggerNgOnChanges(0);
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should not call loadHighRiskAssets when tenableRepoId key is absent from changes', () => {
      component.ngOnChanges({});
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should call loadHighRiskAssets again when tenableRepoId changes to a new value', () => {
      triggerNgOnChanges(42);
      triggerNgOnChanges(99, 42);
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadHighRiskAssets', () => {
    it('should call postTenableAnalysis', () => {
      component.loadHighRiskAssets();
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should call postTenableAnalysis with correct query type and tool', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];

      expect(params.query.type).toBe('vuln');
      expect(params.query.tool).toBe('sumip');
    });

    it('should include repository filter with tenableRepoId as string', () => {
      component.tenableRepoId = 42;
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const repoFilter = params.query.filters.find((f: any) => f.id === 'repository');

      expect(repoFilter).toBeDefined();
      expect(repoFilter.value[0].id).toBe('42');
    });

    it('should include patchPublished filter', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filter = params.query.filters.find((f: any) => f.id === 'patchPublished');

      expect(filter).toBeDefined();
      expect(filter.value).toBe('30:all');
    });

    it('should include pluginType filter with value active', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filter = params.query.filters.find((f: any) => f.id === 'pluginType');

      expect(filter).toBeDefined();
      expect(filter.value).toBe('active');
    });

    it('should include severity filter', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filter = params.query.filters.find((f: any) => f.id === 'severity');

      expect(filter).toBeDefined();
      expect(filter.value).toBe('1,2,3,4');
    });

    it('should include lastSeen filter', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const filter = params.query.filters.find((f: any) => f.id === 'lastSeen');

      expect(filter).toBeDefined();
      expect(filter.value).toBe('0:30');
    });

    it('should sort by score descending', () => {
      component.loadHighRiskAssets();
      const params = mockImportService.postTenableAnalysis.mock.calls[0][0];

      expect(params.query.sortColumn).toBe('score');
      expect(params.query.sortDirection).toBe('desc');
    });

    it('should set isLoading to true while loading', () => {
      let capturedLoading: boolean | undefined;

      mockImportService.postTenableAnalysis.mockImplementation(() => {
        capturedLoading = component.isLoading();

        return of(makeAnalysisResponse([]));
      });
      component.loadHighRiskAssets();
      expect(capturedLoading).toBe(true);
    });

    it('should set isLoading to false after success', () => {
      component.loadHighRiskAssets();
      expect(component.isLoading()).toBe(false);
    });

    it('should set highRiskAssets signal from response results', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets().length).toBe(1);
    });

    it('should set highRiskAssetsTotalRecords from response', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRaw], 50)));
      component.loadHighRiskAssets();
      expect(component.highRiskAssetsTotalRecords()).toBe(50);
    });

    it('should default totalRecords to 0 when not parseable', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: [], totalRecords: 'NaN' } }));
      component.loadHighRiskAssets();
      expect(component.highRiskAssetsTotalRecords()).toBe(0);
    });

    it('should handle missing response gracefully', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({}));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to false on catchError', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadHighRiskAssets();
      expect(component.isLoading()).toBe(false);
    });

    it('should set highRiskAssets to empty array on error', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toEqual([]);
    });
  });

  describe('response mapping', () => {
    it('should map ip field', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].ip).toBe('192.168.1.10');
    });

    it('should map dnsName when present', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('host.example.com');
    });

    it('should fall back to netbiosName hostname when dnsName is empty', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRawNoDns])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('HOST2');
    });

    it('should fall back to ip when dnsName and netbiosName are absent', () => {
      const raw = { ...mockAssetRaw, dnsName: '', netbiosName: undefined, dns: undefined };

      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('192.168.1.10');
    });

    it('should use dns field when dnsName is empty and netbiosName has no backslash', () => {
      const raw = { ...mockAssetRaw, dnsName: '', netbiosName: undefined, dns: 'host.dns.local' };

      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('host.dns.local');
    });

    it('should parse score as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].score).toBe(850);
    });

    it('should parse total as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].total).toBe(30);
    });

    it('should parse severityInfo as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].severityInfo).toBe(5);
    });

    it('should parse severityLow as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].severityLow).toBe(4);
    });

    it('should parse severityMedium as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].severityMedium).toBe(10);
    });

    it('should parse severityHigh as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].severityHigh).toBe(8);
    });

    it('should parse severityCritical as integer', () => {
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].severityCritical).toBe(2);
    });

    it('should default unparseable severity values to 0', () => {
      const raw = { ...mockAssetRaw, severityLow: 'N/A', severityMedium: null };

      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.severityLow).toBe(0);
      expect(asset.severityMedium).toBe(0);
    });

    it('should set catIII equal to severityLow', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.catIII).toBe(asset.severityLow);
    });

    it('should set catII equal to severityMedium', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.catII).toBe(asset.severityMedium);
    });

    it('should set catI equal to severityCritical + severityHigh', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.catI).toBe(asset.severityCritical + asset.severityHigh);
    });

    it('should calculate criticalPercent correctly', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.criticalPercent).toBeCloseTo(10);
    });

    it('should calculate highPercent correctly', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.highPercent).toBeCloseTo(40);
    });

    it('should calculate mediumPercent correctly', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.mediumPercent).toBeCloseTo(50);
    });

    it('should calculate lowPercent correctly', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.lowPercent).toBeCloseTo(20);
    });

    it('should set all percentages to 0 when totalSeverity is 0', () => {
      const raw = { ...mockAssetRaw, severityLow: '0', severityMedium: '0', severityHigh: '0', severityCritical: '0' };

      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.lowPercent).toBe(0);
      expect(asset.mediumPercent).toBe(0);
      expect(asset.highPercent).toBe(0);
      expect(asset.criticalPercent).toBe(0);
    });

    it('should spread original item properties into mapped asset', () => {
      const raw = { ...mockAssetRaw, customField: 'extra' };

      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect((component.highRiskAssets()[0] as any).customField).toBe('extra');
    });

    it('should map multiple assets', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRaw, mockAssetRawNoDns], 2)));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets().length).toBe(2);
    });
  });

  describe('onHostNameClick', () => {
    it('should set selectedHost signal to the clicked host', () => {
      const host = { ip: '10.0.0.1', dnsName: 'host.local' };
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.onHostNameClick(host, event);
      expect(component.selectedHost()).toBe(host);
    });

    it('should set displayDialog to true', () => {
      const host = { ip: '10.0.0.1', dnsName: 'host.local' };
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.onHostNameClick(host, event);
      expect(component.displayDialog()).toBe(true);
    });

    it('should call event.stopPropagation()', () => {
      const host = { ip: '10.0.0.1', dnsName: 'host.local' };
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.onHostNameClick(host, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should update selectedHost when called again with different host', () => {
      const host1 = { ip: '10.0.0.1', dnsName: 'host1.local' };
      const host2 = { ip: '10.0.0.2', dnsName: 'host2.local' };
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.onHostNameClick(host1, event);
      component.onHostNameClick(host2, event);
      expect(component.selectedHost()).toBe(host2);
    });
  });

  describe('onGlobalFilter', () => {
    it('should call highRiskAssetTable().filterGlobal with input value', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: 'host1' } } as unknown as Event;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('host1', 'contains');
    });

    it('should pass empty string when filter is cleared', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: '' } } as unknown as Event;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('clear', () => {
    it('should call highRiskAssetTable().clear()', () => {
      const mockTable = setupTableMock();

      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset filterValue to empty string', () => {
      const mockTable = setupTableMock();

      component.filterValue = 'test filter';
      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
      expect(component.filterValue).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without prior loadHighRiskAssets call', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
