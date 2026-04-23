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
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import * as echarts from 'echarts';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, catchError, interval, of, startWith, switchMap } from 'rxjs';
import { DailyCheck, UptimeService, UptimeStatus } from '../uptime.service';

interface ResponseChartData {
  points: [number, number | null][];
}

const RESPONSE_LINE_COLOR = 'rgba(16, 185, 129, 0.6)';

function formatTooltipTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).find((part) => part.type === 'timeZoneName')?.value ?? '';

  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${ampm}${tz ? ' ' + tz : ''}`;
}

function formatTooltipDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHourLabel(d: Date): string {
  const h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;

  return `${h12}:00${ampm}`;
}

@Component({
  selector: 'cpat-uptime-monitor',
  templateUrl: './uptime-monitor.component.html',
  styleUrl: './uptime-monitor.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, DividerModule, SkeletonModule, TooltipModule]
})
export class UptimeMonitorComponent implements OnInit, OnDestroy {
  private uptimeService = inject(UptimeService);

  isLoading = signal(true);
  uptimeData = signal<UptimeStatus | null>(null);
  responseChartData = signal<ResponseChartData | null>(null);
  activeCheck = signal<DailyCheck | null>(null);

  readonly showStigman = computed(() => this.uptimeData()?.stigman?.available === true);
  readonly showTenable = computed(() => this.uptimeData()?.tenable?.available === true);
  readonly oidcHasBorder = computed(() => this.showStigman() || this.showTenable());
  readonly stigmanHasBorder = computed(() => this.showTenable());

  chartContainer = viewChild<ElementRef<HTMLDivElement>>('chart');

  private chart: echarts.ECharts | null = null;
  private subscription = new Subscription();

  constructor() {
    effect(() => {
      const ref = this.chartContainer();
      const data = this.responseChartData();

      if (!ref || !data) {
        if (this.chart) {
          this.chart.dispose();
          this.chart = null;
        }

        return;
      }

      if (!this.chart) {
        this.renderChart(ref.nativeElement, data);
      } else {
        this.chart.setOption({
          series: [{ data: data.points }]
        });
      }
    });
  }

  ngOnInit() {
    this.subscription.add(
      interval(300_000)
        .pipe(
          startWith(0),
          switchMap(() => this.uptimeService.getUptimeStatus().pipe(catchError(() => of(null))))
        )
        .subscribe((data) => {
          if (data) {
            this.uptimeData.set(data);
            this.buildResponseChart(data);
          }

          this.isLoading.set(false);
        })
    );
  }

  ngOnDestroy() {
    this.chart?.dispose();
    this.chart = null;
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    this.chart?.resize();
  }

  getStatusIcon(status: string): string {
    if (status === 'operational') return 'pi pi-check-circle';
    if (status === 'outage') return 'pi pi-times-circle';

    return 'pi pi-question-circle';
  }

  getStatusColorClass(status: string): string {
    if (status === 'operational') return 'status-operational';
    if (status === 'outage') return 'status-outage';

    return 'status-unknown';
  }

  onSegmentMouseEnter(_event: MouseEvent, check: DailyCheck) {
    this.activeCheck.set(check);
  }

  getSegmentStatusLabel(check: DailyCheck): string {
    if (check.status == null) {
      const unknown = check.unknownMinutes ?? 0;

      if (unknown === 0) return 'Unknown';
      const hours = Math.floor(unknown / 60);
      const mins = unknown % 60;

      return hours > 0 ? `${hours}h ${mins}m unknown` : `${mins}m unknown`;
    }

    if (check.status === 1) return 'Operational';
    const hours = Math.floor(check.downtimeMinutes / 60);
    const mins = check.downtimeMinutes % 60;

    if (hours === 0 && mins === 0) return 'Outage';

    return hours > 0 ? `${hours}h ${mins}m downtime` : `${mins}m downtime`;
  }

  formatCheckDate(check: DailyCheck): string {
    return new Date(check.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  private buildResponseChart(data: UptimeStatus) {
    const series = data.responseTimeSeries;

    if (!series?.length) {
      this.responseChartData.set(null);

      return;
    }

    const points: [number, number | null][] = series.map((s) => [new Date(s.timestamp).getTime(), s.response_ms == null ? null : Math.round(s.response_ms)]);

    this.responseChartData.set({ points });
  }

  private renderChart(element: HTMLDivElement, data: ResponseChartData) {
    this.chart = echarts.init(element, null, { renderer: 'canvas' });
    this.chart.setOption({
      grid: { top: 12, right: 12, bottom: 24, left: 44, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--p-surface-900)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: 'var(--text-color)', fontSize: 12 },
        extraCssText: 'border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.4);',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.3)', width: 1, type: 'dashed' } },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const tsRaw = Array.isArray(p.value) ? p.value[0] : p.axisValue;
          const valRaw = Array.isArray(p.value) ? p.value[1] : p.value;
          const d = new Date(tsRaw);
          const time = formatTooltipTime(d);
          const date = formatTooltipDate(d);
          const val = valRaw == null ? '—' : `${(Number(valRaw) / 1000).toFixed(2)} s`;

          return `
            <div style="min-width:210px;font-size:12px;line-height:1.4;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                <span style="color:var(--text-color);font-weight:600;">${time}</span>
                <span style="color:rgba(255,255,255,0.4);">· ${date}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
                <span style="display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,0.85);">
                  <span style="display:inline-block;width:10px;height:10px;background:${RESPONSE_LINE_COLOR};border-radius:2px;"></span>
                  Latency
                </span>
                <span style="color:var(--text-color);font-weight:600;">${val}</span>
              </div>
            </div>
          `;
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        minInterval: 4 * 3600 * 1000,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontSize: 10,
          hideOverlap: true,
          formatter: (value: number) => {
            const d = new Date(value);

            if (d.getHours() % 4 !== 0 || d.getMinutes() !== 0) return '';

            return formatHourLabel(d);
          }
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontSize: 10,
          formatter: (value: number) => `${value / 1000} s`
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          type: 'line',
          data: data.points,
          symbol: 'none',
          smooth: 0.25,
          connectNulls: false,
          lineStyle: { color: RESPONSE_LINE_COLOR, width: 1.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0)' }
              ]
            }
          }
        }
      ]
    });
  }
}
