/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, viewChild, output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { SubSink } from 'subsink';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssignedTeamService } from '../../assigned-teams/assigned-teams.service';
import { UsersService } from '../users.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { filter, firstValueFrom, take } from 'rxjs';

interface Permission {
  userId: number;
  collectionId?: number | null;
  oldCollectionId?: number;
  accessLevel: number;
  accessLevelLabel?: string;
  collectionName?: string;
  editing?: boolean;
}

interface AssignedTeam {
  assignedTeamId: number | null;
  oldAssignedTeamId?: number;
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

interface ExcludedGrant {
  collectionId: number;
  collectionName: string;
  currentAccessLevel: number | null;
  wouldGrantAccessLevel: number;
}

interface GrantExclusion {
  collectionId: number;
  collectionName: string;
  assignedTeamId: number;
  assignedTeamName: string;
  excludedAt?: string;
}

interface PermissionChangeSummary {
  additions: PermissionAddition[];
  updates: PermissionChange[];
  downgrades: PermissionChange[];
  excluded?: ExcludedGrant[];
}

interface PermissionGrant {
  collectionId: number;
  assignedTeamId: number;
  assignedTeamName: string;
  accessLevel: number;
}

interface DirectPermission {
  collectionId: number;
  accessLevel: number;
  grantedAt?: string;
}

interface RevocationEntry {
  collectionId: number;
  collectionName: string;
  currentAccessLevel: number;
  targetAccessLevel?: number;
}

interface RevocationPlan {
  removals: RevocationEntry[];
  downgrades: RevocationEntry[];
  unaffected: RevocationEntry[];
}

@Component({
  selector: 'cpat-user-editor',
  templateUrl: './user-editor.component.html',
  styleUrls: ['./user-editor.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AutoCompleteModule, ButtonModule, CardModule, CheckboxModule, ConfirmDialogModule, DialogModule, SelectModule, InputNumberModule, ToggleSwitch, InputTextModule, FormsModule, TableModule, TabsModule, TagModule, TooltipModule, JsonPipe],
  providers: [ConfirmationService]
})
export class UserEditorComponent implements OnInit, OnDestroy {
  private readonly assignedTeamService = inject(AssignedTeamService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly userService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly payloadService = inject(PayloadService);

  readonly userInput = input<any>(undefined);
  userState = signal<any>(undefined);
  readonly users = input<any>(undefined);
  readonly payload = input<any>(undefined);
  readonly userChange = output<void>();
  private readonly teamTable = viewChild<Table>('teamTable');
  private readonly permissionsTable = viewChild<Table>('permissionsTable');
  accessLevelOptions = [
    { label: 'Viewer', value: 1 },
    { label: 'Submitter', value: 2 },
    { label: 'Approver', value: 3 },
    { label: 'CAT-I Approver', value: 4 }
  ];
  readonly availableCollections = signal<any[]>([]);
  readonly availableTeams = signal<any[]>([]);
  readonly assignedTeams = signal<any[]>([]);
  cols: any[] = [
    { field: 'collectionName', header: 'Collections' },
    { field: 'accessLevelLabel', header: 'Access Level' }
  ];
  readonly checked = signal(false);
  readonly collectionList = signal<any[]>([]);
  readonly collectionPermissions = signal<Permission[]>([]);
  readonly userAssignedTeams = signal<AssignedTeam[]>([]);
  readonly permissionGrants = signal<PermissionGrant[]>([]);
  readonly directPermissions = signal<DirectPermission[]>([]);
  readonly activeTab = signal(0);
  private readonly noTeams: string[] = [];
  readonly unassignDialogVisible = signal(false);
  readonly unassignTarget = signal<AssignedTeam | null>(null);
  readonly unassignPlan = signal<RevocationPlan | null>(null);
  readonly teamActionInFlight = signal(false);
  readonly excludedGrants = signal<GrantExclusion[]>([]);
  readonly restoreDialogVisible = signal(false);
  readonly restoreTarget = signal<AssignedTeam | null>(null);
  readonly restoreSelections = signal<Set<number>>(new Set<number>());
  readonly restoreCandidates = computed<GrantExclusion[]>(() => {
    const target = this.restoreTarget();

    return target ? this.excludedGrants().filter((exclusion) => exclusion.assignedTeamId === target.assignedTeamId) : [];
  });
  readonly hasRevocationProposals = computed(() => {
    const plan = this.unassignPlan();

    return !!plan && plan.removals.length + plan.downgrades.length > 0;
  });
  readonly teamCoverage = computed<Map<number, string[]>>(() => {
    const coverage = new Map<number, string[]>();

    for (const grant of this.permissionGrants()) {
      if (!grant.assignedTeamName) continue;

      const covering = coverage.get(grant.collectionId);

      if (!covering) {
        coverage.set(grant.collectionId, [grant.assignedTeamName]);
      } else if (!covering.includes(grant.assignedTeamName)) {
        covering.push(grant.assignedTeamName);
      }
    }

    return coverage;
  });
  readonly directCoverage = computed<Map<number, number>>(() => {
    const direct = new Map<number, number>();

    for (const permission of this.directPermissions()) {
      direct.set(permission.collectionId, permission.accessLevel);
    }

    return direct;
  });
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
  readonly filteredOfficeOrgs = signal<string[]>([]);
  readonly showLastClaims = signal(false);
  readonly marketplaceDisabled = signal(false);
  private readonly subs = new SubSink();
  teamCols: any[] = [
    { field: 'assignedTeamName', header: 'Assigned Teams' },
    { field: 'accessLevelLabel', header: 'Access Level' }
  ];

  ngOnInit() {
    this.marketplaceDisabled.set(CPAT.Env.features.marketplaceDisabled);
    this.userState.set(this.userInput());

    const userValue = this.userInput();

    if (userValue?.userId) {
      this.loadUserData(userValue.userId);
    } else {
      this.payloadService.user$
        .pipe(
          filter((user) => user !== null),
          take(1)
        )
        .subscribe({
          next: (currentUser) => {
            this.userState.set(currentUser);
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
  }

  private loadUserData(userId: number, preserveFormData: boolean = false) {
    this.userService.getUser(userId).subscribe({
      next: (userData) => {
        if (preserveFormData) {
          const formFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'officeOrg', 'points'];
          const preservedData = formFields.reduce((acc: any, field) => {
            acc[field] = this.userState()[field];

            return acc;
          }, {});

          userData.permissions = userData.permissions || [];
          userData.assignedTeams = userData.assignedTeams || [];
          userData.permissionGrants = userData.permissionGrants || [];
          userData.directPermissions = userData.directPermissions || [];
          userData.excludedGrants = userData.excludedGrants || [];
          this.userState.set({
            ...this.userState(),
            ...preservedData,
            permissions: userData.permissions,
            assignedTeams: userData.assignedTeams,
            permissionGrants: userData.permissionGrants,
            directPermissions: userData.directPermissions,
            excludedGrants: userData.excludedGrants
          });
        } else {
          this.userState.set(userData);
        }

        Promise.all([this.loadCollections(), this.loadAssignedTeams()]).then(() => {
          this.getData();
          this.checked.set(this.userState().isAdmin === true);
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

      this.assignedTeams.set(response || []);

      this.availableTeams.set(
        this.assignedTeams().map((team: AssignedTeam) => ({
          title: team.assignedTeamName,
          value: team.assignedTeamId
        }))
      );
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
          this.collectionList.set(
            response.map((collection: { collectionName: any; collectionId: any }) => ({
              title: collection.collectionName,
              value: collection.collectionId
            }))
          );
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
    const user = this.userState();

    this.permissionGrants.set(Array.isArray(user?.permissionGrants) ? user.permissionGrants : []);
    this.directPermissions.set(Array.isArray(user?.directPermissions) ? user.directPermissions : []);
    this.excludedGrants.set(Array.isArray(user?.excludedGrants) ? user.excludedGrants : []);

    if (Array.isArray(user?.permissions) && Array.isArray(user?.assignedTeams)) {
      this.collectionPermissions.set(
        user.permissions.map((permission: Permission) => {
          const collection = this.collectionList().find((c: { title: string; value: number }) => c.value === permission.collectionId);
          const collectionName = collection ? collection.title : '';

          return {
            collectionId: permission.collectionId,
            collectionName: collectionName,
            accessLevel: permission.accessLevel,
            accessLevelLabel: this.getAccessLevelLabel(permission.accessLevel),
            userId: permission.userId,
            editing: false
          };
        })
      );

      this.userAssignedTeams.set(
        user.assignedTeams.map((assignment: AssignedTeam) => {
          const team = this.assignedTeams().find((t: AssignedTeam) => t.assignedTeamId === assignment.assignedTeamId);

          return {
            userId: assignment.userId,
            assignedTeamId: assignment.assignedTeamId,
            assignedTeamName: team ? team.assignedTeamName : '',
            accessLevel: assignment.accessLevel,
            accessLevelLabel: this.getAccessLevelLabel(assignment.accessLevel),
            editing: false
          };
        })
      );
    } else {
      console.error('User or permissions data is not available');
    }
  }

  private updateAvailableCollections() {
    const assignedCollectionIds = new Set(this.collectionPermissions().map((p) => p.collectionId));

    this.availableCollections.set(this.collectionList().filter((c: any) => !assignedCollectionIds.has(c.value)));
  }

  private updateAvailableTeams() {
    const assignedTeamIds = new Set(this.userAssignedTeams().map((p) => p.assignedTeamId));

    this.availableTeams.set(
      this.assignedTeams()
        .filter((team: any) => !assignedTeamIds.has(team.assignedTeamId))
        .map((team: any) => ({
          title: team.assignedTeamName,
          value: team.assignedTeamId
        }))
    );
  }

  onAddNewPermission() {
    this.updateAvailableCollections();
    const newPermission: Permission = {
      userId: this.userState().userId,
      collectionId: null,
      accessLevel: 1,
      editing: true
    };

    this.collectionPermissions.update((permissions) => [newPermission, ...permissions]);

    const permissionsTable = this.permissionsTable();

    if (permissionsTable) {
      permissionsTable.first.set(0);
    }
  }

  onEditPermission(permission: Permission) {
    if (permission.collectionId !== null) {
      permission.oldCollectionId = permission.collectionId;
    }

    permission.editing = true;
  }

  onSavePermission(permission: Permission) {
    this.onSubmit(false);

    if (permission.oldCollectionId === undefined) {
      const newPermission: Permission = {
        userId: permission.userId,
        collectionId: permission.collectionId,
        accessLevel: permission.accessLevel
      };

      this.userService.postPermission(newPermission).subscribe({
        next: (res: any) => {
          permission.userId = res.userId;
          permission.collectionId = res.collectionId;
          this.notifyPermissionWrite(res, 'added');
          permission.editing = false;
          this.loadUserData(this.userState().userId);
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
        oldCollectionId: permission.oldCollectionId ?? permission.collectionId ?? undefined
      };

      this.userService.updatePermission(updatedPermission).subscribe({
        next: (res: any) => {
          this.notifyPermissionWrite(res, 'updated');
          permission.editing = false;
          delete permission.oldCollectionId;
          this.loadUserData(this.userState().userId);
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

  private notifyPermissionWrite(res: any, verb: string) {
    const effective = res?.effectiveAccessLevel;
    const requested = res?.accessLevel;

    if (typeof effective === 'number' && typeof requested === 'number' && effective > requested) {
      const teams = Array.isArray(res.coveringTeams) && res.coveringTeams.length > 0 ? res.coveringTeams.join(', ') : 'a team assignment';

      this.messageService.add({
        severity: 'info',
        summary: 'Team coverage applies',
        detail: `Direct access was set to ${this.getAccessLevelLabel(requested)}, but ${teams} grants ${this.getAccessLevelLabel(effective)}, so the user holds ${this.getAccessLevelLabel(effective)}.`
      });

      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission ${verb} successfully.`
    });
  }

  onCancelEditPermission(permission: Permission) {
    if (permission.collectionId === null) {
      this.collectionPermissions.update((permissions) => permissions.filter((p) => p !== permission));
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
      this.collectionPermissions.update((permissions) => permissions.filter((p) => p !== permission));
    } else {
      const covering = this.teamsCovering(permission.collectionId);
      const message =
        covering.length > 0
          ? `${permission.collectionName} is also granted by ${covering.join(', ')}. This removes only the access granted directly to this user; they keep the level their team coverage provides. To take that away, change the team assignment or the team's collection coverage. Are you sure you want to continue?`
          : 'Are you sure you want to delete this permission?';

      this.confirmationService.confirm({
        message: message,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirm',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-outlined p-button-primary',
        rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
        accept: () => {
          this.userService.deletePermission(this.userState().userId, permission.collectionId).subscribe({
            next: (res: any) => {
              if (res?.removed === false) {
                const teams = Array.isArray(res.coveringTeams) && res.coveringTeams.length > 0 ? res.coveringTeams.join(', ') : 'a team assignment';

                this.messageService.add({
                  severity: 'info',
                  summary: 'Access retained',
                  detail: `The direct grant was removed, but ${teams} still grants ${this.getAccessLevelLabel(res.effectiveAccessLevel)} access to this collection.`
                });
              } else {
                this.collectionPermissions.update((permissions) => permissions.filter((p) => p.collectionId !== permission.collectionId));
              }

              this.loadUserData(this.userState().userId);
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
      userId: this.userState().userId,
      assignedTeamId: null,
      accessLevel: 1,
      editing: true
    };

    this.userAssignedTeams.update((teams) => [newAssignedTeam, ...teams]);

    const teamTable = this.teamTable();

    if (teamTable) {
      teamTable.first.set(0);
    }
  }

  onEditAssignedTeam(assignedTeam: AssignedTeam) {
    if (assignedTeam.assignedTeamId !== null) {
      assignedTeam.oldAssignedTeamId = assignedTeam.assignedTeamId;
    }

    assignedTeam.editing = true;
  }

  async onSaveAssignedTeam(assignedTeam: AssignedTeam) {
    if (assignedTeam.assignedTeamId === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Select a team before saving'
      });

      return;
    }

    if (this.teamActionInFlight()) {
      return;
    }

    let changes: PermissionChangeSummary;

    this.teamActionInFlight.set(true);

    try {
      changes = await firstValueFrom(this.userService.getGrantPreview(this.userState().userId, assignedTeam.assignedTeamId, assignedTeam.accessLevel));
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to preview permission changes: ${getErrorMessage(error)}`
      });

      return;
    } finally {
      this.teamActionInFlight.set(false);
    }

    const additions = changes.additions ?? [];
    const updates = changes.updates ?? [];
    const downgrades = changes.downgrades ?? [];
    const excluded = changes.excluded ?? [];

    if (additions.length === 0 && updates.length === 0 && downgrades.length === 0 && excluded.length === 0) {
      this.confirmAssignedTeam(assignedTeam, changes);

      return;
    }

    this.showPermissionChangeConfirmation(changes, () => {
      this.confirmAssignedTeam(assignedTeam, changes);
    });
  }

  private showPermissionChangeConfirmation(changes: PermissionChangeSummary, onConfirm: () => void) {
    const additions = changes.additions ?? [];
    const updates = changes.updates ?? [];
    const downgrades = changes.downgrades ?? [];
    let message = `
    <div class="permission-changes">
      <p>Saving this team assignment will also grant the collection permissions this team covers. C-PAT records that this team is what justifies them, so removing the assignment later can offer to take them back.</p>
      <br>`;

    if (additions.length > 0) {
      message += `
      <p><strong>New Permissions to be Added:</strong></p>
      <ul>`;
      additions.forEach((addition) => {
        const accessLevelLabel = this.getAccessLevelLabel(addition.accessLevel);

        message += `<li>${addition.collectionName} (${accessLevelLabel})</li>`;
      });
      message += `</ul>`;
    }

    if (updates.length > 0) {
      message += `
      <br>
      <p><strong>Permissions to be Updated:</strong></p>
      <ul>`;
      updates.forEach((update) => {
        const oldAccessLevelLabel = this.getAccessLevelLabel(update.oldAccessLevel);
        const newAccessLevelLabel = this.getAccessLevelLabel(update.newAccessLevel);

        message += `<li>${update.collectionName} (${oldAccessLevelLabel} → ${newAccessLevelLabel})</li>`;
      });
      message += `</ul>`;
    }

    if (downgrades.length > 0) {
      message += `
      <br>
      <p><strong>Permissions to be Lowered:</strong></p>
      <p>Lowering this team's access level lowers the permissions it granted. Each is only lowered as far as another team or the level the permission held before any team raised it allows. A collection listed here may be one an admin granted directly at the same level this team happened to use, in which case it was indistinguishable from a team grant.</p>
      <ul>`;
      downgrades.forEach((downgrade) => {
        const oldAccessLevelLabel = this.getAccessLevelLabel(downgrade.oldAccessLevel);
        const newAccessLevelLabel = this.getAccessLevelLabel(downgrade.newAccessLevel);

        message += `<li>${downgrade.collectionName} (${oldAccessLevelLabel} → ${newAccessLevelLabel})</li>`;
      });
      message += `</ul>`;
    }

    const excluded = changes.excluded ?? [];

    if (excluded.length > 0) {
      message += `
      <br>
      <p><strong>Skipped for This User:</strong></p>
      <p>An administrator deliberately withheld these collections from this user when this team's coverage was added, so saving will not grant them. They stay withheld until restored from the team row.</p>
      <ul>`;
      excluded.forEach((entry) => {
        message += `<li>${entry.collectionName}</li>`;
      });
      message += `</ul>`;
    }

    message += `</div>`;

    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Collection Permission Changes',
      icon: 'pi pi-exclamation-triangle',
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

  private describeGrantDivergence(preview: PermissionChangeSummary | null, applied: PermissionChangeSummary | undefined): string[] {
    if (!preview || !applied) return [];

    const bucketOf = (plan: PermissionChangeSummary, collectionId: number): string | null => {
      if (plan.additions?.some((entry) => entry.collectionId === collectionId)) return 'newly granted';
      if (plan.updates?.some((entry) => entry.collectionId === collectionId)) return 'raised';
      if (plan.downgrades?.some((entry) => entry.collectionId === collectionId)) return 'lowered';

      return null;
    };

    const names = new Map<number, string>();

    for (const plan of [preview, applied]) {
      for (const entry of [...(plan.additions ?? []), ...(plan.updates ?? []), ...(plan.downgrades ?? [])]) {
        names.set(entry.collectionId, entry.collectionName);
      }
    }

    const differences: string[] = [];

    for (const [collectionId, collectionName] of names) {
      const before = bucketOf(preview, collectionId);
      const after = bucketOf(applied, collectionId);

      if (before !== after) {
        differences.push(`${collectionName} was previewed as ${before ?? 'not listed'} but applied as ${after ?? 'not listed'}`);
      }
    }

    return differences;
  }

  private warnOnGrantDivergence(preview: PermissionChangeSummary | null, applied: PermissionChangeSummary | undefined) {
    const differences = this.describeGrantDivergence(preview, applied);

    if (differences.length === 0) return;

    this.messageService.add({
      severity: 'warn',
      summary: 'Result differed from the preview',
      detail: `Another permission change landed while this dialog was open, so ${differences.join('; ')}.`,
      life: 12000
    });
  }

  private warnOnRestoreSideEffects(changes: PermissionChangeSummary | undefined, restoredIds: number[]) {
    if (!changes) return;

    const restored = new Set(restoredIds);
    const describeLevelChange = (entry: PermissionChange) => `${entry.collectionName} (${this.getAccessLevelLabel(entry.oldAccessLevel)} → ${this.getAccessLevelLabel(entry.newAccessLevel)})`;
    const sideEffects = [
      ...(changes.additions ?? []).filter((entry) => !restored.has(entry.collectionId)).map((entry) => `${entry.collectionName} (newly granted at ${this.getAccessLevelLabel(entry.accessLevel)})`),
      ...(changes.updates ?? []).filter((entry) => !restored.has(entry.collectionId)).map(describeLevelChange),
      ...(changes.downgrades ?? []).filter((entry) => !restored.has(entry.collectionId)).map(describeLevelChange)
    ];

    if (sideEffects.length === 0) return;

    this.messageService.add({
      severity: 'warn',
      summary: 'Other collections were re-synced',
      detail: `Saving the assignment re-synced this team's other covered collections to the user's level on the team, so ${sideEffects.join('; ')}.`,
      life: 12000
    });
  }

  confirmAssignedTeam(assignedTeam: AssignedTeam, previewedChanges: PermissionChangeSummary | null = null) {
    this.onSubmit(false);

    if (assignedTeam.oldAssignedTeamId === undefined) {
      const newAssignedTeam: AssignedTeam = {
        userId: assignedTeam.userId ?? this.userState().userId,
        assignedTeamId: assignedTeam.assignedTeamId,
        accessLevel: assignedTeam.accessLevel
      };

      this.userService.postTeamAssignment(newAssignedTeam).subscribe({
        next: (res: any) => {
          assignedTeam.userId = res.userId;
          assignedTeam.assignedTeamId = res.assignedTeamId;

          if (res.created === false && res.accessLevel !== newAssignedTeam.accessLevel) {
            const changes = res.permissionChanges ?? {};
            const reconciled = (changes.additions?.length ?? 0) + (changes.updates?.length ?? 0) + (changes.downgrades?.length ?? 0);
            const reconciledPlural = reconciled === 1 ? ' was' : 's were';
            const reconciledNote = reconciled > 0 ? ` ${reconciled} collection permission${reconciledPlural} still reconciled against the level the user already had.` : '';

            this.messageService.add({
              severity: 'warn',
              summary: 'Assignment already existed',
              detail: `This user was already on the team at ${this.getAccessLevelLabel(res.accessLevel)}. That level was kept and the requested ${this.getAccessLevelLabel(newAssignedTeam.accessLevel)} was not applied.${reconciledNote}`,
              life: 10000
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Team assignment added successfully.'
            });
          }

          this.warnOnGrantDivergence(previewedChanges, res.permissionChanges);

          assignedTeam.editing = false;
          this.loadUserData(this.userState().userId);
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
        userId: assignedTeam.userId ?? this.userState().userId,
        oldAssignedTeamId: assignedTeam.oldAssignedTeamId ?? assignedTeam.assignedTeamId ?? undefined
      };

      this.userService.putTeamAssignment(updatedAssignedTeam).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team assignment updated successfully.'
          });
          this.warnOnGrantDivergence(previewedChanges, res?.permissionChanges);
          assignedTeam.editing = false;
          delete assignedTeam.oldAssignedTeamId;
          this.loadUserData(this.userState().userId);
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
      this.userAssignedTeams.update((teams) => teams.filter((a) => a !== assignedTeam));
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
    if (this.teamActionInFlight()) {
      return;
    }

    this.onSubmit(false);

    if (assignedTeam.assignedTeamId === null) {
      this.userAssignedTeams.update((teams) => teams.filter((a) => a !== assignedTeam));
      this.updateAvailableTeams();

      return;
    }

    let plan: RevocationPlan;

    this.teamActionInFlight.set(true);

    try {
      plan = await firstValueFrom(this.userService.getRevocationPreview(this.userState().userId, assignedTeam.assignedTeamId));
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to determine what this team assignment justifies: ${getErrorMessage(error)}`
      });

      return;
    } finally {
      this.teamActionInFlight.set(false);
    }

    this.unassignTarget.set(assignedTeam);
    this.unassignPlan.set(plan);
    this.unassignDialogVisible.set(true);
  }

  cancelUnassign() {
    this.unassignDialogVisible.set(false);
    this.unassignTarget.set(null);
    this.unassignPlan.set(null);
  }

  excludedCountForTeam(assignedTeamId: number | null | undefined): number {
    if (assignedTeamId === null || assignedTeamId === undefined) return 0;

    return this.excludedGrants().filter((exclusion) => exclusion.assignedTeamId === assignedTeamId).length;
  }

  openRestoreDialog(assignedTeam: AssignedTeam) {
    this.restoreTarget.set(assignedTeam);
    this.restoreSelections.set(new Set(this.restoreCandidates().map((exclusion) => exclusion.collectionId)));
    this.restoreDialogVisible.set(true);
  }

  cancelRestore() {
    this.restoreDialogVisible.set(false);
    this.restoreTarget.set(null);
    this.restoreSelections.set(new Set<number>());
  }

  isRestoreSelected(collectionId: number): boolean {
    return this.restoreSelections().has(collectionId);
  }

  toggleRestoreCollection(collectionId: number) {
    this.restoreSelections.update((current) => {
      const next = new Set(current);

      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }

      return next;
    });
  }

  confirmRestore() {
    const target = this.restoreTarget();
    const includeCollectionIds = [...this.restoreSelections()];

    if (!target?.assignedTeamId || includeCollectionIds.length === 0) {
      this.cancelRestore();

      return;
    }

    if (this.teamActionInFlight()) {
      return;
    }

    this.teamActionInFlight.set(true);

    this.userService
      .putTeamAssignment({
        userId: this.userState().userId,
        oldAssignedTeamId: target.assignedTeamId,
        includeCollectionIds
      })
      .subscribe({
        next: (res: any) => {
          this.teamActionInFlight.set(false);

          const storedLevel = res?.accessLevel;

          if (typeof storedLevel === 'number' && (storedLevel < 1 || storedLevel > 4)) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Nothing restored',
              detail: `This assignment's stored access level is invalid, so the skipped collections were not restored. Edit the assignment, set a level from Viewer to CAT-I Approver, and try again.`
            });
            this.cancelRestore();
            this.loadUserData(this.userState().userId);

            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Restored',
            detail: `${includeCollectionIds.length} collection${includeCollectionIds.length === 1 ? '' : 's'} restored from this team.`
          });
          this.warnOnRestoreSideEffects(res?.permissionChanges, includeCollectionIds);
          this.cancelRestore();
          this.loadUserData(this.userState().userId);
        },
        error: (error) => {
          this.teamActionInFlight.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to restore the skipped collections: ${getErrorMessage(error)}`
          });
          this.cancelRestore();
          this.loadUserData(this.userState().userId);
        }
      });
  }

  private describeRevocationDivergence(preview: RevocationPlan | null, applied: RevocationPlan | undefined): string[] {
    if (!preview || !applied) return [];

    const bucketOf = (plan: RevocationPlan, collectionId: number): string | null => {
      if (plan.removals?.some((entry) => entry.collectionId === collectionId)) return 'removed entirely';
      if (plan.downgrades?.some((entry) => entry.collectionId === collectionId)) return 'lowered';
      if (plan.unaffected?.some((entry) => entry.collectionId === collectionId)) return 'left unchanged';

      return null;
    };

    const names = new Map<number, string>();

    for (const entry of [...(preview.removals ?? []), ...(preview.downgrades ?? []), ...(applied.removals ?? []), ...(applied.downgrades ?? [])]) {
      names.set(entry.collectionId, entry.collectionName);
    }

    const differences: string[] = [];

    for (const [collectionId, collectionName] of names) {
      const before = bucketOf(preview, collectionId);
      const after = bucketOf(applied, collectionId);

      if (before !== after) {
        differences.push(`${collectionName} was previewed as ${before ?? 'not listed'} but applied as ${after ?? 'not listed'}`);
      }
    }

    return differences;
  }

  confirmUnassign(revokePermissions: boolean) {
    const assignedTeam = this.unassignTarget();

    if (!assignedTeam?.assignedTeamId) {
      this.cancelUnassign();

      return;
    }

    const assignedTeamId = assignedTeam.assignedTeamId;

    if (this.teamActionInFlight()) {
      return;
    }

    this.teamActionInFlight.set(true);

    this.userService.deleteTeamAssignment(this.userState().userId, assignedTeamId, revokePermissions).subscribe({
      next: (res: any) => {
        this.teamActionInFlight.set(false);

        const differences = revokePermissions ? this.describeRevocationDivergence(this.unassignPlan(), res?.permissionChanges) : [];

        if (differences.length > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Result differed from the preview',
            detail: `Another permission change landed while this dialog was open, so ${differences.join('; ')}.`,
            life: 12000
          });
        }

        this.userAssignedTeams.update((teams) => teams.filter((a) => a.assignedTeamId !== assignedTeamId));
        this.cancelUnassign();
        this.updateAvailableTeams();
        this.loadUserData(this.userState().userId);
      },
      error: (error) => {
        this.teamActionInFlight.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error during deleting team assignment: ${getErrorMessage(error)}`
        });
        this.cancelUnassign();
        this.loadUserData(this.userState().userId);
      }
    });
  }

  teamsCovering(collectionId: number | null | undefined): string[] {
    if (collectionId === null || collectionId === undefined) return this.noTeams;

    return this.teamCoverage().get(collectionId) ?? this.noTeams;
  }

  directLevel(collectionId: number | null | undefined): number | null {
    if (collectionId === null || collectionId === undefined) return null;

    return this.directCoverage().get(collectionId) ?? null;
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
        return `Level ${accessLevel}`;
    }
  }

  filterOfficeOrgs(event: any) {
    const filtered: string[] = [];
    const query = event.query.toLowerCase();

    for (const officeOrg of this.officeOrgOptions) {
      if (officeOrg?.toLowerCase().startsWith(query)) {
        filtered.push(officeOrg);
      }
    }

    this.filteredOfficeOrgs.set(filtered);
  }

  onSubmit(final: boolean = true) {
    const user = this.userState();

    if (user.accountStatus === 'DISABLED') {
      if (!final) {
        return;
      }

      this.userService.disableUser(user.userId).subscribe({
        next: () => {
          if (final) {
            this.userChange.emit();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to disable user: ${getErrorMessage(error)}`
          });
        }
      });
    } else {
      const formattedLastAccess = format(new Date(user.lastAccess), 'yyyy-MM-dd HH:mm:ss');

      user.lastAccess = formattedLastAccess;
      user.fullName = user.firstName + ' ' + user.lastName;

      this.userService.updateUser(user).subscribe({
        next: () => {
          if (final) {
            this.userChange.emit();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to update user: ${getErrorMessage(error)}`
          });
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
