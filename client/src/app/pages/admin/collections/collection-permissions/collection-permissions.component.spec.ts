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
import { mockCollectionList, mockCollectionPermissionDetail } from '../../../../../testing/fixtures/user-fixtures';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { CollectionPermissionsComponent } from './collection-permissions.component';
import { CollectionsService } from '../collections.service';

describe('CollectionPermissionsComponent', () => {
  let component: CollectionPermissionsComponent;
  let fixture: ComponentFixture<CollectionPermissionsComponent>;
  let mockCollectionsService: any;
  let mockMessageService: any;
  let mockCsvExportService: any;

  const loadFixtureRows = (rows: any[] = mockCollectionPermissionDetail) => {
    mockCollectionsService.getCollectionPermissionDetail.mockReturnValue(of(rows));
    component.selectedCollectionId.set(1);
    component.loadPermissions();
  };

  beforeEach(async () => {
    mockCollectionsService = {
      getAllCollections: vi.fn().mockReturnValue(of(mockCollectionList)),
      getCollectionPermissionDetail: vi.fn().mockReturnValue(of([]))
    };
    mockMessageService = createMockMessageService();
    mockCsvExportService = { exportToCsv: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CollectionPermissionsComponent],
      providers: [
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: CsvExportService, useValue: mockCsvExportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionPermissionsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default to no collection, no filters, and no data', () => {
      expect(component.selectedCollectionId()).toBeNull();
      expect(component.permissions()).toEqual([]);
      expect(component.selectedLevel()).toBeNull();
      expect(component.includeHigherLevels()).toBe(false);
      expect(component.hasActiveFilters()).toBe(false);
      expect(component.isLoading()).toBe(false);
      expect(component.loadFailed()).toBe(false);
    });
  });

  describe('Collection options', () => {
    it('should load and sort collection options by name', () => {
      component.loadCollectionOptions();

      expect(component.collectionOptions().map((option) => option.label)).toEqual(['STIG Manager Collection', 'Tenable Collection', 'Test Collection']);
    });

    it('should toast and leave options empty when collections fail to load', () => {
      mockCollectionsService.getAllCollections.mockReturnValue(throwError(() => new Error('boom')));
      component.loadCollectionOptions();

      expect(component.collectionOptions()).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to load collections') }));
    });

    it('should expose the selected collection type and name', () => {
      component.loadCollectionOptions();
      component.selectedCollectionId.set(2);

      expect(component.selectedCollectionType()).toBe('STIG Manager');
      expect(component.selectedCollectionName()).toBe('STIG Manager Collection');
    });

    it('should reload the options whenever the tab becomes active', () => {
      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();

      expect(mockCollectionsService.getAllCollections).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('active', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();

      expect(mockCollectionsService.getAllCollections).toHaveBeenCalledTimes(2);
    });

    it('should keep the previous options when a reload fails', () => {
      component.loadCollectionOptions();
      mockCollectionsService.getAllCollections.mockReturnValue(throwError(() => new Error('boom')));
      component.loadCollectionOptions();

      expect(component.collectionOptions()).toHaveLength(3);
      expect(mockMessageService.add).toHaveBeenCalledTimes(1);
    });

    it('should clear the selection and rows when the selected collection disappears', () => {
      component.loadCollectionOptions();
      loadFixtureRows();
      mockCollectionsService.getAllCollections.mockReturnValue(of(mockCollectionList.filter((collection: any) => collection.collectionId !== 1)));
      component.loadCollectionOptions();

      expect(component.selectedCollectionId()).toBeNull();
      expect(component.permissions()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Loading permissions', () => {
    it('should do nothing when no collection is selected', () => {
      component.loadPermissions();

      expect(mockCollectionsService.getCollectionPermissionDetail).not.toHaveBeenCalled();
    });

    it('should load, enrich, and store permission rows', () => {
      loadFixtureRows();

      expect(mockCollectionsService.getCollectionPermissionDetail).toHaveBeenCalledWith(1);
      expect(component.permissions()).toHaveLength(5);
      expect(component.permissions().find((row) => row.userId === 1)?.accessLevelLabel).toBe('CAT-I Approver');
      expect(component.isLoading()).toBe(false);
      expect(component.loadFailed()).toBe(false);
    });

    it('should build provenance tooltips during mapping', () => {
      loadFixtureRows();

      const withGrantor = component.permissions().find((row) => row.userId === 1);
      const withoutGrantor = component.permissions().find((row) => row.userId === 3);
      const teamSourced = component.permissions().find((row) => row.userId === 2);

      expect(withGrantor?.direct?.tooltip).toContain('Granted by Admin User on');
      expect(withoutGrantor?.direct?.tooltip).toMatch(/^Granted on /);
      expect(teamSourced?.teamGrants[0].tooltip).toContain('via team coverage');
    });

    it('should drop a stale response when a newer load started', () => {
      const first$ = new Subject<any[]>();
      const second$ = new Subject<any[]>();

      mockCollectionsService.getCollectionPermissionDetail.mockReturnValueOnce(first$).mockReturnValueOnce(second$);
      component.selectedCollectionId.set(1);
      component.loadPermissions();
      component.selectedCollectionId.set(2);
      component.loadPermissions();

      second$.next([mockCollectionPermissionDetail[1]]);
      second$.complete();
      first$.next(mockCollectionPermissionDetail);
      first$.complete();

      expect(component.permissions()).toHaveLength(1);
      expect(component.permissions()[0].userId).toBe(1);
    });

    it('should suppress the toast for a stale error', () => {
      const first$ = new Subject<any[]>();

      mockCollectionsService.getCollectionPermissionDetail.mockReturnValueOnce(first$).mockReturnValueOnce(of([]));
      component.selectedCollectionId.set(1);
      component.loadPermissions();
      component.selectedCollectionId.set(2);
      component.loadPermissions();

      first$.error(new Error('boom'));

      expect(component.loadFailed()).toBe(false);
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should toast, flag failure, and clear rows on error', () => {
      loadFixtureRows();
      mockCollectionsService.getCollectionPermissionDetail.mockReturnValue(throwError(() => new Error('boom')));
      component.loadPermissions();

      expect(component.loadFailed()).toBe(true);
      expect(component.permissions()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to load collection permissions') }));
    });

    it('should reload when the tab becomes active with a collection selected', () => {
      fixture.componentRef.setInput('active', true);
      component.selectedCollectionId.set(1);
      fixture.detectChanges();

      expect(mockCollectionsService.getCollectionPermissionDetail).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('active', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();

      expect(mockCollectionsService.getCollectionPermissionDetail).toHaveBeenCalledTimes(2);
    });

    it('should reload when the selected collection changes while active', () => {
      fixture.componentRef.setInput('active', true);
      component.selectedCollectionId.set(1);
      fixture.detectChanges();
      component.selectedCollectionId.set(2);
      fixture.detectChanges();

      expect(mockCollectionsService.getCollectionPermissionDetail).toHaveBeenLastCalledWith(2);
    });
  });

  describe('Filtering & sorting', () => {
    beforeEach(() => {
      loadFixtureRows();
    });

    it('should sort by access level descending then name ascending', () => {
      expect(component.filteredRows().map((row) => row.userId)).toEqual([1, 2, 3, 5, 4]);
    });

    it('should filter by the selected level', () => {
      component.selectedLevel.set(1);

      expect(component.filteredRows().map((row) => row.userId)).toEqual([5, 4]);
    });

    it('should expand the selected level upward when include higher levels is on', () => {
      component.selectedLevel.set(2);
      component.includeHigherLevels.set(true);

      expect(component.activeLevels()).toEqual(new Set([2, 3, 4]));
      expect(component.filteredRows().map((row) => row.userId)).toEqual([1, 2, 3]);
    });

    it('should return null active levels when nothing is selected', () => {
      expect(component.activeLevels()).toBeNull();
    });

    it('should treat a cleared level as no filter', () => {
      component.selectedLevel.set(3);

      expect(component.filteredRows()).toHaveLength(1);

      component.selectedLevel.set(null);

      expect(component.activeLevels()).toBeNull();
      expect(component.filteredRows()).toHaveLength(5);
    });

    it('should filter by name or email search', () => {
      component.searchText.set('alice');
      expect(component.filteredRows().map((row) => row.userId)).toEqual([2]);

      component.searchText.set('vera.viewer@');
      expect(component.filteredRows().map((row) => row.userId)).toEqual([4]);
    });

    it('should combine the level and search filters', () => {
      component.selectedLevel.set(2);
      component.includeHigherLevels.set(true);
      component.searchText.set('sam');

      expect(component.filteredRows().map((row) => row.userId)).toEqual([3]);
    });

    it('should count levels from unfiltered rows and groups from filtered rows', () => {
      component.selectedLevel.set(4);

      expect(component.levelCounts().get(1)).toBe(2);
      expect(component.levelCounts().get(4)).toBe(1);
      expect(component.groupCounts().get(4)).toBe(1);
      expect(component.groupCounts().get(1)).toBeUndefined();
    });

    it('should clear all filters', () => {
      component.selectedLevel.set(1);
      component.searchText.set('sam');
      component.clearFilters();

      expect(component.selectedLevel()).toBeNull();
      expect(component.searchText()).toBe('');
      expect(component.hasActiveFilters()).toBe(false);
      expect(component.filteredRows()).toHaveLength(5);
    });
  });

  describe('Level cards', () => {
    it('should build five cards with unfiltered counts', () => {
      loadFixtureRows();
      component.selectedLevel.set(4);

      const cards = component.levelCards();

      expect(cards).toHaveLength(5);
      expect(cards[0]).toEqual(expect.objectContaining({ level: null, label: 'Total Users', count: 5 }));
      expect(cards[4]).toEqual(expect.objectContaining({ level: 4, label: 'CAT-I Approver', count: 1, warning: false }));
      expect(cards[1]).toEqual(expect.objectContaining({ level: 1, label: 'Viewer', count: 2 }));
      expect(cards.some((card) => 'selected' in card)).toBe(false);
    });

    it('should warn on the CAT-I card when the collection has none', () => {
      loadFixtureRows(mockCollectionPermissionDetail.filter((row) => row.accessLevel !== 4));

      const catICard = component.levelCards().find((card) => card.level === 4);

      expect(catICard?.warning).toBe(true);
      expect(catICard?.count).toBe(0);
    });

    it('should not warn while no collection is selected', () => {
      expect(component.levelCards().find((card) => card.level === 4)?.warning).toBe(false);
    });
  });

  describe('CSV export', () => {
    it('should export the filtered rows with a flattened source column', () => {
      component.loadCollectionOptions();
      loadFixtureRows();
      component.selectedLevel.set(4);
      component.exportCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledTimes(1);

      const [rows, options] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(rows).toHaveLength(1);
      expect(rows[0].sources).toBe('Direct: CAT-I Approver');
      expect(options.filename).toBe('collection_permissions_Test Collection');
      expect(options.columns.map((column: any) => column.header)).toEqual(['Name', 'Email', 'Access Level', 'Source']);
    });

    it('should flatten direct, team, and exclusion sources together', () => {
      component.loadCollectionOptions();
      loadFixtureRows();
      component.searchText.set('sam');
      component.exportCSV();

      const [rows] = mockCsvExportService.exportToCsv.mock.calls[0];

      expect(rows[0].sources).toBe('Direct: Viewer; Team Alpha: Submitter');
    });
  });

  describe('Rendering', () => {
    it('should render the select-a-collection prompt before a collection is chosen', () => {
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Select a collection to see who has access.');
    });

    it('should render group headers with labels and counts', () => {
      loadFixtureRows();
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('CAT-I Approver');
      expect(text).toContain('Viewer');
      expect(text).toContain('(2)');
      expect(text).toContain('Cat Approver');
    });

    it('should render groups in descending access level order', () => {
      loadFixtureRows();
      fixture.detectChanges();

      const headers = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody span.font-semibold')).map((span) => span.textContent?.trim());

      expect(headers).toEqual(['CAT-I Approver', 'Approver', 'Submitter', 'Viewer']);
    });

    it('should reset the paginator to the first page when filters change', () => {
      loadFixtureRows();
      fixture.detectChanges();

      const table = component.permissionsTable();

      expect(table).toBeDefined();
      table!.first.set(50);
      component.searchText.set('a');
      fixture.detectChanges();

      expect(table!.first()).toBe(0);

      table!.first.set(50);
      component.selectedLevel.set(2);
      fixture.detectChanges();

      expect(table!.first()).toBe(0);
    });

    it('should render the four access-level filter options', () => {
      loadFixtureRows();
      fixture.detectChanges();

      const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('p-selectbutton .p-togglebutton-label')).map((label) => label.textContent?.trim());

      expect(labels).toEqual(['Viewer', 'Submitter', 'Approver', 'CAT-I Approver']);
    });

    it('should render the level cards as static tiles', () => {
      loadFixtureRows();
      fixture.detectChanges();

      const cards = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.metric-card'));

      expect(cards).toHaveLength(5);
      expect(cards.some((card) => card.hasAttribute('role') || card.hasAttribute('aria-pressed') || card.hasAttribute('tabindex'))).toBe(false);
    });

    it('should render the failure empty state with a retry action', () => {
      component.selectedCollectionId.set(1);
      component.loadFailed.set(true);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain("Couldn't load permissions for this collection.");
      expect(text).toContain('Retry');
    });

    it('should render the no-match empty state when filters exclude everyone', () => {
      loadFixtureRows();
      component.searchText.set('zzz-no-match');
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('No users match the current filters.');
      expect(text).toContain('Clear filters');
    });

    it('should render the true empty state when the collection has no users', () => {
      loadFixtureRows([]);
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No users have access to this collection.');
    });
  });

  describe('View user', () => {
    it('should emit the userId for the deep link', () => {
      const emitted: number[] = [];

      component.viewUser.subscribe((userId) => emitted.push(userId));
      loadFixtureRows();
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Open Cat Approver in User Management"]') as HTMLButtonElement;

      button.click();

      expect(emitted).toEqual([1]);
    });
  });
});
