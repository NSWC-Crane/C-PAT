/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, input, computed } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    <ngx-charts-advanced-pie-chart
      [scheme]="colorScheme"
      [results]="sortedPieChartData()"
      [percentageFormatting]="formatPercentages"
      [label]="collectionName() + ' POAMs'">
    </ngx-charts-advanced-pie-chart>

    <div *ngIf="findingStats() && showProgressBars()" class="finding-progress-bars" pTooltip="Percentage of open findings with POAMs (Excluding Draft)" tooltipPosition="right">
      <div *ngFor="let category of categories" class="progress-bar-item">
        <div class="progress-label">
          <span class="category-label">{{ category }}</span>
          <span class="percentage-label">{{ findingStats()[category].percentage }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"
               [style.width.%]="findingStats()[category].percentage"
               [ngClass]="getCategoryClass(category)">
          </div>
        </div>
        <div class="progress-stats">
          {{ findingStats()[category].withPoam }} / {{ findingStats()[category].total }}
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [NgxChartsModule, CommonModule, TooltipModule]
})
export class PoamAdvancedPieComponent {
  pieChartData = input.required<any[]>();
  collectionName = input.required<string>();
  findingStats = input<{ [key: string]: { total: number, withPoam: number, percentage: number } }>();
  showProgressBars = input<boolean>(false);

  categories = ['CAT I', 'CAT II', 'CAT III'];

  sortedPieChartData = computed(() => {
    const data = this.pieChartData();
    if (!data) return [];

    const sortedData = [...data];
    const categoryOrder: { [key: string]: number } = {
      'CAT I': 0,
      'CAT II': 1,
      'CAT III': 2
    };

    return sortedData.sort((a, b) => {
      const orderA = categoryOrder[a.name] !== undefined ? categoryOrder[a.name] : 999;
      const orderB = categoryOrder[b.name] !== undefined ? categoryOrder[b.name] : 999;
      return orderA - orderB;
    });
  });

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      'rgba(54, 162, 235, .7)',
      'rgba(75, 192, 192, .7)',
      'rgba(201, 203, 207, .7)',
      'rgba(255, 99, 132, .7)',
      'rgba(255, 205, 86, .7)',
      'rgba(255, 159, 64, .7)',
      'rgba(152, 102, 255, .7)',
    ]
  };

  formatPercentages(value: number): string {
    const str = value.toFixed(0);
    return str;
  }

  getCategoryClass(category: string): string {
    const match = category.match(/CAT\s+([I|V|X]+)/i);
    if (match && match[1]) {
      return 'cat-' + match[1].toLowerCase();
    }
    return '';
  }
}
