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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, of, throwError } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { MetricsService } from '../metrics.service';
import { calculateCORAScore } from '../stigman-metrics/stigman-metrics.compute';
import { TenableMetricsDataService } from '../tenable-metrics/tenable-metrics.data.service';
import { GlobalMetricsProgress, GlobalMetricsResult, GlobalMetricsService } from './global-metrics.service';

const mockStigSummary = [
  {
    benchmarkId: 'B1',
    title: 'B1',
    assets: 5,
    metrics: {
      assessments: 10,
      assessed: 10,
      findings: { high: 2, medium: 0, low: 0 },
      assessedBySeverity: { high: 8, medium: 0, low: 0 },
      assessmentsBySeverity: { high: 10, medium: 0, low: 0 },
      statuses: { submitted: 0, accepted: 0, rejected: 0, saved: 0 }
    }
  }
];

const mockFindings = [
  { groupId: 'V-1', severity: 'high', stigs: [{ benchmarkId: 'B1' }] },
  { groupId: 'V-2', severity: 'high', stigs: [{ benchmarkId: 'B1' }] }
];
const mockCollectionMetrics = { assets: 7 };
const mockPoams = [{ vulnerabilityId: 'V-1', status: 'Approved', labels: [], associatedVulnerabilities: [] }];

const tenableComponents = {
  catICount: 10,
  catIICount: 5,
  catIIICount: 3,
  validAssets: 20,
  seolVulnerabilities: 4,
  exploitableFindings: 5,
  pastDueIAVs: 2,
  credentialScan: { credentialed: 80, total: 100 },
  compliance: { catI: { compliant: 2, total: 4 }, catII: { compliant: 1, total: 2 }, catIII: { compliant: 0, total: 1 } }
};

const emptyTenableComponents = {
  catICount: 0,
  catIICount: 0,
  catIIICount: 0,
  validAssets: 0,
  seolVulnerabilities: 0,
  exploitableFindings: 0,
  pastDueIAVs: 0,
  credentialScan: { credentialed: 0, total: 0 },
  compliance: { catI: { compliant: 0, total: 0 }, catII: { compliant: 0, total: 0 }, catIII: { compliant: 0, total: 0 } }
};

const stigCollection = { collectionId: 1, collectionName: 'Stig A', collectionType: 'STIG Manager', originCollectionId: 101 };
const tenableCollection = { collectionId: 2, collectionName: 'Ten B', collectionType: 'Tenable', originCollectionId: 7 };

describe('GlobalMetricsService', () => {
  let service: GlobalMetricsService;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let mockTenableData: any;
  let mockMetricsService: any;

  const run = (collections: any[]) => new Promise<GlobalMetricsResult>((resolve, reject) => service.loadGlobalMetrics(collections).subscribe({ next: resolve, error: reject }));

  beforeEach(() => {
    mockSharedService = {
      getCollectionSTIGSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockStigSummary)),
      getFindingsMetricsFromSTIGMAN: vi.fn().mockReturnValue(of(mockFindings)),
      getCollectionMetricsSummaryFromSTIGMAN: vi.fn().mockReturnValue(of(mockCollectionMetrics))
    };
    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of(mockPoams))
    };
    mockTenableData = {
      getCollectionGlobalComponents: vi.fn().mockReturnValue(of(tenableComponents)),
      calculateVPHScore: vi.fn().mockReturnValue({ score: 2.5, rating: 'Moderate' })
    };
    mockMetricsService = {
      getPoamMTTR: vi.fn().mockReturnValue(of({ summary: [], trend: [] }))
    };

    TestBed.configureTestingModule({
      providers: [
        GlobalMetricsService,
        { provide: SharedService, useValue: mockSharedService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: TenableMetricsDataService, useValue: mockTenableData },
        { provide: MetricsService, useValue: mockMetricsService }
      ]
    });

    service = TestBed.inject(GlobalMetricsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty result with no source breakdowns for an empty selection', async () => {
    const result = await run([]);

    expect(result.stig).toBeNull();
    expect(result.tenable).toBeNull();
    expect(result.hasStig).toBe(false);
    expect(result.hasTenable).toBe(false);
    expect(result.totalCount).toBe(0);
    expect(result.loadedCount).toBe(0);
    expect(result.failedCollections).toEqual([]);
  });

  it('aggregates a single STIG collection and recomputes the combined CORA score', async () => {
    const result = await run([stigCollection]);
    const expectedCora = calculateCORAScore({ high: 10, medium: 0, low: 0 }, { high: 8, medium: 0, low: 0 }, { high: 2, medium: 0, low: 0 });

    expect(result.hasStig).toBe(true);
    expect(result.tenable).toBeNull();
    expect(result.stig!.cora.score).toBeCloseTo(expectedCora.score, 5);
    expect(result.stig!.cora.rating).toBe(expectedCora.rating);
    expect(result.stig!.compliance.catI).toBeCloseTo(50, 5);
    expect(result.stig!.compliance.catII).toBe(100);
    expect(result.stig!.compliance.catIII).toBe(100);
    expect(result.stig!.openFindings.catI).toBe(2);
    expect(result.stig!.assetCount).toBe(7);
    expect(result.stig!.collectionCount).toBe(1);
    expect(result.loadedCount).toBe(1);
  });

  it('aggregates a single Tenable collection and recomputes the combined VPH score from summed components', async () => {
    const result = await run([tenableCollection]);

    expect(result.hasTenable).toBe(true);
    expect(result.stig).toBeNull();
    expect(mockTenableData.calculateVPHScore).toHaveBeenCalledWith(10, 5, 3, 20);
    expect(result.tenable!.vph).toEqual({ score: 2.5, rating: 'Moderate' });
    expect(result.tenable!.compliance.catI).toBeCloseTo(50, 5);
    expect(result.tenable!.openFindings.catI).toBe(10);
    expect(result.tenable!.validAssets).toBe(20);
    expect(result.tenable!.collectionCount).toBe(1);
  });

  it('keeps STIG and Tenable separate instead of blending their denominators', async () => {
    const result = await run([stigCollection, tenableCollection]);

    expect(result.hasStig).toBe(true);
    expect(result.hasTenable).toBe(true);
    expect(result.stig!.compliance.catI).toBeCloseTo(50, 5);
    expect(result.tenable!.compliance.catI).toBeCloseTo(50, 5);
    expect(result.stig!.openFindings.catI).toBe(2);
    expect(result.tenable!.openFindings.catI).toBe(10);
    expect(result.stig!.assetCount).toBe(7);
    expect(result.tenable!.validAssets).toBe(20);
    expect(result.loadedCount).toBe(2);
  });

  it('applies each source’s empty-severity convention (STIG 100% / Tenable 0%)', async () => {
    mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(of([]));
    mockTenableData.getCollectionGlobalComponents.mockReturnValue(of(emptyTenableComponents));

    const result = await run([stigCollection, tenableCollection]);

    expect(result.stig!.compliance.catI).toBe(100);
    expect(result.stig!.compliance.catII).toBe(100);
    expect(result.stig!.compliance.catIII).toBe(100);
    expect(result.tenable!.compliance.catI).toBe(0);
    expect(result.tenable!.compliance.catII).toBe(0);
    expect(result.tenable!.compliance.catIII).toBe(0);
  });

  it('exposes the combined STIG detail metrics (checks, STIGs, assessed %, technologies assessed)', async () => {
    const result = await run([stigCollection]);

    expect(result.stig!.totalChecks).toBe(10);
    expect(result.stig!.totalStigs).toBe(1);
    expect(result.stig!.techAssessed).toEqual({ fully: 1, total: 1 });
    expect(result.stig!.assessedPercentage).toBeCloseTo(100, 5);
  });

  it('exposes the combined Tenable detail metrics and recomputes credential coverage from summed counts', async () => {
    const result = await run([tenableCollection]);

    expect(result.tenable!.exploitableFindings).toBe(5);
    expect(result.tenable!.pastDueIAVs).toBe(2);
    expect(result.tenable!.seolVulnerabilities).toBe(4);
    expect(result.tenable!.credentialScanCoverage).toBeCloseTo(80, 5); // 80 / 100
  });

  it('weights credential coverage by summed counts across multiple Tenable collections (not a simple average)', async () => {
    mockTenableData.getCollectionGlobalComponents.mockReturnValueOnce(of({ ...tenableComponents, credentialScan: { credentialed: 80, total: 100 } })).mockReturnValueOnce(of({ ...tenableComponents, credentialScan: { credentialed: 20, total: 100 } }));

    const result = await run([
      { ...tenableCollection, collectionId: 2, originCollectionId: 7 },
      { ...tenableCollection, collectionId: 3, originCollectionId: 8 }
    ]);

    expect(result.tenable!.credentialScanCoverage).toBeCloseTo(50, 5);
  });

  it('rolls up MTTR weighted by POAM count, tagged by source and normalized severity', async () => {
    mockMetricsService.getPoamMTTR.mockImplementation((id: number) =>
      id === 1
        ? of({ summary: [{ rawSeverity: 'CAT I - High', avgDays: 10, minDays: 0, maxDays: 0, count: 1 }], trend: [{ period: '2026-01', rawSeverity: 'CAT I - High', avgDays: 10, count: 1 }] })
        : of({ summary: [{ rawSeverity: 'CAT II - Medium', avgDays: 20, minDays: 0, maxDays: 0, count: 3 }], trend: [] })
    );

    const result = await run([stigCollection, tenableCollection]);

    expect(result.mttr).not.toBeNull();

    const stigItem = result.mttr!.summary.find((item) => item.source === 'STIG Manager');
    const tenItem = result.mttr!.summary.find((item) => item.source === 'Tenable');

    expect(stigItem).toMatchObject({ severity: 'CAT I - Critical/High', avgDays: 10, count: 1 });
    expect(tenItem).toMatchObject({ severity: 'CAT II - Medium', avgDays: 20, count: 3 });
    expect(result.mttr!.trend).toContainEqual(expect.objectContaining({ source: 'STIG Manager', severity: 'CAT I - Critical/High', period: '2026-01', avgDays: 10 }));
  });

  it('returns a null MTTR when no collection has remediation data', async () => {
    const result = await run([stigCollection, tenableCollection]);

    expect(result.mttr).toBeNull();
  });

  it('sums (not averages) the VPH components across multiple Tenable collections', async () => {
    mockTenableData.getCollectionGlobalComponents
      .mockReturnValueOnce(
        of({
          catICount: 10,
          catIICount: 0,
          catIIICount: 0,
          validAssets: 10,
          seolVulnerabilities: 0,
          exploitableFindings: 0,
          pastDueIAVs: 0,
          credentialScan: { credentialed: 0, total: 0 },
          compliance: { catI: { compliant: 0, total: 0 }, catII: { compliant: 0, total: 0 }, catIII: { compliant: 0, total: 0 } }
        })
      )
      .mockReturnValueOnce(
        of({
          catICount: 0,
          catIICount: 0,
          catIIICount: 0,
          validAssets: 100,
          seolVulnerabilities: 0,
          exploitableFindings: 0,
          pastDueIAVs: 0,
          credentialScan: { credentialed: 0, total: 0 },
          compliance: { catI: { compliant: 0, total: 0 }, catII: { compliant: 0, total: 0 }, catIII: { compliant: 0, total: 0 } }
        })
      );

    await run([
      { ...tenableCollection, collectionId: 2, originCollectionId: 7 },
      { ...tenableCollection, collectionId: 3, originCollectionId: 8 }
    ]);

    expect(mockTenableData.calculateVPHScore).toHaveBeenCalledWith(10, 0, 0, 110);
  });

  it('isolates a failing collection without aborting the whole load', async () => {
    mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('stigman down')));

    const result = await run([stigCollection, tenableCollection]);

    expect(result.failedCollections).toEqual(['Stig A']);
    expect(result.loadedCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.stig).toBeNull();
    expect(result.hasTenable).toBe(true);
    expect(result.tenable!.openFindings.catI).toBe(10);
  });

  it('reports an all-empty result when every collection fails', async () => {
    mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('stigman down')));
    mockTenableData.getCollectionGlobalComponents.mockReturnValue(throwError(() => new Error('tenable down')));

    const result = await run([stigCollection, tenableCollection]);

    expect(result.stig).toBeNull();
    expect(result.tenable).toBeNull();
    expect(result.hasStig).toBe(false);
    expect(result.hasTenable).toBe(false);
    expect(result.loadedCount).toBe(0);
    expect(result.totalCount).toBe(2);
    expect(result.failedCollections).toEqual(['Stig A', 'Ten B']);
  });

  it('produces a stable result even when fetches resolve out of order', async () => {
    mockTenableData.getCollectionGlobalComponents.mockImplementation((repoId: string) => (repoId === '7' ? of(tenableComponents).pipe(delay(30)) : of(tenableComponents)));

    const result = await run([
      { ...tenableCollection, collectionId: 2, originCollectionId: 7 },
      { ...tenableCollection, collectionId: 3, originCollectionId: 8 }
    ]);

    expect(result.loadedCount).toBe(2);
    expect(result.tenable!.openFindings.catI).toBe(20);
    expect(result.tenable!.validAssets).toBe(40);
  });

  it('emits incremental progress that ends at loaded === total', async () => {
    const emissions: GlobalMetricsProgress[] = [];

    service.progress$.subscribe((progress) => emissions.push(progress));

    await run([stigCollection, tenableCollection]);

    expect(emissions[0]).toEqual({ loaded: 0, total: 2 });
    expect(emissions.at(-1)).toEqual({ loaded: 2, total: 2 });
  });
});
