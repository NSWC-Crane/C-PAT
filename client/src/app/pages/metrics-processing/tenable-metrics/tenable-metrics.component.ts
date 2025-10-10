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
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { EMPTY, catchError, combineLatest, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';

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
  coraRiskScore: number;
  coraRiskRating: string;
}

@Component({
  selector: 'cpat-tenable-metrics',
  templateUrl: './tenable-metrics.component.html',
  styleUrls: ['./tenable-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, ProgressSpinnerModule, TooltipModule, ChartModule, DividerModule]
})
export class TenableMetricsComponent implements OnInit, OnChanges {
  private importService = inject(ImportService);
  private collectionsService = inject(CollectionsService);
  private messageService = inject(MessageService);

  @Input() collection: any;
  @Output() componentInit = new EventEmitter<TenableMetricsComponent>();

  isLoading = signal<boolean>(true);
  collectionName = signal<string>('');
  originCollectionId = signal<string>('');
  findingsChartData = signal<any>(null);
  allFindingsChartData = signal<any>(null);
  findingsChartOptions = signal<any>(null);
  now = new Date();

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
    coraRiskScore: 0,
    coraRiskRating: 'Very Low'
  });

  metricsDisplay = computed<MetricData[]>(() => {
    const loading = this.isLoading();
    return this.getTenableMetricsDisplay(loading);
  });

  ngOnInit() {
    this.componentInit.emit(this);
    this.loadMetrics();
  }

  ngOnChanges() {
    if (this.collection) {
      this.collectionName.set(this.collection.collectionName || '');
      this.originCollectionId.set(this.collection.originCollectionId?.toString() || '');
      this.loadMetrics();
    }
  }

  private loadMetrics() {
    if (!this.collection) return;

    this.isLoading.set(true);
    this.loadTenableMetrics()
      .pipe(
        tap((metrics) => {
          this.tenableMetrics.set(metrics);
          this.prepareChartsData();
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

  private loadTenableMetrics() {
    return this.loadAllTenableMetrics();
  }

  private loadAllTenableMetrics() {
    const repoId = this.originCollectionId();
    const collectionId = this.collection?.collectionId;

    if (!repoId || !collectionId) {
      return of(this.getEmptyTenableMetrics());
    }

    return forkJoin({
      poamMetrics: this.calculatePoamApprovalMetrics(collectionId, repoId),
      complianceMetrics: this.calculateComplianceMetrics(repoId),
      openVulnerabilities30Days: this.calculateDetailedOpenVulnerabilities(repoId, true),
      openVulnerabilities: this.calculateDetailedOpenVulnerabilities(repoId, false),
      exploitableFindings: this.calculateExploitableFindings(repoId),
      pastDueIAVs: this.calculatePastDueIAVs(repoId),
      seolVulnerabilities: this.calculateSEOLVulnerabilities(repoId),
      credentialScanPercentage: this.calculateCredentialScanPercentage(repoId),
      totalCompliance: this.calculateTotalPoamCompliance(collectionId, repoId)
    }).pipe(
      map((results) => {
        const catICount = results.openVulnerabilities30Days.criticalHigh;
        const catIICount = results.openVulnerabilities30Days.medium;
        const catIIICount = results.openVulnerabilities30Days.low;

        const coraData = this.calculateCORAScore(catICount, catIICount, catIIICount);

        return {
          totalPoamCompliance: results.totalCompliance,
          poamApprovalPercentage: results.poamMetrics,
          catICompliance: results.complianceMetrics.catI,
          catIICompliance: results.complianceMetrics.catII,
          catIIICompliance: results.complianceMetrics.catIII,

          catIOpenCount30Days: results.openVulnerabilities30Days.criticalHigh,
          catIIOpenCount30Days: results.openVulnerabilities30Days.medium,
          catIIIOpenCount30Days: results.openVulnerabilities30Days.low,

          catIOpenCount: results.openVulnerabilities.criticalHigh,
          catIIOpenCount: results.openVulnerabilities.medium,
          catIIIOpenCount: results.openVulnerabilities.low,

          exploitableFindingsCount: results.exploitableFindings,
          pastDueIAVCount: results.pastDueIAVs,
          seolVulnerabilitiesCount: results.seolVulnerabilities,
          credentialScanPercentage: results.credentialScanPercentage,
          coraRiskScore: coraData.score,
          coraRiskRating: coraData.rating
        };
      })
    );
  }

  private calculateDetailedOpenVulnerabilities(repoId: string, apply30DayFilter: boolean) {
    const baseFilters = apply30DayFilter ? [{ filterName: 'lastSeen', operator: '=', value: '0:30', type: 'vuln', isPredefined: true }] : [];

    const criticalHighFilters = [...baseFilters, { filterName: 'severity', operator: '=', value: '3,4', type: 'vuln', isPredefined: true }];

    const mediumFilters = [...baseFilters, { filterName: 'severity', operator: '=', value: '2', type: 'vuln', isPredefined: true }];

    const lowFilters = [...baseFilters, { filterName: 'severity', operator: '=', value: '1', type: 'vuln', isPredefined: true }];

    return forkJoin({
      criticalHigh: this.getTenableVulnerabilities(repoId, criticalHighFilters),
      medium: this.getTenableVulnerabilities(repoId, mediumFilters),
      low: this.getTenableVulnerabilities(repoId, lowFilters)
    }).pipe(
      map((results) => ({
        criticalHigh: Number(results.criticalHigh.response?.totalRecords) || 0,
        medium: Number(results.medium.response?.totalRecords) || 0,
        low: Number(results.low.response?.totalRecords) || 0
      })),
      catchError(() => of({ criticalHigh: 0, medium: 0, low: 0 }))
    );
  }

  private calculateTotalPoamCompliance(collectionId: any, repoId: string) {
    const allFilters = [
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
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
          if (poam.associatedVulnerabilities && Array.isArray(poam.associatedVulnerabilities)) {
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

  private calculateCORAScore(catICount: number, catIICount: number, catIIICount: number): { score: number; rating: string } {
    const totalFindings = catICount + catIICount + catIIICount;

    if (totalFindings === 0) {
      return { score: 0, rating: 'Very Low' };
    }

    const catIPercentage = (catICount / totalFindings) * 100;
    const catIIPercentage = (catIICount / totalFindings) * 100;
    const catIIIPercentage = (catIIICount / totalFindings) * 100;

    const weightedSum = catIPercentage * 10 + catIIPercentage * 4 + catIIIPercentage * 1;
    const totalWeight = 15;
    const weightedAverage = weightedSum / totalWeight;

    let rating: string;
    if (weightedAverage === 0) {
      rating = 'Very Low';
    } else if (weightedAverage < 5) {
      rating = 'Low';
    } else if (weightedAverage < 10) {
      rating = 'Moderate';
    } else if (weightedAverage < 20) {
      rating = 'High';
    } else {
      rating = 'Very High';
    }

    return { score: weightedAverage, rating };
  }

  getCoraRiskColor(riskScore: number): string {
    if (riskScore >= 90) {
      return 'rgba(236, 72, 99, 0.8)';
    } else if (riskScore >= 80) {
      return '#f05a6a';
    } else if (riskScore >= 70) {
      return '#f56e54';
    } else if (riskScore >= 60) {
      return '#fb923c';
    } else if (riskScore >= 50) {
      return '#fca726';
    } else if (riskScore >= 40) {
      return '#fbbf24';
    } else if (riskScore >= 30) {
      return '#e4d02b';
    } else if (riskScore >= 20) {
      return '#a3e635';
    } else if (riskScore >= 10) {
      return '#4ade80';
    } else {
      return '#10b981';
    }
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

          if (poam.associatedVulnerabilities && Array.isArray(poam.associatedVulnerabilities)) {
            poam.associatedVulnerabilities.forEach((id: string) => uniqueVulnIds.add(id));
          }
        });

        return (uniqueVulnIds.size / totalVulnerabilities) * 100;
      }),
      catchError(() => of(0))
    );
  }

  private calculateComplianceMetrics(repoId: string) {
    const collectionId = this.collection?.collectionId;

    const catIFilters = [
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'vulnPublished',
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
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'vulnPublished',
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
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'vulnPublished',
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

          if (poam.associatedVulnerabilities && Array.isArray(poam.associatedVulnerabilities)) {
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
            const status = vulnerabilityStatusMap.get(vuln.pluginID);

            return status === 'Approved';
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

  // private calculateOpenVulnerabilities(repoId: string) {
  //   const catIFilters = [
  //     {
  //       filterName: 'lastSeen',
  //       operator: '=',
  //       value: '0:30',
  //       type: 'vuln',
  //       isPredefined: true
  //     },
  //     {
  //       filterName: 'severity',
  //       operator: '=',
  //       value: '3,4',
  //       type: 'vuln',
  //       isPredefined: true
  //     }
  //   ];

  //   const catIIFilters = [
  //     {
  //       filterName: 'lastSeen',
  //       operator: '=',
  //       value: '0:30',
  //       type: 'vuln',
  //       isPredefined: true
  //     },
  //     {
  //       filterName: 'severity',
  //       operator: '=',
  //       value: '2',
  //       type: 'vuln',
  //       isPredefined: true
  //     }
  //   ];

  //   const catIIIFilters = [
  //     {
  //       filterName: 'lastSeen',
  //       operator: '=',
  //       value: '0:30',
  //       type: 'vuln',
  //       isPredefined: true
  //     },
  //     {
  //       filterName: 'severity',
  //       operator: '=',
  //       value: '1',
  //       type: 'vuln',
  //       isPredefined: true
  //     }
  //   ];

  //   return forkJoin({
  //     catI: this.getTenableVulnerabilities(repoId, catIFilters),
  //     catII: this.getTenableVulnerabilities(repoId, catIIFilters),
  //     catIII: this.getTenableVulnerabilities(repoId, catIIIFilters)
  //   }).pipe(
  //     map((results) => ({
  //       catI: results.catI.response?.totalRecords || 0,
  //       catII: results.catII.response?.totalRecords || 0,
  //       catIII: results.catIII.response?.totalRecords || 0
  //     })),
  //     catchError(() => of({ catI: 0, catII: 0, catIII: 0 }))
  //   );
  // }

  private calculateExploitableFindings(repoId: string) {
    const filters = [
      {
        filterName: 'vulnPublished',
        operator: '=',
        value: '7:all',
        type: 'vuln',
        isPredefined: true
      },
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
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

  private calculateSEOLVulnerabilities(repoId: string) {
    const filters = [
      {
        filterName: 'lastSeen',
        operator: '=',
        value: '0:30',
        type: 'vuln',
        isPredefined: true
      },
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
    ];

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

  private getTenableMetricsDisplay(loading: boolean): MetricData[] {
    const m = this.tenableMetrics();

    return [
      {
        label: 'Exploitable Findings (7+ Days)',
        tooltip: `Count of vulnerabilities with known exploits available

                Filters: Published 7+ days ago, seen in last 30 days, exploit available = true`,
        origin: 'Tenable',
        value: loading ? '-' : m.exploitableFindingsCount,
        category: 'exploit',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Past Due IAVs',
        tooltip: `Count of IAVs past their Navy compliance date

                Excludes superseded IAVs`,
        origin: 'Tenable',
        value: loading ? '-' : m.pastDueIAVCount,
        category: 'iav',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Security End of Life Vulnerabilities',
        tooltip: `Filters: SEoL date 30+ days ago, seen in last 30 days, plugin name contains 'SEoL'`,
        origin: 'Tenable',
        value: loading ? '-' : m.seolVulnerabilitiesCount,
        category: 'seol',
        severity: 'high',
        isLoading: loading
      },
      {
        label: 'Vulnerabilities with Approved POAMs',
        tooltip: `Percentage calculation: Unique vulnerability IDs with approved POAMs ÷ Total vulnerabilities × 100

                Includes both primary vulnerability IDs and associated vulnerabilities in POAMs`,
        origin: 'Tenable',
        value: loading ? '-' : `${m.poamApprovalPercentage.toFixed(1)}%`,
        category: 'poam',
        isPercentage: true,
        isLoading: loading
      },
      {
        label: 'Credential Scan Coverage',
        tooltip: `Percentage calculation: (Total vulnerabilities - Non-credentialed scan findings) ÷ Total vulnerabilities × 100

                Non-credentialed plugin IDs: 117886, 10428, 21745, 24786, 26917, 102094, 104410, 110385, 110723`,
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
      coraRiskScore: 0,
      coraRiskRating: 'Very Low'
    };
  }

  exportMetrics() {
    const metrics = this.tenableMetrics();
    const collectionName = this.collectionName();
    const exportedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rows = [];

    rows.push([`${collectionName} C-PAT Metrics - ${new Date().toLocaleString()}`]);
    rows.push(['Collection Name', 'CATEGORY', 'METRIC', 'VALUE']);
    rows.push([collectionName, 'POAM', 'CAT I Compliance %', `${metrics.catICompliance.toFixed(1)}%`]);
    rows.push([collectionName, 'POAM', 'CAT II Compliance %', `${metrics.catIICompliance.toFixed(1)}%`]);
    rows.push([collectionName, 'POAM', 'CAT III Compliance %', `${metrics.catIIICompliance.toFixed(1)}%`]);
    rows.push([collectionName, 'ACAS', 'CAT I - Opens (Unique - 30+ Days)', metrics.catIOpenCount30Days.toString()]);
    rows.push([collectionName, 'ACAS', 'CAT II - Opens (Unique - 30+ Days)', metrics.catIIOpenCount30Days.toString()]);
    rows.push([collectionName, 'ACAS', 'CAT III - Opens (Unique - 30+ Days)', metrics.catIIIOpenCount30Days.toString()]);
    rows.push([collectionName, 'ACAS', 'CAT I - Exploitable Findings (Unique - 7+ Days)', metrics.exploitableFindingsCount.toString()]);
    rows.push([collectionName, 'ACAS', 'Past Due IAVs', metrics.pastDueIAVCount.toString()]);
    rows.push([collectionName, 'ACAS', 'Security End of Life (Unique)', metrics.seolVulnerabilitiesCount.toString()]);
    rows.push([collectionName, 'ACAS', 'Credentialed Scan %', `${metrics.credentialScanPercentage.toFixed(1)}%`]);

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
    this.loadMetrics();
    this.now = new Date();
  }
}
