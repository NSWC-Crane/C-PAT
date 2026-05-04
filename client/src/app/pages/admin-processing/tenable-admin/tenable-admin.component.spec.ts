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
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TenableAdminComponent } from './tenable-admin.component';
import { CollectionsService } from '../collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { createMockMessageService, createMockConfirmationService } from '../../../../testing/mocks/service-mocks';

const mockRepositories = [
  { id: '101', name: 'Repo Alpha', description: 'First repo', dataFormat: 'IPv4', uuid: 'uuid-1' },
  { id: '102', name: 'Repo Beta', description: 'Second repo', dataFormat: 'IPv4', uuid: 'uuid-2' },
  { id: '103', name: 'Repo Gamma', description: 'Third repo', dataFormat: 'IPv6', uuid: 'uuid-3' }
];

const mockExistingCollections = [{ collectionId: 10, collectionName: 'Repo Alpha' }];

describe('TenableAdminComponent', () => {
  let component: TenableAdminComponent;
  let fixture: ComponentFixture<TenableAdminComponent>;
  let mockCollectionsService: any;
  let mockImportService: any;
  let mockConfirmationService: any;
  let mockMessageService: any;

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
    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([...mockExistingCollections])),
      addCollection: vi.fn().mockReturnValue(of({ collectionId: 99, collectionName: 'New Collection' }))
    };

    mockImportService = {
      getTenableRepositories: vi.fn().mockReturnValue(of({ response: [...mockRepositories] }))
    };

    mockConfirmationService = createMockConfirmationService();
    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: CollectionsService, useValue: mockCollectionsService }, { provide: ImportService, useValue: mockImportService }]
    })
      .overrideComponent(TenableAdminComponent, {
        set: {
          imports: [ButtonModule, ConfirmDialogModule, SelectModule, FormsModule, ToastModule],
          providers: [
            { provide: ConfirmationService, useValue: mockConfirmationService },
            { provide: MessageService, useValue: mockMessageService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableAdminComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default tenableRepositories to empty array', () => {
      expect(component.tenableRepositories).toEqual([]);
    });

    it('should default filteredRepositories to empty array', () => {
      expect(component.filteredRepositories).toEqual([]);
    });

    it('should default selectedTenableRepository to null', () => {
      expect(component.selectedTenableRepository).toBeNull();
    });

    it('should default existingCollections to empty array', () => {
      expect(component.existingCollections).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call fetchDataAndCompare', () => {
      const spy = vi.spyOn(component, 'fetchDataAndCompare');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should populate tenableRepositories after init', () => {
      component.ngOnInit();
      expect(component.tenableRepositories.length).toBe(3);
    });

    it('should populate existingCollections after init', () => {
      component.ngOnInit();
      expect(component.existingCollections.length).toBe(1);
    });
  });

  describe('fetchDataAndCompare', () => {
    it('should extract response from getTenableRepositories', () => {
      component.fetchDataAndCompare();
      expect(component.tenableRepositories).toEqual(mockRepositories);
    });

    it('should set existingCollections from collections service', () => {
      component.fetchDataAndCompare();
      expect(component.existingCollections).toEqual(mockExistingCollections);
    });

    it('should call filterRepositories after fetching', () => {
      const spy = vi.spyOn(component, 'filterRepositories');

      component.fetchDataAndCompare();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error and return EMPTY when getTenableRepositories fails', () => {
      mockImportService.getTenableRepositories.mockReturnValue(throwError(() => new Error('Tenable error')));
      component.fetchDataAndCompare();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error and return EMPTY when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('DB error')));
      component.fetchDataAndCompare();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('filterRepositories', () => {
    it('should exclude repositories already in existingCollections (case-insensitive)', () => {
      component.tenableRepositories = [...mockRepositories];
      component.existingCollections = [...mockExistingCollections];
      component.filterRepositories();
      expect(component.filteredRepositories.length).toBe(2);
      expect(component.filteredRepositories.map((r) => r.name)).not.toContain('Repo Alpha');
    });

    it('should include all repositories when no existing collections match', () => {
      component.tenableRepositories = [...mockRepositories];
      component.existingCollections = [];
      component.filterRepositories();
      expect(component.filteredRepositories.length).toBe(3);
    });

    it('should show info message when all repositories are already imported', () => {
      component.tenableRepositories = [{ id: '101', name: 'Repo Alpha', description: '', dataFormat: 'IPv4', uuid: 'uuid-1' }];
      component.existingCollections = [{ collectionId: 10, collectionName: 'Repo Alpha' }];
      component.filterRepositories();
      expect(component.filteredRepositories.length).toBe(0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'No Repositories' }));
    });

    it('should filter case-insensitively', () => {
      component.tenableRepositories = [{ id: '101', name: 'REPO ALPHA', description: '', dataFormat: 'IPv4', uuid: 'uuid-1' }];
      component.existingCollections = [{ collectionId: 10, collectionName: 'repo alpha' }];
      component.filterRepositories();
      expect(component.filteredRepositories.length).toBe(0);
    });
  });

  describe('onTenableRepositorySelect', () => {
    it('should set selectedTenableRepository', () => {
      const repo = mockRepositories[1];

      component.onTenableRepositorySelect(repo);
      expect(component.selectedTenableRepository).toBe(repo);
    });
  });

  describe('showPopup', () => {
    it('should call confirmationService.confirm with Alert header', () => {
      component.showPopup('Test message');
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Test message', header: 'Alert' }));
    });

    it('should set rejectVisible to false', () => {
      component.showPopup('Test message');
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ rejectVisible: false }));
    });
  });

  describe('importTenableRepository', () => {
    it('should call showPopup when no repository is selected', () => {
      const spy = vi.spyOn(component, 'showPopup');

      component.selectedTenableRepository = null;
      component.importTenableRepository();
      expect(spy).toHaveBeenCalledWith('Please select a repository to import.');
    });

    it('should not call addCollection when no repository is selected', () => {
      component.selectedTenableRepository = null;
      component.importTenableRepository();
      expect(mockCollectionsService.addCollection).not.toHaveBeenCalled();
    });

    it('should call addCollection with correct data when repository is selected', () => {
      component.selectedTenableRepository = mockRepositories[1];
      component.importTenableRepository();
      expect(mockCollectionsService.addCollection).toHaveBeenCalledWith({
        collectionName: 'Repo Beta',
        description: 'Second repo',
        collectionType: 'Tenable',
        originCollectionId: 102
      });
    });

    it('should coerce string id to number in originCollectionId', () => {
      component.selectedTenableRepository = { id: '42', name: 'Test', description: '', dataFormat: 'IPv4', uuid: 'u' };
      component.importTenableRepository();
      const call = mockCollectionsService.addCollection.mock.calls[0][0];

      expect(call.originCollectionId).toBe(42);
      expect(typeof call.originCollectionId).toBe('number');
    });

    it('should show success message after import', () => {
      component.selectedTenableRepository = mockRepositories[1];
      component.importTenableRepository();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should call fetchDataAndCompare on complete', () => {
      const spy = vi.spyOn(component, 'fetchDataAndCompare');

      component.selectedTenableRepository = mockRepositories[1];
      component.importTenableRepository();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error and return EMPTY when addCollection fails', () => {
      mockCollectionsService.addCollection.mockReturnValue(throwError(() => new Error('Save error')));
      component.selectedTenableRepository = mockRepositories[1];
      component.importTenableRepository();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('importAllRemainingRepositories', () => {
    beforeEach(() => {
      component.filteredRepositories = [
        { id: '102', name: 'Repo Beta', description: 'Second', dataFormat: 'IPv4', uuid: 'uuid-2' },
        { id: '103', name: 'Repo Gamma', description: 'Third', dataFormat: 'IPv6', uuid: 'uuid-3' }
      ];
    });

    it('should call confirmationService.confirm', () => {
      component.importAllRemainingRepositories();
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Confirm Bulk Import' }));
    });

    it('should include repository count in confirm message', () => {
      component.importAllRemainingRepositories();
      const msg = mockConfirmationService.confirm.mock.calls[0][0].message as string;

      expect(msg).toContain('2');
    });

    it('should call addCollection for each filtered repository on accept', () => {
      component.importAllRemainingRepositories();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(mockCollectionsService.addCollection).toHaveBeenCalledTimes(2);
    });

    it('should show success message after all repositories imported', () => {
      component.importAllRemainingRepositories();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'All repositories imported successfully' }));
    });

    it('should call fetchDataAndCompare after successful bulk import', () => {
      const spy = vi.spyOn(component, 'fetchDataAndCompare');

      component.importAllRemainingRepositories();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error message when bulk import fails', () => {
      mockCollectionsService.addCollection.mockReturnValue(throwError(() => new Error('Bulk error')));
      component.importAllRemainingRepositories();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
