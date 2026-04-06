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
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableFiltersComponent } from './tenableFilters.component';
import { ImportService } from '../../../import.service';
import { PayloadService } from '../../../../../common/services/setPayload.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

const mockFilters = [
  { filterId: 1, filterName: 'My Filter', filter: '{}', createdBy: 'testuser' },
  { filterId: 2, filterName: 'Admin Filter', filter: '{}', createdBy: 'adminuser' }
];

describe('TenableFiltersComponent', () => {
  let component: TenableFiltersComponent;
  let fixture: ComponentFixture<TenableFiltersComponent>;
  let mockImportService: any;
  let mockMessageService: any;
  let mockPayloadService: any;
  let accessLevelSubject: BehaviorSubject<number>;
  let userSubject: BehaviorSubject<any>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };
  });

  beforeEach(async () => {
    accessLevelSubject = new BehaviorSubject<number>(2);
    userSubject = new BehaviorSubject<any>({ userName: 'testuser' });

    mockImportService = {
      getTenableFilters: vi.fn().mockReturnValue(of(mockFilters)),
      addTenableFilter: vi.fn().mockReturnValue(of({})),
      updateTenableFilter: vi.fn().mockReturnValue(of({}))
    };

    mockMessageService = createMockMessageService();

    mockPayloadService = {
      setPayload: vi.fn(),
      accessLevel$: accessLevelSubject.asObservable(),
      user$: userSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [TenableFiltersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ImportService, useValue: mockImportService }, { provide: MessageService, useValue: mockMessageService }, { provide: PayloadService, useValue: mockPayloadService }]
    })
      .overrideComponent(TenableFiltersComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableFiltersComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default collectionId to 0', () => {
      expect(component.collectionId).toBe(0);
    });

    it('should default activeFilters to empty array', () => {
      expect(component.activeFilters).toEqual([]);
    });

    it('should default tenableTool to empty string', () => {
      expect(component.tenableTool).toBe('');
    });

    it('should default saveFilterDialog to false', () => {
      expect(component.saveFilterDialog).toBe(false);
    });

    it('should default selectedFilter to empty string', () => {
      expect(component.selectedFilter).toBe('');
    });

    it('should default currentFilter to empty string', () => {
      expect(component.currentFilter).toBe('');
    });

    it('should default isUpdating to false', () => {
      expect(component.isUpdating).toBe(false);
    });

    it('should default canUpdate to false', () => {
      expect(component.canUpdate).toBe(false);
    });

    it('should default accessLevel signal to 0', () => {
      expect(component.accessLevel()).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should call setPayload', () => {
      component.ngOnInit();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to accessLevel$ and update signal', () => {
      component.ngOnInit();
      expect(component.accessLevel()).toBe(2);
    });

    it('should update accessLevel signal when subject emits new value', () => {
      component.ngOnInit();
      accessLevelSubject.next(4);
      expect(component.accessLevel()).toBe(4);
    });

    it('should subscribe to user$ and set currentUser', () => {
      component.ngOnInit();
      expect(component.currentUser).toEqual({ userName: 'testuser' });
    });

    it('should update currentUser when user$ emits new value', () => {
      component.ngOnInit();
      userSubject.next({ userName: 'newuser' });
      expect(component.currentUser).toEqual({ userName: 'newuser' });
    });
  });

  describe('showSaveFilterDialog', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.collectionId = 1;
      component.tenableTool = 'sumid';
      component.activeFilters = [{ id: 'severity', value: 'High' }];
    });

    it('should set saveFilterDialog to true', () => {
      component.showSaveFilterDialog();
      expect(component.saveFilterDialog).toBe(true);
    });

    it('should reset selectedFilter to empty string', () => {
      component.selectedFilter = 'old';
      component.showSaveFilterDialog();
      expect(component.selectedFilter).toBe('');
    });

    it('should reset selectedFilterId to null', () => {
      component.selectedFilterId = 5;
      component.showSaveFilterDialog();
      expect(component.selectedFilterId).toBeNull();
    });

    it('should reset isUpdating to false', () => {
      component.isUpdating = true;
      component.showSaveFilterDialog();
      expect(component.isUpdating).toBe(false);
    });

    it('should reset canUpdate to false', () => {
      component.canUpdate = true;
      component.showSaveFilterDialog();
      expect(component.canUpdate).toBe(false);
    });

    it('should set currentFilter as JSON with tool and filters', () => {
      component.showSaveFilterDialog();
      const parsed = JSON.parse(component.currentFilter);

      expect(parsed.tool).toBe('sumid');
      expect(parsed.filters).toEqual([{ id: 'severity', value: 'High' }]);
    });

    it('should call loadExistingFilters', () => {
      const spy = vi.spyOn(component, 'loadExistingFilters');

      component.showSaveFilterDialog();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadExistingFilters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not call getTenableFilters when collectionId is 0', () => {
      component.collectionId = 0;
      component.loadExistingFilters();
      expect(mockImportService.getTenableFilters).not.toHaveBeenCalled();
    });

    it('should call getTenableFilters with collectionId', () => {
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(mockImportService.getTenableFilters).toHaveBeenCalledWith(1);
    });

    it('should map filters to FilterOption objects', () => {
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(component.existingFilters.length).toBe(2);
      expect(component.existingFilters[0].label).toBe('My Filter');
      expect(component.existingFilters[0].filterId).toBe(1);
    });

    it('should set disabled=false for filter created by current user', () => {
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(component.existingFilters[0].disabled).toBe(false);
    });

    it('should set disabled=true for filter not created by current user with access level < 4', () => {
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(component.existingFilters[1].disabled).toBe(true);
    });

    it('should set disabled=false for all filters when accessLevel is 4', () => {
      accessLevelSubject.next(4);
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(component.existingFilters.every((f: any) => !f.disabled)).toBe(true);
    });

    it('should set existingFilters to empty array on error', () => {
      mockImportService.getTenableFilters.mockReturnValue(throwError(() => new Error('fail')));
      component.collectionId = 1;
      component.loadExistingFilters();
      expect(component.existingFilters).toEqual([]);
    });
  });

  describe('searchFilters', () => {
    beforeEach(() => {
      component.existingFilters = [
        { label: 'My Filter', value: 'My Filter', filterId: 1 },
        { label: 'Admin Filter', value: 'Admin Filter', filterId: 2 },
        { label: 'Test Filter', value: 'Test Filter', filterId: 3 }
      ];
    });

    it('should filter by case-insensitive query', () => {
      component.searchFilters({ query: 'my' });
      expect(component.filteredFilters.length).toBe(1);
      expect(component.filteredFilters[0].label).toBe('My Filter');
    });

    it('should return all filters when query matches all', () => {
      component.searchFilters({ query: 'filter' });
      expect(component.filteredFilters.length).toBe(3);
    });

    it('should return empty array when query matches none', () => {
      component.searchFilters({ query: 'zzz' });
      expect(component.filteredFilters.length).toBe(0);
    });

    it('should be case-insensitive', () => {
      component.searchFilters({ query: 'ADMIN' });
      expect(component.filteredFilters.length).toBe(1);
      expect(component.filteredFilters[0].label).toBe('Admin Filter');
    });
  });

  describe('onFilterSelect', () => {
    it('should set selectedFilterId and isUpdating when valid non-disabled filter selected', () => {
      component.onFilterSelect({ value: { filterId: 1, label: 'My Filter', disabled: false, createdBy: 'testuser' } });
      expect(component.selectedFilterId).toBe(1);
      expect(component.isUpdating).toBe(true);
      expect(component.canUpdate).toBe(true);
    });

    it('should show info message when valid filter selected', () => {
      component.onFilterSelect({ value: { filterId: 1, label: 'My Filter', disabled: false } });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
    });

    it('should show warn and reset selectedFilter when disabled filter selected', () => {
      component.onFilterSelect({ value: { filterId: 2, label: 'Admin Filter', disabled: true, createdBy: 'adminuser' } });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should NOT set selectedFilterId when disabled filter is selected', () => {
      component.onFilterSelect({ value: { filterId: 2, label: 'Admin Filter', disabled: true, createdBy: 'adminuser' } });
      expect(component.selectedFilterId).toBeNull();
    });

    it('should clear state when event has no valid filterId', () => {
      component.selectedFilterId = 5;
      component.isUpdating = true;
      component.onFilterSelect({ value: 'plain string' });
      expect(component.selectedFilterId).toBeNull();
      expect(component.isUpdating).toBe(false);
      expect(component.canUpdate).toBe(false);
    });

    it('should clear state when event value is null', () => {
      component.selectedFilterId = 5;
      component.onFilterSelect({ value: null });
      expect(component.selectedFilterId).toBeNull();
    });
  });

  describe('onFilterClear', () => {
    it('should reset selectedFilterId to null', () => {
      component.selectedFilterId = 5;
      component.onFilterClear();
      expect(component.selectedFilterId).toBeNull();
    });

    it('should reset isUpdating to false', () => {
      component.isUpdating = true;
      component.onFilterClear();
      expect(component.isUpdating).toBe(false);
    });

    it('should reset canUpdate to false', () => {
      component.canUpdate = true;
      component.onFilterClear();
      expect(component.canUpdate).toBe(false);
    });
  });

  describe('saveCustomFilter', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.collectionId = 1;
      component.existingFilters = [];
    });

    it('should show error when filter name is empty string', () => {
      component.selectedFilter = '';
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Filter name is required' }));
    });

    it('should show error when filter name is whitespace only', () => {
      component.selectedFilter = '   ';
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Filter name is required' }));
    });

    it('should call addTenableFilter when not updating', () => {
      component.selectedFilter = 'New Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockImportService.addTenableFilter).toHaveBeenCalledWith(1, expect.objectContaining({ filterName: 'New Filter' }));
    });

    it('should show success and close dialog on add success', () => {
      component.selectedFilter = 'New Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      expect(component.saveFilterDialog).toBe(false);
    });

    it('should emit filterSaved on add success', () => {
      const spy = vi.spyOn(component.filterSaved, 'emit');

      component.selectedFilter = 'New Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error on add failure', () => {
      mockImportService.addTenableFilter.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedFilter = 'New Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should call updateTenableFilter when isUpdating and canUpdate', () => {
      component.selectedFilter = 'Existing Filter';
      component.isUpdating = true;
      component.canUpdate = true;
      component.selectedFilterId = 3;
      component.saveCustomFilter();
      expect(mockImportService.updateTenableFilter).toHaveBeenCalledWith(1, 3, expect.objectContaining({ filterName: 'Existing Filter', filterId: 3 }));
    });

    it('should show success and close dialog on update success', () => {
      component.selectedFilter = 'Existing Filter';
      component.isUpdating = true;
      component.canUpdate = true;
      component.selectedFilterId = 3;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      expect(component.saveFilterDialog).toBe(false);
    });

    it('should emit filterSaved on update success', () => {
      const spy = vi.spyOn(component.filterSaved, 'emit');

      component.selectedFilter = 'Existing Filter';
      component.isUpdating = true;
      component.canUpdate = true;
      component.selectedFilterId = 3;
      component.saveCustomFilter();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error on update failure', () => {
      mockImportService.updateTenableFilter.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedFilter = 'Existing Filter';
      component.isUpdating = true;
      component.canUpdate = true;
      component.selectedFilterId = 3;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show warn when filter name already exists and current user can update it', () => {
      component.currentUser = { userName: 'testuser' };
      component.existingFilters = [{ label: 'My Filter', value: 'My Filter', filterId: 1, createdBy: 'testuser' }];
      component.selectedFilter = 'My Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show error when filter name exists and user cannot update it', () => {
      component.currentUser = { userName: 'testuser' };
      component.existingFilters = [{ label: 'Admin Filter', value: 'Admin Filter', filterId: 2, createdBy: 'adminuser' }];
      component.selectedFilter = 'Admin Filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Filter Name Taken' }));
    });

    it('should match existing filter name case-insensitively', () => {
      component.existingFilters = [{ label: 'My Filter', value: 'My Filter', filterId: 1, createdBy: 'testuser' }];
      component.selectedFilter = 'my filter';
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockImportService.addTenableFilter).not.toHaveBeenCalled();
    });

    it('should use label from FilterOption object as filter name', () => {
      component.selectedFilter = { label: 'Option Filter', value: 'option-filter', filterId: 5 };
      component.isUpdating = false;
      component.saveCustomFilter();
      expect(mockImportService.addTenableFilter).toHaveBeenCalledWith(1, expect.objectContaining({ filterName: 'Option Filter' }));
    });
  });

  describe('cancelSaveFilter', () => {
    it('should set saveFilterDialog to false', () => {
      component.saveFilterDialog = true;
      component.cancelSaveFilter();
      expect(component.saveFilterDialog).toBe(false);
    });

    it('should reset selectedFilter to empty string', () => {
      component.selectedFilter = 'some filter';
      component.cancelSaveFilter();
      expect(component.selectedFilter).toBe('');
    });

    it('should reset currentFilter to empty string', () => {
      component.currentFilter = '{"tool":"sumid"}';
      component.cancelSaveFilter();
      expect(component.currentFilter).toBe('');
    });

    it('should reset selectedFilterId to null', () => {
      component.selectedFilterId = 5;
      component.cancelSaveFilter();
      expect(component.selectedFilterId).toBeNull();
    });

    it('should reset isUpdating to false', () => {
      component.isUpdating = true;
      component.cancelSaveFilter();
      expect(component.isUpdating).toBe(false);
    });

    it('should reset canUpdate to false', () => {
      component.canUpdate = true;
      component.cancelSaveFilter();
      expect(component.canUpdate).toBe(false);
    });
  });

  describe('getFilterNamePlaceholder', () => {
    it('should return update placeholder when isUpdating is true', () => {
      component.isUpdating = true;
      expect(component.getFilterNamePlaceholder()).toBe('Updating existing filter...');
    });

    it('should return enter placeholder when isUpdating is false', () => {
      component.isUpdating = false;
      expect(component.getFilterNamePlaceholder()).toBe('Enter filter name...');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      component.ngOnInit();
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
