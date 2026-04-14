/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NgTemplateOutlet } from '@angular/common';
import { Component, Input, computed, signal, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addDays, format, isAfter, parseISO, startOfDay } from 'date-fns';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Poam } from '../../../common/models/poam.model';
import { CsvExportService } from '../../../common/utils/csv-export.service';

export interface MilestoneGridRow {
  poamId: number;
  vulnerabilityId: string | null;
  poamStatus: string;
  poamOwnerId: number | null;
  poamSubmitterId: number;
  milestoneId: number | null;
  milestoneDate: string | null;
  milestoneStatus: string | null;
  milestoneComments: string | null;
  milestoneChangeDate: string | null;
  milestoneChangeComments: string | null;
  assignedTeams: { teamId: number; teamName: string }[];
  assignedTeamNames: string;
}

const EXCLUDED_POAM_STATUSES = new Set(['Closed', 'Draft']);

@Component({
  selector: 'cpat-poam-milestone-grid',
  templateUrl: './poam-milestone-grid.component.html',
  styleUrl: './poam-milestone-grid.component.scss',
  standalone: true,
  imports: [NgTemplateOutlet, ButtonModule, CardModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule, TableModule, TabsModule, TagModule, TooltipModule]
})
export class PoamMilestoneGridComponent {
  private router = inject(Router);
  private csvExportService = inject(CsvExportService);

  readonly allTable = viewChild<Table>('allDt');
  readonly needsAttentionTable = viewChild<Table>('needsAttentionDt');
  readonly teamTable = viewChild<Table>('teamDt');

  globalFilterAll = signal<string>('');
  globalFilterNeedsAttention = signal<string>('');
  globalFilterTeam = signal<string>('');

  private poamsSignal = signal<Poam[]>([]);
  @Input() set poams(value: Poam[]) {
    this.poamsSignal.set(value || []);
  }

  private userSignal = signal<any>(null);
  @Input() set user(value: any) {
    this.userSignal.set(value);
  }

  accessLevelSignal = signal<number>(0);
  @Input() set accessLevel(value: number) {
    this.accessLevelSignal.set(value);
  }

  readonly poamStatusOptions = [
    { label: 'Approved', value: 'Approved' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Extension Requested', value: 'Extension Requested' },
    { label: 'False-Positive', value: 'False-Positive' },
    { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Submitted', value: 'Submitted' }
  ];

  readonly milestoneStatusOptions = [
    { label: 'Complete', value: 'Complete' },
    { label: 'Pending', value: 'Pending' }
  ];

  protected readonly columns = [
    { field: 'poamId', header: 'POAM ID', sortable: true },
    { field: 'vulnerabilityId', header: 'Vulnerability ID', sortable: true },
    { field: 'poamStatus', header: 'POAM Status', sortable: true },
    { field: 'milestoneDate', header: 'Milestone Date', sortable: true },
    { field: 'milestoneStatus', header: 'Milestone Status', sortable: true },
    { field: 'milestoneComments', header: 'Comments', sortable: false },
    { field: 'milestoneChangeDate', header: 'Change Date', sortable: true },
    { field: 'milestoneChangeComments', header: 'Change Comments', sortable: false },
    { field: 'assignedTeams', header: 'Assigned Teams', sortable: false }
  ];

  private readonly userTeamIds = computed(() => new Set((this.userSignal()?.assignedTeams ?? []).map((t: any) => t.assignedTeamId)));

  allMilestoneRows = computed<MilestoneGridRow[]>(() => this.flattenMilestones(this.poamsSignal()));

  needsAttentionRows = computed<MilestoneGridRow[]>(() => {
    const threshold = addDays(startOfDay(new Date()), 30);

    return this.allMilestoneRows().filter((row) => {
      if (row.milestoneStatus !== 'Pending') return false;
      if (!row.milestoneDate) return true;
      const date = parseISO(row.milestoneDate.split('T')[0]);

      return !isAfter(date, threshold);
    });
  });

  teamMilestoneRows = computed<MilestoneGridRow[]>(() => {
    const teamIds = this.userTeamIds();

    return this.allMilestoneRows().filter((row) => row.assignedTeams.some((t) => teamIds.has(t.teamId)));
  });

  private flattenMilestones(poams: Poam[]): MilestoneGridRow[] {
    const rows: MilestoneGridRow[] = [];

    for (const poam of poams) {
      if (EXCLUDED_POAM_STATUSES.has(poam.status)) continue;
      if (!poam.milestones?.length) continue;

      for (const m of poam.milestones) {
        if (m.milestoneId == null) continue;

        const apiTeams = m.assignedTeams ?? [];

        rows.push({
          poamId: poam.poamId,
          vulnerabilityId: poam.vulnerabilityId,
          poamStatus: poam.status,
          poamOwnerId: poam.ownerId,
          poamSubmitterId: poam.submitterId,
          milestoneId: m.milestoneId,
          milestoneDate: m.milestoneDate ? format(parseISO(m.milestoneDate.split('T')[0]), 'yyyy-MM-dd') : null,
          milestoneStatus: m.milestoneStatus,
          milestoneComments: m.milestoneComments,
          milestoneChangeDate: m.milestoneChangeDate ? format(parseISO(m.milestoneChangeDate.split('T')[0]), 'yyyy-MM-dd') : null,
          milestoneChangeComments: m.milestoneChangeComments,
          assignedTeams: apiTeams.map((t) => ({ teamId: t.assignedTeamId, teamName: t.assignedTeamName })),
          assignedTeamNames: apiTeams.map((t) => t.assignedTeamName).join(', ')
        });
      }
    }

    return rows;
  }

  managePoam(poamId: number) {
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  getMilestoneStatusSeverity(status: string | null): 'success' | 'warn' | 'secondary' {
    switch (status) {
      case 'Complete':
        return 'success';
      case 'Pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getPoamStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Submitted':
      case 'Extension Requested':
      case 'Pending CAT-I Approval':
        return 'info';
      case 'Rejected':
      case 'Expired':
        return 'danger';
      case 'False-Positive':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  exportToCSV(rows: MilestoneGridRow[], variant: string) {
    if (!rows.length) return;

    const processed = rows.map((row) => ({
      poamId: row.poamId,
      vulnerabilityId: row.vulnerabilityId ?? '',
      poamStatus: row.poamStatus,
      milestoneDate: row.milestoneDate ?? '',
      milestoneStatus: row.milestoneStatus ?? '',
      milestoneComments: row.milestoneComments ?? '',
      assignedTeams: row.assignedTeams.map((t) => t.teamName).join('; '),
      milestoneChangeDate: row.milestoneChangeDate ?? '',
      milestoneChangeComments: row.milestoneChangeComments ?? ''
    }));

    this.csvExportService.exportToCsv(processed, {
      filename: `milestones-${variant}-${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { field: 'poamId', header: 'POAM ID' },
        { field: 'vulnerabilityId', header: 'Vulnerability ID' },
        { field: 'poamStatus', header: 'POAM Status' },
        { field: 'milestoneDate', header: 'Milestone Date' },
        { field: 'milestoneStatus', header: 'Milestone Status' },
        { field: 'milestoneComments', header: 'Comments' },
        { field: 'assignedTeams', header: 'Assigned Teams' },
        { field: 'milestoneChangeDate', header: 'Change Date' },
        { field: 'milestoneChangeComments', header: 'Change Comments' }
      ],
      includeTimestamp: false
    });
  }
}
