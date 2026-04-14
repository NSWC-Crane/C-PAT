/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableMetricsComponent } from './tenable-metrics.component';
import { ImportService } from '../../import-processing/import.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };

  if (!(globalThis as any).URL?.createObjectURL) {
    (globalThis as any).URL = { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() };
  } else {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  }
});

const nowSeconds = Math.floor(Date.now() / 1000);

const mockAnalysisResponse = {
  response: {
    totalRecords: 10,
    results: [
      { severity: { id: '4' }, count: '5', pluginID: '11111' },
      { severity: { id: '3' }, count: '3', pluginID: '22222' },
      { severity: { id: '2' }, count: '8', pluginID: '33333' },
      { severity: { id: '1' }, count: '2', pluginID: '44444' },
      { severity: { id: '0' }, count: '1', pluginID: '55555' }
    ]
  }
};

const mockHostResponse = {
  response: [{ lastSeen: nowSeconds - 3600 }, { lastSeen: nowSeconds - 86400 * 5 }, { lastSeen: nowSeconds - 86400 * 60 }]
};

const mockPoams = [
  { poamId: 1, vulnerabilityId: 'P001', status: 'Approved', associatedVulnerabilities: ['P002'] },
  { poamId: 2, vulnerabilityId: 'P003', status: 'Draft', associatedVulnerabilities: [] }
];

const mockCollection = { collectionId: 1, collectionName: 'Tenable Collection', originCollectionId: '42' };

describe('TenableMetricsComponent', () => {
  let component: TenableMetricsComponent;
  let fixture: ComponentFixture<TenableMetricsComponent>;
  let mockImportService: any;
  let mockCollectionsService: any;
  let mockMessageService: any;

  beforeEach(async () => {
    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of(mockAnalysisResponse)),
      postTenableHostSearch: vi.fn().mockReturnValue(of(mockHostResponse)),
      getIAVPluginIds: vi.fn().mockReturnValue(of('12345,67890')),
      getIAVInfoForPlugins: vi.fn().mockReturnValue(of([{ navyComplyDate: '2020-01-01', supersededBy: null }]))
    };

    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of(mockPoams))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableMetricsComponent],
      providers: [
        { provide: ImportService, useValue: mockImportService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TenableMetricsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize isLoading as true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should initialize collectionName as empty string', () => {
      expect(component.collectionName()).toBe('');
    });

    it('should initialize originCollectionId as empty string', () => {
      expect(component.originCollectionId()).toBe('');
    });

    it('should initialize findingsChartData as null', () => {
      expect(component.findingsChartData()).toBeNull();
    });

    it('should initialize allFindingsChartData as null', () => {
      expect(component.allFindingsChartData()).toBeNull();
    });

    it('should initialize lastObservedTimeRange as 30', () => {
      expect(component.lastObservedTimeRange()).toBe('30');
    });

    it('should initialize hostTimeRange as 30', () => {
      expect(component.hostTimeRange()).toBe('30');
    });

    it('should initialize loadedRanges as empty set', () => {
      expect(component.loadedRanges().size).toBe(0);
    });

    it('should initialize tenableMetrics with zero values', () => {
      const m = component.tenableMetrics();

      expect(m.catIOpenCount).toBe(0);
      expect(m.catIIOpenCount).toBe(0);
      expect(m.vphRating).toBe('Low');
    });
  });

  describe('totalFindings30Days computed', () => {
    it('should sum catI/II/III 30-day counts', () => {
      component.tenableMetrics.set({
        ...component.tenableMetrics(),
        catIOpenCount30Days: 4,
        catIIOpenCount30Days: 6,
        catIIIOpenCount30Days: 2
      });
      expect(component.totalFindings30Days()).toBe(12);
    });

    it('should return 0 when all zero', () => {
      expect(component.totalFindings30Days()).toBe(0);
    });
  });

  describe('totalFindings computed', () => {
    it('should sum catI/II/III all counts', () => {
      component.tenableMetrics.set({
        ...component.tenableMetrics(),
        catIOpenCount: 3,
        catIIOpenCount: 7,
        catIIIOpenCount: 1
      });
      expect(component.totalFindings()).toBe(11);
    });

    it('should return 0 when all zero', () => {
      expect(component.totalFindings()).toBe(0);
    });
  });

  describe('metricsDisplay computed', () => {
    it('should return array of MetricData objects', () => {
      expect(Array.isArray(component.metricsDisplay())).toBe(true);
    });

    it('should return 6 metric entries', () => {
      expect(component.metricsDisplay().length).toBe(6);
    });

    it('should show "-" for exploitable findings when loading', () => {
      component.isLoading.set(true);
      const d = component.metricsDisplay().find((m) => m.label.includes('Exploitable'));

      expect(d?.value).toBe('-');
    });

    it('should show numeric value when not loading', () => {
      component.isLoading.set(false);
      component.tenableMetrics.set({ ...component.tenableMetrics(), exploitableFindingsCount: 7 });
      const d = component.metricsDisplay().find((m) => m.label.includes('Exploitable'));

      expect(d?.value).toBe(7);
    });

    it('should include Credential Scan Coverage metric', () => {
      const d = component.metricsDisplay().find((m) => m.label.includes('Credential'));

      expect(d).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should emit componentInit with self', () => {
      const spy = vi.spyOn(component.componentInit, 'emit');

      component.ngOnInit();
      expect(spy).toHaveBeenCalledWith(component);
    });

    it('should not call services when no collection', () => {
      component.ngOnInit();
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should leave isLoading true when no collection', () => {
      component.ngOnInit();
      expect(component.isLoading()).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    it('should set collectionName from collection', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.collectionName()).toBe('Tenable Collection');
    });

    it('should set originCollectionId from collection', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.originCollectionId()).toBe('42');
    });

    it('should handle null originCollectionId gracefully', () => {
      component.collection = { ...mockCollection, originCollectionId: null };
      component.ngOnChanges();
      expect(component.originCollectionId()).toBe('');
    });

    it('should not call services when no collection', () => {
      component.collection = null;
      component.ngOnChanges();
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });

    it('should clear loadedRanges cache on change', () => {
      component.loadedRanges.set(new Set(['30', '7'] as any));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.loadedRanges().has('7')).toBe(false);
    });

    it('should set isLoading to false after successful load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('should update catIOpenCount after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      const m = component.tenableMetrics();

      expect(m.catIOpenCount).toBe(8);
    });

    it('should update catIIOpenCount after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.tenableMetrics().catIIOpenCount).toBe(8);
    });

    it('should update catIIIOpenCount after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.tenableMetrics().catIIIOpenCount).toBe(2);
    });

    it('should add 30 to loadedRanges after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.loadedRanges().has('30')).toBe(true);
    });

    it('should set findingsChartData after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.findingsChartData()).not.toBeNull();
    });

    it('should set allFindingsChartData after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.allFindingsChartData()).not.toBeNull();
    });

    it('should set empty metrics when no repoId', () => {
      component.collection = { collectionId: 1, collectionName: 'No Repo', originCollectionId: null };
      component.ngOnChanges();
      expect(component.tenableMetrics().catIOpenCount).toBe(0);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle service errors gracefully without showing an error toast', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      mockImportService.postTenableHostSearch.mockReturnValue(throwError(() => new Error('fail')));
      mockImportService.getIAVPluginIds.mockReturnValue(throwError(() => new Error('fail')));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to false on error', () => {
      mockImportService.postTenableHostSearch.mockReturnValue(throwError(() => new Error('fail')));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('onLastObservedRangeChange', () => {
    it('should update lastObservedTimeRange when range is already loaded', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      component.onLastObservedRangeChange('30');
      expect(component.lastObservedTimeRange()).toBe('30');
    });

    it('should load new range when not in cache', () => {
      component.collection = mockCollection;
      component.originCollectionId.set('42');
      component.ngOnChanges();
      const callsBefore = mockImportService.postTenableAnalysis.mock.calls.length;

      component.onLastObservedRangeChange('7');
      expect(mockImportService.postTenableAnalysis.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('onHostTimeRangeChange', () => {
    it('should set hostTimeRange signal', () => {
      component.hostTimeRange.set('30');
      component.onHostTimeRangeChange('7');
      expect(component.hostTimeRange()).toBe('7');
    });

    it('should not throw when cachedVulnerabilityData is null', () => {
      expect(() => component.onHostTimeRangeChange('7')).not.toThrow();
    });
  });

  describe('getVPHColor', () => {
    it('should return green for score < 2.5', () => {
      expect(component.getVPHColor(0)).toBe('#10b981');
      expect(component.getVPHColor(2.4)).toBe('#10b981');
    });

    it('should return light green for score < 2.6', () => {
      expect(component.getVPHColor(2.55)).toBe('#4ade80');
    });

    it('should return yellow-green for score < 2.7', () => {
      expect(component.getVPHColor(2.65)).toBe('#a3e635');
    });

    it('should return yellow for score < 2.8', () => {
      expect(component.getVPHColor(2.75)).toBe('#e4d02b');
    });

    it('should return amber for score < 2.9', () => {
      expect(component.getVPHColor(2.85)).toBe('#fbbf24');
    });

    it('should return orange-amber for score < 3', () => {
      expect(component.getVPHColor(2.95)).toBe('#fca726');
    });

    it('should return light orange for score < 3.1', () => {
      expect(component.getVPHColor(3.05)).toBe('#fb923c');
    });

    it('should return orange-red for score < 3.2', () => {
      expect(component.getVPHColor(3.15)).toBe('#f56e54');
    });

    it('should return red for score < 3.3', () => {
      expect(component.getVPHColor(3.25)).toBe('#f05a6a');
    });

    it('should return dark red for score >= 3.3', () => {
      expect(component.getVPHColor(3.3)).toBe('#f05a6acc');
      expect(component.getVPHColor(5)).toBe('#f05a6acc');
    });
  });

  describe('getLastObservedText', () => {
    it('should return empty string for all', () => {
      component.lastObservedTimeRange.set('all');
      expect(component.getLastObservedText()).toBe('');
    });

    it('should return within 7 days for 7', () => {
      component.lastObservedTimeRange.set('7');
      expect(component.getLastObservedText()).toBe('within 7 days');
    });

    it('should return within 30 days for 30', () => {
      component.lastObservedTimeRange.set('30');
      expect(component.getLastObservedText()).toBe('within 30 days');
    });

    it('should return within 90 days for 90', () => {
      component.lastObservedTimeRange.set('90');
      expect(component.getLastObservedText()).toBe('within 90 days');
    });
  });

  describe('exportMetrics', () => {
    it('should return early when cachedVulnerabilityData is null', () => {
      component.exportMetrics();
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should show info message when data for range is not loaded', () => {
      component.collection = mockCollection;
      component.originCollectionId.set('42');
      (component as any).cachedVulnerabilityData.set({ '7': null, '30': null, '90': null, all: null });
      component.exportMetrics();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'Loading Data' }));
    });

    it('should not throw when called after successful load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(() => component.exportMetrics()).not.toThrow();
    });

    it('should call exportAsCSV with collection name in filename', () => {
      const spy = vi.spyOn(component as any, 'exportAsCSV');

      component.collection = mockCollection;
      component.ngOnChanges();
      component.exportMetrics();
      const filename = spy.mock.calls[0]?.[1] as string;

      expect(filename).toContain('Tenable Collection');
    });
  });

  describe('refreshMetrics', () => {
    it('should update now date', () => {
      const before = component.now;

      component.refreshMetrics();
      expect(component.now).not.toBe(before);
    });

    it('should clear loadedRanges', () => {
      component.loadedRanges.set(new Set(['30'] as any));
      component.refreshMetrics();
      expect(component.loadedRanges().size).toBe(0);
    });

    it('should reload data when collection is set', () => {
      component.collection = mockCollection;
      component.originCollectionId.set('42');
      component.ngOnChanges();
      const callsBefore = mockImportService.postTenableAnalysis.mock.calls.length;

      component.refreshMetrics();
      expect(mockImportService.postTenableAnalysis.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
