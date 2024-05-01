/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { addDays, differenceInCalendarDays } from 'date-fns';

@Component({
  selector: 'cpat-poam-mainchart',
  templateUrl: './poam-mainchart.component.html',
  styleUrls: ['./poam-mainchart.component.scss']
})
export class PoamMainchartComponent implements OnInit, OnChanges, AfterViewInit {
  @Output() poamsChange = new EventEmitter<any[]>();
  @Input() poams!: any[];
  @Input() showAddButton: boolean = false;
  @Input() canvasHeight = '45rem';
  @Input() canvasWidth = '100rem';
  @ViewChild('poamStatusChart') poamStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamLabelChart') poamLabelChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamSeverityChart') poamSeverityChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamEstimatedCompletionChart') poamEstimatedCompletionChart!: ElementRef<HTMLCanvasElement>;

  poamsForChart: any[] = [];
  public poamLabel: any[] = [];
  public selectedStatus: any = null;
  public selectedLabel: any = null;
  public selectedSeverity: any = null;
  public selectedEstimatedCompletion: any = null;
  selectedOptionsValues: string[] = [];
  selectedPoamId: any;
  poamStatuses = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Extension Requested', label: 'Extension Requested' }
  ];

  poamSeverities = [
    { value: 'CAT I - Critical/High', label: 'CAT I - Critical/High' },
    { value: 'CAT II - Medium', label: 'CAT II - Medium' },
    { value: 'CAT III - Low', label: 'CAT III - Low' }
  ];

  poamEstimatedCompletions = [
    { value: 'OVERDUE', label: 'OVERDUE' },
    { value: '< 30 Days', label: '< 30 Days' },
    { value: '30-60 Days', label: '30-60 Days' },
    { value: '60-90 Days', label: '60-90 Days' },
    { value: '90-180 Days', label: '90-180 Days' },
    { value: '> 365 Days', label: '> 365 Days' }
  ];
  statusChart!: Chart;
  statusChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  labelChart!: Chart;
  labelChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  severityChart!: Chart;
  severityChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  estimatedCompletionChart!: Chart;
  estimatedCompletionChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  public bottom: any = 'bottom';
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: true } },
      y: {
        beginAtZero: true,
        grace: '5%',
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          },
        }
      },
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        position: this.bottom,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          }
        },
      },
    },
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    if (this.poams) {
      this.initializeChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poams'] && this.poams) {
      this.poamsForChart = [...this.poams];
      if (this.statusChart) {
        this.updateCharts();
      }
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    if (this.poams && this.poams.length > 0) {
      this.initializeChart();
    }
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();
    if (this.poamStatusChart?.nativeElement) {
      this.statusChart = new Chart(this.poamStatusChart.nativeElement, {
        type: 'bar',
        data: this.statusChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.poamLabelChart?.nativeElement) {
      this.labelChart = new Chart(this.poamLabelChart.nativeElement, {
        type: 'bar',
        data: this.labelChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.poamSeverityChart?.nativeElement) {
      this.severityChart = new Chart(this.poamSeverityChart.nativeElement, {
        type: 'bar',
        data: this.severityChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }

    if (this.poamEstimatedCompletionChart?.nativeElement) {
      this.estimatedCompletionChart = new Chart(this.poamEstimatedCompletionChart.nativeElement, {
        type: 'bar',
        data: this.estimatedCompletionChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
  }


  updateCharts(): void {
    this.updateStatusChart();
    this.updateLabelChart();
    this.updateSeverityChart();
    this.updateEstimatedCompletionChart();
  }

  updateStatusChart(): void {
    if (!this.statusChart) {
      console.warn("POAM Status chart is not initialized.");
      return;
    }
    const filteredPoamStatus = this.applyFilters('status');
    const datasets = filteredPoamStatus.map((item) => ({
      label: item.status,
      data: [item.statusCount],
      datalabels: {},
    }));
    this.statusChart.data.datasets = datasets;
    this.statusChart.update();
  }

  updateLabelChart(): void {
    if (!this.labelChart) {
      console.warn("POAM Label chart is not initialized.");
      return;
    }
    const filteredPoamLabel = this.applyFilters('label');
    const datasets = filteredPoamLabel.map((item) => ({
      label: item.label,
      data: [item.labelCount],
      datalabels: {},
    }));

    this.labelChart.data.datasets = datasets;
    this.labelChart.update();
  }


  updateSeverityChart(): void {
    if (!this.severityChart) {
      console.warn("POAM Severity chart is not initialized.");
      return;
    }
    const filteredPoamSeverity = this.applyFilters('severity');
    const datasets = filteredPoamSeverity.map((item) => ({
      label: item.severity,
      data: [item.severityCount],
      datalabels: {},
    }));
    this.severityChart.data.datasets = datasets;
    this.severityChart.update();
  }

  updateEstimatedCompletionChart(): void {
    if (!this.estimatedCompletionChart) {
      console.warn("POAM Estimated Completion chart is not initialized.");
      return;
    }
    const filteredPoamEstimatedCompletion = this.applyFilters('estimatedCompletion');
    const datasets = filteredPoamEstimatedCompletion.map((item) => ({
      label: item.estimatedCompletion,
      data: [item.estimatedCompletionCount],
      datalabels: {},
    }));
    this.estimatedCompletionChart.data.datasets = datasets;
    this.estimatedCompletionChart.update();
  }

  applyFilters(filterType: string): any[] {
    let filteredPoams = this.poams;

    if (this.selectedOptions['status'] !== null) {
      filteredPoams = filteredPoams.filter(poam => poam.status === this.selectedOptions['status']);
    }

    if (this.selectedOptions['label'] !== null) {
      filteredPoams = filteredPoams.filter(poam => poam.labels.includes(this.selectedOptions['label']));
    }

    if (this.selectedOptions['severity'] !== null) {
      filteredPoams = filteredPoams.filter(poam => poam.rawSeverity === this.selectedOptions['severity']);
    }

    if (this.selectedOptions['estimatedCompletion'] !== null) {
      filteredPoams = filteredPoams.filter(poam => this.filterPoamsByEstimatedCompletion(poam));
    }

    this.poamsForChart = filteredPoams.map((poam: any) => ({
      id: poam.poamId,
      vulnerabilityId: poam.vulnerabilityId,
      status: poam.status,
      submittedDate: (poam.submittedDate) ? poam.submittedDate.substr(0, 10) : ''
    }));
    this.poamsChange.emit(filteredPoams);
    switch (filterType) {
      case 'status':
        return this.generateChartDataForStatus(filteredPoams);
      case 'label':
        return this.generateChartDataForLabel(filteredPoams);
      case 'severity':
        return this.generateChartDataForSeverity(filteredPoams);
      case 'estimatedCompletion':
        return this.generateChartDataForEstimatedCompletion(filteredPoams);
      default:
        return [];
    }
  }

  generateChartDataForStatus(filteredPoams: any[]): any[] {
    const statusCounts: { [status: string]: number } = {};
    filteredPoams.forEach(poam => {
      const status = poam.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    if (this.selectedStatus === null) {
      return Object.entries(statusCounts).map(([status, statusCount]) => ({
        status,
        statusCount,
      }));
    } else {
      return [
        {
          status: this.selectedStatus,
          statusCount: statusCounts[this.selectedStatus] || 0,
        },
      ];
    }
  }

  generateChartDataForLabel(filteredPoams: any[]): any[] {
    const labelCounts: { [label: string]: number } = {};
    filteredPoams.forEach(poam => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: string) => {
          if (label) {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
          }
        });
      }
    });
    if (this.selectedLabel === null) {
      return Object.entries(labelCounts).map(([label, labelCount]) => ({
        label,
        labelCount,
      }));
    } else {
      return [
        {
          label: this.selectedLabel,
          labelCount: labelCounts[this.selectedLabel] || 0,
        },
      ];
    }
  }

  generateChartDataForSeverity(filteredPoams: any[]): any[] {
    const severityCounts: { [severity: string]: number } = {};
    filteredPoams.forEach(poam => {
      const severity = poam.rawSeverity;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    if (this.selectedSeverity === null) {
      return Object.entries(severityCounts).map(([severity, severityCount]) => ({
        severity,
        severityCount,
      }));
    } else {
      return [
        {
          severity: this.selectedSeverity,
          severityCount: severityCounts[this.selectedSeverity] || 0,
        },
      ];
    }
  }

  generateChartDataForEstimatedCompletion(filteredPoams: any[]): any[] {
    const estimatedCompletionCounts: { [estimatedCompletion: string]: number } = {};
    filteredPoams.forEach(poam => {
      const days = this.calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);
      const estimatedCompletion = this.getEstimatedCompletionLabel(days);
      estimatedCompletionCounts[estimatedCompletion] = (estimatedCompletionCounts[estimatedCompletion] || 0) + 1;
    });

    if (this.selectedEstimatedCompletion === null) {
      return Object.entries(estimatedCompletionCounts).map(([estimatedCompletion, estimatedCompletionCount]) => ({
        estimatedCompletion,
        estimatedCompletionCount,
      }));
    } else {
      return [
        {
          estimatedCompletion: this.selectedEstimatedCompletion,
          estimatedCompletionCount: estimatedCompletionCounts[this.selectedEstimatedCompletion] || 0,
        },
      ];
    }
  }

  filterPoamsByEstimatedCompletion = (poam: any) => {
    const days = this.calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);
    const estimatedCompletion = this.getEstimatedCompletionLabel(days);
    return estimatedCompletion === this.selectedOptions['estimatedCompletion'];
  };

  getEstimatedCompletionLabel(days: number): string {
    if (days < 0) {
      return 'OVERDUE';
    } else if (days <= 30) {
      return '< 30 Days';
    } else if (days <= 60) {
      return '30-60 Days';
    } else if (days <= 90) {
      return '60-90 Days';
    } else if (days <= 180) {
      return '90-180 Days';
    } else {
      return '> 365 Days';
    }
  }

  onSelectPoam(poamId: number) {
    const selectedPoam = this.poamsForChart.find((poam: any) => poam.id === poamId);
    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-processing/poam-details/${selectedPoam.id}`);
    } else {
      console.error('POAM not found');
    }
  }

  selectedOptions: { [key: string]: string | null } = {
    status: null,
    severity: null,
    estimatedCompletion: null,
    label: null
  };

  onGroupSelect(selectedValues: string[]) {
    this.selectedOptions = {
      status: null,
      severity: null,
      estimatedCompletion: null,
      label: null
    };

    selectedValues.forEach(value => {
      const [group, selectedValue] = value.split(':');
      this.selectedOptions[group] = selectedValue === null ? null : selectedValue;
    });

    this.selectedOptionsValues = Object.entries(this.selectedOptions)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => `${key}:${value}`);

    this.updateCharts();
  }

  isOptionDisabled(groupName: string, optionValue: string): boolean {
    return this.selectedOptions[groupName] !== null && this.selectedOptions[groupName] !== optionValue;
  }

  resetChartFilters() {
    this.selectedOptions = {
      status: null,
      severity: null,
      estimatedCompletion: null,
      label: null
    };
    this.selectedOptionsValues = [];
    this.updateCharts();
  }

  calculateDaysDifference(scheduledCompletionDate: any, extensionTimeAllowed: any): number {
    const currentDate = new Date();
    const completionDate = addDays(new Date(scheduledCompletionDate), extensionTimeAllowed);
    return differenceInCalendarDays(completionDate, currentDate);
  }

  getChartSubtitle(): string {
    const filterSelections: string[] = [];

    if (this.selectedOptions['status'] !== null) {
      filterSelections.push(`Status: ${this.selectedOptions['status']}`);
    }
    if (this.selectedOptions['severity'] !== null) {
      filterSelections.push(`Severity: ${this.selectedOptions['severity']}`);
    }
    if (this.selectedOptions['estimatedCompletion'] !== null) {
      filterSelections.push(`Estimated Completion: ${this.selectedOptions['estimatedCompletion']}`);
    }
    if (this.selectedOptions['label'] !== null) {
      filterSelections.push(`Label: ${this.selectedOptions['label']}`);
    }

    return filterSelections.join(', ');
  }

  exportChart(chartInstance: Chart, chartName: string) {
    const exportDatalabelsOptions = {
      backgroundColor: function (context: any) {
        const datasetBackgroundColor = context.chart.data.datasets[context.datasetIndex].backgroundColor;
        return Array.isArray(datasetBackgroundColor)
          ? datasetBackgroundColor[context.dataIndex]
          : datasetBackgroundColor;
      },
      borderRadius: 4,
      color: 'white',
      display: true,
      font: {
        weight: 'bold'
      },
      align: 'end',
      anchor: 'end',
      padding: 6
    };
    chartInstance.data.datasets.forEach(dataset => {
      if (dataset.datalabels) {
        Object.assign(dataset.datalabels, exportDatalabelsOptions);
      }
    });

    const chartSubtitle = this.getChartSubtitle();

    chartInstance.options.plugins!.title = {
      display: true,
      position: 'bottom',
      text: chartSubtitle,
      font: {
        size: 14,
        family: 'sans-serif',
        weight: 600,
      },
      padding: {
        bottom: 0,
      },
    };
    chartInstance.options.plugins!.subtitle = {
      display: true,
      position: 'bottom',
      text: chartName,
      font: {
        size: 16,
        family: 'sans-serif',
        weight: 600,
      },
      padding: {
        top: 5,
        bottom: 10,
      },
    };
    chartInstance.update();

    setTimeout(() => {
      const canvas = chartInstance.canvas;
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${chartName}_Export.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        const disappearDatalabelsOptions = {
          display: false
        };

        chartInstance.data.datasets.forEach(dataset => {
          if (dataset.datalabels) {
            Object.assign(dataset.datalabels, disappearDatalabelsOptions);
          }
        });
        chartInstance.options.plugins!.title = {
          display: false,
        };
        chartInstance.options.plugins!.subtitle = {
          display: false,
        };
        chartInstance.update();
      }, 500);

    }, 150);
  }
}
