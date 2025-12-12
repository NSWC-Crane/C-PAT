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
import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PickListModule } from 'primeng/picklist';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { EMPTY, Subscription, catchError, firstValueFrom } from 'rxjs';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { Permission } from '../../../common/models/permission.model';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssetDeltaService } from '../asset-delta/asset-delta.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { AssignedTeamService } from './assignedTeam-processing.service';

interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
  adTeam?: string | null;
  permissions?: Permission[];
}

@Component({
  selector: 'cpat-assigned-team-processing',
  templateUrl: './assignedTeam-processing.component.html',
  styleUrls: ['./assignedTeam-processing.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, DialogModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule, PickListModule, TableModule, TagModule, ToastModule]
})
export class AssignedTeamProcessingComponent implements OnInit, OnDestroy {
  private assetDeltaService = inject(AssetDeltaService);
  private assignedTeamService = inject(AssignedTeamService);
  private collectionsService = inject(CollectionsService);
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);

  readonly table = viewChild.required<Table>('dt');
  private allCollections: CollectionsBasicList[] = [];
  assignedTeams: AssignedTeam[] = [];
  uniqueTeams: any;
  filteredTeams: string[] = [];
  availableCollections: CollectionsBasicList[] = [];
  assignedCollections: any[] = [];
  editingAssignedTeam: AssignedTeam | null = null;
  teamDialog: boolean = false;
  dialogMode: 'new' | 'edit' = 'new';
  selectedAdTeams: string[] = [];
  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadAssetDeltaList();
    this.loadCollections();

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(() => {
        this.loadAssignedTeams();
      })
    );
  }

  loadAssignedTeams() {
    this.assignedTeamService.getAssignedTeams().subscribe({
      next: (response) => (this.assignedTeams = response || []),
      error: (error) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load Assigned Teams: ${getErrorMessage(error)}`
        })
    });
  }

  loadAssetDeltaList() {
    this.assetDeltaService.getAssetDeltaTeams().subscribe({
      next: (response: string[]) => {
        this.uniqueTeams = response;
        this.filteredTeams = [...this.uniqueTeams];
      },
      error: (error) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load Asset Delta Teams: ${getErrorMessage(error)}`
        })
    });
  }

  filterTeams(event: any) {
    const query = event.filter ? event.filter.toLowerCase() : '';

    this.filteredTeams = this.uniqueTeams.filter((team) => team.toLowerCase().includes(query));
  }

  loadCollections() {
    this.collectionsService.getCollectionBasicList().subscribe({
      next: (response) => {
        this.allCollections = response || [];
        this.availableCollections = [...this.allCollections];
      },
      error: (error) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load available collections: ${getErrorMessage(error)}`
        })
    });
  }

  editTeam(assignedTeam: AssignedTeam) {
    this.editingAssignedTeam = { ...assignedTeam };

    if (this.editingAssignedTeam.adTeam) {
      this.selectedAdTeams = this.editingAssignedTeam.adTeam
        .split(',')
        .map((team) => team.trim())
        .filter((team) => team.length > 0);

      const missingTeams = this.selectedAdTeams.filter((team) => !this.uniqueTeams.includes(team));

      if (missingTeams.length > 0) {
        this.filteredTeams = [...this.uniqueTeams, ...missingTeams];
      } else {
        this.filteredTeams = [...this.uniqueTeams];
      }
    } else {
      this.selectedAdTeams = [];
      this.filteredTeams = [...this.uniqueTeams];
    }

    this.assignedCollections =
      assignedTeam.permissions?.map((p) => ({
        collectionId: p.collectionId,
        collectionName: p.collectionName
      })) || [];

    this.availableCollections = this.allCollections.filter((collection) => !this.assignedCollections.some((assigned) => assigned.collectionId === collection.collectionId));

    this.dialogMode = 'edit';
    this.teamDialog = true;
  }

  openNew() {
    this.editingAssignedTeam = { assignedTeamId: 0, assignedTeamName: '', adTeam: null, permissions: [] };
    this.selectedAdTeams = [];
    this.availableCollections = [...this.allCollections];
    this.assignedCollections = [];
    this.dialogMode = 'new';
    this.teamDialog = true;
  }

  onMoveToTarget(event: any) {
    const collections = Array.isArray(event.items) ? event.items : [event.items];

    if (!this.editingAssignedTeam || !collections.length) return;

    if (this.dialogMode === 'new') {
      collections.forEach((collection) => {
        if (!this.assignedCollections.some((c) => c.collectionId === collection.collectionId)) {
          this.assignedCollections.push(collection);
        }
      });

      return;
    }

    this.addPermissionsToExistingTeam(collections);
  }

  onMoveToSource(event: any) {
    const collections = Array.isArray(event.items) ? event.items : [event.items];

    if (!this.editingAssignedTeam || !collections.length) return;

    if (this.dialogMode === 'new') {
      collections.forEach((collection) => {
        const index = this.assignedCollections.findIndex((c) => c.collectionId === collection.collectionId);

        if (index !== -1) {
          this.assignedCollections.splice(index, 1);
        }
      });

      return;
    }

    this.removePermissionsFromExistingTeam(collections);
  }

  private addPermissionsToExistingTeam(collections: any[]) {
    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;

    collections.forEach((collection) => {
      this.assignedTeamService
        .postAssignedTeamPermission({
          assignedTeamId: this.editingAssignedTeam!.assignedTeamId,
          collectionId: collection.collectionId
        })
        .pipe(
          catchError((error) => {
            errorCount++;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to add permission for ${collection.collectionName}: ${getErrorMessage(error)}`
            });
            completedCount++;
            const index = this.assignedCollections.findIndex((c) => c.collectionId === collection.collectionId);

            if (index !== -1) {
              this.assignedCollections.splice(index, 1);
              this.availableCollections.push(collection);
            }

            if (completedCount === collections.length) {
              this.showFinalMessage(successCount, errorCount);
            }

            return EMPTY;
          })
        )
        .subscribe(() => {
          successCount++;
          completedCount++;

          if (!this.editingAssignedTeam!.permissions) {
            this.editingAssignedTeam!.permissions = [];
          }

          this.editingAssignedTeam!.permissions.push({
            collectionId: collection.collectionId,
            collectionName: collection.collectionName
          });

          if (completedCount === collections.length) {
            this.showFinalMessage(successCount, errorCount);
          }
        });
    });
  }

  private removePermissionsFromExistingTeam(collections: any[]) {
    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;

    collections.forEach((collection) => {
      this.assignedTeamService
        .deleteAssignedTeamPermission(this.editingAssignedTeam!.assignedTeamId, collection.collectionId)
        .pipe(
          catchError((error) => {
            errorCount++;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to remove permission for ${collection.collectionName}: ${getErrorMessage(error)}`
            });
            completedCount++;
            const index = this.availableCollections.findIndex((c) => c.collectionId === collection.collectionId);

            if (index !== -1) {
              this.availableCollections.splice(index, 1);
              this.assignedCollections.push(collection);
            }

            if (completedCount === collections.length) {
              this.showFinalMessage(successCount, errorCount, true);
            }

            return EMPTY;
          })
        )
        .subscribe(() => {
          successCount++;
          completedCount++;

          if (this.editingAssignedTeam!.permissions) {
            this.editingAssignedTeam!.permissions = this.editingAssignedTeam!.permissions.filter((p) => p.collectionId !== collection.collectionId);
          }

          if (completedCount === collections.length) {
            this.showFinalMessage(successCount, errorCount, true);
          }
        });
    });
  }

  private showFinalMessage(successCount: number, errorCount: number, isRemoval: boolean = false) {
    if (successCount > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${successCount} Permission${successCount > 1 ? 's' : ''} ${isRemoval ? 'Removed' : 'Added'}`
      });
    }

    if (errorCount > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${isRemoval ? 'remove' : 'add'} ${errorCount} permission${errorCount > 1 ? 's' : ''}`
      });
    }
  }

  saveTeam() {
    if (!this.editingAssignedTeam) return;

    this.editingAssignedTeam.adTeam = this.selectedAdTeams?.length > 0 ? this.selectedAdTeams.join(', ') : null;
    const pendingPermissions = this.dialogMode === 'new' ? [...this.assignedCollections] : [];
    const saveOperation = this.dialogMode === 'new' ? this.assignedTeamService.postAssignedTeam(this.editingAssignedTeam) : this.assignedTeamService.putAssignedTeam(this.editingAssignedTeam);

    saveOperation
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to save Assigned Team: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
      .subscribe(async (response) => {
        if (this.dialogMode === 'new') {
          await this.handleNewTeamCreated(response, pendingPermissions);
        } else {
          this.handleExistingTeamUpdated();
        }
      });
  }

  private async handleNewTeamCreated(newTeam: AssignedTeam, pendingPermissions: any[]) {
    if (pendingPermissions.length > 0) {
      await this.addPermissionsToNewTeam(newTeam, pendingPermissions);
    } else {
      this.assignedTeams = [...this.assignedTeams, newTeam];
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Assigned Team Added'
      });
      this.hideDialog();
    }
  }

  private handleExistingTeamUpdated() {
    const index = this.assignedTeams.findIndex((team) => team.assignedTeamId === this.editingAssignedTeam?.assignedTeamId);

    if (index !== -1) {
      this.assignedTeams[index] = this.editingAssignedTeam!;
      this.assignedTeams = [...this.assignedTeams];
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Assigned Team Updated'
    });
    this.hideDialog();
  }

  private async addPermissionsToNewTeam(newTeam: AssignedTeam, permissions: any[]) {
    let successCount = 0;
    const failedCollections: string[] = [];

    newTeam.permissions = [];

    for (const collection of permissions) {
      try {
        await firstValueFrom(
          this.assignedTeamService.postAssignedTeamPermission({
            assignedTeamId: newTeam.assignedTeamId,
            collectionId: collection.collectionId
          })
        );

        successCount++;
        newTeam.permissions.push({
          collectionId: collection.collectionId,
          collectionName: collection.collectionName
        });
      } catch (error) {
        failedCollections.push(collection.collectionName);
        console.error(`Failed to add permission for collection ${collection.collectionId}:`, error);
      }
    }

    this.assignedTeams = [...this.assignedTeams, newTeam];

    if (successCount > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Assigned Team Added with ${successCount} permission${successCount !== 1 ? 's' : ''}`
      });
    }

    if (failedCollections.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Failed to add permissions for: ${failedCollections.join(', ')}`
      });
    }

    this.hideDialog();
  }

  getAdTeamsArray(adTeamString: string | null | undefined): string[] {
    if (!adTeamString) return [];

    return adTeamString
      .split(',')
      .map((team) => team.trim())
      .filter((team) => team.length > 0);
  }

  onRowDelete(assignedTeam: AssignedTeam) {
    if (!confirm(`Are you sure you want to delete the team "${assignedTeam.assignedTeamName}"?`)) {
      return;
    }

    this.assignedTeamService
      .deleteAssignedTeam(assignedTeam.assignedTeamId)
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to delete Assigned Team: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
      .subscribe(() => {
        this.assignedTeams = this.assignedTeams.filter((p) => p.assignedTeamId !== assignedTeam.assignedTeamId);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assigned Team Deleted'
        });
      });
  }

  hideDialog(): void {
    this.teamDialog = false;
  }

  onDialogHide(): void {
    this.editingAssignedTeam = null;
    this.selectedAdTeams = [];
    this.assignedCollections = [];
    this.availableCollections = [...this.allCollections];
    this.filteredTeams = [...this.uniqueTeams];
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';

    this.table().filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
