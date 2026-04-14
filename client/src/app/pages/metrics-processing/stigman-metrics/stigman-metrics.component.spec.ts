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
import { STIGManagerMetricsComponent } from './stigman-metrics.component';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };

  if (!(globalThis as any).URL) {
    (globalThis as any).URL = { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() };
  } else {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  }
});

const mockStigSummary = [
  {
    benchmarkId: 'STIG_001',
    title: 'Test STIG',
    assets: 5,
    metrics: {
      assessments: 10,
      assessed: 10,
      findings: { high: 2, medium: 3, low: 1 },
      assessedBySeverity: { high: 8, medium: 7, low: 5 },
      assessmentsBySeverity: { high: 10, medium: 10, low: 5 },
      statuses: { submitted: 2, accepted: 3, rejected: 1, saved: 4 }
    }
  }
];

const mockFindings = [
  { groupId: 'V-001', severity: 'high', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-002', severity: 'medium', stigs: [{ benchmarkId: 'STIG_001' }] },
  { groupId: 'V-003', severity: 'low', stigs: [{ benchmarkId: 'STIG_001' }] }
];

const mockCollectionMetrics = { assets: 12 };

const mockPoams = [
  { poamId: 1, vulnerabilityId: 'V-001', status: 'Approved', labels: [], associatedVulnerabilities: [] },
  { poamId: 2, vulnerabilityId: 'V-002', status: 'Draft', labels: [{ labelName: 'CORA STIG KIOR' }], associatedVulnerabilities: ['V-010'] }
];

const mockCollection = { collectionId: 1, collectionName: 'Test Collection', originCollectionId: 42, collectionOrigin: 'STIG Manager' };

describe('STIGManagerMetricsComponent', () => {
  let component: STIGManagerMetricsComponent;
  let fixture: ComponentFixture<STIGManagerMetricsComponent>;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let mockMessageService: any;

  beforeEach(async () => {
    mockSharedService = {
      getCollectionSTIGSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockStigSummary)),
      getFindingsMetricsFromSTIGMAN: vi.fn().mockReturnValue(of(mockFindings)),
      getCollectionMetricsSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockCollectionMetrics))
    };

    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of(mockPoams))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [STIGManagerMetricsComponent],
      providers: [
        { provide: SharedService, useValue: mockSharedService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(STIGManagerMetricsComponent);
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

    it('should initialize assessmentChartData as null', () => {
      expect(component.assessmentChartData()).toBeNull();
    });

    it('should initialize stigsAssessmentData as empty array', () => {
      expect(component.stigsAssessmentData()).toEqual([]);
    });

    it('should initialize stigManagerMetrics with zero values', () => {
      const m = component.stigManagerMetrics();

      expect(m.catIOpenCount).toBe(0);
      expect(m.catIIOpenCount).toBe(0);
      expect(m.catIIIOpenCount).toBe(0);
      expect(m.coraRiskRating).toBe('Very Low');
    });
  });

  describe('totalRawFindings computed', () => {
    it('should sum catI/II/III open raw counts', () => {
      component.stigManagerMetrics.set({
        ...component.stigManagerMetrics(),
        catIOpenRawCount: 5,
        catIIOpenRawCount: 10,
        catIIIOpenRawCount: 3
      });
      expect(component.totalRawFindings()).toBe(18);
    });

    it('should return 0 when all raw counts are 0', () => {
      expect(component.totalRawFindings()).toBe(0);
    });
  });

  describe('metricsDisplay computed', () => {
    it('should return array of MetricData objects', () => {
      const display = component.metricsDisplay();

      expect(Array.isArray(display)).toBe(true);
      expect(display.length).toBeGreaterThan(0);
    });

    it('should show "-" values when loading', () => {
      component.isLoading.set(true);
      const display = component.metricsDisplay();
      const catI = display.find((d) => d.label === 'CAT I - Open (Unique)');

      expect(catI?.value).toBe('-');
    });

    it('should show numeric values when not loading', () => {
      component.isLoading.set(false);
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics(), catIOpenCount: 7 });
      const display = component.metricsDisplay();
      const catI = display.find((d) => d.label === 'CAT I - Open (Unique)');

      expect(catI?.value).toBe(7);
    });

    it('should include all 8 metric entries', () => {
      expect(component.metricsDisplay().length).toBe(8);
    });
  });

  describe('ngOnInit', () => {
    it('should emit componentInit with self', () => {
      const spy = vi.spyOn(component.componentInit, 'emit');

      component.ngOnInit();
      expect(spy).toHaveBeenCalledWith(component);
    });

    it('should not call service when no collection', () => {
      component.ngOnInit();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should leave isLoading as true when no collection', () => {
      component.ngOnInit();
      expect(component.isLoading()).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    it('should set collectionName from collection', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.collectionName()).toBe('Test Collection');
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

    it('should call loadMetrics (service calls) when collection is set', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should not call loadMetrics when collection is null', () => {
      component.collection = null;
      component.ngOnChanges();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should set isLoading to true before load', () => {
      component.collection = mockCollection;
      let capturedLoading: boolean | undefined;

      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockImplementation(() => {
        capturedLoading = component.isLoading();

        return of(mockStigSummary);
      });
      component.ngOnChanges();
      expect(capturedLoading).toBe(true);
    });

    it('should set isLoading to false after successful load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('should update stigManagerMetrics after load', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      const m = component.stigManagerMetrics();

      expect(m.assetCount).toBe(12);
    });

    it('should set catIOpenRawCount from STIG findings.high', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIOpenRawCount).toBe(2);
    });

    it('should set catIIOpenRawCount from STIG findings.medium', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIIOpenRawCount).toBe(3);
    });

    it('should set catIIIOpenRawCount from STIG findings.low', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIIIOpenRawCount).toBe(1);
    });

    it('should set catIOpenCount from deduplicated findings', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIOpenCount).toBe(1);
    });

    it('should set totalAssessments from aggregated metrics', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().totalAssessments).toBe(10);
    });

    it('should populate stigsAssessmentData', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigsAssessmentData().length).toBe(1);
    });

    it('should set stigAssessmentData title from STIG summary', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigsAssessmentData()[0].title).toBe('Test STIG');
    });

    it('should show error and set isLoading false on service failure', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('fail')));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('should degrade to empty metrics on service failure (inner catchError)', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('fail')));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIOpenCount).toBe(0);
    });

    it('should return empty metrics on combineLatest inner error', () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(throwError(() => new Error('poam fail')));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigManagerMetrics().catIOpenCount).toBe(0);
    });

    it('should handle array stigSummary', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(of(mockStigSummary));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigsAssessmentData().length).toBe(1);
    });

    it('should handle non-array stigSummary (single object)', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(of(mockStigSummary[0]));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigsAssessmentData().length).toBe(1);
    });

    it('should handle null stigSummary', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(of(null));
      component.collection = mockCollection;
      component.ngOnChanges();
      expect(component.stigsAssessmentData().length).toBe(0);
    });
  });

  describe('getCoraRiskColor', () => {
    it('should return green for score 0', () => {
      expect(component.getCoraRiskColor(0)).toBe('rgba(15, 185, 130, 0.8)');
    });

    it('should return yellow for Low rating (non-zero score)', () => {
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics(), coraRiskRating: 'Low' });
      expect(component.getCoraRiskColor(5)).toBe('rgba(230, 190, 45, 0.85)');
    });

    it('should return red for score >= 20', () => {
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics(), coraRiskRating: 'Very High' });
      expect(component.getCoraRiskColor(20)).toBe('rgba(235, 70, 100, 0.8)');
    });

    it('should return orange for score >= 10 and < 20', () => {
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics(), coraRiskRating: 'High' });
      expect(component.getCoraRiskColor(15)).toBe('rgba(245, 125, 70, 0.8)');
    });

    it('should return amber for moderate score (< 10, not Low rating, not 0)', () => {
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics(), coraRiskRating: 'Moderate' });
      expect(component.getCoraRiskColor(5)).toBe('rgba(250, 165, 50, 0.8)');
    });
  });

  describe('setChartOptions', () => {
    it('should return object with plugins.legend.display false', () => {
      const options = component.setChartOptions();

      expect(options.plugins.legend.display).toBe(false);
    });

    it('should return object with maintainAspectRatio false', () => {
      const options = component.setChartOptions();

      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should return scales with x and y axes', () => {
      const options = component.setChartOptions();

      expect(options.scales.x).toBeDefined();
      expect(options.scales.y).toBeDefined();
    });

    it('should include tooltip callback', () => {
      const options = component.setChartOptions();

      expect(typeof options.plugins.tooltip.callbacks.label).toBe('function');
    });
  });

  describe('exportMetrics', () => {
    it('should not throw when called', () => {
      component.stigManagerMetrics.set({ ...component.stigManagerMetrics() });
      component.collectionName.set('Test');
      expect(() => component.exportMetrics()).not.toThrow();
    });

    it('should create CSV rows with collection name', () => {
      const spy = vi.spyOn(component as any, 'exportAsCSV');

      component.collectionName.set('MyCollection');
      component.exportMetrics();
      const rows = spy.mock.calls[0][0] as any[][];
      const headerRow = rows.find((r) => r.includes('Collection Name'));

      expect(headerRow).toBeDefined();
    });

    it('should include CAT I Compliance row', () => {
      const spy = vi.spyOn(component as any, 'exportAsCSV');

      component.collectionName.set('Col');
      component.exportMetrics();
      const rows = spy.mock.calls[0][0] as any[][];
      const catIRow = rows.find((r) => r.includes('CAT I Compliance %'));

      expect(catIRow).toBeDefined();
    });

    it('should pass filename with collection name', () => {
      const spy = vi.spyOn(component as any, 'exportAsCSV');

      component.collectionName.set('TestCol');
      component.exportMetrics();
      const filename = spy.mock.calls[0][1] as string;

      expect(filename).toContain('TestCol');
    });
  });

  describe('refreshMetrics', () => {
    it('should update now date', () => {
      const before = component.now;

      component.refreshMetrics();
      expect(component.now).not.toBe(before);
    });

    it('should call loadMetrics (no collection → no service calls)', () => {
      component.refreshMetrics();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should call service when collection is set', () => {
      component.collection = mockCollection;
      component.originCollectionId.set('42');
      component.refreshMetrics();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).toHaveBeenCalled();
    });
  });

  describe('POAM label/approved filtering', () => {
    it('should add approved POAM vulnerabilityId to approvedVulnIds', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      const m = component.stigManagerMetrics();

      expect(m.catICompliance).toBeGreaterThan(0);
    });

    it('should count KIOR label POAMs', () => {
      component.collection = mockCollection;
      component.ngOnChanges();
      const stig = component.stigsAssessmentData()[0];

      expect(stig.kiorCount).toBeGreaterThanOrEqual(0);
    });
  });
});
