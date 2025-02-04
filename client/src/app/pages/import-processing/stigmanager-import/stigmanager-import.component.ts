/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { MessageService } from 'primeng/api';
import { PoamService } from '../../poam-processing/poams.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';
import { MultiSelectModule } from 'primeng/multiselect';

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

interface STIGData {
  benchmarkId: string;
  collectionIds: string[];
  lastRevisionDate: string;
  lastRevisionStr: string;
  revisionStrs: string[];
  revisions: STIGRevision[];
  ruleCount: number;
  status: string;
  title: string;
}

interface STIGRevision {
  benchmarkDate: string;
  benchmarkId: string;
  collectionIds: string[];
  release: string;
  revisionStr: string;
  ruleCount: number;
  status: string;
  statusDate: string;
  version: string;
}

@Component({
  selector: 'cpat-stigmanager-import',
  templateUrl: './stigmanager-import.component.html',
  styleUrls: ['./stigmanager-import.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    ChartModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
})
export class STIGManagerImportComponent implements OnInit, OnDestroy {
  @ViewChild('stigFindingsTable') table!: Table;
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
    {
      field: 'benchmarkId',
      header: 'Benchmark ID',
      width: '15%',
      filterType: 'multi',
      filterOptions: [{ label: 'Any', value: null }]
    },
    { field: 'severity', header: 'Severity', width: '15%', filterType: 'text' },
    { field: 'assetCount', header: 'Asset Count', width: '15%', filterType: 'numeric' },
  ];
  private dataSource: AssetEntry[] = [];
  public displayDataSource: AssetEntry[] = [];
  public existingPoams: any[] = [];
  benchmarkIds: string[] = [];
  selectedBenchmarkId: string | null = null;
  loadingTableInfo: boolean = true;
  loadingSkeletonData: any[] = Array(15).fill({});
  multiSortMeta: any[] = [];
  selectedFindings: string = '';
  selectedCollection: any;
  stigmanCollection: any;
  user: any;
  private subscriptions = new Subscription();
  selectedBenchmarkIds: string[] = [];
  findingsCount: number = 0;
  chartData: any;
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
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
      legend: {
        display: true,
        position: 'bottom',
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

  constructor(
    private router: Router,
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private userService: UsersService,
    private messageService: MessageService,
    private poamService: PoamService
  ) { }

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.initializeComponent();
    this.selectedFindings = 'All';
    this.loadBenchmarkIds();
  }

  private initializeComponent() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.userId) {
          this.user = user;
          this.validateStigManagerCollection();
        } else {
          this.showError('Failed to retrieve current user.');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
        this.showError('An error occurred while initializing the component.');
      }
    });
  }

  private updateFindingsChartData(findings: any[]): void {
    this.chartData = {
      labels: [''],
      datasets: findings.map(item => ({
        label: item.severity,
        data: [item.severityCount]
      }))
    };
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

  exportChart() {
    if (document) {
      const canvas = document.getElementsByTagName('canvas')[0];
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'STIG_Manager_Findings_Chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  }

  validateStigManagerCollection() {
    this.collectionsService.getCollectionBasicList().subscribe({
      next: (basicListData) => {
        const selectedCollection = basicListData?.find(
          collection => +collection.collectionId === +this.user.lastCollectionAccessedId
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
          collectionId: selectedCollection.originCollectionId,
          name: selectedCollection.collectionName,
        };

        if (!this.stigmanCollection.collectionId) {
          this.showWarn(
            'Unable to determine the matching STIG Manager collection ID. Please try again.'
          );
          return;
        }

        this.getFindingsGrid(this.stigmanCollection.collectionId);
      },
      error: (error) => {
        console.error('Error in validateStigManagerCollection:', error);
        this.showError('Failed to validate STIG Manager collection. Please try again.');
      }
    });
  }

  getFindingsGrid(stigmanCollection: number) {
    this.loadingTableInfo = true;
    this.sharedService.getFindingsFromSTIGMAN(stigmanCollection).subscribe({
      next: (data) => {
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
          severity: this.mapSeverity(item.severity),
          assetCount: item.assetCount,
          hasExistingPoam: false,
        }));

        this.displayDataSource = [...this.dataSource];
        this.findingsCount = this.displayDataSource.length;

        const findings = this.processSeverityGroups(data);
        this.selectedFindings = 'All';
        this.filterFindings();
        this.updateFindingsChartData(findings);
      },
      error: (error) => {
        console.error('Failed to fetch affected assets from STIGMAN:', error);
        this.showError('Failed to fetch affected assets. Please try again.');
      },
      complete: () => {
        this.loadingTableInfo = false;
      }
    });
  }

  private loadBenchmarkIds() {
    this.subscriptions.add(
      this.sharedService.getSTIGsFromSTIGMAN().subscribe({
        next: (data: STIGData[]) => {
          this.benchmarkIds = [...new Set(data.map(stig => stig.benchmarkId))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
          this.updateBenchmarkFilter();
        },
        error: (error) => {
          console.error('Error loading STIG data:', error);
          this.showError('Failed to load benchmark IDs. Please try again.');
        }
      })
    );
  }

  private updateBenchmarkFilter(): void {
    const benchmarkColumn = this.allColumns.find(col => col.field === 'benchmarkId');
    if (benchmarkColumn) {
      benchmarkColumn.filterOptions = this.benchmarkIds.map(id => ({
        label: id,
        value: id
      }));
    }
  }

  onBenchmarkFilterChange(event: any, filterCallback: Function) {
    if (!event || !event.value) {
      filterCallback(null);
      this.displayDataSource = [...this.dataSource];
    } else {
      const selectedValues = event.value;
      this.selectedBenchmarkIds = selectedValues;

      filterCallback(selectedValues);

      this.displayDataSource = this.dataSource.filter(item =>
        selectedValues.length === 0 || selectedValues.includes(item.benchmarkId)
      );
    }

    this.findingsCount = this.displayDataSource.length;
    const findings = this.processSeverityGroupsFromDisplayData();
    this.updateFindingsChartData(findings);
  }

  onBenchmarkFilterClear(_event: any, filterCallback: Function) {
  this.selectedBenchmarkIds = [];
  filterCallback(null);
  this.displayDataSource = [...this.dataSource];
  this.findingsCount = this.displayDataSource.length;
  const findings = this.processSeverityGroupsFromDisplayData();
  this.updateFindingsChartData(findings);
}

  private mapSeverity(severity: string): string {
    switch (severity) {
      case 'high': return 'CAT I - High';
      case 'medium': return 'CAT II - Medium';
      case 'low': return 'CAT III - Low';
      default: return severity;
    }
  }

  private processSeverityGroups(data: any[]) {
    const severityGroups = data.reduce((groups: any, item: any) => {
      const severity = this.mapSeverity(item.severity);
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

    return findings.sort(
      (a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity)
    );
  }

  updateSort(event: any) {
    this.multiSortMeta = event.multiSortMeta;
  }

  filterFindings() {
    this.poamService.getPluginIDsWithPoamByCollection(this.selectedCollection)
      .subscribe({
        next: (response: any) => {
          this.existingPoams = response;
          this.updateExistingPoams();
          const findings = this.processSeverityGroupsFromDisplayData();
          this.updateFindingsChartData(findings);
        },
        error: (error) => {
          console.error('Error retrieving existing POAMs:', error);
          this.showError('Error retrieving existing POAMs. Please try again.');
        }
      });
  }

  private updateExistingPoams() {
    this.dataSource.forEach(item => {
      const existingPoam = this.existingPoams.find(
        (poam: any) => poam.vulnerabilityId === item.groupId
      );
      item.hasExistingPoam = !!existingPoam;
      item.poamStatus = existingPoam ? existingPoam.status : 'No Existing POAM';
    });

    this.displayDataSource = [...this.dataSource];
    this.findingsCount = this.displayDataSource.length;
  }

  private processSeverityGroupsFromDisplayData() {
    const severityGroups = this.displayDataSource.reduce(
      (groups: Record<string, number>, item) => {
        if (!groups[item.severity]) {
          groups[item.severity] = 0;
        }
        groups[item.severity]++;
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

    return findings.sort(
      (a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity)
    );
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

  updateChartAndGrid(existingPoams: any[]) {
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

  addPoam(rowData: any): void {
    if (!rowData?.ruleId || !rowData?.groupId) {
      this.showError('Invalid data for POAM creation. Please try again.');
      return;
    }

    this.sharedService.getRuleDataFromSTIGMAN(rowData.ruleId)
      .subscribe({
        next: (ruleData: any) => {
          const ruleDataString = this.formatRuleData(ruleData);
          const descriptionString = this.formatDescription(ruleData);
          this.navigateToPoam(rowData, ruleDataString, descriptionString);
        },
        error: (error) => {
          console.error('Error retrieving rule data from STIGMAN:', error);
          this.showError('Error retrieving rule data. Please try again.');
        }
      });
  }

  private formatRuleData(ruleData: any): string {
    return `# Rule data from STIGMAN
## Discussion
${ruleData.detail.vulnDiscussion}
---

## Check
${ruleData.check.content}
---

## Fix
${ruleData.fix.text}
---`;
  }

  private formatDescription(ruleData: any): string {
    return `Title:
${ruleData.title}

Description:
${ruleData.detail.vulnDiscussion}`;
  }

  private navigateToPoam(rowData: any, ruleDataString: string, descriptionString: string) {
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

    routePath += existingPoam ? existingPoam.poamId : 'ADDPOAM';
    this.router.navigate([routePath], routeParams);
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

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
