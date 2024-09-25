/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AssignedTeamService } from './assignedTeam-processing.service';

interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
}

@Component({
  selector: 'assigned-team-processing',
  templateUrl: './assignedTeam-processing.component.html',
  styleUrls: ['./assignedTeam-processing.component.scss'],
})
export class AssignedTeamProcessingComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  assignedTeams: AssignedTeam[] = [];
  newAssignedTeam: AssignedTeam = { assignedTeamId: 0, assignedTeamName: '' };
  editingAssignedTeam: AssignedTeam | null = null;

  constructor(
    private assignedTeamService: AssignedTeamService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.loadAssignedTeams();
  }

  async loadAssignedTeams() {
    try {
      const response = await (
        await this.assignedTeamService.getAssignedTeams()
      ).toPromise();
      this.assignedTeams = response || [];
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load Assigned Teams',
      });
    }
  }

  onAddNewClick() {
    this.assignedTeams = [this.newAssignedTeam, ...this.assignedTeams];
    this.editingAssignedTeam = this.newAssignedTeam;
    this.newAssignedTeam = { assignedTeamId: 0, assignedTeamName: '' };
  }

  onRowEditInit(assignedTeam: AssignedTeam) {
    this.editingAssignedTeam = { ...assignedTeam };
  }

  async onRowEditSave(assignedTeam: AssignedTeam) {
    try {
      if (assignedTeam.assignedTeamId === 0) {
        const response = await (
          await this.assignedTeamService.postAssignedTeam(assignedTeam)
        ).toPromise();
        const index = this.assignedTeams.findIndex(
          (p) => p.assignedTeamId === 0,
        );
        this.assignedTeams[index] = response!;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assigned Team Added',
        });
      } else {
        await (
          await this.assignedTeamService.putAssignedTeam(assignedTeam)
        ).toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assigned Team Updated',
        });
      }
      this.editingAssignedTeam = null;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save Assigned Team',
      });
    }
  }

  onRowEditCancel(assignedTeam: AssignedTeam, index: number) {
    if (assignedTeam.assignedTeamId === 0) {
      this.assignedTeams = this.assignedTeams.filter(
        (p) => p.assignedTeamId !== 0,
      );
    } else {
      this.assignedTeams[index] = this.editingAssignedTeam!;
    }
    this.editingAssignedTeam = null;
  }

  async onRowDelete(assignedTeam: AssignedTeam) {
    try {
      await (
        await this.assignedTeamService.deleteAssignedTeam(
          assignedTeam.assignedTeamId,
        )
      ).toPromise();
      this.assignedTeams = this.assignedTeams.filter(
        (p) => p.assignedTeamId !== assignedTeam.assignedTeamId,
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Assigned Team Deleted',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete Assigned Team',
      });
    }
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }
}
