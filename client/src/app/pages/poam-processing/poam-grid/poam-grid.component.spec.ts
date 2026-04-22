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
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { signal } from '@angular/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { createMockDialogService } from '../../../../testing/mocks/service-mocks';
import { PoamGridComponent } from './poam-grid.component';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../poams.service';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CsvExportService } from '../../../common/utils/csv-export.service';

function createMockPoam(overrides: any = {}) {
  return {
    poamId: 1,
    collectionId: 1,
    vulnerabilityId: 'V-12345',
    vulnerabilitySource: 'STIG',
    vulnerabilityTitle: 'Test Vulnerability',
    status: 'Draft',
    rawSeverity: 'High',
    adjSeverity: 'High',
    ownerName: 'Test Owner',
    submitterName: 'Test Submitter',
    submittedDate: '2025-01-15T00:00:00.000Z',
    scheduledCompletionDate: '2025-04-15T00:00:00.000Z',
    extensionDeadline: null,
    lastUpdated: '2025-01-20T10:30:00.000Z',
    iavmNumber: 'IAV-2025-001',
    taskOrderNumber: 'TO-001',
    stigBenchmarkId: 'RHEL_8_STIG',
    assignedTeams: [
      { assignedTeamName: 'Team Alpha', complete: 'true' },
      { assignedTeamName: 'Team Beta', complete: 'false' }
    ],
    labels: [{ labelName: 'Critical' }, { labelName: 'Infrastructure' }],
    associatedVulnerabilities: [],
    ...overrides
  };
}

describe('PoamGridComponent', () => {
  let component: PoamGridComponent;
  let fixture: ComponentFixture<PoamGridComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockDialogService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let mockImportService: any;
  let mockPoamService: any;
  let mockCsvExportService: any;
  let selectedCollectionSubject: BehaviorSubject<number>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        apiBase: '/api',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true,
          marketplaceDisabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    selectedCollectionSubject = new BehaviorSubject<number>(1);

    mockRouter = {
      navigateByUrl: vi.fn()
    };

    mockMessageService = new MessageService();
    vi.spyOn(mockMessageService, 'add');

    mockDialogService = createMockDialogService();

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject({ userId: 1, userName: 'testuser' })
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable(),
      getSTIGMANAffectedAssetsByPoam: vi.fn().mockReturnValue(of([]))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(
        of([
          { collectionId: 1, collectionName: 'Test Collection', collectionOrigin: 'C-PAT', originCollectionId: 100 },
          { collectionId: 2, collectionName: 'STIG Collection', collectionOrigin: 'STIG Manager', originCollectionId: 200 },
          { collectionId: 3, collectionName: 'Tenable Collection', collectionOrigin: 'Tenable', originCollectionId: 300 }
        ])
      )
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [] } })),
      getTenablePlugin: vi.fn().mockReturnValue(of({ response: {} }))
    };

    mockPoamService = {
      getPoamAssetsByCollectionId: vi.fn().mockReturnValue(of([]))
    };

    mockCsvExportService = {
      exportToCsv: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PoamGridComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: DialogService, useValue: mockDialogService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: ImportService, useValue: mockImportService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: CsvExportService, useValue: mockCsvExportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamGridComponent);
    component = fixture.componentInstance;

    const mockTable = {
      clear: vi.fn(),
      filters: {} as Record<string, any>,
      filterGlobal: vi.fn()
    };
    const mockFileUpload = { clear: vi.fn() };

    Object.defineProperty(component, 'table', { value: signal(mockTable) });
    Object.defineProperty(component, 'fileUpload', { value: signal(mockFileUpload) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have default poamStatusOptions', () => {
      const options = component.poamStatusOptions();

      expect(options).toHaveLength(11);
      expect(options[0]).toEqual({ label: 'Any', value: null });
      expect(options[1]).toEqual({ label: 'Approved', value: 'approved' });
    });

    it('should have empty globalFilterSignal by default', () => {
      expect(component.globalFilterSignal()).toBe('');
    });

    it('should have default batchSize of 20', () => {
      expect(component.batchSize).toBe(20);
    });

    it('should call setPayload on ngOnInit', async () => {
      const setPayloadSpy = vi.spyOn(component, 'setPayload');

      await component.ngOnInit();
      expect(setPayloadSpy).toHaveBeenCalled();
    });

    it('should set up table status filter on ngOnInit', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();
    });
  });

  describe('setPayload', () => {
    it('should subscribe to selectedCollection', async () => {
      await component.setPayload();
      expect(component.selectedCollectionId()).toBe(1);
    });

    it('should update selectedCollectionId when collection changes', async () => {
      await component.setPayload();
      selectedCollectionSubject.next(2);
      expect(component.selectedCollectionId()).toBe(2);
    });

    it('should call payloadService.setPayload', async () => {
      await component.setPayload();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to user$', async () => {
      await component.setPayload();
      expect(component.user()).toEqual({ userId: 1, userName: 'testuser' });
    });
  });

  describe('loadCollectionData', () => {
    it('should fetch and set collection data when collectionId changes', async () => {
      await component.setPayload();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
      expect(component.selectedCollection()).toEqual({
        collectionId: 1,
        collectionName: 'Test Collection',
        collectionOrigin: 'C-PAT',
        originCollectionId: 100
      });
    });

    it('should set collectionOriginSignal from loaded collection', async () => {
      await component.setPayload();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(component['collectionOriginSignal']()).toBe('C-PAT');
    });

    it('should show error message when loading fails', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('Network error')));
      await component.setPayload();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });
  });

  describe('Input: poamsData', () => {
    it('should set poamsDataSignal when poamsData input is set', () => {
      const poams = [createMockPoam()];

      component.poamsData = poams;
      expect(component['poamsDataSignal']()).toEqual(poams);
    });

    it('should default to empty array when null is provided', () => {
      component.poamsData = null as any;
      expect(component['poamsDataSignal']()).toEqual([]);
    });
  });

  describe('Input: affectedAssetCounts', () => {
    it('should set affectedAssetCountsSignal when input is set', () => {
      const counts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];

      component.affectedAssetCounts = counts;
      expect(component.affectedAssetCounts).toEqual(counts);
    });

    it('should default to empty array when null is provided', () => {
      component.affectedAssetCounts = null as any;
      expect(component.affectedAssetCounts).toEqual([]);
    });

    it('should set _assetCountsLoaded when value has items', () => {
      const counts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];

      component.affectedAssetCounts = counts;
      expect(component['_assetCountsLoaded']()).toBe(true);
    });

    it('should set _assetCountsLoaded when receiving empty array after having received data', () => {
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];
      component.affectedAssetCounts = [];
      expect(component['_assetCountsLoaded']()).toBe(true);
    });
  });

  describe('preparedData computed', () => {
    it('should return empty array when no poams', () => {
      component.poamsData = [];
      expect(component['preparedData']()).toEqual([]);
    });

    it('should map poam fields correctly', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 3 }];

      const prepared = component['preparedData']();

      expect(prepared).toHaveLength(1);
      expect(prepared[0].poamId).toBe(1);
      expect(prepared[0].status).toBe('Draft');
      expect(prepared[0].vulnerabilityId).toBe('V-12345');
      expect(prepared[0].affectedAssets).toBe(3);
      expect(prepared[0].owner).toBe('Test Owner');
      expect(prepared[0].submittedDate).toBe('2025-01-15');
      expect(prepared[0].scheduledCompletionDate).toBe('2025-04-15');
      expect(prepared[0].lastUpdated).toBe('2025-01-20');
      expect(prepared[0].iavmNumber).toBe('IAV-2025-001');
      expect(prepared[0].taskOrderNumber).toBe('TO-001');
      expect(prepared[0].source).toBe('STIG');
    });

    it('should use extensionDeadline for scheduledCompletionDate when available', () => {
      const poam = createMockPoam({ extensionDeadline: '2025-07-01T00:00:00.000Z' });

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].scheduledCompletionDate).toBe('2025-07-01');
    });

    it('should fall back to submitterName when ownerName is null', () => {
      const poam = createMockPoam({ ownerName: null });

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].owner).toBe('Test Submitter');
    });

    it('should map assigned teams correctly', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].assignedTeams).toEqual([
        { name: 'Team Alpha', complete: 'true' },
        { name: 'Team Beta', complete: 'false' }
      ]);
      expect(prepared[0].assignedTeamNames).toBe('Team Alpha, Team Beta');
    });

    it('should map labels correctly', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].labels).toEqual(['Critical', 'Infrastructure']);
    });

    it('should show isAffectedAssetsLoading when asset counts not yet loaded', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].isAffectedAssetsLoading).toBe(true);
      expect(prepared[0].affectedAssets).toBe(0);
    });

    it('should set shouldReviewForClosure when asset counts loaded and no affected assets', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 0 }];

      const prepared = component['preparedData']();

      expect(prepared[0].shouldReviewForClosure).toBe(true);
    });

    it('should not set shouldReviewForClosure when there are affected assets', () => {
      const poam = createMockPoam();

      component.poamsData = [poam];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 5 }];

      const prepared = component['preparedData']();

      expect(prepared[0].shouldReviewForClosure).toBe(false);
    });

    it('should handle associated vulnerabilities tooltip', () => {
      const poam = createMockPoam({ associatedVulnerabilities: ['V-99999', 'V-88888'] });

      component.poamsData = [poam];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 3 },
        { vulnerabilityId: 'V-99999', assetCount: 2 }
      ];

      const prepared = component['preparedData']();

      expect(prepared[0].hasAssociatedVulnerabilities).toBe(true);
      expect(prepared[0].associatedVulnerabilitiesTooltip).toContain('V-99999: 2');
      expect(prepared[0].associatedVulnerabilitiesTooltip).toContain('Unable to load affected assets for Vulnerability ID: V-88888');
    });

    it('should set shouldReviewForClosure when all associated vulnerability counts are also zero', () => {
      const poam = createMockPoam({ associatedVulnerabilities: ['V-99999'] });

      component.poamsData = [poam];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 0 },
        { vulnerabilityId: 'V-99999', assetCount: 0 }
      ];

      const prepared = component['preparedData']();

      expect(prepared[0].shouldReviewForClosure).toBe(true);
    });

    it('should not set shouldReviewForClosure when associated vulnerability has assets', () => {
      const poam = createMockPoam({ associatedVulnerabilities: ['V-99999'] });

      component.poamsData = [poam];
      component.affectedAssetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 0 },
        { vulnerabilityId: 'V-99999', assetCount: 3 }
      ];

      const prepared = component['preparedData']();

      expect(prepared[0].shouldReviewForClosure).toBe(false);
    });

    it('should handle empty assignedTeams', () => {
      const poam = createMockPoam({ assignedTeams: null });

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].assignedTeams).toEqual([]);
      expect(prepared[0].assignedTeamNames).toBe('');
    });

    it('should handle empty labels', () => {
      const poam = createMockPoam({ labels: null });

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].labels).toEqual([]);
    });

    it('should handle null lastUpdated', () => {
      const poam = createMockPoam({ lastUpdated: null });

      component.poamsData = [poam];

      const prepared = component['preparedData']();

      expect(prepared[0].lastUpdated).toBe('');
    });
  });

  describe('displayedData computed', () => {
    it('should return all preparedData when no filter', () => {
      component.poamsData = [createMockPoam(), createMockPoam({ poamId: 2, vulnerabilityId: 'V-23456' })];
      component.affectedAssetCounts = [];

      expect(component['displayedData']()).toHaveLength(2);
    });

    it('should filter data based on globalFilter', () => {
      component.poamsData = [createMockPoam({ poamId: 1, vulnerabilityTitle: 'SSH Vulnerability' }), createMockPoam({ poamId: 2, vulnerabilityTitle: 'DNS Configuration' })];
      component.affectedAssetCounts = [];

      component.globalFilterSignal.set('SSH');
      const filtered = component['displayedData']();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].vulnerabilityTitle).toBe('SSH Vulnerability');
    });

    it('should be case insensitive', () => {
      component.poamsData = [createMockPoam({ vulnerabilityTitle: 'SSH Vulnerability' })];
      component.affectedAssetCounts = [];

      component.globalFilterSignal.set('ssh');
      expect(component['displayedData']()).toHaveLength(1);
    });

    it('should filter across multiple fields', () => {
      component.poamsData = [createMockPoam({ poamId: 1, vulnerabilityTitle: 'Test', status: 'Draft' }), createMockPoam({ poamId: 2, vulnerabilityTitle: 'Other', status: 'Approved' })];
      component.affectedAssetCounts = [];

      component.globalFilterSignal.set('Draft');
      expect(component['displayedData']()).toHaveLength(1);
    });

    it('should return empty when filter matches nothing', () => {
      component.poamsData = [createMockPoam()];
      component.affectedAssetCounts = [];

      component.globalFilterSignal.set('ZZZZZZZZZ');
      expect(component['displayedData']()).toHaveLength(0);
    });
  });

  describe('globalFilter getter/setter', () => {
    it('should get value from globalFilterSignal', () => {
      component.globalFilterSignal.set('test');
      expect(component.globalFilter).toBe('test');
    });

    it('should set value to globalFilterSignal', () => {
      component.globalFilter = 'search term';
      expect(component.globalFilterSignal()).toBe('search term');
    });
  });

  describe('filteredByOrigin computed', () => {
    const stigPoam = createMockPoam({ poamId: 1, vulnerabilitySource: 'STIG' });
    const tenablePoam = createMockPoam({
      poamId: 2,
      vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner'
    });
    const cpatPoam = createMockPoam({ poamId: 3, vulnerabilitySource: 'C-PAT' });

    it('should return all poams when no origin filter', () => {
      component.poamsData = [stigPoam, tenablePoam, cpatPoam];
      component['collectionOriginSignal'].set('');

      expect(component.filteredByOrigin()).toHaveLength(3);
    });

    it('should filter STIG poams when origin is STIG Manager', () => {
      component.poamsData = [stigPoam, tenablePoam, cpatPoam];
      component['collectionOriginSignal'].set('STIG Manager');

      const filtered = component.filteredByOrigin();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].vulnerabilitySource).toBe('STIG');
    });

    it('should filter Tenable poams when origin is Tenable', () => {
      component.poamsData = [stigPoam, tenablePoam, cpatPoam];
      component['collectionOriginSignal'].set('Tenable');

      const filtered = component.filteredByOrigin();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].vulnerabilitySource).toBe('Assured Compliance Assessment Solution (ACAS) Nessus Scanner');
    });
  });

  describe('managePoam', () => {
    it('should navigate to poam details page', () => {
      component.managePoam({ poamId: 42 });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });
  });

  describe('clear', () => {
    it('should reset globalFilterSignal', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();

      component.globalFilterSignal.set('some filter');
      component.clear();
      expect(component.globalFilterSignal()).toBe('');
    });
  });

  describe('clearCache', () => {
    it('should clear the findingsCache', () => {
      component['findingsCache'].set('test-key', [{ id: 1 }]);
      expect(component['findingsCache'].size).toBe(1);

      component.clearCache();
      expect(component['findingsCache'].size).toBe(0);
    });
  });

  describe('exportCollection', () => {
    let dialogCloseSubject: Subject<any>;

    beforeEach(() => {
      dialogCloseSubject = new Subject();
      const mockDialogRef = { onClose: dialogCloseSubject.asObservable(), close: vi.fn() } as any;

      mockDialogService.open.mockReturnValue(mockDialogRef);
    });

    it('should open PoamExportStatusSelectionComponent dialog', () => {
      component.exportCollection();
      expect(mockDialogService.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ modal: true, dismissableMask: true }));
    });

    it('should return early when no statuses selected', () => {
      component.exportCollection();
      dialogCloseSubject.next(null);
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ summary: 'Export Started' }));
    });

    it('should return early when empty statuses array selected', () => {
      component.exportCollection();
      dialogCloseSubject.next([]);
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ summary: 'Export Started' }));
    });

    it('should show export started message when statuses are selected', () => {
      component.poamsData = [createMockPoam({ status: 'draft' })];
      component.selectedCollectionId.set(1);
      component.selectedCollection.set({ collectionId: 1, collectionName: 'Test', collectionOrigin: 'C-PAT' });

      component.exportCollection();
      dialogCloseSubject.next(['draft']);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'secondary',
          summary: 'Export Started'
        })
      );
    });

    it('should show error when no POAMs match selected statuses', () => {
      component.poamsData = [createMockPoam({ status: 'approved' })];
      component.selectedCollectionId.set(1);
      component.selectedCollection.set({ collectionId: 1, collectionName: 'Test', collectionOrigin: 'C-PAT' });

      component.exportCollection();
      dialogCloseSubject.next(['draft']);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'No Data'
        })
      );
    });

    it('should call processDefaultPoams for C-PAT origin collections', () => {
      const processDefaultSpy = vi.spyOn(component as any, 'processDefaultPoams');

      component.poamsData = [createMockPoam({ status: 'draft' })];
      component.selectedCollectionId.set(1);
      component.selectedCollection.set({ collectionId: 1, collectionName: 'Test', collectionOrigin: 'C-PAT' });

      component.exportCollection();
      dialogCloseSubject.next(['draft']);

      expect(processDefaultSpy).toHaveBeenCalled();
    });

    it('should call processPoamsWithStigFindings for STIG Manager origin', () => {
      const processStigSpy = vi.spyOn(component, 'processPoamsWithStigFindings').mockResolvedValue([]);

      vi.spyOn(component as any, 'generateExcelFile').mockResolvedValue(undefined);

      component.poamsData = [createMockPoam({ status: 'draft' })];
      component.selectedCollectionId.set(2);
      component.selectedCollection.set({ collectionId: 2, collectionName: 'STIG Test', collectionOrigin: 'STIG Manager', originCollectionId: 200 });

      component.exportCollection();
      dialogCloseSubject.next(['draft']);

      expect(processStigSpy).toHaveBeenCalled();
    });

    it('should call processPoamsWithTenableFindings for Tenable origin', () => {
      const processTenableSpy = vi.spyOn(component, 'processPoamsWithTenableFindings').mockResolvedValue([]);

      vi.spyOn(component as any, 'generateExcelFile').mockResolvedValue(undefined);

      component.poamsData = [createMockPoam({ status: 'draft' })];
      component.selectedCollectionId.set(3);
      component.selectedCollection.set({ collectionId: 3, collectionName: 'Tenable Test', collectionOrigin: 'Tenable', originCollectionId: 300 });

      component.exportCollection();
      dialogCloseSubject.next(['draft']);

      expect(processTenableSpy).toHaveBeenCalled();
    });
  });

  describe('addAssociatedVulnerabilitiesToExport', () => {
    it('should return poams unchanged when no associated vulnerabilities', () => {
      const poams = [createMockPoam()];
      const result = component['addAssociatedVulnerabilitiesToExport'](poams);

      expect(result).toHaveLength(1);
    });

    it('should expand poams with associated vulnerabilities', () => {
      const poams = [createMockPoam({ associatedVulnerabilities: ['V-99999', 'V-88888'] })];
      const result = component['addAssociatedVulnerabilitiesToExport'](poams);

      expect(result).toHaveLength(3);
      expect(result[0].vulnerabilityId).toBe('V-12345');
      expect(result[1].vulnerabilityId).toBe('V-99999');
      expect(result[1].isAssociatedVulnerability).toBe(true);
      expect(result[1].parentVulnerabilityId).toBe('V-12345');
      expect(result[2].vulnerabilityId).toBe('V-88888');
    });

    it('should preserve original poam data in duplicates', () => {
      const poams = [createMockPoam({ associatedVulnerabilities: ['V-99999'], status: 'Draft' })];
      const result = component['addAssociatedVulnerabilitiesToExport'](poams);

      expect(result[1].status).toBe('Draft');
      expect(result[1].poamId).toBe(1);
    });
  });

  describe('processDefaultPoams', () => {
    it('should fetch assets and generate excel file', () => {
      const generateSpy = vi.spyOn(component as any, 'generateExcelFile').mockResolvedValue(undefined);
      const mockAssets = [
        { poamId: 1, assetName: 'Server-01' },
        { poamId: 1, assetName: 'Server-02' },
        { poamId: 2, assetName: 'Workstation-01' }
      ];

      mockPoamService.getPoamAssetsByCollectionId.mockReturnValue(of(mockAssets));

      const poams = [createMockPoam({ poamId: 1 }), createMockPoam({ poamId: 2 })];

      component['processDefaultPoams'](poams, 1);

      expect(mockPoamService.getPoamAssetsByCollectionId).toHaveBeenCalledWith(1);
      expect(generateSpy).toHaveBeenCalled();
      const processedPoams = generateSpy.mock.calls[0][0];

      expect(processedPoams[0].devicesAffected).toBe('SERVER-01 SERVER-02');
      expect(processedPoams[1].devicesAffected).toBe('WORKSTATION-01');
    });
  });

  describe('processPoamsWithStigFindings', () => {
    it('should resolve with otherPoams when no STIG poams', async () => {
      const otherPoam = createMockPoam({ vulnerabilitySource: 'C-PAT' });
      const result = await component.processPoamsWithStigFindings([otherPoam], 100);

      expect(result).toHaveLength(1);
      expect(result[0].vulnerabilitySource).toBe('C-PAT');
    });

    it('should process STIG poams with findings data', async () => {
      const stigPoam = createMockPoam({
        vulnerabilityId: 'V-12345',
        vulnerabilitySource: 'STIG',
        stigBenchmarkId: 'RHEL_8_STIG'
      });

      const mockFindings = [
        {
          groupId: 'V-12345',
          assets: [
            { name: 'Server-01', assetId: 1 },
            { name: 'Server-02', assetId: 2 }
          ],
          ccis: [{ apAcronym: 'AC-6', cci: '000123' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(of(mockFindings));

      const result = await component.processPoamsWithStigFindings([stigPoam], 100);

      expect(result).toHaveLength(1);
      expect(result[0].controlAPs).toBe('AC-6');
      expect(result[0].cci).toBe('000123');
      expect(result[0].devicesAffected).toBe('Server-01 Server-02');
    });

    it('should use cached findings on second call', async () => {
      const stigPoam = createMockPoam({
        vulnerabilityId: 'V-12345',
        vulnerabilitySource: 'STIG',
        stigBenchmarkId: 'RHEL_8_STIG'
      });

      const mockFindings = [
        {
          groupId: 'V-12345',
          assets: [{ name: 'Server-01', assetId: 1 }],
          ccis: [{ apAcronym: 'AC-6', cci: '000123' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(of(mockFindings));

      await component.processPoamsWithStigFindings([stigPoam], 100);
      await component.processPoamsWithStigFindings([stigPoam], 100);

      expect(mockSharedService.getSTIGMANAffectedAssetsByPoam).toHaveBeenCalledTimes(1);
    });

    it('should handle errors fetching STIG findings', async () => {
      const stigPoam = createMockPoam({
        vulnerabilityId: 'V-12345',
        vulnerabilitySource: 'STIG',
        stigBenchmarkId: 'RHEL_8_STIG'
      });

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(throwError(() => new Error('Network error')));

      const result = await component.processPoamsWithStigFindings([stigPoam], 100);

      expect(result).toHaveLength(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should pass through poam when no matching finding exists', async () => {
      const stigPoam = createMockPoam({
        vulnerabilityId: 'V-12345',
        vulnerabilitySource: 'STIG',
        stigBenchmarkId: 'RHEL_8_STIG'
      });

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(
        of([
          {
            groupId: 'V-DIFFERENT',
            assets: [],
            ccis: []
          }
        ])
      );

      const result = await component.processPoamsWithStigFindings([stigPoam], 100);

      expect(result).toHaveLength(1);
      expect(result[0].controlAPs).toBeUndefined();
    });

    it('should handle mix of STIG and non-STIG poams', async () => {
      const stigPoam = createMockPoam({ poamId: 1, vulnerabilitySource: 'STIG', stigBenchmarkId: 'RHEL_8_STIG' });
      const otherPoam = createMockPoam({ poamId: 2, vulnerabilitySource: 'C-PAT' });

      mockSharedService.getSTIGMANAffectedAssetsByPoam.mockReturnValue(
        of([
          {
            groupId: 'V-12345',
            assets: [{ name: 'Server-01', assetId: 1 }],
            ccis: [{ apAcronym: 'AC-6', cci: '000123' }]
          }
        ])
      );

      const result = await component.processPoamsWithStigFindings([stigPoam, otherPoam], 100);

      expect(result).toHaveLength(2);
    });
  });

  describe('processPoamsWithTenableFindings', () => {
    const tenableSource = 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner';

    it('should resolve with non-Tenable poams when no Tenable poams', async () => {
      const otherPoam = createMockPoam({ vulnerabilitySource: 'STIG' });
      const result = await component.processPoamsWithTenableFindings([otherPoam]);

      expect(result).toHaveLength(1);
    });

    it('should process Tenable poams with analysis and plugin data', async () => {
      const tenablePoam = createMockPoam({
        poamId: 1,
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: {
            results: [{ pluginID: '12345', dnsName: 'server01.example.com', netbiosName: '' }]
          }
        })
      );

      mockImportService.getTenablePlugin.mockReturnValue(
        of({
          response: { patchPubDate: '2025-01-01' }
        })
      );

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result).toHaveLength(1);
      expect(result[0].controlAPs).toBe('SI-2.9');
      expect(result[0].cci).toContain('002605');
    });

    it('should use CM-6.5 mapping when no patchPubDate', async () => {
      const tenablePoam = createMockPoam({
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: { results: [] }
        })
      );

      mockImportService.getTenablePlugin.mockReturnValue(
        of({
          response: { patchPubDate: '' }
        })
      );

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result).toHaveLength(1);
      expect(result[0].controlAPs).toBe('CM-6.5');
      expect(result[0].cci).toContain('000366');
    });

    it('should extract hostname from netbiosName', async () => {
      const tenablePoam = createMockPoam({
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: {
            results: [{ pluginID: '12345', dnsName: '', netbiosName: 'DOMAIN\\SERVER01' }]
          }
        })
      );

      mockImportService.getTenablePlugin.mockReturnValue(
        of({
          response: { patchPubDate: '2025-01-01' }
        })
      );

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result[0].devicesAffected).toBe('SERVER01');
    });

    it('should extract hostname from dnsName when netbiosName not available', async () => {
      const tenablePoam = createMockPoam({
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: {
            results: [{ pluginID: '12345', dnsName: 'server01.example.com', netbiosName: '' }]
          }
        })
      );

      mockImportService.getTenablePlugin.mockReturnValue(
        of({
          response: { patchPubDate: '2025-01-01' }
        })
      );

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result[0].devicesAffected).toBe('SERVER01');
    });

    it('should handle Tenable analysis error', async () => {
      const tenablePoam = createMockPoam({
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result).toHaveLength(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should handle individual Tenable plugin error', async () => {
      const tenablePoam = createMockPoam({
        vulnerabilityId: '12345',
        vulnerabilitySource: tenableSource
      });

      mockImportService.postTenableAnalysis.mockReturnValue(
        of({
          response: { results: [] }
        })
      );

      mockImportService.getTenablePlugin.mockReturnValue(throwError(() => new Error('Plugin Error')));

      const result = await component.processPoamsWithTenableFindings([tenablePoam]);

      expect(result).toHaveLength(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('importEMASSter', () => {
    let dialogCloseSubject: Subject<any>;

    beforeEach(() => {
      dialogCloseSubject = new Subject();
      const mockDialogRef = { onClose: dialogCloseSubject.asObservable(), close: vi.fn() } as any;

      mockDialogService.open.mockReturnValue(mockDialogRef);
    });

    it('should show error when no file is selected', async () => {
      await component.importEMASSter({ files: [] });
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'No File Selected'
        })
      );
    });

    it('should open EMASSOverwriteSelectionComponent dialog', async () => {
      await component.importEMASSter({ files: [new File([''], 'test.xlsx')] });
      expect(mockDialogService.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ modal: true, dismissableMask: true }));
    });

    it('should return early when no columns selected', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();

      await component.importEMASSter({ files: [new File([''], 'test.xlsx')] });
      dialogCloseSubject.next(null);

      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ summary: 'Processing' }));
    });

    it('should return early when empty columns array selected', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();

      await component.importEMASSter({ files: [new File([''], 'test.xlsx')] });
      dialogCloseSubject.next([]);

      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ summary: 'Processing' }));
    });

    it('should show processing message when columns are selected', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();

      vi.spyOn(PoamExportService, 'updateEMASSterPoams').mockResolvedValue(new Blob());

      await component.importEMASSter({ files: [new File([''], 'test.xlsx')] });
      dialogCloseSubject.next(['description', 'mitigations']);

      await vi.dynamicImportSettled();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'Processing'
        })
      );
    });

    it('should show error when eMASSter processing fails', async () => {
      vi.useFakeTimers();
      await component.ngOnInit();
      vi.runAllTimers();
      vi.useRealTimers();

      vi.spyOn(PoamExportService, 'updateEMASSterPoams').mockRejectedValue(new Error('Parse error'));

      await component.importEMASSter({ files: [new File([''], 'test.xlsx')] });
      dialogCloseSubject.next(['description']);

      await vi.dynamicImportSettled();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });
  });

  describe('generateExcelFile', () => {
    it('should create download link and trigger download', async () => {
      const mockBlob = new Blob(['test']);

      vi.spyOn(PoamExportService, 'convertToExcel').mockResolvedValue(mockBlob);

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        id: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        href: '',
        download: ''
      } as any);

      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn());

      component.user.set({ userId: 1, userName: 'testuser' });
      component.selectedCollection.set({ collectionId: 1, collectionName: 'Test Collection' });

      await component['generateExcelFile']([createMockPoam()]);

      expect(PoamExportService.convertToExcel).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should show error when excel generation fails', async () => {
      vi.spyOn(PoamExportService, 'convertToExcel').mockRejectedValue(new Error('Excel error'));

      component.user.set({ userId: 1, userName: 'testuser' });
      component.selectedCollection.set({ collectionId: 1, collectionName: 'Test' });

      await component['generateExcelFile']([createMockPoam()]);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Export Failed'
        })
      );
    });
  });

  describe('Input: variant', () => {
    it('should accept variant input', () => {
      component.variant = 'team';
      expect(component.variant).toBe('team');
    });
  });

  describe('Input: userId', () => {
    it('should accept userId input', () => {
      component.userId = 42;
      expect(component.userId).toBe(42);
    });
  });

  describe('getTeamSeverity', () => {
    it('should return success for complete=true', () => {
      expect(component.getTeamSeverity('true')).toBe('success');
    });

    it('should return warn for complete=partial', () => {
      expect(component.getTeamSeverity('partial')).toBe('warn');
    });

    it('should return undefined for complete=global', () => {
      expect(component.getTeamSeverity('global')).toBeUndefined();
    });

    it('should return danger for complete=false', () => {
      expect(component.getTeamSeverity('false')).toBe('danger');
    });

    it('should return danger for unknown complete values', () => {
      expect(component.getTeamSeverity('unknown')).toBe('danger');
    });
  });

  describe('getTeamTooltip', () => {
    it('should return fulfilled message for complete=true', () => {
      expect(component.getTeamTooltip('true')).toBe('Team has fulfilled all POAM requirements');
    });

    it('should return partial message for complete=partial', () => {
      expect(component.getTeamTooltip('partial')).toBe('Team has partially fulfilled POAM requirements');
    });

    it('should return global message for complete=global', () => {
      expect(component.getTeamTooltip('global')).toBe('Global Finding - No Team Requirements');
    });

    it('should return not-fulfilled message for complete=false', () => {
      expect(component.getTeamTooltip('false')).toBe('Team has not fulfilled any POAM requirements');
    });
  });

  describe('status sort cycling', () => {
    beforeEach(() => {
      component.poamsData = [
        createMockPoam({ poamId: 1, status: 'Draft' }),
        createMockPoam({ poamId: 2, status: 'Expired' }),
        createMockPoam({ poamId: 3, status: 'Approved' })
      ];
      component.affectedAssetCounts = [];
    });

    it('should start with cycle 0 (no sort icon)', () => {
      expect(component.getCurrentStatusSortIcon()).toBe('');
      expect(component.getCurrentStatusSortName()).toBe('');
      expect(component.getStatusSortIconColor()).toBe('');
    });

    it('should advance to Critical First on first click', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      component.onStatusHeaderClick();
      expect(component.getCurrentStatusSortName()).toBe('Critical First');
      expect(component.getCurrentStatusSortIcon()).toBe('pi-exclamation-circle');
      expect(component.getStatusSortIconColor()).toBe('#e74c3c');
    });

    it('should advance to In-Progress First on second click', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      expect(component.getCurrentStatusSortName()).toBe('In-Progress First');
      expect(component.getCurrentStatusSortIcon()).toBe('pi-info-circle');
      expect(component.getStatusSortIconColor()).toBe('#3498db');
    });

    it('should advance to Completed First on third click', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      expect(component.getCurrentStatusSortName()).toBe('Completed First');
      expect(component.getCurrentStatusSortIcon()).toBe('pi-check-circle');
      expect(component.getStatusSortIconColor()).toBe('#27ae60');
    });

    it('should wrap back to cycle 0 on fourth click', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      expect(component.getCurrentStatusSortIcon()).toBe('');
      expect(component.getCurrentStatusSortName()).toBe('');
    });

    it('should reset sort cycle to 0 via resetStatusSort', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      component.onStatusHeaderClick();
      component.onStatusHeaderClick();
      component.resetStatusSort();
      expect(component['statusSortCycle']()).toBe(0);
    });

    it('should stop event propagation when event is provided', () => {
      const mockTable = { value: [], cd: { detectChanges: vi.fn() }, clear: vi.fn(), filters: {} };

      Object.defineProperty(component, 'table', { value: signal(mockTable), configurable: true });

      const mockEvent = { stopPropagation: vi.fn() } as any;

      component.onStatusHeaderClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('exportToCSV', () => {
    it('should call csvExportService.exportToCsv with all columns', () => {
      component.poamsData = [createMockPoam()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 3 }];

      component.exportToCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({ field: 'poamId', header: 'POAM ID' }),
            expect.objectContaining({ field: 'status', header: 'POAM Status' }),
            expect.objectContaining({ field: 'source', header: 'Vulnerability Source' }),
            expect.objectContaining({ field: 'assignedTeams', header: 'Assigned Teams' }),
            expect.objectContaining({ field: 'labels', header: 'Labels' })
          ]),
          includeTimestamp: false
        })
      );
    });

    it('should use variant as filename prefix', () => {
      component.poamsData = [createMockPoam()];
      component.affectedAssetCounts = [];
      component.variant = 'team';

      component.exportToCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filename: expect.stringMatching(/^team-/) })
      );
    });

    it('should use "poams" as filename prefix when no variant', () => {
      component.poamsData = [createMockPoam()];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filename: expect.stringMatching(/^poams-/) })
      );
    });

    it('should warn and not call exportToCsv when no data', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

      component.poamsData = [];
      component.affectedAssetCounts = [];

      component.exportToCSV();

      expect(warnSpy).toHaveBeenCalledWith('No data to export');
      expect(mockCsvExportService.exportToCsv).not.toHaveBeenCalled();
    });

    it('should serialize assignedTeams and labels as semicolon-separated strings', () => {
      component.poamsData = [createMockPoam()];
      component.affectedAssetCounts = [{ vulnerabilityId: 'V-12345', assetCount: 1 }];

      component.exportToCSV();

      const exportedData = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(exportedData[0].assignedTeams).toBe('Team Alpha; Team Beta');
      expect(exportedData[0].labels).toBe('Critical; Infrastructure');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', async () => {
      await component.setPayload();

      const unsubscribeSpy = vi.spyOn(component['subscriptions'], 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should close dialogRef if open', () => {
      const mockDialogRef = { close: vi.fn() } as any;

      component['dialogRef'] = mockDialogRef;

      component.ngOnDestroy();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not error when dialogRef is undefined', () => {
      component['dialogRef'] = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from payloadSubscriptions', async () => {
      await component.setPayload();
      const subscriptions = component['payloadSubscription'];
      const spies = subscriptions.map((sub) => vi.spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();
      spies.forEach((spy) => expect(spy).toHaveBeenCalled());
    });
  });
});
