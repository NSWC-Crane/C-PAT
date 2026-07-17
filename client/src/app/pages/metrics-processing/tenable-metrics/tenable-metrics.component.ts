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
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, signal, inject, OnChanges, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CpatChartComponent } from '../../../common/components/chart/chart.component';
import { DividerModule } from 'primeng/divider';
import { TourPrimeNg } from 'ngx-ui-tour-primeng';
import { EMPTY, catchError, forkJoin, tap } from 'rxjs';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { MetricData } from '../../../common/models/metrics.model';
import { TenableHighRiskAssetsTableComponent } from '../../import-processing/tenable-import/components/tenableHighRiskAssetsTable/tenableHighRiskAssetsTable.component';
import { SeveritySummary, TenableMetricsDataService } from './tenable-metrics.data.service';

type TimeRange = '7' | '30' | '90' | 'all';

interface VulnerabilityMetrics {
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
  } | null;
  '30': {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
  } | null;
  '90': {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
  } | null;
  all: {
    severitySummary30Days: SeveritySummary;
    severitySummary: SeveritySummary;
    exploitableFindings: number;
    seolVulnerabilities: number;
    complianceMetrics: { catI: number; catII: number; catIII: number };
  } | null;
}

@Component({
  selector: 'cpat-tenable-metrics',
  templateUrl: './tenable-metrics.component.html',
  styleUrls: ['./tenable-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, ButtonGroupModule, CardModule, ProgressSpinnerModule, TooltipModule, CpatChartComponent, DividerModule, TenableHighRiskAssetsTableComponent, TourPrimeNg, DatePipe]
})
export class TenableMetricsComponent implements OnInit, OnChanges {
  private readonly tenableData = inject(TenableMetricsDataService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly collection = input<any>(undefined);
  readonly componentInit = output<TenableMetricsComponent>();

  private readonly cachedVulnerabilityData = signal<CachedVulnerabilityData | null>(null);
  private readonly cachedHosts = signal<any[]>([]);
  private readonly cachedPoamMetrics = signal<number>(0);
  private readonly cachedPastDueIAVs = signal<number>(0);
  private readonly cachedCredentialScanPercentage = signal<number>(0);

  isLoading = signal<boolean>(true);
  collectionName = signal<string>('');
  originCollectionId = signal<string>('');
  findingsChartData = signal<any>(null);
  allFindingsChartData = signal<any>(null);
  findingsChartOptions = signal<any>(null);
  lastObservedTimeRange = signal<TimeRange>('30');
  loadedRanges = signal<Set<TimeRange>>(new Set());
  hostTimeRange = signal<TimeRange>('30');
  now = signal(new Date());

  totalFindings30Days = computed(() => {
    const m = this.tenableMetrics();

    return m.catIOpenCount30Days + m.catIIOpenCount30Days + m.catIIIOpenCount30Days;
  });

  totalFindings = computed(() => {
    const m = this.tenableMetrics();

    return m.catIOpenCount + m.catIIOpenCount + m.catIIIOpenCount;
  });

  tenableMetrics = signal<VulnerabilityMetrics>({
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
    const collection = this.collection();

    if (collection) {
      this.collectionName.set(collection.collectionName || '');
      this.originCollectionId.set(collection.originCollectionId?.toString() || '');
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
    const collection = this.collection();

    if (!collection) return;

    this.isLoading.set(true);
    const repoId = this.originCollectionId();
    const collectionId = collection?.collectionId;

    if (!repoId || !collectionId) {
      this.tenableMetrics.set(this.getEmptyTenableMetrics());
      this.isLoading.set(false);

      return;
    }

    forkJoin({
      vulnerabilityData30: this.tenableData.loadVulnerabilityDataForTimeRange(repoId, collectionId, '30'),
      hosts: this.tenableData.loadAllHosts(repoId),
      poamMetrics: this.tenableData.calculatePoamApprovalMetrics(collectionId, repoId),
      pastDueIAVs: this.tenableData.calculatePastDueIAVs(repoId),
      credentialScanPercentage: this.tenableData.calculateCredentialScanPercentage(repoId)
    })
      .pipe(
        tap((results) => {
          const currentCached = this.cachedVulnerabilityData() || {
            '7': null,
            '30': null,
            '90': null,
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
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadTimeRangeData(timeRange: TimeRange) {
    const loadedRanges = this.loadedRanges();

    if (loadedRanges.has(timeRange)) {
      this.lastObservedTimeRange.set(timeRange);
      this.updateMetricsFromCache();

      return;
    }

    const repoId = this.originCollectionId();
    const collectionId = this.collection()?.collectionId;

    if (!repoId || !collectionId) return;

    this.isLoading.set(true);

    this.tenableData
      .loadVulnerabilityDataForTimeRange(repoId, collectionId, timeRange)
      .pipe(
        tap((data) => {
          const currentCached = this.cachedVulnerabilityData() || {
            '7': null,
            '30': null,
            '90': null,
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
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
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

    const vphData = this.tenableData.calculateVPHScore(catICount, catIICount, catIIICount, validAssets);

    this.tenableMetrics.set({
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

  onLastObservedRangeChange(range: TimeRange) {
    this.loadTimeRangeData(range);
  }

  onHostTimeRangeChange(range: TimeRange) {
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

    const vphData = this.tenableData.calculateVPHScore(catICount, catIICount, catIIICount, validAssets);

    this.tenableMetrics.update((current) => ({
      ...current,
      vphScore: vphData.score,
      vphRating: vphData.rating,
      validOnlineAssets: validAssets
    }));
  }

  private getFilteredHostCount(timeRange: TimeRange): number {
    return this.tenableData.filterHostCount(this.cachedHosts(), timeRange);
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

  getLastObservedText(): string {
    const range = this.lastObservedTimeRange();

    if (range === 'all') return '';

    switch (range) {
      case '7':
        return 'within 7 days';
      case '30':
        return 'within 30 days';
      default:
        return 'within 90 days';
    }
  }

  private prepareChartsData() {
    const m = this.tenableMetrics();
    const cardBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim();

    this.findingsChartData.set({
      labels: ['Critical / High', 'Medium', 'Low'],
      datasets: [
        {
          data: [m.catIOpenCount30Days, m.catIIOpenCount30Days, m.catIIIOpenCount30Days],
          backgroundColor: ['rgba(235, 70, 100, 0.8)', 'rgba(250, 165, 50, 0.8)', 'rgba(230, 185, 45, 0.8)'],
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

  private getTenableMetricsDisplay(loading: boolean): MetricData[] {
    const m = this.tenableMetrics();
    const lastObservedText = this.getLastObservedText();
    const hostRangeText = this.hostTimeRange() === 'all' ? '' : ` (${this.hostTimeRange()} Days)`;

    return [
      {
        label: 'Exploitable Findings (7+ Days)',
        tooltip: `Count of vulnerabilities with known exploits available\n\nFilters: Published 7+ days ago${lastObservedText ? ', last observed ' + lastObservedText : ''}, exploit available = true`,
        type: 'Tenable',
        value: loading ? '-' : m.exploitableFindingsCount,
        category: 'exploit',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Past Due IAVs',
        tooltip: `Count of IAVs past their Navy compliance date\n\nExcludes Informational severity and superseded IAVs`,
        type: 'Tenable',
        value: loading ? '-' : m.pastDueIAVCount,
        category: 'iav',
        severity: 'critical',
        isLoading: loading
      },
      {
        label: 'Security End of Life Vulnerabilities',
        tooltip: `Filters: SEoL date 30+ days ago${lastObservedText ? ', seen ' + lastObservedText : ''}, plugin name contains 'SEoL'`,
        type: 'Tenable',
        value: loading ? '-' : m.seolVulnerabilitiesCount,
        category: 'seol',
        severity: 'high',
        isLoading: loading
      },
      {
        label: 'Vulnerabilities with Approved POAMs',
        tooltip: `Percentage calculation: Unique vulnerability IDs with approved POAMs ÷ Total vulnerabilities × 100\n\nIncludes both primary vulnerability IDs and associated vulnerabilities in POAMs`,
        type: 'Tenable',
        value: loading ? '-' : `${m.poamApprovalPercentage.toFixed(1)}%`,
        category: 'poam',
        isPercentage: true,
        isLoading: loading
      },
      {
        label: 'Credential Scan Coverage',
        tooltip: `Percentage calculation: (Total vulnerabilities - Non-credentialed scan findings) ÷ Total vulnerabilities × 100\n\nNon-credentialed plugin IDs: 117886, 10428, 21745, 24786, 26917, 102094, 104410, 110385, 110723`,
        type: 'Tenable',
        value: loading ? '-' : `${m.credentialScanPercentage.toFixed(1)}%`,
        category: 'credential',
        severity: 'medium',
        isPercentage: true,
        isLoading: loading
      },
      {
        label: `Valid Online Assets${hostRangeText}`,
        tooltip: `Total count of hosts that were last seen within ${this.hostTimeRange() === 'all' ? '∞ days' : `${this.hostTimeRange()} days`}`,
        type: 'Tenable',
        value: loading ? '-' : m.validOnlineAssets,
        category: 'hosts',
        severity: 'info',
        isLoading: loading
      }
    ];
  }

  private getEmptyTenableMetrics(): VulnerabilityMetrics {
    return {
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
    const exportedDate = new Date().toISOString().split('T')[0].replaceAll('-', '');
    const rows = [];
    const opensLabel = selectedRange === 'all' ? 'Opens (Unique)' : `Opens (Unique - ${selectedRange} Days)`;
    const timeRangeNote = selectedRange === 'all' ? '' : ` (${selectedRange} days)`;

    const catICount = data.severitySummary.critical + data.severitySummary.high;
    const catIICount = data.severitySummary.medium;
    const catIIICount = data.severitySummary.low;

    const vphData = this.tenableData.calculateVPHScore(catICount, catIICount, catIIICount, this.getFilteredHostCount(this.hostTimeRange()));
    const hostRangeLabel = this.hostTimeRange() === 'all' ? '' : ` - (Within ${this.hostTimeRange()} Days)`;

    rows.push(
      [`[Tenable] ${collectionName} C-PAT Metrics - ${new Date().toLocaleString()} - ${selectedRange === 'all' ? 'All Time' : `${selectedRange} Days`}`],
      ['Collection Name', 'CATEGORY', 'METRIC', 'VALUE'],
      [`[Tenable] ${collectionName}`, 'POAM', `CAT I Compliance %${timeRangeNote}`, `${data.complianceMetrics.catI.toFixed(1)}%`],
      [`[Tenable] ${collectionName}`, 'POAM', `CAT II Compliance %${timeRangeNote}`, `${data.complianceMetrics.catII.toFixed(1)}%`],
      [`[Tenable] ${collectionName}`, 'POAM', `CAT III Compliance %${timeRangeNote}`, `${data.complianceMetrics.catIII.toFixed(1)}%`],
      [`[Tenable] ${collectionName}`, 'ACAS', `CAT I - ${opensLabel}`, catICount.toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', `CAT II - ${opensLabel}`, catIICount.toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', `CAT III - ${opensLabel}`, catIIICount.toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', selectedRange === 'all' ? 'Exploitable Findings (Published 7+ Days)' : `Exploitable Findings (Published 7+ Days & Last Observed Within ${selectedRange} Days)`, data.exploitableFindings.toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', 'Past Due IAVs', this.cachedPastDueIAVs().toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', selectedRange === 'all' ? 'Security End of Life (Unique)' : `Security End of Life (Unique - Last Observed Within ${selectedRange} Days)`, data.seolVulnerabilities.toString()],
      [`[Tenable] ${collectionName}`, 'ACAS', 'Credentialed Scan %', `${this.cachedCredentialScanPercentage().toFixed(1)}%`],
      [`[Tenable] ${collectionName}`, 'ACAS', `VPH Score${hostRangeLabel}`, vphData.score.toFixed(2)],
      [`[Tenable] ${collectionName}`, 'ACAS', `Valid Online Assets${hostRangeLabel}`, this.getFilteredHostCount(this.hostTimeRange()).toString()]
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
              return `"${cellStr.replaceAll('"', '""')}"`;
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
    this.clearCache();
    this.loadAllData();
    this.now.set(new Date());
  }
}
