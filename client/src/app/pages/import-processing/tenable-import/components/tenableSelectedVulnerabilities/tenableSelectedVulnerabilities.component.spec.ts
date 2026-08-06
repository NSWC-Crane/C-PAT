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
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { TenableSelectedVulnerabilitiesComponent } from './tenableSelectedVulnerabilities.component';
import { ImportService } from '../../../import.service';
import { PoamService } from '../../../../poam-processing/poams.service';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { createMockMessageService, createMockRouter } from '../../../../../../testing/mocks/service-mocks';

const mockCollections = [{ collectionId: 1, originCollectionId: 42, collectionName: 'Test Collection' }];

const mockAnalysisResponse = {
  response: {
    results: [
      {
        pluginID: '12345',
        name: 'Test Plugin',
        family: { name: 'Windows' },
        severity: { name: 'High' },
        vprScore: '7.5',
        total: '5',
        hostTotal: '3',
        acrScore: '8.5',
        assetExposureScore: '450',
        port: '80',
        ips: ['10.0.0.1'],
        netbiosName: 'HOST1',
        dnsName: 'host1.example.com',
        macAddress: 'AA:BB:CC:DD:EE:01',
        protocol: 'TCP',
        uuid: 'uuid-1',
        hostUUID: 'host-uuid-1'
      }
    ]
  }
};

const mockIAVInfo = [
  {
    pluginID: 12345,
    iav: 'IAVA-2023-A-0001',
    navyComplyDate: '2023-12-31T00:00:00',
    supersededBy: 'N/A',
    taskOrder: 'TO-IAV-001'
  }
];

describe('TenableSelectedVulnerabilitiesComponent', () => {
  let component: TenableSelectedVulnerabilitiesComponent;
  let fixture: ComponentFixture<TenableSelectedVulnerabilitiesComponent>;
  let mockImportService: any;
  let mockMessageService: any;
  let mockPoamService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockRouter: any;
  let mockTable: any;
  let mockSelect: any;
  let mockMultiSelect: any;
  let selectedCollectionSubject: BehaviorSubject<any>;

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
    selectedCollectionSubject = new BehaviorSubject<any>(1);

    mockTable = {
      clear: vi.fn(),
      filterGlobal: vi.fn(),
      filters: {},
      filteredValue: null,
      _filter: vi.fn()
    };

    mockSelect = { overlayVisible: vi.fn().mockReturnValue(false), hide: vi.fn(), show: vi.fn() };
    mockMultiSelect = { overlayVisible: vi.fn().mockReturnValue(false), hide: vi.fn(), show: vi.fn() };

    mockImportService = {
      getIAVPluginIds: vi.fn().mockReturnValue(of('12345,67890')),
      postTenableAnalysis: vi.fn().mockReturnValue(of(mockAnalysisResponse)),
      getIAVInfoForPlugins: vi.fn().mockReturnValue(of(mockIAVInfo)),
      getTenablePlugin: vi.fn().mockReturnValue(of({ response: { description: 'Test desc', xrefs: '', vprContext: [] } })),
      getVulnerabilityIdsWithTaskOrderByCollection: vi.fn().mockReturnValue(of([{ vulnerabilityId: '12345', taskOrderNumber: 'TO-001' }]))
    };

    mockMessageService = createMockMessageService();

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of([]))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [TenableSelectedVulnerabilitiesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ImportService, useValue: mockImportService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: Router, useValue: mockRouter }
      ]
    })
      .overrideComponent(TenableSelectedVulnerabilitiesComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableSelectedVulnerabilitiesComponent);
    component = fixture.componentInstance;
    (component as any).table = () => mockTable;
    (component as any).select = () => mockSelect;
    (component as any).columnSelect = () => mockMultiSelect;
    component.existingPoamPluginIDs = {};
  });

  afterEach(() => {
    sessionStorage.removeItem('tenableFilterState');
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default currentPreset to iav', () => {
      expect(component.currentPreset()).toBe('iav');
    });

    it('should default isLoading to false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should default tenableTool to sumid', () => {
      expect(component.tenableTool).toBe('sumid');
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords()).toBe(0);
    });

    it('should default filterValue to empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should default displayDialog to false', () => {
      expect(component.displayDialog()).toBe(false);
    });

    it('should default applicableVulnerabilities to empty array', () => {
      expect(component.applicableVulnerabilities()).toEqual([]);
    });

    it('should default selectedSeverities to all four levels', () => {
      expect(component.selectedSeverities()).toEqual(['Low', 'Medium', 'High', 'Critical']);
    });

    it('should default filters with supersededBy and severity', () => {
      expect(component.filters['supersededBy']).toBeDefined();
      expect(component.filters['severity']).toBeDefined();
    });

    it('should default supersededBy filter value to N/A', () => {
      expect(component.filters['supersededBy'][0].value).toBe('N/A');
    });

    it('should default severity filter values to all levels', () => {
      expect(component.filters['severity'][0].value).toEqual(['Low', 'Medium', 'High', 'Critical']);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to sharedService.selectedCollection', () => {
      component.ngOnInit();
      expect(component.selectedCollection).toBe(1);
    });

    it('should call collectionsService.getCollectionBasicList', () => {
      component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set tenableRepoId from matching collection', () => {
      component.ngOnInit();
      expect(component.tenableRepoId).toBe('42');
    });

    it('should call initColumnsAndFilters when collection is found', () => {
      const spy = vi.spyOn(component, 'initColumnsAndFilters');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call loadPoamAssociations when collection is found', () => {
      const spy = vi.spyOn(component, 'loadPoamAssociations');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getIAVPluginIDs when preset is iav', () => {
      (component as any).currentPreset = () => 'iav';
      const spy = vi.spyOn(component, 'getIAVPluginIDs');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getTaskOrderVulnerabilityIds when preset is taskOrder', () => {
      (component as any).currentPreset = () => 'taskOrder';
      const spy = vi.spyOn(component, 'getTaskOrderVulnerabilityIds');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getIAVTaskOrderPluginIDs when preset is taskOrder and taskOrderSource is iav', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.taskOrderSource.set('iav');
      const spy = vi.spyOn(component, 'getIAVTaskOrderPluginIDs');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should restore taskOrderSource from sessionStorage when preset matches', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ currentPreset: 'taskOrder', taskOrderSource: 'iav' }));
      (component as any).currentPreset = () => 'taskOrder';
      component.ngOnInit();
      expect(component.taskOrderSource()).toBe('iav');
    });

    it('should handle missing collection (no matching collectionId)', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 999, originCollectionId: 99 }]));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set tenableRepoId to empty string when collection not found', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([{ collectionId: 999, originCollectionId: 99 }]));
      component.ngOnInit();
      expect(component.tenableRepoId).toBe('');
    });

    it('should show error when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should restore state from sessionStorage when preset matches', () => {
      const savedState = {
        currentPreset: 'iav',
        filters: { supersededBy: [{ value: 'custom', matchMode: 'equals', operator: 'and' }] },
        selectedSeverities: ['High', 'Critical'],
        selectedNavyComplyDateFilter: { label: 'All Overdue', value: 'alloverdue' },
        filterValue: 'test',
        tenableTool: 'listvuln'
      };

      sessionStorage.setItem('tenableFilterState', JSON.stringify(savedState));
      (component as any).currentPreset = () => 'iav';
      component.ngOnInit();
      expect(component.filterValue).toBe('test');
      expect(component.tenableTool).toBe('listvuln');
      expect(component.selectedNavyComplyDateFilter).toEqual({ label: 'All Overdue', value: 'alloverdue' });
    });

    it('should preserve restored selectedSeverities after the deferred filter pass', () => {
      vi.useFakeTimers();

      try {
        const savedState = {
          currentPreset: 'iav',
          filters: { severity: [{ value: ['High', 'Critical'], matchMode: 'in', operator: 'and' }] },
          selectedSeverities: ['High', 'Critical'],
          filterValue: '',
          tenableTool: 'sumid'
        };

        sessionStorage.setItem('tenableFilterState', JSON.stringify(savedState));
        (component as any).currentPreset = () => 'iav';
        component.ngOnInit();
        vi.runAllTimers();

        expect(component.selectedSeverities()).toEqual(['High', 'Critical']);
        expect(mockTable._filter).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not restore state when presets do not match', () => {
      const savedState = {
        currentPreset: 'taskOrder',
        filters: {},
        selectedSeverities: ['High'],
        filterValue: 'different'
      };

      sessionStorage.setItem('tenableFilterState', JSON.stringify(savedState));
      (component as any).currentPreset = () => 'iav';
      component.ngOnInit();
      expect(component.filterValue).toBe('');
    });

    it('should remove sessionStorage item after reading when presets match', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ currentPreset: 'iav' }));
      component.ngOnInit();
      expect(sessionStorage.getItem('tenableFilterState')).toBeNull();
    });

    it('should keep sessionStorage item when presets do not match', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ currentPreset: 'taskOrder' }));
      (component as any).currentPreset = () => 'iav';
      component.ngOnInit();
      expect(sessionStorage.getItem('tenableFilterState')).not.toBeNull();
    });
  });

  describe('initColumnsAndFilters', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it('should set 21 columns for iav preset', () => {
      expect(component.cols()).toHaveLength(21);
    });

    it('should include poam column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('poam');
    });

    it('should include pluginID column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('pluginID');
    });

    it('should NOT include taskOrderNumber column for iav preset', () => {
      expect(component.cols().map((c: any) => c.field)).not.toContain('taskOrderNumber');
    });

    it('should include navyComplyDate column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('navyComplyDate');
    });

    it('should include severity column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('severity');
    });

    it('should include iav column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('iav');
    });

    it('should include supersededBy column', () => {
      expect(component.cols().map((c: any) => c.field)).toContain('supersededBy');
    });

    it('should set 22 columns for taskOrder preset', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.initColumnsAndFilters();
      expect(component.cols()).toHaveLength(22);
    });

    it('should include taskOrderNumber column for taskOrder preset', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.initColumnsAndFilters();
      expect(component.cols().map((c: any) => c.field)).toContain('taskOrderNumber');
    });

    it('should set exportColumns matching cols length', () => {
      expect(component.exportColumns).toHaveLength(21);
    });

    it('should set 14 deadlineRangeFilters', () => {
      expect(component.deadlineRangeFilters()).toHaveLength(14);
    });

    it('should include an option for All in deadlineRangeFilters', () => {
      expect(component.deadlineRangeFilters().map((f: any) => f.label)).toContain('All');
    });

    it('should include All Overdue option in deadlineRangeFilters', () => {
      expect(component.deadlineRangeFilters().map((f: any) => f.label)).toContain('All Overdue');
    });

    it('should include Due Within 90 Days option in deadlineRangeFilters', () => {
      expect(component.deadlineRangeFilters().map((f: any) => f.label)).toContain('Due Within 90 Days');
    });

    it('should call resetColumnSelections', () => {
      const spy = vi.spyOn(component, 'resetColumnSelections');

      component.initColumnsAndFilters();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getIAVPluginIDs', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it('should call importService.getIAVPluginIds', () => {
      component.getIAVPluginIDs();
      expect(mockImportService.getIAVPluginIds).toHaveBeenCalled();
    });

    it('should set applicablePluginIDs from response', () => {
      component.getIAVPluginIDs();
      expect(component.applicablePluginIDs).toBe('12345,67890');
    });

    it('should call getApplicableFindings with plugin IDs', () => {
      const spy = vi.spyOn(component, 'getApplicableFindings');

      component.getIAVPluginIDs();
      expect(spy).toHaveBeenCalledWith('12345,67890', expect.any(Number));
    });

    it('should show error message on failure', () => {
      mockImportService.getIAVPluginIds.mockReturnValue(throwError(() => new Error('fail')));
      component.getIAVPluginIDs();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set isLoading false on failure', () => {
      mockImportService.getIAVPluginIds.mockReturnValue(throwError(() => new Error('fail')));
      component.isLoading.set(true);
      component.getIAVPluginIDs();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('getTaskOrderVulnerabilityIds', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'taskOrder');
      component.selectedCollection = 1;
      component.initColumnsAndFilters();
    });

    it('should call getVulnerabilityIdsWithTaskOrderByCollection with selectedCollection', () => {
      component.getTaskOrderVulnerabilityIds();
      expect(mockImportService.getVulnerabilityIdsWithTaskOrderByCollection).toHaveBeenCalledWith(1);
    });

    it('should build taskOrderMap from response', () => {
      component.getTaskOrderVulnerabilityIds();
      expect(component.taskOrderMap['12345']).toBe('TO-001');
    });

    it('should set applicablePluginIDs from mapped vulnerabilityIds', () => {
      component.getTaskOrderVulnerabilityIds();
      expect(component.applicablePluginIDs).toBe('12345');
    });

    it('should call getApplicableFindings', () => {
      const spy = vi.spyOn(component, 'getApplicableFindings');

      component.getTaskOrderVulnerabilityIds();
      expect(spy).toHaveBeenCalled();
    });

    it('should show info message when no data returned', () => {
      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(of([]));
      component.getTaskOrderVulnerabilityIds();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
    });

    it('should set isLoading false when no data returned', () => {
      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(of([]));
      component.getTaskOrderVulnerabilityIds();
      expect(component.isLoading()).toBe(false);
    });

    it('should emit 0 totalRecords when no data returned', () => {
      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(of([]));
      const spy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.getTaskOrderVulnerabilityIds();
      expect(spy).toHaveBeenCalledWith(0);
    });

    it('should show error on failure', () => {
      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.getTaskOrderVulnerabilityIds();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set isLoading false on failure', () => {
      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.isLoading.set(true);
      component.getTaskOrderVulnerabilityIds();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('getIAVTaskOrderPluginIDs', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'taskOrder');
      component.taskOrderSource.set('iav');
      component.tenableRepoId = '42';
      component.initColumnsAndFilters();
    });

    it('should call getIAVPluginIds with hasTaskOrder true', () => {
      component.getIAVTaskOrderPluginIDs();
      expect(mockImportService.getIAVPluginIds).toHaveBeenCalledWith(true);
    });

    it('should set applicablePluginIDs and call getApplicableFindings', () => {
      const spy = vi.spyOn(component, 'getApplicableFindings');

      component.getIAVTaskOrderPluginIDs();
      expect(component.applicablePluginIDs).toBe('12345,67890');
      expect(spy).toHaveBeenCalledWith('12345,67890', expect.any(Number));
    });

    it('should show info message and emit 0 when no pluginIDs returned', () => {
      mockImportService.getIAVPluginIds.mockReturnValue(of(''));
      const spy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.getIAVTaskOrderPluginIDs();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
      expect(spy).toHaveBeenCalledWith(0);
      expect(component.isLoading()).toBe(false);
    });

    it('should show error on failure', () => {
      mockImportService.getIAVPluginIds.mockReturnValue(throwError(() => new Error('fail')));
      component.getIAVTaskOrderPluginIDs();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set isLoading false on failure', () => {
      mockImportService.getIAVPluginIds.mockReturnValue(throwError(() => new Error('fail')));
      component.isLoading.set(true);
      component.getIAVTaskOrderPluginIDs();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('onTaskOrderSourceChange', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'taskOrder');
      component.selectedCollection = 1;
      component.tenableRepoId = '42';
      component.initColumnsAndFilters();
    });

    it('should do nothing when source is unchanged', () => {
      const spy = vi.spyOn(component, 'getTaskOrderVulnerabilityIds');

      component.onTaskOrderSourceChange('poam');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should reset state and call getIAVTaskOrderPluginIDs when switching to iav', () => {
      component.applicableVulnerabilities.set([{ pluginID: 12345 }]);
      component.taskOrderMap = { '12345': 'TO-001' };
      component.applicablePluginIDs = '12345';
      component.tenableTool = 'listvuln';
      const loadSpy = vi.spyOn(component, 'getIAVTaskOrderPluginIDs');
      const emitSpy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.onTaskOrderSourceChange('iav');
      expect(component.taskOrderSource()).toBe('iav');
      expect(component.taskOrderMap).toEqual({});
      expect(component.tenableTool).toBe('sumid');
      expect(emitSpy).toHaveBeenCalledWith(0);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should call getTaskOrderVulnerabilityIds when switching back to poam', () => {
      component.taskOrderSource.set('iav');
      const spy = vi.spyOn(component, 'getTaskOrderVulnerabilityIds');

      component.onTaskOrderSourceChange('poam');
      expect(component.taskOrderSource()).toBe('poam');
      expect(spy).toHaveBeenCalled();
    });

    it('should reset filters and search state when switching source', () => {
      component.filters['taskOrderNumber'] = [{ value: 'TO-1', matchMode: 'contains', operator: 'and' }];
      component.filterValue = 'search text';
      component.selectedNavyComplyDateFilter = { label: 'All Overdue', value: 'alloverdue' };
      component.selectedSeverities.set(['High']);

      const navyComplyCol = component.cols().find((c: any) => c.field === 'navyComplyDate');

      navyComplyCol.filterValue = '01/01/2026 - 02/01/2026';
      component.onTaskOrderSourceChange('iav');
      expect(component.filters['taskOrderNumber']).toBeUndefined();
      expect(component.filters['supersededBy'][0].value).toBe('N/A');
      expect(component.selectedSeverities()).toEqual(['Low', 'Medium', 'High', 'Critical']);
      expect(component.filterValue).toBe('');
      expect(component.selectedNavyComplyDateFilter).toBeNull();
      expect(navyComplyCol.filterValue).toBe('');
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should set the source but skip loading when tenableRepoId is missing', () => {
      component.tenableRepoId = '';
      const spy = vi.spyOn(component, 'getIAVTaskOrderPluginIDs');

      component.onTaskOrderSourceChange('iav');
      expect(component.taskOrderSource()).toBe('iav');
      expect(spy).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should ignore an in-flight POAM chain after switching to IAV', () => {
      const poamIds = new Subject<any>();

      mockImportService.getVulnerabilityIdsWithTaskOrderByCollection.mockReturnValue(poamIds.asObservable());
      component.getTaskOrderVulnerabilityIds();
      const findingsSpy = vi.spyOn(component, 'getApplicableFindings');

      component.onTaskOrderSourceChange('iav');
      findingsSpy.mockClear();
      poamIds.next([{ vulnerabilityId: '55555', taskOrderNumber: 'TO-STALE' }]);
      poamIds.complete();
      expect(findingsSpy).not.toHaveBeenCalled();
      expect(component.taskOrderMap).toEqual({});
    });
  });

  describe('getApplicableFindings', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.tenableRepoId = '42';
      component.initColumnsAndFilters();
    });

    it('should call postTenableAnalysis with repo filter', () => {
      component.getApplicableFindings('12345');
      const callArgs = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const repoFilter = callArgs.query.filters.find((f: any) => f.filterName === 'repository');

      expect(repoFilter?.value[0].id).toBe('42');
    });

    it('should discard a stale response when a newer request supersedes it', () => {
      const staleAnalysis = new Subject<any>();

      mockImportService.postTenableAnalysis.mockReturnValueOnce(staleAnalysis.asObservable()).mockReturnValueOnce(of(mockAnalysisResponse));
      component.getApplicableFindings('99999');
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()).toHaveLength(1);
      expect(component.applicableVulnerabilities()[0].pluginID).toBe(12345);
      staleAnalysis.next({ response: { results: [{ ...mockAnalysisResponse.response.results[0], pluginID: '99999' }] } });
      staleAnalysis.complete();
      expect(component.applicableVulnerabilities()).toHaveLength(1);
      expect(component.applicableVulnerabilities()[0].pluginID).toBe(12345);
    });

    it('should not let a stale request clear isLoading while a newer request is in flight', () => {
      const staleAnalysis = new Subject<any>();
      const activeAnalysis = new Subject<any>();

      mockImportService.postTenableAnalysis.mockReturnValueOnce(staleAnalysis.asObservable()).mockReturnValueOnce(activeAnalysis.asObservable());
      component.getApplicableFindings('99999');
      component.getApplicableFindings('12345');
      expect(component.isLoading()).toBe(true);
      staleAnalysis.error(new Error('stale failure'));
      expect(component.isLoading()).toBe(true);
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('stale failure') }));
      activeAnalysis.next(mockAnalysisResponse);
      activeAnalysis.complete();
      expect(component.isLoading()).toBe(false);
    });

    it('should call postTenableAnalysis with pluginID filter', () => {
      component.getApplicableFindings('12345');
      const callArgs = mockImportService.postTenableAnalysis.mock.calls[0][0];
      const pluginFilter = callArgs.query.filters.find((f: any) => f.filterName === 'pluginID');

      expect(pluginFilter?.value).toBe('12345');
    });

    it('should call getIAVInfoForPlugins with numeric pluginID list', () => {
      component.getApplicableFindings('12345,67890');
      expect(mockImportService.getIAVInfoForPlugins).toHaveBeenCalledWith([12345, 67890]);
    });

    it('should populate applicableVulnerabilities from results', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()).toHaveLength(1);
    });

    it('should parse numeric pluginID', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].pluginID).toBe(12345);
    });

    it('should parse plugin name from name field', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].pluginName).toBe('Test Plugin');
    });

    it('should parse family name', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].family).toBe('Windows');
    });

    it('should parse severity name', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].severity).toBe('High');
    });

    it('should parse float vprScore', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].vprScore).toBe(7.5);
    });

    it('should parse integer total', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].total).toBe(5);
    });

    it('should merge iav info from iavInfoMap', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].iav).toBe('IAVA-2023-A-0001');
    });

    it('should set supersededBy from iavInfo', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].supersededBy).toBe('N/A');
    });

    it('should set navyComplyDate as Date object', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].navyComplyDate).toBeInstanceOf(Date);
    });

    it('should set poamStatus to No Existing POAM when no association', () => {
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].poamStatus).toBe('No Existing POAM');
    });

    it('should set totalRecords to results length', () => {
      component.getApplicableFindings('12345');
      expect(component.totalRecords()).toBe(1);
    });

    it('should emit totalRecordsChange with count', () => {
      const spy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.getApplicableFindings('12345');
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should set isLoading false on completion', () => {
      component.getApplicableFindings('12345');
      expect(component.isLoading()).toBe(false);
    });

    it('should show error and complete when postTenableAnalysis fails', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('fail')));
      component.getApplicableFindings('12345');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.isLoading()).toBe(false);
    });

    it('should map taskOrderNumber from iavInfo when taskOrderSource is iav', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.taskOrderSource.set('iav');
      component.taskOrderMap = {};
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].taskOrderNumber).toBe('TO-IAV-001');
    });

    it('should add taskOrderNumber to vulnerability when preset is taskOrder', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.taskOrderMap = { '12345': 'TO-001' };
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()[0].taskOrderNumber).toBe('TO-001');
    });
  });

  describe('loadPoamAssociations', () => {
    it('should call getVulnerabilityIdsWithPoamByCollection with selectedCollection', () => {
      component.selectedCollection = 1;
      component.loadPoamAssociations();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalledWith(1);
    });

    it('should set existingPoamPluginIDs from array response', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      component.loadPoamAssociations();
      expect(component.existingPoamPluginIDs).toBeDefined();
    });

    it('should show error for non-array response', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of({ invalid: true }));
      component.loadPoamAssociations();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error on service failure', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.loadPoamAssociations();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('getPoamStatusColor', () => {
    it('should return a string', () => {
      expect(typeof component.getPoamStatusColor('Approved')).toBe('string');
    });

    it('should return a value for No Existing POAM', () => {
      expect(component.getPoamStatusColor('No Existing POAM')).toBeTruthy();
    });
  });

  describe('getPoamStatusIcon', () => {
    it('should return a string', () => {
      expect(typeof component.getPoamStatusIcon('Draft')).toBe('string');
    });

    it('should return a value for associated status', () => {
      expect(component.getPoamStatusIcon('Associated', true)).toBeTruthy();
    });
  });

  describe('getPoamStatusTooltip', () => {
    it('should return a string', () => {
      expect(typeof component.getPoamStatusTooltip('Approved')).toBe('string');
    });

    it('should return tooltip for null status', () => {
      expect(component.getPoamStatusTooltip(null, false)).toBeTruthy();
    });
  });

  describe('onRowClick', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
      component.applicablePluginIDs = '12345';
    });

    it('should clear applicableVulnerabilities before loading', () => {
      component.applicableVulnerabilities.set([{ pluginID: 1 }]);
      vi.spyOn(component, 'loadVulnList').mockImplementation(() => {});
      const event = { stopPropagation: vi.fn() } as any;

      component.onRowClick({ pluginID: 12345 }, event);
      expect(component.applicableVulnerabilities()).toEqual([]);
    });

    it('should set pluginID filter', () => {
      vi.spyOn(component, 'loadVulnList').mockImplementation(() => {});
      const event = { stopPropagation: vi.fn() } as any;

      component.onRowClick({ pluginID: 12345 }, event);
      expect(component.filters['pluginID']).toBeDefined();
      expect(component.filters['pluginID'][0].value).toBe(12345);
    });

    it('should call event.stopPropagation', () => {
      vi.spyOn(component, 'loadVulnList').mockImplementation(() => {});
      const event = { stopPropagation: vi.fn() } as any;

      component.onRowClick({ pluginID: 12345 }, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call loadVulnList', () => {
      const spy = vi.spyOn(component, 'loadVulnList').mockImplementation(() => {});
      const event = { stopPropagation: vi.fn() } as any;

      component.onRowClick({ pluginID: 12345 }, event);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadVulnList', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
      component.applicablePluginIDs = '12345';
    });

    it('should set tenableTool to listvuln', () => {
      component.loadVulnList();
      expect(component.tenableTool).toBe('listvuln');
    });

    it('should call expandColumnSelections', () => {
      const spy = vi.spyOn(component, 'expandColumnSelections');

      component.loadVulnList();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getApplicableFindings', () => {
      const spy = vi.spyOn(component, 'getApplicableFindings');

      component.loadVulnList();
      expect(spy).toHaveBeenCalledWith('12345');
    });
  });

  describe('loadVulnSummary', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
      component.applicablePluginIDs = '12345';
    });

    it('should set tenableTool to sumid', () => {
      component.tenableTool = 'listvuln';
      component.loadVulnSummary();
      expect(component.tenableTool).toBe('sumid');
    });

    it('should call resetColumnSelections', () => {
      const spy = vi.spyOn(component, 'resetColumnSelections');

      component.loadVulnSummary();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getApplicableFindings', () => {
      const spy = vi.spyOn(component, 'getApplicableFindings');

      component.loadVulnSummary();
      expect(spy).toHaveBeenCalledWith('12345');
    });
  });

  describe('showDetails', () => {
    it('should reject with error when pluginID is missing', async () => {
      await expect(component.showDetails({})).rejects.toBeTruthy();
    });

    it('should show error message when pluginID is missing', async () => {
      await component.showDetails({}).catch(() => {});
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should call getTenablePlugin with correct ID', async () => {
      await component.showDetails({ pluginID: 12345 });
      expect(mockImportService.getTenablePlugin).toHaveBeenCalledWith(12345);
    });

    it('should set pluginData from response', async () => {
      await component.showDetails({ pluginID: 12345 });
      expect(component.pluginData()).toBeDefined();
    });

    it('should set selectedVulnerability', async () => {
      const vuln = { pluginID: 12345, name: 'Test' };

      await component.showDetails(vuln);
      expect(component.selectedVulnerability()).toEqual(vuln);
    });

    it('should set displayDialog to true when createPoam is false', async () => {
      await component.showDetails({ pluginID: 12345 }, false);
      expect(component.displayDialog()).toBe(true);
    });

    it('should NOT set displayDialog when createPoam is true', async () => {
      await component.showDetails({ pluginID: 12345 }, true);
      expect(component.displayDialog()).toBe(false);
    });

    it('should reject when getTenablePlugin returns no response', async () => {
      mockImportService.getTenablePlugin.mockReturnValue(of({}));
      await expect(component.showDetails({ pluginID: 12345 })).rejects.toBeTruthy();
    });

    it('should show error and reject when service fails', async () => {
      mockImportService.getTenablePlugin.mockReturnValue(throwError(() => new Error('fail')));
      await expect(component.showDetails({ pluginID: 12345 })).rejects.toBeTruthy();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('onPoamIconClick', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it('should call event.stopPropagation', async () => {
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ pluginID: 12345, poam: true, poamId: 5 }, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should navigate to existing POAM when poam is true and poamId exists', async () => {
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ pluginID: 12345, poam: true, poamId: 5 }, event);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/5');
    });

    it('should save state to sessionStorage', async () => {
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ pluginID: 12345, poam: true, poamId: 5 }, event);
      const stored = sessionStorage.getItem('tenableFilterState');

      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);

      expect(parsed.currentPreset).toBe('iav');
    });

    it('should navigate to ADDPOAM when no existing poam', async () => {
      const event = { stopPropagation: vi.fn() } as any;

      await component.onPoamIconClick({ pluginID: 12345, poam: false, navyComplyDate: null }, event);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/ADDPOAM'], expect.objectContaining({ state: expect.objectContaining({ vulnerabilitySource: expect.any(String) }) }));
    });
  });

  describe('parseVprContext', () => {
    it('should set parsedVprContext from delegate call', () => {
      component.parseVprContext('[]');
      expect(Array.isArray(component.parsedVprContext())).toBe(true);
    });
  });

  describe('parseReferences', () => {
    it('should parse CVE references', () => {
      component.parseReferences('CVE:CVE-2023-1234 IAVB:2023-B-0001');
      expect(component.cveReferences().length).toBeGreaterThan(0);
    });

    it('should parse IAV references', () => {
      component.parseReferences('IAVA:2023-A-0001');
      expect(component.iavReferences().length).toBeGreaterThan(0);
    });

    it('should parse other references', () => {
      component.parseReferences('XREF:some-ref-123');
      expect(component.otherReferences().length).toBeGreaterThan(0);
    });

    it('should clear all reference arrays for empty input', () => {
      component.cveReferences.set([{ type: 'CVE', value: 'old' }]);
      component.parseReferences('');
      expect(component.cveReferences()).toEqual([]);
    });
  });

  describe('getCveUrl', () => {
    it('should return a non-empty string', () => {
      const url = component.getCveUrl('CVE-2023-1234');

      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });
  });

  describe('getIavUrl', () => {
    it('should return a non-empty string', () => {
      const url = component.getIavUrl('IAVA-2023-A-0001');

      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });
  });

  describe('getSeverityStyling', () => {
    it('should return a truthy value', () => {
      expect(component.getSeverityStyling('High')).toBeTruthy();
    });

    it('should return different values for different severities', () => {
      const high = component.getSeverityStyling('High');
      const low = component.getSeverityStyling('Low');

      expect(high).not.toEqual(low);
    });
  });

  describe('onNavyComplyDateFilterChange', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it('should clear navyComplyDate filter when value is null', () => {
      mockTable.filters['navyComplyDate'] = [{ value: new Date(), matchMode: 'dateBefore', operator: 'and' }];
      component.onNavyComplyDateFilterChange({ value: null });
      expect(mockTable.filters['navyComplyDate']).toBeUndefined();
      expect(mockTable._filter).toHaveBeenCalled();
    });

    it('should clear col filterValue when value is null', () => {
      const col = component.cols().find((c: any) => c.field === 'navyComplyDate');

      col.filterValue = 'existing';
      component.onNavyComplyDateFilterChange({ value: null });
      expect(col.filterValue).toBe('');
    });

    it('should set only dateBefore constraint for alloverdue', () => {
      component.onNavyComplyDateFilterChange({ value: 'alloverdue' });
      const filters = mockTable.filters['navyComplyDate'];

      expect(filters).toHaveLength(1);
      expect(filters[0].matchMode).toBe('dateBefore');
    });

    it('should set only dateBefore constraint for overdue90Plus', () => {
      component.onNavyComplyDateFilterChange({ value: 'overdue90Plus' });
      const filters = mockTable.filters['navyComplyDate'];

      expect(filters).toHaveLength(1);
      expect(filters[0].matchMode).toBe('dateBefore');
    });

    it('should set dateAfter and dateBefore constraints for overdue30To90', () => {
      component.onNavyComplyDateFilterChange({ value: 'overdue30To90' });
      const filters = mockTable.filters['navyComplyDate'];

      expect(filters).toHaveLength(2);
      expect(filters.some((f: any) => f.matchMode === 'dateAfter')).toBe(true);
      expect(filters.some((f: any) => f.matchMode === 'dateBefore')).toBe(true);
    });

    it.each(['overdue0To30', 'overdue0To14', 'overdue0To7', 'dueBetween714', 'dueBetween1430', 'dueBetween3090', 'dueWithin7', 'dueWithin14', 'dueWithin30', 'dueWithin90'])('should set dateAfter and dateBefore constraints for %s', (value) => {
      component.onNavyComplyDateFilterChange({ value });
      const filters = mockTable.filters['navyComplyDate'];

      expect(filters).toHaveLength(2);
    });

    it('should call table._filter after setting constraints', () => {
      component.onNavyComplyDateFilterChange({ value: 'alloverdue' });
      expect(mockTable._filter).toHaveBeenCalled();
    });

    it('should update col filterValue for range filter', () => {
      component.onNavyComplyDateFilterChange({ value: 'overdue30To90' });
      const col = component.cols().find((c: any) => c.field === 'navyComplyDate');

      expect(col.filterValue).toBeTruthy();
    });

    it('should update col filterValue with Before prefix for alloverdue', () => {
      component.onNavyComplyDateFilterChange({ value: 'alloverdue' });
      const col = component.cols().find((c: any) => c.field === 'navyComplyDate');

      expect(col.filterValue).toContain('Before');
    });

    it('should do nothing when event is null', () => {
      expect(() => component.onNavyComplyDateFilterChange(null)).not.toThrow();
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
      component.applicablePluginIDs = '12345';
    });

    it('should call table().clear()', () => {
      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset selectedSeverities to all levels', () => {
      component.selectedSeverities.set(['High']);
      component.clear();
      expect(component.selectedSeverities()).toEqual(['Low', 'Medium', 'High', 'Critical']);
    });

    it('should reset filterValue to empty string', () => {
      component.filterValue = 'some filter';
      component.clear();
      expect(component.filterValue).toBe('');
    });

    it('should reset selectedNavyComplyDateFilter to null', () => {
      component.selectedNavyComplyDateFilter = { label: 'All Overdue', value: 'alloverdue' };
      component.clear();
      expect(component.selectedNavyComplyDateFilter).toBeNull();
    });

    it('should reset supersededBy filter to N/A', () => {
      component.clear();
      expect(component.filters['supersededBy'][0].value).toBe('N/A');
    });

    it('should call loadVulnSummary', () => {
      const spy = vi.spyOn(component, 'loadVulnSummary');

      component.clear();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onGlobalFilter', () => {
    it('should call table filterGlobal with input value and contains', () => {
      const event = { target: { value: 'search' } } as any;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search', 'contains');
    });
  });

  describe('resetColumnSelections', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it('should set selectedColumns with default fields for iav', () => {
      component.resetColumnSelections();
      const fields = component.selectedColumns().map((c: any) => c.field);

      expect(fields).toContain('poam');
      expect(fields).toContain('pluginID');
      expect(fields).toContain('pluginName');
      expect(fields).toContain('severity');
      expect(fields).toContain('navyComplyDate');
    });

    it('should not include taskOrderNumber for iav preset', () => {
      component.resetColumnSelections();
      const fields = component.selectedColumns().map((c: any) => c.field);

      expect(fields).not.toContain('taskOrderNumber');
    });

    it('should include taskOrderNumber for taskOrder preset', () => {
      (component as any).currentPreset = () => 'taskOrder';
      component.initColumnsAndFilters();
      component.resetColumnSelections();
      const fields = component.selectedColumns().map((c: any) => c.field);

      expect(fields).toContain('taskOrderNumber');
    });

    it('should set 11 columns for iav preset', () => {
      component.resetColumnSelections();
      expect(component.selectedColumns()).toHaveLength(11);
    });
  });

  describe('expandColumnSelections', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
    });

    it.each(['ips', 'netbiosName', 'macAddress'])('should include %s column', (field) => {
      component.expandColumnSelections();
      const fields = component.selectedColumns().map((c: any) => c.field);

      expect(fields).toContain(field);
    });

    it('should have more columns than reset selection', () => {
      component.resetColumnSelections();
      const resetCount = component.selectedColumns().length;

      component.expandColumnSelections();
      expect(component.selectedColumns().length).toBeGreaterThan(resetCount);
    });
  });

  describe('onFilter', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPreset', 'iav');
      component.initColumnsAndFilters();
      component.applicableVulnerabilities.set([{ pluginID: 1 }, { pluginID: 2 }]);
    });

    it('should update totalRecords from filteredValue', () => {
      mockTable.filteredValue = [{ pluginID: 1 }];
      mockTable.filters = { severity: [{ value: ['High', 'Critical'] }] };
      component.onFilter({});
      expect(component.totalRecords()).toBe(1);
    });

    it('should use applicableVulnerabilities length when filteredValue is null', () => {
      mockTable.filteredValue = null;
      mockTable.filters = { severity: [{ value: ['High'] }] };
      component.onFilter({});
      expect(component.totalRecords()).toBe(2);
    });

    it('should emit totalRecordsChange', () => {
      mockTable.filteredValue = [{ pluginID: 1 }];
      mockTable.filters = { severity: [{ value: ['High'] }] };
      const spy = vi.spyOn(component.totalRecordsChange, 'emit');

      component.onFilter({});
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should update selectedSeverities from filter', () => {
      mockTable.filteredValue = null;
      mockTable.filters = { severity: [{ value: ['High', 'Critical'] }] };
      component.onFilter({});
      expect(component.selectedSeverities()).toEqual(['High', 'Critical']);
    });

    it('should set selectedSeverities to empty array when severity filter value is empty', () => {
      mockTable.filteredValue = null;
      mockTable.filters = { severity: [{ value: [] }] };
      component.onFilter({});
      expect(component.selectedSeverities()).toEqual([]);
    });
  });

  describe('toggleNavyComplyFilter', () => {
    it('should call select().hide() when overlayVisible is true', () => {
      mockSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleNavyComplyFilter();
      expect(mockSelect.hide).toHaveBeenCalled();
    });

    it('should call select().show() when overlayVisible is false', () => {
      mockSelect.overlayVisible = vi.fn().mockReturnValue(false);
      component.toggleNavyComplyFilter();
      expect(mockSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleNavyComplyFilter();
      expect(mockSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call multiSelect().hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call multiSelect().show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(false);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('stops applying analysis results after destroy (takeUntilDestroyed)', () => {
      const analysisSubject = new Subject<any>();

      mockImportService.postTenableAnalysis.mockReturnValue(analysisSubject.asObservable());
      component.tenableRepoId = '42';
      component.initColumnsAndFilters();
      component.getApplicableFindings('12345');
      expect(component.applicableVulnerabilities()).toEqual([]);
      fixture.destroy();
      analysisSubject.next(mockAnalysisResponse);
      expect(component.applicableVulnerabilities()).toEqual([]);
    });

    it('does not throw on destroy', () => {
      component.ngOnInit();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
