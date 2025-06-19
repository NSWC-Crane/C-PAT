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
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
import { EMPTY, Subscription, catchError } from 'rxjs';
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
  imports: [AutoCompleteModule, ButtonModule, CommonModule, DialogModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule, PickListModule, TableModule, TagModule, ToastModule],
  providers: [MessageService]
})
export class AssignedTeamProcessingComponent implements OnInit, OnDestroy {
  private assetDeltaService = inject(AssetDeltaService);
  private assignedTeamService = inject(AssignedTeamService);
  private collectionsService = inject(CollectionsService);
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);

  @ViewChild('dt') table!: Table;
  private allCollections: CollectionsBasicList[] = [];
  assignedTeams: AssignedTeam[] = [];
  assetDeltaList: any;
  uniqueTeams: any;
  filteredTeams: string[] = [];
  availableCollections: CollectionsBasicList[] = [];
  assignedCollections: any[] = [];
  editingAssignedTeam: AssignedTeam | null = null;
  teamDialog: boolean = false;
  dialogMode: 'new' | 'edit' = 'new';
  selectedAdTeams: string[] = [];
  selectedCollection: any;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
        this.loadAssignedTeams();
        this.loadAssetDeltaList();
        this.loadCollections();
        this.filteredTeams = this.uniqueTeams || [];
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

    if (this.dialogMode === 'new' && this.editingAssignedTeam.assignedTeamId === 0) {
      if (!this.editingAssignedTeam.permissions) {
        this.editingAssignedTeam.permissions = [];
      }

      collections.forEach((collection) => {
        this.editingAssignedTeam!.permissions!.push({
          collectionId: collection.collectionId,
          collectionName: collection.collectionName
        });
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${collections.length} Permission${collections.length > 1 ? 's' : ''} Added`
      });

      return;
    }

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
            this.handlePermissionError(collection, error);
            completedCount++;

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

  onMoveToSource(event: any) {
    const collections = Array.isArray(event.items) ? event.items : [event.items];

    if (!this.editingAssignedTeam || !collections.length) return;

    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;

    collections.forEach((collection) => {
      this.assignedTeamService
        .deleteAssignedTeamPermission(this.editingAssignedTeam!.assignedTeamId, collection.collectionId)
        .pipe(
          catchError((error) => {
            errorCount++;
            this.handlePermissionError(collection, error, true);
            completedCount++;

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

    if (this.selectedAdTeams && this.selectedAdTeams.length > 0) {
      this.editingAssignedTeam.adTeam = this.selectedAdTeams.join(', ');
    } else {
      this.editingAssignedTeam.adTeam = null;
    }

    if (this.editingAssignedTeam.permissions) {
      this.editingAssignedTeam.permissions = this.editingAssignedTeam.permissions.filter((p) => p.collectionId !== 0);
    }

    (this.dialogMode === 'new' ? this.assignedTeamService.postAssignedTeam(this.editingAssignedTeam) : this.assignedTeamService.putAssignedTeam(this.editingAssignedTeam))
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
      .subscribe((response) => {
        if (this.dialogMode === 'new') {
          this.assignedTeams = [...this.assignedTeams, response];
        } else {
          const index = this.assignedTeams.findIndex((team) => team.assignedTeamId === this.editingAssignedTeam?.assignedTeamId);

          this.assignedTeams[index] = this.editingAssignedTeam!;
          this.assignedTeams = [...this.assignedTeams];
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Assigned Team ${this.dialogMode === 'new' ? 'Added' : 'Updated'}`
        });
        this.hideDialog();
      });
  }

  getAdTeamsArray(adTeamString: string | null | undefined): string[] {
    if (!adTeamString) return [];

    return adTeamString
      .split(',')
      .map((team) => team.trim())
      .filter((team) => team.length > 0);
  }

  onRowDelete(assignedTeam: AssignedTeam) {
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

  private handlePermissionError(collection: any, error: Error, isRemoval = false) {
    if (isRemoval) {
      const index = this.availableCollections.findIndex((c) => c.collectionId === collection.collectionId);

      if (index !== -1) {
        this.availableCollections.splice(index, 1);
        this.assignedCollections.push(collection);
      }
    } else {
      const index = this.assignedCollections.findIndex((c) => c.collectionId === collection.collectionId);

      if (index !== -1) {
        this.assignedCollections.splice(index, 1);
        this.availableCollections.push(collection);
      }
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to ${isRemoval ? 'remove' : 'add'} permission: ${getErrorMessage(error)}`
    });
  }

  hideDialog() {
    this.teamDialog = false;
    this.editingAssignedTeam = null;
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';

    this.table.filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
