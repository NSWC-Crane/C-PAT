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
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CpatChartComponent } from '../../../common/components/chart/chart.component';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, catchError, map, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { MetricData } from '../../../common/models/metrics.model';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { GlobalMetricsResult, GlobalMetricsService } from './global-metrics.service';

const RING_OUTER_RADIUS = 62;
const RING_INNER_RADIUS = 40;

const SEVERITY_COLORS: Record<string, string> = {
  'CAT I - Critical/High': 'rgba(235, 70, 100, 0.85)',
  'CAT II - Medium': 'rgba(250, 165, 50, 0.8)',
  'CAT III - Low': 'rgba(230, 185, 45, 0.8)',
  'CAT III - Informational': 'rgba(100, 180, 100, 0.7)',
  default: 'rgba(150, 150, 150, 0.7)'
};

const SOURCE_ORDER = ['STIG Manager', 'Tenable'];

interface ComplianceRing {
  numeral: string;
  catLabel: string;
  stig: number | null;
  tenable: number | null;
  tooltip: string;
}

interface FindingCard {
  label: string;
  severity: 'high' | 'medium' | 'low';
  stig: number | null;
  tenable: number | null;
  total: number;
  stigPct: number;
  tenablePct: number;
}

@Component({
  selector: 'cpat-global-metrics',
  templateUrl: './global-metrics.component.html',
  styleUrls: ['./global-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, CardModule, CpatChartComponent, SelectModule, ProgressBarModule, TagModule, ToastModule, TooltipModule, DatePipe],
  providers: [MessageService]
})
export class GlobalMetricsComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly globalMetricsService = inject(GlobalMetricsService);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly load$ = new Subject<CollectionsBasicList[]>();

  collections = signal<CollectionsBasicList[]>([]);
  selectedCollections = signal<CollectionsBasicList[]>([]);
  isLoading = signal<boolean>(false);
  progress = signal<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  result = signal<GlobalMetricsResult | null>(null);
  now = new Date();

  readonly outerRadius = RING_OUTER_RADIUS;
  readonly innerRadius = RING_INNER_RADIUS;
  readonly outerCircumference = 2 * Math.PI * RING_OUTER_RADIUS;
  readonly innerCircumference = 2 * Math.PI * RING_INNER_RADIUS;

  readonly mttrBarChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } }
    }
  };

  readonly mttrLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255,255,255,0.7)',
          boxWidth: 14,
          padding: 12,
          generateLabels: (chart: any) =>
            chart.data.datasets.map((dataset: any, index: number) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              fontColor: 'rgba(255,255,255,0.7)',
              lineWidth: 0,
              lineDash: [],
              hidden: !chart.isDatasetVisible(index),
              datasetIndex: index
            }))
        }
      }
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } }
    }
  };

  hasSelection = computed<boolean>(() => this.selectedCollections().length > 0);

  allCollectionsFailed = computed<boolean>(() => {
    const result = this.result();

    return !!result && result.loadedCount === 0 && result.failedCollections.length > 0;
  });

  progressPercent = computed<number>(() => {
    const { loaded, total } = this.progress();

    return total > 0 ? Math.round((loaded / total) * 100) : 0;
  });

  complianceRings = computed<ComplianceRing[]>(() => {
    const result = this.result();
    const stig = result?.stig ?? null;
    const tenable = result?.tenable ?? null;

    if (!stig && !tenable) return [];

    const build = (numeral: string, catKey: 'catI' | 'catII' | 'catIII'): ComplianceRing => {
      const stigPct = stig ? stig.compliance[catKey] : null;
      const tenablePct = tenable ? tenable.compliance[catKey] : null;
      const parts: string[] = [];

      if (stigPct !== null) parts.push(`STIG Manager ${stigPct.toFixed(0)}%`);
      if (tenablePct !== null) parts.push(`Tenable ${tenablePct.toFixed(0)}%`);

      return {
        numeral,
        catLabel: `CAT ${numeral}`,
        stig: stigPct,
        tenable: tenablePct,
        tooltip: `CAT ${numeral} POAM Compliance — ${parts.join(' · ')}`
      };
    };

    return [build('I', 'catI'), build('II', 'catII'), build('III', 'catIII')];
  });

  findingCards = computed<FindingCard[]>(() => {
    const result = this.result();
    const stig = result?.stig ?? null;
    const tenable = result?.tenable ?? null;

    if (!stig && !tenable) return [];

    const build = (label: string, severity: 'high' | 'medium' | 'low', catKey: 'catI' | 'catII' | 'catIII'): FindingCard => {
      const stigCount = stig ? stig.openFindings[catKey] : null;
      const tenableCount = tenable ? tenable.openFindings[catKey] : null;
      const total = (stigCount ?? 0) + (tenableCount ?? 0);

      return {
        label,
        severity,
        stig: stigCount,
        tenable: tenableCount,
        total,
        stigPct: total > 0 ? ((stigCount ?? 0) / total) * 100 : 0,
        tenablePct: total > 0 ? ((tenableCount ?? 0) / total) * 100 : 0
      };
    };

    return [build('Open CAT I', 'high', 'catI'), build('Open CAT II', 'medium', 'catII'), build('Open CAT III', 'low', 'catIII')];
  });

  stigDetailCards = computed<MetricData[]>(() => {
    const stig = this.result()?.stig;

    if (!stig) return [];

    const techPct = stig.techAssessed.total === 0 ? 0 : (stig.techAssessed.fully / stig.techAssessed.total) * 100;
    const techSeverity: 'high' | 'medium' | 'low' = techPct <= 25 ? 'high' : techPct <= 75 ? 'medium' : 'low';

    return [
      {
        label: '100% STIG Technologies Assessed',
        tooltip: 'Share of STIG technologies fully assessed across the selected STIG Manager collections (Σ fully assessed ÷ Σ total STIGs)',
        type: 'STIG Manager',
        value: `${techPct.toFixed(1)}% (${stig.techAssessed.fully})`,
        severity: techSeverity
      },
      { label: 'Assessed %', tooltip: 'Weighted assessed percentage across the selected STIG Manager collections (Σ assessed ÷ Σ total checks)', type: 'STIG Manager', value: `${stig.assessedPercentage.toFixed(1)}%`, severity: 'info' },
      { label: 'Total Checks', tooltip: 'Total assessment items (checks) across the selected STIG Manager collections', type: 'STIG Manager', value: stig.totalChecks, severity: 'info' },
      { label: 'Total STIGs', tooltip: 'Total count of STIG technologies across the selected STIG Manager collections', type: 'STIG Manager', value: stig.totalStigs, severity: 'info' },
      { label: 'STIG Manager Total Assets', tooltip: 'Total assets across the selected STIG Manager collections', type: 'STIG Manager', value: stig.assetCount, severity: 'info' }
    ];
  });

  tenableDetailCards = computed<MetricData[]>(() => {
    const tenable = this.result()?.tenable;

    if (!tenable) return [];

    return [
      {
        label: 'Exploitable Findings (7+ Days)',
        tooltip: 'Vulnerabilities with a known exploit, published 7+ days ago (last observed within 30 days), summed across the selected Tenable collections',
        type: 'Tenable',
        value: tenable.exploitableFindings,
        severity: 'high'
      },
      { label: 'Past Due IAVs', tooltip: 'IAVs past their Navy compliance date (excludes Informational and superseded), summed across the selected Tenable collections', type: 'Tenable', value: tenable.pastDueIAVs, severity: 'high' },
      {
        label: 'Security End of Life Vulnerabilities',
        tooltip: 'Unique SEoL findings (SEoL date 30+ days ago, last observed within 30 days), summed across the selected Tenable collections',
        type: 'Tenable',
        value: tenable.seolVulnerabilities,
        severity: 'high'
      },
      {
        label: 'Credential Scan Coverage',
        tooltip: 'Weighted credentialed scan coverage across the selected Tenable collections (Σ credentialed ÷ Σ total vulnerabilities)',
        type: 'Tenable',
        value: `${tenable.credentialScanCoverage.toFixed(1)}%`,
        severity: 'medium'
      },
      { label: 'Tenable Valid Assets (30-day)', tooltip: 'Valid online assets (seen in the last 30 days) across the selected Tenable collections — the VPH denominator', type: 'Tenable', value: tenable.validAssets, severity: 'info' }
    ];
  });

  mttrSummaryChartData = computed(() => {
    const mttr = this.result()?.mttr;

    if (!mttr || mttr.summary.length === 0) return null;

    const items = [...mttr.summary].sort((a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) || a.severity.localeCompare(b.severity));

    return {
      labels: items.map((item) => `${this.sourceLabel(item.source)} · ${item.severity}`),
      datasets: [
        {
          label: 'Avg Days to Close',
          data: items.map((item) => item.avgDays),
          backgroundColor: items.map((item) => SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS['default']),
          borderRadius: 8,
          borderWidth: 1
        }
      ]
    };
  });

  mttrTrendChartData = computed(() => {
    const mttr = this.result()?.mttr;

    if (!mttr || mttr.trend.length === 0) return null;

    const now = new Date();
    const labels: string[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      labels.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }

    const periodLabel = (period: string): string => {
      const [year, month] = period.split('-').map(Number);

      return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const seriesKeys = [...new Set(mttr.trend.map((item) => `${item.source}::${item.severity}`))].sort();
    const lookup = new Map<string, number>();

    mttr.trend.forEach((item) => lookup.set(`${item.source}::${item.severity}::${periodLabel(item.period)}`, item.avgDays));

    return {
      labels,
      datasets: seriesKeys.map((key) => {
        const [source, severity] = key.split('::');
        const color = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS['default'];

        return {
          label: `${this.sourceLabel(source)} · ${severity}`,
          data: labels.map((label) => lookup.get(`${source}::${severity}::${label}`) ?? null),
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          borderDash: source === 'Tenable' ? [6, 4] : [],
          tension: 0.3,
          spanGaps: true
        };
      })
    };
  });

  ngOnInit() {
    this.globalMetricsService.progress$.pipe(takeUntil(this.destroy$)).subscribe((progress) => this.progress.set(progress));

    this.load$
      .pipe(
        tap((selected) => {
          this.isLoading.set(true);
          this.progress.set({ loaded: 0, total: selected.length });
        }),
        switchMap((selected) =>
          this.globalMetricsService.loadGlobalMetrics(selected).pipe(
            map((result) => ({ result, error: null as string | null })),
            catchError((error) => of({ result: null as GlobalMetricsResult | null, error: getErrorMessage(error) }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(({ result, error }) => {
        this.isLoading.set(false);
        this.now = new Date();

        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error loading global metrics: ${error}` });

          return;
        }

        this.result.set(result);

        if (result && result.failedCollections.length > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Partial Load',
            detail: `Could not load metrics for: ${result.failedCollections.join(', ')}. Showing metrics for the remaining collections.`
          });
        }
      });

    this.collectionsService
      .getCollectionBasicList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (collections) => {
          const metricsCollections = (collections || []).filter((c) => !!c.originCollectionId && (c.collectionType === 'STIG Manager' || c.collectionType === 'Tenable'));

          this.collections.set(metricsCollections);
          this.initializeDefaultSelection(metricsCollections);
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error loading collections: ${getErrorMessage(error)}` });
        }
      });
  }

  private initializeDefaultSelection(collections: CollectionsBasicList[]) {
    this.sharedService.selectedCollection.pipe(take(1), takeUntil(this.destroy$)).subscribe((selectedCollectionId) => {
      const current = collections.find((c) => c.collectionId === selectedCollectionId);

      if (current) {
        this.selectedCollections.set([current]);
        this.loadMetrics();
      }
    });
  }

  onSelectionChange(selected: CollectionsBasicList[]) {
    this.selectedCollections.set(selected);
    this.loadMetrics();
  }

  private loadMetrics() {
    const selected = this.selectedCollections();

    if (selected.length === 0) {
      this.result.set(null);

      return;
    }

    this.load$.next(selected);
  }

  refreshMetrics() {
    this.loadMetrics();
  }

  getTagColor(collectionType: string | undefined): 'secondary' | 'success' | 'warn' | 'danger' | 'info' | undefined {
    switch (collectionType) {
      case 'C-PAT':
        return 'secondary';
      case 'STIG Manager':
        return 'success';
      case 'Tenable':
        return 'danger';
      default:
        return 'info';
    }
  }

  arcOffset(pct: number, circumference: number): number {
    const clamped = Math.max(0, Math.min(100, pct ?? 0));

    return circumference * (1 - clamped / 100);
  }

  private sourceLabel(source: string): string {
    return source === 'Tenable' ? 'Tenable' : source;
  }

  getCoraRiskColor(riskScore: number): string {
    const rating = this.result()?.stig?.cora.rating;

    if (riskScore === 0) {
      return 'rgba(15, 185, 130, 0.8)';
    }

    if (rating === 'Low') {
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
