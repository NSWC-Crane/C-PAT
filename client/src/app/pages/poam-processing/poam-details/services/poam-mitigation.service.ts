/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, firstValueFrom, of } from 'rxjs';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { PoamService } from '../../poams.service';

@Injectable({
    providedIn: 'root'
})
export class PoamMitigationService {
    constructor(
        private poamService: PoamService,
        private messageService: MessageService
    ) {}

    loadTeamMitigations(poamId: any): Observable<any[]> {
        if (!poamId || poamId === 'ADDPOAM') {
            return of([]);
        }

        return this.poamService.getPoamTeamMitigations(poamId);
    }

    syncTeamMitigations(poam: any, poamAssignedTeams: any[], teamMitigations: any[]): void {
        if (!poamAssignedTeams || poamAssignedTeams.length === 0) {
            return;
        }

        poamAssignedTeams.forEach((team) => {
            const existingMitigation = teamMitigations.find((m) => m.assignedTeamId === team.assignedTeamId);

            if (!existingMitigation) {
                this.poamService
                    .postPoamTeamMitigation({
                        poamId: poam.poamId,
                        assignedTeamId: team.assignedTeamId,
                        mitigationText: '',
                        isActive: true
                    })
                    .subscribe({
                        next: (response) => {
                            teamMitigations.push({
                                mitigationId: response.mitigationId,
                                assignedTeamId: team.assignedTeamId,
                                assignedTeamName: team.assignedTeamName,
                                mitigationText: '',
                                isActive: true
                            });

                            teamMitigations.sort((a, b) => a.assignedTeamName.localeCompare(b.assignedTeamName));
                        },
                        error: (error) => {
                            console.error('Error adding team mitigation:', error);
                        }
                    });
            } else if (!existingMitigation.isActive) {
                this.poamService.updatePoamTeamMitigationStatus(poam.poamId, team.assignedTeamId, true).subscribe({
                    next: () => {
                        existingMitigation.isActive = true;
                    },
                    error: (error) => {
                        console.error('Error updating team mitigation status:', error);
                    }
                });
            }
        });

        teamMitigations.forEach((mitigation) => {
            const teamIsAssigned = poamAssignedTeams.some((team) => team.assignedTeamId === mitigation.assignedTeamId);

            if (!teamIsAssigned && mitigation.isActive) {
                this.poamService.updatePoamTeamMitigationStatus(poam.poamId, mitigation.assignedTeamId, false).subscribe({
                    next: () => {
                        mitigation.isActive = false;
                    },
                    error: (error) => {
                        console.error('Error updating team mitigation status:', error);
                    }
                });
            }
        });
    }

    async initializeTeamMitigations(poam: any, poamAssignedTeams: any[], teamMitigations: any[]): Promise<any[]> {
        if (poam.poamId === 'ADDPOAM') {
            return teamMitigations;
        }

        if (poamAssignedTeams && poamAssignedTeams.length > 0) {
            const newTeams = poamAssignedTeams.filter((team) => {
                return !teamMitigations.some((m) => m.assignedTeamId === team.assignedTeamId);
            });

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

            return teamMitigations.sort((a, b) => a.assignedTeamName.localeCompare(b.assignedTeamName)).filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId));
        }

        return teamMitigations;
    }

    saveTeamMitigation(poam: any, teamMitigation: any): Observable<any> {
        return this.poamService.updatePoamTeamMitigation(poam.poamId, teamMitigation.assignedTeamId, teamMitigation.mitigationText);
    }

    saveAllTeamMitigations(poam: any, teamMitigations: any[]): void {
        const activeTeamMitigations = teamMitigations.filter((tm) => tm.isActive);

        const savePromises = activeTeamMitigations.map((teamMitigation) => this.poamService.updatePoamTeamMitigation(poam.poamId, teamMitigation.assignedTeamId, teamMitigation.mitigationText).toPromise());

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
