/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { STIGManagerImportComponent } from './stigmanager-import.component';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { PoamService } from '../../poam-processing/poams.service';
import { createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';

@Component({ selector: 'cpat-stigmanager-reviews-table', standalone: true, template: '' })
class MockSTIGManagerReviewsTableComponent {}

@Component({ selector: 'cpat-stigmanager-controls-table', standalone: true, template: '' })
class MockSTIGManagerControlsTableComponent {}

const mockUser = { userId: 1, lastCollectionAccessedId: 10, permissions: { accessLevel: 4 } };

const mockCollectionBasicList = [
  { collectionId: 10, collectionName: 'STIG Collection', collectionOrigin: 'STIG Manager', originCollectionId: 100 },
  { collectionId: 11, collectionName: 'Other Collection', collectionOrigin: 'C-PAT', originCollectionId: null }
];

const mockBenchmarkData = [
  {
    benchmarkId: 'RHEL_8_STIG',
    title: 'Red Hat Enterprise Linux 8 STIG',
    metrics: {
      assessments: 100,
      assessed: 75,
      statuses: { submitted: 10, accepted: 5, rejected: 2 },
      findings: { high: 3, medium: 15, low: 8 }
    }
  },
  {
    benchmarkId: 'WIN10_STIG',
    title: 'Windows 10 STIG',
    metrics: {
      assessments: 0,
      assessed: 0,
      statuses: { submitted: 0, accepted: 0, rejected: 0 },
      findings: { high: 0, medium: 0, low: 0 }
    }
  }
];

const mockFindings = [
  {
    groupId: 'V-230221',
    rules: [{ title: 'Rule Title 1', ruleId: 'SV-230221r_rule' }],
    stigs: [{ benchmarkId: 'RHEL_8_STIG' }],
    severity: 'high',
    assetCount: 5
  },
  {
    groupId: 'V-230222',
    rules: [{ title: 'Rule Title 2', ruleId: 'SV-230222r_rule' }],
    stigs: [{ benchmarkId: 'RHEL_8_STIG' }],
    severity: 'medium',
    assetCount: 3
  }
];

const mockRuleData = {
  title: 'Test Rule Title',
  detail: { vulnDiscussion: 'Test vulnerability discussion' },
  check: { content: 'Test check content' },
  fix: { text: 'Test fix text' }
};

const mockVulnerabilityIds = [
  { vulnerabilityId: 'V-230221', status: 'Draft', poamId: 101, parentStatus: null, parentPoamId: null },
  { vulnerabilityId: 'V-230222', status: 'Associated', poamId: 102, parentStatus: 'Approved', parentPoamId: 100 }
];

describe('STIGManagerImportComponent', () => {
  let component: STIGManagerImportComponent;
  let fixture: ComponentFixture<STIGManagerImportComponent>;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockPayloadService: any;
  let mockPoamService: any;
  let mockMessageService: any;
  let mockRouter: any;
  let mockFindingsTable: any;
  let mockBenchmarksTable: any;
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
    userSubject = new BehaviorSubject<any>(mockUser);

    mockFindingsTable = { filterGlobal: vi.fn(), exportCSV: vi.fn(), clear: vi.fn(), filteredValue: null };
    mockBenchmarksTable = { filterGlobal: vi.fn(), clear: vi.fn(), filteredValue: null };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([...mockCollectionBasicList]))
    };

    mockSharedService = {
      selectedCollection: of(10),
      getCollectionsFromSTIGMAN: vi.fn().mockReturnValue(of([])),
      getCollectionSTIGSummaryFromSTIGMAN: vi.fn().mockReturnValue(of([...mockBenchmarkData])),
      getFindingsByBenchmarkFromSTIGMAN: vi.fn().mockReturnValue(of([...mockFindings])),
      getFindingsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockFindings])),
      getRuleDataFromSTIGMAN: vi.fn().mockReturnValue(of(mockRuleData))
    };

    mockPayloadService = { user$: userSubject.asObservable() };

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of([...mockVulnerabilityIds]))
    };

    mockMessageService = createMockMessageService();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [STIGManagerImportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(STIGManagerImportComponent, {
        set: {
          imports: [
            ButtonModule,
            CardModule,
            CommonModule,
            FormsModule,
            InputTextModule,
            MultiSelectModule,
            SkeletonModule,
            TableModule,
            TabsModule,
            ToastModule,
            TooltipModule,
            InputIconModule,
            IconFieldModule,
            ProgressBarModule,
            TagModule,
            MockSTIGManagerControlsTableComponent,
            MockSTIGManagerReviewsTableComponent
          ],
          providers: [{ provide: MessageService, useValue: mockMessageService }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(STIGManagerImportComponent);
    component = fixture.componentInstance;
    (component as any).findingsTable = () => mockFindingsTable;
    (component as any).benchmarksTable = () => mockBenchmarksTable;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default loadingTableInfo to true', () => {
      expect(component.loadingTableInfo).toBe(true);
    });

    it('should default displayDataSource to empty array', () => {
      expect(component.displayDataSource).toEqual([]);
    });

    it('should default existingPoams to empty array', () => {
      expect(component.existingPoams).toEqual([]);
    });

    it('should default viewMode to "summary"', () => {
      expect(component.viewMode).toBe('summary');
    });

    it('should default selectedBenchmark to null', () => {
      expect(component.selectedBenchmark).toBeNull();
    });

    it('should default benchmarksCount to 0', () => {
      expect(component.benchmarksCount).toBe(0);
    });

    it('should default findingsCount to 0', () => {
      expect(component.findingsCount).toBe(0);
    });

    it('should default reviewsCount to 0', () => {
      expect(component.reviewsCount).toBe(0);
    });

    it('should default controlsCount to 0', () => {
      expect(component.controlsCount).toBe(0);
    });

    it('should define allColumns with 6 columns', () => {
      expect(component.allColumns.length).toBe(6);
    });

    it('should have loadingSkeletonData with 15 items', () => {
      expect(component.loadingSkeletonData.length).toBe(15);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to sharedService.selectedCollection', () => {
      component.ngOnInit();
      expect(component.selectedCollection).toBe(10);
    });

    it('should call initializeComponent', () => {
      const spy = vi.spyOn(component as any, 'initializeComponent');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('initializeComponent', () => {
    it('should set user when user$ emits a valid user', () => {
      (component as any).initializeComponent();
      expect(component.user).toEqual(mockUser);
    });

    it('should call validateStigManagerCollection when user has userId', () => {
      const spy = vi.spyOn(component, 'validateStigManagerCollection');

      (component as any).initializeComponent();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error when user has no userId', () => {
      userSubject.next({ userId: null });
      (component as any).initializeComponent();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error when user$ emits an error', () => {
      mockPayloadService.user$ = throwError(() => new Error('User fetch error'));
      (component as any).initializeComponent();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should filter null user emissions', () => {
      userSubject.next(null);
      const spy = vi.spyOn(component, 'validateStigManagerCollection');

      (component as any).initializeComponent();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('getSeverityStyling', () => {
    it('should return "danger" for CAT I - High', () => {
      expect(component.getSeverityStyling('CAT I - High')).toBe('danger');
    });

    it('should return "warn" for CAT II - Medium', () => {
      expect(component.getSeverityStyling('CAT II - Medium')).toBe('warn');
    });

    it('should return "info" for CAT III - Low', () => {
      expect(component.getSeverityStyling('CAT III - Low')).toBe('info');
    });

    it('should return "info" for unknown severity', () => {
      expect(component.getSeverityStyling('unknown')).toBe('info');
    });
  });

  describe('validateStigManagerCollection', () => {
    it('should set stigmanCollection when STIG Manager collection is found', () => {
      component.user = mockUser;
      component.validateStigManagerCollection();
      expect(component.stigmanCollection).toEqual({ collectionId: 100, name: 'STIG Collection' });
    });

    it('should call loadBenchmarkSummaries with originCollectionId', () => {
      const spy = vi.spyOn(component as any, 'loadBenchmarkSummaries');

      component.user = mockUser;
      component.validateStigManagerCollection();
      expect(spy).toHaveBeenCalledWith(100);
    });

    it('should show warn when selected collection is not found', () => {
      component.user = { ...mockUser, lastCollectionAccessedId: 999 };
      component.validateStigManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show warn when collection is not STIG Manager origin', () => {
      component.user = { ...mockUser, lastCollectionAccessedId: 11 };
      component.validateStigManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: 'The current collection is not associated with STIG Manager.' }));
    });

    it('should show warn when originCollectionId is missing', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 10, collectionName: 'Test', collectionOrigin: 'STIG Manager', originCollectionId: null }]));
      component.user = mockUser;
      component.validateStigManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show error when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('DB error')));
      component.user = mockUser;
      component.validateStigManagerCollection();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('loadBenchmarkSummaries', () => {
    it('should populate benchmarkSummaries', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.benchmarkSummaries.length).toBe(2);
    });

    it('should set benchmarksCount', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.benchmarksCount).toBe(2);
    });

    it('should set loadingTableInfo to false on complete', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.loadingTableInfo).toBe(false);
    });

    it('should calculate assessedPercentage for non-zero assessments', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.benchmarkSummaries[0].assessedPercentage).toBeCloseTo(75);
    });

    it('should set assessedPercentage to 0 when assessments is 0', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.benchmarkSummaries[1].assessedPercentage).toBe(0);
    });

    it('should compute cat1Count, cat2Count, cat3Count', () => {
      (component as any).loadBenchmarkSummaries(100);
      expect(component.benchmarkSummaries[0].cat1Count).toBe(3);
      expect(component.benchmarkSummaries[0].cat2Count).toBe(15);
      expect(component.benchmarkSummaries[0].cat3Count).toBe(8);
    });

    it('should show warn when data is empty', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(of([]));
      (component as any).loadBenchmarkSummaries(100);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: 'No benchmark summaries found.' }));
    });

    it('should show error when fetch fails', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      (component as any).loadBenchmarkSummaries(100);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('selectBenchmark', () => {
    beforeEach(() => {
      component.stigmanCollection = { collectionId: 100, name: 'STIG Collection' };
    });

    it('should set selectedBenchmark', () => {
      const benchmark = { benchmarkId: 'RHEL_8_STIG' };

      component.selectBenchmark(benchmark);
      expect(component.selectedBenchmark).toBe(benchmark);
    });

    it('should set viewMode to "findings"', () => {
      component.selectBenchmark({ benchmarkId: 'RHEL_8_STIG' });
      expect(component.viewMode).toBe('findings');
    });

    it('should call getSTIGMANFindings with collectionId and benchmarkId', () => {
      const spy = vi.spyOn(component, 'getSTIGMANFindings');

      component.selectBenchmark({ benchmarkId: 'RHEL_8_STIG' });
      expect(spy).toHaveBeenCalledWith(100, 'RHEL_8_STIG');
    });
  });

  describe('getAllFindings', () => {
    beforeEach(() => {
      component.stigmanCollection = { collectionId: 100, name: 'STIG Collection' };
    });

    it('should set viewMode to "findings"', () => {
      component.getAllFindings();
      expect(component.viewMode).toBe('findings');
    });

    it('should call getSTIGMANFindings without benchmarkId', () => {
      const spy = vi.spyOn(component, 'getSTIGMANFindings');

      component.getAllFindings();
      expect(spy).toHaveBeenCalledWith(100);
    });
  });

  describe('backToBenchmarkSummary', () => {
    beforeEach(() => {
      component.viewMode = 'findings';
      component.selectedBenchmark = { benchmarkId: 'RHEL_8_STIG' };
      component.benchmarkSummaries = [...mockBenchmarkData];
      component.findingsCount = 5;
    });

    it('should set viewMode to "summary"', () => {
      component.backToBenchmarkSummary();
      expect(component.viewMode).toBe('summary');
    });

    it('should set selectedBenchmark to null', () => {
      component.backToBenchmarkSummary();
      expect(component.selectedBenchmark).toBeNull();
    });

    it('should clear displayDataSource', () => {
      component.displayDataSource = [{ groupId: 'V-001' } as any];
      component.backToBenchmarkSummary();
      expect(component.displayDataSource).toEqual([]);
    });

    it('should reset findingsCount to 0', () => {
      component.backToBenchmarkSummary();
      expect(component.findingsCount).toBe(0);
    });

    it('should restore benchmarksCount from benchmarkSummaries.length', () => {
      component.backToBenchmarkSummary();
      expect(component.benchmarksCount).toBe(2);
    });
  });

  describe('getSTIGMANFindings', () => {
    beforeEach(() => {
      component.selectedCollection = 10;
    });

    it('should call getFindingsByBenchmarkFromSTIGMAN when benchmarkId provided', () => {
      component.getSTIGMANFindings(100, 'RHEL_8_STIG');
      expect(mockSharedService.getFindingsByBenchmarkFromSTIGMAN).toHaveBeenCalledWith(100, 'RHEL_8_STIG');
    });

    it('should call getFindingsFromSTIGMAN when no benchmarkId provided', () => {
      component.getSTIGMANFindings(100);
      expect(mockSharedService.getFindingsFromSTIGMAN).toHaveBeenCalledWith(100);
    });

    it('should map findings data into displayDataSource', () => {
      component.getSTIGMANFindings(100);
      expect(component.displayDataSource.length).toBe(2);
      expect(component.displayDataSource[0].groupId).toBe('V-230221');
    });

    it('should map severity "high" to "CAT I - High"', () => {
      component.getSTIGMANFindings(100);
      expect(component.displayDataSource[0].severity).toBe('CAT I - High');
    });

    it('should map severity "medium" to "CAT II - Medium"', () => {
      component.getSTIGMANFindings(100);
      expect(component.displayDataSource[1].severity).toBe('CAT II - Medium');
    });

    it('should set findingsCount to number of results', () => {
      component.getSTIGMANFindings(100);
      expect(component.findingsCount).toBe(2);
    });

    it('should set loadingTableInfo to false on complete', () => {
      component.getSTIGMANFindings(100);
      expect(component.loadingTableInfo).toBe(false);
    });

    it('should show warn when data is empty', () => {
      mockSharedService.getFindingsFromSTIGMAN.mockReturnValue(of([]));
      component.getSTIGMANFindings(100);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show error when fetch fails', () => {
      mockSharedService.getFindingsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.getSTIGMANFindings(100);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should call filterFindings after mapping data', () => {
      const spy = vi.spyOn(component, 'filterFindings');

      component.getSTIGMANFindings(100);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('mapSeverity (private)', () => {
    it('should map "high" to "CAT I - High"', () => {
      expect((component as any).mapSeverity('high')).toBe('CAT I - High');
    });

    it('should map "medium" to "CAT II - Medium"', () => {
      expect((component as any).mapSeverity('medium')).toBe('CAT II - Medium');
    });

    it('should map "low" to "CAT III - Low"', () => {
      expect((component as any).mapSeverity('low')).toBe('CAT III - Low');
    });

    it('should return the original value for unknown severity', () => {
      expect((component as any).mapSeverity('critical')).toBe('critical');
    });
  });

  describe('updateSort', () => {
    it('should set multiSortMeta from event', () => {
      const event = { multiSortMeta: [{ field: 'severity', order: 1 }] };

      component.updateSort(event);
      expect(component.multiSortMeta).toEqual(event.multiSortMeta);
    });
  });

  describe('filterFindings', () => {
    it('should call getVulnerabilityIdsWithPoamByCollection with selectedCollection', () => {
      component.selectedCollection = 10;
      component.filterFindings();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalledWith(10);
    });

    it('should set existingPoams from service response', () => {
      component.filterFindings();
      expect(component.existingPoams).toEqual(mockVulnerabilityIds);
    });

    it('should show error when fetch fails', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.filterFindings();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('updateExistingPoams (private)', () => {
    beforeEach(() => {
      (component as any).dataSource = [
        { groupId: 'V-230221', hasExistingPoam: false },
        { groupId: 'V-230222', hasExistingPoam: false },
        { groupId: 'V-999999', hasExistingPoam: false }
      ];
      component.existingPoams = [...mockVulnerabilityIds];
    });

    it('should mark hasExistingPoam true for matched findings', () => {
      (component as any).updateExistingPoams();
      expect((component as any).dataSource[0].hasExistingPoam).toBe(true);
    });

    it('should set poamStatus from existing poam', () => {
      (component as any).updateExistingPoams();
      expect((component as any).dataSource[0].poamStatus).toBe('Draft');
    });

    it('should set isAssociated true when status is "Associated"', () => {
      (component as any).updateExistingPoams();
      expect((component as any).dataSource[1].isAssociated).toBe(true);
    });

    it('should set isAssociated false when status is not "Associated"', () => {
      (component as any).updateExistingPoams();
      expect((component as any).dataSource[0].isAssociated).toBe(false);
    });

    it('should set poamStatus to "No Existing POAM" for unmatched findings', () => {
      (component as any).updateExistingPoams();
      expect((component as any).dataSource[2].poamStatus).toBe('No Existing POAM');
    });

    it('should update displayDataSource', () => {
      (component as any).updateExistingPoams();
      expect(component.displayDataSource.length).toBe(3);
    });

    it('should update findingsCount', () => {
      (component as any).updateExistingPoams();
      expect(component.findingsCount).toBe(3);
    });
  });

  describe('getPoamStatusColor', () => {
    it('should return "darkorange" for draft', () => {
      expect(component.getPoamStatusColor('Draft')).toBe('darkorange');
    });

    it('should return "firebrick" for expired', () => {
      expect(component.getPoamStatusColor('Expired')).toBe('firebrick');
    });

    it('should return "firebrick" for rejected', () => {
      expect(component.getPoamStatusColor('Rejected')).toBe('firebrick');
    });

    it('should return "goldenrod" for submitted', () => {
      expect(component.getPoamStatusColor('Submitted')).toBe('goldenrod');
    });

    it('should return "goldenrod" for extension requested', () => {
      expect(component.getPoamStatusColor('Extension Requested')).toBe('goldenrod');
    });

    it('should return "black" for closed', () => {
      expect(component.getPoamStatusColor('Closed')).toBe('black');
    });

    it('should return "green" for approved', () => {
      expect(component.getPoamStatusColor('Approved')).toBe('green');
    });

    it('should return "gray" for unknown status', () => {
      expect(component.getPoamStatusColor('Unknown')).toBe('gray');
    });

    it('should use parentStatus when status is "Associated" and parentStatus provided', () => {
      expect(component.getPoamStatusColor('Associated', 'Approved')).toBe('green');
    });

    it('should use status directly when not "Associated"', () => {
      expect(component.getPoamStatusColor('Draft', 'Approved')).toBe('darkorange');
    });
  });

  describe('getPoamStatusIcon', () => {
    it('should return "pi pi-info-circle" when isAssociated is true', () => {
      expect(component.getPoamStatusIcon('Draft', true)).toBe('pi pi-info-circle');
    });

    it('should return "pi pi-plus-circle" for "no existing poam"', () => {
      expect(component.getPoamStatusIcon('No Existing POAM')).toBe('pi pi-plus-circle');
    });

    it('should return "pi pi-ban" for expired', () => {
      expect(component.getPoamStatusIcon('Expired')).toBe('pi pi-ban');
    });

    it('should return "pi pi-ban" for rejected', () => {
      expect(component.getPoamStatusIcon('Rejected')).toBe('pi pi-ban');
    });

    it('should return "pi pi-check-circle" for approved', () => {
      expect(component.getPoamStatusIcon('Approved')).toBe('pi pi-check-circle');
    });

    it('should return "pi pi-check-circle" for draft', () => {
      expect(component.getPoamStatusIcon('Draft')).toBe('pi pi-check-circle');
    });

    it('should return "pi pi-question-circle" for unknown status', () => {
      expect(component.getPoamStatusIcon('Unknown')).toBe('pi pi-question-circle');
    });
  });

  describe('getPoamStatusTooltip', () => {
    it('should return create draft message when hasExistingPoam is false', () => {
      expect(component.getPoamStatusTooltip(undefined, false)).toBe('No Existing POAM. Click to create draft POAM.');
    });

    it('should return unknown status message when status is falsy but hasExistingPoam is true', () => {
      expect(component.getPoamStatusTooltip(undefined, true)).toBe('POAM Status Unknown. Click to view POAM.');
    });

    it('should return associated message with parent status when status is "Associated"', () => {
      const tooltip = component.getPoamStatusTooltip('Associated', true, 'Approved');

      expect(tooltip).toContain('associated with an existing POAM');
      expect(tooltip).toContain('Approved');
    });

    it('should return associated message without parent when parentStatus is empty', () => {
      const tooltip = component.getPoamStatusTooltip('Associated', true);

      expect(tooltip).toContain('associated with an existing POAM');
      expect(tooltip).not.toContain('Parent POAM Status');
    });

    it('should return standard status message for non-associated statuses', () => {
      expect(component.getPoamStatusTooltip('Draft', true)).toBe('POAM Status: Draft. Click to view POAM.');
    });
  });

  describe('addPoam', () => {
    it('should show error when rowData has no ruleId', () => {
      component.addPoam({ groupId: 'V-001', ruleId: null });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error when rowData has no groupId', () => {
      component.addPoam({ groupId: null, ruleId: 'SV-001_rule' });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should not call getRuleDataFromSTIGMAN for invalid rowData', () => {
      component.addPoam({ groupId: null, ruleId: null });
      expect(mockSharedService.getRuleDataFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should call getRuleDataFromSTIGMAN with ruleId', () => {
      const rowData = { groupId: 'V-230221', ruleId: 'SV-230221r_rule', benchmarkId: 'RHEL_8_STIG', severity: 'CAT I - High' };

      component.existingPoams = [];
      component.addPoam(rowData);
      expect(mockSharedService.getRuleDataFromSTIGMAN).toHaveBeenCalledWith('SV-230221r_rule');
    });

    it('should navigate to ADDPOAM route when no existing POAM found', () => {
      component.existingPoams = [];
      const rowData = { groupId: 'V-999', ruleId: 'SV-999_rule', benchmarkId: 'TEST', severity: 'CAT I - High' };

      component.addPoam(rowData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/ADDPOAM'], expect.objectContaining({ state: expect.objectContaining({ vulnerabilityId: 'V-999' }) }));
    });

    it('should navigate to existing poamId route when existing POAM found', () => {
      component.existingPoams = [{ vulnerabilityId: 'V-230221', poamId: 101, status: 'Draft' }];
      const rowData = { groupId: 'V-230221', ruleId: 'SV-230221r_rule', benchmarkId: 'RHEL_8_STIG', severity: 'CAT I - High' };

      component.addPoam(rowData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/101'], expect.any(Object));
    });

    it('should show error when getRuleDataFromSTIGMAN fails', () => {
      mockSharedService.getRuleDataFromSTIGMAN.mockReturnValue(throwError(() => new Error('Rule fetch error')));
      component.addPoam({ groupId: 'V-001', ruleId: 'SV-001_rule', benchmarkId: 'TEST', severity: 'high' });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include vulnerabilitySource "STIG" in navigation state', () => {
      component.existingPoams = [];
      const rowData = { groupId: 'V-001', ruleId: 'SV-001_rule', benchmarkId: 'TEST', severity: 'CAT I - High' };

      component.addPoam(rowData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ state: expect.objectContaining({ vulnerabilitySource: 'STIG' }) }));
    });
  });

  describe('formatRuleData (private)', () => {
    it('should format rule data into markdown sections', () => {
      const result = (component as any).formatRuleData(mockRuleData);

      expect(result).toContain('# Rule data from STIGMAN');
      expect(result).toContain('## Discussion');
      expect(result).toContain('Test vulnerability discussion');
      expect(result).toContain('## Check');
      expect(result).toContain('Test check content');
      expect(result).toContain('## Fix');
      expect(result).toContain('Test fix text');
    });
  });

  describe('formatDescription (private)', () => {
    it('should format description with title and discussion', () => {
      const result = (component as any).formatDescription(mockRuleData);

      expect(result).toContain('Test Rule Title');
      expect(result).toContain('Test vulnerability discussion');
    });
  });

  describe('onFilter', () => {
    it('should set findingsCount from filteredValue when filter is active', () => {
      mockFindingsTable.filteredValue = [{ groupId: 'V-001' }];
      component.onFilter({});
      expect(component.findingsCount).toBe(1);
    });

    it('should set findingsCount from displayDataSource when no active filter', () => {
      mockFindingsTable.filteredValue = null;
      component.displayDataSource = [{ groupId: 'V-001' } as any, { groupId: 'V-002' } as any];
      component.onFilter({});
      expect(component.findingsCount).toBe(2);
    });
  });

  describe('onBenchmarkFilter', () => {
    it('should set benchmarksCount from filteredValue when filter is active', () => {
      mockBenchmarksTable.filteredValue = [{ benchmarkId: 'RHEL_8_STIG' }];
      component.onBenchmarkFilter({});
      expect(component.benchmarksCount).toBe(1);
    });

    it('should set benchmarksCount from benchmarkSummaries when no active filter', () => {
      mockBenchmarksTable.filteredValue = null;
      component.benchmarkSummaries = [...mockBenchmarkData];
      component.onBenchmarkFilter({});
      expect(component.benchmarksCount).toBe(2);
    });
  });

  describe('onReviewsCountChange', () => {
    it('should set reviewsCount', () => {
      component.onReviewsCountChange(42);
      expect(component.reviewsCount).toBe(42);
    });
  });

  describe('onControlsCountChange', () => {
    it('should set controlsCount', () => {
      component.onControlsCountChange(17);
      expect(component.controlsCount).toBe(17);
    });
  });

  describe('filterGlobal', () => {
    it('should call findingsTable.filterGlobal with input value', () => {
      const event = { target: { value: 'RHEL' } } as any;

      component.filterGlobal(event);
      expect(mockFindingsTable.filterGlobal).toHaveBeenCalledWith('RHEL', 'contains');
    });

    it('should call filterGlobal with empty string when target has no value', () => {
      const event = { target: {} } as any;

      component.filterGlobal(event);
      expect(mockFindingsTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('filterBenchmarkGlobal', () => {
    it('should call benchmarksTable.filterGlobal with input value', () => {
      const event = { target: { value: 'WIN' } } as any;

      component.filterBenchmarkGlobal(event);
      expect(mockBenchmarksTable.filterGlobal).toHaveBeenCalledWith('WIN', 'contains');
    });
  });

  describe('exportCSV', () => {
    it('should call findingsTable.exportCSV', () => {
      component.exportCSV();
      expect(mockFindingsTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should call findingsTable.clear', () => {
      component.clear();
      expect(mockFindingsTable.clear).toHaveBeenCalled();
    });
  });

  describe('clearBenchmarkFilter', () => {
    it('should call benchmarksTable.clear', () => {
      component.clearBenchmarkFilter();
      expect(mockBenchmarksTable.clear).toHaveBeenCalled();
    });
  });

  describe('showWarn', () => {
    it('should add a warn message with the given detail', () => {
      component.showWarn('Test warning');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Warn', detail: 'Test warning' }));
    });
  });

  describe('showError', () => {
    it('should add an error message with the given detail', () => {
      component.showError('Test error');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: 'Test error' }));
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
