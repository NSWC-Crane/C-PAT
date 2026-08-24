/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, NgZone } from '@angular/core';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

const STATUS_COLOR_MAP: { [key: string]: string } = {
  Approved: 'rgba(75, 192, 115, 0.6)',
  Submitted: 'rgba(75, 192, 170, 0.55)',
  'Pending CAT-I Approval': 'rgba(75, 180, 190, 0.5)',
  'Extension Requested': 'rgba(255, 205, 86, .55)',
  Expired: 'rgba(255, 160, 65, .5)',
  Rejected: 'rgba(255, 55, 55, 0.45)',
  Closed: 'rgba(25, 25, 25, .6)',
  'False-Positive': 'rgba(70, 70, 70, .4)',
  'Open Findings': 'rgba(230, 50, 50, 0.4)',
  'No Data': 'rgba(200, 200, 200, .6)'
};

const STATUS_SORT_ORDER: { [key: string]: number } = {
  Approved: 0,
  Submitted: 1,
  'Extension Requested': 2,
  'Pending CAT-I Approval': 3,
  'False-Positive': 4,
  Expired: 5,
  Rejected: 6,
  Closed: 7,
  'Open Findings': 8,
  'No Data': 9
};

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    @if (pieChartData()?.length > 0) {
      <ngx-charts-advanced-pie-chart [animations]="false" [gradient]="true" [scheme]="colorScheme()" [results]="sortedPieChartData()" />
    } @else {
      <div class="spinner-container">
        <p-progress-spinner ariaLabel="loading" />
      </div>
    }
  `,
  styles: [
    `
      .spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        min-height: 18rem;
      }

      :host ::ng-deep .legend-item {
        .item-value,
        .item-percent {
          max-width: 8rem;
          transition:
            max-width 0.3s ease,
            opacity 0.3s ease,
            margin 0.3s ease;
        }

        &.label-truncated:hover,
        &.label-truncated:focus-visible {
          .item-value,
          .item-percent {
            max-width: 0 !important;
            min-width: 0 !important;
            margin: 0 !important;
            opacity: 0 !important;
            overflow: hidden;
          }
        }
      }
    `
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxChartsModule, ProgressSpinnerModule]
})
export class PoamAdvancedPieComponent {
  pieChartData = input.required<any[]>();
  collectionName = input.required<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private truncationCheckRafId?: number;

  sortedPieChartData = computed(() => {
    const data = this.pieChartData();

    if (!data) return [];

    return [...data].sort((a, b) => (STATUS_SORT_ORDER[a.name] ?? 999) - (STATUS_SORT_ORDER[b.name] ?? 999));
  });

  colorScheme = computed(() => ({
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: this.sortedPieChartData().map((item) => STATUS_COLOR_MAP[item.name] || 'rgba(128, 128, 128, .7)')
  }));

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.observeLegendTruncation()));

    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.mutationObserver?.disconnect();

      if (this.truncationCheckRafId !== undefined) {
        cancelAnimationFrame(this.truncationCheckRafId);
      }
    });
  }

  private observeLegendTruncation(): void {
    const hostEl = this.host.nativeElement;

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleTruncationCheck());
      this.resizeObserver.observe(hostEl);
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.scheduleTruncationCheck());
      this.mutationObserver.observe(hostEl, { childList: true, subtree: true });
    }

    this.scheduleTruncationCheck();
  }

  private scheduleTruncationCheck(): void {
    if (this.truncationCheckRafId !== undefined) return;

    this.truncationCheckRafId = requestAnimationFrame(() => {
      this.truncationCheckRafId = undefined;
      this.updateTruncationFlags();
    });
  }

  private updateTruncationFlags(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.legend-item').forEach((item) => {
      if (item.matches(':hover')) return;

      const label = item.querySelector<HTMLElement>('.item-label');

      item.classList.toggle('label-truncated', !!label && label.scrollWidth > label.clientWidth + 1);
    });
  }
}
