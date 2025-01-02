/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PoamService } from '../../poam-processing/poams.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

interface AssetEntry {
  groupId: string;
  ruleTitle: string;
  ruleId: string;
  benchmarkId: string;
  severity: string;
  assetCount: number;
  hasExistingPoam: boolean;
  poamStatus?: string;
}

@Component({
  selector: 'cpat-stigmanager-import',
  templateUrl: './stigmanager-import.component.html',
  styleUrls: ['./stigmanager-import.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    Select,
    FormsModule,
    InputTextModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class STIGManagerImportComponent implements OnInit, OnDestroy {
  @ViewChild('stigFindingsTable') table!: Table;
  @ViewChild('findingChart') findingChart!: ElementRef<HTMLCanvasElement>;
  allColumns = [
    {
      field: 'poam',
      header: 'POAM',
      width: '5%',
      filterField: 'poamStatus',
      filterType: 'text',
      filterOptions: [
        { label: 'Any', value: null },
        { label: 'No Existing POAM', value: 'No Existing POAM' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Associated', value: 'Associated' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Expired', value: 'Expired' },
        { label: 'Extension Requested', value: 'Extension Requested' },
        { label: 'False-Positive', value: 'False-Positive' },
        { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Submitted', value: 'Submitted' },
      ],
    },
    { field: 'groupId', header: 'Group ID', width: '15%', filterType: 'text' },
    { field: 'ruleTitle', header: 'Rule Title', width: '35%', filterType: 'text' },
    { field: 'benchmarkId', header: 'Benchmark ID', width: '15%', filterType: 'text' },
    { field: 'severity', header: 'Severity', width: '15%', filterType: 'text' },
    { field: 'assetCount', header: 'Asset Count', width: '15%', filterType: 'numeric' },
  ];
  private dataSource: AssetEntry[] = [];
  public displayDataSource: AssetEntry[] = [];
  public existingPoams: any[] = [];
  loadingTableInfo: boolean = true;
  loadingSkeletonData: any[] = Array(10).fill({});
  multiSortMeta: any[] = [];
  selectedFindings: string = '';
  collectionBasicList: any[] = [];
  selectedCollection: any;
  stigmanCollection: any;
  user: any;
  private subs = new SubSink();
  private subscriptions = new Subscription();
  public findings: any[] = [];
  findingsCount: number = 0;
  findingsChart!: Chart;
  findingsChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  public selectedPosition: any = 'bottom';
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        grace: '5%',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          display: true,
        },
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
          },
        },
      },
    },
  };

  findingsFilterOptions = [
    { label: 'All', value: 'All' },
    { label: 'No Existing POAM', value: 'No Existing POAM' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
    { label: 'Extension Requested', value: 'Extension Requested' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Closed', value: 'Closed' },
    { label: 'False-Positive', value: 'False-Positive' },
    { label: 'Associated', value: 'Associated' },
  ];

  constructor(
    private router: Router,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private poamService: PoamService
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.initializeComponent();
    this.selectedFindings = 'All';
  }

  private async initializeComponent() {
    try {
      const user = await (await this.userService.getCurrentUser()).toPromise();
      if (user?.userId) {
        this.user = user;
        await this.validateStigManagerCollection();
      } else {
        this.showError('Failed to retrieve current user.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      this.showError('An error occurred while initializing the component.');
    }
  }

  updateFindingsChartData(findings: any[]): void {
    if (this.findingsChart) {
      const datasets = findings.map(item => ({
        label: item.severity,
        data: [item.severityCount],
        datalabels: {},
      }));
      this.findingsChart.data.datasets = datasets;
      this.findingsChart.update();
    } else {
      console.warn('Findings chart is not initialized.');
    }
  }

  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    if (this.findingChart?.nativeElement) {
      this.findingsChart = new Chart(this.findingChart.nativeElement, {
        type: 'bar',
        data: this.findingsChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
  }

  getSeverityClass(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'CAT I - High': 'severity-High',
      'CAT II - Medium': 'severity-Medium',
      'CAT III - Low': 'severity-Low',
    };
    return severityMap[severity] || 'severity-Info';
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
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

    chartInstance.data.datasets.forEach(dataset => {
      if (dataset.datalabels) {
        Object.assign(dataset.datalabels, exportDatalabelsOptions);
      }
    });
    chartInstance.options.plugins!.title = {
      display: true,
      text: `${chartName}`,
      position: 'bottom',
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
        chartInstance.update();
      }, 500);
    }, 150);
  }

  async validateStigManagerCollection() {
    try {
      const basicListData = await (
        await this.collectionService.getCollectionBasicList()
      ).toPromise();

      const selectedCollection = basicListData?.find(
        collection => collection.collectionId === this.user.lastCollectionAccessedId
      );

      if (!selectedCollection) {
        this.showWarn('Unable to find the selected collection. Please try again.');
        return;
      }

      if (selectedCollection.collectionOrigin !== 'STIG Manager') {
        this.showWarn('The current collection is not associated with STIG Manager.');
        return;
      }

      this.stigmanCollection = {
        collectionId: selectedCollection.originCollectionId!.toString(),
        name: selectedCollection.collectionName,
      };

      if (!this.stigmanCollection.collectionId) {
        this.showWarn(
          'Unable to determine the matching STIG Manager collection ID. Please try again.'
        );
        return;
      }

      await this.getFindingsGrid(this.stigmanCollection.collectionId);
    } catch (error) {
      console.error('Error in validateStigManagerCollection:', error);
      this.showError('Failed to validate STIG Manager collection. Please try again.');
    }
  }

  async getFindingsGrid(stigmanCollection: string) {
    try {
      this.loadingTableInfo = true;
      const data = await (
        await this.sharedService.getFindingsFromSTIGMAN(stigmanCollection)
      ).toPromise();
      if (!data || data.length === 0) {
        this.showWarn('No affected assets found.');
        this.loadingTableInfo = false;
        return;
      }

      this.dataSource = data.map(item => ({
        groupId: item.groupId,
        ruleTitle: item.rules[0].title,
        ruleId: item.rules[0].ruleId,
        benchmarkId: item.stigs[0].benchmarkId,
        severity:
          item.severity === 'high'
            ? 'CAT I - High'
            : item.severity === 'medium'
              ? 'CAT II - Medium'
              : item.severity === 'low'
                ? 'CAT III - Low'
                : item.severity,
        assetCount: item.assetCount,
        hasExistingPoam: false,
      }));

      this.displayDataSource = [...this.dataSource];
      this.findingsCount = this.displayDataSource.length;

      const severityGroups = data.reduce((groups: any, item: any) => {
        const severity =
          item.severity === 'high'
            ? 'CAT I - High'
            : item.severity === 'medium'
              ? 'CAT II - Medium'
              : item.severity === 'low'
                ? 'CAT III - Low'
                : item.severity;
        if (!groups[severity]) {
          groups[severity] = 0;
        }
        groups[severity]++;
        return groups;
      }, {});

      const findings = Object.entries(severityGroups).map(([severity, count]) => ({
        severity,
        severityCount: count,
      }));

      const allSeverities = ['CAT I - High', 'CAT II - Medium', 'CAT III - Low'];
      allSeverities.forEach(severity => {
        if (!findings.find(finding => finding.severity === severity)) {
          findings.push({ severity, severityCount: 0 });
        }
      });

      findings.sort(
        (a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity)
      );
      this.selectedFindings = 'All';
      this.filterFindings();
      this.initializeChart();
      this.updateFindingsChartData(findings);
      this.loadingTableInfo = false;
    } catch (err) {
      console.error('Failed to fetch affected assets from STIGMAN:', err);
      this.showError('Failed to fetch affected assets. Please try again.');
      this.loadingTableInfo = false;
    }
  }

  updateSort(event: any) {
    this.multiSortMeta = event.multiSortMeta;
  }

  async filterFindings() {
    await (
      await this.poamService.getPluginIDsWithPoam()
    ).subscribe({
      next: (response: any) => {
        this.existingPoams = response;
        this.dataSource.forEach(item => {
          const existingPoam = this.existingPoams.find(
            (poam: any) => poam.vulnerabilityId === item.groupId
          );
          item.hasExistingPoam = !!existingPoam;
          item.poamStatus = existingPoam ? existingPoam.status : 'No Existing POAM';
        });

        this.displayDataSource = [...this.dataSource];
        this.findingsCount = this.displayDataSource.length;

        const severityGroups = this.displayDataSource.reduce(
          (groups: Record<string, number>, item) => {
            const severity = item.severity;
            if (!groups[severity]) {
              groups[severity] = 0;
            }
            groups[severity]++;
            return groups;
          },
          {}
        );

        const findings = Object.entries(severityGroups).map(([severity, count]) => ({
          severity,
          severityCount: count,
        }));

        const allSeverities = ['CAT I - High', 'CAT II - Medium', 'CAT III - Low'];
        allSeverities.forEach(severity => {
          if (!findings.find(finding => finding.severity === severity)) {
            findings.push({ severity, severityCount: 0 });
          }
        });

        findings.sort(
          (a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity)
        );

        this.updateFindingsChartData(findings);
      },
      error: error => {
        console.error('Error retrieving existing POAMs:', error);
        this.showError('Error retrieving existing POAMs. Please try again.');
      },
    });
  }

  getPoamStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'expired':
      case 'rejected':
      case 'draft':
        return 'maroon';
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
        return 'gold';
      case 'false-positive':
      case 'closed':
        return 'black';
      case 'approved':
        return 'green';
      case 'associated':
        return 'dimgray';
      default:
        return 'gray';
    }
  }

  getPoamStatusIcon(hasExistingPoam: boolean): string {
    if (!hasExistingPoam) {
      return 'pi-times-circle';
    }
    return 'pi-check-circle';
  }

  getPoamStatusTooltip(status: string | undefined, hasExistingPoam: boolean): string {
    if (!hasExistingPoam) return 'No Existing POAM. Click to create draft POAM.';
    if (!status) return 'POAM Status Unknown. Click to view POAM.';
    if (hasExistingPoam && status === 'Associated')
      return 'This vulnerability is associated with an existing master POAM. Click icon to view POAM.';

    return `POAM Status: ${status}. Click to view POAM.`;
  }

  async updateChartAndGrid(existingPoams: any[]) {
    this.dataSource.forEach(item => {
      const existingPoam = existingPoams.find(poam => poam.vulnerabilityId === item.groupId);
      item.hasExistingPoam = !!existingPoam;
      item.poamStatus = existingPoam?.status;
    });

    this.displayDataSource = this.dataSource.filter(item => {
      if (this.selectedFindings === 'All') {
        return true;
      }
      if (this.selectedFindings === 'No Existing POAM') {
        return !item.hasExistingPoam;
      }
      return item.hasExistingPoam && item.poamStatus === this.selectedFindings;
    });

    this.findingsCount = this.displayDataSource.length;
    const severityGroups = this.displayDataSource.reduce((groups: Record<string, number>, item) => {
      const severity = item.severity;
      if (!groups[severity]) {
        groups[severity] = 0;
      }
      groups[severity]++;
      return groups;
    }, {});

    const findings = Object.entries(severityGroups).map(([severity, count]) => ({
      severity,
      severityCount: count,
    }));

    const allSeverities = ['CAT I - High', 'CAT II - Medium', 'CAT III - Low'];
    allSeverities.forEach(severity => {
      if (!findings.find(finding => finding.severity === severity)) {
        findings.push({ severity, severityCount: 0 });
      }
    });
    findings.sort((a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity));

    this.updateFindingsChartData(findings);
  }

  async addPoam(rowData: any): Promise<void> {
    if (!rowData?.ruleId || !rowData?.groupId) {
      this.showError('Invalid data for POAM creation. Please try again.');
      return;
    }

    try {
      const ruleData: any = await (
        await this.sharedService.getRuleDataFromSTIGMAN(rowData.ruleId)
      ).toPromise();

      const ruleDataString = `# Rule data from STIGMAN
## Discussion
${ruleData.detail.vulnDiscussion}
---

## Check
${ruleData.check.content}
---

## Fix
${ruleData.fix.text}
---`;

      const descriptionString = `Title:
${ruleData.title}

Description:
${ruleData.detail.vulnDiscussion}`;

      let routePath = '/poam-processing/poam-details/';
      const routeParams = {
        state: {
          vulnerabilitySource: 'STIG',
          vulnerabilityId: rowData.groupId,
          benchmarkId: rowData.benchmarkId,
          severity: rowData.severity,
          ruleData: ruleDataString,
          description: descriptionString,
        },
      };

      const existingPoam = this.existingPoams.find(
        (item: any) => item.vulnerabilityId === rowData.groupId
      );

      if (existingPoam) {
        routePath += existingPoam.poamId;
      } else {
        routePath += 'ADDPOAM';
      }

      this.router.navigate([routePath], routeParams);
    } catch (error) {
      console.error('Error retrieving rule data from STIGMAN:', error);
      this.showError('Error retrieving rule data. Please try again.');
    }
  }

  showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
    });
  }

  showInfo(message: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message,
    });
  }

  showWarn(message: string) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warn',
      detail: message,
    });
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
    });
  }

  confirm(message: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.confirmationService.confirm({
        message: message,
        accept: () => {
          observer.next(true);
          observer.complete();
        },
        reject: () => {
          observer.next(false);
          observer.complete();
        },
      });
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
