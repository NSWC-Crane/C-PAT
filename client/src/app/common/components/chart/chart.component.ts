/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, PLATFORM_ID, effect, inject, input, viewChild } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'cpat-chart',
  standalone: true,
  template: `<canvas #canvas role="img"></canvas>`,
  host: {
    '[style.display]': '"block"',
    '[style.position]': '"relative"',
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[class]': 'styleClass()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpatChartComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly type = input.required<string>();
  readonly data = input<any>();
  readonly options = input<any>({});
  readonly height = input<string | undefined>(undefined);
  readonly width = input<string | undefined>(undefined);
  readonly styleClass = input<string>('');

  private chart: Chart | null = null;
  private initialized = false;

  constructor() {
    effect(() => {
      const data = this.data();
      const options = this.options();

      if (this.initialized && (data || options)) {
        this.reinit();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.initialized = true;
  }

  private initChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const data = this.data();

    if (!data) return;

    const opts = { ...(this.options() ?? {}) };

    if (this.height() || this.width()) {
      opts.maintainAspectRatio = false;
    }

    this.chart = new Chart(this.canvasRef().nativeElement, {
      type: this.type() as any,
      data,
      options: opts
    });
  }

  private reinit(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.initialized = false;
  }
}
