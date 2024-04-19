import { Component, Input } from '@angular/core';

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    <ngx-charts-advanced-pie-chart
      [scheme]="colorScheme"
      [results]="pieChartData">
    </ngx-charts-advanced-pie-chart>
  `,
})
export class PoamAdvancedPieComponent {
  @Input() pieChartData!: any[];
  colorScheme: any;

  constructor() {
    this.colorScheme = { domain: ['rgba(54, 162, 235, .7)', 'rgba(75, 192, 192, .7)', 'rgba(201, 203, 207, .7)']};
  }

}
