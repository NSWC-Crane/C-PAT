/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, catchError, firstValueFrom, forkJoin, map, of } from 'rxjs';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { PoamService } from '../../poams.service';
import { TeamSyncChange } from './team-sync-changes';

@Injectable({
  providedIn: 'root'
})
export class PoamMitigationService {
  private readonly poamService = inject(PoamService);
  private readonly messageService = inject(MessageService);

  loadTeamMitigations(poamId: any): Observable<any[]> {
    if (!poamId || poamId === 'ADDPOAM') {
      return of([]);
    }

    return this.poamService.getPoamTeamMitigations(poamId);
  }

  syncTeamMitigations(poam: any, poamAssignedTeams: any[], teamMitigations: any[]): Observable<TeamSyncChange[]> {
    if (!poamAssignedTeams || poamAssignedTeams.length === 0) {
      return of([]);
    }

    const ops: Observable<TeamSyncChange | null>[] = [];

    poamAssignedTeams.forEach((team) => {
      const existingMitigation = teamMitigations.find((m) => m.assignedTeamId === team.assignedTeamId);

      if (!existingMitigation) {
        ops.push(
          this.poamService
            .postPoamTeamMitigation({
              poamId: poam.poamId,
              assignedTeamId: team.assignedTeamId,
              mitigationText: '',
              isActive: true
            })
            .pipe(
              map((response) => ({
                type: 'add' as const,
                record: {
                  mitigationId: response.mitigationId,
                  assignedTeamId: team.assignedTeamId,
                  assignedTeamName: team.assignedTeamName,
                  mitigationText: '',
                  isActive: true
                }
              })),
              catchError((error) => {
                console.error('Error adding team mitigation:', error);

                return of(null);
              })
            )
        );
      } else if (!existingMitigation.isActive) {
        ops.push(
          this.poamService.updatePoamTeamMitigationStatus(poam.poamId, team.assignedTeamId, true).pipe(
            map(() => ({ type: 'setActive' as const, assignedTeamId: team.assignedTeamId, isActive: true })),
            catchError((error) => {
              console.error('Error updating team mitigation status:', error);

              return of(null);
            })
          )
        );
      }
    });

    teamMitigations.forEach((mitigation) => {
      const teamIsAssigned = poamAssignedTeams.some((team) => team.assignedTeamId === mitigation.assignedTeamId);

      if (!teamIsAssigned && mitigation.isActive) {
        ops.push(
          this.poamService.updatePoamTeamMitigationStatus(poam.poamId, mitigation.assignedTeamId, false).pipe(
            map(() => ({ type: 'setActive' as const, assignedTeamId: mitigation.assignedTeamId, isActive: false })),
            catchError((error) => {
              console.error('Error updating team mitigation status:', error);

              return of(null);
            })
          )
        );
      }
    });

    return ops.length ? forkJoin(ops).pipe(map((changes) => changes.filter((change): change is TeamSyncChange => change !== null))) : of([]);
  }

  async initializeTeamMitigations(poam: any, poamAssignedTeams: any[], teamMitigations: any[]): Promise<any[]> {
    if (poam.poamId === 'ADDPOAM') {
      return teamMitigations;
    }

    if (poamAssignedTeams?.length > 0) {
      const newTeams = poamAssignedTeams.filter((team) => !teamMitigations.some((m) => m.assignedTeamId === team.assignedTeamId));

      for (const team of newTeams) {
        try {
          const response = await firstValueFrom(
            this.poamService.postPoamTeamMitigation({
              poamId: poam.poamId,
              assignedTeamId: team.assignedTeamId,
              mitigationText: '',
              isActive: true
            })
          );

          teamMitigations.push({
            mitigationId: response.mitigationId,
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            mitigationText: '',
            isActive: true
          });
        } catch (error) {
          console.error('Error creating team mitigation:', error);
        }
      }

      return teamMitigations.toSorted((a, b) => a.assignedTeamName.localeCompare(b.assignedTeamName)).filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId));
    }

    return teamMitigations;
  }

  saveTeamMitigation(poam: any, teamMitigation: any): Observable<any> {
    return this.poamService.updatePoamTeamMitigation(poam.poamId, teamMitigation.assignedTeamId, teamMitigation.mitigationText);
  }

  saveAllTeamMitigations(poam: any, teamMitigations: any[]): void {
    const activeTeamMitigations = teamMitigations.filter((tm) => tm.isActive);

    const savePromises = activeTeamMitigations.map((teamMitigation) => firstValueFrom(this.poamService.updatePoamTeamMitigation(poam.poamId, teamMitigation.assignedTeamId, teamMitigation.mitigationText)));

    Promise.all(savePromises)
      .then(() => {})
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to save one or more team mitigations: ${getErrorMessage(error)}`
        });
      });
  }
}
