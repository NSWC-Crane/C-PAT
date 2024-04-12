/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbThemeService } from '@nebular/theme';
import { PoamService } from './poams.service';
import { AuthService } from '../../auth';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service';
import { Chart, registerables, ChartData } from 'chart.js';
import { addDays, differenceInCalendarDays } from 'date-fns';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

interface LabelInfo {
  poamId: number;
  labelId: number;
  labelName: string;
}

@Component({
  selector: 'ngx-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
})

export class PoamsComponent implements OnInit {
  @ViewChild('poamStatusChart') poamStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamLabelChart') poamLabelChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamSeverityChart') poamSeverityChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('poamEstimatedCompletionChart') poamEstimatedCompletionChart!: ElementRef<HTMLCanvasElement>;
  private subs = new SubSink();
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  poamsForChart: any[] = [];
  public poamStatus: any[] = [];
  public poamLabel: any[] = [];
  public poamSeverity: any[] = [];
  public poamEstimatedCompletion: any[] = [];
  public detailedPoam: any;
  public selectedStatus: any = null;
  public selectedLabel: any = null;
  public selectedSeverity: any = null;
  public selectedEstimatedCompletion: any = null;
  selectedOptionsValues: string[] = [];
  poamStatuses = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Expired', label: 'Expired' }
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
  public selectedPosition: any = 'bottom';
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
        position: this.selectedPosition,
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
  poams: any[] = [];
  users: any;
  user: any;
  collection: any;
  payload: any;
  selectedPoamId: any;

  constructor(
    private poamService: PoamService,
    private theme: NbThemeService,
    private authService: AuthService,
    private router: Router,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  ngAfterViewInit(): void {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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

  setPayload() {
    this.user = null;
    this.payload = null;
    this.subs.sink = this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId,
                  canOwn: permission.canOwn,
                  canMaintain: permission.canMaintain,
                  canApprove: permission.canApprove,
                  canView: permission.canView,
                })
              ),
            };
            this.getPoamData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }

  getPoamData() {
    this.subs.sink = forkJoin([
      this.poamService.getCollection(
        this.payload.lastCollectionAccessedId,
        this.payload.userName
      ),
      this.poamService.getCollectionPoamStatus(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamLabel(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamSeverity(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getCollectionPoamEstimatedCompletion(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      ),
      this.poamService.getPoamLabels(
        this.payload.lastCollectionAccessedId
      )
    ]).subscribe(([collection, poamStatusResponse, collectionLabelResponse, poamSeverityResponse, poamEstimatedCompletionResponse, poams, poamLabelResponse]: any) => {
      if (!Array.isArray(poamStatusResponse.poamStatus)) {
        console.error(
          'poamStatusResponse.poamStatus is not an array',
          poamStatusResponse.poamStatus
        );
      }
      else if (!Array.isArray(collectionLabelResponse.poamLabel)) {
        console.error(
          'collectionLabelResponse.poamLabel is not an array',
          collectionLabelResponse.poamLabel
        );
      }
      else if (!Array.isArray(poamSeverityResponse.poamSeverity)) {
        console.error(
          'poamSeverityResponse.poamSeverity is not an array',
          poamSeverityResponse.poamSeverity
        );
      }
      else if (!Array.isArray(poamEstimatedCompletionResponse.poamEstimatedCompletion)) {
        console.error(
          'poamEstimatedCompletionResponse.poamEstimatedCompletion is not an array',
          poamEstimatedCompletionResponse.poamEstimatedCompletion
        );
      }
      else if (!Array.isArray(poamLabelResponse)) {
        console.error(
          'poamLabelResponse.poamLabels is not an array',
          poamLabelResponse
        );
        return;
      }
      this.collection = collection;
      this.poamStatus = poamStatusResponse.poamStatus;
      this.poamLabel = collectionLabelResponse.poamLabel;
      this.poamSeverity = poamSeverityResponse.poamSeverity;
      this.poamEstimatedCompletion = poamEstimatedCompletionResponse.poamEstimatedCompletion;
      const poamLabelMap: { [poamId: number]: string[] } = {};
      (poamLabelResponse as LabelInfo[]).forEach(labelInfo => {
        if (!poamLabelMap[labelInfo.poamId]) {
          poamLabelMap[labelInfo.poamId] = [];
        }
        poamLabelMap[labelInfo.poamId].push(labelInfo.labelName);
      });

      this.poams = poams.map((poam: any) => ({
        ...poam,
        labels: poamLabelMap[poam.poamId] || ['']
      }));
      this.updateCharts();
    });
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
      description: poam.description,
    }));

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

  addPoam() {
    this.router.navigateByUrl('/poam-details/ADDPOAM');
  }

  onSelectPoam(poamId: number) {
    const selectedPoam = this.poamsForChart.find((poam: any) => poam.id === poamId);
    if (selectedPoam) {
      this.router.navigateByUrl(`/poam-details/${selectedPoam.id}`);
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
      .filter(([_, value]) => value !== null)
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
