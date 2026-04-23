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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, map, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { MetricsService, MTTRData } from './metrics.service';
import { STIGManagerMetricsComponent } from './stigman-metrics/stigman-metrics.component';
import { TenableMetricsComponent } from './tenable-metrics/tenable-metrics.component';

const SEVERITY_COLORS: Record<string, string> = {
  'CAT I - Critical/High': 'rgba(235, 70, 100, 0.85)',
  'CAT II - Medium': 'rgba(250, 165, 50, 0.8)',
  'CAT III - Low': 'rgba(230, 185, 45, 0.8)',
  'CAT III - Informational': 'rgba(100, 180, 100, 0.7)',
  default: 'rgba(150, 150, 150, 0.7)'
};

@Component({
  selector: 'cpat-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, ChartModule, DividerModule, ProgressSpinnerModule, ToastModule, TooltipModule, STIGManagerMetricsComponent, TenableMetricsComponent],
  providers: [MessageService]
})
export class MetricsComponent implements OnInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private trendService = inject(MetricsService);
  private cdr = inject(ChangeDetectorRef);

  private subscriptions = new Subscription();

  selectedCollection = signal<any>(null);
  selectedCollectionId = signal<any>(null);
  collectionOrigin = signal<string>('C-PAT');
  isLoading = signal<boolean>(false);
  isMttrLoading = signal<boolean>(false);
  mttrSummaryChartData = signal<any>(null);
  mttrTrendChartData = signal<any>(null);
  avgMttrDays = signal<number | null>(null);

  readonly horizontalBarChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } }
    }
  };

  readonly lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { color: 'rgba(255,255,255,0.7)', boxWidth: 14, padding: 12 } } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } }
    }
  };

  stigManagerMetrics?: STIGManagerMetricsComponent;
  tenableMetrics?: TenableMetricsComponent;

  ngOnInit() {
    this.initializeComponent();
  }

  private initializeComponent() {
    this.subscriptions.add(
      this.sharedService.selectedCollection
        .pipe(
          tap((collectionId) => this.selectedCollectionId.set(collectionId)),
          switchMap((collectionId) => this.collectionsService.getCollectionBasicList().pipe(map((collections) => collections.find((c: any) => c.collectionId === collectionId)))),
          tap((collection) => {
            this.selectedCollection.set(collection);

            if (collection?.collectionOrigin) {
              this.collectionOrigin.set(collection.collectionOrigin);
            }

            if (collection?.collectionId) {
              this.loadMTTRData(collection.collectionId);
            }
          })
        )
        .subscribe()
    );
  }

  private loadMTTRData(collectionId: number) {
    this.isMttrLoading.set(true);

    const sub = this.trendService
      .getPoamMTTR(collectionId, 12)
      .pipe(catchError(() => of<MTTRData>({ summary: [], trend: [] })))
      .subscribe((mttr) => {
        this.buildMTTRCharts(mttr);
        this.isMttrLoading.set(false);
        this.cdr.markForCheck();
      });

    this.subscriptions.add(sub);
  }

  private buildMTTRCharts(data: MTTRData) {
    const now = new Date();
    const labels: string[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

      labels.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }

    const summaryMap: Record<string, { weightedDays: number; count: number }> = {};

    data.summary.forEach((r) => {
      const key = this.normalizeSeverity(r.rawSeverity);

      if (!summaryMap[key]) summaryMap[key] = { weightedDays: 0, count: 0 };
      summaryMap[key].weightedDays += r.avgDays * r.count;
      summaryMap[key].count += r.count;
    });

    const severities = Object.keys(summaryMap).sort();
    const cardBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim();

    this.mttrSummaryChartData.set(
      severities.length
        ? {
            labels: severities,
            datasets: [
              {
                label: 'Avg Days to Close',
                data: severities.map((s) => (summaryMap[s].count ? Math.round(summaryMap[s].weightedDays / summaryMap[s].count) : 0)),
                backgroundColor: severities.map((s) => SEVERITY_COLORS[s] ?? SEVERITY_COLORS['default']),
                opacity: 0.8,
                hoverBorderColor: cardBackgroundColor,
                borderWidth: 8,
                borderRadius: 15,
                borderColor: cardBackgroundColor
              }
            ]
          }
        : null
    );

    const trendMap: Record<string, { weightedDays: number; count: number }> = {};

    data.trend.forEach((row) => {
      const [year, month] = row.period.split('-').map(Number);
      const periodLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const key = `${this.normalizeSeverity(row.rawSeverity)}::${periodLabel}`;

      if (!trendMap[key]) trendMap[key] = { weightedDays: 0, count: 0 };
      trendMap[key].weightedDays += row.avgDays * row.count;
      trendMap[key].count += row.count;
    });

    const trendSeverities = [...new Set(data.trend.map((r) => this.normalizeSeverity(r.rawSeverity)))].sort();

    this.mttrTrendChartData.set(
      trendSeverities.length
        ? {
            labels,
            datasets: trendSeverities.map((sev) => ({
              label: sev,
              data: labels.map((l) => {
                const entry = trendMap[`${sev}::${l}`];

                return entry?.count ? Math.round(entry.weightedDays / entry.count) : null;
              }),
              borderColor: SEVERITY_COLORS[sev] ?? SEVERITY_COLORS['default'],
              backgroundColor: SEVERITY_COLORS[sev] ?? SEVERITY_COLORS['default'],
              pointBackgroundColor: SEVERITY_COLORS[sev] ?? SEVERITY_COLORS['default'],
              tension: 0.3,
              spanGaps: true
            }))
          }
        : null
    );

    if (data.summary.length) {
      const total = data.summary.reduce((sum, r) => sum + r.avgDays * r.count, 0);
      const count = data.summary.reduce((sum, r) => sum + r.count, 0);

      this.avgMttrDays.set(count ? Math.round(total / count) : null);
    } else {
      this.avgMttrDays.set(null);
    }
  }

  private normalizeSeverity(severity: string): string {
    return severity === 'CAT I - Critical' || severity === 'CAT I - High' ? 'CAT I - Critical/High' : severity;
  }

  refreshMetrics() {
    const origin = this.collectionOrigin();

    if (origin === 'STIG Manager' && this.stigManagerMetrics) {
      this.stigManagerMetrics.refreshMetrics();
    } else if (this.tenableMetrics) {
      this.tenableMetrics.refreshMetrics();
    }

    const collectionId = this.selectedCollection()?.collectionId;

    if (collectionId) {
      this.loadMTTRData(collectionId);
    }
  }

  onSTIGManagerMetricsInit(component: STIGManagerMetricsComponent) {
    this.stigManagerMetrics = component;
  }

  onTenableMetricsInit(component: TenableMetricsComponent) {
    this.tenableMetrics = component;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
