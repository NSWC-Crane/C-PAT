/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { Observable, Subject, combineLatest, from, of } from 'rxjs';
import { catchError, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { ComplianceCount } from '../../../common/models/metrics.model';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { MTTRData, MetricsService, normalizeMttrSeverity } from '../metrics.service';
import { STIGManagerAggregatable, calculateCORAScore, computeStigManagerMetrics, getEmptySTIGManagerAggregatable } from '../stigman-metrics/stigman-metrics.compute';
import { TenableGlobalComponents, TenableMetricsDataService } from '../tenable-metrics/tenable-metrics.data.service';

const FETCH_CONCURRENCY = 3;

export interface GlobalMetricsProgress {
  loaded: number;
  total: number;
}

export interface SourceCompliance {
  catI: number;
  catII: number;
  catIII: number;
}

export interface SeverityCounts {
  catI: number;
  catII: number;
  catIII: number;
}

export interface StigBreakdown {
  cora: { score: number; rating: string };
  compliance: SourceCompliance;
  openFindings: SeverityCounts;
  assetCount: number;
  collectionCount: number;
  techAssessed: { fully: number; total: number };
  assessedPercentage: number;
  totalChecks: number;
  totalStigs: number;
}

export interface TenableBreakdown {
  vph: { score: number; rating: string };
  compliance: SourceCompliance;
  openFindings: SeverityCounts;
  validAssets: number;
  collectionCount: number;
  exploitableFindings: number;
  pastDueIAVs: number;
  seolVulnerabilities: number;
  credentialScanCoverage: number;
}

export interface CombinedMttrItem {
  source: string;
  severity: string;
  avgDays: number;
  count: number;
}

export interface CombinedMttrTrendItem extends CombinedMttrItem {
  period: string;
}

export interface CombinedMttr {
  summary: CombinedMttrItem[];
  trend: CombinedMttrTrendItem[];
}

export interface GlobalMetricsResult {
  stig: StigBreakdown | null;
  tenable: TenableBreakdown | null;
  mttr: CombinedMttr | null;
  hasStig: boolean;
  hasTenable: boolean;
  failedCollections: string[];
  loadedCount: number;
  totalCount: number;
}

interface CollectionContribution {
  collectionName: string;
  type: 'STIG Manager' | 'Tenable' | 'none';
  failed: boolean;
  stig?: STIGManagerAggregatable;
  tenable?: TenableGlobalComponents;
  mttr?: { source: string; data: MTTRData };
}

interface TenableCountAccumulator {
  catICount: number;
  catIICount: number;
  catIIICount: number;
  validAssets: number;
  seolVulnerabilities: number;
  exploitableFindings: number;
  pastDueIAVs: number;
  credentialed: number;
  credentialTotal: number;
}

interface ComplianceAccumulator {
  catI: ComplianceCount;
  catII: ComplianceCount;
  catIII: ComplianceCount;
}

@Injectable({ providedIn: 'root' })
export class GlobalMetricsService {
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly tenableData = inject(TenableMetricsDataService);
  private readonly metricsService = inject(MetricsService);

  readonly progress$ = new Subject<GlobalMetricsProgress>();

  loadGlobalMetrics(collections: CollectionsBasicList[]): Observable<GlobalMetricsResult> {
    const total = collections.length;
    let loaded = 0;

    this.progress$.next({ loaded, total });

    if (total === 0) {
      return of(this.aggregate([]));
    }

    return from(collections).pipe(
      mergeMap(
        (collection) =>
          this.buildContribution(collection).pipe(
            tap(() => {
              loaded += 1;
              this.progress$.next({ loaded, total });
            })
          ),
        FETCH_CONCURRENCY
      ),
      toArray(),
      map((contributions) => this.aggregate(contributions))
    );
  }

  private buildContribution(collection: CollectionsBasicList): Observable<CollectionContribution> {
    const collectionName = collection.collectionName || '';

    if (!collection.originCollectionId) {
      return of({ collectionName, type: 'none', failed: false });
    }

    if (collection.collectionType === 'STIG Manager') {
      return this.buildStigContribution(collection, collectionName);
    }

    if (collection.collectionType === 'Tenable') {
      return this.buildTenableContribution(collection, collectionName);
    }

    return of({ collectionName, type: 'none', failed: false });
  }

  private buildStigContribution(collection: CollectionsBasicList, collectionName: string): Observable<CollectionContribution> {
    const originCollectionId = Number(collection.originCollectionId);

    return combineLatest([
      this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(originCollectionId),
      this.sharedService.getFindingsMetricsFromSTIGMAN(originCollectionId),
      this.sharedService.getCollectionMetricsSummaryFromSTIGMAN(originCollectionId),
      this.collectionsService.getPoamsByCollection(collection.collectionId),
      this.loadMttr(collection.collectionId)
    ]).pipe(
      map(([stigSummary, findings, collectionMetrics, poams, mttr]: [any, any[], any, any[], MTTRData]) => {
        const { aggregatable } = computeStigManagerMetrics(stigSummary, findings, collectionMetrics, poams);

        return { collectionName, type: 'STIG Manager', failed: false, stig: aggregatable, mttr: { source: 'STIG Manager', data: mttr } } as CollectionContribution;
      }),
      catchError(() => of({ collectionName, type: 'STIG Manager', failed: true } as CollectionContribution))
    );
  }

  private buildTenableContribution(collection: CollectionsBasicList, collectionName: string): Observable<CollectionContribution> {
    const repoId = String(collection.originCollectionId);

    return combineLatest([this.tenableData.getCollectionGlobalComponents(repoId, collection.collectionId), this.loadMttr(collection.collectionId)]).pipe(
      map(([tenable, mttr]) => ({ collectionName, type: 'Tenable', failed: false, tenable, mttr: { source: 'Tenable', data: mttr } }) as CollectionContribution),
      catchError(() => of({ collectionName, type: 'Tenable', failed: true } as CollectionContribution))
    );
  }

  private loadMttr(collectionId: any): Observable<MTTRData> {
    return this.metricsService.getPoamMTTR(Number(collectionId), 12).pipe(catchError(() => of({ summary: [], trend: [] } as MTTRData)));
  }

  private aggregate(contributions: CollectionContribution[]): GlobalMetricsResult {
    const stigAcc = getEmptySTIGManagerAggregatable();
    const tenableCounts: TenableCountAccumulator = { catICount: 0, catIICount: 0, catIIICount: 0, validAssets: 0, seolVulnerabilities: 0, exploitableFindings: 0, pastDueIAVs: 0, credentialed: 0, credentialTotal: 0 };
    const tenableCompliance: ComplianceAccumulator = {
      catI: { compliant: 0, total: 0 },
      catII: { compliant: 0, total: 0 },
      catIII: { compliant: 0, total: 0 }
    };

    let stigCount = 0;
    let tenableCount = 0;
    const failedCollections: string[] = [];

    for (const contribution of contributions) {
      if (contribution.failed) {
        failedCollections.push(contribution.collectionName);
        continue;
      }

      if (contribution.stig) {
        stigCount += 1;
        this.addStig(stigAcc, contribution.stig);
      }

      if (contribution.tenable) {
        tenableCount += 1;
        this.addTenable(tenableCounts, tenableCompliance, contribution.tenable);
      }
    }

    const stig: StigBreakdown | null =
      stigCount === 0
        ? null
        : {
            cora: calculateCORAScore(stigAcc.assessmentsBySeverity, stigAcc.assessedBySeverity, stigAcc.rawFindings),
            compliance: {
              catI: stigPercentage(stigAcc.compliance.catI),
              catII: stigPercentage(stigAcc.compliance.catII),
              catIII: stigPercentage(stigAcc.compliance.catIII)
            },
            openFindings: { catI: stigAcc.openCounts.catI, catII: stigAcc.openCounts.catII, catIII: stigAcc.openCounts.catIII },
            assetCount: stigAcc.assetCount,
            collectionCount: stigCount,
            techAssessed: { fully: stigAcc.fullyAssessedStigs, total: stigAcc.totalStigs },
            assessedPercentage: stigAcc.totalChecks === 0 ? 0 : (stigAcc.assessedCount / stigAcc.totalChecks) * 100,
            totalChecks: stigAcc.totalChecks,
            totalStigs: stigAcc.totalStigs
          };

    const tenable: TenableBreakdown | null =
      tenableCount === 0
        ? null
        : {
            vph: this.tenableData.calculateVPHScore(tenableCounts.catICount, tenableCounts.catIICount, tenableCounts.catIIICount, tenableCounts.validAssets),
            compliance: {
              catI: tenablePercentage(tenableCompliance.catI),
              catII: tenablePercentage(tenableCompliance.catII),
              catIII: tenablePercentage(tenableCompliance.catIII)
            },
            openFindings: { catI: tenableCounts.catICount, catII: tenableCounts.catIICount, catIII: tenableCounts.catIIICount },
            validAssets: tenableCounts.validAssets,
            collectionCount: tenableCount,
            exploitableFindings: tenableCounts.exploitableFindings,
            pastDueIAVs: tenableCounts.pastDueIAVs,
            seolVulnerabilities: tenableCounts.seolVulnerabilities,
            credentialScanCoverage: tenableCounts.credentialTotal === 0 ? 0 : (tenableCounts.credentialed / tenableCounts.credentialTotal) * 100
          };

    return {
      stig,
      tenable,
      mttr: this.aggregateMttr(contributions),
      hasStig: stig !== null,
      hasTenable: tenable !== null,
      failedCollections,
      loadedCount: contributions.filter((c) => !c.failed).length,
      totalCount: contributions.length
    };
  }

  private aggregateMttr(contributions: CollectionContribution[]): CombinedMttr | null {
    const summaryMap = new Map<string, { source: string; severity: string; weightedDays: number; count: number }>();
    const trendMap = new Map<string, { source: string; severity: string; period: string; weightedDays: number; count: number }>();

    for (const contribution of contributions) {
      if (!contribution.mttr) continue;

      const { source, data } = contribution.mttr;

      data.summary.forEach((item) => {
        const severity = normalizeMttrSeverity(item.rawSeverity);
        const key = `${source}::${severity}`;
        const entry = summaryMap.get(key) ?? { source, severity, weightedDays: 0, count: 0 };

        entry.weightedDays += item.avgDays * item.count;
        entry.count += item.count;
        summaryMap.set(key, entry);
      });

      data.trend.forEach((item) => {
        const severity = normalizeMttrSeverity(item.rawSeverity);
        const key = `${source}::${severity}::${item.period}`;
        const entry = trendMap.get(key) ?? { source, severity, period: item.period, weightedDays: 0, count: 0 };

        entry.weightedDays += item.avgDays * item.count;
        entry.count += item.count;
        trendMap.set(key, entry);
      });
    }

    if (summaryMap.size === 0 && trendMap.size === 0) return null;

    const summary: CombinedMttrItem[] = [...summaryMap.values()].map((e) => ({ source: e.source, severity: e.severity, avgDays: e.count ? Math.round(e.weightedDays / e.count) : 0, count: e.count }));
    const trend: CombinedMttrTrendItem[] = [...trendMap.values()].map((e) => ({ source: e.source, severity: e.severity, period: e.period, avgDays: e.count ? Math.round(e.weightedDays / e.count) : 0, count: e.count }));

    return { summary, trend };
  }

  private addStig(acc: STIGManagerAggregatable, stig: STIGManagerAggregatable): void {
    (['high', 'medium', 'low'] as const).forEach((sev) => {
      acc.assessmentsBySeverity[sev] += stig.assessmentsBySeverity[sev];
      acc.assessedBySeverity[sev] += stig.assessedBySeverity[sev];
      acc.rawFindings[sev] += stig.rawFindings[sev];
    });

    acc.openCounts.catI += stig.openCounts.catI;
    acc.openCounts.catII += stig.openCounts.catII;
    acc.openCounts.catIII += stig.openCounts.catIII;
    acc.assetCount += stig.assetCount;
    acc.totalChecks += stig.totalChecks;
    acc.assessedCount += stig.assessedCount;
    acc.fullyAssessedStigs += stig.fullyAssessedStigs;
    acc.totalStigs += stig.totalStigs;

    addCompliance(acc.compliance.catI, stig.compliance.catI);
    addCompliance(acc.compliance.catII, stig.compliance.catII);
    addCompliance(acc.compliance.catIII, stig.compliance.catIII);
  }

  private addTenable(counts: TenableCountAccumulator, compliance: ComplianceAccumulator, tenable: TenableGlobalComponents): void {
    counts.catICount += tenable.catICount;
    counts.catIICount += tenable.catIICount;
    counts.catIIICount += tenable.catIIICount;
    counts.validAssets += tenable.validAssets;
    counts.seolVulnerabilities += tenable.seolVulnerabilities;
    counts.exploitableFindings += tenable.exploitableFindings;
    counts.pastDueIAVs += tenable.pastDueIAVs;
    counts.credentialed += tenable.credentialScan.credentialed;
    counts.credentialTotal += tenable.credentialScan.total;

    addCompliance(compliance.catI, tenable.compliance.catI);
    addCompliance(compliance.catII, tenable.compliance.catII);
    addCompliance(compliance.catIII, tenable.compliance.catIII);
  }
}

function addCompliance(acc: ComplianceCount, part: ComplianceCount): void {
  acc.compliant += part.compliant;
  acc.total += part.total;
}

function stigPercentage(component: ComplianceCount): number {
  return component.total === 0 ? 100 : (component.compliant / component.total) * 100;
}

function tenablePercentage(component: ComplianceCount): number {
  return component.total === 0 ? 0 : (component.compliant / component.total) * 100;
}
