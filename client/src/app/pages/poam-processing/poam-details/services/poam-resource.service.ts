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
import { Observable, firstValueFrom, of } from 'rxjs';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { PoamService } from '../../poams.service';

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

  syncTeamResources(poam: any, poamAssignedTeams: any[], teamResources: any[]): void {
    if (!poamAssignedTeams || poamAssignedTeams.length === 0) {
      return;
    }

    poamAssignedTeams.forEach((team) => {
      const existingResource = teamResources.find((r) => r.assignedTeamId === team.assignedTeamId);

      if (!existingResource) {
        this.poamService
          .postPoamTeamResource({
            poamId: poam.poamId,
            assignedTeamId: team.assignedTeamId,
            resourceText: '',
            isActive: true
          })
          .subscribe({
            next: (response) => {
              teamResources.push({
                resourceId: response.resourceId,
                assignedTeamId: team.assignedTeamId,
                assignedTeamName: team.assignedTeamName,
                resourceText: '',
                isActive: true
              });

              teamResources.sort((a, b) => a.assignedTeamName.localeCompare(b.assignedTeamName));
            },
            error: (error) => {
              console.error('Error adding team resource:', error);
            }
          });
      } else if (!existingResource.isActive) {
        this.poamService.updatePoamTeamResourceStatus(poam.poamId, team.assignedTeamId, true).subscribe({
          next: () => {
            existingResource.isActive = true;
          },
          error: (error) => {
            console.error('Error updating team resource status:', error);
          }
        });
      }
    });

    teamResources.forEach((resource) => {
      const teamIsAssigned = poamAssignedTeams.some((team) => team.assignedTeamId === resource.assignedTeamId);

      if (!teamIsAssigned && resource.isActive) {
        this.poamService.updatePoamTeamResourceStatus(poam.poamId, resource.assignedTeamId, false).subscribe({
          next: () => {
            resource.isActive = false;
          },
          error: (error) => {
            console.error('Error updating team resource status:', error);
          }
        });
      }
    });
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

    const savePromises = activeTeamResources.map((teamResource) => this.poamService.updatePoamTeamResource(poam.poamId, teamResource.assignedTeamId, teamResource.resourceText).toPromise());

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
