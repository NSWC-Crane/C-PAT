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
import { STIGManagerAdminComponent } from './stigmanager-admin.component';
import { CollectionsService } from '../collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { createMockMessageService, createMockConfirmationService } from '../../../../testing/mocks/service-mocks';

const mockSTIGManCollections = [
  { collectionId: 1, name: 'Collection Alpha', description: 'First collection' },
  { collectionId: 2, name: 'Collection Beta', description: 'Second collection' },
  { collectionId: 3, name: 'Collection Gamma', description: 'Third collection' }
];

const mockExistingCollections = [{ collectionId: 10, collectionName: 'Collection Alpha' }];

describe('STIGManagerAdminComponent', () => {
  let component: STIGManagerAdminComponent;
  let fixture: ComponentFixture<STIGManagerAdminComponent>;
  let mockCollectionsService: any;
  let mockSharedService: any;
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

    mockSharedService = {
      getCollectionsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockSTIGManCollections]))
    };

    mockConfirmationService = createMockConfirmationService();
    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [STIGManagerAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: CollectionsService, useValue: mockCollectionsService }, { provide: SharedService, useValue: mockSharedService }]
    })
      .overrideComponent(STIGManagerAdminComponent, {
        set: {
          imports: [ButtonModule, ConfirmDialogModule, SelectModule, FormsModule, ToastModule],
          providers: [
            { provide: ConfirmationService, useValue: mockConfirmationService },
            { provide: MessageService, useValue: mockMessageService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(STIGManagerAdminComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default stigmanCollections to empty array', () => {
      expect(component.stigmanCollections).toEqual([]);
    });

    it('should default filteredCollections to empty array', () => {
      expect(component.filteredCollections).toEqual([]);
    });

    it('should default selectedSTIGManagerCollection to null', () => {
      expect(component.selectedSTIGManagerCollection).toBeNull();
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

    it('should populate stigmanCollections after init', () => {
      component.ngOnInit();
      expect(component.stigmanCollections.length).toBe(3);
    });

    it('should populate existingCollections after init', () => {
      component.ngOnInit();
      expect(component.existingCollections.length).toBe(1);
    });
  });

  describe('fetchDataAndCompare', () => {
    it('should set stigmanCollections from STIG Manager', () => {
      component.fetchDataAndCompare();
      expect(component.stigmanCollections).toEqual(mockSTIGManCollections);
    });

    it('should set existingCollections from collections service', () => {
      component.fetchDataAndCompare();
      expect(component.existingCollections).toEqual(mockExistingCollections);
    });

    it('should call filterCollections after fetching', () => {
      const spy = vi.spyOn(component, 'filterCollections');

      component.fetchDataAndCompare();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error and return EMPTY when getCollectionsFromSTIGMAN fails', () => {
      mockSharedService.getCollectionsFromSTIGMAN.mockReturnValue(throwError(() => new Error('STIGMAN error')));
      component.fetchDataAndCompare();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error and return EMPTY when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('DB error')));
      component.fetchDataAndCompare();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('filterCollections', () => {
    it('should exclude collections already in existingCollections (case-insensitive)', () => {
      component.stigmanCollections = [...mockSTIGManCollections];
      component.existingCollections = [...mockExistingCollections];
      component.filterCollections();
      expect(component.filteredCollections.length).toBe(2);
      expect(component.filteredCollections.map((c) => c.name)).not.toContain('Collection Alpha');
    });

    it('should include all stigman collections when no existing collections match', () => {
      component.stigmanCollections = [...mockSTIGManCollections];
      component.existingCollections = [];
      component.filterCollections();
      expect(component.filteredCollections.length).toBe(3);
    });

    it('should show info message when all collections are already imported', () => {
      component.stigmanCollections = [{ collectionId: 1, name: 'Collection Alpha' }];
      component.existingCollections = [{ collectionId: 10, collectionName: 'Collection Alpha' }];
      component.filterCollections();
      expect(component.filteredCollections.length).toBe(0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'No Collections' }));
    });

    it('should filter case-insensitively', () => {
      component.stigmanCollections = [{ collectionId: 1, name: 'COLLECTION ALPHA' }];
      component.existingCollections = [{ collectionId: 10, collectionName: 'collection alpha' }];
      component.filterCollections();
      expect(component.filteredCollections.length).toBe(0);
    });
  });

  describe('onSTIGManagerCollectionSelect', () => {
    it('should set selectedSTIGManagerCollection', () => {
      const collection = { collectionId: 2, name: 'Collection Beta' };

      component.onSTIGManagerCollectionSelect(collection);
      expect(component.selectedSTIGManagerCollection).toBe(collection);
    });
  });

  describe('importSTIGManagerCollection', () => {
    it('should show confirmation when no collection is selected', () => {
      component.selectedSTIGManagerCollection = null;
      component.importSTIGManagerCollection();
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Alert' }));
    });

    it('should not call addCollection when no collection is selected', () => {
      component.selectedSTIGManagerCollection = null;
      component.importSTIGManagerCollection();
      expect(mockCollectionsService.addCollection).not.toHaveBeenCalled();
    });

    it('should call addCollection with correct data when collection is selected', () => {
      const collection = { collectionId: 2, name: 'Collection Beta', description: 'Second collection' };

      component.selectedSTIGManagerCollection = collection;
      component.importSTIGManagerCollection();
      expect(mockCollectionsService.addCollection).toHaveBeenCalledWith({
        collectionName: 'Collection Beta',
        description: 'Second collection',
        collectionType: 'STIG Manager',
        originCollectionId: 2
      });
    });

    it('should use empty string for description when undefined', () => {
      const collection = { collectionId: 3, name: 'No Desc' };

      component.selectedSTIGManagerCollection = collection;
      component.importSTIGManagerCollection();
      expect(mockCollectionsService.addCollection).toHaveBeenCalledWith(expect.objectContaining({ description: '' }));
    });

    it('should show success message after import', () => {
      component.selectedSTIGManagerCollection = { collectionId: 2, name: 'Collection Beta' };
      component.importSTIGManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should call fetchDataAndCompare on complete', () => {
      const spy = vi.spyOn(component, 'fetchDataAndCompare');

      component.selectedSTIGManagerCollection = { collectionId: 2, name: 'Collection Beta' };
      component.importSTIGManagerCollection();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error and return EMPTY when addCollection fails', () => {
      mockCollectionsService.addCollection.mockReturnValue(throwError(() => new Error('Save error')));
      component.selectedSTIGManagerCollection = { collectionId: 2, name: 'Collection Beta' };
      component.importSTIGManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('importAllRemainingCollections', () => {
    beforeEach(() => {
      component.filteredCollections = [
        { collectionId: 2, name: 'Collection Beta', description: 'Second' },
        { collectionId: 3, name: 'Collection Gamma', description: 'Third' }
      ];
    });

    it('should call confirmationService.confirm', () => {
      component.importAllRemainingCollections();
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Confirm Bulk Import' }));
    });

    it('should include filtered collection count in confirm message', () => {
      component.importAllRemainingCollections();
      const msg = mockConfirmationService.confirm.mock.calls[0][0].message as string;

      expect(msg).toContain('2');
    });

    it('should call addCollection for each filtered collection on accept', () => {
      component.importAllRemainingCollections();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(mockCollectionsService.addCollection).toHaveBeenCalledTimes(2);
    });

    it('should show success message after all collections imported', () => {
      component.importAllRemainingCollections();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'All collections imported successfully' }));
    });

    it('should call fetchDataAndCompare after successful bulk import', () => {
      const spy = vi.spyOn(component, 'fetchDataAndCompare');

      component.importAllRemainingCollections();
      const { accept } = mockConfirmationService.confirm.mock.calls[0][0];

      accept();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error message when bulk import fails', () => {
      mockCollectionsService.addCollection.mockReturnValue(throwError(() => new Error('Bulk error')));
      component.importAllRemainingCollections();
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
