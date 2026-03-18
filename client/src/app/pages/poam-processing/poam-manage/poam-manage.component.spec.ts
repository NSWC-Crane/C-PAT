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
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { createMockDialogService, createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { PoamManageComponent } from './poam-manage.component';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';

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
    ownerId: 100,
    submitterName: 'Test Submitter',
    submitterId: 200,
    submittedDate: '2025-01-15T00:00:00.000Z',
    scheduledCompletionDate: '2025-04-15T00:00:00.000Z',
    extensionDeadline: null,
    lastUpdated: '2025-01-20T10:30:00.000Z',
    assignedTeams: [],
    associatedVulnerabilities: [],
    labels: [],
    ...overrides
  };
}

function createMockFinding(overrides: any = {}) {
  return {
    groupId: 'V-12345',
    severity: 'high',
    assetCount: 5,
    pluginName: '',
    family: '',
    ...overrides
  };
}

describe('PoamManageComponent', () => {
  let component: PoamManageComponent;
  let fixture: ComponentFixture<PoamManageComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let mockImportService: any;
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

    mockRouter = createMockRouter();
    mockMessageService = createMockMessageService();

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject({
        userId: 200,
        userName: 'testuser',
        assignedTeams: [{ assignedTeamId: 10, assignedTeamName: 'Team Alpha' }]
      }),
      payload$: new BehaviorSubject({
        lastCollectionAccessedId: 1
      }),
      accessLevel$: new BehaviorSubject(2)
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable(),
      getFindingsMetricsFromSTIGMAN: vi.fn().mockReturnValue(of([]))
    };

    mockCollectionsService = {
      getPoamsByCollection: vi.fn().mockReturnValue(of([])),
      getCollectionBasicList: vi.fn().mockReturnValue(of([{ collectionId: 1, collectionName: 'Test Collection', originCollectionId: 100, collectionOrigin: 'STIG Manager' }]))
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [] } }))
    };

    await TestBed.configureTestingModule({
      imports: [PoamManageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: ImportService, useValue: mockImportService },
        { provide: DialogService, useValue: createMockDialogService() }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamManageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.poams()).toEqual([]);
      expect(component.allPoams()).toEqual([]);
      expect(component.selectedPoamId()).toBeNull();
      expect(component.selectedCollection()).toBeNull();
      expect(component.selectedCollectionId()).toBeNull();
      expect(component.accessLevel()).toBe(0);
      expect(component.isGridExpanded()).toBe(false);
      expect(component.user()).toBeNull();
      expect(component.payload()).toBeNull();
    });

    it('should initialize pie chart signals as empty arrays', () => {
      expect(component.catIPieChartData()).toEqual([]);
      expect(component.catIIPieChartData()).toEqual([]);
      expect(component.catIIIPieChartData()).toEqual([]);
      expect(component.catIPieChartData30Days()).toEqual([]);
      expect(component.catIIPieChartData30Days()).toEqual([]);
      expect(component.catIIIPieChartData30Days()).toEqual([]);
    });

    it('should initialize findings signals as empty arrays', () => {
      expect(component.findingsData()).toEqual([]);
      expect(component.findingsData30Days()).toEqual([]);
      expect(component.affectedAssetCounts()).toEqual([]);
    });

    it('should initialize findingsByCategory with zero values', () => {
      const stats = component.findingsByCategory();

      expect(stats['CAT I']).toEqual({ total: 0, withPoam: 0, percentage: 0 });
      expect(stats['CAT II']).toEqual({ total: 0, withPoam: 0, percentage: 0 });
      expect(stats['CAT III']).toEqual({ total: 0, withPoam: 0, percentage: 0 });
    });
  });

  describe('Computed Signals', () => {
    it('should compute catITotal from pie chart data', () => {
      component.catIPieChartData.set([
        { name: 'Approved', value: 3 },
        { name: 'Open Findings', value: 7 }
      ]);
      expect(component.catITotal()).toBe(10);
    });

    it('should compute catIITotal from pie chart data', () => {
      component.catIIPieChartData.set([
        { name: 'Approved', value: 5 },
        { name: 'Submitted', value: 2 }
      ]);
      expect(component.catIITotal()).toBe(7);
    });

    it('should compute catIIITotal from pie chart data', () => {
      component.catIIIPieChartData.set([{ name: 'Open Findings', value: 15 }]);
      expect(component.catIIITotal()).toBe(15);
    });

    it('should compute catITotal30Days from 30-day pie chart data', () => {
      component.catIPieChartData30Days.set([
        { name: 'Approved', value: 1 },
        { name: 'Open Findings', value: 4 }
      ]);
      expect(component.catITotal30Days()).toBe(5);
    });

    it('should compute catIITotal30Days from 30-day pie chart data', () => {
      component.catIIPieChartData30Days.set([{ name: 'Submitted', value: 3 }]);
      expect(component.catIITotal30Days()).toBe(3);
    });

    it('should compute catIIITotal30Days from 30-day pie chart data', () => {
      component.catIIIPieChartData30Days.set([]);
      expect(component.catIIITotal30Days()).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedCollection and call setPayload', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 1, collectionName: 'Test', originCollectionId: 100, collectionOrigin: 'STIG Manager' }]));

      await component.ngOnInit();

      expect(component.selectedCollectionId()).toBe(1);
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should update selectedCollectionId when collection changes', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      await component.ngOnInit();

      selectedCollectionSubject.next(5);
      expect(component.selectedCollectionId()).toBe(5);
    });

    it('should set user, payload, and accessLevel from PayloadService', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      await component.ngOnInit();

      expect(component.user()).toEqual(expect.objectContaining({ userId: 200 }));
      expect(component.payload()).toEqual(expect.objectContaining({ lastCollectionAccessedId: 1 }));
      expect(component.accessLevel()).toBe(2);
    });

    it('should fetch POAM data for the last accessed collection', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      await component.ngOnInit();

      expect(mockCollectionsService.getPoamsByCollection).toHaveBeenCalledWith(1);
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set poams and selectedCollection on successful data load', async () => {
      const mockPoams = [createMockPoam()];
      const mockCollections = [{ collectionId: 1, collectionName: 'Test', originCollectionId: 100, collectionOrigin: 'STIG Manager' }];

      mockCollectionsService.getPoamsByCollection.mockReturnValue(of(mockPoams));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      await component.ngOnInit();

      expect(component.poams()).toEqual(mockPoams);
      expect(component.selectedCollection()).toEqual(mockCollections[0]);
    });

    it('should fetch STIG Manager findings when collection origin is STIG Manager', async () => {
      const mockPoams = [createMockPoam()];
      const mockCollections = [{ collectionId: 1, collectionName: 'Test', originCollectionId: 100, collectionOrigin: 'STIG Manager' }];

      mockCollectionsService.getPoamsByCollection.mockReturnValue(of(mockPoams));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));
      mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(of([]));

      await component.ngOnInit();

      expect(mockSharedService.getFindingsMetricsFromSTIGMAN).toHaveBeenCalledWith(100);
    });

    it('should fetch Tenable findings when collection origin is Tenable', async () => {
      const mockPoams = [createMockPoam()];
      const mockCollections = [{ collectionId: 1, collectionName: 'Test', originCollectionId: 100, collectionOrigin: 'Tenable' }];

      mockCollectionsService.getPoamsByCollection.mockReturnValue(of(mockPoams));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      await component.ngOnInit();

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledTimes(2);
    });

    it('should display error message when POAM data load fails', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(throwError(() => new Error('Network error')));

      await component.ngOnInit();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });

    it('should not fetch findings when selectedCollection is null', async () => {
      mockCollectionsService.getPoamsByCollection.mockReturnValue(of([]));
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      await component.ngOnInit();

      expect(mockSharedService.getFindingsMetricsFromSTIGMAN).not.toHaveBeenCalled();
      expect(mockImportService.postTenableAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('updateGridData', () => {
    it('should set allPoams to the full poams list', () => {
      const poams = [createMockPoam({ poamId: 1 }), createMockPoam({ poamId: 2 })];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.allPoams()).toEqual(poams);
    });

    it('should filter poamsNeedingAttention based on 30-day window', () => {
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 15);

      const pastDate = new Date();

      pastDate.setDate(pastDate.getDate() - 5);

      const poams = [
        createMockPoam({ poamId: 1, status: 'Approved', scheduledCompletionDate: futureDate.toISOString() }),
        createMockPoam({ poamId: 2, status: 'Approved', scheduledCompletionDate: pastDate.toISOString() }),
        createMockPoam({ poamId: 3, status: 'Closed', scheduledCompletionDate: futureDate.toISOString() })
      ];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.poamsNeedingAttention().length).toBe(2);
      expect(component.poamsNeedingAttention().map((p: any) => p.poamId)).toContain(1);
      expect(component.poamsNeedingAttention().map((p: any) => p.poamId)).toContain(2);
    });

    it('should exclude Closed, Draft, and False-Positive from needing attention', () => {
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 10);

      const poams = [
        createMockPoam({ poamId: 1, status: 'Closed', scheduledCompletionDate: futureDate.toISOString() }),
        createMockPoam({ poamId: 2, status: 'Draft', scheduledCompletionDate: futureDate.toISOString() }),
        createMockPoam({ poamId: 3, status: 'False-Positive', scheduledCompletionDate: futureDate.toISOString() })
      ];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.poamsNeedingAttention().length).toBe(0);
    });

    it('should not include poams with no scheduledCompletionDate in needing attention', () => {
      const poams = [createMockPoam({ poamId: 1, status: 'Approved', scheduledCompletionDate: null })];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.poamsNeedingAttention().length).toBe(0);
    });

    it('should filter submittedPoams by submitterId or ownerId matching current user', () => {
      component.user.set({ userId: 200, assignedTeams: [] });
      const poams = [
        createMockPoam({ poamId: 1, status: 'Approved', submitterId: 200, ownerId: 300 }),
        createMockPoam({ poamId: 2, status: 'Approved', submitterId: 300, ownerId: 200 }),
        createMockPoam({ poamId: 3, status: 'Approved', submitterId: 300, ownerId: 300 }),
        createMockPoam({ poamId: 4, status: 'Closed', submitterId: 200, ownerId: 200 })
      ];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.submittedPoams().length).toBe(3);
      expect(component.submittedPoams().map((p: any) => p.poamId)).toContain(1);
      expect(component.submittedPoams().map((p: any) => p.poamId)).toContain(2);
      expect(component.submittedPoams().map((p: any) => p.poamId)).toContain(4);
    });

    it('should exclude Closed status from submittedPoams unless user is owner', () => {
      component.user.set({ userId: 200, assignedTeams: [] });
      const poams = [createMockPoam({ poamId: 1, status: 'Closed', submitterId: 200, ownerId: 300 }), createMockPoam({ poamId: 2, status: 'Closed', submitterId: 300, ownerId: 200 })];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.submittedPoams().length).toBe(1);
      expect(component.submittedPoams()[0].poamId).toBe(2);
    });

    it('should filter poamsPendingApproval by pending statuses', () => {
      const poams = [
        createMockPoam({ poamId: 1, status: 'Submitted' }),
        createMockPoam({ poamId: 2, status: 'Extension Requested' }),
        createMockPoam({ poamId: 3, status: 'Pending CAT-I Approval' }),
        createMockPoam({ poamId: 4, status: 'Approved' }),
        createMockPoam({ poamId: 5, status: 'Draft' })
      ];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.poamsPendingApproval().length).toBe(3);
    });

    it('should filter teamPoams by user assigned team ids', () => {
      component.user.set({ userId: 200, assignedTeams: [{ assignedTeamId: 10 }] });
      const poams = [
        createMockPoam({ poamId: 1, assignedTeams: [{ assignedTeamId: 10 }] }),
        createMockPoam({ poamId: 2, assignedTeams: [{ assignedTeamId: 20 }] }),
        createMockPoam({ poamId: 3, assignedTeams: [{ assignedTeamId: 10 }, { assignedTeamId: 20 }] })
      ];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.teamPoams().length).toBe(2);
      expect(component.teamPoams().map((p: any) => p.poamId)).toContain(1);
      expect(component.teamPoams().map((p: any) => p.poamId)).toContain(3);
    });

    it('should handle poams with no assignedTeams', () => {
      component.user.set({ userId: 200, assignedTeams: [{ assignedTeamId: 10 }] });
      const poams = [createMockPoam({ poamId: 1, assignedTeams: undefined }), createMockPoam({ poamId: 2, assignedTeams: null })];

      component.poams.set(poams);

      component.updateGridData();

      expect(component.teamPoams().length).toBe(0);
    });
  });

  describe('managePoam', () => {
    it('should navigate to poam details page', () => {
      component.managePoam({ data: { poamId: 42 } });

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    it('should use the correct poamId from row data', () => {
      component.managePoam({ data: { poamId: 999 } });

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/999');
    });
  });

  describe('toggleGridExpanded', () => {
    it('should toggle isGridExpanded from false to true', () => {
      expect(component.isGridExpanded()).toBe(false);

      component.toggleGridExpanded();

      expect(component.isGridExpanded()).toBe(true);
    });

    it('should toggle isGridExpanded from true to false', () => {
      component.isGridExpanded.set(true);

      component.toggleGridExpanded();

      expect(component.isGridExpanded()).toBe(false);
    });
  });

  describe('calculateFindingStats', () => {
    it('should categorize findings by severity and calculate stats', () => {
      component.poams.set([createMockPoam({ poamId: 1, status: 'Approved', vulnerabilityId: 'V-001' }), createMockPoam({ poamId: 2, status: 'Approved', vulnerabilityId: 'V-002' })]);
      component.findingsData.set([
        createMockFinding({ groupId: 'V-001', severity: 'high' }),
        createMockFinding({ groupId: 'V-002', severity: 'medium' }),
        createMockFinding({ groupId: 'V-003', severity: 'low' }),
        createMockFinding({ groupId: 'V-004', severity: 'critical' })
      ]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT I'].total).toBe(2);
      expect(stats['CAT I'].withPoam).toBe(1);
      expect(stats['CAT II'].total).toBe(1);
      expect(stats['CAT II'].withPoam).toBe(1);
      expect(stats['CAT III'].total).toBe(1);
      expect(stats['CAT III'].withPoam).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      component.poams.set([createMockPoam({ poamId: 1, status: 'Approved', vulnerabilityId: 'V-001' })]);
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'high' }), createMockFinding({ groupId: 'V-002', severity: 'high' })]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT I'].percentage).toBe(50);
    });

    it('should not count Draft poams as having a POAM', () => {
      component.poams.set([createMockPoam({ poamId: 1, status: 'Draft', vulnerabilityId: 'V-001' })]);
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'high' })]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT I'].withPoam).toBe(0);
    });

    it('should match findings via associatedVulnerabilities', () => {
      component.poams.set([createMockPoam({ poamId: 1, status: 'Approved', vulnerabilityId: 'V-999', associatedVulnerabilities: ['V-001'] })]);
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'medium' })]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT II'].withPoam).toBe(1);
    });

    it('should handle empty findings data', () => {
      component.findingsData.set([]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT I'].total).toBe(0);
      expect(stats['CAT II'].total).toBe(0);
      expect(stats['CAT III'].total).toBe(0);
    });

    it('should set percentage to 0 when total is 0', () => {
      component.findingsData.set([]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT I'].percentage).toBe(0);
    });

    it('should default unknown severities to CAT III', () => {
      component.poams.set([]);
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'unknown' })]);

      (component as any).calculateFindingStats();

      const stats = component.findingsByCategory();

      expect(stats['CAT III'].total).toBe(1);
    });
  });

  describe('mapTenableSeverityToCategory', () => {
    it('should map critical to critical', () => {
      expect((component as any).mapTenableSeverityToCategory('Critical')).toBe('critical');
    });

    it('should map high to high', () => {
      expect((component as any).mapTenableSeverityToCategory('High')).toBe('high');
    });

    it('should map medium to medium', () => {
      expect((component as any).mapTenableSeverityToCategory('Medium')).toBe('medium');
    });

    it('should map low to low', () => {
      expect((component as any).mapTenableSeverityToCategory('Low')).toBe('low');
    });

    it('should default unknown severities to low', () => {
      expect((component as any).mapTenableSeverityToCategory('Unknown')).toBe('low');
      expect((component as any).mapTenableSeverityToCategory('')).toBe('low');
    });

    it('should be case-insensitive', () => {
      expect((component as any).mapTenableSeverityToCategory('CRITICAL')).toBe('critical');
      expect((component as any).mapTenableSeverityToCategory('high')).toBe('high');
      expect((component as any).mapTenableSeverityToCategory('mEdIuM')).toBe('medium');
    });
  });

  describe('createCategoryChartData', () => {
    it('should include only categories with values greater than 0', () => {
      const data = {
        approvedPoams: 3,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 5
      };

      const result = (component as any).createCategoryChartData('CAT I', data);

      expect(result.length).toBe(2);
      expect(result[0]).toEqual(expect.objectContaining({ name: 'Approved', value: 3 }));
      expect(result[1]).toEqual(expect.objectContaining({ name: 'Open Findings', value: 5 }));
    });

    it('should return "No Data" entry when all values are 0', () => {
      const data = {
        approvedPoams: 0,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 0
      };

      const result = (component as any).createCategoryChartData('CAT II', data);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        name: 'No Data',
        value: 1,
        extra: { category: 'CAT II', type: 'empty' }
      });
    });

    it('should include all status types when all have values', () => {
      const data = {
        approvedPoams: 1,
        submittedPoams: 2,
        extensionPoams: 3,
        falsePositivePoams: 4,
        pendingApprovalPoams: 5,
        expiredPoams: 6,
        rejectedPoams: 7,
        closedPoams: 8,
        openFindings: 9
      };

      const result = (component as any).createCategoryChartData('CAT III', data);

      expect(result.length).toBe(9);
      expect(result.map((r: any) => r.name)).toEqual(['Approved', 'Submitted', 'Extension Requested', 'False-Positive', 'Pending CAT-I Approval', 'Expired', 'Rejected', 'Closed', 'Open Findings']);
    });

    it('should attach correct extra metadata with category and type', () => {
      const data = {
        approvedPoams: 1,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 0
      };

      const result = (component as any).createCategoryChartData('CAT I', data);

      expect(result[0].extra).toEqual({ category: 'CAT I', type: 'approved' });
    });

    it('should set correct type for each status', () => {
      const data = {
        approvedPoams: 1,
        submittedPoams: 1,
        extensionPoams: 1,
        falsePositivePoams: 1,
        pendingApprovalPoams: 1,
        expiredPoams: 1,
        rejectedPoams: 1,
        closedPoams: 1,
        openFindings: 1
      };

      const result = (component as any).createCategoryChartData('CAT I', data);
      const types = result.map((r: any) => r.extra.type);

      expect(types).toEqual(['approved', 'submitted', 'extension', 'falsePositive', 'pendingApproval', 'expired', 'rejected', 'closed', 'open']);
    });
  });

  describe('updateCategoryPieCharts', () => {
    it('should use fallback categorization when findingsData is empty', () => {
      component.findingsData.set([]);
      component.poams.set([createMockPoam({ poamId: 1, status: 'Approved', rawSeverity: 'High' }), createMockPoam({ poamId: 2, status: 'Approved', rawSeverity: 'Medium' }), createMockPoam({ poamId: 3, status: 'Submitted', rawSeverity: 'Low' })]);

      (component as any).updateCategoryPieCharts();

      const catI = component.catIPieChartData();
      const catII = component.catIIPieChartData();
      const catIII = component.catIIIPieChartData();

      const catIApproved = catI.find((d: any) => d.name === 'Approved');

      expect(catIApproved?.value).toBe(1);

      const catIIApproved = catII.find((d: any) => d.name === 'Approved');

      expect(catIIApproved?.value).toBe(1);

      const catIIISubmitted = catIII.find((d: any) => d.name === 'Submitted');

      expect(catIIISubmitted?.value).toBe(1);
    });

    it('should categorize by findings data when available', () => {
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'high' }), createMockFinding({ groupId: 'V-002', severity: 'medium' }), createMockFinding({ groupId: 'V-003', severity: 'low' })]);
      component.poams.set([createMockPoam({ poamId: 1, status: 'Approved', vulnerabilityId: 'V-001' }), createMockPoam({ poamId: 2, status: 'Submitted', vulnerabilityId: 'V-002' })]);

      (component as any).updateCategoryPieCharts();

      const catI = component.catIPieChartData();

      expect(catI.find((d: any) => d.name === 'Approved')?.value).toBe(1);

      const catII = component.catIIPieChartData();

      expect(catII.find((d: any) => d.name === 'Submitted')?.value).toBe(1);

      const catIII = component.catIIIPieChartData();

      expect(catIII.find((d: any) => d.name === 'Open Findings')?.value).toBe(1);
    });

    it('should handle fallback categorization for critical/high as CAT I', () => {
      component.findingsData.set([]);
      component.poams.set([createMockPoam({ status: 'Approved', rawSeverity: 'Critical' }), createMockPoam({ status: 'Approved', rawSeverity: 'CAT I - High' }), createMockPoam({ status: 'Approved', rawSeverity: 'CAT I - Critical' })]);

      (component as any).updateCategoryPieCharts();

      const catI = component.catIPieChartData();
      const approved = catI.find((d: any) => d.name === 'Approved');

      expect(approved?.value).toBe(3);
    });

    it('should handle fallback categorization for medium as CAT II', () => {
      component.findingsData.set([]);
      component.poams.set([createMockPoam({ status: 'Approved', rawSeverity: 'CAT II - Medium' })]);

      (component as any).updateCategoryPieCharts();

      const catII = component.catIIPieChartData();
      const approved = catII.find((d: any) => d.name === 'Approved');

      expect(approved?.value).toBe(1);
    });

    it('should default to CAT III for unknown rawSeverity in fallback', () => {
      component.findingsData.set([]);
      component.poams.set([createMockPoam({ status: 'Approved', rawSeverity: undefined }), createMockPoam({ status: 'Approved', rawSeverity: '' })]);

      (component as any).updateCategoryPieCharts();

      const catIII = component.catIIIPieChartData();
      const approved = catIII.find((d: any) => d.name === 'Approved');

      expect(approved?.value).toBe(2);
    });

    it('should handle associatedVulnerabilities in findings-based categorization', () => {
      component.findingsData.set([createMockFinding({ groupId: 'V-001', severity: 'high' }), createMockFinding({ groupId: 'V-002', severity: 'high' })]);
      component.poams.set([createMockPoam({ status: 'Approved', vulnerabilityId: 'V-001', associatedVulnerabilities: ['V-002'] })]);

      (component as any).updateCategoryPieCharts();

      const catI = component.catIPieChartData();
      const approved = catI.find((d: any) => d.name === 'Approved');

      expect(approved?.value).toBe(2);
    });

    it('should categorize all POAM status types in fallback mode', () => {
      component.findingsData.set([]);
      component.poams.set([
        createMockPoam({ status: 'Approved', rawSeverity: 'High' }),
        createMockPoam({ status: 'Submitted', rawSeverity: 'High' }),
        createMockPoam({ status: 'Extension Requested', rawSeverity: 'High' }),
        createMockPoam({ status: 'False-Positive', rawSeverity: 'High' }),
        createMockPoam({ status: 'Pending CAT-I Approval', rawSeverity: 'High' }),
        createMockPoam({ status: 'Expired', rawSeverity: 'High' }),
        createMockPoam({ status: 'Rejected', rawSeverity: 'High' }),
        createMockPoam({ status: 'Closed', rawSeverity: 'High' })
      ]);

      (component as any).updateCategoryPieCharts();

      const catI = component.catIPieChartData();

      expect(catI.find((d: any) => d.name === 'Approved')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Submitted')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Extension Requested')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'False-Positive')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Pending CAT-I Approval')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Expired')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Rejected')?.value).toBe(1);
      expect(catI.find((d: any) => d.name === 'Closed')?.value).toBe(1);
    });
  });

  describe('fetchFindingsData - STIG Manager', () => {
    it('should call getFindingsMetricsFromSTIGMAN with collectionId', () => {
      mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(of([]));

      (component as any).fetchFindingsData(100, 'STIG Manager');

      expect(mockSharedService.getFindingsMetricsFromSTIGMAN).toHaveBeenCalledWith(100);
    });

    it('should set findingsData and affectedAssetCounts from STIG Manager response', () => {
      const findings = [
        { groupId: 'V-001', severity: 'high', assetCount: 3 },
        { groupId: 'V-002', severity: 'medium', assetCount: 7 }
      ];

      mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(of(findings));

      (component as any).fetchFindingsData(100, 'STIG Manager');

      expect(component.findingsData()).toEqual(findings);
      expect(component.affectedAssetCounts()).toEqual([
        { vulnerabilityId: 'V-001', assetCount: 3 },
        { vulnerabilityId: 'V-002', assetCount: 7 }
      ]);
    });

    it('should handle missing assetCount as 0', () => {
      const findings = [{ groupId: 'V-001', severity: 'high' }];

      mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(of(findings));

      (component as any).fetchFindingsData(100, 'STIG Manager');

      expect(component.affectedAssetCounts()[0].assetCount).toBe(0);
    });

    it('should display error on STIG Manager failure', () => {
      mockSharedService.getFindingsMetricsFromSTIGMAN.mockReturnValue(throwError(() => new Error('STIG Error')));

      (component as any).fetchFindingsData(100, 'STIG Manager');

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('fetchFindingsData - Tenable', () => {
    it('should call postTenableAnalysis twice for Tenable origin', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(of({ response: { results: [] } }));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledTimes(2);
    });

    it('should process Tenable findings and set findingsData', () => {
      const allResults = {
        response: {
          results: [
            { pluginID: '12345', severity: { name: 'High' }, name: 'Vuln 1', family: { name: 'Family A' }, hostTotal: 3 },
            { pluginID: '67890', severity: { name: 'Medium' }, name: 'Vuln 2', family: { name: 'Family B' }, hostTotal: 5 }
          ]
        }
      };
      const thirtyDaysResults = { response: { results: [] } };

      mockImportService.postTenableAnalysis.mockReturnValueOnce(of(allResults)).mockReturnValueOnce(of(thirtyDaysResults));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(component.findingsData().length).toBe(2);
      expect(component.findingsData()[0].groupId).toBe('12345');
      expect(component.findingsData()[0].severity).toBe('high');
    });

    it('should set affectedAssetCounts from Tenable hostTotal', () => {
      const allResults = {
        response: {
          results: [{ pluginID: '12345', severity: { name: 'High' }, name: 'Vuln', family: { name: 'F' }, hostTotal: 10 }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValueOnce(of(allResults)).mockReturnValueOnce(of({ response: { results: [] } }));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(component.affectedAssetCounts()).toEqual([{ vulnerabilityId: '12345', assetCount: 10 }]);
    });

    it('should set findingsData30Days from 30-day query results', () => {
      const allResults = {
        response: {
          results: [{ pluginID: '12345', severity: { name: 'High' }, name: 'Vuln', family: { name: 'F' }, hostTotal: 3 }]
        }
      };
      const thirtyDaysResults = {
        response: {
          results: [{ pluginID: '99999', severity: { name: 'Low' }, name: '30d Vuln', family: { name: 'G' }, hostTotal: 1 }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValueOnce(of(allResults)).mockReturnValueOnce(of(thirtyDaysResults));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(component.findingsData30Days().length).toBe(1);
      expect(component.findingsData30Days()[0].groupId).toBe('99999');
    });

    it('should handle Tenable error_msg in response', () => {
      const allResults = { error_msg: 'Access denied', response: { results: [] } };

      mockImportService.postTenableAnalysis.mockReturnValueOnce(of(allResults)).mockReturnValueOnce(of({ response: { results: [] } }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle Tenable network error with catchError', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Network error')));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set 30-day pie chart data from Tenable 30-day results', () => {
      const allResults = {
        response: {
          results: [{ pluginID: '111', severity: { name: 'Critical' }, name: 'V1', family: { name: 'F' }, hostTotal: 1 }]
        }
      };
      const thirtyDaysResults = {
        response: {
          results: [{ pluginID: '222', severity: { name: 'Medium' }, name: 'V2', family: { name: 'F' }, hostTotal: 2 }]
        }
      };

      mockImportService.postTenableAnalysis.mockReturnValueOnce(of(allResults)).mockReturnValueOnce(of(thirtyDaysResults));

      (component as any).fetchFindingsData(100, 'Tenable');

      expect(component.catIIPieChartData30Days().length).toBeGreaterThan(0);
    });
  });

  describe('fetchFindingsData - Other Origins', () => {
    it('should clear affectedAssetCounts for non-STIG/Tenable origins', () => {
      component.affectedAssetCounts.set([{ vulnerabilityId: 'old', assetCount: 5 }]);

      (component as any).fetchFindingsData(100, 'Other');

      expect(component.affectedAssetCounts()).toEqual([]);
    });

    it('should still call calculateFindingStats and updateCategoryPieCharts', () => {
      component.findingsData.set([]);
      component.poams.set([createMockPoam({ status: 'Approved', rawSeverity: 'High' })]);

      (component as any).fetchFindingsData(100, 'Other');

      const catI = component.catIPieChartData();

      expect(catI.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      const subsSpy = vi.spyOn(component['subs'], 'unsubscribe');

      component.ngOnDestroy();

      expect(subsSpy).toHaveBeenCalled();
    });
  });
});
