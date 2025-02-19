/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    <ngx-charts-advanced-pie-chart
      [scheme]="colorScheme"
      [results]="pieChartData()"
      [percentageFormatting]="formatPercentages"
      [label]="collectionName() + ' POAMs'"
    >
    </ngx-charts-advanced-pie-chart>
  `,
  standalone: true,
  imports: [NgxChartsModule],
})
export class PoamAdvancedPieComponent {
  pieChartData = input.required<any[]>();
  collectionName = input.required<string>();

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
}
