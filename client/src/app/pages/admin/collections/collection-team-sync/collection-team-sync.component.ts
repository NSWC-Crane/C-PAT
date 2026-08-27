/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, input, model, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Collections } from '../../../../common/models/collections.model';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { TeamSyncApplyResult, TeamSyncPhase, TeamSyncPoamPreview, TeamSyncPreview, TeamSyncProgress } from './collection-team-sync.model';
import { CollectionTeamSyncService } from './collection-team-sync.service';

const PHASE_LABELS: Record<TeamSyncPhase, string> = {
  idle: '',
  loading: 'Loading',
  preview: 'Preview',
  applying: 'Applying',
  done: 'Complete',
  failed: 'Failed'
};

const PREVIEW_CSV_COLUMNS = [
  { field: 'poamId', header: 'POAM ID' },
  { field: 'vulnerabilityId', header: 'Vulnerability' },
  { field: 'status', header: 'Status' },
  { field: 'addNames', header: 'Teams to Add' },
  { field: 'removeNames', header: 'Teams to Remove' }
];

@Component({
  selector: 'cpat-collection-team-sync',
  templateUrl: './collection-team-sync.component.html',
  styleUrls: ['./collection-team-sync.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, DialogModule, MessageModule, ProgressBarModule, TableModule, TagModule, TooltipModule]
})
export class CollectionTeamSyncComponent {
  private readonly teamSyncService = inject(CollectionTeamSyncService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly collection = input<Collections | null>(null);
  readonly visible = model(false);
  readonly dialogPt = { root: { 'aria-label': 'Sync Teams' } };
  private readonly content = viewChild<ElementRef<HTMLElement>>('teamSyncContent');

  readonly phase = signal<TeamSyncPhase>('idle');
  readonly progress = signal<TeamSyncProgress | null>(null);
  readonly preview = signal<TeamSyncPreview | null>(null);
  readonly result = signal<TeamSyncApplyResult | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly showUnresolved = signal(false);
  private runGeneration = 0;

  readonly collectionName = computed(() => this.collection()?.collectionName ?? '');
  readonly collectionType = computed(() => this.preview()?.collectionType ?? this.collection()?.collectionType ?? '');
  readonly phaseLabel = computed(() => PHASE_LABELS[this.phase()]);
  readonly busy = computed(() => this.phase() === 'loading' || this.phase() === 'applying');
  readonly closable = computed(() => !this.busy());
  readonly progressPercent = computed(() => {
    const progress = this.progress();

    return progress && progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  });
  readonly changes = computed<TeamSyncPoamPreview[]>(() => this.preview()?.changes ?? []);
  readonly unresolved = computed<TeamSyncPoamPreview[]>(() => (this.preview()?.poams ?? []).filter((poam) => poam.outcome === 'unresolved'));
  readonly canApply = computed(() => this.phase() === 'preview' && this.changes().length > 0);

  constructor() {
    this.teamSyncService.progress$.pipe(takeUntilDestroyed()).subscribe((progress) => this.progress.set(progress));

    effect(() => {
      const visible = this.visible();
      const collection = this.collection();

      untracked(() => {
        if (visible && collection) {
          this.start(collection);
        } else if (!visible) {
          this.reset();
        }
      });
    });
  }

  apply(): void {
    const preview = this.preview();

    if (!this.canApply() || !preview) return;

    const generation = ++this.runGeneration;

    this.phase.set('applying');
    this.progress.set(null);

    this.teamSyncService
      .apply(preview.collectionId, this.teamSyncService.toChanges(preview))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (generation !== this.runGeneration) return;

          this.result.set(result);
          this.phase.set('done');
          this.messageService.add({
            severity: result.failed > 0 || result.partial > 0 || result.skipped > 0 ? 'warn' : 'success',
            summary: 'Team Sync Complete',
            detail: this.describeResult(result),
            life: 6000
          });
        },
        error: (error) => {
          if (generation !== this.runGeneration) return;

          this.errorMessage.set(getErrorMessage(error));
          this.phase.set('failed');
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.close();
    }
  }

  close(): void {
    if (this.busy()) return;

    this.visible.set(false);
  }

  focusContent(): void {
    this.content()?.nativeElement.focus();
  }

  exportPreview(): void {
    const preview = this.preview();

    if (!preview || preview.changes.length === 0) return;

    const safeName = (preview.collectionName || `collection-${preview.collectionId}`).replaceAll(/[^\w-]+/g, '-');

    this.csvExportService.exportToCsv(preview.changes, { filename: `${safeName}-team-sync-preview`, columns: PREVIEW_CSV_COLUMNS });
  }

  toggleUnresolved(): void {
    this.showUnresolved.update((value) => !value);
  }

  reset(): void {
    this.runGeneration += 1;
    this.phase.set('idle');
    this.progress.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.errorMessage.set(null);
    this.showUnresolved.set(false);
  }

  private describeResult(result: TeamSyncApplyResult): string {
    const parts = [`${result.applied} POAM(s) updated: ${result.teamsAdded} team(s) added, ${result.teamsRemoved} removed`];

    if (result.partial > 0) parts.push(`${result.partial} partially applied`);
    if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
    if (result.failed > 0) parts.push(`${result.failed} failed`);

    return parts.join(', ');
  }

  private start(collection: Collections): void {
    const generation = ++this.runGeneration;

    this.phase.set('loading');
    this.progress.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.errorMessage.set(null);
    this.showUnresolved.set(false);

    this.teamSyncService
      .loadPreview(collection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          if (generation !== this.runGeneration) return;

          this.preview.set(preview);
          this.phase.set('preview');
        },
        error: (error) => {
          if (generation !== this.runGeneration) return;

          this.errorMessage.set(getErrorMessage(error));
          this.phase.set('failed');
        }
      });
  }
}
