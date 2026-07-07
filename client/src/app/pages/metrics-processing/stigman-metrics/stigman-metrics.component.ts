/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, signal, inject, OnChanges, input, output } from '@angular/core';
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
import { CpatChartComponent } from '../../../common/components/chart/chart.component';
import { DividerModule } from 'primeng/divider';
import { TourPrimeNg } from 'ngx-ui-tour-primeng';
import { MetricData } from '../../../common/models/metrics.model';
import { MetricsExportService } from '../metrics-export.service';
import { STIGManagerMetrics, computeStigManagerMetrics, getEmptySTIGManagerMetrics } from './stigman-metrics.compute';

@Component({
  selector: 'cpat-stigman-metrics',
  templateUrl: './stigman-metrics.component.html',
  styleUrls: ['./stigman-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, ProgressBarModule, ProgressSpinnerModule, TooltipModule, CpatChartComponent, DividerModule, TourPrimeNg, DatePipe]
})
export class STIGManagerMetricsComponent implements OnInit, OnChanges {
  private readonly sharedService = inject(SharedService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);
  private readonly metricsExportService = inject(MetricsExportService);

  readonly collection = input<any>(undefined);
  readonly componentInit = output<STIGManagerMetricsComponent>();

  isLoading = signal<boolean>(true);
  isGlobalExporting = signal<boolean>(false);
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
    const collection = this.collection();

    if (collection) {
      this.collectionName.set(collection.collectionName || '');
      this.originCollectionId.set(collection.originCollectionId?.toString() || '');
      this.loadMetrics();
    }
  }

  private loadMetrics() {
    if (!this.collection()) return;

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
          backgroundColor: ['rgba(235, 70, 100, 0.8)', 'rgba(250, 165, 50, 0.8)', 'rgba(230, 185, 45, 0.8)'],
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
          backgroundColor: ['rgba(15, 185, 130, 0.8)', 'rgba(230, 185, 45, 0.8)', 'rgba(235, 70, 100, 0.8)', 'rgba(250, 165, 50, 0.8)', 'rgba(170, 170, 170, 0.8)'],
          borderColor: ['rgba(15, 185, 130, 0.8)', 'rgba(230, 185, 45, 0.8)', 'rgba(235, 70, 100, 0.8)', 'rgba(250, 165, 50, 0.8)', 'rgba(170, 170, 170, 0.8)'],
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
    const collectionId = this.collection()?.collectionId;
    const originCollectionId = this.originCollectionId();

    if (!originCollectionId || !collectionId) {
      return of(getEmptySTIGManagerMetrics());
    }

    return combineLatest([
      this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(+originCollectionId),
      this.sharedService.getFindingsMetricsFromSTIGMAN(+originCollectionId),
      this.sharedService.getCollectionMetricsSummaryFromSTIGMAN(+originCollectionId),
      this.collectionsService.getPoamsByCollection(collectionId)
    ]).pipe(
      map(([stigSummary, findings, collectionMetrics, poams]: [any, any[], any, any[]]) => {
        const { metrics, stigAssessmentData } = computeStigManagerMetrics(stigSummary, findings, collectionMetrics, poams);

        this.stigsAssessmentData.set(stigAssessmentData);

        setTimeout(() => {
          this.prepareChartsData();
          this.prepareAssessmentChartData();
        }, 0);

        return metrics;
      }),
      catchError(() => {
        this.stigsAssessmentData.set([]);

        return of(getEmptySTIGManagerMetrics());
      })
    );
  }

  private getSTIGManagerMetricsDisplay(loading: boolean): MetricData[] {
    const m = this.stigManagerMetrics();

    return [
      {
        label: 'CAT I - Open (Unique)',
        tooltip: 'Count of CAT I findings across all assets (deduplicated by vulnerability ID)',
        type: 'STIG Manager',
        value: loading ? '-' : m.catIOpenCount,
        severity: 'high',
        isLoading: loading
      },
      {
        label: 'CAT II - Open (Unique)',
        tooltip: 'Count of CAT II findings across all assets (deduplicated by vulnerability ID)',
        type: 'STIG Manager',
        value: loading ? '-' : m.catIIOpenCount,
        severity: 'medium',
        isLoading: loading
      },
      {
        label: 'CAT III - Open (Unique)',
        tooltip: 'Count of CAT III findings across all assets (deduplicated by vulnerability ID)',
        type: 'STIG Manager',
        value: loading ? '-' : m.catIIIOpenCount,
        severity: 'low',
        isLoading: loading
      },
      {
        label: '100% STIG Technologies Assessed',
        tooltip: `Percentage calculation: Count of 100% assessed STIGs ÷ Total STIGs × 100`,
        type: 'STIG Manager',
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
        type: 'STIG Manager',
        value: loading ? '-' : m.assetCount,
        isLoading: loading
      },
      {
        label: `${this.collectionName()} - Assessed`,
        tooltip: `Assessed items ÷ Total assessment items × 100`,
        type: 'STIG Manager',
        value: loading ? '-' : `${m.assessedPercentage.toFixed(1)}%`,
        isPercentage: true,
        isLoading: loading
      },
      {
        label: 'Total Checks',
        tooltip: `Total checks within ${this.collectionName()}`,
        type: 'STIG Manager',
        value: loading ? '-' : `${m.totalAssessments}`,
        isLoading: loading
      },
      {
        label: 'Total STIGs',
        tooltip: `Total count of STIG technologies within ${this.collectionName()}`,
        type: 'STIG Manager',
        value: loading ? '-' : `${m.totalSTIGsCount}`,
        isLoading: loading
      }
    ];
  }

  getCoraRiskColor(riskScore: number): string {
    const m = this.stigManagerMetrics();

    if (riskScore === 0) {
      return 'rgba(15, 185, 130, 0.8)';
    }

    if (m.coraRiskRating === 'Low') {
      return 'rgba(230, 190, 45, 0.85)';
    }

    if (riskScore >= 20) {
      return 'rgba(235, 70, 100, 0.8)';
    }

    if (riskScore >= 10) {
      return 'rgba(245, 125, 70, 0.8)';
    }

    return 'rgba(250, 165, 50, 0.8)';
  }

  setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--p-surface-400');

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
    link.remove();
  }

  refreshMetrics() {
    this.loadMetrics();
    this.now = new Date();
  }

  exportGlobalMetrics() {
    if (this.isGlobalExporting()) return;

    this.isGlobalExporting.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Exporting',
      detail: 'Compiling metrics for all collections. This may take a moment...'
    });

    this.metricsExportService.exportGlobalMetrics().subscribe({
      next: () => {
        this.isGlobalExporting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Export Complete',
          detail: 'Global metrics export downloaded successfully.'
        });
      },
      error: (error) => {
        this.isGlobalExporting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Export Failed',
          detail: `Error exporting global metrics: ${getErrorMessage(error)}`
        });
      }
    });
  }
}
