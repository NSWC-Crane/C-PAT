/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, WritableSignal, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PickListModule } from 'primeng/picklist';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, catchError, firstValueFrom } from 'rxjs';
import { MultiSelectDirective } from '../../../common/directives/multi-select.directive';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { Permission } from '../../../common/models/permission.model';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssetDeltaService } from '../asset-delta/asset-delta.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { AssignedTeamService } from './assigned-teams.service';

interface AssignedTeam {
  assignedTeamId: number;
  assignedTeamName: string;
  adTeam?: string | null;
  permissions?: Permission[];
}

interface CoverageRevocationEntry {
  userId: number;
  userName: string;
  fullName: string | null;
  collectionId: number;
  collectionName: string;
  currentAccessLevel: number;
  targetAccessLevel?: number;
}

interface CoverageRevocationPlan {
  removals: CoverageRevocationEntry[];
  downgrades: CoverageRevocationEntry[];
  unaffected: CoverageRevocationEntry[];
}

interface CoverageRemovalTarget {
  collection: any;
  plan: CoverageRevocationPlan;
}

interface CoverageGrantEntry {
  userId: number;
  userName: string;
  fullName: string | null;
  teamAccessLevel: number;
  currentAccessLevel: number | null;
  accessLevel?: number;
  newAccessLevel?: number;
}

interface CoverageGrantPlan {
  additions: CoverageGrantEntry[];
  updates: CoverageGrantEntry[];
  unchanged: CoverageGrantEntry[];
}

interface CoverageGrantTarget {
  collection: any;
  plan: CoverageGrantPlan;
}

interface PreviewedMember {
  userId: number;
  bucket: 'additions' | 'updates' | 'unchanged';
  teamAccessLevel?: number;
  newAccessLevel?: number;
}

@Component({
  selector: 'cpat-assigned-teams',
  templateUrl: './assigned-teams.component.html',
  styleUrls: ['./assigned-teams.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CheckboxModule, DialogModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule, MultiSelectDirective, PickListModule, TableModule, TagModule, TooltipModule]
})
export class AssignedTeamsComponent implements OnInit {
  private readonly assetDeltaService = inject(AssetDeltaService);
  private readonly assignedTeamService = inject(AssignedTeamService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);
  private readonly sharedService = inject(SharedService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly table = viewChild.required<Table>('dt');
  private allCollections: CollectionsBasicList[] = [];
  readonly assignedTeams = signal<AssignedTeam[]>([]);
  uniqueTeams: any;
  readonly filteredTeams = signal<string[]>([]);
  readonly availableCollections = signal<CollectionsBasicList[]>([]);
  readonly assignedCollections = signal<any[]>([]);
  readonly editingAssignedTeam = signal<AssignedTeam | null>(null);
  readonly teamDialog = signal(false);
  dialogMode: 'new' | 'edit' = 'new';
  readonly selectedAdTeams = signal<string[]>([]);
  readonly coverageDialogVisible = signal(false);
  readonly coverageRemovalTargets = signal<CoverageRemovalTarget[]>([]);
  readonly coverageActionInFlight = signal(false);
  readonly coverageHasProposals = computed(() => this.coverageRemovalTargets().some((target) => target.plan.removals.length + target.plan.downgrades.length > 0));
  readonly coverageGrantDialogVisible = signal(false);
  readonly coverageGrantTargets = signal<CoverageGrantTarget[]>([]);
  readonly coverageGrantActionInFlight = signal(false);
  readonly coverageGrantSelections = signal<Set<string>>(new Set<string>());
  readonly coverageGrantHasProposals = computed(() => this.coverageGrantTargets().some((target) => target.plan.additions.length + target.plan.updates.length > 0));
  readonly selectedGrantCount = computed(() => this.coverageGrantSelections().size);
  readonly deleteTeamDialogVisible = signal(false);
  readonly deleteTeamTarget = signal<AssignedTeam | null>(null);
  readonly coverageInteractionBusy = computed(() => this.coverageActionInFlight() || this.coverageGrantActionInFlight() || this.coverageDialogVisible() || this.coverageGrantDialogVisible());

  ngOnInit() {
    this.loadAssetDeltaList();
    this.loadCollections();

    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadAssignedTeams();
    });
  }

  loadAssignedTeams() {
    this.assignedTeamService.getAssignedTeams().subscribe({
      next: (response) => this.assignedTeams.set(response || []),
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
        this.filteredTeams.set([...this.uniqueTeams]);
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

    this.filteredTeams.set(this.uniqueTeams.filter((team) => team.toLowerCase().includes(query)));
  }

  loadCollections() {
    this.collectionsService.getCollectionBasicList().subscribe({
      next: (response) => {
        this.allCollections = response || [];
        this.availableCollections.set([...this.allCollections]);
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
    const editing: AssignedTeam = { ...assignedTeam, permissions: [...(assignedTeam.permissions ?? [])] };

    if (editing.adTeam) {
      const parsed = editing.adTeam
        .split(',')
        .map((team) => team.trim())
        .filter((team) => team.length > 0);

      this.selectedAdTeams.set(parsed);

      const missingTeams = parsed.filter((team) => !this.uniqueTeams.includes(team));

      if (missingTeams.length > 0) {
        this.filteredTeams.set([...this.uniqueTeams, ...missingTeams]);
      } else {
        this.filteredTeams.set([...this.uniqueTeams]);
      }
    } else {
      this.selectedAdTeams.set([]);
      this.filteredTeams.set([...this.uniqueTeams]);
    }

    const assigned =
      assignedTeam.permissions?.map((p) => ({
        collectionId: p.collectionId,
        collectionName: p.collectionName
      })) || [];

    this.assignedCollections.set(assigned);
    this.availableCollections.set(this.allCollections.filter((collection) => !assigned.some((entry) => entry.collectionId === collection.collectionId)));

    this.dialogMode = 'edit';
    this.editingAssignedTeam.set(editing);
    this.teamDialog.set(true);
  }

  openNew() {
    this.editingAssignedTeam.set({ assignedTeamId: 0, assignedTeamName: '', adTeam: null, permissions: [] });
    this.selectedAdTeams.set([]);
    this.availableCollections.set([...this.allCollections]);
    this.assignedCollections.set([]);
    this.dialogMode = 'new';
    this.teamDialog.set(true);
  }

  onMoveToTarget(event: any) {
    const collections = Array.isArray(event.items) ? event.items : [event.items];

    if (!this.editingAssignedTeam() || !collections.length) return;

    if (this.dialogMode === 'new') {
      this.addToList(this.assignedCollections, collections);

      return;
    }

    this.moveCollectionsToAvailable(collections);

    if (this.coverageInteractionBusy()) {
      this.notifyCoverageBusy();

      return;
    }

    this.openCoverageGrantDialog(collections);
  }

  onMoveToSource(event: any) {
    const collections = Array.isArray(event.items) ? event.items : [event.items];

    if (!this.editingAssignedTeam() || !collections.length) return;

    if (this.dialogMode === 'new') {
      this.removeFromList(this.assignedCollections, collections);

      return;
    }

    this.moveCollectionsToAssigned(collections);

    if (this.coverageInteractionBusy()) {
      this.notifyCoverageBusy();

      return;
    }

    this.openCoverageRemovalDialog(collections);
  }

  private notifyCoverageBusy() {
    this.messageService.add({
      severity: 'info',
      summary: 'One change at a time',
      detail: 'Finish the coverage change already in progress before moving another collection.'
    });
  }

  private addToList(list: WritableSignal<any[]>, collections: any[]) {
    list.update((current) => [...current, ...collections.filter((collection) => !current.some((entry) => entry.collectionId === collection.collectionId))]);
  }

  private removeFromList(list: WritableSignal<any[]>, collections: any[]) {
    const ids = new Set(collections.map((collection) => collection.collectionId));

    list.update((current) => current.filter((entry) => !ids.has(entry.collectionId)));
  }

  private moveCollectionsToAssigned(collections: any[]) {
    this.removeFromList(this.availableCollections, collections);
    this.addToList(this.assignedCollections, collections);
  }

  private moveCollectionsToAvailable(collections: any[]) {
    this.removeFromList(this.assignedCollections, collections);
    this.addToList(this.availableCollections, collections);
  }

  private async openCoverageRemovalDialog(collections: any[]) {
    const editing = this.editingAssignedTeam();

    if (!editing || this.coverageActionInFlight()) return;

    this.coverageActionInFlight.set(true);

    try {
      const targets = await Promise.all(
        collections.map(async (collection) => ({
          collection,
          plan: (await firstValueFrom(this.assignedTeamService.getCoverageRevocationPreview(editing.assignedTeamId, collection.collectionId))) as CoverageRevocationPlan
        }))
      );

      this.coverageRemovalTargets.set(targets);
      this.coverageDialogVisible.set(true);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to determine what removing this coverage would do: ${getErrorMessage(error)}`
      });
    } finally {
      this.coverageActionInFlight.set(false);
    }
  }

  cancelCoverageRemoval() {
    this.coverageDialogVisible.set(false);
    this.coverageRemovalTargets.set([]);
  }

  confirmCoverageRemoval(revokePermissions: boolean) {
    const collections = this.coverageRemovalTargets().map((target) => target.collection);

    this.coverageDialogVisible.set(false);
    this.coverageRemovalTargets.set([]);

    if (!collections.length) return;

    this.moveCollectionsToAvailable(collections);
    this.removePermissionsFromExistingTeam(collections, revokePermissions);
  }

  private async openCoverageGrantDialog(collections: any[]) {
    const editing = this.editingAssignedTeam();

    if (!editing || this.coverageGrantActionInFlight()) return;

    this.coverageGrantActionInFlight.set(true);

    try {
      const targets = await Promise.all(
        collections.map(async (collection) => ({
          collection,
          plan: (await firstValueFrom(this.assignedTeamService.getCoverageGrantPreview(editing.assignedTeamId, collection.collectionId))) as CoverageGrantPlan
        }))
      );

      const selections = new Set<string>();

      targets.forEach((target) => {
        this.grantProposals(target).forEach((entry) => selections.add(this.grantSelectionKey(target.collection.collectionId, entry.userId)));
      });

      this.coverageGrantSelections.set(selections);
      this.coverageGrantTargets.set(targets);
      this.coverageGrantDialogVisible.set(true);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to determine what adding this coverage would grant: ${getErrorMessage(error)}`
      });
    } finally {
      this.coverageGrantActionInFlight.set(false);
    }
  }

  private grantSelectionKey(collectionId: number, userId: number): string {
    return `${collectionId}:${userId}`;
  }

  grantProposals(target: CoverageGrantTarget): CoverageGrantEntry[] {
    return [...target.plan.additions, ...target.plan.updates];
  }

  isGrantMemberSelected(collectionId: number, userId: number): boolean {
    return this.coverageGrantSelections().has(this.grantSelectionKey(collectionId, userId));
  }

  toggleGrantMember(collectionId: number, userId: number) {
    const key = this.grantSelectionKey(collectionId, userId);

    this.coverageGrantSelections.update((selections) => {
      const next = new Set(selections);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  allGrantMembersSelected(target: CoverageGrantTarget): boolean {
    const proposals = this.grantProposals(target);

    return proposals.length > 0 && proposals.every((entry) => this.isGrantMemberSelected(target.collection.collectionId, entry.userId));
  }

  toggleAllGrantMembers(target: CoverageGrantTarget) {
    const proposals = this.grantProposals(target);
    const selectAll = !this.allGrantMembersSelected(target);

    this.coverageGrantSelections.update((selections) => {
      const next = new Set(selections);

      proposals.forEach((entry) => {
        const key = this.grantSelectionKey(target.collection.collectionId, entry.userId);

        if (selectAll) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  }

  cancelCoverageGrant() {
    this.coverageGrantDialogVisible.set(false);
    this.coverageGrantTargets.set([]);
    this.coverageGrantSelections.set(new Set<string>());
  }

  private previewedMembers(target: CoverageGrantTarget): PreviewedMember[] {
    return [
      ...target.plan.additions.map((entry) => ({ userId: entry.userId, bucket: 'additions' as const, teamAccessLevel: entry.teamAccessLevel, newAccessLevel: entry.newAccessLevel })),
      ...target.plan.updates.map((entry) => ({ userId: entry.userId, bucket: 'updates' as const, teamAccessLevel: entry.teamAccessLevel, newAccessLevel: entry.newAccessLevel })),
      ...target.plan.unchanged.map((entry) => ({ userId: entry.userId, bucket: 'unchanged' as const, teamAccessLevel: entry.teamAccessLevel }))
    ];
  }

  confirmCoverageGrant() {
    const targets = this.coverageGrantTargets();
    const grantUserIds = new Map<number, number[]>();
    const previewedMembers = new Map<number, PreviewedMember[]>();

    targets.forEach((target) => {
      const collectionId = target.collection.collectionId;

      grantUserIds.set(
        collectionId,
        this.grantProposals(target)
          .filter((entry) => this.isGrantMemberSelected(collectionId, entry.userId))
          .map((entry) => entry.userId)
      );
      previewedMembers.set(collectionId, this.previewedMembers(target));
    });

    const collections = targets.map((target) => target.collection);

    this.coverageGrantDialogVisible.set(false);
    this.coverageGrantTargets.set([]);
    this.coverageGrantSelections.set(new Set<string>());

    if (!collections.length) return;

    this.moveCollectionsToAssigned(collections);
    this.addPermissionsToExistingTeam(collections, grantUserIds, previewedMembers);
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
        return 'Unknown';
    }
  }

  private syncTeamPermissions(assignedTeamId: number, mutate: (permissions: any[]) => any[]) {
    this.editingAssignedTeam.update((current) => (current?.assignedTeamId === assignedTeamId ? { ...current, permissions: mutate(current.permissions ?? []) } : current));
    this.assignedTeams.update((teams) => teams.map((team) => (team.assignedTeamId === assignedTeamId ? { ...team, permissions: mutate(team.permissions ?? []) } : team)));
  }

  private addPermissionsToExistingTeam(collections: any[], grantUserIds: Map<number, number[]>, previewedMembers: Map<number, PreviewedMember[]>) {
    const editing = this.editingAssignedTeam();

    if (!editing) return;

    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;

    collections.forEach((collection) => {
      this.assignedTeamService
        .postAssignedTeamPermission({
          assignedTeamId: editing.assignedTeamId,
          collectionId: collection.collectionId,
          grantUserIds: grantUserIds.get(collection.collectionId) ?? [],
          previewedMembers: previewedMembers.get(collection.collectionId) ?? []
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
            this.moveCollectionsToAvailable([collection]);

            if (completedCount === collections.length) {
              this.showFinalMessage(successCount, errorCount);
            }

            return EMPTY;
          })
        )
        .subscribe(() => {
          successCount++;
          completedCount++;

          this.syncTeamPermissions(editing.assignedTeamId, (permissions) => [
            ...permissions,
            {
              collectionId: collection.collectionId,
              collectionName: collection.collectionName
            }
          ]);

          if (completedCount === collections.length) {
            this.showFinalMessage(successCount, errorCount);
          }
        });
    });
  }

  private removePermissionsFromExistingTeam(collections: any[], revokePermissions: boolean = false) {
    const editing = this.editingAssignedTeam();

    if (!editing) return;

    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;

    collections.forEach((collection) => {
      this.assignedTeamService
        .deleteAssignedTeamPermission(editing.assignedTeamId, collection.collectionId, revokePermissions)
        .pipe(
          catchError((error) => {
            completedCount++;

            if (error?.status === 404) {
              successCount++;
              this.syncTeamPermissions(editing.assignedTeamId, (permissions) => permissions.filter((p) => p.collectionId !== collection.collectionId));
              this.messageService.add({
                severity: 'info',
                summary: 'Already removed',
                detail: `${collection.collectionName} coverage was already removed by another administrator.`
              });
            } else {
              errorCount++;
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to remove permission for ${collection.collectionName}: ${getErrorMessage(error)}`
              });
              this.moveCollectionsToAssigned([collection]);
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

          this.syncTeamPermissions(editing.assignedTeamId, (permissions) => permissions.filter((p) => p.collectionId !== collection.collectionId));

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
    const editing = this.editingAssignedTeam();

    if (!editing) return;

    editing.adTeam = this.selectedAdTeams().length > 0 ? this.selectedAdTeams().join(', ') : null;
    const pendingPermissions = this.dialogMode === 'new' ? [...this.assignedCollections()] : [];
    const saveOperation = this.dialogMode === 'new' ? this.assignedTeamService.postAssignedTeam(editing) : this.assignedTeamService.putAssignedTeam(editing);

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
      this.assignedTeams.update((teams) => [...teams, newTeam]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Assigned Team Added'
      });
      this.hideDialog();
    }
  }

  private handleExistingTeamUpdated() {
    const editing = this.editingAssignedTeam();

    this.assignedTeams.update((teams) => teams.map((team) => (team.assignedTeamId === editing?.assignedTeamId ? editing! : team)));

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
            collectionId: collection.collectionId,
            previewedMembers: []
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

    this.assignedTeams.update((teams) => [...teams, newTeam]);

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
    this.deleteTeamTarget.set(assignedTeam);
    this.deleteTeamDialogVisible.set(true);
  }

  cancelDeleteTeam() {
    this.deleteTeamDialogVisible.set(false);
    this.deleteTeamTarget.set(null);
  }

  confirmDeleteTeam() {
    const assignedTeam = this.deleteTeamTarget();

    if (!assignedTeam) {
      this.cancelDeleteTeam();

      return;
    }

    this.cancelDeleteTeam();

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
        this.assignedTeams.update((teams) => teams.filter((p) => p.assignedTeamId !== assignedTeam.assignedTeamId));
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assigned Team Deleted'
        });
      });
  }

  hideDialog(): void {
    this.teamDialog.set(false);
  }

  onDialogHide(): void {
    this.editingAssignedTeam.set(null);
    this.selectedAdTeams.set([]);
    this.assignedCollections.set([]);
    this.availableCollections.set([...this.allCollections]);
    this.filteredTeams.set([...this.uniqueTeams]);
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';

    this.table().filterGlobal(inputValue, 'contains');
  }
}
