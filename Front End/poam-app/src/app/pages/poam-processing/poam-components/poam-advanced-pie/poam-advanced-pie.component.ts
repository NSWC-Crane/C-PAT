import { Component, Input } from '@angular/core';

@Component({
  selector: 'cpat-poam-advanced-pie',
  template: `
    <ngx-charts-advanced-pie-chart
      [scheme]="colorScheme"
      [results]="pieChartData"
      [percentageFormatting]="formatPercentages"
      [label]="collectionName + ' POAMs'">
    </ngx-charts-advanced-pie-chart>
  `,
})
export class PoamAdvancedPieComponent {
  @Input() pieChartData!: any[];
  @Input() collectionName!: string;
  colorScheme: any;

  constructor() {
    this.colorScheme = {
      domain: [
        'rgba(54, 162, 235, .7)',
        'rgba(75, 192, 192, .7)',
        'rgba(201, 203, 207, .7)',
        'rgba(255, 99, 132, .7)',
        'rgba(255, 205, 86, .7)',
        'rgba(255, 159, 64, .7)', 
        'rgba(152, 102, 255, .7)',
      ]};
  }

  formatPercentages(value: number): string {
    const str = value.toFixed(0);
    return str;
  }
}
