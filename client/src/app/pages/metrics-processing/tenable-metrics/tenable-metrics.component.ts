/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, signal, inject, OnChanges } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { EMPTY, Observable, catchError, combineLatest, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';

interface SeveritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface MetricData {
  label: string;
  tooltip?: string;
  origin?: string;
  value: number | string;
  category?: string;
  severity?: string;
  isPercentage?: boolean;
  isLoading?: boolean;
}

interface VulnerabilityMetrics {
  totalPoamCompliance: number;
  poamApprovalPercentage: number;
  catICompliance: number;
  catIICompliance: number;
  catIIICompliance: number;
  catIOpenCount30Days: number;
  catIIOpenCount30Days: number;
  catIIIOpenCount30Days: number;
  catIOpenCount: number;
  catIIOpenCount: number;
  catIIIOpenCount: number;
  exploitableFindingsCount: number;
  pastDueIAVCount: number;
  seolVulnerabilitiesCount: number;
  credentialScanPercentage: number;
  vphScore: number;
  vphRating: string;
  validOnlineAssets: number;
}

interface CachedVulnerabilityData {
  '7': {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
    totalCompliance: number;
  } | null;
  '30': {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
    totalCompliance: number;
  } | null;
  all: {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
    totalCompliance: number;
  } | null;
}

@Component({
  selector: 'cpat-tenable-metrics',
  templateUrl: './tenable-metrics.component.html',
  styleUrls: ['./tenable-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, ButtonGroupModule, CardModule, ProgressSpinnerModule, TooltipModule, ChartModule, DividerModule]
})
export class TenableMetricsComponent implements OnInit, OnChanges {
  private readonly importService = inject(ImportService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);

  @Input() collection: any;
  @Output() componentInit = new EventEmitter<TenableMetricsComponent>();

  isLoading = signal<boolean>(true);
  collectionName = signal<string>('');
  originCollectionId = signal<string>('');
  findingsChartData = signal<any>(null);
  allFindingsChartData = signal<any>(null);
  findingsChartOptions = signal<any>(null);
  lastObservedTimeRange = signal<'7' | '30' | 'all'>('30');
  loadedRanges = signal<Set<'7' | '30' | 'all'>>(new Set());
  hostTimeRange = signal<'7' | '30' | 'all'>('30');
  now = new Date();

  private cachedVulnerabilityData = signal<CachedVulnerabilityData | null>(null);
  private cachedHosts = signal<any[]>([]);
  private cachedPoamMetrics = signal<number>(0);
  private cachedPastDueIAVs = signal<number>(0);
  private cachedCredentialScanPercentage = signal<number>(0);

  totalFindings30Days = computed(() => {
    const m = this.tenableMetrics();
    return m.catIOpenCount30Days + m.catIIOpenCount30Days + m.catIIIOpenCount30Days;
  });

  totalFindings = computed(() => {
    const m = this.tenableMetrics();
    return m.catIOpenCount + m.catIIOpenCount + m.catIIIOpenCount;
  });

  tenableMetrics = signal<VulnerabilityMetrics>({
    totalPoamCompliance: 0,
    poamApprovalPercentage: 0,
    catICompliance: 0,
    catIICompliance: 0,
    catIIICompliance: 0,
    catIOpenCount30Days: 0,
    catIIOpenCount30Days: 0,
    catIIIOpenCount30Days: 0,
    catIOpenCount: 0,
    catIIOpenCount: 0,
    catIIIOpenCount: 0,
    exploitableFindingsCount: 0,
    pastDueIAVCount: 0,
    seolVulnerabilitiesCount: 0,
    credentialScanPercentage: 0,
    vphScore: 0,
    vphRating: 'Low',
    validOnlineAssets: 0
  });

  metricsDisplay = computed<MetricData[]>(() => {
    const loading = this.isLoading();
    return this.getTenableMetricsDisplay(loading);
  });

  ngOnInit() {
    this.componentInit.emit(this);
    this.loadAllData();
  }

  ngOnChanges() {
    if (this.collection) {
      this.collectionName.set(this.collection.collectionName || '');
      this.originCollectionId.set(this.collection.originCollectionId?.toString() || '');
      this.clearCache();
      this.loadAllData();
    }
  }

  private clearCache() {
    this.cachedVulnerabilityData.set(null);
    this.cachedHosts.set([]);
    this.cachedPoamMetrics.set(0);
    this.cachedPastDueIAVs.set(0);
    this.cachedCredentialScanPercentage.set(0);
    this.loadedRanges.set(new Set());
  }

  private loadAllData() {
    if (!this.collection) return;

    this.isLoading.set(true);
    const repoId = this.originCollectionId();
    const collectionId = this.collection?.collectionId;

    if (!repoId || !collectionId) {
      this.tenableMetrics.set(this.getEmptyTenableMetrics());
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      vulnerabilityData30: this.loadVulnerabilityDataForTimeRange(repoId, collectionId, '30'),
      hosts: this.loadAllHosts(repoId),
      poamMetrics: this.calculatePoamApprovalMetrics(collectionId, repoId),
      pastDueIAVs: this.calculatePastDueIAVs(repoId),
      credentialScanPercentage: this.calculateCredentialScanPercentage(repoId)
    })
      .pipe(
        tap((results) => {
          const currentCached = this.cachedVulnerabilityData() || {
            '7': null,
            '30': null,
            all: null
          };

          this.cachedVulnerabilityData.set({
            ...currentCached,
            '30': results.vulnerabilityData30
          });

          this.cachedHosts.set(results.hosts);
          this.cachedPoamMetrics.set(results.poamMetrics);
          this.cachedPastDueIAVs.set(results.pastDueIAVs);
          this.cachedCredentialScanPercentage.set(results.credentialScanPercentage);

          this.loadedRanges.update((ranges) => {
            ranges.add('30');
            return new Set(ranges);
          });

          this.updateMetricsFromCache();
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading Tenable metrics: ${getErrorMessage(error)}`
          });
          this.isLoading.set(false);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private loadTimeRangeData(timeRange: '7' | '30' | 'all') {
    const loadedRanges = this.loadedRanges();

    if (loadedRanges.has(timeRange)) {
      this.lastObservedTimeRange.set(timeRange);
      this.updateMetricsFromCache();
      return;
    }

    const repoId = this.originCollectionId();
    const collectionId = this.collection?.collectionId;

    if (!repoId || !collectionId) return;

    this.isLoading.set(true);

    this.loadVulnerabilityDataForTimeRange(repoId, collectionId, timeRange)
      .pipe(
        tap((data) => {
          const currentCached = this.cachedVulnerabilityData() || {
            '7': null,
            '30': null,
            all: null
          };

          this.cachedVulnerabilityData.set({
            ...currentCached,
            [timeRange]: data
          });

          this.loadedRanges.update((ranges) => {
            ranges.add(timeRange);
            return new Set(ranges);
          });

          this.lastObservedTimeRange.set(timeRange);
          this.updateMetricsFromCache();
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading ${timeRange}-day metrics: ${getErrorMessage(error)}`
          });
          this.isLoading.set(false);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private loadVulnerabilityDataForTimeRange(repoId: string, collectionId: any, timeRange: '7' | '30' | 'all') {
    const lastSeenValue = timeRange === 'all' ? null : timeRange === '7' ? '0:7' : '0:30';

    return forkJoin({
      severitySummary30Days: this.getSeveritySummary(repoId, true, lastSeenValue),
      severitySummary: this.getSeveritySummary(repoId, false, lastSeenValue),
      exploitableFindings: this.calculateExploitableFindings(repoId, lastSeenValue),
      seolVulnerabilities: this.calculateSEOLVulnerabilities(repoId, lastSeenValue),
      complianceMetrics: this.calculateComplianceMetrics(repoId, collectionId, lastSeenValue),
      totalCompliance: this.calculateTotalPoamCompliance(collectionId, repoId, lastSeenValue)
    });
  }

  private updateMetricsFromCache() {
    const cachedData = this.cachedVulnerabilityData();
    if (!cachedData) return;

    const timeRange = this.lastObservedTimeRange();
    const data = cachedData[timeRange];

    if (!data) return;

    const validAssets = this.getFilteredHostCount(this.hostTimeRange());
    const catICount = data.severitySummary.critical + data.severitySummary.high;
    const catIICount = data.severitySummary.medium;
    const catIIICount = data.severitySummary.low;

    const catICount30 = data.severitySummary30Days.critical + data.severitySummary30Days.high;
    const catIICount30 = data.severitySummary30Days.medium;
    const catIIICount30 = data.severitySummary30Days.low;

    const vphData = this.calculateVPHScore(catICount, catIICount, catIIICount, validAssets);

    this.tenableMetrics.set({
      totalPoamCompliance: data.totalCompliance,
      poamApprovalPercentage: this.cachedPoamMetrics(),
      catICompliance: data.complianceMetrics.catI,
      catIICompliance: data.complianceMetrics.catII,
      catIIICompliance: data.complianceMetrics.catIII,
      catIOpenCount30Days: catICount30,
      catIIOpenCount30Days: catIICount30,
      catIIIOpenCount30Days: catIIICount30,
      catIOpenCount: catICount,
      catIIOpenCount: catIICount,
      catIIIOpenCount: catIIICount,
      exploitableFindingsCount: data.exploitableFindings,
      pastDueIAVCount: this.cachedPastDueIAVs(),
      seolVulnerabilitiesCount: data.seolVulnerabilities,
      credentialScanPercentage: this.cachedCredentialScanPercentage(),
      vphScore: vphData.score,
      vphRating: vphData.rating,
      validOnlineAssets: validAssets
    });

    this.prepareChartsData();
  }

  onLastObservedRangeChange(range: '7' | '30' | 'all') {
    this.loadTimeRangeData(range);
  }

  onHostTimeRangeChange(range: '7' | '30' | 'all') {
    this.hostTimeRange.set(range);
    this.updateVPHOnly();
  }

  private updateVPHOnly() {
    const cachedData = this.cachedVulnerabilityData();
    if (!cachedData) return;

    const timeRange = this.lastObservedTimeRange();
    const data = cachedData[timeRange];

    if (!data) return;

    const validAssets = this.getFilteredHostCount(this.hostTimeRange());
    const catICount = data.severitySummary.critical + data.severitySummary.high;
    const catIICount = data.severitySummary.medium;
    const catIIICount = data.severitySummary.low;

    const vphData = this.calculateVPHScore(catICount, catIICount, catIIICount, validAssets);

    this.tenableMetrics.update((current) => ({
      ...current,
      vphScore: vphData.score,
      vphRating: vphData.rating,
      validOnlineAssets: validAssets
    }));
  }

  private getFilteredHostCount(timeRange: '7' | '30' | 'all'): number {
    const hosts = this.cachedHosts();

    if (timeRange === 'all') {
      return hosts.length;
    }

    const now = Date.now() / 1000;
    const daysInSeconds = timeRange === '7' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
    const cutoffTime = now - daysInSeconds;

    return hosts.filter((host: any) => {
      const lastSeen = Number(host.lastSeen) || 0;
      return lastSeen >= cutoffTime;
    }).length;
  }

  private loadAllHosts(repoId: string) {
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

    return this.importService.postTenableHostSearch(hostParams).pipe(
      map((response: any) => response?.response || []),
      catchError(() => of([]))
    );
  }

  private getSeveritySummary(repoId: string, apply30DayFilter: boolean, lastSeenValue: string | null): Observable<SeveritySummary> {
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

    return this.importService.postTenableAnalysis(analysisParams).pipe(
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
          const count = parseInt(item.count) || 0;

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
      }),
      catchError(() => of({ critical: 0, high: 0, medium: 0, low: 0, info: 0 }))
    );
  }

  private calculateTotalPoamCompliance(collectionId: any, repoId: string, lastSeenValue: string | null) {
    const allFilters = [];

    if (lastSeenValue) {
      allFilters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    allFilters.push({
      filterName: 'severity',
      operator: '=',
      value: '1,2,3,4',
      type: 'vuln',
      isPredefined: true
    });

    return combineLatest([this.getTenableVulnerabilities(repoId, allFilters), this.collectionsService.getPoamsByCollection(collectionId)]).pipe(
      map(([vulnData, poams]) => {
        const vulnerabilities = vulnData.response?.results || [];
        const totalVulns = vulnerabilities.length;

        if (totalVulns === 0) return 100;

        const approvedPoams = poams.filter((p: any) => p.status === 'Approved');
        const vulnerabilityStatusMap = new Map<string, string>();

        approvedPoams.forEach((poam: any) => {
          if (poam.vulnerabilityId) {
            vulnerabilityStatusMap.set(poam.vulnerabilityId, poam.status);
          }
          if (Array.isArray(poam?.associatedVulnerabilities)) {
            poam.associatedVulnerabilities.forEach((vulnId: string) => {
              vulnerabilityStatusMap.set(vulnId, poam.status);
            });
          }
        });

        const vulnsWithApprovedPoam = vulnerabilities.filter((vuln: any) => {
          return vulnerabilityStatusMap.get(vuln.pluginID) === 'Approved';
        }).length;

        return (vulnsWithApprovedPoam / totalVulns) * 100;
      }),
      catchError(() => of(0))
    );
  }

  private calculateVPHScore(catICount: number, catIICount: number, catIIICount: number, validAssets: number): { score: number; rating: string } {
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

  getVPHColor(vphScore: number): string {
    if (vphScore < 2.5) {
      return '#10b981';
    } else if (vphScore < 2.6) {
      return '#4ade80';
    } else if (vphScore < 2.7) {
      return '#a3e635';
    } else if (vphScore < 2.8) {
      return '#e4d02b';
    } else if (vphScore < 2.9) {
      return '#fbbf24';
    } else if (vphScore < 3) {
      return '#fca726';
    } else if (vphScore < 3.1) {
      return '#fb923c';
    } else if (vphScore < 3.2) {
      return '#f56e54';
    } else if (vphScore < 3.3) {
      return '#f05a6a';
    } else {
      return '#f05a6acc';
    }
  }

  getPoamComplianceColor(compliance: number): string {
    if (compliance >= 90) {
      return '#10b981';
    } else if (compliance >= 80) {
      return '#4ade80';
    } else if (compliance >= 70) {
      return '#a3e635';
    } else if (compliance >= 60) {
      return '#e4d02b';
    } else if (compliance >= 50) {
      return '#fbbf24';
    } else if (compliance >= 40) {
      return '#fca726';
    } else if (compliance >= 30) {
      return '#fb923c';
    } else if (compliance >= 20) {
      return '#f56e54';
    } else if (compliance >= 10) {
      return '#f05a6a';
    } else {
      return '#f05a6acc';
    }
  }

  getLastObservedText(): string {
    const range = this.lastObservedTimeRange();
    if (range === 'all') return '';
    return range === '7' ? 'within 7 days' : 'within 30 days';
  }

  private calculatePoamApprovalMetrics(collectionId: any, repoId: string) {
    return combineLatest([this.getTenableVulnerabilities(repoId, []), this.collectionsService.getPoamsByCollection(collectionId)]).pipe(
      map(([vulnData, poams]) => {
        const totalVulnerabilities = vulnData.response?.totalRecords || 0;
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

  private calculateComplianceMetrics(repoId: string, collectionId: any, lastSeenValue: string | null) {
    const baseFilters = [];
    if (lastSeenValue) {
      baseFilters.push({
        filterName: 'lastSeen',
        operator: '=',
        value: lastSeenValue,
        type: 'vuln',
        isPredefined: true
      });
    }

    const catIFilters = [
      ...baseFilters,
      {
        filterName: 'pluginPublished',
        operator: '=',
        value: '30:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'severity',
        operator: '=',
        value: '3,4',
        type: 'vuln',
        isPredefined: true
      }
    ];

    const catIIFilters = [
      ...baseFilters,
      {
        filterName: 'pluginPublished',
        operator: '=',
        value: '30:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'severity',
        operator: '=',
        value: '2',
        type: 'vuln',
        isPredefined: true
      }
    ];

    const catIIIFilters = [
      ...baseFilters,
      {
        filterName: 'pluginPublished',
        operator: '=',
        value: '30:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'severity',
        operator: '=',
        value: '1',
        type: 'vuln',
        isPredefined: true
      }
    ];

    return combineLatest([
      this.getTenableVulnerabilities(repoId, catIFilters),
      this.getTenableVulnerabilities(repoId, catIIFilters),
      this.getTenableVulnerabilities(repoId, catIIIFilters),
      this.collectionsService.getPoamsByCollection(collectionId)
    ]).pipe(
      map(([catIVulns, catIIVulns, catIIIVulns, poams]) => {
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

        const calculateCompliance = (vulnData: any) => {
          const vulnerabilities = vulnData.response?.results || [];
          const totalVulns = vulnerabilities.length;
          if (totalVulns === 0) return 0;

          const vulnsWithApprovedPoam = vulnerabilities.filter((vuln: any) => {
            return vulnerabilityStatusMap.get(vuln.pluginID) === 'Approved';
          }).length;

          return (vulnsWithApprovedPoam / totalVulns) * 100;
        };

        return {
          catI: calculateCompliance(catIVulns),
          catII: calculateCompliance(catIIVulns),
          catIII: calculateCompliance(catIIIVulns)
        };
      }),
      catchError(() => of({ catI: 0, catII: 0, catIII: 0 }))
    );
  }

  private calculateExploitableFindings(repoId: string, lastSeenValue: string | null) {
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
      map((data) => data.response?.totalRecords || 0),
      catchError(() => of(0))
    );
  }

  private calculatePastDueIAVs(repoId: string) {
    return this.importService.getIAVPluginIds().pipe(
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

            return this.importService.getIAVInfoForPlugins(pluginIDList).pipe(
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

  private calculateSEOLVulnerabilities(repoId: string, lastSeenValue: string | null) {
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

    return this.getTenableVulnerabilities(repoId, filters).pipe(
      map((data) => data.response?.totalRecords || 0),
      catchError(() => of(0))
    );
  }

  private calculateCredentialScanPercentage(repoId: string) {
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
        const totalCount = totalVulns.response?.totalRecords || 0;
        const nonCredentialCount = nonCredentialVulns.response?.totalRecords || 0;
        if (totalCount === 0) return 0;
        const credentialCount = totalCount - nonCredentialCount;
        return (credentialCount / totalCount) * 100;
      }),
      catchError(() => of(0))
    );
  }

  private getTenableVulnerabilities(repoId: string, additionalFilters: any[] = []) {
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

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      catchError((error) => {
        console.error('Error fetching Tenable data:', error);
        return of({ response: { totalRecords: 0, results: [] } });
      })
    );
  }

  private createRepositoryFilter(repoId: string) {
    return {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: repoId }]
    };
  }

  private prepareChartsData() {
    const m = this.tenableMetrics();
    const cardBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim();

    this.findingsChartData.set({
      labels: ['Critical / High', 'Medium', 'Low'],
      datasets: [
        {
          data: [m.catIOpenCount30Days, m.catIIOpenCount30Days, m.catIIIOpenCount30Days],
          backgroundColor: ['rgba(236, 72, 99, 0.8)', 'rgba(251, 167, 50, 0.8)', 'rgba(230, 215, 44, 0.8)'],
          opacity: 0.8,
          hoverBorderColor: cardBackgroundColor,
          borderWidth: 8,
          borderRadius: 15,
          borderColor: cardBackgroundColor
        }
      ]
    });

    this.allFindingsChartData.set({
      labels: ['Critical / High', 'Medium', 'Low'],
      datasets: [
        {
          data: [m.catIOpenCount, m.catIIOpenCount, m.catIIIOpenCount],
          backgroundColor: ['rgba(236, 72, 99, 0.8)', 'rgba(251, 167, 50, 0.8)', 'rgba(230, 215, 44, 0.8)'],
          opacity: 0.8,
          hoverBorderColor: cardBackgroundColor,
          borderWidth: 8,
          borderRadius: 15,
          borderColor: cardBackgroundColor
        }
      ]
    });

    this.findingsChartOptions.set({
      plugins: {
        legend: {
          display: false
        }
      },
      cutout: '60%',
      responsive: true,
      maintainAspectRatio: false
    });
  }

  private getTenableMetricsDisplay(loading: boolean): MetricData[] {
    const m = this.tenableMetrics();
    const lastObservedText = this.getLastObservedText();

    return [
      {
        label: 'Exploitable Findings (7+ Days)',
        tooltip: `Count of vulnerabilities with known exploits available\n\nFilters: Published 7+ days ago${lastObservedText ? ', last observed ' + lastObservedText : ''}, exploit available = true`,
        origin: 'Tenable',
        value: loading ? '-' : m.exploitableFindingsCount,
        category: 'exploit',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Past Due IAVs',
        tooltip: `Count of IAVs past their Navy compliance date\n\nExcludes Informational severity and superseded IAVs`,
        origin: 'Tenable',
        value: loading ? '-' : m.pastDueIAVCount,
        category: 'iav',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Security End of Life Vulnerabilities',
        tooltip: `Filters: SEoL date 30+ days ago${lastObservedText ? ', seen ' + lastObservedText : ''}, plugin name contains 'SEoL'`,
        origin: 'Tenable',
        value: loading ? '-' : m.seolVulnerabilitiesCount,
        category: 'seol',
        severity: 'high',
        isLoading: loading
      },
      {
        label: 'Vulnerabilities with Approved POAMs',
        tooltip: `Percentage calculation: Unique vulnerability IDs with approved POAMs ÷ Total vulnerabilities × 100\n\nIncludes both primary vulnerability IDs and associated vulnerabilities in POAMs`,
        origin: 'Tenable',
        value: loading ? '-' : `${m.poamApprovalPercentage.toFixed(1)}%`,
        category: 'poam',
        isPercentage: true,
        isLoading: loading
      },
      {
        label: 'Credential Scan Coverage',
        tooltip: `Percentage calculation: (Total vulnerabilities - Non-credentialed scan findings) ÷ Total vulnerabilities × 100\n\nNon-credentialed plugin IDs: 117886, 10428, 21745, 24786, 26917, 102094, 104410, 110385, 110723`,
        origin: 'Tenable',
        value: loading ? '-' : `${m.credentialScanPercentage.toFixed(1)}%`,
        category: 'credential',
        severity: 'medium',
        isPercentage: true,
        isLoading: loading
      }
    ];
  }

  private getEmptyTenableMetrics(): VulnerabilityMetrics {
    return {
      totalPoamCompliance: 0,
      poamApprovalPercentage: 0,
      catICompliance: 0,
      catIICompliance: 0,
      catIIICompliance: 0,
      catIOpenCount30Days: 0,
      catIIOpenCount30Days: 0,
      catIIIOpenCount30Days: 0,
      catIOpenCount: 0,
      catIIOpenCount: 0,
      catIIIOpenCount: 0,
      exploitableFindingsCount: 0,
      pastDueIAVCount: 0,
      seolVulnerabilitiesCount: 0,
      credentialScanPercentage: 0,
      vphScore: 0,
      vphRating: 'Low',
      validOnlineAssets: 0
    };
  }

  exportMetrics() {
    const cachedData = this.cachedVulnerabilityData();
    if (!cachedData) return;

    const selectedRange = this.lastObservedTimeRange();
    const data = cachedData[selectedRange];

    if (!data) {
      this.messageService.add({
        severity: 'info',
        summary: 'Loading Data',
        detail: 'Please wait while data loads, then try exporting again.'
      });
      this.loadTimeRangeData(selectedRange);
      return;
    }

    const collectionName = this.collectionName();
    const exportedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rows = [];
    const opensLabel = selectedRange === 'all' ? 'Opens (Unique)' : `Opens (Unique - ${selectedRange} Days)`;
    const timeRangeNote = selectedRange === 'all' ? '' : ` (${selectedRange} days)`;

    const catICount = data.severitySummary.critical + data.severitySummary.high;
    const catIICount = data.severitySummary.medium;
    const catIIICount = data.severitySummary.low;

    const vphData = this.calculateVPHScore(catICount, catIICount, catIIICount, this.getFilteredHostCount(this.hostTimeRange()));
    const hostRangeLabel = this.hostTimeRange() === 'all' ? '' : ` - (Within ${this.hostTimeRange()} Days)`;

    rows.push([`[Tenable] ${collectionName} C-PAT Metrics - ${new Date().toLocaleString()} - ${selectedRange === 'all' ? 'All Time' : `${selectedRange} Days`}`]);
    rows.push(['Collection Name', 'CATEGORY', 'METRIC', 'VALUE']);
    rows.push([`[Tenable] ${collectionName}`, 'POAM', `CAT I Compliance %${timeRangeNote}`, `${data.complianceMetrics.catI.toFixed(1)}%`]);
    rows.push([`[Tenable] ${collectionName}`, 'POAM', `CAT II Compliance %${timeRangeNote}`, `${data.complianceMetrics.catII.toFixed(1)}%`]);
    rows.push([`[Tenable] ${collectionName}`, 'POAM', `CAT III Compliance %${timeRangeNote}`, `${data.complianceMetrics.catIII.toFixed(1)}%`]);
    rows.push([`[Tenable] ${collectionName}`, 'POAM', `Total POAM Compliance %${timeRangeNote}`, `${data.totalCompliance.toFixed(1)}%`]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', `CAT I - ${opensLabel}`, catICount.toString()]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', `CAT II - ${opensLabel}`, catIICount.toString()]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', `CAT III - ${opensLabel}`, catIIICount.toString()]);
    rows.push([
      `[Tenable] ${collectionName}`,
      'ACAS',
      selectedRange === 'all' ? 'Exploitable Findings (Published 7+ Days)' : `Exploitable Findings (Published 7+ Days & Last Observed Within ${selectedRange} Days)`,
      data.exploitableFindings.toString()
    ]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', 'Past Due IAVs', this.cachedPastDueIAVs().toString()]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', selectedRange === 'all' ? 'Security End of Life (Unique)' : `Security End of Life (Unique - Last Observed Within ${selectedRange} Days)`, data.seolVulnerabilities.toString()]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', 'Credentialed Scan %', `${this.cachedCredentialScanPercentage().toFixed(1)}%`]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', `VPH Score${hostRangeLabel}`, vphData.score.toFixed(2)]);
    rows.push([`[Tenable] ${collectionName}`, 'ACAS', `Valid Online Assets${hostRangeLabel}`, this.getFilteredHostCount(this.hostTimeRange()).toString()]);

    this.exportAsCSV(rows, `${collectionName}_CPAT_Metrics_${exportedDate}`);
  }

  private exportAsCSV(rows: any[][], filename: string) {
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshMetrics() {
    this.clearCache();
    this.loadAllData();
    this.now = new Date();
  }
}
