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
import { Observable, combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ComplianceCount } from '../../../common/models/metrics.model';
import { CollectionsService } from '../../admin/collections/collections.service';
import { IntegrationService } from '../../integrations/integration.service';

export interface SeveritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface TenableTimeRangeData {
  severitySummary30Days: SeveritySummary;
  severitySummary: SeveritySummary;
  exploitableFindings: number;
  seolVulnerabilities: number;
  complianceMetrics: { catI: number; catII: number; catIII: number };
}

export type TenableTimeRange = '7' | '30' | '90' | 'all';

export interface TenableExportMetrics {
  complianceCatI: number;
  complianceCatII: number;
  complianceCatIII: number;
  complianceCatI90: number;
  complianceCatII90: number;
  complianceCatIII90: number;
  openFindingsCatI: number;
  openFindingsCatII: number;
  openFindingsCatIII: number;
  seolVulnerabilities: number;
  vphScore: number;
  validOnlineAssets: number;
}

export interface ComplianceCounts {
  catI: ComplianceCount;
  catII: ComplianceCount;
  catIII: ComplianceCount;
}

export interface TenableGlobalComponents {
  catICount: number;
  catIICount: number;
  catIIICount: number;
  validAssets: number;
  seolVulnerabilities: number;
  exploitableFindings: number;
  pastDueIAVs: number;
  credentialScan: { credentialed: number; total: number };
  compliance: ComplianceCounts;
}

const LAST_SEEN_BY_TIME_RANGE: Record<TenableTimeRange, string | null> = {
  all: null,
  '7': '0:7',
  '30': '0:30',
  '90': '0:90'
};

const DAYS_BY_TIME_RANGE: Record<TenableTimeRange, number> = {
  all: 0,
  '7': 7,
  '30': 30,
  '90': 90
};

@Injectable({ providedIn: 'root' })
export class TenableMetricsDataService {
  private readonly integrationService = inject(IntegrationService);
  private readonly collectionsService = inject(CollectionsService);

  loadVulnerabilityDataForTimeRange(repoId: string, collectionId: any, timeRange: TenableTimeRange): Observable<TenableTimeRangeData> {
    const lastSeenValue = LAST_SEEN_BY_TIME_RANGE[timeRange];

    return forkJoin({
      severitySummary30Days: this.getSeveritySummary(repoId, true, lastSeenValue),
      severitySummary: this.getSeveritySummary(repoId, false, lastSeenValue),
      exploitableFindings: this.calculateExploitableFindings(repoId, lastSeenValue),
      seolVulnerabilities: this.calculateSEOLVulnerabilities(repoId, lastSeenValue),
      complianceMetrics: this.calculateComplianceMetrics(repoId, collectionId, lastSeenValue)
    });
  }

  loadAllHosts(repoId: string, propagateErrors = false): Observable<any[]> {
    const hostParams = {
      filters: {
        and: [
          {
            property: 'repositoryHost',
            operator: 'eq',
            value: repoId.toString()
          },
          {
            property: 'assetCriticalityRating',
            operator: 'eq',
            value: 'all'
          },
          {
            property: 'assetExposureScore',
            operator: 'eq',
            value: 'all'
          }
        ]
      }
    };

    const hosts$ = this.integrationService.postTenableHostSearch(hostParams).pipe(map((response: any) => response?.response || []));

    return propagateErrors ? hosts$ : hosts$.pipe(catchError(() => of([])));
  }

  filterHostCount(hosts: any[], timeRange: TenableTimeRange): number {
    if (timeRange === 'all') {
      return hosts.length;
    }

    const now = Date.now() / 1000;
    const daysInSeconds = DAYS_BY_TIME_RANGE[timeRange] * 24 * 60 * 60;
    const cutoffTime = now - daysInSeconds;

    return hosts.filter((host: any) => {
      const lastSeen = Number(host.lastSeen) || 0;

      return lastSeen >= cutoffTime;
    }).length;
  }

  calculateVPHScore(catICount: number, catIICount: number, catIIICount: number, validAssets: number): { score: number; rating: string } {
    if (validAssets === 0) {
      return { score: 0, rating: 'Low' };
    }

    const catIVPH = (catICount / validAssets) * 10;
    const catIIVPH = (catIICount / validAssets) * 4;
    const catIIIVPH = (catIIICount / validAssets) * 1;
    const vphScore = (catIVPH + catIIVPH + catIIIVPH) / (10 + 4 + 1);

    let rating: string;

    if (vphScore < 2.5) {
      rating = 'Low';
    } else if (vphScore < 3.5) {
      rating = 'Moderate';
    } else {
      rating = 'High';
    }

    return { score: vphScore, rating };
  }

  calculatePoamApprovalMetrics(collectionId: any, repoId: string): Observable<number> {
    return combineLatest([this.getTenableVulnerabilities(repoId, []), this.collectionsService.getPoamsByCollection(collectionId)]).pipe(
      map(([vulnData, poams]) => {
        const totalVulnerabilities = Number(vulnData.response?.totalRecords) || 0;

        if (totalVulnerabilities === 0) return 0;

        const uniqueVulnIds = new Set<string>();
        const approvedPoams = poams.filter((p: any) => p.status === 'Approved');

        approvedPoams.forEach((poam: any) => {
          if (poam.vulnerabilityId) {
            uniqueVulnIds.add(poam.vulnerabilityId);
          }

          if (Array.isArray(poam?.associatedVulnerabilities)) {
            poam.associatedVulnerabilities.forEach((id: string) => uniqueVulnIds.add(id));
          }
        });

        return (uniqueVulnIds.size / totalVulnerabilities) * 100;
      }),
      catchError(() => of(0))
    );
  }

  calculateComplianceMetrics(repoId: string, collectionId: any, lastSeenValue: string | null, pluginPublishedValue = '30:all'): Observable<{ catI: number; catII: number; catIII: number }> {
    return this.calculateComplianceCounts(repoId, collectionId, lastSeenValue, pluginPublishedValue).pipe(map((counts) => this.toCompliancePercentages(counts)));
  }

  calculateComplianceCounts(repoId: string, collectionId: any, lastSeenValue: string | null, pluginPublishedValue = '30:all'): Observable<ComplianceCounts> {
    return combineLatest([this.fetchComplianceVulnerabilities(repoId, lastSeenValue, pluginPublishedValue), this.collectionsService.getPoamsByCollection(collectionId)]).pipe(
      map(([vulnSets, poams]) => this.toComplianceCounts(vulnSets, poams)),
      catchError(() => of({ catI: { compliant: 0, total: 0 }, catII: { compliant: 0, total: 0 }, catIII: { compliant: 0, total: 0 } }))
    );
  }

  private buildComplianceFilters(lastSeenValue: string | null, pluginPublishedValue: string, severityValue: string): any[] {
    const filters = [];

    if (lastSeenValue) {
      filters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    filters.push(
      {
        filterName: 'pluginPublished',
        operator: '=',
        value: pluginPublishedValue,
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'severity',
        operator: '=',
        value: severityValue,
        type: 'vuln',
        isPredefined: true
      }
    );

    return filters;
  }

  private fetchComplianceVulnerabilities(repoId: string, lastSeenValue: string | null, pluginPublishedValue: string, propagateErrors = false): Observable<[any, any, any]> {
    return combineLatest([
      this.getTenableVulnerabilities(repoId, this.buildComplianceFilters(lastSeenValue, pluginPublishedValue, '3,4'), propagateErrors),
      this.getTenableVulnerabilities(repoId, this.buildComplianceFilters(lastSeenValue, pluginPublishedValue, '2'), propagateErrors),
      this.getTenableVulnerabilities(repoId, this.buildComplianceFilters(lastSeenValue, pluginPublishedValue, '1'), propagateErrors)
    ]);
  }

  private toComplianceCounts([catIVulns, catIIVulns, catIIIVulns]: [any, any, any], poams: any[]): ComplianceCounts {
    const vulnerabilityStatusMap = new Map<string, string>();

    poams.forEach((poam: any) => {
      if (poam.vulnerabilityId) {
        vulnerabilityStatusMap.set(poam.vulnerabilityId, poam.status);
      }

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        poam.associatedVulnerabilities.forEach((vulnId: string) => {
          vulnerabilityStatusMap.set(vulnId, poam.status);
        });
      }
    });

    const complianceComponents = (vulnData: any): ComplianceCount => {
      const vulnerabilities = vulnData.response?.results || [];
      const total = vulnerabilities.length;
      const compliant = vulnerabilities.filter((vuln: any) => vulnerabilityStatusMap.get(vuln.pluginID) === 'Approved').length;

      return { compliant, total };
    };

    return {
      catI: complianceComponents(catIVulns),
      catII: complianceComponents(catIIVulns),
      catIII: complianceComponents(catIIIVulns)
    };
  }

  private toCompliancePercentages(counts: ComplianceCounts): { catI: number; catII: number; catIII: number } {
    return {
      catI: counts.catI.total === 0 ? 0 : (counts.catI.compliant / counts.catI.total) * 100,
      catII: counts.catII.total === 0 ? 0 : (counts.catII.compliant / counts.catII.total) * 100,
      catIII: counts.catIII.total === 0 ? 0 : (counts.catIII.compliant / counts.catIII.total) * 100
    };
  }

  calculateExploitableFindings(repoId: string, lastSeenValue: string | null): Observable<number> {
    const filters = [
      {
        filterName: 'pluginPublished',
        operator: '=',
        value: '7:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'exploitAvailable',
        operator: '=',
        value: 'true',
        type: 'vuln',
        isPredefined: true
      }
    ];

    if (lastSeenValue) {
      filters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    return this.getTenableVulnerabilities(repoId, filters).pipe(
      map((data) => Number(data.response?.totalRecords) || 0),
      catchError(() => of(0))
    );
  }

  calculatePastDueIAVs(repoId: string): Observable<number> {
    return this.integrationService.getIAVPluginIds().pipe(
      switchMap((pluginIds) => {
        if (!pluginIds) return of(0);

        const filters = [
          {
            filterName: 'pluginID',
            operator: '=',
            value: pluginIds,
            type: 'vuln',
            isPredefined: true
          },
          {
            filterName: 'severity',
            operator: '=',
            value: '1,2,3,4',
            type: 'vuln',
            isPredefined: true
          }
        ];

        return this.getTenableVulnerabilities(repoId, filters).pipe(
          switchMap((vulnData) => {
            const pluginIDList = vulnData.response?.results?.map((v: any) => Number(v.pluginID)) || [];

            if (pluginIDList.length === 0) return of(0);

            return this.integrationService.getIAVInfoForPlugins(pluginIDList).pipe(
              map((iavData) => {
                const today = new Date();

                today.setHours(0, 0, 0, 0);

                return iavData.filter((item: any) => {
                  if (!item.navyComplyDate) return false;

                  if (item.supersededBy !== null && item.supersededBy !== undefined && item.supersededBy !== 'N/A') {
                    return false;
                  }

                  const complyDate = new Date(item.navyComplyDate);

                  return complyDate < today;
                }).length;
              })
            );
          })
        );
      }),
      catchError(() => of(0))
    );
  }

  calculateSEOLVulnerabilities(repoId: string, lastSeenValue: string | null, propagateErrors = false): Observable<number> {
    const filters = [];

    if (lastSeenValue) {
      filters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    filters.push(
      {
        filterName: 'seolDate',
        operator: '=',
        value: '30:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'severity',
        operator: '=',
        value: '1,2,3,4',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'pluginName',
        operator: '=',
        value: 'SEoL',
        type: 'vuln',
        isPredefined: true
      }
    );

    const count$ = this.getTenableVulnerabilities(repoId, filters, propagateErrors).pipe(map((data) => Number(data.response?.totalRecords) || 0));

    return propagateErrors ? count$ : count$.pipe(catchError(() => of(0)));
  }

  calculateCredentialScanPercentage(repoId: string): Observable<number> {
    return this.calculateCredentialScanCounts(repoId).pipe(map(({ credentialed, total }) => (total === 0 ? 0 : (credentialed / total) * 100)));
  }

  calculateCredentialScanCounts(repoId: string): Observable<{ credentialed: number; total: number }> {
    const nonCredentialFilters = [
      {
        filterName: 'pluginID',
        operator: '=',
        value: '117886,10428,21745,24786,26917,102094,104410,110385,110723',
        type: 'vuln',
        isPredefined: true
      }
    ];

    return combineLatest([this.getTenableVulnerabilities(repoId, []), this.getTenableVulnerabilities(repoId, nonCredentialFilters)]).pipe(
      map(([totalVulns, nonCredentialVulns]) => {
        const total = Number(totalVulns.response?.totalRecords) || 0;
        const nonCredentialCount = Number(nonCredentialVulns.response?.totalRecords) || 0;

        return { credentialed: Math.max(total - nonCredentialCount, 0), total };
      }),
      catchError(() => of({ credentialed: 0, total: 0 }))
    );
  }

  getSeveritySummary(repoId: string, apply30DayFilter: boolean, lastSeenValue: string | null, propagateErrors = false): Observable<SeveritySummary> {
    const filters = [
      {
        filterName: 'pluginType',
        operator: '=',
        value: 'active',
        type: 'vuln',
        isPredefined: true
      }
    ];

    if (lastSeenValue) {
      filters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    if (apply30DayFilter) {
      filters.push({
        filterName: 'pluginPublished',
        operator: '=',
        value: '30:all',
        type: 'vuln',
        isPredefined: true
      });
    }

    const analysisParams = {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'sumseverity',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 50000,
        filters: [this.createRepositoryFilter(repoId), ...filters],
        sortColumn: 'severity',
        sortDirection: 'desc',
        vulnTool: 'sumseverity'
      },
      sourceType: 'cumulative',
      sortField: 'severity',
      sortDir: 'desc',
      columns: [],
      type: 'vuln'
    };

    const summary$ = this.integrationService.postTenableAnalysis(analysisParams).pipe(
      map((response: any) => {
        const results = response?.response?.results || [];
        const summary: SeveritySummary = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        };

        results.forEach((item: any) => {
          const severityId = item.severity?.id;
          const count = Number.parseInt(item.count) || 0;

          switch (severityId) {
            case '4':
              summary.critical = count;
              break;
            case '3':
              summary.high = count;
              break;
            case '2':
              summary.medium = count;
              break;
            case '1':
              summary.low = count;
              break;
            case '0':
              summary.info = count;
              break;
          }
        });

        return summary;
      })
    );

    return propagateErrors ? summary$ : summary$.pipe(catchError(() => of({ critical: 0, high: 0, medium: 0, low: 0, info: 0 })));
  }

  getTenableVulnerabilities(repoId: string, additionalFilters: any[] = [], propagateErrors = false): Observable<any> {
    const baseFilter = this.createRepositoryFilter(repoId);
    const filters = [baseFilter, ...additionalFilters];

    const analysisParams = {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'sumid',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 50000,
        filters: filters,
        vulnTool: 'sumid'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    const analysis$ = this.integrationService.postTenableAnalysis(analysisParams);

    return propagateErrors
      ? analysis$
      : analysis$.pipe(
          catchError((error) => {
            console.error('Error fetching Tenable data:', error);

            return of({ response: { totalRecords: 0, results: [] } });
          })
        );
  }

  createRepositoryFilter(repoId: string): any {
    return {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: repoId }]
    };
  }

  getCollectionExportMetrics(repoId: string, collectionId: any): Observable<TenableExportMetrics> {
    const lastSeenValue = LAST_SEEN_BY_TIME_RANGE['30'];

    return forkJoin({
      severitySummary: this.getSeveritySummary(repoId, false, lastSeenValue, true),
      seolVulnerabilities: this.calculateSEOLVulnerabilities(repoId, lastSeenValue, true),
      vulns30: this.fetchComplianceVulnerabilities(repoId, lastSeenValue, '30:all', true),
      vulns90: this.fetchComplianceVulnerabilities(repoId, lastSeenValue, '90:all', true),
      poams: this.collectionsService.getPoamsByCollection(collectionId),
      hosts: this.loadAllHosts(repoId, true)
    }).pipe(
      map(({ severitySummary, seolVulnerabilities, vulns30, vulns90, poams, hosts }) => {
        const compliance30 = this.toCompliancePercentages(this.toComplianceCounts(vulns30, poams));
        const compliance90 = this.toCompliancePercentages(this.toComplianceCounts(vulns90, poams));
        const validAssets = this.filterHostCount(hosts, '30');
        const catICount = severitySummary.critical + severitySummary.high;
        const catIICount = severitySummary.medium;
        const catIIICount = severitySummary.low;
        const vph = this.calculateVPHScore(catICount, catIICount, catIIICount, validAssets);

        return {
          complianceCatI: compliance30.catI,
          complianceCatII: compliance30.catII,
          complianceCatIII: compliance30.catIII,
          complianceCatI90: compliance90.catI,
          complianceCatII90: compliance90.catII,
          complianceCatIII90: compliance90.catIII,
          openFindingsCatI: catICount,
          openFindingsCatII: catIICount,
          openFindingsCatIII: catIIICount,
          seolVulnerabilities,
          vphScore: vph.score,
          validOnlineAssets: validAssets
        };
      })
    );
  }

  getCollectionGlobalComponents(repoId: string, collectionId: any): Observable<TenableGlobalComponents> {
    const lastSeenValue = '0:30';

    return forkJoin({
      severitySummary: this.getSeveritySummary(repoId, false, lastSeenValue),
      seolVulnerabilities: this.calculateSEOLVulnerabilities(repoId, lastSeenValue),
      exploitableFindings: this.calculateExploitableFindings(repoId, lastSeenValue),
      pastDueIAVs: this.calculatePastDueIAVs(repoId),
      credentialScan: this.calculateCredentialScanCounts(repoId),
      compliance: this.calculateComplianceCounts(repoId, collectionId, lastSeenValue),
      hosts: this.loadAllHosts(repoId)
    }).pipe(
      map(({ severitySummary, seolVulnerabilities, exploitableFindings, pastDueIAVs, credentialScan, compliance, hosts }) => ({
        catICount: severitySummary.critical + severitySummary.high,
        catIICount: severitySummary.medium,
        catIIICount: severitySummary.low,
        validAssets: this.filterHostCount(hosts, '30'),
        seolVulnerabilities,
        exploitableFindings,
        pastDueIAVs,
        credentialScan,
        compliance
      }))
    );
  }
}
