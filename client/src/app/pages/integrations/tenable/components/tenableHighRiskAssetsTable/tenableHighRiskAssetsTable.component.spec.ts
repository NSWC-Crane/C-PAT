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
import { of, throwError, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableHighRiskAssetsTableComponent } from './tenableHighRiskAssetsTable.component';
import { IntegrationService } from '../../../integration.service';
import { CsvExportService } from '../../../../../common/utils/csv-export.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

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
  osCPE: 'cpe:/o:redhat:enterprise_linux:9.6::~~~~x86_64~',
  acrScore: '8.0',
  assetExposureScore: '450',
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
  let mockIntegrationService: any;
  let mockMessageService: any;
  let mockCsvExportService: any;

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

    fixture.componentRef.setInput('tenableRepoId', repoId);
    component.ngOnChanges(changes);
  };

  beforeEach(async () => {
    mockIntegrationService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of(makeAnalysisResponse([mockAssetRaw])))
    };

    mockMessageService = createMockMessageService();
    mockCsvExportService = { exportToCsv: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TenableHighRiskAssetsTableComponent],
      providers: [
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: CsvExportService, useValue: mockCsvExportService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableHighRiskAssetsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tenableRepoId', 42);
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
      expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should not call loadHighRiskAssets when tenableRepoId is 0', () => {
      triggerNgOnChanges(0);
      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should not call loadHighRiskAssets when tenableRepoId key is absent from changes', () => {
      component.ngOnChanges({});
      expect(mockIntegrationService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should call loadHighRiskAssets again when tenableRepoId changes to a new value', () => {
      triggerNgOnChanges(42);
      triggerNgOnChanges(99, 42);
      expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadHighRiskAssets', () => {
    it('should call postTenableAnalysis', () => {
      component.loadHighRiskAssets();
      expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should call postTenableAnalysis with correct query type and tool', () => {
      component.loadHighRiskAssets();
      const params = mockIntegrationService.postTenableAnalysis.mock.calls[0][0];

      expect(params.query.type).toBe('vuln');
      expect(params.query.tool).toBe('sumip');
    });

    it('should include repository filter with tenableRepoId as string', () => {
      (component as any).tenableRepoId = () => 42;
      component.loadHighRiskAssets();
      const params = mockIntegrationService.postTenableAnalysis.mock.calls[0][0];
      const repoFilter = params.query.filters.find((f: any) => f.id === 'repository');

      expect(repoFilter).toBeDefined();
      expect(repoFilter.value[0].id).toBe('42');
    });

    it.each([
      ['patchPublished', '30:all'],
      ['pluginType', 'active'],
      ['severity', '1,2,3,4'],
      ['lastSeen', '0:30']
    ])('should include %s filter with value %s', (id, value) => {
      component.loadHighRiskAssets();
      const params = mockIntegrationService.postTenableAnalysis.mock.calls[0][0];
      const filter = params.query.filters.find((f: any) => f.id === id);

      expect(filter).toBeDefined();
      expect(filter.value).toBe(value);
    });

    it('should sort by score descending', () => {
      component.loadHighRiskAssets();
      const params = mockIntegrationService.postTenableAnalysis.mock.calls[0][0];

      expect(params.query.sortColumn).toBe('score');
      expect(params.query.sortDirection).toBe('desc');
    });

    it('should set isLoading to true while loading', () => {
      let capturedLoading: boolean | undefined;

      mockIntegrationService.postTenableAnalysis.mockImplementation(() => {
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
      expect(component.highRiskAssets()).toHaveLength(1);
    });

    it('should set highRiskAssetsTotalRecords from response', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRaw], 50)));
      component.loadHighRiskAssets();
      expect(component.highRiskAssetsTotalRecords()).toBe(50);
    });

    it('should default totalRecords to 0 when not parseable', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of({ response: { results: [], totalRecords: 'NaN' } }));
      component.loadHighRiskAssets();
      expect(component.highRiskAssetsTotalRecords()).toBe(0);
    });

    it('should handle missing response gracefully', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of({}));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to false on catchError', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadHighRiskAssets();
      expect(component.isLoading()).toBe(false);
    });

    it('should set highRiskAssets to empty array on error', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toEqual([]);
    });

    it('surfaces a message rather than failing silently on error', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadHighRiskAssets();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Network error') }));
    });
  });

  describe('load generation guard', () => {
    it('keeps the newest load when an earlier one lands afterwards', () => {
      const first = new Subject<any>();
      const second = new Subject<any>();

      mockIntegrationService.postTenableAnalysis.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());

      component.loadHighRiskAssets();
      component.loadHighRiskAssets();

      second.next(makeAnalysisResponse([mockAssetRaw, mockAssetRawNoDns], 2));
      first.next(makeAnalysisResponse([mockAssetRaw], 1));

      expect(component.highRiskAssets()).toHaveLength(2);
      expect(component.highRiskAssetsTotalRecords()).toBe(2);
    });

    it('does not surface an error from an earlier load', () => {
      const first = new Subject<any>();

      mockIntegrationService.postTenableAnalysis.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(of(makeAnalysisResponse([mockAssetRaw], 1)));

      component.loadHighRiskAssets();
      component.loadHighRiskAssets();
      mockMessageService.add.mockClear();

      first.error(new Error('stale failure'));

      expect(mockMessageService.add).not.toHaveBeenCalled();
      expect(component.highRiskAssets()).toHaveLength(1);
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
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRawNoDns])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('HOST2');
    });

    it('should fall back to ip when dnsName and netbiosName are absent', () => {
      const raw = { ...mockAssetRaw, dnsName: '', netbiosName: undefined, dns: undefined };

      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('192.168.1.10');
    });

    it('should use dns field when dnsName is empty and netbiosName has no backslash', () => {
      const raw = { ...mockAssetRaw, dnsName: '', netbiosName: undefined, dns: 'host.dns.local' };

      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].dnsName).toBe('host.dns.local');
    });

    it('should keep the raw osCPE and derive a readable operatingSystem', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.osCPE).toBe('cpe:/o:redhat:enterprise_linux:9.6::~~~~x86_64~');
      expect(asset.operatingSystem).toBe('Red Hat Enterprise Linux 9.6 (x86_64)');
    });

    it('should leave osCPE and operatingSystem empty when the field is absent', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRawNoDns])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.osCPE).toBe('');
      expect(asset.operatingSystem).toBe('');
    });

    it.each(['', '   ', null, undefined, 0, false, {}])('should leave osCPE and operatingSystem empty when the field is %j', (osCPE) => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, osCPE }])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.osCPE).toBe('');
      expect(asset.operatingSystem).toBe('');
    });

    it('should fall back to the raw value when osCPE is not a parseable CPE', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, osCPE: ' Linux Kernel 3.10 on RHEL 7 ' }])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.osCPE).toBe('Linux Kernel 3.10 on RHEL 7');
      expect(asset.operatingSystem).toBe('Linux Kernel 3.10 on RHEL 7');
    });

    it('should format a partial CPE with omitted components', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, osCPE: 'cpe:/o:microsoft:windows_server_2016' }])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].operatingSystem).toBe('Microsoft Windows Server 2016');
    });

    it('should format the operating-system entry when osCPE holds several CPEs', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, osCPE: 'cpe:/a:openbsd:openssh:9.3\ncpe:/o:microsoft:windows_10:::x64-enterprise' }])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].operatingSystem).toBe('Microsoft Windows 10 (x64 Enterprise)');
    });

    it('should convert acrScore and assetExposureScore to numbers', () => {
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.acrScore).toBe(8);
      expect(asset.assetExposureScore).toBe(450);
    });

    it('should leave acrScore and assetExposureScore null when the fields are absent', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRawNoDns])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.acrScore).toBeNull();
      expect(asset.assetExposureScore).toBeNull();
    });

    it.each(['', null, undefined])('should leave acrScore and assetExposureScore null when the fields are %j', (value) => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, acrScore: value, assetExposureScore: value }])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.acrScore).toBeNull();
      expect(asset.assetExposureScore).toBeNull();
    });

    it('should keep a zero assetExposureScore as 0 rather than null', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([{ ...mockAssetRaw, assetExposureScore: '0' }])));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()[0].assetExposureScore).toBe(0);
    });

    it('should map rows independently when only some carry osCPE', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRaw, mockAssetRawNoDns], 2)));
      component.loadHighRiskAssets();
      const [withCpe, withoutCpe] = component.highRiskAssets();

      expect(withCpe.operatingSystem).toBe('Red Hat Enterprise Linux 9.6 (x86_64)');
      expect(withoutCpe.operatingSystem).toBe('');
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

      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
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

      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      const asset = component.highRiskAssets()[0];

      expect(asset.lowPercent).toBe(0);
      expect(asset.mediumPercent).toBe(0);
      expect(asset.highPercent).toBe(0);
      expect(asset.criticalPercent).toBe(0);
    });

    it('should spread original item properties into mapped asset', () => {
      const raw = { ...mockAssetRaw, customField: 'extra' };

      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([raw])));
      component.loadHighRiskAssets();
      expect((component.highRiskAssets()[0] as any).customField).toBe('extra');
    });

    it('should map multiple assets', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(of(makeAnalysisResponse([mockAssetRaw, mockAssetRawNoDns], 2)));
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toHaveLength(2);
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

  describe('exportCSV', () => {
    it('should export the operating system, OS CPE, ACR, and AES columns', () => {
      component.loadHighRiskAssets();
      Object.defineProperty(component, 'highRiskAssetTable', { get: () => () => ({ filteredValue: null }), configurable: true });

      component.exportCSV();

      const [rows, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(rows).toHaveLength(1);
      expect(options.filename).toBe('tenable_high_risk_assets');
      expect(options.columns).toEqual(
        expect.arrayContaining([
          { field: 'operatingSystem', header: 'Operating System' },
          { field: 'osCPE', header: 'OS CPE' },
          { field: 'acrScore', header: 'ACR' },
          { field: 'assetExposureScore', header: 'AES' }
        ])
      );
    });

    it('should export the filtered rows when a filter is active', () => {
      component.loadHighRiskAssets();
      const filtered = [component.highRiskAssets()[0]];

      Object.defineProperty(component, 'highRiskAssetTable', { get: () => () => ({ filteredValue: filtered }), configurable: true });

      component.exportCSV();

      expect(mockCsvExportService.exportToCsv.mock.calls[0][0]).toBe(filtered);
    });
  });

  describe('cleanup', () => {
    it('stops updating high-risk assets after destroy (takeUntilDestroyed)', () => {
      const analysisSubject = new Subject<any>();

      mockIntegrationService.postTenableAnalysis.mockReturnValue(analysisSubject.asObservable());
      component.loadHighRiskAssets();
      expect(component.highRiskAssets()).toEqual([]);

      fixture.destroy();
      analysisSubject.next(makeAnalysisResponse([mockAssetRaw]));
      expect(component.highRiskAssets()).toEqual([]);
    });

    it('does not throw on destroy', () => {
      component.loadHighRiskAssets();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
