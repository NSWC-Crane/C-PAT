/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewInit,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData, registerables } from 'chart.js';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { MultiSelectChangeEvent } from 'primeng/multiselect';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpat-poam-mainchart',
  templateUrl: './poam-mainchart.component.html',
  styleUrls: ['./poam-mainchart.component.scss'],
})
export class PoamMainchartComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Output() poamsChange = new EventEmitter<any[]>();
  @Input() poams!: any[];
  @Input() showAddButton: boolean = false;
  @Input() canvasHeight = '35rem';
  @Input() canvasWidth = '100rem';
  @ViewChild('poamStatusChart') poamStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamLabelChart') poamLabelChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamSeverityChart')
  poamSeverityChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamScheduledCompletionChart')
  poamScheduledCompletionChart!: ElementRef<HTMLCanvasElement>;
  protected accessLevel: any;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];
  poamsForChart: any[] = [];
  public poamLabel: any[] = [];
  public selectedStatus: any = null;
  public selectedLabel: any = null;
  public selectedSeverity: any = null;
  public selectedScheduledCompletion: any = null;
  selectedOptionsValues: string[] = [];
  selectedPoamId: any;
  poamStatuses = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Extension Requested', value: 'Extension Requested' },
    { label: 'False-Positive', value: 'False-Positive' },
  ];

  poamVulnerabilityTypes = [
    {
      value: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
      label: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
    },
    { value: 'STIG', label: 'STIG' },
    { value: 'RMF Controls', label: 'RMF Controls' },
    { value: 'Task Order', label: 'Task Order' },
  ];

  poamSeverities = [
    { value: 'CAT I - Critical', label: 'CAT I - Critical' },
    { value: 'CAT I - High', label: 'CAT I - High' },
    { value: 'CAT II - Medium', label: 'CAT II - Medium' },
    { value: 'CAT III - Low', label: 'CAT III - Low' },
    { value: 'CAT III - Informational', label: 'CAT III - Informational' },
  ];

  poamScheduledCompletions = [
    { value: 'OVERDUE', label: 'OVERDUE' },
    { value: '< 30 Days', label: '< 30 Days' },
    { value: '30-60 Days', label: '30-60 Days' },
    { value: '60-90 Days', label: '60-90 Days' },
    { value: '90-180 Days', label: '90-180 Days' },
    { value: '> 365 Days', label: '> 365 Days' },
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
  scheduledCompletionChart!: Chart;
  scheduledCompletionChartData: ChartData<'bar'> = {
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
          display: false,
        },
        ticks: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          },
        },
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
          },
        },
      },
    },
  };

  filterOptions: any[] = [
    {
      label: 'Status',
      items: this.poamStatuses.map((status) => ({
        label: status.label,
        value: `status:${status.value}`,
      })),
    },
    {
      label: 'Vulnerability Source',
      items: this.poamVulnerabilityTypes.map((vulnerabilitySource) => ({
        label: vulnerabilitySource.label,
        value: `vulnerabilitySource:${vulnerabilitySource.value}`,
      })),
    },
    {
      label: 'Severity',
      items: this.poamSeverities.map((severity) => ({
        label: severity.label,
        value: `severity:${severity.value}`,
      })),
    },
    {
      label: 'Scheduled Completion',
      items: this.poamScheduledCompletions.map((completion) => ({
        label: completion.label,
        value: `scheduledCompletion:${completion.value}`,
      })),
    },
    {
      label: 'Label',
      items: [],
    },
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private setPayloadService: PayloadService,
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    if (this.poams) {
      await this.setPayload();
      this.initializePoamLabel();
      this.initializeChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poams'] && this.poams) {
      this.poamsForChart = [...this.poams];
      if (this.statusChart) {
        this.updateCharts();
      }
      this.initializePoamLabel();
    }
    if (changes['canvasHeight'] || changes['canvasWidth']) {
      this.applyCanvasStyles();
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    this.applyCanvasStyles();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
        }
      }),
    );
  }

  private applyCanvasStyles(): void {
    if (this.poamStatusChart?.nativeElement) {
      this.renderer.setStyle(
        this.poamStatusChart.nativeElement,
        'height',
        this.canvasHeight,
      );
      this.renderer.setStyle(
        this.poamStatusChart.nativeElement,
        'width',
        this.canvasWidth,
      );
    }
    if (this.poamLabelChart?.nativeElement) {
      this.renderer.setStyle(
        this.poamLabelChart.nativeElement,
        'height',
        this.canvasHeight,
      );
      this.renderer.setStyle(
        this.poamLabelChart.nativeElement,
        'width',
        this.canvasWidth,
      );
    }
    if (this.poamSeverityChart?.nativeElement) {
      this.renderer.setStyle(
        this.poamSeverityChart.nativeElement,
        'height',
        this.canvasHeight,
      );
      this.renderer.setStyle(
        this.poamSeverityChart.nativeElement,
        'width',
        this.canvasWidth,
      );
    }
    if (this.poamScheduledCompletionChart?.nativeElement) {
      this.renderer.setStyle(
        this.poamScheduledCompletionChart.nativeElement,
        'height',
        this.canvasHeight,
      );
      this.renderer.setStyle(
        this.poamScheduledCompletionChart.nativeElement,
        'width',
        this.canvasWidth,
      );
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

    if (this.poamScheduledCompletionChart?.nativeElement) {
      this.scheduledCompletionChart = new Chart(
        this.poamScheduledCompletionChart.nativeElement,
        {
          type: 'bar',
          data: this.scheduledCompletionChartData,
          plugins: [ChartDataLabels],
          options: this.barChartOptions,
        },
      );
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
    this.applyCanvasStyles();
  }

  initializePoamLabel(): void {
    const labelSet = new Set<string>();
    this.poams.forEach((poam) => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: { labelName: string }) => {
          if (label.labelName) {
            labelSet.add(label.labelName);
          }
        });
      }
    });

    const newPoamLabel = Array.from(labelSet).map((label) => ({ label }));
    if (JSON.stringify(this.poamLabel) !== JSON.stringify(newPoamLabel)) {
      this.poamLabel = newPoamLabel;
      this.filterOptions = [
        {
          label: 'Status',
          items: this.poamStatuses.map((status) => ({
            label: status.label,
            value: `status:${status.value}`,
          })),
        },
        {
          label: 'Vulnerability Source',
          items: this.poamVulnerabilityTypes.map((vulnerabilitySource) => ({
            label: vulnerabilitySource.label,
            value: `vulnerabilitySource:${vulnerabilitySource.value}`,
          })),
        },
        {
          label: 'Severity',
          items: this.poamSeverities.map((severity) => ({
            label: severity.label,
            value: `severity:${severity.value}`,
          })),
        },
        {
          label: 'Scheduled Completion',
          items: this.poamScheduledCompletions.map((completion) => ({
            label: completion.label,
            value: `scheduledCompletion:${completion.value}`,
          })),
        },
        {
          label: 'Label',
          items: this.poamLabel.map((label) => ({
            label: label.label,
            value: `label:${label.label}`,
          })),
        },
      ];
      this.cdr.detectChanges();
    }
  }

  updateCharts(): void {
    this.updateStatusChart();
    this.updateLabelChart();
    this.updateSeverityChart();
    this.updateScheduledCompletionChart();
  }

  updateStatusChart(): void {
    if (!this.statusChart) {
      console.warn('POAM Status chart is not initialized.');
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
      console.warn('POAM Label chart is not initialized.');
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
      console.warn('POAM Severity chart is not initialized.');
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

  updateScheduledCompletionChart(): void {
    if (!this.scheduledCompletionChart) {
      console.warn('POAM Scheduled Completion chart is not initialized.');
      return;
    }
    const filteredPoamScheduledCompletion = this.applyFilters(
      'scheduledCompletion',
    );
    const datasets = filteredPoamScheduledCompletion.map((item) => ({
      label: item.scheduledCompletion,
      data: [item.scheduledCompletionCount],
      datalabels: {},
    }));
    this.scheduledCompletionChart.data.datasets = datasets;
    this.scheduledCompletionChart.update();
  }

  applyFilters(filterType: string): any[] {
    let filteredPoams = this.poams;

    if (this.selectedOptions['status'] !== null) {
      filteredPoams = filteredPoams.filter(
        (poam) => poam.status === this.selectedOptions['status'],
      );
    }

    if (this.selectedOptions['vulnerabilitySource'] !== null) {
      filteredPoams = filteredPoams.filter(
        (poam) =>
          poam.vulnerabilitySource ===
          this.selectedOptions['vulnerabilitySource'],
      );
    }

    if (this.selectedOptions['label'] !== null) {
      filteredPoams = filteredPoams.filter((poam) =>
        poam.labels.some(
          (label: { labelName: string }) =>
            label.labelName === this.selectedOptions['label'],
        ),
      );
    }

    if (this.selectedOptions['severity'] !== null) {
      filteredPoams = filteredPoams.filter(
        (poam) => poam.rawSeverity === this.selectedOptions['severity'],
      );
    }

    if (this.selectedOptions['scheduledCompletion'] !== null) {
      filteredPoams = filteredPoams.filter((poam) =>
        this.filterPoamsByScheduledCompletion(poam),
      );
    }

    this.poamsForChart = filteredPoams.map((poam: any) => ({
      id: poam.poamId,
      vulnerabilityId: poam.vulnerabilityId,
      status: poam.status,
      submittedDate: poam.submittedDate ? poam.submittedDate.substr(0, 10) : '',
    }));
    this.poamsChange.emit(filteredPoams);
    switch (filterType) {
      case 'status':
        return this.generateChartDataForStatus(filteredPoams);
      case 'vulnerabilitySource':
        return this.generateChartDataForStatus(filteredPoams);
      case 'label':
        return this.generateChartDataForLabel(filteredPoams);
      case 'severity':
        return this.generateChartDataForSeverity(filteredPoams);
      case 'scheduledCompletion':
        return this.generateChartDataForScheduledCompletion(filteredPoams);
      default:
        return [];
    }
  }

  generateChartDataForStatus(filteredPoams: any[]): any[] {
    const statusCounts: { [status: string]: number } = {};
    filteredPoams.forEach((poam) => {
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
    filteredPoams.forEach((poam) => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: { labelName: string }) => {
          if (label.labelName) {
            labelCounts[label.labelName] =
              (labelCounts[label.labelName] || 0) + 1;
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
    filteredPoams.forEach((poam) => {
      const severity = poam.rawSeverity;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    if (this.selectedSeverity === null) {
      return Object.entries(severityCounts).map(
        ([severity, severityCount]) => ({
          severity,
          severityCount,
        }),
      );
    } else {
      return [
        {
          severity: this.selectedSeverity,
          severityCount: severityCounts[this.selectedSeverity] || 0,
        },
      ];
    }
  }

  generateChartDataForScheduledCompletion(filteredPoams: any[]): any[] {
    const scheduledCompletionCounts: { [scheduledCompletion: string]: number } =
      {};
    filteredPoams.forEach((poam) => {
      const days = this.calculateDaysDifference(
        poam.scheduledCompletionDate,
        poam.extensionTimeAllowed,
      );
      const scheduledCompletion = this.getScheduledCompletionLabel(days);
      scheduledCompletionCounts[scheduledCompletion] =
        (scheduledCompletionCounts[scheduledCompletion] || 0) + 1;
    });

    if (this.selectedScheduledCompletion === null) {
      return Object.entries(scheduledCompletionCounts).map(
        ([scheduledCompletion, scheduledCompletionCount]) => ({
          scheduledCompletion,
          scheduledCompletionCount,
        }),
      );
    } else {
      return [
        {
          scheduledCompletion: this.selectedScheduledCompletion,
          scheduledCompletionCount:
            scheduledCompletionCounts[this.selectedScheduledCompletion] || 0,
        },
      ];
    }
  }

  filterPoamsByScheduledCompletion = (poam: any) => {
    const days = this.calculateDaysDifference(
      poam.scheduledCompletionDate,
      poam.extensionTimeAllowed,
    );
    const scheduledCompletion = this.getScheduledCompletionLabel(days);
    return scheduledCompletion === this.selectedOptions['scheduledCompletion'];
  };

  getScheduledCompletionLabel(days: number): string {
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

  onSelectPoam(event: DropdownChangeEvent) {
    const poamId = event.value;
    const selectedPoam = this.poamsForChart.find(
      (poam: any) => poam.id === poamId,
    );
    if (selectedPoam) {
      this.router.navigateByUrl(
        `/poam-processing/poam-details/${selectedPoam.id}`,
      );
    } else {
      console.error('POAM not found');
    }
  }

  selectedOptions: { [key: string]: string | null } = {
    status: null,
    vulnerabilitySource: null,
    severity: null,
    scheduledCompletion: null,
    label: null,
  };

  onGroupSelect(event: MultiSelectChangeEvent) {
    this.selectedOptions = {
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      label: null,
    };

    event.value.forEach((value: any) => {
      const [group, selectedValue] = value.split(':');
      this.selectedOptions[group] =
        selectedValue === null ? null : selectedValue;
    });

    this.selectedOptionsValues = Object.entries(this.selectedOptions)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => `${key}:${value}`);

    this.updateCharts();
  }

  isOptionDisabled(groupName: string, optionValue: string): boolean {
    return (
      this.selectedOptions[groupName] !== null &&
      this.selectedOptions[groupName] !== optionValue
    );
  }

  resetChartFilters() {
    this.selectedOptions = {
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      label: null,
    };
    this.selectedOptionsValues = [];
    this.updateCharts();
  }

  calculateDaysDifference(
    scheduledCompletionDate: any,
    extensionTimeAllowed: any,
  ): number {
    const currentDate = new Date();
    const completionDate = addDays(
      new Date(scheduledCompletionDate),
      extensionTimeAllowed,
    );
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
    if (this.selectedOptions['scheduledCompletion'] !== null) {
      filterSelections.push(
        `Scheduled Completion: ${this.selectedOptions['scheduledCompletion']}`,
      );
    }
    if (this.selectedOptions['label'] !== null) {
      filterSelections.push(`Label: ${this.selectedOptions['label']}`);
    }

    return filterSelections.join(', ');
  }

  exportChart(chartInstance: Chart, chartName: string) {
    const exportDatalabelsOptions = {
      backgroundColor: function (context: any) {
        const datasetBackgroundColor =
          context.chart.data.datasets[context.datasetIndex].backgroundColor;
        return Array.isArray(datasetBackgroundColor)
          ? datasetBackgroundColor[context.dataIndex]
          : datasetBackgroundColor;
      },
      borderRadius: 4,
      color: 'white',
      display: true,
      font: {
        weight: 'bold',
      },
      align: 'end',
      anchor: 'end',
      padding: 6,
    };
    chartInstance.data.datasets.forEach((dataset) => {
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
          display: false,
        };

        chartInstance.data.datasets.forEach((dataset) => {
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

  ngOnDestroy(): void {
    this.payloadSubscription.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
