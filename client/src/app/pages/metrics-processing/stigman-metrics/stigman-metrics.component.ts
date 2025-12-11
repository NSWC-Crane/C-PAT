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
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, catchError, combineLatest, map, of, tap } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';

interface MetricData {
  label: string;
  tooltip?: string;
  origin?: string;
  value: number | string;
  severity?: string;
  isPercentage?: boolean;
  isLoading?: boolean;
}

interface STIGManagerMetrics {
  assetCount: number;
  catICompliance: number;
  catIICompliance: number;
  catIIICompliance: number;
  catIOpenCount: number;
  catIIOpenCount: number;
  catIIIOpenCount: number;
  catIOpenRawCount: number;
  catIIOpenRawCount: number;
  catIIIOpenRawCount: number;
  coraRiskScore: number;
  coraRiskRating: string;
  totalAssessments: number;
  assessedCount: number;
  submittedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  assessedPercentage: number;
  fullyAssessedSTIGsCount: number;
  totalSTIGsCount: number;
}

@Component({
  selector: 'cpat-stigman-metrics',
  templateUrl: './stigman-metrics.component.html',
  styleUrls: ['./stigman-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, ProgressBarModule, ProgressSpinnerModule, TooltipModule, ChartModule, DividerModule]
})
export class STIGManagerMetricsComponent implements OnInit, OnChanges {
  private readonly sharedService = inject(SharedService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);

  @Input() collection: any;
  @Output() componentInit = new EventEmitter<STIGManagerMetricsComponent>();

  isLoading = signal<boolean>(true);
  collectionName = signal<string>('');
  originCollectionId = signal<string>('');
  findingsChartData = signal<any>(null);
  findingsChartOptions = signal<any>(null);
  stigsAssessmentData = signal<any[]>([]);
  assessmentChartData = signal<any>(null);
  assessmentChartOptions = signal<any>(null);
  now = new Date();

  totalRawFindings = computed(() => {
    const m = this.stigManagerMetrics();

    return m.catIOpenRawCount + m.catIIOpenRawCount + m.catIIIOpenRawCount;
  });

  stigManagerMetrics = signal<STIGManagerMetrics>({
    assetCount: 0,
    catICompliance: 0,
    catIICompliance: 0,
    catIIICompliance: 0,
    catIOpenCount: 0,
    catIIOpenCount: 0,
    catIIIOpenCount: 0,
    catIOpenRawCount: 0,
    catIIOpenRawCount: 0,
    catIIIOpenRawCount: 0,
    coraRiskScore: 0,
    coraRiskRating: 'Very Low',
    totalAssessments: 0,
    assessedCount: 0,
    submittedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    assessedPercentage: 0,
    fullyAssessedSTIGsCount: 0,
    totalSTIGsCount: 0
  });

  metricsDisplay = computed<MetricData[]>(() => {
    const loading = this.isLoading();

    return this.getSTIGManagerMetricsDisplay(loading);
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
    this.loadSTIGManagerMetrics()
      .pipe(
        tap((metrics) => {
          this.stigManagerMetrics.set(metrics);
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading STIG Manager metrics: ${getErrorMessage(error)}`
          });
          this.isLoading.set(false);

          return EMPTY;
        })
      )
      .subscribe();
  }

  private prepareChartsData() {
    const m = this.stigManagerMetrics();
    const cardBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim();
    this.findingsChartData.set({
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          data: [m.catIOpenRawCount, m.catIIOpenRawCount, m.catIIIOpenRawCount],
          backgroundColor: ['rgba(240, 90, 106, 0.8)', 'rgba(251, 167, 50, 0.8)', 'rgba(230, 185, 44, 0.8)'],
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

  private prepareAssessmentChartData() {
    const m = this.stigManagerMetrics();

    if (m.totalAssessments === 0) {
      this.assessmentChartData.set({ labels: [], datasets: [] });

      return;
    }

    const unassessedCount = m.totalAssessments - m.assessedCount;
    const assessedOnly = m.assessedCount - m.submittedCount - m.acceptedCount - m.rejectedCount;

    const data = {
      labels: ['Accepted', 'Submitted', 'Rejected', 'Assessed', 'Unassessed'],
      datasets: [
        {
          label: 'Assessment Count',
          data: [m.acceptedCount, m.submittedCount, m.rejectedCount, assessedOnly, unassessedCount],
          backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(230, 185, 44, 0.8)', 'rgba(240, 90, 106, 0.8)', 'rgba(251, 167, 50, 0.8)', 'rgba(170, 170, 170, 0.8)'],
          borderColor: ['rgba(16, 185, 129, 0.8)', 'rgba(230, 185, 44, 0.8)', 'rgba(240, 90, 106, 0.8)', 'rgba(251, 167, 50, 0.8)', 'rgba(170, 170, 170, 0.8)'],
          borderWidth: 1,
          barThickness: 28,
          borderRadius: {
            topLeft: 14,
            topRight: 14
          },
          borderSkipped: false
        }
      ]
    };

    this.assessmentChartData.set(data);
    this.assessmentChartOptions.set(this.setChartOptions());
  }

  private loadSTIGManagerMetrics() {
    const collectionId = this.collection?.collectionId;
    const originCollectionId = this.originCollectionId();

    if (!originCollectionId || !collectionId) {
      return of(this.getEmptySTIGManagerMetrics());
    }

    return combineLatest([this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(+originCollectionId), this.sharedService.getFindingsMetricsFromSTIGMAN(+originCollectionId), this.collectionsService.getPoamsByCollection(collectionId)]).pipe(
      map(([stigSummary, findings, poams]: [any, any[], any[]]) => {
        let fullyAssessedSTIGsCount = 0;
        let totalSTIGsCount = 0;
        let aggregatedMetrics = {
          assessments: 0,
          assessed: 0,
          assets: 0,
          findings: { high: 0, medium: 0, low: 0 },
          assessedBySeverity: { high: 0, medium: 0, low: 0 },
          assessmentsBySeverity: { high: 0, medium: 0, low: 0 },
          statuses: { submitted: 0, accepted: 0, rejected: 0, saved: 0 }
        };

        const stigAssessmentData: any[] = [];
        const initialStigSummary = Array.isArray(stigSummary) ? stigSummary : stigSummary ? [stigSummary] : [];

        const kiorVulnIds = new Set<string>();
        const approvedVulnIds = new Set<string>();
        const kiorLabelNames = new Set(['cora stig kior', 'cora stig kiors', 'stig kior', 'stig kiors', 'cora kior', 'cora kiors']);

        poams.forEach((poam: any) => {
          const hasKiorLabel = poam.labels?.some((label: any) => kiorLabelNames.has(label.labelName?.toLowerCase()));
          const isApproved = poam.status === 'Approved';

          if (hasKiorLabel || isApproved) {
            if (poam.vulnerabilityId) {
              if (hasKiorLabel) kiorVulnIds.add(poam.vulnerabilityId);
              if (isApproved) approvedVulnIds.add(poam.vulnerabilityId);
            }
            poam.associatedVulnerabilities?.forEach((id: string) => {
              if (hasKiorLabel) kiorVulnIds.add(id);
              if (isApproved) approvedVulnIds.add(id);
            });
          }
        });

        const findingsByBenchmark = new Map<string, any[]>();
        const findingsBySeverity = { high: [] as any[], medium: [] as any[], low: [] as any[] };

        findings.forEach((f: any) => {
          if (f.severity === 'high') findingsBySeverity.high.push(f);
          else if (f.severity === 'medium') findingsBySeverity.medium.push(f);
          else if (f.severity === 'low') findingsBySeverity.low.push(f);

          f.stigs?.forEach((s: any) => {
            if (!findingsByBenchmark.has(s.benchmarkId)) {
              findingsByBenchmark.set(s.benchmarkId, []);
            }
            findingsByBenchmark.get(s.benchmarkId)!.push(f);
          });
        });

        if (initialStigSummary.length > 0) {
          totalSTIGsCount = initialStigSummary.length;

          initialStigSummary.forEach((stig: any) => {
            const metrics = stig.metrics || {};
            const assessments = metrics.assessments || 0;
            const assessed = metrics.assessed || 0;

            if (assessments > 0 && assessed === assessments) {
              fullyAssessedSTIGsCount++;
            }

            aggregatedMetrics.assessments += assessments;
            aggregatedMetrics.assessed += assessed;
            aggregatedMetrics.assets = Math.max(aggregatedMetrics.assets, stig.assets || 0);

            aggregatedMetrics.findings.high += metrics.findings?.high || 0;
            aggregatedMetrics.findings.medium += metrics.findings?.medium || 0;
            aggregatedMetrics.findings.low += metrics.findings?.low || 0;

            aggregatedMetrics.assessedBySeverity.high += metrics.assessedBySeverity?.high || 0;
            aggregatedMetrics.assessedBySeverity.medium += metrics.assessedBySeverity?.medium || 0;
            aggregatedMetrics.assessedBySeverity.low += metrics.assessedBySeverity?.low || 0;

            aggregatedMetrics.assessmentsBySeverity.high += metrics.assessmentsBySeverity?.high || 0;
            aggregatedMetrics.assessmentsBySeverity.medium += metrics.assessmentsBySeverity?.medium || 0;
            aggregatedMetrics.assessmentsBySeverity.low += metrics.assessmentsBySeverity?.low || 0;

            aggregatedMetrics.statuses.submitted += metrics.statuses?.submitted || 0;
            aggregatedMetrics.statuses.accepted += metrics.statuses?.accepted || 0;
            aggregatedMetrics.statuses.rejected += metrics.statuses?.rejected || 0;
            aggregatedMetrics.statuses.saved += metrics.statuses?.saved || 0;

            const findingsData = metrics.findings || { high: 0, medium: 0, low: 0 };
            const totalFindings = findingsData.high + findingsData.medium + findingsData.low;

            const highPct = totalFindings > 0 ? (findingsData.high / totalFindings) * 100 : 0;
            const mediumPct = totalFindings > 0 ? (findingsData.medium / totalFindings) * 100 : 0;
            const lowPct = totalFindings > 0 ? (findingsData.low / totalFindings) * 100 : 0;

            const stigFindings = findingsByBenchmark.get(stig.benchmarkId) || [];
            const kiorCount = stigFindings.filter((f: any) => kiorVulnIds.has(f.groupId)).length;

            stigAssessmentData.push({
              title: stig.title,
              benchmarkId: stig.benchmarkId,
              assets: stig.assets || 0,
              totalFindings,
              highPercentage: highPct,
              mediumPercentage: mediumPct,
              lowPercentage: lowPct,
              findings: findingsData,
              assessed: Math.round((stig.metrics.assessed / stig.metrics.assessments) * 100),
              kiorCount
            });
          });
        }

        this.stigsAssessmentData.set(stigAssessmentData);

        const totalAssessments = aggregatedMetrics.assessments;
        const assessed = aggregatedMetrics.assessed;
        const submitted = aggregatedMetrics.statuses.submitted;
        const accepted = aggregatedMetrics.statuses.accepted;
        const rejected = aggregatedMetrics.statuses.rejected;

        const assessedPercentage = totalAssessments > 0 ? (assessed / totalAssessments) * 100 : 0;

        const rawFindings = aggregatedMetrics.findings;
        const assessedBySeverity = aggregatedMetrics.assessedBySeverity;
        const assessmentsBySeverity = aggregatedMetrics.assessmentsBySeverity;

        const catIOpenRawCount = rawFindings.high || 0;
        const catIIOpenRawCount = rawFindings.medium || 0;
        const catIIIOpenRawCount = rawFindings.low || 0;

        const catIOpenCount = findingsBySeverity.high.length;
        const catIIOpenCount = findingsBySeverity.medium.length;
        const catIIIOpenCount = findingsBySeverity.low.length;

        const catICompliance = this.calculateSTIGComplianceFromFindings(findingsBySeverity.high, approvedVulnIds);
        const catIICompliance = this.calculateSTIGComplianceFromFindings(findingsBySeverity.medium, approvedVulnIds);
        const catIIICompliance = this.calculateSTIGComplianceFromFindings(findingsBySeverity.low, approvedVulnIds);
        const coraData = this.calculateCORAScore(assessmentsBySeverity, assessedBySeverity, rawFindings);

        const metrics = {
          assetCount: aggregatedMetrics.assets,
          catICompliance,
          catIICompliance,
          catIIICompliance,
          catIOpenCount,
          catIIOpenCount,
          catIIIOpenCount,
          catIOpenRawCount,
          catIIOpenRawCount,
          catIIIOpenRawCount,
          coraRiskScore: coraData.score,
          coraRiskRating: coraData.rating,
          totalAssessments,
          assessedCount: assessed,
          submittedCount: submitted,
          acceptedCount: accepted,
          rejectedCount: rejected,
          assessedPercentage,
          fullyAssessedSTIGsCount,
          totalSTIGsCount
        };

        setTimeout(() => {
          this.prepareChartsData();
          this.prepareAssessmentChartData();
        }, 0);

        return metrics;
      }),
      catchError(() => {
        this.stigsAssessmentData.set([]);

        return of(this.getEmptySTIGManagerMetrics());
      })
    );
  }

  private calculateSTIGComplianceFromFindings(findings: any[], approvedVulnIds: Set<string>): number {
    if (findings.length === 0) return 100;
    const findingsWithApprovedPoams = findings.filter((finding) => approvedVulnIds.has(finding.groupId)).length;

    return (findingsWithApprovedPoams / findings.length) * 100;
  }

  private calculateCORAScore(assessmentsBySeverity: any, assessedBySeverity: any, findings: any): { score: number; rating: string } {
    const catITotal = assessmentsBySeverity.high || 0;
    const catIITotal = assessmentsBySeverity.medium || 0;
    const catIIITotal = assessmentsBySeverity.low || 0;

    const catIAssessed = assessedBySeverity.high || 0;
    const catIIAssessed = assessedBySeverity.medium || 0;
    const catIIIAssessed = assessedBySeverity.low || 0;

    const catIOpen = findings.high || 0;
    const catIIOpen = findings.medium || 0;
    const catIIIOpen = findings.low || 0;

    const catIUnassessed = catITotal - catIAssessed;
    const catIIUnassessed = catIITotal - catIIAssessed;
    const catIIIUnassessed = catIIITotal - catIIIAssessed;

    const catIPercentage = catITotal > 0 ? ((catIOpen + catIUnassessed) / catITotal) * 100 : 0;
    const catIIPercentage = catIITotal > 0 ? ((catIIOpen + catIIUnassessed) / catIITotal) * 100 : 0;
    const catIIIPercentage = catIIITotal > 0 ? ((catIIIOpen + catIIIUnassessed) / catIIITotal) * 100 : 0;

    const weightedSum = catIPercentage * 10 + catIIPercentage * 4 + catIIIPercentage * 1;
    const totalWeight = 10 + 4 + 1;
    const weightedAverage = weightedSum / totalWeight;

    let rating: string;

    if (weightedAverage === 0) {
      rating = 'Very Low';
    } else if (catIPercentage === 0 && catIIPercentage < 5 && catIIIPercentage < 5) {
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

  private getSTIGManagerMetricsDisplay(loading: boolean): MetricData[] {
    const m = this.stigManagerMetrics();

    return [
      {
        label: 'CAT I - Open (Unique)',
        tooltip: 'Count of CAT I findings across all assets (deduplicated by vulnerability ID)',
        origin: 'STIG Manager',
        value: loading ? '-' : m.catIOpenCount,
        severity: 'high',
        isLoading: loading
      },
      {
        label: 'CAT II - Open (Unique)',
        tooltip: 'Count of CAT II findings across all assets (deduplicated by vulnerability ID)',
        origin: 'STIG Manager',
        value: loading ? '-' : m.catIIOpenCount,
        severity: 'medium',
        isLoading: loading
      },
      {
        label: 'CAT III - Open (Unique)',
        tooltip: 'Count of CAT III findings across all assets (deduplicated by vulnerability ID)',
        origin: 'STIG Manager',
        value: loading ? '-' : m.catIIIOpenCount,
        severity: 'low',
        isLoading: loading
      },
      {
        label: '100% STIG Technologies Assessed',
        tooltip: `Percentage calculation: Count of 100% assessed STIGs ÷ Total STIGs × 100`,
        origin: 'STIG Manager',
        value: loading ? '-' : `${((m.fullyAssessedSTIGsCount / m.totalSTIGsCount) * 100).toFixed(1)}% (${m.fullyAssessedSTIGsCount})`,
        severity: loading
          ? 'low'
          : (() => {
              const percentage = (m.fullyAssessedSTIGsCount / m.totalSTIGsCount) * 100;
              if (percentage <= 25) return 'high';
              if (percentage <= 75) return 'medium';
              return 'low';
            })(),
        isLoading: loading
      },
      {
        label: 'Assets',
        tooltip: `Total number of assets in ${this.collectionName()}`,
        origin: 'STIG Manager',
        value: loading ? '-' : m.assetCount,
        isLoading: loading
      },
      {
        label: `${this.collectionName()} - Assessed`,
        tooltip: `Assessed items ÷ Total assessment items × 100`,
        origin: 'STIG Manager',
        value: loading ? '-' : `${m.assessedPercentage.toFixed(1)}%`,
        isPercentage: true,
        isLoading: loading
      },
      {
        label: 'Total Checks',
        tooltip: `Total checks within ${this.collectionName()}`,
        origin: 'STIG Manager',
        value: loading ? '-' : `${m.totalAssessments}`,
        isLoading: loading
      },
      {
        label: 'Total STIGs',
        tooltip: `Total count of STIG technologies within ${this.collectionName()}`,
        origin: 'STIG Manager',
        value: loading ? '-' : `${m.totalSTIGsCount}`,
        isLoading: loading
      }
    ];
  }

  private getEmptySTIGManagerMetrics(): STIGManagerMetrics {
    return {
      assetCount: 0,
      catICompliance: 0,
      catIICompliance: 0,
      catIIICompliance: 0,
      catIOpenCount: 0,
      catIIOpenCount: 0,
      catIIIOpenCount: 0,
      catIOpenRawCount: 0,
      catIIOpenRawCount: 0,
      catIIIOpenRawCount: 0,
      coraRiskScore: 0,
      coraRiskRating: 'Very Low',
      totalAssessments: 0,
      assessedCount: 0,
      submittedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      assessedPercentage: 0,
      fullyAssessedSTIGsCount: 0,
      totalSTIGsCount: 0
    };
  }

  getCoraRiskColor(riskScore: number): string {
    if (riskScore >= 90) {
      return 'rgba(240, 90, 106, 0.8)';
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

  setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');

    return {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || context.label || '';
              const value = context.raw;
              const total = context.dataset.data.reduce((sum, val) => sum + (val as number), 0);
              const percentage = total > 0 ? (((value as number) / total) * 100).toFixed(1) : 0;

              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            }
          },
          grid: {
            display: false,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            display: false,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        }
      }
    };
  }

  exportMetrics() {
    const metrics = this.stigManagerMetrics();
    const unassessedCount = metrics.totalAssessments - metrics.assessedCount;
    const assessedOnly = metrics.assessedCount - metrics.submittedCount - metrics.acceptedCount - metrics.rejectedCount;
    const collectionName = this.collectionName();
    const exportedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rows = [];
    const stigsAssessedPercentage = metrics.totalSTIGsCount > 0 ? ((metrics.fullyAssessedSTIGsCount / metrics.totalSTIGsCount) * 100).toFixed(1) : '0.0';

    rows.push(
      [`[STIG Manager] ${collectionName} C-PAT Metrics - ${new Date().toLocaleString()}`],
      ['Collection Name', 'CATEGORY', 'METRIC', 'VALUE'],
      [`[STIG Manager] ${collectionName}`, 'POAM', 'CAT I Compliance %', `${metrics.catICompliance.toFixed(1)}%`],
      [`[STIG Manager] ${collectionName}`, 'POAM', 'CAT II Compliance %', `${metrics.catIICompliance.toFixed(1)}%`],
      [`[STIG Manager] ${collectionName}`, 'POAM', 'CAT III Compliance %', `${metrics.catIIICompliance.toFixed(1)}%`],
      [`[STIG Manager] ${collectionName}`, 'STIGs', 'CAT I - Opens (Unique)', metrics.catIOpenCount.toString()],
      [`[STIG Manager] ${collectionName}`, 'STIGs', 'CAT II - Opens (Unique)', metrics.catIIOpenCount.toString()],
      [`[STIG Manager] ${collectionName}`, 'STIGs', 'CAT III - Opens (Unique)', metrics.catIIIOpenCount.toString()],
      [`[STIG Manager] ${collectionName}`, 'STIGs', 'CORA Risk Score %', `${metrics.coraRiskScore.toFixed(1)}%`],
      [`[STIG Manager] ${collectionName}`, 'STIGs', 'STIGs 100% Assessed (%)', `${stigsAssessedPercentage}%`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Total Checks', `${metrics.totalAssessments}`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Accepted', `${metrics.acceptedCount}`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Submitted', `${metrics.submittedCount}`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Rejected', `${metrics.rejectedCount}`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Assessed', `${assessedOnly}`],
      [`[STIG Manager] ${collectionName}`, 'Assessment Status', 'Unassessed', `${unassessedCount}`]
    );

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
