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
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, inject, viewChild, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { SubSink } from 'subsink';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssignedTeamService } from '../../assignedTeam-processing/assignedTeam-processing.service';
import { UsersService } from '../users.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { filter, firstValueFrom, take } from 'rxjs';

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
  adTeam?: string | null;
  editing?: boolean;
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
  imports: [AutoCompleteModule, ButtonModule, CardModule, CommonModule, ConfirmDialogModule, Select, InputNumberModule, ToggleSwitch, InputTextModule, FormsModule, StepperModule, TableModule, ToastModule, TooltipModule]
})
export class UserComponent implements OnInit, OnChanges, OnDestroy {
  private assignedTeamService = inject(AssignedTeamService);
  private collectionsService = inject(CollectionsService);
  private userService = inject(UsersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private payloadService = inject(PayloadService);

  @Input() user: any;
  @Input() users: any;
  @Input() payload: any;
  readonly userChange = output<void>();
  readonly teamTable = viewChild<Table>('teamTable');
  readonly permissionsTable = viewChild<Table>('permissionsTable');
  accessLevelOptions = [
    { label: 'Viewer', value: 1 },
    { label: 'Submitter', value: 2 },
    { label: 'Approver', value: 3 },
    { label: 'CAT-I Approver', value: 4 }
  ];
  availableCollections: any[] = [];
  availableTeams: any[] = [];
  assignedTeams: any;
  cols: any[] = [];
  checked: boolean = false;
  collectionList: any = [];
  collectionPermissions: Permission[] = [];
  userAssignedTeams: AssignedTeam[] = [];
  officeOrgOptions: string[] = [
    'NAVSEA',
    'NSWCCD Carderock',
    'NSWC Crane',
    'NSWC Corona',
    'NSWC Dahlgren',
    'NSWC Panama City',
    'NSWC Philadelphia',
    'NSWC Port Hueneme',
    'NUWC Keyport',
    'NSWCDD Dam Neck',
    'NSWC Indian Head',
    'NUWC Newport',
    'NREN',
    'NREN NOC'
  ];
  filteredOfficeOrgs: string[];
  showLastClaims: boolean = false;
  marketplaceDisabled: boolean = false;
  private subs = new SubSink();
  teamCols: any[] = [
    { field: 'assignedTeamName', header: 'Assigned Teams' },
    { field: 'accessLevelLabel', header: 'Access Level' }
  ];

  ngOnInit() {
    this.marketplaceDisabled = CPAT.Env.features.marketplaceDisabled;

    if (this.user && this.user.userId) {
      this.loadUserData(this.user.userId);
    } else {
      this.payloadService.user$
        .pipe(
          filter((user) => user !== null),
          take(1)
        )
        .subscribe({
          next: (currentUser) => {
            this.user = currentUser;
            Promise.all([this.loadCollections(), this.loadAssignedTeams()]).then(() => {
              this.getData();
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error fetching current user: ${getErrorMessage(error)}`
            });
          }
        });
    }

    this.cols = [
      { field: 'collectionName', header: 'Collections' },
      { field: 'accessLevelLabel', header: 'Access Level' }
    ];
  }

  ngOnChanges() {
    this.getData();
  }

  private loadUserData(userId: number, preserveFormData: boolean = false) {
    this.userService.getUser(userId).subscribe({
      next: (userData) => {
        if (preserveFormData) {
          const formFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'officeOrg', 'points'];
          const preservedData = formFields.reduce((acc: any, field) => {
            acc[field] = this.user[field];

            return acc;
          }, {});

          userData.permissions = userData.permissions || [];
          userData.assignedTeams = userData.assignedTeams || [];
          this.user = { ...this.user, ...preservedData, permissions: userData.permissions, assignedTeams: userData.assignedTeams };
        } else {
          this.user = userData;
        }

        Promise.all([this.loadCollections(), this.loadAssignedTeams()]).then(() => {
          this.getData();
          this.checked = this.user.isAdmin === true;
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching user data: ${getErrorMessage(error)}`
        });
      }
    });
  }

  async loadAssignedTeams() {
    try {
      const response = await firstValueFrom(this.assignedTeamService.getAssignedTeams());

      this.assignedTeams = response || [];

      this.availableTeams = this.assignedTeams.map((team: AssignedTeam) => ({
        title: team.assignedTeamName,
        value: team.assignedTeamId
      }));
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load Assigned Teams: ${getErrorMessage(error)}`
      });
    }
  }

  private loadCollections(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.collectionsService.getAllCollections().subscribe({
        next: (response: any) => {
          this.collectionList = [];
          response.forEach((collection: { collectionName: any; collectionId: any }) => {
            this.collectionList.push({
              title: collection.collectionName,
              value: collection.collectionId
            });
          });
          resolve();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching collections: ${getErrorMessage(error)}`
          });
          reject(error);
        }
      });
    });
  }

  getData() {
    if (this.user && Array.isArray(this.user.permissions) && Array.isArray(this.user.assignedTeams)) {
      this.collectionPermissions = this.user.permissions.map((permission: Permission) => {
        const collection = this.collectionList.find((c: { title: string; value: number }) => c.value === permission.collectionId);
        const collectionName = collection ? collection.title : '';

        return {
          collectionId: permission.collectionId,
          collectionName: collectionName,
          accessLevel: permission.accessLevel,
          accessLevelLabel: this.getAccessLevelLabel(permission.accessLevel),
          userId: permission.userId,
          editing: false
        };
      });

      this.userAssignedTeams = this.user.assignedTeams.map((assignment: AssignedTeam) => {
        const team = this.assignedTeams?.find((t: AssignedTeam) => t.assignedTeamId === assignment.assignedTeamId);

        return {
          userId: assignment.userId,
          assignedTeamId: assignment.assignedTeamId,
          assignedTeamName: team ? team.assignedTeamName : '',
          accessLevel: assignment.accessLevel,
          accessLevelLabel: this.getAccessLevelLabel(assignment.accessLevel),
          editing: false
        };
      });
      this.cdr.detectChanges();
    } else {
      console.error('User or permissions data is not available');
    }
  }

  private updateAvailableCollections() {
    const assignedCollectionIds = new Set(this.collectionPermissions.map((p) => p.collectionId));

    this.availableCollections = this.collectionList.filter((c: any) => !assignedCollectionIds.has(c.value));
  }

  private updateAvailableTeams() {
    const assignedTeamIds = new Set(this.userAssignedTeams.map((p) => p.assignedTeamId));

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
      editing: true
    };

    this.collectionPermissions.unshift(newPermission);

    const permissionsTable = this.permissionsTable();

    if (permissionsTable) {
      permissionsTable.first = 0;
    }
  }

  onEditPermission(permission: Permission) {
    this.updateAvailableCollections();

    if (permission.collectionId !== null) {
      this.availableCollections.push(this.collectionList.find((c: any) => c.value === permission.collectionId));
      permission.oldCollectionId = permission.collectionId;
    }

    permission.editing = true;
  }

  onSavePermission(permission: Permission) {
    this.onSubmit(false);

    if (!permission.accessLevelLabel || !permission.collectionName) {
      const newPermission: Permission = {
        userId: permission.userId,
        collectionId: permission.collectionId,
        accessLevel: permission.accessLevel
      };

      this.userService.postPermission(newPermission).subscribe({
        next: (res: any) => {
          permission.userId = res.userId;
          permission.collectionId = res.collectionId;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission added successfully.'
          });
          permission.editing = false;
          this.loadUserData(this.user.userId);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add the permission: ${getErrorMessage(error)}`
          });
        }
      });
    } else {
      const updatedPermission: Permission = {
        ...permission,
        newCollectionId: permission.collectionId ?? undefined
      };

      this.userService.updatePermission(updatedPermission).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission updated successfully.'
          });
          permission.editing = false;
          delete permission.oldCollectionId;
          this.loadUserData(this.user.userId);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to update the permission: ${getErrorMessage(error)}`
          });
        }
      });
    }

    this.updateAvailableCollections();
  }

  onCancelEditPermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter((p) => p !== permission);
    } else {
      permission.editing = false;

      if (permission.oldCollectionId !== undefined) {
        permission.collectionId = permission.oldCollectionId;
      }

      delete permission.oldCollectionId;
    }

    this.updateAvailableCollections();
  }

  onDeletePermission(permission: Permission) {
    this.onSubmit(false);

    if (permission.collectionId === null) {
      this.collectionPermissions = this.collectionPermissions.filter((p) => p !== permission);
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this permission?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirm',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-outlined p-button-primary',
        rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
        accept: () => {
          this.userService.deletePermission(this.user.userId, permission.collectionId).subscribe({
            next: () => {
              this.collectionPermissions = this.collectionPermissions.filter((p) => p.collectionId !== permission.collectionId);
              this.loadUserData(this.user.userId);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error deleting permission: ${getErrorMessage(error)}`
              });
            }
          });
        }
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
      editing: true
    };

    this.userAssignedTeams.unshift(newAssignedTeam);

    const teamTable = this.teamTable();

    if (teamTable) {
      teamTable.first = 0;
    }
  }

  onEditAssignedTeam(assignedTeam: AssignedTeam) {
    this.updateAvailableTeams();

    if (assignedTeam.assignedTeamId !== null) {
      const currentTeam = this.assignedTeams.find((t: any) => t.assignedTeamId === assignedTeam.assignedTeamId);

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
    const teamData = this.assignedTeams.find((team: any) => team.assignedTeamId === assignedTeam.assignedTeamId);

    if (!teamData || !teamData.permissions) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to find team permissions'
      });

      return;
    }

    const changes = this.analyzePermissionChanges(this.user.permissions, teamData.permissions, assignedTeam.accessLevel);

    if (changes.additions.length === 0 && changes.updates.length === 0) {
      this.confirmAssignedTeam(assignedTeam);

      return;
    }

    this.showPermissionChangeConfirmation(changes, () => {
      this.processPermissionChanges(changes).then(() => {
        this.confirmAssignedTeam(assignedTeam);
      });
    });
  }

  private analyzePermissionChanges(userPermissions: Permission[], teamPermissions: any[], newTeamAccessLevel: number): PermissionChangeSummary {
    const changes: PermissionChangeSummary = {
      additions: [],
      updates: []
    };

    const userPermissionMap = new Map(userPermissions.map((p) => [p.collectionId, p]));

    teamPermissions.forEach((teamPerm) => {
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

  private showPermissionChangeConfirmation(changes: PermissionChangeSummary, onConfirm: () => void) {
    let message = `
    <div class="permission-changes">`;

    if (changes.additions.length > 0) {
      message += `
      <p><strong>New Permissions to be Added:</strong></p>
      <ul>`;
      changes.additions.forEach((addition) => {
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
      changes.updates.forEach((update) => {
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
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
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
        await firstValueFrom(this.userService.updatePermission(updatePermission));
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to update permission for ${update.collectionName}: ${getErrorMessage(error)}`
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
        await firstValueFrom(this.userService.postPermission(newPermission));
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to add permission for ${addition.collectionName}: ${getErrorMessage(error)}`
        });
      }
    }
  }

  confirmAssignedTeam(assignedTeam: AssignedTeam) {
    this.onSubmit(false);

    if (!assignedTeam.accessLevelLabel || !assignedTeam.assignedTeamName) {
      const newAssignedTeam: AssignedTeam = {
        userId: assignedTeam.userId ?? this.user.userId,
        assignedTeamId: assignedTeam.assignedTeamId,
        accessLevel: assignedTeam.accessLevel
      };

      this.userService.postTeamAssignment(newAssignedTeam).subscribe({
        next: (res: any) => {
          assignedTeam.userId = res.userId;
          assignedTeam.assignedTeamId = res.assignedTeamId;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team assignment added successfully.'
          });
          assignedTeam.editing = false;
          this.loadUserData(this.user.userId);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add the team assignment: ${getErrorMessage(error)}`
          });
        }
      });
    } else {
      const updatedAssignedTeam: AssignedTeam = {
        ...assignedTeam,
        userId: assignedTeam.userId ?? this.user.userId,
        newAssignedTeamId: assignedTeam.assignedTeamId ?? undefined
      };

      this.userService.putTeamAssignment(updatedAssignedTeam).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team assignment updated successfully.'
          });
          assignedTeam.editing = false;
          delete assignedTeam.oldAssignedTeamId;
          this.loadUserData(this.user.userId);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to update the team assignment: ${getErrorMessage(error)}`
          });
        }
      });
    }

    this.updateAvailableTeams();
  }

  onCancelEditAssignedTeam(assignedTeam: AssignedTeam) {
    if (assignedTeam.assignedTeamId === null) {
      this.userAssignedTeams = this.userAssignedTeams.filter((a) => a !== assignedTeam);
    } else {
      assignedTeam.editing = false;

      if (assignedTeam.oldAssignedTeamId !== undefined) {
        assignedTeam.assignedTeamId = assignedTeam.oldAssignedTeamId;
      }

      delete assignedTeam.oldAssignedTeamId;
    }

    this.updateAvailableTeams();
  }

  onDeleteAssignedTeam(assignedTeam: AssignedTeam) {
    this.onSubmit(false);

    if (assignedTeam.assignedTeamId === null) {
      this.userAssignedTeams = this.userAssignedTeams.filter((a) => a !== assignedTeam);
    } else {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete this team assignment?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirm',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-outlined p-button-primary',
        rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
        accept: () => {
          this.userService.deleteTeamAssignment(this.user.userId, assignedTeam.assignedTeamId!).subscribe({
            next: () => {
              this.userAssignedTeams = this.userAssignedTeams.filter((a) => a.assignedTeamId !== assignedTeam.assignedTeamId);
              this.loadUserData(this.user.userId);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error during deleting team assignment: ${getErrorMessage(error)}`
              });
            }
          });
        }
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
    const filtered: string[] = [];
    const query = event.query.toLowerCase();

    for (let i = 0; i < this.officeOrgOptions.length; i++) {
      const officeOrg = this.officeOrgOptions[i];

      if (officeOrg?.toLowerCase().indexOf(query) === 0) {
        filtered.push(officeOrg);
      }
    }

    this.filteredOfficeOrgs = filtered;
  }

  onSubmit(final: boolean = true) {
    if (this.user.accountStatus === 'DISABLED') {
      this.userService.disableUser(this.user.userId).subscribe(() => {
        if (final) {
          this.userChange.emit();
        }
      });
    } else {
      const formattedLastAccess = format(new Date(this.user.lastAccess), 'yyyy-MM-dd HH:mm:ss');

      this.user.lastAccess = formattedLastAccess;
      this.user.fullName = this.user.firstName + ' ' + this.user.lastName;

      this.userService.updateUser(this.user).subscribe(() => {
        if (final) {
          this.userChange.emit();
        }
      });
    }
  }

  resetData() {
    this.userChange.emit();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
