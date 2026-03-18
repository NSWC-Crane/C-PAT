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
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';
import { CollectionProcessingComponent } from './collection-processing.component';
import { CollectionsService } from './collections.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { AAPackageService } from '../aaPackage-processing/aaPackage-processing.service';
import { PoamExportService } from '../../../common/utils/poam-export.service';

const mockCollections = [
  {
    collectionId: 1,
    collectionName: 'Collection Alpha',
    description: 'Alpha description',
    systemType: 'Type A',
    systemName: 'System A',
    ccsafa: 'CC-A',
    aaPackage: 'Package A',
    predisposingConditions: 'None',
    collectionOrigin: 'C-PAT',
    originCollectionId: 0,
    manualCreationAllowed: true
  },
  {
    collectionId: 2,
    collectionName: 'Collection Beta',
    description: 'Beta description',
    systemType: 'Type B',
    systemName: 'System B',
    ccsafa: 'CC-B',
    aaPackage: 'Package B',
    predisposingConditions: 'Conditions',
    collectionOrigin: 'STIG Manager',
    originCollectionId: 42,
    manualCreationAllowed: false
  }
];

const mockPoams = [
  { poamId: 1, vulnerabilityId: '12345', stigBenchmarkId: 'BENCH-1', rawSeverity: 'high' },
  { poamId: 2, vulnerabilityId: '67890', stigBenchmarkId: 'BENCH-2', rawSeverity: 'medium' }
];

const mockAAPackages = [
  { aaPackage: 'Package Alpha', aaPackageId: 1 },
  { aaPackage: 'Package Beta', aaPackageId: 2 },
  { aaPackage: 'Other Package', aaPackageId: 3 }
];

describe('CollectionProcessingComponent', () => {
  let component: CollectionProcessingComponent;
  let fixture: ComponentFixture<CollectionProcessingComponent>;
  let mockCollectionsService: any;
  let mockPayloadService: any;
  let mockMessageService: any;
  let mockSharedService: any;
  let mockImportService: any;
  let mockPoamService: any;
  let mockAAPackageService: any;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject<any>({ userId: 1, userName: 'testuser' });
    payloadSubject = new BehaviorSubject<any>({ collectionId: 1 });
    accessLevelSubject = new BehaviorSubject<any>(2);

    mockCollectionsService = {
      getAllCollections: vi.fn().mockReturnValue(of(mockCollections)),
      getPoamsByCollection: vi.fn().mockReturnValue(of(mockPoams)),
      addCollection: vi.fn().mockReturnValue(of({ collectionId: 99 })),
      updateCollection: vi.fn().mockReturnValue(of({})),
      deleteCollection: vi.fn().mockReturnValue(of({}))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockMessageService = createMockMessageService();

    mockSharedService = {
      getSTIGMANAffectedAssetsByPoam: vi.fn().mockReturnValue(of([]))
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [] } }))
    };

    mockPoamService = {
      getPoamAssetsByCollectionId: vi.fn().mockReturnValue(of([]))
    };

    mockAAPackageService = {
      getAAPackages: vi.fn().mockReturnValue(of(mockAAPackages))
    };

    await TestBed.configureTestingModule({
      imports: [CollectionProcessingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ImportService, useValue: mockImportService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: AAPackageService, useValue: mockAAPackageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionProcessingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize cols as empty array', () => {
      expect(component.cols).toEqual([]);
    });

    it('should initialize aaPackages as empty array', () => {
      expect(component.aaPackages).toEqual([]);
    });

    it('should initialize filteredAAPackages as empty array', () => {
      expect(component.filteredAAPackages).toEqual([]);
    });

    it('should initialize collectionTreeData as empty array', () => {
      expect(component.collectionTreeData).toEqual([]);
    });

    it('should initialize displayCollectionDialog as false', () => {
      expect(component.displayCollectionDialog).toBe(false);
    });

    it('should initialize displayDeleteDialog as false', () => {
      expect(component.displayDeleteDialog).toBe(false);
    });

    it('should initialize displayExportDialog as false', () => {
      expect(component.displayExportDialog).toBe(false);
    });

    it('should initialize dialogMode as add', () => {
      expect(component.dialogMode).toBe('add');
    });

    it('should initialize exporting as false', () => {
      expect(component.exporting).toBe(false);
    });

    it('should initialize collection with defaults', () => {
      expect(component.collection.collectionId).toBe('');
      expect(component.collection.collectionName).toBe('');
      expect(component.collection.manualCreationAllowed).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call initColumnsAndFilters and setPayload', async () => {
      const initSpy = vi.spyOn(component, 'initColumnsAndFilters');
      const setPayloadSpy = vi.spyOn(component, 'setPayload');

      await component.ngOnInit();

      expect(initSpy).toHaveBeenCalled();
      expect(setPayloadSpy).toHaveBeenCalled();
    });
  });

  describe('initColumnsAndFilters', () => {
    it('should set 9 columns', () => {
      component.initColumnsAndFilters();

      expect(component.cols).toHaveLength(9);
    });

    it('should include Collection ID column', () => {
      component.initColumnsAndFilters();

      expect(component.cols[0]).toEqual({ field: 'Collection ID', header: 'Collection ID' });
    });

    it('should include Name column', () => {
      component.initColumnsAndFilters();

      expect(component.cols[1]).toEqual({ field: 'Name', header: 'Name' });
    });

    it('should include A&A Package column', () => {
      component.initColumnsAndFilters();

      const aaPackageCol = component.cols.find((c: any) => c.field === 'A&A Package');

      expect(aaPackageCol).toBeDefined();
    });
  });

  describe('setPayload', () => {
    it('should call setPayloadService.setPayload', () => {
      component.setPayload();

      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should assign user from user$ subscription', () => {
      component.setPayload();

      expect(component.user).toEqual({ userId: 1, userName: 'testuser' });
    });

    it('should assign payload from payload$ subscription', () => {
      component.setPayload();

      expect(component.payload).toEqual({ collectionId: 1 });
    });

    it('should assign accessLevel from accessLevel$ subscription', () => {
      component.setPayload();

      expect((component as any).accessLevel).toBe(2);
    });

    it('should call getCollectionData', () => {
      const spy = vi.spyOn(component, 'getCollectionData');

      component.setPayload();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getCollectionData', () => {
    it('should set collections to null before loading', () => {
      component.collections = [{ collectionId: 1 }];
      component.getCollectionData();

      expect(component.collections).not.toBeNull();
    });

    it('should call loadAAPackages', () => {
      const spy = vi.spyOn(component, 'loadAAPackages');

      component.getCollectionData();

      expect(spy).toHaveBeenCalled();
    });

    it('should call getAllCollections', () => {
      component.getCollectionData();

      expect(mockCollectionsService.getAllCollections).toHaveBeenCalled();
    });

    it('should set collections and data from response', () => {
      component.getCollectionData();

      expect(component.collections).toEqual(mockCollections);
      expect(component.data).toEqual(mockCollections);
    });

    it('should call getCollectionsTreeData after loading', () => {
      const spy = vi.spyOn(component, 'getCollectionsTreeData');

      component.getCollectionData();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadAAPackages', () => {
    it('should set aaPackages on success', () => {
      component.loadAAPackages();

      expect(component.aaPackages).toEqual(mockAAPackages);
    });

    it('should set aaPackages to empty array when response is null', () => {
      mockAAPackageService.getAAPackages.mockReturnValue(of(null));
      component.loadAAPackages();

      expect(component.aaPackages).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockAAPackageService.getAAPackages.mockReturnValue(throwError(() => new Error('Load failed')));
      component.loadAAPackages();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail in failure message', () => {
      mockAAPackageService.getAAPackages.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadAAPackages();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Network error') }));
    });
  });

  describe('filterAAPackages', () => {
    beforeEach(() => {
      component.aaPackages = mockAAPackages as any;
    });

    it('should filter aaPackages by query', () => {
      component.filterAAPackages({ query: 'alpha' });

      expect(component.filteredAAPackages).toEqual(['Package Alpha']);
    });

    it('should be case-insensitive', () => {
      component.filterAAPackages({ query: 'BETA' });

      expect(component.filteredAAPackages).toEqual(['Package Beta']);
    });

    it('should return multiple matches', () => {
      component.filterAAPackages({ query: 'package' });

      expect(component.filteredAAPackages).toHaveLength(3);
    });

    it('should return empty array when no match', () => {
      component.filterAAPackages({ query: 'zzznomatch' });

      expect(component.filteredAAPackages).toEqual([]);
    });

    it('should return names as strings, not objects', () => {
      component.filterAAPackages({ query: 'alpha' });

      expect(typeof component.filteredAAPackages[0]).toBe('string');
    });
  });

  describe('getCollectionsTreeData', () => {
    beforeEach(() => {
      component.data = mockCollections;
    });

    it('should map collections to tree nodes', () => {
      component.getCollectionsTreeData();

      expect(component.collectionTreeData).toHaveLength(2);
    });

    it('should map collectionId to Collection ID field', () => {
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['Collection ID']).toBe(1);
    });

    it('should map collectionName to Name field', () => {
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['Name']).toBe('Collection Alpha');
    });

    it('should map description to Description field', () => {
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['Description']).toBe('Alpha description');
    });

    it('should use empty string for null systemType', () => {
      component.data = [{ ...mockCollections[0], systemType: null }];
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['System Type']).toBe('');
    });

    it('should use empty string for null ccsafa', () => {
      component.data = [{ ...mockCollections[0], ccsafa: null }];
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['CC/S/A/FA']).toBe('');
    });

    it('should use 0 for null originCollectionId', () => {
      component.data = [{ ...mockCollections[0], originCollectionId: null }];
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['Origin Collection ID']).toBe(0);
    });

    it('should default manualCreationAllowed to true when not provided', () => {
      component.data = [{ ...mockCollections[0], manualCreationAllowed: undefined }];
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].data['Manual Creation Allowed']).toBe(true);
    });

    it('should include empty children array on each node', () => {
      component.getCollectionsTreeData();

      expect(component.collectionTreeData[0].children).toEqual([]);
    });
  });

  describe('showAddCollectionDialog', () => {
    it('should set dialogMode to add', () => {
      component.dialogMode = 'modify';
      component.showAddCollectionDialog();

      expect(component.dialogMode).toBe('add');
    });

    it('should set displayCollectionDialog to true', () => {
      component.showAddCollectionDialog();

      expect(component.displayCollectionDialog).toBe(true);
    });

    it('should reset editingCollection', () => {
      component.editingCollection = { collectionId: '99', collectionName: 'Old Name' };
      component.showAddCollectionDialog();

      expect(component.editingCollection.collectionId).toBe('');
      expect(component.editingCollection.collectionName).toBe('');
    });

    it('should set manualCreationAllowed to true in editingCollection', () => {
      component.showAddCollectionDialog();

      expect(component.editingCollection.manualCreationAllowed).toBe(true);
    });
  });

  describe('showModifyCollectionDialog', () => {
    const rowData = {
      'Collection ID': 5,
      Name: 'My Collection',
      Description: 'My Desc',
      'System Type': 'TypeX',
      'System Name': 'SysX',
      'CC/S/A/FA': 'CC-X',
      'A&A Package': 'PkgX',
      'Predisposing Conditions': 'PredX',
      'Manual Creation Allowed': false
    };

    it('should set dialogMode to modify', () => {
      component.showModifyCollectionDialog(rowData);

      expect(component.dialogMode).toBe('modify');
    });

    it('should set displayCollectionDialog to true', () => {
      component.showModifyCollectionDialog(rowData);

      expect(component.displayCollectionDialog).toBe(true);
    });

    it('should populate editingCollection from rowData', () => {
      component.showModifyCollectionDialog(rowData);

      expect(component.editingCollection.collectionId).toBe('5');
      expect(component.editingCollection.collectionName).toBe('My Collection');
      expect(component.editingCollection.description).toBe('My Desc');
      expect(component.editingCollection.systemType).toBe('TypeX');
    });

    it('should default manualCreationAllowed to true if not in rowData', () => {
      const rowWithoutManual = { ...rowData, 'Manual Creation Allowed': undefined };

      component.showModifyCollectionDialog(rowWithoutManual);

      expect(component.editingCollection.manualCreationAllowed).toBe(true);
    });
  });

  describe('hideCollectionDialog', () => {
    it('should set displayCollectionDialog to false', () => {
      component.displayCollectionDialog = true;
      component.hideCollectionDialog();

      expect(component.displayCollectionDialog).toBe(false);
    });
  });

  describe('saveCollection', () => {
    it('should return early when collectionName is empty', () => {
      component.editingCollection = { collectionName: '' };
      component.saveCollection();

      expect(mockCollectionsService.addCollection).not.toHaveBeenCalled();
      expect(mockCollectionsService.updateCollection).not.toHaveBeenCalled();
    });

    it('should return early when collectionName is whitespace only', () => {
      component.editingCollection = { collectionName: '   ' };
      component.saveCollection();

      expect(mockCollectionsService.addCollection).not.toHaveBeenCalled();
    });

    it('should call addCollection in add mode', () => {
      component.dialogMode = 'add';
      component.editingCollection = { collectionName: 'New Collection', collectionId: '' };
      component.saveCollection();

      expect(mockCollectionsService.addCollection).toHaveBeenCalled();
    });

    it('should call updateCollection in modify mode', () => {
      component.dialogMode = 'modify';
      component.editingCollection = { collectionName: 'Updated Collection', collectionId: '5' };
      component.saveCollection();

      expect(mockCollectionsService.updateCollection).toHaveBeenCalled();
    });

    it('should pass collectionId as 0 when in add mode', () => {
      component.dialogMode = 'add';
      component.editingCollection = { collectionName: 'New Collection', collectionId: '' };
      component.saveCollection();

      const savedCollection = mockCollectionsService.addCollection.mock.calls[0][0];

      expect(savedCollection.collectionId).toBe(0);
    });

    it('should show success message after adding', () => {
      component.dialogMode = 'add';
      component.editingCollection = { collectionName: 'New Collection', collectionId: '' };
      component.saveCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'Collection Added' }));
    });

    it('should show success message after updating', () => {
      component.dialogMode = 'modify';
      component.editingCollection = { collectionName: 'Updated', collectionId: '5' };
      component.saveCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'Collection Updated' }));
    });

    it('should close dialog after saving', () => {
      component.dialogMode = 'add';
      component.editingCollection = { collectionName: 'New', collectionId: '' };
      component.displayCollectionDialog = true;
      component.saveCollection();

      expect(component.displayCollectionDialog).toBe(false);
    });

    it('should show error message on add failure', () => {
      component.dialogMode = 'add';
      component.editingCollection = { collectionName: 'New', collectionId: '' };
      mockCollectionsService.addCollection.mockReturnValue(throwError(() => new Error('Add failed')));
      component.saveCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error message on update failure', () => {
      component.dialogMode = 'modify';
      component.editingCollection = { collectionName: 'Updated', collectionId: '5' };
      mockCollectionsService.updateCollection.mockReturnValue(throwError(() => new Error('Update failed')));
      component.saveCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('confirmDeleteCollection', () => {
    it('should set collectionToDelete', () => {
      const rowData = { 'Collection ID': 3, Name: 'Test' };

      component.confirmDeleteCollection(rowData);

      expect(component.collectionToDelete).toEqual(rowData);
    });

    it('should set displayDeleteDialog to true', () => {
      component.confirmDeleteCollection({ 'Collection ID': 3 });

      expect(component.displayDeleteDialog).toBe(true);
    });
  });

  describe('deleteCollection', () => {
    it('should return early when collectionToDelete is null', () => {
      component.collectionToDelete = null;
      component.deleteCollection();

      expect(mockCollectionsService.deleteCollection).not.toHaveBeenCalled();
    });

    it('should call deleteCollection with correct id', () => {
      component.collectionToDelete = { 'Collection ID': 7, Name: 'ToDelete' };
      component.deleteCollection();

      expect(mockCollectionsService.deleteCollection).toHaveBeenCalledWith(7);
    });

    it('should show success message after deletion', () => {
      component.collectionToDelete = { 'Collection ID': 7 };
      component.deleteCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'Collection Deleted' }));
    });

    it('should call hideDeleteDialog after deletion', () => {
      component.collectionToDelete = { 'Collection ID': 7 };
      const spy = vi.spyOn(component, 'hideDeleteDialog');

      component.deleteCollection();

      expect(spy).toHaveBeenCalled();
    });

    it('should show error message on delete failure', () => {
      component.collectionToDelete = { 'Collection ID': 7 };
      mockCollectionsService.deleteCollection.mockReturnValue(throwError(() => new Error('Delete failed')));
      component.deleteCollection();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('hideDeleteDialog', () => {
    it('should set displayDeleteDialog to false', () => {
      component.displayDeleteDialog = true;
      component.hideDeleteDialog();

      expect(component.displayDeleteDialog).toBe(false);
    });

    it('should set collectionToDelete to null', () => {
      component.collectionToDelete = { 'Collection ID': 1 };
      component.hideDeleteDialog();

      expect(component.collectionToDelete).toBeNull();
    });
  });

  describe('showExportDialog', () => {
    beforeEach(() => {
      component.data = mockCollections;
    });

    it('should set displayExportDialog to true', () => {
      component.showExportDialog();

      expect(component.displayExportDialog).toBe(true);
    });

    it('should populate selectableCollections from data', () => {
      component.showExportDialog();

      expect(component.selectableCollections).toHaveLength(2);
    });

    it('should map collection to label/value shape', () => {
      component.showExportDialog();

      expect(component.selectableCollections[0].label).toBe('Collection Alpha');
      expect(component.selectableCollections[0].value.collectionId).toBe(1);
    });

    it('should reset selectedExportCollections', () => {
      component.selectedExportCollections = [{ collectionId: 1 }];
      component.showExportDialog();

      expect(component.selectedExportCollections).toEqual([]);
    });

    it('should default empty strings for null optional fields', () => {
      component.data = [{ ...mockCollections[0], collectionOrigin: null, systemType: null }];
      component.showExportDialog();

      expect(component.selectableCollections[0].value.collectionOrigin).toBe('');
      expect(component.selectableCollections[0].value.systemType).toBe('');
    });
  });

  describe('hideExportDialog', () => {
    it('should set displayExportDialog to false', () => {
      component.displayExportDialog = true;
      component.hideExportDialog();

      expect(component.displayExportDialog).toBe(false);
    });

    it('should reset selectedExportCollections', () => {
      component.selectedExportCollections = [{ collectionId: 1 }];
      component.hideExportDialog();

      expect(component.selectedExportCollections).toEqual([]);
    });
  });

  describe('exportMultipleCollections', () => {
    it('should show warning when no collections selected', () => {
      component.selectedExportCollections = [];
      component.exportMultipleCollections();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'No Selection' }));
    });

    it('should not proceed when selectedExportCollections is empty', () => {
      component.selectedExportCollections = [];
      component.exportMultipleCollections();

      expect(mockCollectionsService.getPoamsByCollection).not.toHaveBeenCalled();
    });

    it('should set exporting to true during export', () => {
      const exportCol = { collectionId: 1, name: 'Col A', collectionOrigin: 'C-PAT' };

      component.selectedExportCollections = [exportCol];
      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportMultipleCollections();

      expect(component.exporting).toBe(true);
    });

    it('should call getPoamsByCollection for each selected collection', () => {
      const exportCols = [
        { collectionId: 1, name: 'Col A', collectionOrigin: 'C-PAT' },
        { collectionId: 2, name: 'Col B', collectionOrigin: 'C-PAT' }
      ];

      component.selectedExportCollections = exportCols;
      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportMultipleCollections();

      expect(mockCollectionsService.getPoamsByCollection).toHaveBeenCalledTimes(2);
    });

    it('should show error when all collections are empty', () => {
      const exportCol = { collectionId: 1, name: 'Col A', collectionOrigin: 'C-PAT' };

      component.selectedExportCollections = [exportCol];
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportMultipleCollections();

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Export Failed' }));
    });

    it('should use Multi_Collection name for multi-collection export', async () => {
      const exportCols = [
        { collectionId: 1, name: 'Col A', collectionOrigin: 'C-PAT' },
        { collectionId: 2, name: 'Col B', collectionOrigin: 'C-PAT' }
      ];

      component.selectedExportCollections = exportCols;
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of(mockPoams));
      mockPoamService.getPoamAssetsByCollectionId.mockReturnValue(of([]));
      const convertSpy = vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());

      component.exportMultipleCollections();

      await new Promise((r) => setTimeout(r, 0));

      expect(convertSpy).toHaveBeenCalled();
      const thirdArg = convertSpy.mock.calls[0][2];

      expect(thirdArg).toMatchObject({ name: 'Multi_Collection' });
    });
  });

  describe('exportCollection', () => {
    it('should show error when collectionId is missing', () => {
      const rowData = {
        'Collection ID': null,
        Name: 'Test',
        'Collection Origin': 'C-PAT',
        'Origin Collection ID': 0,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      component.exportCollection(rowData);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should call getPoamsByCollection with correct id', () => {
      const rowData = {
        'Collection ID': 1,
        Name: 'Col A',
        'Collection Origin': 'C-PAT',
        'Origin Collection ID': 0,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportCollection(rowData);

      expect(mockCollectionsService.getPoamsByCollection).toHaveBeenCalledWith(1);
    });

    it('should show error when no POAMs found', () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      const rowData = {
        'Collection ID': 1,
        Name: 'Col A',
        'Collection Origin': 'C-PAT',
        'Origin Collection ID': 0,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      component.exportCollection(rowData);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Export Failed' }));
    });

    it('should route to STIG Manager processing for STIG Manager origin', () => {
      const rowData = {
        'Collection ID': 2,
        Name: 'STIG Col',
        'Collection Origin': 'STIG Manager',
        'Origin Collection ID': 42,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      const findings = [
        {
          groupId: '12345',
          assets: [{ name: 'ASSET-1', assetId: 'a1' }],
          ccis: [{ apAcronym: 'AC', cci: '000123' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(of(findings));
      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportCollection(rowData);

      expect(mockSharedService.getSTIGMANAffectedAssetsByPoam).toHaveBeenCalledWith(42, 'BENCH-1');
    });

    it('should route to Tenable processing for Tenable origin', () => {
      const rowData = {
        'Collection ID': 3,
        Name: 'Tenable Col',
        'Collection Origin': 'Tenable',
        'Origin Collection ID': 0,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: [] } }));
      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportCollection(rowData);

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
    });

    it('should route to C-PAT processing for C-PAT origin', () => {
      const rowData = {
        'Collection ID': 1,
        Name: 'CPAT Col',
        'Collection Origin': 'C-PAT',
        'Origin Collection ID': 0,
        'System Type': '',
        'System Name': '',
        'CC/S/A/FA': '',
        'A&A Package': '',
        'Predisposing Conditions': ''
      };

      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(new Blob());
      component.exportCollection(rowData);

      expect(mockPoamService.getPoamAssetsByCollectionId).toHaveBeenCalledWith(1);
    });
  });

  describe('processPoamsWithCpatData (via processPoamsData)', () => {
    it('should map poam assets to devicesAffected', async () => {
      const poams = [{ poamId: 1, vulnerabilityId: 'V-001' }];
      const assets = [{ poamId: 1, assetName: 'test-asset' }];

      mockPoamService.getPoamAssetsByCollectionId.mockReturnValue(of(assets));

      let result: any[];

      (component as any).processPoamsWithCpatData(poams, 1).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('TEST-ASSET');
    });

    it('should uppercase asset names', async () => {
      const poams = [{ poamId: 1 }];
      const assets = [{ poamId: 1, assetName: 'lowercase-name' }];

      mockPoamService.getPoamAssetsByCollectionId.mockReturnValue(of(assets));

      let result: any[];

      (component as any).processPoamsWithCpatData(poams, 1).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('LOWERCASE-NAME');
    });

    it('should set empty devicesAffected when no matching assets', () => {
      const poams = [{ poamId: 99 }];
      const assets = [{ poamId: 1, assetName: 'ASSET' }];

      mockPoamService.getPoamAssetsByCollectionId.mockReturnValue(of(assets));

      let result: any[];

      (component as any).processPoamsWithCpatData(poams, 1).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('');
    });
  });

  describe('processPoamsWithTenableData (via processPoamsData)', () => {
    it('should use netbiosName last segment for device name', () => {
      const poams = [{ poamId: 1, vulnerabilityId: '12345' }];
      const tenableResults = [{ pluginID: '12345', netbiosName: 'DOMAIN\\WORKSTATION', dnsName: '' }];

      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: tenableResults } }));

      let result: any[];

      (component as any).processPoamsWithTenableData(poams).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('WORKSTATION');
    });

    it('should use dnsName first segment uppercased when no netbiosName', () => {
      const poams = [{ poamId: 1, vulnerabilityId: '12345' }];
      const tenableResults = [{ pluginID: '12345', netbiosName: '', dnsName: 'host.domain.com' }];

      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: tenableResults } }));

      let result: any[];

      (component as any).processPoamsWithTenableData(poams).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('HOST');
    });

    it('should set empty devicesAffected when no matching assets', () => {
      const poams = [{ poamId: 1, vulnerabilityId: '99999' }];
      const tenableResults = [{ pluginID: '12345', netbiosName: 'HOST', dnsName: '' }];

      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: tenableResults } }));

      let result: any[];

      (component as any).processPoamsWithTenableData(poams).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('');
    });
  });

  describe('processPoamsWithStigFindings', () => {
    it('should return poam as-is when no vulnerabilityId or stigBenchmarkId', () => {
      const poams = [{ poamId: 1, vulnerabilityId: null, stigBenchmarkId: null }];

      let result: any[];

      (component as any).processPoamsWithStigFindings(poams, 1).subscribe((r: any) => (result = r));

      expect(result![0]).toEqual(poams[0]);
    });

    it('should fetch findings and enrich poam with devicesAffected', () => {
      const poams = [{ poamId: 1, vulnerabilityId: 'V-001', stigBenchmarkId: 'BENCH-A' }];
      const findings = [
        {
          groupId: 'V-001',
          assets: [
            { name: 'ASSET-1', assetId: 'a1' },
            { name: 'ASSET-2', assetId: 'a2' }
          ],
          ccis: [{ apAcronym: 'AC', cci: '000001' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(of(findings));

      let result: any[];

      (component as any).processPoamsWithStigFindings(poams, 10).subscribe((r: any) => (result = r));

      expect(result![0].devicesAffected).toBe('ASSET-1 ASSET-2');
    });

    it('should use findings cache on second invocation with same benchmarkId', () => {
      const poamsFirstCall = [{ poamId: 1, vulnerabilityId: 'V-001', stigBenchmarkId: 'BENCH-A' }];
      const poamsSecondCall = [{ poamId: 2, vulnerabilityId: 'V-002', stigBenchmarkId: 'BENCH-A' }];
      const findings = [{ groupId: 'V-001', assets: [{ name: 'ASSET' }], ccis: [] }];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(of(findings));

      (component as any).processPoamsWithStigFindings(poamsFirstCall, 10).subscribe();
      (component as any).processPoamsWithStigFindings(poamsSecondCall, 10).subscribe();

      expect(mockSharedService.getSTIGMANAffectedAssetsByPoam).toHaveBeenCalledTimes(1);
    });

    it('should return poam without enrichment on 403 error', () => {
      const poams = [{ poamId: 1, vulnerabilityId: 'V-001', stigBenchmarkId: 'BENCH-A' }];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(throwError(() => new Error('403 Forbidden')));

      let result: any[];

      (component as any).processPoamsWithStigFindings(poams, 10).subscribe((r: any) => (result = r));

      expect(result![0]).toEqual(poams[0]);
    });

    it('should propagate non-403 errors', () => {
      const poams = [{ poamId: 1, vulnerabilityId: 'V-001', stigBenchmarkId: 'BENCH-A' }];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(throwError(() => new Error('500 Server Error')));

      let error: any;

      (component as any).processPoamsWithStigFindings(poams, 10).subscribe({ error: (e: any) => (error = e) });

      expect(error).toBeDefined();
      expect(error.message).toContain('500');
    });
  });

  describe('processSinglePoamWithFindings', () => {
    it('should return original poam when no matching finding', () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-999' };
      const findings = [{ groupId: 'V-001', assets: [], ccis: [] }];

      const result = (component as any).processSinglePoamWithFindings(poam, findings);

      expect(result).toEqual(poam);
    });

    it('should enrich poam with devicesAffected from matching finding', () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-001' };
      const findings = [
        {
          groupId: 'V-001',
          assets: [{ name: 'HOST-1', assetId: 'a1' }],
          ccis: [{ apAcronym: 'SI', cci: '000200' }]
        }
      ];

      const result = (component as any).processSinglePoamWithFindings(poam, findings);

      expect(result.devicesAffected).toBe('HOST-1');
    });

    it('should enrich poam with controlAPs and cci', () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-001' };
      const findings = [
        {
          groupId: 'V-001',
          assets: [],
          ccis: [{ apAcronym: 'AC', cci: '000123' }]
        }
      ];

      const result = (component as any).processSinglePoamWithFindings(poam, findings);

      expect(result.controlAPs).toBe('AC');
      expect(result.cci).toBe('000123');
    });

    it('should join multiple asset names with space', () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-001' };
      const findings = [
        {
          groupId: 'V-001',
          assets: [{ name: 'HOST-1' }, { name: 'HOST-2' }, { name: 'HOST-3' }],
          ccis: []
        }
      ];

      const result = (component as any).processSinglePoamWithFindings(poam, findings);

      expect(result.devicesAffected).toBe('HOST-1 HOST-2 HOST-3');
    });
  });

  describe('clearCache', () => {
    it('should clear the findingsCache', () => {
      (component as any).findingsCache.set('BENCH-1', [{ groupId: 'V-001' }]);
      expect((component as any).findingsCache.size).toBe(1);

      component.clearCache();

      expect((component as any).findingsCache.size).toBe(0);
    });
  });

  describe('filterGlobal', () => {
    it('should call table filterGlobal with contains', async () => {
      fixture.detectChanges();

      await fixture.whenStable();

      const tableInstance = component.table();
      const spy = vi.spyOn(tableInstance, 'filterGlobal');
      const event = { target: { value: 'test' } } as unknown as Event;

      component.filterGlobal(event);

      expect(spy).toHaveBeenCalledWith('test', 'contains');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      fixture.detectChanges();
      const unsubSpy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubSpy).toHaveBeenCalled();
    });

    it('should not throw when called', () => {
      fixture.detectChanges();

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
