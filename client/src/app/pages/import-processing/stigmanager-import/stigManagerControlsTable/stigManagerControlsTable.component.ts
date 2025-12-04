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
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { PoamService } from '../../../poam-processing/poams.service';

interface ControlSummary {
  control: string;
  cciCount: number;
  findingCount: number;
  assetCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  ccis: string[];
  groupIds: string[];
  poamCount: number;
  poamPercentage: number;
}

interface ControlFinding {
  groupId: string;
  groupTitle: string;
  ruleId: string;
  ruleTitle: string;
  severity: string;
  assetCount: number;
  control: string;
  apAcronym: string;
  benchmarkId: string;
  hasExistingPoam: boolean;
  poamStatus?: string;
  isAssociated?: boolean;
  parentStatus?: string;
  parentPoamId?: number;
}

interface RawCciFinding {
  cci: string;
  definition: string;
  apAcronym: string;
  assetCount: number;
  rules: Array<{
    title: string;
    ruleId: string;
    version: string;
    severity: string;
  }>;
  groups: Array<{
    title: string;
    groupId: string;
    severity: string;
  }>;
  stigs: Array<{
    ruleCount: number;
    benchmarkId: string;
    revisionStr: string;
    benchmarkDate: string;
    revisionPinned: boolean;
  }>;
  ccis: Array<{
    cci: string;
    control: string;
    apAcronym: string;
    definition: string;
  }>;
}

@Component({
  selector: 'cpat-stigmanager-controls-table',
  templateUrl: './stigManagerControlsTable.component.html',
  styleUrls: ['./stigManagerControlsTable.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule, ProgressBarModule, SkeletonModule, TableModule, TagModule, TooltipModule]
})
export class STIGManagerControlsTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stigmanCollectionId!: number;
  @Input() selectedCollection!: number;
  @Output() controlsCountChange = new EventEmitter<number>();

  private router = inject(Router);
  private sharedService = inject(SharedService);
  private messageService = inject(MessageService);
  private poamService = inject(PoamService);

  readonly controlsTable = viewChild<Table>('controlsTable');
  readonly findingsTable = viewChild<Table>('controlFindingsTable');

  controlSummaries: ControlSummary[] = [];
  controlFindings: ControlFinding[] = [];
  existingPoams: any[] = [];

  selectedControl: ControlSummary | null = null;
  viewMode: 'summary' | 'findings' = 'summary';

  loadingControls: boolean = true;
  loadingFindings: boolean = false;
  loadingSkeletonData: any[] = Array(15).fill({});

  controlsCount: number = 0;
  findingsCount: number = 0;

  private rawFindings: RawCciFinding[] = [];
  private subscriptions = new Subscription();

  controlColumns = [
    { field: 'control', header: 'Control', width: '14%', filterType: 'text' },
    { field: 'poamPercentage', header: 'POAM %', width: '10%', filterType: 'numeric' },
    { field: 'cciCount', header: 'CCIs', width: '10%', filterType: 'numeric' },
    { field: 'assetCount', header: 'Total Assets', width: '12%', filterType: 'numeric' },
    { field: 'findingCount', header: 'Total Findings', width: '12%', filterType: 'numeric' },
    { field: 'highCount', header: 'CAT I', width: '10%', filterType: 'numeric' },
    { field: 'mediumCount', header: 'CAT II', width: '10%', filterType: 'numeric' },
    { field: 'lowCount', header: 'CAT III', width: '10%', filterType: 'numeric' }
  ];

  findingColumns = [
    {
      field: 'poam',
      header: 'POAM',
      width: '6%',
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
    { field: 'groupId', header: 'Group ID', width: '10%', filterType: 'text' },
    { field: 'control', header: 'Control', width: '8%', filterType: 'text' },
    { field: 'apAcronym', header: 'AP Acronym', width: '10%', filterType: 'text' },
    { field: 'ruleTitle', header: 'Rule Title', width: '28%', filterType: 'text' },
    { field: 'benchmarkId', header: 'Benchmark', width: '14%', filterType: 'text' },
    {
      field: 'severity',
      header: 'Severity',
      width: '12%',
      filterType: 'multi',
      filterOptions: [
        { label: 'CAT I - High', value: 'CAT I - High' },
        { label: 'CAT II - Medium', value: 'CAT II - Medium' },
        { label: 'CAT III - Low', value: 'CAT III - Low' }
      ]
    },
    { field: 'assetCount', header: 'Assets', width: '8%', filterType: 'numeric' }
  ];

  ngOnInit() {
    if (this.stigmanCollectionId) {
      this.loadControlsData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stigmanCollectionId'] && !changes['stigmanCollectionId'].firstChange) {
      this.loadControlsData();
    }
  }

  private loadControlsData() {
    this.loadingControls = true;
    this.rawFindings = [];
    this.controlSummaries = [];

    this.sharedService.getFindingsByCCIFromSTIGMAN(this.stigmanCollectionId).subscribe({
      next: (data: RawCciFinding[]) => {
        if (!data || data.length === 0) {
          this.showWarn('No control findings found.');
          this.loadingControls = false;
          return;
        }

        this.rawFindings = data;
        this.processControlSummaries(data);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch control data: ${getErrorMessage(error)}`
        });
        this.loadingControls = false;
      }
    });
  }

  private processControlSummaries(findings: RawCciFinding[]) {
    const controlMap = new Map<string, ControlSummary>();

    findings.forEach((finding) => {
      const control = finding.ccis?.[0]?.control || 'Unassigned';
      const cci = finding.cci;

      if (!controlMap.has(control)) {
        controlMap.set(control, {
          control,
          cciCount: 0,
          assetCount: 0,
          findingCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          ccis: [],
          groupIds: [],
          poamCount: 0,
          poamPercentage: 0
        });
      }

      const summary = controlMap.get(control)!;

      if (!summary.ccis.includes(cci)) {
        summary.ccis.push(cci);
        summary.cciCount++;
      }

      finding.groups?.forEach((group) => {
        if (!summary.groupIds.includes(group.groupId)) {
          summary.groupIds.push(group.groupId);
        }

        summary.findingCount++;

        switch (group.severity) {
          case 'high':
            summary.highCount++;
            break;
          case 'medium':
            summary.mediumCount++;
            break;
          case 'low':
            summary.lowCount++;
            break;
        }
      });

      summary.assetCount += finding.assetCount || 0;
    });

    this.controlSummaries = Array.from(controlMap.values()).sort((a, b) => a.control.localeCompare(b.control, undefined, { numeric: true }));

    this.controlsCount = this.controlSummaries.length;
    this.controlsCountChange.emit(this.controlsCount);

    this.updateControlPoamPercentages();
  }

  private updateControlPoamPercentages() {
    if (!this.selectedCollection) {
      this.loadingControls = false;
      return;
    }

    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection).subscribe({
      next: (response: any) => {
        this.existingPoams = response;

        const excludedStatuses = new Set(['draft', 'rejected']);
        const validPoams = response.filter((p: any) => {
          const effectiveStatus = p.status === 'Associated' ? p.parentStatus : p.status;
          return effectiveStatus && !excludedStatuses.has(effectiveStatus.toLowerCase());
        });

        const poamVulnIds = new Set(validPoams.map((p: any) => p.vulnerabilityId));

        this.controlSummaries.forEach((summary) => {
          summary.poamCount = summary.groupIds.filter((gid) => poamVulnIds.has(gid)).length;
          summary.poamPercentage = summary.findingCount > 0 ? Math.round((summary.poamCount / summary.findingCount) * 100) : 0;
        });

        this.controlSummaries = [...this.controlSummaries];
        this.loadingControls = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching POAM data: ${getErrorMessage(error)}`
        });
        this.loadingControls = false;
      }
    });
  }

  selectControl(control: ControlSummary) {
    this.selectedControl = control;
    this.viewMode = 'findings';
    this.loadFindingsForControl(control);
  }

  private loadFindingsForControl(control: ControlSummary) {
    this.loadingFindings = true;
    this.controlFindings = [];

    const controlCcis = new Set(control.ccis);
    const findings: ControlFinding[] = [];
    const seenGroupIds = new Set<string>();

    this.rawFindings.forEach((finding) => {
      if (!controlCcis.has(finding.cci)) {
        return;
      }

      finding.groups?.forEach((group, groupIndex) => {
        const uniqueKey = `${group.groupId}-${finding.cci}`;
        if (seenGroupIds.has(uniqueKey)) {
          return;
        }
        seenGroupIds.add(uniqueKey);

        const rule = finding.rules?.[groupIndex] || finding.rules?.[0];
        const stig = finding.stigs?.[groupIndex] || finding.stigs?.[0];

        findings.push({
          groupId: group.groupId,
          control: finding.ccis?.[0]?.control || '',
          groupTitle: group.title,
          ruleId: rule?.ruleId || '',
          ruleTitle: rule?.title || '',
          severity: this.mapSeverity(group.severity),
          assetCount: finding.assetCount || 0,
          apAcronym: finding.apAcronym || finding.ccis?.[0]?.apAcronym || '',
          benchmarkId: stig?.benchmarkId || '',
          hasExistingPoam: false
        });
      });
    });

    this.controlFindings = findings;
    this.findingsCount = findings.length;
    this.loadingFindings = false;

    this.updateExistingPoams();
  }

  private updateExistingPoams() {
    if (!this.selectedCollection) {
      return;
    }

    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection).subscribe({
      next: (response: any) => {
        this.existingPoams = response;

        this.controlFindings.forEach((item) => {
          const existingPoam = this.existingPoams.find((poam: any) => poam.vulnerabilityId === item.groupId);

          item.hasExistingPoam = !!existingPoam;

          if (existingPoam) {
            item.poamStatus = existingPoam.status;
            item.isAssociated = existingPoam.status === 'Associated';
            item.parentStatus = existingPoam.parentStatus;
            item.parentPoamId = existingPoam.parentPoamId;
          } else {
            item.poamStatus = 'No Existing POAM';
            item.isAssociated = false;
          }
        });

        this.controlFindings = [...this.controlFindings];
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

  backToControlSummary() {
    this.viewMode = 'summary';
    this.selectedControl = null;
    this.controlFindings = [];
    this.findingsCount = 0;
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

  getPoamStatusColor(status: string, parentStatus?: string): string {
    const effectiveStatus = status === 'Associated' && parentStatus ? parentStatus : status;

    switch (effectiveStatus?.toLowerCase()) {
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
      default:
        return 'gray';
    }
  }

  getPoamStatusIcon(status: string, isAssociated?: boolean): string {
    if (isAssociated) {
      return 'pi pi-info-circle';
    }

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
        return 'pi pi-check-circle';
      default:
        return 'pi pi-question-circle';
    }
  }

  getPoamStatusTooltip(status: string | undefined, hasExistingPoam: boolean, parentStatus?: string): string {
    if (!hasExistingPoam) return 'No Existing POAM. Click to create draft POAM.';
    if (!status) return 'POAM Status Unknown. Click to view POAM.';

    if (hasExistingPoam && status === 'Associated') {
      const parentStatusText = parentStatus ? ` (Parent POAM Status: ${parentStatus})` : '';
      return `This vulnerability is associated with an existing POAM${parentStatusText}. Click icon to view POAM.`;
    }

    return `POAM Status: ${status}. Click to view POAM.`;
  }

  addPoam(rowData: ControlFinding): void {
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

  private navigateToPoam(rowData: ControlFinding, ruleDataString: string, descriptionString: string) {
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

  filterControlsGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.controlsTable()?.filterGlobal(inputValue, 'contains');
  }

  filterFindingsGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.findingsTable()?.filterGlobal(inputValue, 'contains');
  }

  onControlsFilter(_event: any) {
    const table = this.controlsTable();
    if (table) {
      this.controlsCount = table.filteredValue ? table.filteredValue.length : this.controlSummaries.length;
      this.controlsCountChange.emit(this.controlsCount);
    }
  }

  onFindingsFilter(_event: any) {
    const table = this.findingsTable();
    if (table) {
      this.findingsCount = table.filteredValue ? table.filteredValue.length : this.controlFindings.length;
    }
  }

  clearControlsFilter() {
    this.controlsTable()?.clear();
  }

  clearFindingsFilter() {
    this.findingsTable()?.clear();
  }

  exportControlsCSV() {
    this.controlsTable()?.exportCSV();
  }

  exportFindingsCSV() {
    this.findingsTable()?.exportCSV();
  }

  private showWarn(message: string) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: message
    });
  }

  private showError(message: string) {
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
