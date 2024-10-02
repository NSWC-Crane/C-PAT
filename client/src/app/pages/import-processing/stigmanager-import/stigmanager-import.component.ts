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
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table/table';

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
})
export class STIGManagerImportComponent implements OnInit, OnDestroy {
  @ViewChild('stigFindingsTable') table!: Table;
  @ViewChild('findingChart') findingChart!: ElementRef<HTMLCanvasElement>;
  allColumns = [
    { field: 'poam', header: 'POAM', width: '5%', filterType: 'text' },
    { field: 'groupId', header: 'Group ID', width: '15%', filterType: 'text' },
    {
      field: 'ruleTitle',
      header: 'Rule Title',
      width: '35%',
      filterType: 'text',
    },
    {
      field: 'benchmarkId',
      header: 'Benchmark ID',
      width: '15%',
      filterType: 'text',
    },
    { field: 'severity', header: 'Severity', width: '15%', filterType: 'text' },
    {
      field: 'assetCount',
      header: 'Asset Count',
      width: '15%',
      filterType: 'numeric',
    },
  ];
  private dataSource: AssetEntry[] = [];
  public displayDataSource: AssetEntry[] = [];
  loadingTableInfo: boolean = true;
  loadingSkeletonData: any[] = Array(10).fill({});
  multiSortMeta: any[] = [];
  selectedFindings: string = '';
  collectionBasicList: any[] = [];
  selectedCollection: any;
  stigmanCollection:
    | { name: string; description: string; collectionId: string }
    | undefined;
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
    { label: 'Has Existing POAM', value: 'Has Existing POAM' },
    { label: 'No Existing POAM', value: 'No Existing POAM' },
    { label: 'Closed POAM Association', value: 'Closed POAM Association' },
  ];

  constructor(
    private router: Router,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      }),
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
      const datasets = findings.map((item) => ({
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

    chartInstance.data.datasets.forEach((dataset) => {
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

        chartInstance.data.datasets.forEach((dataset) => {
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
      const [stigmanData, basicListData] = await Promise.all([
        (await this.sharedService.getCollectionsFromSTIGMAN()).toPromise(),
        (await this.collectionService.getCollectionBasicList()).toPromise(),
      ]);

      const stigmanCollectionsMap = new Map(
        stigmanData?.map((collection) => [collection.name, collection]),
      );
      const basicListCollectionsMap = new Map(
        basicListData?.map((collection) => [
          collection.collectionId,
          collection,
        ]),
      );

      const selectedCollection = basicListCollectionsMap.get(
        this.user.lastCollectionAccessedId,
      );
      const selectedCollectionName = selectedCollection?.collectionName;
      this.stigmanCollection = selectedCollectionName
        ? stigmanCollectionsMap.get(selectedCollectionName)
        : undefined;

      if (!this.stigmanCollection || !selectedCollectionName) {
        this.showWarn(
          'Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are viewing a STIG Manager collection.',
        );
        return;
      }

      await Promise.all([
        this.getFindingsGrid(this.stigmanCollection.collectionId),
      ]);
    } catch (error) {
      console.error('Error in validateStigManagerCollection:', error);
      this.showError(
        'Failed to validate STIG Manager collection. Please try again.',
      );
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

      this.dataSource = data.map((item) => ({
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

      const findings = Object.entries(severityGroups).map(
        ([severity, count]) => ({
          severity,
          severityCount: count,
        }),
      );

      const allSeverities = [
        'CAT I - High',
        'CAT II - Medium',
        'CAT III - Low',
      ];
      allSeverities.forEach((severity) => {
        if (!findings.find((finding) => finding.severity === severity)) {
          findings.push({ severity, severityCount: 0 });
        }
      });

      findings.sort(
        (a, b) =>
          allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity),
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
      await this.sharedService.getExistingVulnerabilityPoams()
    ).subscribe({
      next: (response: any) => {
        const existingPoams = response;
        this.updateChartAndGrid(existingPoams);
      },
      error: (error) => {
        console.error('Error retrieving existing POAMs:', error);
        this.showError('Error retrieving existing POAMs. Please try again.');
      },
    });
  }

  async updateChartAndGrid(existingPoams: any[]) {
    this.dataSource.forEach((item) => {
      const existingPoam = existingPoams.find(
        (poam) => poam.vulnerabilityId === item.groupId,
      );
      item.hasExistingPoam = !!existingPoam;
      item.poamStatus = existingPoam?.status;
    });

    this.displayDataSource = this.dataSource.filter(
      (item) =>
        this.selectedFindings === 'All' ||
        (this.selectedFindings === 'Has Existing POAM' &&
          item.hasExistingPoam &&
          item.poamStatus != 'Closed' &&
          item.poamStatus != 'False-Positive') ||
        (this.selectedFindings === 'No Existing POAM' &&
          !item.hasExistingPoam) ||
        (this.selectedFindings === 'Closed POAM Association' &&
          item.hasExistingPoam &&
          (item.poamStatus === 'Closed' ||
            item.poamStatus === 'False-Positive')),
    );

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
      {},
    );

    const findings = Object.entries(severityGroups).map(
      ([severity, count]) => ({
        severity,
        severityCount: count,
      }),
    );

    const allSeverities = ['CAT I - High', 'CAT II - Medium', 'CAT III - Low'];
    allSeverities.forEach((severity) => {
      if (!findings.find((finding) => finding.severity === severity)) {
        findings.push({ severity, severityCount: 0 });
      }
    });
    findings.sort(
      (a, b) =>
        allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity),
    );

    this.updateFindingsChartData(findings);
  }

  async addPoam(rowData: AssetEntry): Promise<void> {
    if (!rowData?.ruleId || !rowData?.groupId) {
      this.showError('Invalid data for POAM creation. Please try again.');
      return;
    }
    await (
      await this.sharedService.getRuleDataFromSTIGMAN(rowData.ruleId)
    ).subscribe({
      next: async (ruleData: any) => {
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

        if (rowData.groupId) {
          (
            await this.sharedService.getPoamsByVulnerabilityId(rowData.groupId)
          ).subscribe({
            next: (response: any) => {
              if (response && response.length > 0) {
                const poam = response[0];
                this.router.navigate(
                  ['/poam-processing/poam-details/' + poam.poamId],
                  {
                    state: {
                      vulnerabilitySource: 'STIG',
                      vulnerabilityId: rowData.groupId,
                      benchmarkId: rowData.benchmarkId,
                      severity: rowData.severity,
                      ruleData: ruleDataString,
                      description: descriptionString,
                    },
                  },
                );
              } else {
                this.router.navigate(
                  ['/poam-processing/poam-details/ADDPOAM'],
                  {
                    state: {
                      vulnerabilitySource: 'STIG',
                      vulnerabilityId: rowData.groupId,
                      benchmarkId: rowData.benchmarkId,
                      severity: rowData.severity,
                      ruleData: ruleDataString,
                      description: descriptionString,
                    },
                  },
                );
              }
            },
            error: (error) => {
              console.error('Error retrieving POAM:', error);
              this.showError('Error creating POAM. Please try again.');
            },
          });
        } else {
          console.error('Group ID not found in row data:', rowData);
          this.showError('Error creating POAM. Please try again.');
        }
      },
      error: (error) => {
        console.error('Error retrieving rule data from STIGMAN:', error);
        this.showError('Error retrieving rule data. Please try again.');
      },
    });
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
    return new Observable<boolean>((observer) => {
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
