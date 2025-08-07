/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, computed, signal, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addDays, format } from 'date-fns';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

interface AssignedTeam {
  name: string;
  complete: 'true' | 'false' | 'partial' | 'global';
}

interface PoamAssignedData {
  poamId: string;
  vulnerabilityId: string;
  affectedAssets: number;
  isAffectedAssetsLoading: boolean;
  isAffectedAssetsMissing: boolean;
  hasAssociatedVulnerabilities: boolean;
  associatedVulnerabilitiesTooltip: string;
  scheduledCompletionDate: string;
  adjSeverity: string;
  status: string;
  owner: string;
  assignedTeams: AssignedTeam[];
  labels: string[];
}

interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  tooltip?: string;
  width?: string;
  customSort?: any;
}

@Component({
  selector: 'cpat-poam-assigned-grid',
  templateUrl: './poam-assigned-grid.component.html',
  styleUrls: ['./poam-assigned-grid.component.scss'],
  standalone: true,
  imports: [ButtonModule, FormsModule, TableModule, ProgressSpinnerModule, IconFieldModule, InputIconModule, InputTextModule, TagModule, TooltipModule]
})
export class PoamAssignedGridComponent {
  private router = inject(Router);
  private statusSortCycle = signal<number>(0);
  private readonly STATUS_SORT_CYCLES = 4;
  readonly table = viewChild.required<Table>('dt');
  @Input() userId!: number;

  private readonly statusPriorityGroups = [
    {
      groups: []
    },
    {
      name: 'Critical First',
      icon: 'pi-exclamation-circle',
      groups: [
        ['Expired', 'Rejected'],
        ['Extension Requested', 'Pending CAT-I Approval', 'Submitted'],
        ['Approved', 'Closed', 'False-Positive'],
        ['Draft', 'Associated']
      ]
    },
    {
      name: 'In-Progress First',
      icon: 'pi-info-circle',
      groups: [['Draft', 'Submitted', 'Extension Requested'], ['Pending CAT-I Approval', 'Associated'], ['Approved'], ['Expired', 'Rejected', 'Closed', 'False-Positive']]
    },
    {
      name: 'Completed First',
      icon: 'pi-check-circle',
      groups: [
        ['Closed', 'False-Positive', 'Approved'],
        ['Submitted', 'Pending CAT-I Approval', 'Extension Requested'],
        ['Rejected', 'Expired'],
        ['Draft', 'Associated']
      ]
    }
  ];

  protected readonly columns: ColumnConfig[] = [
    { field: 'poamId', header: 'POAM ID', sortable: true },
    { field: 'vulnerabilityId', header: 'Vulnerability ID', sortable: true },
    { field: 'affectedAssets', header: 'Affected Assets', sortable: true },
    {
      field: 'scheduledCompletionDate',
      header: 'Scheduled Completion',
      sortable: true,
      tooltip: 'Date shown includes extension time if applicable'
    },
    { field: 'adjSeverity', header: 'Adjusted Severity', sortable: true },
    { field: 'status', header: 'Status', sortable: true, customSort: true },
    { field: 'owner', header: 'Owner', sortable: true },
    { field: 'assignedTeams', header: 'Assigned Team' },
    { field: 'labels', header: 'Labels' }
  ];

  globalFilterSignal = signal<string>('');

  private assignedDataSignal = signal<any[]>([]);
  @Input() set assignedData(value: any[]) {
    this.assignedDataSignal.set(value || []);
  }

  private affectedAssetCountsSignal = signal<{ vulnerabilityId: string; assetCount: number }[]>([]);
  private assetCountsLoaded = signal<boolean>(false);
  private hasReceivedData = false;

  @Input() set affectedAssetCounts(value: { vulnerabilityId: string; assetCount: number }[]) {
    this.affectedAssetCountsSignal.set(value || []);

    if ((value && value.length > 0) || this.hasReceivedData) {
      this.assetCountsLoaded.set(true);

      if (value && value.length > 0) {
        this.hasReceivedData = true;
      }
    }
  }

  displayedData = computed<PoamAssignedData[]>(() => {
    const data = this.assignedDataSignal();
    const assetCounts = this.affectedAssetCountsSignal();
    const assetCountsLoaded = this.assetCountsLoaded();
    const filterValue = this.globalFilterSignal().toLowerCase();

    const assetCountMap = new Map<string, number>();

    assetCounts.forEach((item) => {
      assetCountMap.set(item.vulnerabilityId, item.assetCount);
    });

    const transformedData = data.map((item) => {
      let adjustedDate = new Date(item.scheduledCompletionDate);

      if (item.extensionTimeAllowed && typeof item.extensionTimeAllowed === 'number' && item.extensionTimeAllowed > 0) {
        adjustedDate = addDays(adjustedDate, item.extensionTimeAllowed);
      }

      const primaryCount = assetCountMap.get(item.vulnerabilityId);
      const isAssetsLoading = !assetCountsLoaded;
      const isAssetsMissing = assetCountsLoaded && primaryCount === undefined;

      let hasAssociatedVulnerabilities = false;
      let associatedVulnerabilitiesTooltip = 'Associated Vulnerabilities:';

      if (item.associatedVulnerabilities?.length > 0) {
        hasAssociatedVulnerabilities = true;
        item.associatedVulnerabilities.forEach((vulnId: string) => {
          const associatedCount = assetCountMap.get(vulnId);

          if (associatedCount !== undefined) {
            associatedVulnerabilitiesTooltip += `\n${vulnId}: ${associatedCount}\n`;
          } else {
            associatedVulnerabilitiesTooltip += `\nUnable to load affected assets for Vulnerability ID: ${vulnId}\n`;
          }
        });
      }

      return {
        poamId: item.poamId,
        vulnerabilityId: item.vulnerabilityId,
        affectedAssets: isAssetsLoading || isAssetsMissing ? 0 : Number(primaryCount || 0),
        isAffectedAssetsLoading: isAssetsLoading,
        isAffectedAssetsMissing: isAssetsMissing,
        hasAssociatedVulnerabilities,
        associatedVulnerabilitiesTooltip,
        scheduledCompletionDate: format(adjustedDate, 'yyyy-MM-dd'),
        adjSeverity: item.adjSeverity,
        status: item.status,
        owner: item.ownerName ?? item.submitterName,
        assignedTeams:
          item.assignedTeams?.map((team: any) => ({
            name: team.assignedTeamName,
            complete: team.complete
          })) || [],
        labels: item.labels?.map((label: any) => label.labelName) || []
      };
    });

    if (!filterValue) {
      return transformedData;
    }

    return transformedData.filter((row) => {
      const searchableValues = [row.poamId, row.vulnerabilityId, row.status, row.adjSeverity, row.owner, ...row.assignedTeams.map((team) => team.name), ...row.labels].filter(Boolean);

      return searchableValues.some((value) => value.toString().toLowerCase().includes(filterValue));
    });
  });

  get globalFilter(): string {
    return this.globalFilterSignal();
  }

  set globalFilter(value: string) {
    this.globalFilterSignal.set(value);
  }

  managePoam(row: PoamAssignedData) {
    this.router.navigateByUrl(`/poam-processing/poam-details/${row.poamId}`);
  }

  clear() {
    this.table().clear();
    this.globalFilterSignal.set('');
  }

  getTeamSeverity(complete: string): string {
    switch (complete) {
      case 'true':
        return 'success';
      case 'partial':
        return 'warn';
      case 'global':
        return '';
      default:
        return 'danger';
    }
  }

  getTeamTooltip(complete: string): string {
    switch (complete) {
      case 'true':
        return 'Team has fulfilled all POAM requirements';
      case 'partial':
        return 'Team has partially fulfilled POAM requirements';
      case 'global':
        return 'Global Finding - No Team Requirements';
      default:
        return 'Team has not fulfilled any POAM requirements';
    }
  }

  getCurrentStatusSortIcon(): string {
    const cycle = this.statusSortCycle();

    return this.statusPriorityGroups[cycle].icon;
  }

  getStatusSortIconColor(): string {
    const cycle = this.statusSortCycle();
    const colors = ['', '#e74c3c', '#3498db', '#27ae60'];

    return colors[cycle];
  }

  onStatusHeaderClick(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const currentCycle = this.statusSortCycle();
    const nextCycle = (currentCycle + 1) % this.STATUS_SORT_CYCLES;

    this.statusSortCycle.set(nextCycle);

    if (nextCycle === 0) {
      this.table().value = [...this.displayedData()];
      this.table().cd.detectChanges();

      return;
    }

    const currentData = [...this.displayedData()];
    const priorityConfig = this.statusPriorityGroups[nextCycle];
    const statusPriority = new Map<string, number>();

    priorityConfig.groups.forEach((group, groupIndex) => {
      group.forEach((status, statusIndex) => {
        statusPriority.set(status, groupIndex * 100 + statusIndex);
      });
    });

    currentData.sort((a, b) => {
      const priority1 = statusPriority.get(a.status) ?? 9999;
      const priority2 = statusPriority.get(b.status) ?? 9999;

      if (priority1 !== priority2) {
        return priority1 - priority2;
      }

      return a.status.localeCompare(b.status);
    });

    this.table().value = currentData;
    this.table().cd.detectChanges();
  }

  getCurrentStatusSortName(): string {
    const cycle = this.statusSortCycle();

    return this.statusPriorityGroups[cycle].name;
  }

  resetStatusSort(): void {
    this.statusSortCycle.set(0);
  }
}
