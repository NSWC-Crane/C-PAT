/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { PoamService } from '../../poam-processing/poams.service';
import { STIGManagerReviewsTableComponent } from './stigManagerReviewsTable/stigManagerReviewsTable.component';

interface STIGManagerFinding {
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
    FormsModule,
    InputTextModule,
    MultiSelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    ToastModule,
    TooltipModule,
    STIGManagerReviewsTableComponent,
    InputIconModule,
    IconFieldModule,
    ProgressBarModule,
    TagModule
  ],
  providers: [MessageService]
})
export class STIGManagerImportComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private userService = inject(UsersService);
  private messageService = inject(MessageService);
  private poamService = inject(PoamService);

  @ViewChild('stigFindingsTable') findingsTable!: Table;
  @ViewChild('stigBenchmarksTable') benchmarksTable!: Table;
  allColumns = [
    {
      field: 'poam',
      header: 'POAM',
      width: '8%',
      filterField: 'poamStatus',
      filterType: 'multi',
      filterOptions: [
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
        { label: 'Submitted', value: 'Submitted' }
      ]
    },
    { field: 'groupId', header: 'Group ID', width: '12%', filterType: 'text' },
    { field: 'ruleTitle', header: 'Rule Title', width: '35%', filterType: 'text' },
    {
      field: 'benchmarkId',
      header: 'Benchmark ID',
      width: '15%',
      filterType: 'multi',
      filterOptions: [{ label: 'Any', value: null }]
    },
    {
      field: 'severity',
      header: 'Severity',
      width: '15%',
      filterType: 'text',
      filterOptions: [
        { label: 'CAT I - High', value: 'CAT I - High' },
        { label: 'CAT II - Medium', value: 'CAT II - Medium' },
        { label: 'CAT III - Low', value: 'CAT III - Low' }
      ]
    },
    { field: 'assetCount', header: 'Asset Count', width: '15%', filterType: 'numeric' }
  ];
  private dataSource: STIGManagerFinding[] = [];
  public displayDataSource: STIGManagerFinding[] = [];
  public existingPoams: any[] = [];
  loadingTableInfo: boolean = true;
  loadingSkeletonData: any[] = Array(15).fill({});
  multiSortMeta: any[] = [];
  selectedCollection: any;
  stigmanCollection: any;
  user: any;
  benchmarkSummaries: any[] = [];
  selectedBenchmark: any = null;
  viewMode: 'summary' | 'findings' = 'summary';
  private subscriptions = new Subscription();
  findingsCount: number = 0;
  reviewsCount: number = 0;

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      })
    );
    this.initializeComponent();
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `An error occurred while initializing the component: ${getErrorMessage(error)}`
        });
      }
    });
  }

  getSeverityStyling(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (severity) {
      case 'CAT I - High':
        return 'danger';
      case 'CAT II - Medium':
        return 'warn';
      case 'CAT III - Low':
        return 'info';
      default:
        return 'info';
    }
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';

    this.findingsTable.filterGlobal(inputValue, 'contains');
  }

  validateStigManagerCollection() {
    this.collectionsService.getCollectionBasicList().subscribe({
      next: (basicListData) => {
        const selectedCollection = basicListData?.find((collection) => +collection.collectionId === +this.user.lastCollectionAccessedId);

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
          name: selectedCollection.collectionName
        };

        if (!this.stigmanCollection.collectionId) {
          this.showWarn('Unable to determine the matching STIG Manager collection ID. Please try again.');

          return;
        }

        this.loadBenchmarkSummaries(this.stigmanCollection.collectionId);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to validate STIG Manager collection: ${getErrorMessage(error)}`
        });
      }
    });
  }

  private loadBenchmarkSummaries(stigmanCollectionId: number) {
    this.loadingTableInfo = true;
    this.sharedService.getCollectionSTIGSummaryFromSTIGMAN(stigmanCollectionId).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.showWarn('No benchmark summaries found.');
          this.loadingTableInfo = false;

          return;
        }

        this.benchmarkSummaries = data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch benchmark summaries: ${getErrorMessage(error)}`
        });
      },
      complete: () => {
        this.loadingTableInfo = false;
      }
    });
  }

  selectBenchmark(benchmark: any) {
    this.selectedBenchmark = benchmark;
    this.viewMode = 'findings';
    this.getSTIGMANFindings(this.stigmanCollection.collectionId, benchmark.benchmarkId);
  }

  getAllFindings() {
    this.viewMode = 'findings';
    this.getSTIGMANFindings(this.stigmanCollection.collectionId);
  }

  backToBenchmarkSummary() {
    this.viewMode = 'summary';
    this.selectedBenchmark = null;
    this.dataSource = [];
    this.displayDataSource = [];
    this.findingsCount = 0;
  }

  getSTIGMANFindings(stigmanCollectionId: number, benchmarkId?: string) {
    this.loadingTableInfo = true;

    const apiCall = benchmarkId ? this.sharedService.getFindingsByBenchmarkFromSTIGMAN(stigmanCollectionId, benchmarkId) : this.sharedService.getFindingsFromSTIGMAN(stigmanCollectionId);

    apiCall.subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.showWarn('No affected assets found' + (benchmarkId ? ' for this benchmark.' : '.'));
          this.loadingTableInfo = false;

          return;
        }

        this.dataSource = data.map((item) => ({
          groupId: item.groupId,
          ruleTitle: item.rules[0].title,
          ruleId: item.rules[0].ruleId,
          benchmarkId: item.stigs[0].benchmarkId,
          severity: this.mapSeverity(item.severity),
          assetCount: item.assetCount,
          hasExistingPoam: false
        }));

        this.displayDataSource = [...this.dataSource];
        this.findingsCount = this.displayDataSource.length;
        this.filterFindings();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch affected assets: ${getErrorMessage(error)}`
        });
      },
      complete: () => {
        this.loadingTableInfo = false;
      }
    });
  }

  private mapSeverity(severity: string): string {
    switch (severity) {
      case 'high':
        return 'CAT I - High';
      case 'medium':
        return 'CAT II - Medium';
      case 'low':
        return 'CAT III - Low';
      default:
        return severity;
    }
  }

  updateSort(event: any) {
    this.multiSortMeta = event.multiSortMeta;
  }

  filterFindings() {
    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection).subscribe({
      next: (response: any) => {
        this.existingPoams = response;
        this.updateExistingPoams();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching existing POAMs: ${getErrorMessage(error)}`
        });
      }
    });
  }

  private updateExistingPoams() {
    this.dataSource.forEach((item) => {
      const existingPoam = this.existingPoams.find((poam: any) => poam.vulnerabilityId === item.groupId);

      item.hasExistingPoam = !!existingPoam;
      item.poamStatus = existingPoam ? existingPoam.status : 'No Existing POAM';
    });

    this.displayDataSource = [...this.dataSource];
    this.findingsCount = this.displayDataSource.length;
  }

  getPoamStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'darkorange';
      case 'expired':
      case 'rejected':
        return 'firebrick';
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
        return 'goldenrod';
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

  getPoamStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'no existing poam':
        return 'pi pi-plus-circle';
      case 'expired':
      case 'rejected':
        return 'pi pi-ban';
      case 'draft':
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
      case 'false-positive':
      case 'closed':
      case 'approved':
      case 'associated':
        return 'pi pi-check-circle';
      default:
        return 'pi pi-question-circle';
    }
  }

  getPoamStatusTooltip(status: string | undefined, hasExistingPoam: boolean): string {
    if (!hasExistingPoam) return 'No Existing POAM. Click to create draft POAM.';
    if (!status) return 'POAM Status Unknown. Click to view POAM.';
    if (hasExistingPoam && status === 'Associated') return 'This vulnerability is associated with an existing master POAM. Click icon to view POAM.';

    return `POAM Status: ${status}. Click to view POAM.`;
  }

  addPoam(rowData: any): void {
    if (!rowData?.ruleId || !rowData?.groupId) {
      this.showError('Invalid data for POAM creation. Please try again.');

      return;
    }

    this.sharedService.getRuleDataFromSTIGMAN(rowData.ruleId).subscribe({
      next: (ruleData: any) => {
        const ruleDataString = this.formatRuleData(ruleData);
        const descriptionString = this.formatDescription(ruleData);

        this.navigateToPoam(rowData, ruleDataString, descriptionString);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching rule data: ${getErrorMessage(error)}`
        });
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
        description: descriptionString
      }
    };

    const existingPoam = this.existingPoams.find((item: any) => item.vulnerabilityId === rowData.groupId);

    routePath += existingPoam ? existingPoam.poamId : 'ADDPOAM';
    this.router.navigate([routePath], routeParams);
  }

  onFilter(_event: any) {
    if (this.findingsTable) {
      if (this.findingsTable.filteredValue) {
        this.findingsCount = this.findingsTable.filteredValue.length;
      } else {
        this.findingsCount = this.displayDataSource.length;
      }
    }
  }

  exportCSV() {
    this.findingsTable.exportCSV();
  }

  filterBenchmarkGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';

    this.benchmarksTable.filterGlobal(inputValue, 'contains');
  }

  onReviewsCountChange(count: number) {
    this.reviewsCount = count;
  }

  clearBenchmarkFilter() {
    if (this.benchmarksTable) {
      this.benchmarksTable.clear();
    }
  }

  clear() {
    this.findingsTable.clear();
  }

  showWarn(message: string) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warn',
      detail: message
    });
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
