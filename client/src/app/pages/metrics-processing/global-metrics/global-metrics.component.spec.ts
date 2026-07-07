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
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SharedService } from '../../../common/services/shared.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { GlobalMetricsResult, GlobalMetricsService, StigBreakdown, TenableBreakdown } from './global-metrics.service';
import { GlobalMetricsComponent } from './global-metrics.component';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const stigCollection = { collectionId: 1, collectionName: 'Stig A', collectionType: 'STIG Manager', originCollectionId: 101 };
const tenableCollection = { collectionId: 2, collectionName: 'Ten B', collectionType: 'Tenable', originCollectionId: 7 };
const cpatCollection = { collectionId: 3, collectionName: 'CPAT C', collectionType: 'C-PAT' };
const noOriginCollection = { collectionId: 4, collectionName: 'No Origin', collectionType: 'STIG Manager' };

const stigBreakdown: StigBreakdown = {
  cora: { score: 12.3, rating: 'High' },
  compliance: { catI: 50, catII: 60, catIII: 70 },
  openFindings: { catI: 12, catII: 5, catIII: 3 },
  assetCount: 7,
  collectionCount: 1,
  techAssessed: { fully: 3, total: 4 },
  assessedPercentage: 82.5,
  totalChecks: 1200,
  totalStigs: 4
};

const tenableBreakdown: TenableBreakdown = {
  vph: { score: 2.74, rating: 'Moderate' },
  compliance: { catI: 50, catII: 60, catIII: 70 },
  openFindings: { catI: 10, catII: 4, catIII: 2 },
  validAssets: 20,
  collectionCount: 1,
  exploitableFindings: 9,
  pastDueIAVs: 3,
  seolVulnerabilities: 4,
  credentialScanCoverage: 76
};

const mttrResult = {
  summary: [
    { source: 'STIG Manager', severity: 'CAT I - Critical/High', avgDays: 30, count: 4 },
    { source: 'Tenable', severity: 'CAT II - Medium', avgDays: 48, count: 6 }
  ],
  trend: [
    { source: 'STIG Manager', severity: 'CAT I - Critical/High', period: '2026-01', avgDays: 30, count: 4 },
    { source: 'Tenable', severity: 'CAT II - Medium', period: '2026-01', avgDays: 48, count: 6 }
  ]
};

const fullResult: GlobalMetricsResult = {
  stig: stigBreakdown,
  tenable: tenableBreakdown,
  mttr: mttrResult,
  hasStig: true,
  hasTenable: true,
  failedCollections: [],
  loadedCount: 2,
  totalCount: 2
};

describe('GlobalMetricsComponent', () => {
  let component: GlobalMetricsComponent;
  let fixture: ComponentFixture<GlobalMetricsComponent>;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockGlobalMetricsService: any;
  let mockMessageService: any;
  let progress$: Subject<{ loaded: number; total: number }>;

  const configure = (selectedCollectionId: number) => {
    mockSharedService = { selectedCollection: new BehaviorSubject<number>(selectedCollectionId) };

    TestBed.configureTestingModule({
      imports: [GlobalMetricsComponent],
      providers: [
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: GlobalMetricsService, useValue: mockGlobalMetricsService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(GlobalMetricsComponent, { remove: { providers: [MessageService] } });

    fixture = TestBed.createComponent(GlobalMetricsComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    progress$ = new Subject();
    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([stigCollection, tenableCollection, cpatCollection, noOriginCollection]))
    };
    mockGlobalMetricsService = {
      loadGlobalMetrics: vi.fn().mockReturnValue(of(fullResult)),
      progress$
    };
    mockMessageService = createMockMessageService();
  });

  it('should create', () => {
    configure(999);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('filters the collection options to STIG Manager / Tenable collections with an origin', () => {
    configure(999);
    fixture.detectChanges();

    expect(component.collections()).toEqual([stigCollection, tenableCollection]);
  });

  it('defaults the selection to the current collection and loads its metrics', () => {
    configure(1);
    fixture.detectChanges();

    expect(component.selectedCollections()).toEqual([stigCollection]);
    expect(mockGlobalMetricsService.loadGlobalMetrics).toHaveBeenCalledWith([stigCollection]);
    expect(component.result()).toEqual(fullResult);
  });

  it('does not auto-load when the current collection is not a metrics collection', () => {
    configure(3);
    fixture.detectChanges();

    expect(component.selectedCollections()).toEqual([]);
    expect(mockGlobalMetricsService.loadGlobalMetrics).not.toHaveBeenCalled();
    expect(component.result()).toBeNull();
  });

  it('loads metrics when the selection changes', () => {
    configure(999);
    fixture.detectChanges();

    component.onSelectionChange([stigCollection, tenableCollection]);

    expect(mockGlobalMetricsService.loadGlobalMetrics).toHaveBeenCalledWith([stigCollection, tenableCollection]);
    expect(component.result()).toEqual(fullResult);
    expect(component.isLoading()).toBe(false);
  });

  it('clears the result when the selection becomes empty', () => {
    configure(1);
    fixture.detectChanges();

    component.onSelectionChange([]);

    expect(component.result()).toBeNull();
  });

  it('keeps isLoading true until the load completes', () => {
    const pending = new Subject<GlobalMetricsResult>();

    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(pending);
    configure(999);
    fixture.detectChanges();

    component.onSelectionChange([stigCollection]);
    expect(component.isLoading()).toBe(true);

    pending.next(fullResult);
    pending.complete();
    expect(component.isLoading()).toBe(false);
  });

  it('ignores a stale load when the selection changes again before it resolves', () => {
    const first = new Subject<GlobalMetricsResult>();
    const second = new Subject<GlobalMetricsResult>();

    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValueOnce(first).mockReturnValueOnce(second);
    configure(999);
    fixture.detectChanges();

    component.onSelectionChange([stigCollection]);
    component.onSelectionChange([stigCollection, tenableCollection]);

    const staleResult = { ...fullResult, loadedCount: 1 };
    const freshResult = { ...fullResult, loadedCount: 2 };

    first.next(staleResult);
    first.complete();
    expect(component.result()).toBeNull();

    second.next(freshResult);
    second.complete();
    expect(component.result()).toEqual(freshResult);
  });

  it('hides the VPH gauge and shows CORA when only STIG collections are selected', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, tenable: null, hasTenable: false }));
    configure(1);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Combined CORA Risk Score');
    expect(text).not.toContain('Combined Vulnerability Per Host');
  });

  it('hides the CORA gauge and shows VPH when only Tenable collections are selected', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, stig: null, hasStig: false }));
    configure(2);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Combined Vulnerability Per Host');
    expect(text).not.toContain('Combined CORA Risk Score');
  });

  it('renders an error state when every selected collection fails', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ stig: null, tenable: null, mttr: null, hasStig: false, hasTenable: false, failedCollections: ['Stig A', 'Ten B'], loadedCount: 0, totalCount: 2 }));
    configure(1);
    fixture.detectChanges();

    expect(component.allCollectionsFailed()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Could not load metrics for any');
  });

  it('warns when some collections fail to load', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, failedCollections: ['Stig A'] }));
    configure(1);
    fixture.detectChanges();

    expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: expect.stringContaining('Stig A') }));
  });

  it('refreshes the timestamp when metrics load', () => {
    configure(999);
    fixture.detectChanges();

    const stale = new Date(2000, 0, 1);

    component.now = stale;
    component.onSelectionChange([stigCollection]);

    expect(component.now.getTime()).toBeGreaterThan(stale.getTime());
  });

  it('builds a compliance ring per CAT with both source percentages and a tooltip naming both', () => {
    configure(1);
    fixture.detectChanges();

    const rings = component.complianceRings();

    expect(rings.map((r) => r.numeral)).toEqual(['I', 'II', 'III']);
    expect(rings[0].stig).toBe(50);
    expect(rings[0].tenable).toBe(50);
    expect(rings[0].tooltip).toContain('STIG Manager 50%');
    expect(rings[0].tooltip).toContain('Tenable 50%');
  });

  it('leaves the absent source null in the compliance rings when only one source loaded', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, tenable: null, hasTenable: false }));
    configure(1);
    fixture.detectChanges();

    const ring = component.complianceRings()[0];

    expect(ring.stig).toBe(50);
    expect(ring.tenable).toBeNull();
    expect(ring.tooltip).toContain('STIG Manager 50%');
    expect(ring.tooltip).not.toContain('Tenable');
  });

  it('maps a compliance percentage to a stroke-dashoffset for the SVG arc', () => {
    configure(1);
    fixture.detectChanges();

    expect(component.arcOffset(0, component.outerCircumference)).toBeCloseTo(component.outerCircumference, 5);
    expect(component.arcOffset(100, component.outerCircumference)).toBe(0);
    expect(component.arcOffset(50, component.outerCircumference)).toBeCloseTo(component.outerCircumference / 2, 5);
  });

  it('combines STIG + Tenable open findings into one total per CAT with segment widths summing to 100', () => {
    configure(1);
    fixture.detectChanges();

    const cards = component.findingCards();

    expect(cards.map((c) => c.label)).toEqual(['Open CAT I', 'Open CAT II', 'Open CAT III']);
    expect(cards[0].total).toBe(22);
    expect(cards[0].stig).toBe(12);
    expect(cards[0].tenable).toBe(10);
    expect(cards[0].stigPct + cards[0].tenablePct).toBeCloseTo(100, 5);
  });

  it('zeroes the finding segment widths when a CAT has no findings from either source', () => {
    const emptyFindings = { catI: 0, catII: 0, catIII: 0 };

    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, stig: { ...stigBreakdown, openFindings: emptyFindings }, tenable: { ...tenableBreakdown, openFindings: emptyFindings } }));
    configure(1);
    fixture.detectChanges();

    const card = component.findingCards()[0];

    expect(card.total).toBe(0);
    expect(card.stigPct).toBe(0);
    expect(card.tenablePct).toBe(0);
  });

  it('builds the STIG detail row (5 cards) with renamed and derived values', () => {
    configure(1);
    fixture.detectChanges();

    const cards = component.stigDetailCards();

    expect(cards.map((c) => c.label)).toEqual(['100% STIG Technologies Assessed', 'Assessed %', 'Total Checks', 'Total STIGs', 'STIG Manager Total Assets']);
    expect(cards[0].value).toBe('75.0% (3)');
    expect(cards[2].value).toBe(1200);
    expect(cards[3].value).toBe(4);
    expect(cards[4].value).toBe(7);
  });

  it('builds the Tenable detail row (5 cards) including the recomputed credential coverage', () => {
    configure(1);
    fixture.detectChanges();

    const cards = component.tenableDetailCards();

    expect(cards.map((c) => c.label)).toEqual(['Exploitable Findings (7+ Days)', 'Past Due IAVs', 'Security End of Life Vulnerabilities', 'Credential Scan Coverage', 'Tenable Valid Assets (30-day)']);
    expect(cards[0].value).toBe(9);
    expect(cards[1].value).toBe(3);
    expect(cards[2].value).toBe(4);
    expect(cards[3].value).toBe('76.0%');
    expect(cards[4].value).toBe(20);
  });

  it('hides a source detail row when that source is absent', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, tenable: null, hasTenable: false }));
    configure(1);
    fixture.detectChanges();

    expect(component.tenableDetailCards()).toEqual([]);
    expect(component.stigDetailCards().length).toBe(5);
  });

  it('builds severity-colored MTTR summary bars, one per source × severity', () => {
    configure(1);
    fixture.detectChanges();

    const chart = component.mttrSummaryChartData();

    expect(chart.labels).toEqual(['STIG Manager · CAT I - Critical/High', 'Tenable · CAT II - Medium']);
    expect(chart.datasets.length).toBe(1);
    expect(chart.datasets[0].data).toEqual([30, 48]);
    expect(chart.datasets[0].backgroundColor).toEqual(['rgba(235, 70, 100, 0.85)', 'rgba(250, 165, 50, 0.8)']);
  });

  it('builds source-split MTTR trend lines mapped onto the 12-month axis', () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mttr = {
      summary: [],
      trend: [
        { source: 'STIG Manager', severity: 'CAT I - Critical/High', period, avgDays: 30, count: 4 },
        { source: 'Tenable', severity: 'CAT II - Medium', period, avgDays: 48, count: 6 }
      ]
    };

    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, mttr }));
    configure(1);
    fixture.detectChanges();

    const trend = component.mttrTrendChartData();

    expect(trend.labels).toHaveLength(12);
    expect(trend.datasets.map((d: any) => d.label)).toEqual(['STIG Manager · CAT I - Critical/High', 'Tenable · CAT II - Medium']);
    expect(trend.datasets[0].borderColor).toBe('rgba(235, 70, 100, 0.85)');
    expect(trend.datasets[1].borderColor).toBe('rgba(250, 165, 50, 0.8)');
    expect(trend.datasets[1].borderDash.length).toBeGreaterThan(0);
    expect(trend.datasets[0].data[11]).toBe(30);
    expect(trend.datasets[1].data[11]).toBe(48);
  });

  it('returns null MTTR chart data when there is no remediation result', () => {
    mockGlobalMetricsService.loadGlobalMetrics.mockReturnValue(of({ ...fullResult, mttr: null }));
    configure(1);
    fixture.detectChanges();

    expect(component.mttrSummaryChartData()).toBeNull();
    expect(component.mttrTrendChartData()).toBeNull();
  });

  it('tracks load progress from the service progress stream', () => {
    configure(999);
    fixture.detectChanges();

    progress$.next({ loaded: 1, total: 2 });
    expect(component.progress()).toEqual({ loaded: 1, total: 2 });
    expect(component.progressPercent()).toBe(50);
  });
});
