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
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData, registerables } from 'chart.js';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { Select } from 'primeng/select';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PayloadService } from '../../../common/services/setPayload.service';
import { Subject, Subscription, debounceTime, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';

interface SelectedOptions {
  status: string | null;
  vulnerabilitySource: string | null;
  severity: string | null;
  scheduledCompletion: string | null;
  taskOrder: string | null;
  label: string | null;
  [key: string]: string | null;
}
interface ChartConfig {
  element: ElementRef<HTMLCanvasElement>;
  key: string;
  data: ChartData<'bar'>;
  updateFn: (chart: Chart) => void;
}

@Component({
  selector: 'cpat-poam-mainchart',
  templateUrl: './poam-mainchart.component.html',
  styleUrls: ['./poam-mainchart.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    CardModule,
    Select,
    TabsModule,
    MultiSelectModule,
    NgxChartsModule,
  ],
})
export class PoamMainchartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Output() poamsChange = new EventEmitter<any[]>();
  @Input() poams!: any[];
  @Input() canvasHeight = '33rem';
  @Input() canvasWidth: string;
  @ViewChild('poamStatusChart') poamStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamLabelChart') poamLabelChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamTaskOrderChart') poamTaskOrderChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamSeverityChart') poamSeverityChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamScheduledCompletionChart')
  poamScheduledCompletionChart!: ElementRef<HTMLCanvasElement>;
  protected accessLevel: any;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];
  private chartConfigs: ChartConfig[];
  private filteredDataCache = new Map<string, any[]>();
  poamsForChart: any[] = [];
  public poamLabel: any[] = [];
  public selectedStatus: any = null;
  public selectedLabel: any = null;
  public selectedSeverity: any = null;
  public selectedTaskOrderNumber: any = null;
  public selectedScheduledCompletion: any = null;
  selectedOptionsValues: string[] = [];
  selectedPoamId: any;
  private chartInitialized = false;
  private updateCharts$ = new Subject<void>();
  private charts: Map<string, Chart> = new Map();
  private destroy$ = new Subject<void>();
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

  poamTaskOrders = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  statusChart: Chart | undefined;
  statusChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  labelChart: Chart | undefined;
  labelChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  severityChart: Chart | undefined;
  severityChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  scheduledCompletionChart: Chart | undefined;
  scheduledCompletionChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  taskOrderChart: Chart | undefined;
  taskOrderChartData: ChartData<'bar'> = {
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
      items: this.poamStatuses.map(status => ({
        label: status.label,
        value: `status:${status.value}`,
      })),
    },
    {
      label: 'Vulnerability Source',
      items: this.poamVulnerabilityTypes.map(vulnerabilitySource => ({
        label: vulnerabilitySource.label,
        value: `vulnerabilitySource:${vulnerabilitySource.value}`,
      })),
    },
    {
      label: 'Task Order',
      items: this.poamTaskOrders.map(taskOrder => ({
        label: taskOrder.label,
        value: `taskOrder:${taskOrder.value}`,
      })),
    },
    {
      label: 'Severity',
      items: this.poamSeverities.map(severity => ({
        label: severity.label,
        value: `severity:${severity.value}`,
      })),
    },
    {
      label: 'Scheduled Completion',
      items: this.poamScheduledCompletions.map(completion => ({
        label: completion.label,
        value: `scheduledCompletion:${completion.value}`,
      })),
    },
    {
      label: 'Label',
      items: [],
    },
  ];

  selectedOptions: SelectedOptions = {
    status: null,
    vulnerabilitySource: null,
    severity: null,
    scheduledCompletion: null,
    taskOrder: null,
    label: null,
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private setPayloadService: PayloadService,
    private zone: NgZone
  ) {
    Chart.register(...registerables);
    this.updateCharts$.pipe(debounceTime(250), takeUntil(this.destroy$)).subscribe(() => {
      this.zone.runOutsideAngular(() => {
        this.performChartUpdates();
        this.filteredDataCache.clear();
      });
    });
  }

  async ngOnInit() {
    if (this.poams) {
      await this.setPayload();
      this.initializePoamLabel();
      if (this.poams.length > 0 && !this.chartInitialized) {
        this.initializeChart();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poams'] && this.poams) {
      this.poamsForChart = [...this.poams];
      if (this.chartInitialized) {
        this.updateCharts$.next();
      } else if (this.poams.length > 0 && !this.chartInitialized) {
        this.initializeChart();
      }
      this.initializePoamLabel();
    }
  }

  ngAfterViewInit(): void {
    this.chartConfigs = [
      {
        element: this.poamStatusChart,
        key: 'status',
        data: this.statusChartData,
        updateFn: (chart: Chart) => this.updateStatusChart(chart),
      },
      {
        element: this.poamLabelChart,
        key: 'label',
        data: this.labelChartData,
        updateFn: (chart: Chart) => this.updateLabelChart(chart),
      },
      {
        element: this.poamSeverityChart,
        key: 'severity',
        data: this.severityChartData,
        updateFn: (chart: Chart) => this.updateSeverityChart(chart),
      },
      {
        element: this.poamTaskOrderChart,
        key: 'taskOrder',
        data: this.taskOrderChartData,
        updateFn: (chart: Chart) => this.updateTaskOrderChart(chart),
      },
      {
        element: this.poamScheduledCompletionChart,
        key: 'scheduledCompletion',
        data: this.scheduledCompletionChartData,
        updateFn: (chart: Chart) => this.updateScheduledCompletionChart(chart),
      },
    ];
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
      })
    );
  }

  private applyCanvasStyles(): void {
    if (!this.chartConfigs?.length) return;

    this.zone.runOutsideAngular(() => {
      this.chartConfigs.forEach(config => {
        if (config.element?.nativeElement) {
          const canvas = config.element.nativeElement;
          this.renderer.setStyle(canvas, 'height', this.canvasHeight);
          this.renderer.setStyle(canvas, 'width', this.canvasWidth);
        }
      });
      this.zone.run(() => this.cdr.detectChanges());
    });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  private initializeChart(): void {
    if (this.chartInitialized) return;

    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });

    requestAnimationFrame(() => {
      this.zone.runOutsideAngular(() => {
        this.initializeChartSequence();
      });
    });
  }

  private initializeChartSequence(): void {
    if (this.chartInitialized) return;
    let currentIndex = 0;

    const initNextChart = () => {
      if (currentIndex >= this.chartConfigs.length) {
        this.chartInitialized = true;
        this.zone.run(() => {
          this.performChartUpdates();
          this.applyCanvasStyles();
          this.cdr.detectChanges();
        });
        return;
      }

      const config = this.chartConfigs[currentIndex];

      if (config?.element?.nativeElement && !this.charts.has(config.key)) {
        const chart = new Chart(config.element.nativeElement, {
          type: 'bar',
          data: config.data,
          plugins: [ChartDataLabels],
          options: this.barChartOptions,
        });

        this.charts.set(config.key, chart);

        switch (config.key) {
          case 'status':
            this.statusChart = chart;
            break;
          case 'label':
            this.labelChart = chart;
            break;
          case 'severity':
            this.severityChart = chart;
            break;
          case 'scheduledCompletion':
            this.scheduledCompletionChart = chart;
            break;
          case 'taskOrder':
            this.taskOrderChart = chart;
            break;
        }

        config.updateFn(chart);
      }

      currentIndex++;
      requestAnimationFrame(initNextChart);
    };

    initNextChart();
  }

  private performChartUpdates(): void {
    if (!this.chartInitialized) {
      this.initializeChart();
    }

    requestAnimationFrame(() => {
      this.charts.forEach((chart, key) => {
        const updateFn = this.chartConfigs.find(c => c.key === key)?.updateFn;
        if (updateFn) {
          updateFn(chart);
        }
      });
    });
  }

  initializePoamLabel(): void {
    const labelSet = new Set<string>();
    this.poams.forEach(poam => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: { labelName: string }) => {
          if (label.labelName) {
            labelSet.add(label.labelName);
          }
        });
      }
    });

    const newPoamLabel = Array.from(labelSet).map(label => ({ label }));
    if (JSON.stringify(this.poamLabel) !== JSON.stringify(newPoamLabel)) {
      this.poamLabel = newPoamLabel;
      this.filterOptions = [
        {
          label: 'Status',
          items: this.poamStatuses.map(status => ({
            label: status.label,
            value: `status:${status.value}`,
          })),
        },
        {
          label: 'Vulnerability Source',
          items: this.poamVulnerabilityTypes.map(vulnerabilitySource => ({
            label: vulnerabilitySource.label,
            value: `vulnerabilitySource:${vulnerabilitySource.value}`,
          })),
        },
        {
          label: 'Task Order',
          items: this.poamTaskOrders.map(taskOrder => ({
            label: taskOrder.label,
            value: `taskOrder:${taskOrder.value}`,
          })),
        },
        {
          label: 'Severity',
          items: this.poamSeverities.map(severity => ({
            label: severity.label,
            value: `severity:${severity.value}`,
          })),
        },
        {
          label: 'Scheduled Completion',
          items: this.poamScheduledCompletions.map(completion => ({
            label: completion.label,
            value: `scheduledCompletion:${completion.value}`,
          })),
        },
        {
          label: 'Label',
          items: this.poamLabel.map(label => ({
            label: label.label,
            value: `label:${label.label}`,
          })),
        },
      ];
      this.cdr.detectChanges();
    }
  }

  updateCharts(): void {
    this.updateCharts$.next();
  }

  private updateStatusChart(chart: Chart): void {
    const filteredPoamStatus = this.applyFilters('status');
    const datasets = filteredPoamStatus.map(item => ({
      label: item.status,
      data: [item.statusCount],
      datalabels: {},
    }));
    chart.data.datasets = datasets;
    chart.update('none');
  }

  private updateLabelChart(chart: Chart): void {
    const filteredPoamLabel = this.applyFilters('label');
    const datasets = filteredPoamLabel.map(item => ({
      label: item.label,
      data: [item.labelCount],
      datalabels: {},
    }));
    chart.data.datasets = datasets;
    chart.update('none');
  }

  private updateSeverityChart(chart: Chart): void {
    const filteredPoamSeverity = this.applyFilters('severity');
    const datasets = filteredPoamSeverity.map(item => ({
      label: item.severity,
      data: [item.severityCount],
      datalabels: {},
    }));
    chart.data.datasets = datasets;
    chart.update('none');
  }

  private updateScheduledCompletionChart(chart: Chart): void {
    const filteredPoamScheduledCompletion = this.applyFilters('scheduledCompletion');
    const datasets = filteredPoamScheduledCompletion.map(item => ({
      label: item.scheduledCompletion,
      data: [item.scheduledCompletionCount],
      datalabels: {},
    }));
    chart.data.datasets = datasets;
    chart.update('none');
  }

  private updateTaskOrderChart(chart: Chart): void {
    const filteredTaskOrders = this.generateChartDataForTaskOrder(this.poamsForChart);
    const datasets = filteredTaskOrders.map(item => ({
      label: item.hasTaskOrder ? 'Has Task Order' : 'No Task Order',
      data: [item.count],
      datalabels: {},
    }));
    chart.data.datasets = datasets;
    chart.update('none');
  }

  private applyFilters(filterType: string): any[] {
    const cacheKey = `${filterType}-${JSON.stringify(this.selectedOptions)}`;
    if (this.filteredDataCache.has(cacheKey)) {
      return this.filteredDataCache.get(cacheKey)!;
    }

    let filteredPoams = this.poams;
    Object.entries(this.selectedOptions).forEach(([key, value]) => {
      if (value !== null) {
        switch (key) {
          case 'status':
            filteredPoams = filteredPoams.filter(poam => poam.status === value);
            break;
          case 'vulnerabilitySource':
            filteredPoams = filteredPoams.filter(poam => poam.vulnerabilitySource === value);
            break;
          case 'label':
            filteredPoams = filteredPoams.filter(poam =>
              poam.labels?.some((label: { labelName: string }) => label.labelName === value)
            );
            break;
          case 'severity':
            filteredPoams = filteredPoams.filter(poam => poam.rawSeverity === value);
            break;
          case 'scheduledCompletion':
            filteredPoams = filteredPoams.filter(poam => {
              const days = this.calculateDaysDifference(
                poam.scheduledCompletionDate,
                poam.extensionTimeAllowed
              );
              return this.getScheduledCompletionLabel(days) === value;
            });
            break;
          case 'taskOrder':
            filteredPoams = filteredPoams.filter(poam => {
              const hasTaskOrder = poam.taskOrderNumber != null && poam.taskOrderNumber !== '';
              return (value === 'Yes') === hasTaskOrder;
            });
            break;
        }
      }
    });
    this.poamsForChart = filteredPoams.map((poam: any) => ({
      id: poam.poamId,
      vulnerabilityId: poam.vulnerabilityId,
      status: poam.status,
      submittedDate: poam.submittedDate ? poam.submittedDate.substr(0, 10) : '',
      taskOrderNumber: poam.taskOrderNumber,
    }));

    this.poamsChange.emit(filteredPoams);
    const result = this.generateChartData(filterType, filteredPoams);
    this.filteredDataCache.set(cacheKey, result);
    return result;
  }

  private generateChartData(filterType: string, filteredPoams: any[]): any[] {
    switch (filterType) {
      case 'status':
        return this.generateChartDataForStatus(filteredPoams);
      case 'label':
        return this.generateChartDataForLabel(filteredPoams);
      case 'severity':
        return this.generateChartDataForSeverity(filteredPoams);
      case 'scheduledCompletion':
        return this.generateChartDataForScheduledCompletion(filteredPoams);
      case 'taskOrder':
        return this.generateChartDataForTaskOrder(filteredPoams);
      default:
        return [];
    }
  }

  filterPoamsByTaskOrder = (poam: any) => {
    const hasTaskOrder = poam.taskOrderNumber != null && poam.taskOrderNumber !== '';
    return (this.selectedOptions['taskOrder'] === 'Yes') === hasTaskOrder;
  };

  private generateChartDataForStatus(filteredPoams: any[]): any[] {
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

  private generateChartDataForLabel(filteredPoams: any[]): any[] {
    const labelCounts: { [label: string]: number } = {};
    filteredPoams.forEach(poam => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: { labelName: string }) => {
          if (label.labelName) {
            labelCounts[label.labelName] = (labelCounts[label.labelName] || 0) + 1;
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

  generateChartDataForScheduledCompletion(filteredPoams: any[]): any[] {
    const scheduledCompletionCounts: { [scheduledCompletion: string]: number } = {};
    filteredPoams.forEach(poam => {
      const days = this.calculateDaysDifference(
        poam.scheduledCompletionDate,
        poam.extensionTimeAllowed
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
        })
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

  generateChartDataForTaskOrder(filteredPoams: any[]): any[] {
    const taskOrderCounts = {
      withTaskOrder: 0,
      withoutTaskOrder: 0,
    };

    filteredPoams.forEach(poam => {
      if (poam.taskOrderNumber != null && poam.taskOrderNumber !== '') {
        taskOrderCounts.withTaskOrder++;
      } else {
        taskOrderCounts.withoutTaskOrder++;
      }
    });

    return [
      {
        hasTaskOrder: true,
        count: taskOrderCounts.withTaskOrder,
      },
      {
        hasTaskOrder: false,
        count: taskOrderCounts.withoutTaskOrder,
      },
    ];
  }

  filterPoamsByScheduledCompletion = (poam: any) => {
    const days = this.calculateDaysDifference(
      poam.scheduledCompletionDate,
      poam.extensionTimeAllowed
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

  onSelectPoam(event: any) {
    const poamId = event.value;
    const selectedPoam = this.poamsForChart.find((poam: any) => poam.id === poamId);
    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-processing/poam-details/${selectedPoam.id}`);
    } else {
      console.error('POAM not found');
    }
  }

  onGroupSelect(event: MultiSelectChangeEvent): void {
    this.selectedOptions = {
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      taskOrder: null,
      label: null,
    };

    event.value.forEach((value: string) => {
      const [group, selectedValue] = value.split(':');
      if (group) {
        this.selectedOptions[group] = selectedValue ?? null;
      }
    });

    this.selectedOptionsValues = Object.entries(this.selectedOptions)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => `${key}:${value}`);

    this.zone.run(() => {
      this.updateCharts$.next();
      this.cdr.detectChanges();
    });
  }

  isOptionDisabled(groupName: string, optionValue: string): boolean {
    return (
      this.selectedOptions[groupName] !== null && this.selectedOptions[groupName] !== optionValue
    );
  }

  resetChartFilters(): void {
    this.selectedOptions = {
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      taskOrder: null,
      label: null,
    };
    this.selectedOptionsValues = [];
    this.updateCharts$.next();
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
    if (this.selectedOptions['scheduledCompletion'] !== null) {
      filterSelections.push(`Scheduled Completion: ${this.selectedOptions['scheduledCompletion']}`);
    }
    if (this.selectedOptions['taskOrder'] !== null) {
      filterSelections.push(`Task Order: ${this.selectedOptions['taskOrder']}`);
    }
    if (this.selectedOptions['label'] !== null) {
      filterSelections.push(`Label: ${this.selectedOptions['label']}`);
    }

    return filterSelections.join(', ');
  }

  exportChart(chartInstance: Chart | undefined, chartName: string) {
    if (!chartInstance) {
      console.error('Chart instance not found');
      return;
    }

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
          display: false,
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

  ngOnDestroy(): void {
    this.filteredDataCache.clear();
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
    this.destroy$.next();
    this.destroy$.complete();
    this.updateCharts$.complete();
    this.payloadSubscription = [];
  }
}
