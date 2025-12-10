/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { PoamService } from '../../../poams.service';

@Component({
  selector: 'cpat-poam-teams',
  templateUrl: './poam-teams.component.html',
  standalone: true,
  imports: [FormsModule, TableModule, ProgressBarModule, SelectModule, ButtonModule, ToastModule]
})
export class PoamTeamsComponent {
  private messageService = inject(MessageService);

  @Input() poam: any;
  @Input() accessLevel: number;
  @Input() poamAssignedTeams: any[] = [];
  @Input() assignedTeamOptions: any[] = [];
  @Input() loading: boolean = false;
  @Input() poamService!: PoamService;
  readonly teamsChanged = output<{
    teams: any[];
    action: string;
    team?: any;
  }>();

  async addAssignedTeam() {
    const newAssignedTeam = {
      poamId: this.poam.poamId === 'ADDPOAM' ? 0 : +this.poam.poamId,
      assignedTeamId: null,
      assignedTeamName: '',
      isNew: true
    };

    this.poamAssignedTeams = [newAssignedTeam, ...this.poamAssignedTeams];
    this.teamsChanged.emit({ teams: this.poamAssignedTeams, action: 'added', team: newAssignedTeam });
  }

  async onAssignedTeamChange(assignedTeam: any, rowIndex: number) {
    if (assignedTeam.assignedTeamId) {
      const selectedTeam = this.assignedTeamOptions.find((team: any) => team.assignedTeamId === assignedTeam.assignedTeamId);

      assignedTeam.assignedTeamName = selectedTeam ? selectedTeam.assignedTeamName : '';

      assignedTeam.isNew = false;
      this.teamsChanged.emit({ teams: this.poamAssignedTeams, action: 'added', team: assignedTeam });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${assignedTeam.assignedTeamName} added to assigned teams list.`
      });
    } else {
      this.poamAssignedTeams.splice(rowIndex, 1);
      this.teamsChanged.emit({ teams: this.poamAssignedTeams, action: 'updated' });
    }
  }

  async deleteAssignedTeam(assignedTeam: any, rowIndex: number) {
    this.poamAssignedTeams = this.poamAssignedTeams.filter((_a, index) => index !== rowIndex);
    this.teamsChanged.emit({
      teams: this.poamAssignedTeams,
      action: 'deleted',
      team: assignedTeam
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${assignedTeam.assignedTeamName || 'Team'} removed from assigned teams list.`
    });
  }

  async confirmCreateAssignedTeam(newAssignedTeam: any) {
    let assignedTeamName = newAssignedTeam.assignedTeamName;

    if (!assignedTeamName) {
      const matchingTeam = this.assignedTeamOptions.find((team: any) => team.assignedTeamId === newAssignedTeam.assignedTeamId);

      assignedTeamName = matchingTeam ? matchingTeam.assignedTeamName : 'Team';
    }

    if (this.poam.poamId !== 'ADDPOAM' && newAssignedTeam.assignedTeamId) {
      const poamAssignedTeam = {
        poamId: +this.poam.poamId,
        assignedTeamId: +newAssignedTeam.assignedTeamId
      };

      try {
        await firstValueFrom(this.poamService.postPoamAssignedTeam(poamAssignedTeam));

        const updatedTeams = await firstValueFrom(this.poamService.getPoamAssignedTeams(this.poam.poamId));

        this.poamAssignedTeams = updatedTeams;
        this.teamsChanged.emit({
          teams: this.poamAssignedTeams,
          action: 'saved',
          team: newAssignedTeam
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${assignedTeamName} was successfully added to the assigned teams list`
        });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to add team: ${getErrorMessage(error)}`
        });
      }
    } else if (this.poam.poamId === 'ADDPOAM' && newAssignedTeam.assignedTeamId) {
      newAssignedTeam.assignedTeamName = assignedTeamName;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${assignedTeamName} was successfully added to the assigned teams list`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create entry. Invalid input.'
      });
    }
  }

  confirmDeleteAssignedTeam(assignedTeamData: any) {
    let assignedTeamName = assignedTeamData.assignedTeamName || '';

    if (this.poam.poamId !== 'ADDPOAM' && assignedTeamData.assignedTeamId) {
      this.poamService.deletePoamAssignedTeam(+this.poam.poamId, +assignedTeamData.assignedTeamId).subscribe({
        next: () => {
          this.poamAssignedTeams = this.poamAssignedTeams.filter((a: any) => a.assignedTeamId !== assignedTeamData.assignedTeamId);
          this.teamsChanged.emit({ teams: this.poamAssignedTeams, action: 'deleted', team: assignedTeamData });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${assignedTeamName} was removed as an assigned team`
          });
        },
        error: (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to remove assigned team: ${getErrorMessage(error)}`
          });
        }
      });
    } else if (this.poam.poamId === 'ADDPOAM' && assignedTeamData.assignedTeamId) {
      this.poamAssignedTeams = this.poamAssignedTeams.filter((a: any) => a.assignedTeamId !== assignedTeamData.assignedTeamId);
      this.teamsChanged.emit({ teams: this.poamAssignedTeams, action: 'deleted', team: assignedTeamData });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${assignedTeamName} was removed as an assigned team`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete entry. Invalid input.'
      });
    }
  }
}
