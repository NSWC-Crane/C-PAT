/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, computed, input } from '@angular/core';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    @if (pieChartData()?.length > 0) {
      <ngx-charts-advanced-pie-chart [scheme]="colorScheme()" [results]="sortedPieChartData()" [gradient]="gradient" />
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
        min-height: 20rem;

        &::before {
          content: '';
          position: absolute;
          inset: 40%;
          background: linear-gradient(135deg, var(--primary-contrast-color) 0%, var(--primary-color) 100%);
          opacity: 0.1;
          border-radius: 50%;
          filter: blur(40px);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.1;
          }

          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }
      }
    `
  ],
  standalone: true,
  imports: [NgxChartsModule, ProgressSpinnerModule]
})
export class PoamAdvancedPieComponent {
  pieChartData = input.required<any[]>();
  collectionName = input.required<string>();
  gradient: boolean = true;

  categories = ['CAT I', 'CAT II', 'CAT III'];

  private statusColorMap: { [key: string]: string } = {
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

  sortedPieChartData = computed(() => {
    const data = this.pieChartData();

    if (!data) return [];

    const sortedData = [...data];

    const typeOrder: { [key: string]: number } = {
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

    return sortedData.sort((a, b) => {
      const orderA = typeOrder[a.name] !== undefined ? typeOrder[a.name] : 999;
      const orderB = typeOrder[b.name] !== undefined ? typeOrder[b.name] : 999;

      return orderA - orderB;
    });
  });

  colorScheme = computed(() => {
    const data = this.sortedPieChartData();
    const colors = data.map((item) => this.statusColorMap[item.name] || 'rgba(128, 128, 128, .7)');

    return {
      name: 'custom',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: colors
    } as Color;
  });
}
