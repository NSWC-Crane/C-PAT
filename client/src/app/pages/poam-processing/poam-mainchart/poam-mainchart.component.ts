/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, effect, model, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { Select } from 'primeng/select';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

interface ChartDataset {
  label: string;
  data: number[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface SelectedOptions {
  status: string | null;
  vulnerabilitySource: string | null;
  severity: string | null;
  scheduledCompletion: string | null;
  taskOrder: string | null;
  label: string | null;
  [key: string]: string | null;
}

@Component({
  selector: 'cpat-poam-mainchart',
  templateUrl: './poam-mainchart.component.html',
  styleUrls: ['./poam-mainchart.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, ChartModule, FormsModule, CardModule, Select, TabsModule, MultiSelectModule, NgxChartsModule]
})
export class PoamMainchartComponent implements OnChanges, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  @Input() poams!: any[];
  @Input() canvasHeight = '35rem';
  readonly statusChartRef = viewChild<any>('statusChart');
  readonly labelChartRef = viewChild<any>('labelChart');
  readonly severityChartRef = viewChild<any>('severityChart');
  readonly scheduledCompletionChartRef = viewChild<any>('scheduledCompletionChart');
  readonly taskOrderChartRef = viewChild<any>('taskOrderChart');

  selectedStatus = signal<string | null>(null);
  selectedLabel = signal<string | null>(null);
  selectedSeverity = signal<string | null>(null);
  selectedScheduledCompletion = signal<string | null>(null);

  private labelSetCache = signal<Set<string> | null>(null);
  private chartDataCache = signal<Map<string, any>>(new Map());

  poamsForChart = signal<any[]>([]);
  poamLabel = signal<any[]>([]);
  selectedOptionsValues = model<string[]>([]);
  selectedPoamId = model<any>(null);

  statusChartData = signal<ChartData | null>(null);
  labelChartData = signal<ChartData | null>(null);
  severityChartData = signal<ChartData | null>(null);
  scheduledCompletionChartData = signal<ChartData | null>(null);
  taskOrderChartData = signal<ChartData | null>(null);

  chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600
          }
        }
      },
      x: {
        grid: {
          display: true
        }
      }
    }
  };

  poamStatuses = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Extension Requested', value: 'Extension Requested' },
    { label: 'False-Positive', value: 'False-Positive' }
  ];

  poamVulnerabilityTypes = [
    {
      value: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
      label: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner'
    },
    { value: 'STIG', label: 'STIG' }
  ];

  poamSeverities = [
    { value: 'CAT I - Critical', label: 'CAT I - Critical' },
    { value: 'CAT I - High', label: 'CAT I - High' },
    { value: 'CAT II - Medium', label: 'CAT II - Medium' },
    { value: 'CAT III - Low', label: 'CAT III - Low' },
    { value: 'CAT III - Informational', label: 'CAT III - Informational' }
  ];

  poamScheduledCompletions = [
    { value: 'OVERDUE', label: 'OVERDUE' },
    { value: '< 30 Days', label: '< 30 Days' },
    { value: '30-60 Days', label: '30-60 Days' },
    { value: '60-90 Days', label: '60-90 Days' },
    { value: '90-180 Days', label: '90-180 Days' },
    { value: '> 365 Days', label: '> 365 Days' }
  ];

  poamTaskOrders = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  filterOptions = computed(() => [
    {
      label: 'Status',
      items: this.poamStatuses.map((status) => ({
        label: status.label,
        value: `status:${status.value}`
      }))
    },
    {
      label: 'Vulnerability Source',
      items: this.poamVulnerabilityTypes.map((vulnerabilitySource) => ({
        label: vulnerabilitySource.label,
        value: `vulnerabilitySource:${vulnerabilitySource.value}`
      }))
    },
    {
      label: 'Task Order',
      items: this.poamTaskOrders.map((taskOrder) => ({
        label: taskOrder.label,
        value: `taskOrder:${taskOrder.value}`
      }))
    },
    {
      label: 'Severity',
      items: this.poamSeverities.map((severity) => ({
        label: severity.label,
        value: `severity:${severity.value}`
      }))
    },
    {
      label: 'Scheduled Completion',
      items: this.poamScheduledCompletions.map((completion) => ({
        label: completion.label,
        value: `scheduledCompletion:${completion.value}`
      }))
    },
    {
      label: 'Label',
      items: this.poamLabel().map((label) => ({
        label: label.label,
        value: `label:${label.label}`
      }))
    }
  ]);

  selectedOptions = signal<SelectedOptions>({
    status: null,
    vulnerabilitySource: null,
    severity: null,
    scheduledCompletion: null,
    taskOrder: null,
    label: null
  });

  initialPoamsData = computed(() => {
    if (!this.poams?.length) {
      return [];
    }

    return this.poams.map(({ poamId, vulnerabilityId, status, submittedDate, taskOrderNumber }) => ({
      poamId,
      vulnerabilityId,
      status,
      submittedDate: submittedDate ? submittedDate.substr(0, 10) : '',
      taskOrderNumber
    }));
  });

  filteredPoams = computed(() => {
    const activeFilters = Object.entries(this.selectedOptions()).filter(([, value]) => value !== null);

    if (activeFilters.length === 0) {
      return this.poams;
    }

    return this.poams.filter((poam) =>
      activeFilters.every(([key, value]) => {
        switch (key) {
          case 'status':
            return poam.status === value;
          case 'vulnerabilitySource':
            return poam.vulnerabilitySource === value;
          case 'label':
            return poam.labels?.some((label: { labelName: string }) => label.labelName === value);
          case 'severity':
            return poam.rawSeverity === value;

          case 'scheduledCompletion': {
            const days = this.calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);

            return this.getScheduledCompletionLabel(days) === value;
          }

          case 'taskOrder': {
            const hasTaskOrder = poam.taskOrderNumber != null && poam.taskOrderNumber !== '';

            return (value === 'Yes') === hasTaskOrder;
          }

          default:
            return true;
        }
      })
    );
  });

  private destroy$ = new Subject<void>();
  private initialized = false;

  constructor() {
    effect(() => {
      if (this.selectedOptions()) {
        this.updateAllCharts();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poams'] && changes['poams'].currentValue?.length > 0) {
      this.zone.run(() => {
        if (!this.initialized) {
          this.initialized = true;
          this.initializeComponent();
        } else {
          this.updateAllCharts();
        }
      });
    }
  }

  private initializeComponent(): void {
    if (!this.poams || this.poams.length === 0) {
      return;
    }

    this.initializePoamLabel();

    this.poamsForChart.set(
      this.poams.map(({ poamId, vulnerabilityId, status, submittedDate, taskOrderNumber }) => ({
        poamId,
        vulnerabilityId,
        status,
        submittedDate: submittedDate ? submittedDate.substr(0, 10) : '',
        taskOrderNumber
      }))
    );

    this.zone.run(() => {
      this.updateAllCharts();
      this.cdr.detectChanges();
    });
  }

  private updateAllCharts(): void {
    requestAnimationFrame(() => {
      this.updateStatusChart();
      this.updateLabelChart();
      this.updateSeverityChart();
      this.updateScheduledCompletionChart();
      this.updateTaskOrderChart();
      this.cdr.markForCheck();
    });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  initializePoamLabel(): void {
    if (!this.labelSetCache()) {
      this.labelSetCache.set(new Set<string>());

      for (const poam of this.poams) {
        if (poam.labels?.length > 0) {
          for (const label of poam.labels) {
            if (label.labelName) {
              this.labelSetCache().add(label.labelName);
            }
          }
        }
      }
    }

    const newPoamLabel = Array.from(this.labelSetCache()).map((label) => ({ label }));

    if (JSON.stringify(this.poamLabel()) !== JSON.stringify(newPoamLabel)) {
      this.poamLabel.set(newPoamLabel);
    }
  }

  private updateStatusChart(): void {
    const filteredPoamStatus = this.applyFilters('status');

    if (filteredPoamStatus.length > 0) {
      this.statusChartData.set({
        labels: [''],
        datasets: filteredPoamStatus.map((item) => ({
          label: item.status,
          data: [item.statusCount]
        }))
      });
    }
  }

  private updateLabelChart(): void {
    const filteredPoamLabel = this.applyFilters('label');

    if (filteredPoamLabel.length > 0) {
      this.labelChartData.set({
        labels: [''],
        datasets: filteredPoamLabel.map((item) => ({
          label: item.label,
          data: [item.labelCount]
        }))
      });
    }
  }

  private updateSeverityChart(): void {
    const filteredPoamSeverity = this.applyFilters('severity');

    this.severityChartData.set({
      labels: [''],
      datasets: filteredPoamSeverity.map((item) => ({
        label: item.severity,
        data: [item.severityCount]
      }))
    });
  }

  private updateScheduledCompletionChart(): void {
    const filteredPoamScheduledCompletion = this.applyFilters('scheduledCompletion');

    this.scheduledCompletionChartData.set({
      labels: [''],
      datasets: filteredPoamScheduledCompletion.map((item) => ({
        label: item.scheduledCompletion,
        data: [item.scheduledCompletionCount]
      }))
    });
  }

  private updateTaskOrderChart(): void {
    const filteredTaskOrders = this.applyFilters('taskOrder');

    this.taskOrderChartData.set({
      labels: [''],
      datasets: filteredTaskOrders.map((item) => ({
        label: item.hasTaskOrder ? 'Has Task Order' : 'No Task Order',
        data: [item.count]
      }))
    });
  }

  private applyFilters(filterType: string): any[] {
    if (Object.values(this.selectedOptions()).every((value) => value === null)) {
      const result = this.computeChartData(filterType, this.poams);

      return result;
    }

    let filteredPoams = this.poams;
    const activeFilters = Object.entries(this.selectedOptions()).filter(([, value]) => value !== null);

    if (activeFilters.length > 0) {
      filteredPoams = this.poams.filter((poam) =>
        activeFilters.every(([key, value]) => {
          switch (key) {
            case 'status':
              return poam.status === value;
            case 'vulnerabilitySource':
              return poam.vulnerabilitySource === value;
            case 'label':
              return poam.labels?.some((label: { labelName: string }) => label.labelName === value);
            case 'severity':
              return poam.rawSeverity === value;

            case 'scheduledCompletion': {
              const days = this.calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);

              return this.getScheduledCompletionLabel(days) === value;
            }

            case 'taskOrder': {
              const hasTaskOrder = poam.taskOrderNumber != null && poam.taskOrderNumber !== '';

              return (value === 'Yes') === hasTaskOrder;
            }

            default:
              return true;
          }
        })
      );
    }

    this.poamsForChart.set(
      filteredPoams.map(({ poamId, vulnerabilityId, status, submittedDate, taskOrderNumber }) => ({
        poamId,
        vulnerabilityId,
        status,
        submittedDate: submittedDate ? submittedDate.substr(0, 10) : '',
        taskOrderNumber
      }))
    );

    const result = this.generateChartData(filterType, filteredPoams);

    return result;
  }

  private generateChartData(filterType: string, filteredPoams: any[]): any[] {
    const cacheKey = `${filterType}-${filteredPoams.length}`;
    const cache = this.chartDataCache();

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const result = this.computeChartData(filterType, filteredPoams);

    const newCache = new Map(cache);

    newCache.set(cacheKey, result);
    this.chartDataCache.set(newCache);

    return result;
  }

  private computeChartData(filterType: string, filteredPoams: any[]): any[] {
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

  private generateChartDataForStatus(filteredPoams: any[]): any[] {
    const statusCounts: { [status: string]: number } = {};

    filteredPoams.forEach((poam) => {
      const status = poam.status;

      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const selectedOpts = this.selectedOptions();

    if (selectedOpts.status === null) {
      return Object.entries(statusCounts).map(([status, statusCount]) => ({
        status,
        statusCount
      }));
    } else {
      return [
        {
          status: selectedOpts.status,
          statusCount: statusCounts[selectedOpts.status] || 0
        }
      ];
    }
  }

  private generateChartDataForLabel(filteredPoams: any[]): any[] {
    const labelCounts: { [label: string]: number } = {};

    filteredPoams.forEach((poam) => {
      if (poam.labels && poam.labels.length > 0) {
        poam.labels.forEach((label: { labelName: string }) => {
          if (label.labelName) {
            labelCounts[label.labelName] = (labelCounts[label.labelName] || 0) + 1;
          }
        });
      }
    });

    const selectedOpts = this.selectedOptions();

    if (selectedOpts.label === null) {
      return Object.entries(labelCounts).map(([label, labelCount]) => ({
        label,
        labelCount
      }));
    } else {
      return [
        {
          label: selectedOpts.label,
          labelCount: labelCounts[selectedOpts.label] || 0
        }
      ];
    }
  }

  generateChartDataForSeverity(filteredPoams: any[]): any[] {
    const severityCounts: { [severity: string]: number } = {};

    filteredPoams.forEach((poam) => {
      const severity = poam.rawSeverity;

      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    const selectedOpts = this.selectedOptions();

    if (selectedOpts.severity === null) {
      return Object.entries(severityCounts).map(([severity, severityCount]) => ({
        severity,
        severityCount
      }));
    } else {
      return [
        {
          severity: selectedOpts.severity,
          severityCount: severityCounts[selectedOpts.severity] || 0
        }
      ];
    }
  }

  generateChartDataForScheduledCompletion(filteredPoams: any[]): any[] {
    const scheduledCompletionCounts: { [scheduledCompletion: string]: number } = {};

    filteredPoams.forEach((poam) => {
      const days = this.calculateDaysDifference(poam.scheduledCompletionDate, poam.extensionTimeAllowed);
      const scheduledCompletion = this.getScheduledCompletionLabel(days);

      scheduledCompletionCounts[scheduledCompletion] = (scheduledCompletionCounts[scheduledCompletion] || 0) + 1;
    });

    const selectedOpts = this.selectedOptions();

    if (selectedOpts.scheduledCompletion === null) {
      return Object.entries(scheduledCompletionCounts).map(([scheduledCompletion, scheduledCompletionCount]) => ({
        scheduledCompletion,
        scheduledCompletionCount
      }));
    } else {
      return [
        {
          scheduledCompletion: selectedOpts.scheduledCompletion,
          scheduledCompletionCount: scheduledCompletionCounts[selectedOpts.scheduledCompletion] || 0
        }
      ];
    }
  }

  generateChartDataForTaskOrder(filteredPoams: any[]): any[] {
    const taskOrderCounts = {
      withTaskOrder: 0,
      withoutTaskOrder: 0
    };

    filteredPoams.forEach((poam) => {
      if (poam.taskOrderNumber != null && poam.taskOrderNumber !== '') {
        taskOrderCounts.withTaskOrder++;
      } else {
        taskOrderCounts.withoutTaskOrder++;
      }
    });

    return [
      {
        hasTaskOrder: true,
        count: taskOrderCounts.withTaskOrder
      },
      {
        hasTaskOrder: false,
        count: taskOrderCounts.withoutTaskOrder
      }
    ];
  }

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
    const selectedPoam = this.poamsForChart().find((poam: any) => poam.poamId === poamId);

    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-processing/poam-details/${selectedPoam.poamId}`);
    } else {
      console.error('POAM not found');
    }
  }

  onGroupSelect(event: MultiSelectChangeEvent): void {
    const newSelectedOptions = {
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      taskOrder: null,
      label: null
    };

    event.value.forEach((value: string) => {
      const [group, selectedValue] = value.split(':');

      if (group) {
        newSelectedOptions[group] = selectedValue ?? null;
      }
    });

    this.selectedOptions.set(newSelectedOptions);
    this.selectedOptionsValues.set(
      Object.entries(newSelectedOptions)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => `${key}:${value}`)
    );

    this.zone.run(() => {
      this.updateAllCharts();
      this.cdr.detectChanges();
    });
  }

  isOptionDisabled(groupName: string, optionValue: string): boolean {
    const selectedOpts = this.selectedOptions();

    return selectedOpts[groupName] !== null && selectedOpts[groupName] !== optionValue;
  }

  resetChartFilters(): void {
    this.selectedOptions.set({
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      taskOrder: null,
      label: null
    });
    this.selectedOptionsValues.set([]);
    this.updateAllCharts();
  }

  calculateDaysDifference(scheduledCompletionDate: any, extensionTimeAllowed: any): number {
    const currentDate = new Date();
    const completionDate = addDays(new Date(scheduledCompletionDate), extensionTimeAllowed);

    return differenceInCalendarDays(completionDate, currentDate);
  }

  getChartSubtitle(): string {
    const filterSelections: string[] = [];
    const selectedOpts = this.selectedOptions();

    if (selectedOpts.status !== null) {
      filterSelections.push(`Status: ${selectedOpts.status}`);
    }

    if (selectedOpts.severity !== null) {
      filterSelections.push(`Severity: ${selectedOpts.severity}`);
    }

    if (selectedOpts.scheduledCompletion !== null) {
      filterSelections.push(`Scheduled Completion: ${selectedOpts.scheduledCompletion}`);
    }

    if (selectedOpts.taskOrder !== null) {
      filterSelections.push(`Task Order: ${selectedOpts.taskOrder}`);
    }

    if (selectedOpts.label !== null) {
      filterSelections.push(`Label: ${selectedOpts.label}`);
    }

    return filterSelections.join(', ');
  }

  exportChart(chartType: string): void {
    let chartRef: any;
    let chartName: string;

    switch (chartType) {
      case 'status':
        chartRef = this.statusChartRef();
        chartName = 'C-PAT POAM Status Chart';
        break;
      case 'label':
        chartRef = this.labelChartRef();
        chartName = 'C-PAT POAM Label Chart';
        break;
      case 'severity':
        chartRef = this.severityChartRef();
        chartName = 'C-PAT POAM Severity Chart';
        break;
      case 'scheduledCompletion':
        chartRef = this.scheduledCompletionChartRef();
        chartName = 'C-PAT POAM Scheduled Completion Chart';
        break;
      case 'taskOrder':
        chartRef = this.taskOrderChartRef();
        chartName = 'C-PAT POAM Task Order Chart';
        break;
      default:
        console.error('Invalid chart type');

        return;
    }

    if (!chartRef) {
      console.error('Chart reference not found');

      return;
    }

    const chart = chartRef.chart;

    const chartSubtitle = this.getChartSubtitle();

    chart.options.plugins.title = {
      display: true,
      text: chartName,
      font: {
        size: 16,
        family: 'sans-serif',
        weight: 600
      },
      padding: {
        top: 10,
        bottom: 5
      }
    };

    chart.options.plugins.subtitle = {
      display: true,
      text: chartSubtitle,
      font: {
        size: 14,
        family: 'sans-serif',
        weight: 600
      },
      padding: {
        top: 5,
        bottom: 10
      }
    };

    chart.update();

    setTimeout(() => {
      const canvas = chart.canvas;
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');

      link.download = `${chartName}_Export.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        chart.options.plugins.subtitle = {};
        chart.options.plugins.title = {};
        chart.update();
      }, 500);
    }, 150);
  }

  ngOnDestroy(): void {
    this.initialized = false;
    this.destroy$.next();
    this.destroy$.complete();

    this.chartDataCache.set(new Map());
    this.labelSetCache.set(null);
    this.poamsForChart.set([]);
    this.poamLabel.set([]);
    this.selectedOptionsValues.set([]);
    this.selectedPoamId.set(null);
    this.statusChartData.set(null);
    this.labelChartData.set(null);
    this.severityChartData.set(null);
    this.scheduledCompletionChartData.set(null);
    this.taskOrderChartData.set(null);
    this.selectedOptions.set({
      status: null,
      vulnerabilitySource: null,
      severity: null,
      scheduledCompletion: null,
      taskOrder: null,
      label: null
    });
  }
}
