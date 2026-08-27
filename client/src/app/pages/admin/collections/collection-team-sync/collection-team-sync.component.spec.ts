/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../testing/mocks/service-mocks';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { CollectionTeamSyncComponent } from './collection-team-sync.component';
import { TeamSyncApplyResult, TeamSyncPoamPreview, TeamSyncPreview, TeamSyncProgress } from './collection-team-sync.model';
import { CollectionTeamSyncService } from './collection-team-sync.service';

describe('CollectionTeamSyncComponent', () => {
  let component: CollectionTeamSyncComponent;
  let fixture: ComponentFixture<CollectionTeamSyncComponent>;
  let mockTeamSyncService: any;
  let mockCsvExportService: any;
  let mockMessageService: any;
  let progress$: Subject<TeamSyncProgress>;

  const collection = { collectionId: 5, collectionName: 'Alpha', collectionType: 'STIG Manager', originCollectionId: 21 };
  const alpha = { assignedTeamId: 1, assignedTeamName: 'Alpha Team', automated: true };
  const bravo = { assignedTeamId: 2, assignedTeamName: 'Bravo Team', automated: true };

  const row = (overrides: Partial<TeamSyncPoamPreview> = {}): TeamSyncPoamPreview => ({
    poamId: 10,
    vulnerabilityId: 'V-1',
    status: 'Draft',
    outcome: 'changing',
    reason: null,
    add: [alpha],
    remove: [],
    addNames: 'Alpha Team',
    removeNames: '',
    assetCount: 1,
    ...overrides
  });

  const buildPreview = (changes: TeamSyncPoamPreview[], others: TeamSyncPoamPreview[] = [], overrides: Partial<TeamSyncPreview> = {}): TeamSyncPreview => ({
    collectionId: 5,
    collectionName: 'Alpha',
    collectionType: 'STIG Manager',
    hasRules: true,
    ruleCount: 2,
    poams: [...changes, ...others],
    changes,
    counts: {
      scanned: changes.length + others.length,
      changing: changes.length,
      added: changes.reduce((sum, poam) => sum + poam.add.length, 0),
      removed: changes.reduce((sum, poam) => sum + poam.remove.length, 0),
      skipped: others.filter((poam) => poam.outcome === 'skipped').length,
      unresolved: others.filter((poam) => poam.outcome === 'unresolved').length
    },
    ...overrides
  });

  const applyResult = (overrides: Partial<TeamSyncApplyResult> = {}): TeamSyncApplyResult => ({
    applied: 1,
    partial: 0,
    skipped: 0,
    failed: 0,
    teamsAdded: 1,
    teamsRemoved: 0,
    failures: [],
    ...overrides
  });

  const open = (preview: TeamSyncPreview = buildPreview([row()])) => {
    mockTeamSyncService.loadPreview.mockReturnValue(of(preview));
    fixture.componentRef.setInput('collection', collection);
    component.visible.set(true);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    progress$ = new Subject<TeamSyncProgress>();
    mockTeamSyncService = {
      progress$,
      loadPreview: vi.fn().mockReturnValue(of(buildPreview([]))),
      toChanges: vi.fn().mockReturnValue([{ poamId: 10, add: [1], remove: [] }]),
      apply: vi.fn().mockReturnValue(of(applyResult()))
    };
    mockCsvExportService = { exportToCsv: vi.fn() };
    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [CollectionTeamSyncComponent],
      providers: [
        { provide: CollectionTeamSyncService, useValue: mockTeamSyncService },
        { provide: CsvExportService, useValue: mockCsvExportService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionTeamSyncComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create idle with nothing loaded', () => {
      fixture.detectChanges();

      expect(component.phase()).toBe('idle');
      expect(component.preview()).toBeNull();
      expect(component.result()).toBeNull();
      expect(component.busy()).toBe(false);
      expect(component.canApply()).toBe(false);
      expect(mockTeamSyncService.loadPreview).not.toHaveBeenCalled();
    });

    it('should not load when visible without a collection', () => {
      component.visible.set(true);
      fixture.detectChanges();

      expect(mockTeamSyncService.loadPreview).not.toHaveBeenCalled();
      expect(component.phase()).toBe('idle');
    });
  });

  describe('Loading the preview', () => {
    it('should load the preview for the collection when opened', () => {
      const preview = buildPreview([row()]);

      open(preview);

      expect(mockTeamSyncService.loadPreview).toHaveBeenCalledWith(collection);
      expect(component.phase()).toBe('preview');
      expect(component.preview()).toBe(preview);
      expect(component.phaseLabel()).toBe('Preview');
      expect(component.collectionName()).toBe('Alpha');
      expect(component.collectionType()).toBe('STIG Manager');
      expect(component.canApply()).toBe(true);
      expect(component.changes()).toEqual(preview.changes);
    });

    it('should move to failed with the error message when loading fails', () => {
      mockTeamSyncService.loadPreview.mockReturnValue(throwError(() => new Error('403 Forbidden')));
      fixture.componentRef.setInput('collection', collection);
      component.visible.set(true);
      fixture.detectChanges();

      expect(component.phase()).toBe('failed');
      expect(component.errorMessage()).toContain('403');
      expect(component.busy()).toBe(false);
    });

    it('should reflect service progress while loading', () => {
      const pending = new Subject<TeamSyncPreview>();

      mockTeamSyncService.loadPreview.mockReturnValue(pending.asObservable());
      fixture.componentRef.setInput('collection', collection);
      component.visible.set(true);
      fixture.detectChanges();

      expect(component.phase()).toBe('loading');
      expect(component.busy()).toBe(true);
      expect(component.closable()).toBe(false);

      progress$.next({ phase: 'loading', done: 1, total: 4, label: 'Reading assets' });

      expect(component.progressPercent()).toBe(25);
      expect(component.progress()?.label).toBe('Reading assets');

      pending.next(buildPreview([row()]));
      pending.complete();

      expect(component.phase()).toBe('preview');
    });

    it('should not allow applying when there are no changes', () => {
      open(buildPreview([], [row({ outcome: 'unchanged', add: [] })]));

      expect(component.canApply()).toBe(false);
    });

    it('should allow applying removals computed for a collection without rules, as POAM details would', () => {
      open(buildPreview([row({ add: [], remove: [alpha], addNames: '', removeNames: 'Alpha Team' })], [], { hasRules: false, ruleCount: 0 }));

      expect(component.canApply()).toBe(true);
    });

    it('should expose unresolved POAMs and toggle their visibility', () => {
      open(buildPreview([row()], [row({ poamId: 11, outcome: 'unresolved', reason: 'No assets found', add: [] }), row({ poamId: 12, outcome: 'skipped', reason: 'Closed', add: [] })]));

      expect(component.unresolved().map((poam) => poam.poamId)).toEqual([11]);
      expect(component.showUnresolved()).toBe(false);

      component.toggleUnresolved();

      expect(component.showUnresolved()).toBe(true);
    });

    it('should ignore a stale preview after the dialog was reset', () => {
      const pending = new Subject<TeamSyncPreview>();

      mockTeamSyncService.loadPreview.mockReturnValue(pending.asObservable());
      fixture.componentRef.setInput('collection', collection);
      component.visible.set(true);
      fixture.detectChanges();

      component.visible.set(false);
      fixture.detectChanges();
      pending.next(buildPreview([row()]));

      expect(component.phase()).toBe('idle');
      expect(component.preview()).toBeNull();
    });
  });

  describe('Applying', () => {
    it('should apply the previewed changes and report the result with a single toast', () => {
      const preview = buildPreview([row()]);
      const result = applyResult();

      mockTeamSyncService.apply.mockReturnValue(of(result));
      open(preview);
      component.apply();

      expect(mockTeamSyncService.toChanges).toHaveBeenCalledWith(preview);
      expect(mockTeamSyncService.apply).toHaveBeenCalledWith(5, [{ poamId: 10, add: [1], remove: [] }]);
      expect(component.phase()).toBe('done');
      expect(component.result()).toBe(result);
      expect(mockMessageService.add).toHaveBeenCalledTimes(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Team Sync Complete', detail: '1 POAM(s) updated: 1 team(s) added, 0 removed' }));
    });

    it('should warn when some POAMs failed or were partially applied', () => {
      mockTeamSyncService.apply.mockReturnValue(of(applyResult({ applied: 2, failed: 1, failures: [{ poamId: 12, reason: 'deadlock' }] })));
      open();
      component.apply();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: '2 POAM(s) updated: 1 team(s) added, 0 removed, 1 failed' }));
    });

    it('should name partial and skipped outcomes in the warning toast', () => {
      mockTeamSyncService.apply.mockReturnValue(of(applyResult({ applied: 3, partial: 2, skipped: 1, teamsAdded: 4, teamsRemoved: 1 })));
      open();
      component.apply();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: '3 POAM(s) updated: 4 team(s) added, 1 removed, 2 partially applied, 1 skipped' }));
    });

    it('should warn rather than report success when a POAM was skipped', () => {
      mockTeamSyncService.apply.mockReturnValue(of(applyResult({ applied: 1, skipped: 1 })));
      open();
      component.apply();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: '1 POAM(s) updated: 1 team(s) added, 0 removed, 1 skipped' }));
    });

    it('should do nothing when applying is not allowed', () => {
      open(buildPreview([]));
      component.apply();

      expect(mockTeamSyncService.apply).not.toHaveBeenCalled();
      expect(component.phase()).toBe('preview');
    });

    it('should stay open and busy while applying and reflect progress', () => {
      const pending = new Subject<TeamSyncApplyResult>();

      mockTeamSyncService.apply.mockReturnValue(pending.asObservable());
      open();
      component.apply();

      expect(component.phase()).toBe('applying');
      expect(component.busy()).toBe(true);
      expect(component.closable()).toBe(false);

      component.close();
      expect(component.visible()).toBe(true);

      progress$.next({ phase: 'applying', done: 50, total: 100, label: 'Applying team changes' });
      expect(component.progressPercent()).toBe(50);

      pending.next(applyResult());
      pending.complete();

      expect(component.phase()).toBe('done');
      expect(component.closable()).toBe(true);
    });

    it('should move to failed if the apply stream errors', () => {
      mockTeamSyncService.apply.mockReturnValue(throwError(() => new Error('Network down')));
      open();
      component.apply();

      expect(component.phase()).toBe('failed');
      expect(component.errorMessage()).toBe('Network down');
    });
  });

  describe('Closing and export', () => {
    it('should hide the dialog and reset state on close', () => {
      open();
      component.close();
      fixture.detectChanges();

      expect(component.visible()).toBe(false);
      expect(component.phase()).toBe('idle');
      expect(component.preview()).toBeNull();
      expect(component.progress()).toBeNull();
    });

    it('should close on Escape while in preview but not while busy', () => {
      const pending = new Subject<TeamSyncApplyResult>();

      mockTeamSyncService.apply.mockReturnValue(pending.asObservable());
      open();
      component.apply();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(component.visible()).toBe(true);

      pending.next(applyResult());
      pending.complete();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(component.visible()).toBe(false);
    });

    it('should ignore Escape while hidden', () => {
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(component.visible()).toBe(false);
      expect(component.phase()).toBe('idle');
    });

    it('should export the previewed changes as CSV', () => {
      open(buildPreview([row()]));
      component.exportPreview();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        component.changes(),
        expect.objectContaining({
          filename: 'Alpha-team-sync-preview',
          columns: expect.arrayContaining([expect.objectContaining({ field: 'addNames' }), expect.objectContaining({ field: 'removeNames' })])
        })
      );
    });

    it('should not export when there are no changes', () => {
      open(buildPreview([]));
      component.exportPreview();

      expect(mockCsvExportService.exportToCsv).not.toHaveBeenCalled();
    });
  });

  describe('Template', () => {
    it('should render the summary tiles and the changes table in preview', () => {
      open(buildPreview([row({ add: [alpha, bravo] })]));
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;

      expect(host.querySelector('[data-testid="team-sync-tiles"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-changes"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-apply"]')?.textContent).toContain('Apply 1 change');
    });

    it('should show the no-rules warning alongside the removals it would apply', () => {
      open(buildPreview([row({ add: [], remove: [alpha], addNames: '', removeNames: 'Alpha Team' })], [], { hasRules: false, ruleCount: 0 }));
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const applyButton = host.querySelector('[data-testid="team-sync-apply"]') as HTMLButtonElement | null;

      expect(host.querySelector('[data-testid="team-sync-no-rules"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-changes"]')).not.toBeNull();
      expect(applyButton?.disabled).toBe(false);
    });

    it('should show the no-rules warning with the no-changes message when nothing would change', () => {
      open(buildPreview([], [], { hasRules: false, ruleCount: 0 }));
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const applyButton = host.querySelector('[data-testid="team-sync-apply"]') as HTMLButtonElement | null;

      expect(host.querySelector('[data-testid="team-sync-no-rules"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-no-changes"]')).not.toBeNull();
      expect(applyButton?.disabled).toBe(true);
    });

    it('should render its own title with a labelled dialog and no PrimeNG header', () => {
      open();
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const dialog = host.querySelector('[role="dialog"]');

      expect(dialog?.getAttribute('aria-label')).toBe('Sync Teams');
      expect(host.querySelector('.p-dialog-header')).toBeNull();
      expect(host.querySelector('h3')?.textContent).toContain('Sync Teams');
      expect(host.querySelector('.team-sync')?.getAttribute('tabindex')).toBe('-1');
    });

    it('should render the result tiles and the failures table when done', () => {
      mockTeamSyncService.apply.mockReturnValue(of(applyResult({ applied: 1, failed: 1, failures: [{ poamId: 12, reason: 'Database error (ER_LOCK_DEADLOCK)' }] })));
      open();
      component.apply();
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;

      expect(host.querySelector('[data-testid="team-sync-result"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-failures"]')?.textContent).toContain('Database error (ER_LOCK_DEADLOCK)');
      expect(host.querySelector('[data-testid="team-sync-apply"]')).toBeNull();
      expect(host.querySelector('[data-testid="team-sync-close"]')?.textContent).toContain('Close');
    });

    it('should hide the apply button and disable close while applying', () => {
      mockTeamSyncService.apply.mockReturnValue(new Subject<TeamSyncApplyResult>().asObservable());
      open();
      component.apply();
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const closeButton = host.querySelector('[data-testid="team-sync-close"]') as HTMLButtonElement | null;

      expect(host.querySelector('[data-testid="team-sync-applying"]')).not.toBeNull();
      expect(host.querySelector('[data-testid="team-sync-apply"]')).toBeNull();
      expect(closeButton?.disabled).toBe(true);
    });
  });
});
