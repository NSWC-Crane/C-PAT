/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, catchError, of } from 'rxjs';
import { ACCESS_LEVEL_OPTIONS, getAccessLevelLabel } from '../../../../common/utils/access-level.util';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { CollectionsService } from '../collections.service';

interface DirectGrant {
  accessLevel: number;
  grantedAt: string | null;
  grantedBy: number | null;
  grantedByName: string | null;
  tooltip: string;
}

interface TeamGrant {
  assignedTeamId: number;
  assignedTeamName: string;
  accessLevel: number;
  grantedAt: string | null;
  tooltip: string;
}

interface GrantExclusion {
  assignedTeamId: number;
  assignedTeamName: string;
  excludedAt: string | null;
}

interface CollectionPermissionRow {
  userId: number;
  accessLevel: number;
  accessLevelLabel: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  direct: DirectGrant | null;
  teamGrants: TeamGrant[];
  exclusions: GrantExclusion[];
}

interface LevelCard {
  level: number | null;
  label: string;
  icon: string;
  count: number;
  warning: boolean;
}

const LEVEL_ICONS: Record<number, string> = {
  1: 'pi pi-eye',
  2: 'pi pi-pencil',
  3: 'pi pi-check-circle',
  4: 'pi pi-shield'
};

@Component({
  selector: 'cpat-collection-permissions',
  templateUrl: './collection-permissions.component.html',
  styleUrls: ['./collection-permissions.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, CheckboxModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, SelectButtonModule, SelectModule, SkeletonModule, TableModule, TagModule, TooltipModule]
})
export class CollectionPermissionsComponent {
  private readonly collectionsService = inject(CollectionsService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly active = input(false);
  readonly viewUser = output<number>();

  readonly permissionsTable = viewChild<Table>('permissionsTable');

  readonly collectionOptions = signal<{ label: string; value: number; collectionType: string }[]>([]);
  readonly selectedCollectionId = signal<number | null>(null);
  readonly permissions = signal<CollectionPermissionRow[]>([]);
  readonly isLoading = signal(false);
  readonly loadFailed = signal(false);
  private loadGeneration = 0;

  readonly searchText = signal('');
  readonly selectedLevel = signal<number | null>(null);
  readonly includeHigherLevels = signal(false);

  protected readonly accessLevelOptions = ACCESS_LEVEL_OPTIONS;
  protected readonly getAccessLevelLabel = getAccessLevelLabel;

  readonly selectedCollectionType = computed(() => this.collectionOptions().find((option) => option.value === this.selectedCollectionId())?.collectionType ?? null);

  readonly selectedCollectionName = computed(() => this.collectionOptions().find((option) => option.value === this.selectedCollectionId())?.label ?? null);

  readonly activeLevels = computed<Set<number> | null>(() => {
    const selected = this.selectedLevel();

    if (selected === null) return null;

    const levels = new Set<number>([selected]);

    if (this.includeHigherLevels()) {
      for (let higher = selected + 1; higher <= 4; higher++) {
        levels.add(higher);
      }
    }

    return levels;
  });

  readonly filteredRows = computed<CollectionPermissionRow[]>(() => {
    const levels = this.activeLevels();
    const search = this.searchText().trim().toLowerCase();

    return this.permissions()
      .filter((row) => (!levels || levels.has(row.accessLevel)) && (!search || (row.fullName ?? '').toLowerCase().includes(search) || (row.email ?? '').toLowerCase().includes(search)))
      .sort((a, b) => b.accessLevel - a.accessLevel || (a.fullName ?? '').localeCompare(b.fullName ?? ''));
  });

  readonly levelCounts = computed<Map<number, number>>(() => {
    const counts = new Map<number, number>();

    for (const row of this.permissions()) {
      counts.set(row.accessLevel, (counts.get(row.accessLevel) ?? 0) + 1);
    }

    return counts;
  });

  readonly groupCounts = computed<Map<number, number>>(() => {
    const counts = new Map<number, number>();

    for (const row of this.filteredRows()) {
      counts.set(row.accessLevel, (counts.get(row.accessLevel) ?? 0) + 1);
    }

    return counts;
  });

  readonly levelCards = computed<LevelCard[]>(() => {
    const counts = this.levelCounts();
    const hasCollection = this.selectedCollectionId() !== null;

    return [
      { level: null, label: 'Total Users', icon: 'pi pi-users', count: this.permissions().length, warning: false },
      ...ACCESS_LEVEL_OPTIONS.map(({ label, value }) => ({
        level: value,
        label,
        icon: LEVEL_ICONS[value],
        count: counts.get(value) ?? 0,
        warning: value === 4 && hasCollection && !this.isLoading() && !this.loadFailed() && (counts.get(4) ?? 0) === 0
      }))
    ];
  });

  readonly hasActiveFilters = computed(() => this.selectedLevel() !== null || this.searchText().trim().length > 0);

  readonly showSkeleton = computed(() => this.isLoading() && this.permissions().length === 0);

  constructor() {
    effect(() => {
      if (this.active()) {
        untracked(() => this.loadCollectionOptions());
      }
    });

    effect(() => {
      const isActive = this.active();
      const collectionId = this.selectedCollectionId();

      if (isActive && collectionId !== null) {
        untracked(() => this.loadPermissions());
      }
    });

    effect(() => {
      this.searchText();
      this.selectedLevel();
      this.includeHigherLevels();
      this.selectedCollectionId();
      untracked(() => this.permissionsTable()?.first.set(0));
    });
  }

  loadCollectionOptions(): void {
    this.collectionsService
      .getAllCollections()
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load collections: ${getErrorMessage(error)}`
          });

          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((collections) => {
        if (!collections) return;

        const options = collections.map((collection: any) => ({ label: collection.collectionName, value: collection.collectionId, collectionType: collection.collectionType || 'C-PAT' })).sort((a, b) => a.label.localeCompare(b.label));

        this.collectionOptions.set(options);

        const selected = this.selectedCollectionId();

        if (selected !== null && !options.some((option) => option.value === selected)) {
          this.loadGeneration++;
          this.selectedCollectionId.set(null);
          this.permissions.set([]);
          this.isLoading.set(false);
          this.loadFailed.set(false);
        }
      });
  }

  loadPermissions(): void {
    const collectionId = this.selectedCollectionId();

    if (collectionId === null) return;

    this.isLoading.set(true);
    this.loadFailed.set(false);
    const gen = ++this.loadGeneration;

    this.collectionsService
      .getCollectionPermissionDetail(collectionId)
      .pipe(
        catchError((error) => {
          if (gen !== this.loadGeneration) return EMPTY;

          this.loadFailed.set(true);
          this.permissions.set([]);
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load collection permissions: ${getErrorMessage(error)}`
          });

          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rows) => {
        if (gen !== this.loadGeneration) return;

        this.permissions.set((rows ?? []).map((row: any) => this.mapRow(row)));
        this.isLoading.set(false);
      });
  }

  clearFilters(): void {
    this.selectedLevel.set(null);
    this.searchText.set('');
  }

  onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  levelIcon(level: number): string {
    return LEVEL_ICONS[level] ?? 'pi pi-user';
  }

  getTagColor(collectionType: string): 'secondary' | 'success' | 'warn' | 'danger' | 'info' | undefined {
    switch (collectionType) {
      case 'C-PAT':
        return 'secondary';
      case 'STIG Manager':
        return 'success';
      case 'Tenable':
        return 'danger';
      default:
        return 'info';
    }
  }

  exportCSV(): void {
    const rows = this.filteredRows().map((row) => ({ ...row, sources: this.formatSources(row) }));

    this.csvExportService.exportToCsv(rows, {
      filename: `collection_permissions_${this.selectedCollectionName() ?? 'export'}`,
      columns: [
        { field: 'fullName', header: 'Name' },
        { field: 'email', header: 'Email' },
        { field: 'accessLevelLabel', header: 'Access Level' },
        { field: 'sources', header: 'Source' }
      ],
      includeTimestamp: true
    });
  }

  private formatSources(row: CollectionPermissionRow): string {
    const parts: string[] = [];

    if (row.direct) {
      parts.push(`Direct: ${getAccessLevelLabel(row.direct.accessLevel)}`);
    }

    for (const grant of row.teamGrants) {
      parts.push(`${grant.assignedTeamName}: ${getAccessLevelLabel(grant.accessLevel)}`);
    }

    for (const exclusion of row.exclusions) {
      parts.push(`Excluded: ${exclusion.assignedTeamName}`);
    }

    return parts.join('; ');
  }

  private mapRow(row: any): CollectionPermissionRow {
    const direct = row.direct
      ? {
          ...row.direct,
          tooltip: row.direct.grantedByName ? `Granted by ${row.direct.grantedByName} on ${this.formatDate(row.direct.grantedAt)}` : `Granted on ${this.formatDate(row.direct.grantedAt)}`
        }
      : null;
    const teamGrants = (row.teamGrants ?? []).map((grant: any) => ({ ...grant, tooltip: `Granted ${this.formatDate(grant.grantedAt)} via team coverage` }));

    return {
      ...row,
      accessLevelLabel: getAccessLevelLabel(row.accessLevel),
      direct,
      teamGrants,
      exclusions: row.exclusions ?? []
    };
  }

  private formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : 'an unknown date';
  }
}
