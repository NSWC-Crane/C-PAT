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
export class PoamResourceService {
  private readonly poamService = inject(PoamService);
  private readonly messageService = inject(MessageService);

  loadTeamResources(poamId: any): Observable<any[]> {
    if (!poamId || poamId === 'ADDPOAM') {
      return of([]);
    }

    return this.poamService.getPoamTeamResources(poamId);
  }

  syncTeamResources(poam: any, poamAssignedTeams: any[], teamResources: any[]): Observable<TeamSyncChange[]> {
    if (!poamAssignedTeams || poamAssignedTeams.length === 0) {
      return of([]);
    }

    const ops: Observable<TeamSyncChange | null>[] = [];

    poamAssignedTeams.forEach((team) => {
      const existingResource = teamResources.find((r) => r.assignedTeamId === team.assignedTeamId);

      if (!existingResource) {
        ops.push(
          this.poamService
            .postPoamTeamResource({
              poamId: poam.poamId,
              assignedTeamId: team.assignedTeamId,
              resourceText: '',
              isActive: true
            })
            .pipe(
              map((response) => ({
                type: 'add' as const,
                record: {
                  resourceId: response.resourceId,
                  assignedTeamId: team.assignedTeamId,
                  assignedTeamName: team.assignedTeamName,
                  resourceText: '',
                  isActive: true
                }
              })),
              catchError((error) => {
                console.error('Error adding team resource:', error);

                return of(null);
              })
            )
        );
      } else if (!existingResource.isActive) {
        ops.push(
          this.poamService.updatePoamTeamResourceStatus(poam.poamId, team.assignedTeamId, true).pipe(
            map(() => ({ type: 'setActive' as const, assignedTeamId: team.assignedTeamId, isActive: true })),
            catchError((error) => {
              console.error('Error updating team resource status:', error);

              return of(null);
            })
          )
        );
      }
    });

    teamResources.forEach((resource) => {
      const teamIsAssigned = poamAssignedTeams.some((team) => team.assignedTeamId === resource.assignedTeamId);

      if (!teamIsAssigned && resource.isActive) {
        ops.push(
          this.poamService.updatePoamTeamResourceStatus(poam.poamId, resource.assignedTeamId, false).pipe(
            map(() => ({ type: 'setActive' as const, assignedTeamId: resource.assignedTeamId, isActive: false })),
            catchError((error) => {
              console.error('Error updating team resource status:', error);

              return of(null);
            })
          )
        );
      }
    });

    return ops.length ? forkJoin(ops).pipe(map((changes) => changes.filter((change): change is TeamSyncChange => change !== null))) : of([]);
  }

  async initializeTeamResources(poam: any, poamAssignedTeams: any[], teamResources: any[]): Promise<any[]> {
    if (poam.poamId === 'ADDPOAM') {
      return teamResources;
    }

    if (poamAssignedTeams?.length > 0) {
      const newTeams = poamAssignedTeams.filter((team) => !teamResources.some((r) => r.assignedTeamId === team.assignedTeamId));

      for (const team of newTeams) {
        try {
          const response = await firstValueFrom(
            this.poamService.postPoamTeamResource({
              poamId: poam.poamId,
              assignedTeamId: team.assignedTeamId,
              resourceText: '',
              isActive: true
            })
          );

          teamResources.push({
            resourceId: response.resourceId,
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            resourceText: '',
            isActive: true
          });
        } catch (error) {
          console.error('Error creating team resource:', error);
        }
      }

      return teamResources.toSorted((a, b) => a.assignedTeamName.localeCompare(b.assignedTeamName)).filter((resource, index, self) => index === self.findIndex((r) => r.assignedTeamId === resource.assignedTeamId));
    }

    return teamResources;
  }

  saveTeamResource(poam: any, teamResource: any): Observable<any> {
    return this.poamService.updatePoamTeamResource(poam.poamId, teamResource.assignedTeamId, teamResource.resourceText);
  }

  saveAllTeamResources(poam: any, teamResources: any[]): void {
    const activeTeamResources = teamResources.filter((tr) => tr.isActive);

    const savePromises = activeTeamResources.map((teamResource) => firstValueFrom(this.poamService.updatePoamTeamResource(poam.poamId, teamResource.assignedTeamId, teamResource.resourceText)));

    Promise.all(savePromises)
      .then(() => {})
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to save one or more team resources: ${getErrorMessage(error)}`
        });
      });
  }
}
