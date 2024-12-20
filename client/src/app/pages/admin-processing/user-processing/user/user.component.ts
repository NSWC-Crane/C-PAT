/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { SubSink } from 'subsink';
import { UsersService } from '../users.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { format } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { AssignedTeamService } from '../../assignedTeam-processing/assignedTeam-processing.service';
import { StepperModule } from 'primeng/stepper';

interface Permission {
  userId: number;
  collectionId?: number | null;
  oldCollectionId?: number;
  newCollectionId?: number;
  accessLevel: number;
  accessLevelLabel?: string;
  collectionName?: string;
  editing?: boolean;
}

interface AssignedTeam {
  assignedTeamId: number | null;
  oldAssignedTeamId?: number;
  newAssignedTeamId?: number;
  userId: number;
  accessLevel: number;
  accessLevelLabel?: string;
  assignedTeamName?: string;
  editing?: boolean;
}

export interface CollectionsResponse {
  collections: Array<{
    collectionId: number;
    collectionName: string;
  }>;
}

interface PermissionChange {
  collectionId: number;
  collectionName: string;
  oldAccessLevel: number;
  newAccessLevel: number;
}

interface PermissionAddition {
  collectionId: number;
  collectionName: string;
  accessLevel: number;
}

interface PermissionChangeSummary {
  additions: PermissionAddition[];
  updates: PermissionChange[];
}

@Component({
  selector: 'cpat-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  standalone: true,
  imports: [
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    CommonModule,
    ConfirmDialogModule,
    DropdownModule,
    InputNumberModule,
    InputSwitchModule,
    InputTextModule,
    FormsModule,
    StepperModule,
    TableModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService]
})
export class UserComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  @Output() userChange = new EventEmitter<void>();
  accessLevelOptions = [
    { label: 'Viewer', value: 1 },
    { label: 'Submitter', value: 2 },
    { label: 'Approver', value: 3 },
    { label: 'CAT-I Approver', value: 4 },
  ];
  availableCollections: any[] = [];
  availableTeams: any[] = [];
  assignedTeams: any;
  cols: any[] = [];
  checked: boolean = false;
  collectionList: any = [];
  collectionPermissions: Permission[] = [];
  userAssignedTeams: AssignedTeam[] = [];
  officeOrgOptions: string[] = ['NAVSEA', 'NSWC CRANE'];
  filteredOfficeOrgs: string[];
  showLastClaims: boolean = false;
  marketplaceDisabled: boolean = false;
  private subs = new SubSink();
  teamCols: any[] = [
    { field: 'assignedTeamName', header: 'Assigned Teams' },
    { field: 'accessLevelLabel', header: 'Access Level' },
  ];

  constructor(
    private assignedTeamService: AssignedTeamService,
    private collectionsService: CollectionsService,
    private userService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;
    if (this.user && this.user.userId) {
      await this.loadUserData(this.user.userId);
    } else {
      (await this.userService.getCurrentUser()).subscribe(
        async (currentUser) => {
          this.user = currentUser;
          await this.loadCollections();
          await this.loadAssignedTeams();
        },
        (error) => {
          console.error('Error fetching current user', error);
        },
      );
    }
    this.cols = [
      { field: 'collectionName', header: 'Collections' },
      { field: 'accessLevelLabel', header: 'Access Level' },
    ];
  }

  private async loadUserData(userId: number) {
    (await this.userService.getUser(userId)).subscribe(
      async (userData) => {
        this.user = userData;
        await this.loadCollections();
        await this.loadAssignedTeams();
        this.getData();
        this.checked = this.user.isAdmin === true;
      },
      (error) => {
        console.error('Error fetching user data', error);
      },
    );
  }

  async loadAssignedTeams() {
    try {
      const response = await (
        await this.assignedTeamService.getAssignedTeams()
      ).toPromise();

      this.assignedTeams = response || [];

      this.availableTeams = this.assignedTeams.map((team: AssignedTeam) => ({
        title: team.assignedTeamName,
        value: team.assignedTeamId
      }));
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load Assigned Teams',
      });
    }
  }

  private async loadCollections() {
    (await this.userService.getCurrentUser()).subscribe(
      async (currentUser) => {
        (await this.collectionsService.getAllCollections()).subscribe(
          (response: any) => {
            this.collectionList = [];
            response.forEach(
              (collection: { collectionName: any; collectionId: any }) => {
                this.collectionList.push({
                  title: collection.collectionName,
                  value: collection.collectionId,
                });
              },
            );
            this.getData();
          },
          (error) => {
            console.error('Error fetching collections', error);
          },
        );
      },
      (error) => {
        console.error('Error fetching current user for collections', error);
      },
    );
  }

  ngOnChanges() {
    this.getData();
  }

  getData() {
    if (this.user && Array.isArray(this.user.permissions) && Array.isArray(this.user.assignedTeams)) {
      this.collectionPermissions = this.user.permissions.map(
        (permission: Permission) => {
          const collection = this.collectionList.find(
            (c: { title: string; value: number }) =>
              c.value === permission.collectionId,
          );
          const collectionName = collection ? collection.title : '';
          return {
            collectionId: permission.collectionId,
            collectionName: collectionName,
            accessLevel: permission.accessLevel,
            accessLevelLabel: this.getAccessLevelLabel(permission.accessLevel),
            userId: permission.userId,
            editing: false,
          };
        },
      );

      this.userAssignedTeams = this.user.assignedTeams.map(
        (assignment: AssignedTeam) => {
          const team = this.assignedTeams?.find(
            (t: AssignedTeam) => t.assignedTeamId === assignment.assignedTeamId
          );
          return {
            userId: assignment.userId,
            assignedTeamId: assignment.assignedTeamId,
            assignedTeamName: team ? team.assignedTeamName : '',
            accessLevel: assignment.accessLevel,
            accessLevelLabel: this.getAccessLevelLabel(assignment.accessLevel),
            editing: false,
          };
        },
      );
      this.cdr.detectChanges();
    } else {
      console.error('User or permissions data is not available');
    }
  }

  private updateAvailableCollections() {
    const assignedCollectionIds = new Set(
      this.collectionPermissions.map((p) => p.collectionId),
    );
    this.availableCollections = this.collectionList.filter(
      (c: any) => !assignedCollectionIds.has(c.value),
    );
  }

  private updateAvailableTeams() {
    const assignedTeamIds = new Set(
      this.userAssignedTeams.map((p) => p.assignedTeamId)
    );
    this.availableTeams = this.assignedTeams
      .filter((team: any) => !assignedTeamIds.has(team.assignedTeamId))
      .map((team: any) => ({
        title: team.assignedTeamName,
        value: team.assignedTeamId
      }));
  }

  onAddNewPermission() {
    this.updateAvailableCollections();
    const newPermission: Permission = {
      userId: this.user.userId,
      collectionId: null,
      accessLevel: 1,
      editing: true,
    };
    this.collectionPermissions.unshift(newPermission);
  }

  onEditPermission(permission: Permission) {
    this.updateAvailableCollections();
    if (permission.collectionId !== null) {
      this.availableCollections.push(
        this.collectionList.find(
          (c: any) => c.value === permission.collectionId,
        ),
      );
      permission.oldCollectionId = permission.collectionId;
    }
    permission.editing = true;
  }

  async onSavePermission(permission: Permission) {
    if (!permission.accessLevelLabel || !permission.collectionName) {
      const newPermission: Permission = {
        userId: permission.userId,
        collectionId: permission.collectionId,
        accessLevel: permission.accessLevel,
      };
      (await this.userService.postPermission(newPermission)).subscribe(
        (res: any) => {
          permission.userId = res.userId;
          permission.collectionId = res.collectionId;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission added successfully.',
          });
          permission.editing = false;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error('Error adding permission', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add the permission. Please try again.',
          });
        },
      );
    } else {
      const updatedPermission: Permission = {
        ...permission,
        newCollectionId: permission.collectionId ?? undefined,
      };
      (await this.userService.updatePermission(updatedPermission)).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission updated successfully.',
          });
          permission.editing = false;
          delete permission.oldCollectionId;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error('Error updating permission', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update the permission. Please try again.',
          });
        },
      );
    }
    this.updateAvailableCollections();
  }

  onCancelEditPermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter(
        (p) => p !== permission,
      );
    } else {
      permission.editing = false;
      if (permission.oldCollectionId !== undefined) {
        permission.collectionId = permission.oldCollectionId;
      }
      delete permission.oldCollectionId;
    }
    this.updateAvailableCollections();
  }

  async onDeletePermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter(
        (p) => p !== permission,
      );
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this permission?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          (
            await this.userService.deletePermission(
              this.user.userId,
              permission.collectionId,
            )
          ).subscribe(
            () => {
              this.collectionPermissions = this.collectionPermissions.filter(
                (p) => p.collectionId !== permission.collectionId,
              );
              this.loadUserData(this.user.userId);
            },
            (error) => {
              console.error('Error during deletePermission: ', error);
            },
          );
        },
      });
    }
    this.updateAvailableCollections();
  }

  onAddNewAssignedTeam() {
    this.updateAvailableTeams();
    const newAssignedTeam: AssignedTeam = {
      userId: this.user.userId,
      assignedTeamId: null,
      accessLevel: 1,
      editing: true,
    };
    this.userAssignedTeams.unshift(newAssignedTeam);
  }

  onEditAssignedTeam(assignedTeam: AssignedTeam) {
    this.updateAvailableTeams();
    if (assignedTeam.assignedTeamId !== null) {
      const currentTeam = this.assignedTeams.find(
        (t: any) => t.assignedTeamId === assignedTeam.assignedTeamId
      );
      if (currentTeam) {
        this.availableTeams.push({
          title: currentTeam.assignedTeamName,
          value: currentTeam.assignedTeamId
        });
      }
      assignedTeam.oldAssignedTeamId = assignedTeam.assignedTeamId;
    }
    assignedTeam.editing = true;
  }

  async onSaveAssignedTeam(assignedTeam: AssignedTeam) {
    const teamData = this.assignedTeams.find(
      (team: any) => team.assignedTeamId === assignedTeam.assignedTeamId
    );

    if (!teamData || !teamData.permissions) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to find team permissions'
      });
      return;
    }

    const changes = this.analyzePermissionChanges(
      this.user.permissions,
      teamData.permissions,
      assignedTeam.accessLevel
    );

    if (changes.additions.length === 0 && changes.updates.length === 0) {
      await this.confirmAssignedTeam(assignedTeam);
      return;
    }

    this.showPermissionChangeConfirmation(changes, async () => {
      await this.processPermissionChanges(changes);
      await this.confirmAssignedTeam(assignedTeam);
    });
  }

  private analyzePermissionChanges(
    userPermissions: Permission[],
    teamPermissions: any[],
    newTeamAccessLevel: number
  ): PermissionChangeSummary {

    const changes: PermissionChangeSummary = {
      additions: [],
      updates: []
    };

    const userPermissionMap = new Map(
      userPermissions.map(p => [p.collectionId, p])
    );

    teamPermissions.forEach(teamPerm => {
      const effectiveTeamAccess = newTeamAccessLevel;
      const userPerm = userPermissionMap.get(teamPerm.collectionId);

      if (!userPerm) {
        changes.additions.push({
          collectionId: teamPerm.collectionId,
          collectionName: teamPerm.collectionName || 'Unknown Collection',
          accessLevel: effectiveTeamAccess
        });
      } else if (userPerm.accessLevel < effectiveTeamAccess) {
        changes.updates.push({
          collectionId: teamPerm.collectionId,
          collectionName: teamPerm.collectionName || 'Unknown Collection',
          oldAccessLevel: userPerm.accessLevel,
          newAccessLevel: effectiveTeamAccess
        });
      }
    });

    return changes;
  }

  private showPermissionChangeConfirmation(
    changes: PermissionChangeSummary,
    onConfirm: () => void
  ) {
    let message = `
    <div class="permission-changes">`;

    if (changes.additions.length > 0) {
      message += `
      <p><strong>New Permissions to be Added:</strong></p>
      <ul>`;
      changes.additions.forEach(addition => {
        const accessLevelLabel = this.getAccessLevelLabel(addition.accessLevel);
        message += `<li>${addition.collectionName} (${accessLevelLabel})</li>`;
      });
      message += `</ul>`;
    }

    if (changes.updates.length > 0) {
      message += `
      <br>
      <p><strong>Permissions to be Updated:</strong></p>
      <ul>`;
      changes.updates.forEach(update => {
        const oldAccessLevelLabel = this.getAccessLevelLabel(update.oldAccessLevel);
        const newAccessLevelLabel = this.getAccessLevelLabel(update.newAccessLevel);
        message += `<li>${update.collectionName} (${oldAccessLevelLabel} → ${newAccessLevelLabel})</li>`;
      });
      message += `</ul>`;
    }

    message += `</div>`;

    this.confirmationService.confirm({
      message: message,
      header: ' ',
      icon: ' ',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => onConfirm(),
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Permission changes cancelled'
        });
      }
    });
  }

  private async processPermissionChanges(changes: PermissionChangeSummary) {
    for (const update of changes.updates) {
      const updatePermission: Permission = {
        userId: this.user.userId,
        oldCollectionId: update.collectionId,
        newCollectionId: update.collectionId,
        accessLevel: update.newAccessLevel
      };

      try {
        await (await this.userService.updatePermission(updatePermission)).toPromise();
      } catch (error) {
        console.error('Error updating permission:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to update permission for ${update.collectionName}`
        });
      }
    }

    for (const addition of changes.additions) {
      const newPermission: Permission = {
        userId: this.user.userId,
        collectionId: addition.collectionId,
        accessLevel: addition.accessLevel
      };

      try {
        await (await this.userService.postPermission(newPermission)).toPromise();
      } catch (error) {
        console.error('Error adding permission:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to add permission for ${addition.collectionName}`
        });
      }
    }
  }

  async confirmAssignedTeam(assignedTeam: AssignedTeam) {
    if (!assignedTeam.accessLevelLabel || !assignedTeam.assignedTeamName) {
      const newAssignedTeam: AssignedTeam = {
        userId: assignedTeam.userId ?? this.user.userId,
        assignedTeamId: assignedTeam.assignedTeamId,
        accessLevel: assignedTeam.accessLevel,
      };
      (await this.userService.postTeamAssignment(newAssignedTeam)).subscribe(
        (res: any) => {
          assignedTeam.userId = res.userId;
          assignedTeam.assignedTeamId = res.assignedTeamId;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team assignment added successfully.',
          });
          assignedTeam.editing = false;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error('Error adding team assignment', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add the team assignment. Please try again.',
          });
        },
      );
    } else {
      const updatedAssignedTeam: AssignedTeam = {
        ...assignedTeam,
        userId: assignedTeam.userId ?? this.user.userId,
        newAssignedTeamId: assignedTeam.assignedTeamId ?? undefined,
      };
      (await this.userService.putTeamAssignment(updatedAssignedTeam)).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team assignment updated successfully.',
          });
          assignedTeam.editing = false;
          delete assignedTeam.oldAssignedTeamId;
          this.loadUserData(this.user.userId);
        },
        (error) => {
          console.error('Error updating team assignment', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update the team assignment. Please try again.',
          });
        },
      );
    }
    this.updateAvailableTeams();
  }

  onCancelEditAssignedTeam(assignedTeam: AssignedTeam) {
    if (assignedTeam.assignedTeamId === null) {
      this.userAssignedTeams = this.userAssignedTeams.filter(
        (a) => a !== assignedTeam,
      );
    } else {
      assignedTeam.editing = false;
      if (assignedTeam.oldAssignedTeamId !== undefined) {
        assignedTeam.assignedTeamId = assignedTeam.oldAssignedTeamId;
      }
      delete assignedTeam.oldAssignedTeamId;
    }
    this.updateAvailableTeams();
  }

  async onDeleteAssignedTeam(assignedTeam: AssignedTeam) {
    if (assignedTeam.assignedTeamId === null) {
      this.userAssignedTeams = this.userAssignedTeams.filter(
        (a) => a !== assignedTeam,
      );
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this team assignment?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          (
            await this.userService.deleteTeamAssignment(
              this.user.userId,
              assignedTeam.assignedTeamId!,
            )
          ).subscribe(
            () => {
              this.userAssignedTeams = this.userAssignedTeams.filter(
                (a) => a.assignedTeamId !== assignedTeam.assignedTeamId,
              );
              this.loadUserData(this.user.userId);
            },
            (error) => {
              console.error('Error during deleting team assignment: ', error);
            },
          );
        },
      });
    }
    this.updateAvailableTeams();
  }

  getAccessLevelLabel(accessLevel: number): string {
    switch (accessLevel) {
      case 1:
        return 'Viewer';
      case 2:
        return 'Submitter';
      case 3:
        return 'Approver';
      case 4:
        return 'CAT-I Approver';
      default:
        return '';
    }
  }

  filterOfficeOrgs(event: any) {
    let filtered: string[] = [];
    let query = event.query.toLowerCase();

    for (let i = 0; i < this.officeOrgOptions.length; i++) {
      let officeOrg = this.officeOrgOptions[i];
      if (officeOrg.toLowerCase().indexOf(query) === 0) {
        filtered.push(officeOrg);
      }
    }

    this.filteredOfficeOrgs = filtered;
  }

  async onSubmit() {
    const formattedLastAccess = format(
      new Date(this.user.lastAccess),
      'yyyy-MM-dd HH:mm:ss',
    );
    this.user.lastAccess = formattedLastAccess;
    this.user.fullName = this.user.firstName + ' ' + this.user.lastName;

    (await this.userService.updateUser(this.user)).subscribe(() => {
      this.userChange.emit();
    });
  }

  resetData() {
    this.userChange.emit();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
