/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AssignedTeamService } from './assignedTeam-processing.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import {
  CollectionsService,
  CollectionBasicList,
} from '../collection-processing/collections.service';
import { PickListModule } from 'primeng/picklist';
import { Table, TableModule } from 'primeng/table';
import { EMPTY, catchError, switchMap } from 'rxjs';
interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
  permissions?: Permission[];
}

interface Permission {
  collectionId: number;
  collectionName: string;
}

@Component({
  selector: 'cpat-assigned-team-processing',
  templateUrl: './assignedTeam-processing.component.html',
  styleUrls: ['./assignedTeam-processing.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PickListModule,
    TableModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class AssignedTeamProcessingComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  assignedTeams: AssignedTeam[] = [];
  availableCollections: CollectionBasicList[] = [];
  assignedCollections: any[] = [];
  editingAssignedTeam: AssignedTeam | null = null;
  teamDialog: boolean = false;
  dialogMode: 'new' | 'edit' = 'new';

  constructor(
    private assignedTeamService: AssignedTeamService,
    private collectionsService: CollectionsService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAssignedTeams();
    this.loadCollections();
  }

  loadAssignedTeams() {
    this.assignedTeamService.getAssignedTeams().subscribe({
      next: (response) => this.assignedTeams = response || [],
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load Assigned Teams'
      })
    });
  }

  loadCollections() {
    this.collectionsService.getCollectionBasicList().subscribe({
      next: (response) => this.availableCollections = response || [],
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load available collections'
      })
    });
  }

  openNew() {
    this.editingAssignedTeam = { assignedTeamId: 0, assignedTeamName: '', permissions: [] };
    this.availableCollections = [...this.availableCollections];
    this.assignedCollections = [];
    this.dialogMode = 'new';
    this.teamDialog = true;
  }

  editTeam(assignedTeam: AssignedTeam) {
    this.editingAssignedTeam = { ...assignedTeam };

    this.assignedCollections =
      assignedTeam.permissions?.map(p => ({
        collectionId: p.collectionId,
        collectionName: p.collectionName,
      })) || [];

    this.availableCollections = this.availableCollections.filter(
      collection =>
        !this.assignedCollections.some(
          assigned => assigned.collectionId === collection.collectionId
        )
    );

    this.dialogMode = 'edit';
    this.teamDialog = true;
  }

  onMoveToTarget(event: any) {
    const collection = event.items[0];
    if (!this.editingAssignedTeam || !collection) return;

    const createTeamAndPermission = () => {
      return this.assignedTeamService.postAssignedTeam(this.editingAssignedTeam!).pipe(
        switchMap(response => {
          this.editingAssignedTeam!.assignedTeamId = response.assignedTeamId;
          return this.assignedTeamService.postAssignedTeamPermission({
            assignedTeamId: response.assignedTeamId,
            collectionId: collection.collectionId
          });
        })
      );
    };

    const addPermission = () => {
      return this.assignedTeamService.postAssignedTeamPermission({
        assignedTeamId: this.editingAssignedTeam!.assignedTeamId,
        collectionId: collection.collectionId
      });
    };

    (this.dialogMode === 'new' && this.editingAssignedTeam.assignedTeamId === 0
      ? createTeamAndPermission()
      : addPermission()
    ).pipe(
      catchError(error => {
        this.handlePermissionError(collection, error);
        return EMPTY;
      })
    ).subscribe(() => {
      if (!this.editingAssignedTeam!.permissions) {
        this.editingAssignedTeam!.permissions = [];
      }
      this.editingAssignedTeam!.permissions.push({
        collectionId: collection.collectionId,
        collectionName: collection.collectionName
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission Added'
      });
    });
  }

  onMoveToSource(event: any) {
    const collection = event.items[0];
    if (!this.editingAssignedTeam || !collection) return;

    this.assignedTeamService.deleteAssignedTeamPermission(
      this.editingAssignedTeam.assignedTeamId,
      collection.collectionId
    ).pipe(
      catchError(error => {
        this.handlePermissionError(collection, error, true);
        return EMPTY;
      })
    ).subscribe(() => {
      if (this.editingAssignedTeam!.permissions) {
        this.editingAssignedTeam!.permissions = this.editingAssignedTeam!.permissions
          .filter(p => p.collectionId !== collection.collectionId);
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission Removed'
      });
    });
  }

  saveTeam() {
    if (!this.editingAssignedTeam) return;

    if (this.editingAssignedTeam.permissions) {
      this.editingAssignedTeam.permissions = this.editingAssignedTeam.permissions
        .filter(p => p.collectionId !== 0);
    }

    (this.dialogMode === 'new'
      ? this.assignedTeamService.postAssignedTeam(this.editingAssignedTeam)
      : this.assignedTeamService.putAssignedTeam(this.editingAssignedTeam)
    ).pipe(
      catchError(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to save Assigned Team: ${error.message}`
        });
        return EMPTY;
      })
    ).subscribe(response => {
      if (this.dialogMode === 'new') {
        this.assignedTeams = [...this.assignedTeams, response];
      } else {
        const index = this.assignedTeams.findIndex(
          team => team.assignedTeamId === this.editingAssignedTeam?.assignedTeamId
        );
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

  onRowDelete(assignedTeam: AssignedTeam) {
    this.assignedTeamService.deleteAssignedTeam(assignedTeam.assignedTeamId).pipe(
      catchError(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to delete Assigned Team: ${error.message}`
        });
        return EMPTY;
      })
    ).subscribe(() => {
      this.assignedTeams = this.assignedTeams
        .filter(p => p.assignedTeamId !== assignedTeam.assignedTeamId);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Assigned Team Deleted'
      });
    });
  }

  private handlePermissionError(collection: any, error: Error, isRemoval = false) {
    if (isRemoval) {
      const index = this.availableCollections.findIndex(
        c => c.collectionId === collection.collectionId
      );
      if (index !== -1) {
        this.availableCollections.splice(index, 1);
        this.assignedCollections.push(collection);
      }
    } else {
      const index = this.assignedCollections.findIndex(
        c => c.collectionId === collection.collectionId
      );
      if (index !== -1) {
        this.assignedCollections.splice(index, 1);
        this.availableCollections.push(collection);
      }
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to ${isRemoval ? 'remove' : 'add'} permission: ${error.message}`
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
}
