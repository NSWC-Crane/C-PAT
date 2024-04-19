/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';


@Component({
  selector: 'cpat-poam-count-chart',
  templateUrl: './poam-count-chart.html',
  styleUrls: ['./poam-count-chart.scss'],
})
export class PoamCountChartComponent implements OnInit {
  @Input() poamCountData!: any[];
  @ViewChild('poamCountChart') poamCountChart!: ElementRef<HTMLCanvasElement>;
  countChart!: Chart;
  countChartData: ChartData<'pie'> = {
    labels: [''],
    datasets: [],
  };

  public top: any = 'top';
  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20,
      }
    },
    plugins: {
      legend: {
        display: true,
        position: this.top,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          }
        },
      },
      title: {
        display: true,
        text: '',
      },
    },
  };

  constructor(
    private cdr: ChangeDetectorRef,
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    if (this.poamCountData) {
      this.initializeChart();
    }
  }


  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();

    if (this.poamCountChart?.nativeElement) {
      this.countChart = new Chart(this.poamCountChart.nativeElement, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [],
        },
        plugins: [ChartDataLabels],
        options: this.pieChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
    this.updatePoamCountChart();
  }

  updatePoamCountChart(): void {
    if (!this.countChart) {
      console.warn("POAM Count chart is not initialized.");
      return;
    }

    const labels = this.poamCountData.map(item => item.collectionName);
    const data = this.poamCountData.map(item => item.poamCount);
    const backgroundColors = ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(201, 203, 207, 0.5)'];
    const borderColors = backgroundColors.map(color => color.replace('0.5', '0.6'));
    this.countChart.data.labels = labels;
    this.countChart.data.datasets = [{
      data: data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      hoverOffset: 10,
    }];
    this.countChart.options.plugins!.title!.text = 'POAM Count by Collection';
    this.countChart.options.plugins!.legend!.display = false;
    this.countChart.update();
  }

}
