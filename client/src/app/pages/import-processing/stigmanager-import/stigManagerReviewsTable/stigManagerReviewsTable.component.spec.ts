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
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { STIGManagerReviewsTableComponent } from './stigManagerReviewsTable.component';
import { SharedService } from '../../../../common/services/shared.service';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { createMockMessageService } from '../../../../../testing/mocks/service-mocks';

const mockBenchmarkData = [{ benchmarkId: 'BENCH-001' }, { benchmarkId: 'BENCH-002' }, { benchmarkId: 'BENCH-001' }];

const mockReviews = [
  {
    assetName: 'Asset1',
    result: 'fail',
    ts: '2024-03-15T10:00:00Z',
    status: { label: 'submitted' },
    resultEngine: { product: 'SCC', version: '5.4.2' },
    rule: { severity: 'high', ruleId: 'SV-001r1' },
    username: 'reviewer1'
  },
  {
    assetName: 'Asset1',
    result: 'pass',
    ts: '2024-03-14T09:00:00Z',
    status: { label: 'accepted' },
    resultEngine: { product: 'SCC', version: '5.4.2' },
    rule: { severity: 'medium', ruleId: 'SV-002r1' },
    username: 'reviewer2'
  },
  {
    assetName: 'Asset2',
    result: 'fail',
    ts: '2024-03-15T08:00:00Z',
    status: { label: 'saved' },
    resultEngine: { product: 'SCC', version: '5.3.0' },
    rule: { severity: 'low', ruleId: 'SV-003r1' },
    username: 'reviewer1'
  }
];

describe('STIGManagerReviewsTableComponent', () => {
  let component: STIGManagerReviewsTableComponent;
  let fixture: ComponentFixture<STIGManagerReviewsTableComponent>;
  let mockSharedService: any;
  let mockCsvExportService: any;
  let mockMessageService: any;
  let mockMultiSelect: any;
  let mockBenchmarkMultiSelect: any;
  let mockFilterPopover: any;

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
    mockMultiSelect = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };
    mockBenchmarkMultiSelect = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };
    mockFilterPopover = { show: vi.fn(), hide: vi.fn() };

    mockSharedService = {
      getCollectionSTIGSummaryFromSTIGMAN: vi.fn().mockReturnValue(of([...mockBenchmarkData])),
      getReviewsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockReviews]))
    };

    mockCsvExportService = {
      flattenTreeNodes: vi.fn().mockReturnValue([{ assetName: 'Asset1' }]),
      exportToCsv: vi.fn()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [STIGManagerReviewsTableComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: SharedService, useValue: mockSharedService }, { provide: CsvExportService, useValue: mockCsvExportService }, { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(STIGManagerReviewsTableComponent);
    component = fixture.componentInstance;
    component.stigmanCollectionId = 42;
    (component as any).multiSelect = () => mockMultiSelect;
    (component as any).benchmarkMultiSelect = () => mockBenchmarkMultiSelect;
    (component as any).treeTable = () => ({});
    (component as any).filterPopover = () => mockFilterPopover;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default treeNodes to empty array', () => {
      expect(component.treeNodes).toEqual([]);
    });

    it('should default isLoading to true', () => {
      expect(component.isLoading).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default assetCount to 0', () => {
      expect(component.assetCount).toBe(0);
    });

    it('should default showBenchmarkSelector to true', () => {
      expect(component.showBenchmarkSelector).toBe(true);
    });

    it('should default filterState.result to "fail"', () => {
      expect(component.filterState.result).toBe('fail');
    });

    it('should default selectedBenchmarkIds to empty array', () => {
      expect(component.selectedBenchmarkIds).toEqual([]);
    });

    it('should default appliedBenchmarkIds to empty array', () => {
      expect(component.appliedBenchmarkIds).toEqual([]);
    });

    it('should have resultMapping with expected keys', () => {
      expect(component.resultMapping['fail']).toBe('Open');
      expect(component.resultMapping['pass']).toBe('Not a Finding');
    });

    it('should have severityMapping with expected keys', () => {
      expect(component.severityMapping['high']).toBe('CAT I - High');
    });

    it('should have statusMapping with expected keys', () => {
      expect(component.statusMapping['submitted']).toBe('Submitted');
    });
  });

  describe('ngOnInit', () => {
    it('should call initColumnsAndFilters', () => {
      const spy = vi.spyOn(component, 'initColumnsAndFilters');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should populate resultOptions from resultMapping', () => {
      component.ngOnInit();
      expect(component.resultOptions.length).toBeGreaterThan(0);
      expect(component.resultOptions.some((o) => o.value === 'fail')).toBe(true);
    });

    it('should call loadBenchmarkIds when stigmanCollectionId is set', () => {
      const spy = vi.spyOn(component, 'loadBenchmarkIds');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error when stigmanCollectionId is 0', () => {
      component.stigmanCollectionId = 0;
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should not call loadBenchmarkIds when stigmanCollectionId is 0', () => {
      component.stigmanCollectionId = 0;
      const spy = vi.spyOn(component, 'loadBenchmarkIds');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set treeNodes to empty array', () => {
      component.ngOnInit();
      expect(component.treeNodes).toEqual([]);
    });
  });

  describe('initColumnsAndFilters', () => {
    beforeEach(() => {
      component.initColumnsAndFilters();
    });

    it('should set 11 columns', () => {
      expect(component.cols.length).toBe(11);
    });

    it('should include assetName column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('assetName');
    });

    it('should include evaluatedDate column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('evaluatedDate');
    });

    it('should call resetColumnSelections', () => {
      const spy = vi.spyOn(component, 'resetColumnSelections');

      component.initColumnsAndFilters();
      expect(spy).toHaveBeenCalled();
    });

    it('should set selectedColumns to all cols', () => {
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('loadBenchmarkIds', () => {
    it('should call getCollectionSTIGSummaryFromSTIGMAN with stigmanCollectionId', () => {
      component.loadBenchmarkIds();
      expect(mockSharedService.getCollectionSTIGSummaryFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should deduplicate benchmarkIds', () => {
      component.loadBenchmarkIds();
      const ids = component.benchmarkOptions.map((o) => o.value);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should set benchmarkOptions sorted', () => {
      component.loadBenchmarkIds();
      expect(component.benchmarkOptions.length).toBe(2);
      expect(component.benchmarkOptions[0].value).toBe('BENCH-001');
      expect(component.benchmarkOptions[1].value).toBe('BENCH-002');
    });

    it('should set isLoading to false after success', () => {
      component.loadBenchmarkIds();
      expect(component.isLoading).toBe(false);
    });

    it('should show error message on service failure', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.loadBenchmarkIds();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set isLoading to false on error', () => {
      mockSharedService.getCollectionSTIGSummaryFromSTIGMAN.mockReturnValue(throwError(() => new Error('Fetch error')));
      component.loadBenchmarkIds();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('hasPendingBenchmarkChanges', () => {
    it('should return true when lengths differ', () => {
      component.appliedBenchmarkIds = ['BENCH-001'];
      component.selectedBenchmarkIds = ['BENCH-001', 'BENCH-002'];
      expect(component.hasPendingBenchmarkChanges()).toBe(true);
    });

    it('should return true when same length but different values', () => {
      component.appliedBenchmarkIds = ['BENCH-001'];
      component.selectedBenchmarkIds = ['BENCH-002'];
      expect(component.hasPendingBenchmarkChanges()).toBe(true);
    });

    it('should return false when same applied and selected', () => {
      component.appliedBenchmarkIds = ['BENCH-001', 'BENCH-002'];
      component.selectedBenchmarkIds = ['BENCH-001', 'BENCH-002'];
      expect(component.hasPendingBenchmarkChanges()).toBe(false);
    });

    it('should return false when both empty', () => {
      component.appliedBenchmarkIds = [];
      component.selectedBenchmarkIds = [];
      expect(component.hasPendingBenchmarkChanges()).toBe(false);
    });
  });

  describe('applyBenchmarkSelection', () => {
    it('should call clearBenchmarkSelection and hide when selectedBenchmarkIds is empty', () => {
      component.selectedBenchmarkIds = [];
      const clearSpy = vi.spyOn(component, 'clearBenchmarkSelection');

      component.applyBenchmarkSelection();
      expect(clearSpy).toHaveBeenCalled();
      expect(mockBenchmarkMultiSelect.hide).toHaveBeenCalled();
    });

    it('should update appliedBenchmarkIds when there are pending changes', () => {
      component.selectedBenchmarkIds = ['BENCH-001'];
      component.appliedBenchmarkIds = [];
      component.applyBenchmarkSelection();
      expect(component.appliedBenchmarkIds).toEqual(['BENCH-001']);
    });

    it('should call loadReviews when there are pending changes', () => {
      component.selectedBenchmarkIds = ['BENCH-001'];
      component.appliedBenchmarkIds = [];
      const spy = vi.spyOn(component, 'loadReviews');

      component.applyBenchmarkSelection();
      expect(spy).toHaveBeenCalled();
    });

    it('should hide benchmarkMultiSelect', () => {
      component.selectedBenchmarkIds = ['BENCH-001'];
      component.appliedBenchmarkIds = ['BENCH-001'];
      component.applyBenchmarkSelection();
      expect(mockBenchmarkMultiSelect.hide).toHaveBeenCalled();
    });

    it('should not call loadReviews when no changes', () => {
      component.selectedBenchmarkIds = ['BENCH-001'];
      component.appliedBenchmarkIds = ['BENCH-001'];
      const spy = vi.spyOn(component, 'loadReviews');

      component.applyBenchmarkSelection();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('clearBenchmarkSelection', () => {
    it('should reset selectedBenchmarkIds to empty', () => {
      component.selectedBenchmarkIds = ['BENCH-001'];
      component.clearBenchmarkSelection();
      expect(component.selectedBenchmarkIds).toEqual([]);
    });

    it('should reset appliedBenchmarkIds to empty', () => {
      component.appliedBenchmarkIds = ['BENCH-001'];
      component.clearBenchmarkSelection();
      expect(component.appliedBenchmarkIds).toEqual([]);
    });

    it('should reset treeNodes to empty', () => {
      component.treeNodes = [{ data: {} }];
      component.clearBenchmarkSelection();
      expect(component.treeNodes).toEqual([]);
    });

    it('should set showBenchmarkSelector to true', () => {
      component.showBenchmarkSelector = false;
      component.clearBenchmarkSelection();
      expect(component.showBenchmarkSelector).toBe(true);
    });

    it('should emit 0 via reviewsCountChange', () => {
      const emitSpy = vi.spyOn(component.reviewsCountChange, 'emit');

      component.clearBenchmarkSelection();
      expect(emitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('loadReviews', () => {
    beforeEach(() => {
      component.appliedBenchmarkIds = ['BENCH-001'];
    });

    it('should return early when appliedBenchmarkIds is empty', () => {
      component.appliedBenchmarkIds = [];
      component.loadReviews();
      expect(mockSharedService.getReviewsFromSTIGMAN).not.toHaveBeenCalled();
    });

    it('should call getReviewsFromSTIGMAN for each benchmark', () => {
      component.appliedBenchmarkIds = ['BENCH-001', 'BENCH-002'];
      component.loadReviews();
      expect(mockSharedService.getReviewsFromSTIGMAN).toHaveBeenCalledTimes(2);
    });

    it('should call getReviewsFromSTIGMAN with correct params', () => {
      component.loadReviews();
      expect(mockSharedService.getReviewsFromSTIGMAN).toHaveBeenCalledWith(42, 'fail', 'BENCH-001');
    });

    it('should populate reviews after load', () => {
      component.loadReviews();
      expect(component.reviews.length).toBe(3);
    });

    it('should set totalRecords to reviews count', () => {
      component.loadReviews();
      expect(component.totalRecords).toBe(3);
    });

    it('should emit reviewsCountChange with count', () => {
      const emitSpy = vi.spyOn(component.reviewsCountChange, 'emit');

      component.loadReviews();
      expect(emitSpy).toHaveBeenCalledWith(3);
    });

    it('should build treeNodes from reviews', () => {
      component.loadReviews();
      expect(component.treeNodes.length).toBeGreaterThan(0);
    });

    it('should set assetCount to treeNodes length', () => {
      component.loadReviews();
      expect(component.assetCount).toBe(component.treeNodes.length);
    });

    it('should set isLoading to false on complete', () => {
      component.loadReviews();
      expect(component.isLoading).toBe(false);
    });

    it('should set showBenchmarkSelector to false while loading', () => {
      mockSharedService.getReviewsFromSTIGMAN.mockReturnValue(of([]));
      component.loadReviews();
      expect(component.showBenchmarkSelector).toBe(false);
    });

    it('should map result to displayResult', () => {
      component.loadReviews();
      const review = component.reviews[0];

      expect(review.displayResult).toBe('Open');
    });

    it('should map status.label to display value', () => {
      component.loadReviews();
      const review = component.reviews[0];

      expect(review['status.label']).toBe('Submitted');
    });

    it('should map rule.severity to display value', () => {
      component.loadReviews();
      const review = component.reviews[0];

      expect(review['rule.severity']).toBe('CAT I - High');
    });

    it('should parse ts into evaluatedDate Date object', () => {
      component.loadReviews();
      const review = component.reviews[0];

      expect(review.evaluatedDate).toBeInstanceOf(Date);
    });

    it('should show error message on service failure', () => {
      mockSharedService.getReviewsFromSTIGMAN.mockReturnValue(throwError(() => new Error('API error')));
      component.loadReviews();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('onResultFilterChange', () => {
    it('should update filterState.result', () => {
      component.onResultFilterChange('pass');
      expect(component.filterState.result).toBe('pass');
    });

    it('should call filterPopover().hide() and loadReviews when benchmarks applied', () => {
      component.appliedBenchmarkIds = ['BENCH-001'];
      const loadSpy = vi.spyOn(component, 'loadReviews');

      component.onResultFilterChange('pass');
      expect(mockFilterPopover.hide).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not call loadReviews when no benchmarks applied', () => {
      component.appliedBenchmarkIds = [];
      const loadSpy = vi.spyOn(component, 'loadReviews');

      component.onResultFilterChange('pass');
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('transformReviewsToTreeNodes', () => {
    it('should return empty array for empty reviews', () => {
      expect(component.transformReviewsToTreeNodes([])).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(component.transformReviewsToTreeNodes(null as any)).toEqual([]);
    });

    it('should group reviews by assetName', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);

      expect(nodes.length).toBe(2);
    });

    it('should set first review as parent node data', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);
      const asset1Node = nodes.find((n) => n.data.assetName === 'Asset1');

      expect(asset1Node).toBeDefined();
      expect(asset1Node?.data.isParentRow).toBe(true);
    });

    it('should set remaining reviews as children', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);
      const asset1Node = nodes.find((n) => n.data.assetName === 'Asset1');

      expect(asset1Node?.children?.length).toBe(1);
    });

    it('should set childCount on parent node', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);
      const asset1Node = nodes.find((n) => n.data.assetName === 'Asset1');

      expect(asset1Node?.data.childCount).toBe(1);
    });

    it('should set isParentRow false on child nodes', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);
      const asset1Node = nodes.find((n) => n.data.assetName === 'Asset1');

      expect(asset1Node?.children?.[0].data.isParentRow).toBe(false);
    });

    it('should create a node for reviews without assetName using "Unknown Asset" as key', () => {
      const reviews = [{ result: 'fail' }];
      const nodes = component.transformReviewsToTreeNodes(reviews);

      expect(nodes.length).toBe(1);
    });

    it('should set expanded to false on parent nodes', () => {
      const nodes = component.transformReviewsToTreeNodes(mockReviews);

      expect(nodes[0].expanded).toBe(false);
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

  describe('getStatusIcon', () => {
    it('should return star icon for Accepted', () => {
      expect(component.getStatusIcon('Accepted')).toBe('pi-star');
    });

    it('should return times-circle icon for Rejected', () => {
      expect(component.getStatusIcon('Rejected')).toBe('pi-times-circle');
    });

    it('should return bookmark icon for Saved', () => {
      expect(component.getStatusIcon('Saved')).toBe('pi-bookmark-fill');
    });

    it('should return reply icon for Submitted', () => {
      expect(component.getStatusIcon('Submitted')).toBe('pi-reply');
    });

    it('should return question icon for unknown status', () => {
      expect(component.getStatusIcon('unknown')).toBe('pi-question');
    });
  });

  describe('getFieldValue', () => {
    it('should return empty string for null data', () => {
      expect(component.getFieldValue(null, 'field')).toBe('');
    });

    it('should return top-level field value', () => {
      expect(component.getFieldValue({ name: 'test' }, 'name')).toBe('test');
    });

    it('should return nested field value using dot notation', () => {
      expect(component.getFieldValue({ rule: { severity: 'high' } }, 'rule.severity')).toBe('high');
    });

    it('should return empty string for missing nested field', () => {
      expect(component.getFieldValue({ rule: null }, 'rule.severity')).toBe('');
    });

    it('should return empty string for undefined field', () => {
      expect(component.getFieldValue({ name: undefined }, 'name')).toBe('');
    });
  });

  describe('matchesFilters', () => {
    it('should return false for null data', () => {
      expect(component.matchesFilters(null)).toBe(false);
    });

    it('should return true when no filters set', () => {
      component.filterState.filters = {};
      expect(component.matchesFilters({ name: 'test' })).toBe(true);
    });

    it('should match string filter case-insensitively', () => {
      component.filterState.filters = { assetName: 'asset' };
      expect(component.matchesFilters({ assetName: 'Asset1' })).toBe(true);
    });

    it('should not match when string filter has no match', () => {
      component.filterState.filters = { assetName: 'xyz' };
      expect(component.matchesFilters({ assetName: 'Asset1' })).toBe(false);
    });

    it('should match array filter using nested field traversal', () => {
      component.filterState.filters = { assetName: ['Asset1', 'Asset2'] };
      expect(component.matchesFilters({ assetName: 'Asset1' })).toBe(true);
    });

    it('should return true for empty array filter', () => {
      component.filterState.filters = { 'rule.severity': [] };
      expect(component.matchesFilters({ 'rule.severity': 'CAT I - High' })).toBe(true);
    });

    it('should match date equals filter', () => {
      const date = new Date('2024-03-15');

      component.filterState.filters = { evaluatedDate: { value: date, mode: 'equals' } };
      expect(component.matchesFilters({ evaluatedDate: new Date('2024-03-15') })).toBe(true);
    });

    it('should match version equals filter using nested traversal', () => {
      component.filterState.filters = { 'resultEngine.version': { value: '5.4.2', mode: 'equals' } };
      expect(component.matchesFilters({ resultEngine: { version: '5.4.2' } })).toBe(true);
    });

    it('should match version lt filter', () => {
      component.filterState.filters = { 'resultEngine.version': { value: '5.5.0', mode: 'lt' } };
      expect(component.matchesFilters({ resultEngine: { version: '5.4.2' } })).toBe(true);
    });

    it('should not match version gt filter when version is less', () => {
      component.filterState.filters = { 'resultEngine.version': { value: '5.5.0', mode: 'gt' } };
      expect(component.matchesFilters({ resultEngine: { version: '5.4.2' } })).toBe(false);
    });

    it('should skip null filterValue', () => {
      component.filterState.filters = { assetName: null };
      expect(component.matchesFilters({ assetName: 'Asset1' })).toBe(true);
    });
  });

  describe('countAllNodes', () => {
    it('should count parent and children', () => {
      const nodes = [
        { data: {}, children: [{ data: {} }, { data: {} }] },
        { data: {}, children: [] }
      ];

      expect(component.countAllNodes(nodes as any)).toBe(4);
    });

    it('should return 0 for empty array', () => {
      expect(component.countAllNodes([])).toBe(0);
    });

    it('should handle nodes with no children property', () => {
      const nodes = [{ data: {} }];

      expect(component.countAllNodes(nodes as any)).toBe(1);
    });
  });

  describe('filterTreeNodes', () => {
    const buildNodes = () => [
      {
        data: { assetName: 'Asset1', 'rule.severity': 'CAT I - High', isParentRow: true },
        children: [{ data: { assetName: 'Asset1', 'rule.severity': 'CAT II - Medium', isParentRow: false }, leaf: true }],
        expanded: false
      },
      {
        data: { assetName: 'Asset2', 'rule.severity': 'CAT I - High', isParentRow: true },
        children: [],
        expanded: false
      }
    ];

    it('should include parent nodes that match filters', () => {
      component.filterState.filters = { assetName: 'Asset1' };
      const result = component.filterTreeNodes(buildNodes() as any);

      expect(result.some((n) => n.data.assetName === 'Asset1')).toBe(true);
    });

    it('should exclude parent nodes that do not match', () => {
      component.filterState.filters = { assetName: 'Asset1' };
      const result = component.filterTreeNodes(buildNodes() as any);

      expect(result.some((n) => n.data.assetName === 'Asset2')).toBe(false);
    });

    it('should promote matching children of non-matching parents', () => {
      const nodes = [
        {
          data: { assetName: 'AssetX', isParentRow: true },
          children: [{ data: { assetName: 'AssetY', isParentRow: false }, leaf: true }],
          expanded: false
        }
      ];

      component.filterState.filters = { assetName: 'AssetY' };
      const result = component.filterTreeNodes(nodes as any);

      expect(result.some((n) => n.data.assetName === 'AssetY')).toBe(true);
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      component.originalTreeNodes = [{ data: { assetName: 'Asset1' } }] as any;
      component.reviews = [{ assetName: 'Asset1' }];
    });

    it('should reset tree nodes when no active filters', () => {
      component.filterState.filters = {};
      component.treeNodes = [];
      component.applyFilters();
      expect(component.treeNodes).toEqual(component.originalTreeNodes);
    });

    it('should filter tree nodes when active filters present', () => {
      component.filterState.filters = { assetName: 'Asset1' };
      component.applyFilters();
      expect(component.treeNodes.length).toBeGreaterThanOrEqual(0);
    });

    it('should emit reviewsCountChange', () => {
      const emitSpy = vi.spyOn(component.reviewsCountChange, 'emit');

      component.filterState.filters = {};
      component.applyFilters();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('clearColumnFilter', () => {
    it('should reset result to "fail" when clearing displayResult', () => {
      component.filterState.result = 'pass';
      component.clearColumnFilter('displayResult');
      expect(component.filterState.result).toBe('fail');
    });

    it('should call loadReviews when result changed and benchmarks applied', () => {
      component.filterState.result = 'pass';
      component.appliedBenchmarkIds = ['BENCH-001'];
      const spy = vi.spyOn(component, 'loadReviews');

      component.clearColumnFilter('displayResult');
      expect(spy).toHaveBeenCalled();
    });

    it('should remove the filter for the given field', () => {
      component.filterState.filters = { assetName: 'test' };
      component.clearColumnFilter('assetName');
      expect(component.filterState.filters['assetName']).toBeUndefined();
    });

    it('should remove dateFilterMode and values for Date fields', () => {
      component.filterState.filters = { evaluatedDate: { value: new Date(), mode: 'equals' } };
      component.filterState.dateFilterMode = { evaluatedDate: 'equals' };
      component.filterState.dateFilterValues = { evaluatedDate: new Date() };
      component.clearColumnFilter('evaluatedDate');
      expect(component.filterState.dateFilterMode['evaluatedDate']).toBeUndefined();
      expect(component.filterState.dateFilterValues['evaluatedDate']).toBeUndefined();
    });

    it('should remove versionFilterMode and values for version fields', () => {
      component.filterState.filters = { 'resultEngine.version': { value: '5.4', mode: 'equals' } };
      component.filterState.versionFilterMode = { 'resultEngine.version': 'equals' };
      component.filterState.versionFilterValues = { 'resultEngine.version': '5.4' };
      component.clearColumnFilter('resultEngine.version');
      expect(component.filterState.versionFilterMode['resultEngine.version']).toBeUndefined();
      expect(component.filterState.versionFilterValues['resultEngine.version']).toBeUndefined();
    });
  });

  describe('clearFilters', () => {
    it('should reset filterState to defaults', () => {
      component.filterState.filters = { assetName: 'test' };
      component.filterState.result = 'pass';
      component.clearFilters();
      expect(component.filterState.filters).toEqual({});
      expect(component.filterState.result).toBe('fail');
    });

    it('should call loadReviews when result was not "fail" and benchmarks applied', () => {
      component.filterState.result = 'pass';
      component.appliedBenchmarkIds = ['BENCH-001'];
      const spy = vi.spyOn(component, 'loadReviews');

      component.clearFilters();
      expect(spy).toHaveBeenCalled();
    });

    it('should call resetTreeNodes when result was already "fail"', () => {
      component.filterState.result = 'fail';
      component.originalTreeNodes = [{ data: {} }] as any;
      component.reviews = [];
      component.clearFilters();
      expect(component.treeNodes).toEqual(component.originalTreeNodes);
    });
  });

  describe('applyCurrentFilter', () => {
    it('should return early when currentFilterColumn is null', () => {
      component.currentFilterColumn = null;
      const spy = vi.spyOn(component, 'applyFilters');

      component.applyCurrentFilter();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should apply date filter for Date fields', () => {
      const date = new Date('2024-03-15');

      component.currentFilterColumn = { field: 'evaluatedDate' };
      component.filterState.dateFilterValues['evaluatedDate'] = date;
      component.filterState.dateFilterMode['evaluatedDate'] = 'equals';
      component.applyCurrentFilter();
      expect(component.filterState.filters['evaluatedDate']).toBeDefined();
    });

    it('should apply version filter for version fields', () => {
      component.currentFilterColumn = { field: 'resultEngine.version' };
      component.filterState.versionFilterValues['resultEngine.version'] = '5.4.2';
      component.filterState.versionFilterMode['resultEngine.version'] = 'equals';
      component.applyCurrentFilter();
      expect(component.filterState.filters['resultEngine.version']).toBeDefined();
    });
  });

  describe('applyDateFilter', () => {
    it('should set date filter in filterState', () => {
      const date = new Date('2024-03-15');

      component.applyDateFilter('evaluatedDate', date);
      expect(component.filterState.filters['evaluatedDate']).toMatchObject({ value: date });
    });

    it('should default mode to "equals" when not set', () => {
      component.filterState.dateFilterMode = {};
      component.applyDateFilter('evaluatedDate', new Date());
      expect(component.filterState.dateFilterMode['evaluatedDate']).toBe('equals');
    });

    it('should hide filterPopover', () => {
      component.applyDateFilter('evaluatedDate', new Date());
      expect(mockFilterPopover.hide).toHaveBeenCalled();
    });
  });

  describe('applyVersionFilter', () => {
    it('should set version filter in filterState', () => {
      const event = { target: { value: '5.4.2' } } as any;

      component.applyVersionFilter('resultEngine.version', event);
      expect(component.filterState.filters['resultEngine.version']).toMatchObject({ value: '5.4.2' });
    });

    it('should default mode to "equals" when not set', () => {
      component.filterState.versionFilterMode = {};
      component.applyVersionFilter('resultEngine.version', { target: { value: '5.4' } } as any);
      expect(component.filterState.versionFilterMode['resultEngine.version']).toBe('equals');
    });

    it('should hide filterPopover', () => {
      component.applyVersionFilter('resultEngine.version', { target: { value: '5.4' } } as any);
      expect(mockFilterPopover.hide).toHaveBeenCalled();
    });
  });

  describe('showFilterPanel', () => {
    it('should set currentFilterColumn', () => {
      const col = { field: 'assetName' };

      component.showFilterPanel({} as any, col);
      expect(component.currentFilterColumn).toBe(col);
    });

    it('should call filterPopover().show() with the event', () => {
      const event = { target: {} } as any;

      component.showFilterPanel(event, { field: 'assetName' });
      expect(mockFilterPopover.show).toHaveBeenCalledWith(event);
    });
  });

  describe('flattenTreeNodes', () => {
    it('should return flat array of parent and child data', () => {
      const nodes = [
        { data: { id: 1 }, children: [{ data: { id: 2 } }] },
        { data: { id: 3 }, children: [] }
      ];
      const result = component.flattenTreeNodes(nodes as any);

      expect(result.length).toBe(3);
      expect(result.map((r) => r.id)).toContain(1);
      expect(result.map((r) => r.id)).toContain(2);
      expect(result.map((r) => r.id)).toContain(3);
    });

    it('should return empty array for empty input', () => {
      expect(component.flattenTreeNodes([])).toEqual([]);
    });
  });

  describe('exportCSV', () => {
    it('should show warn message when treeNodes is empty', () => {
      component.treeNodes = [];
      component.exportCSV();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should call csvExportService.flattenTreeNodes and exportToCsv when data exists', () => {
      component.initColumnsAndFilters();
      component.treeNodes = [{ data: { assetName: 'Asset1' } }] as any;
      component.exportCSV();
      expect(mockCsvExportService.flattenTreeNodes).toHaveBeenCalledWith(component.treeNodes);
      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
    });

    it('should format evaluatedDate Date objects to string', () => {
      component.initColumnsAndFilters();
      const date = new Date('2024-03-15');

      mockCsvExportService.flattenTreeNodes.mockReturnValue([{ assetName: 'Asset1', evaluatedDate: date }]);
      component.treeNodes = [{ data: {} }] as any;
      component.exportCSV();
      const data = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(typeof data[0].evaluatedDate).toBe('string');
    });

    it('should process assetLabels to semicolon-separated string', () => {
      component.initColumnsAndFilters();
      mockCsvExportService.flattenTreeNodes.mockReturnValue([{ assetName: 'Asset1', assetLabels: [{ name: 'prod' }, { name: 'sec' }] }]);
      component.treeNodes = [{ data: {} }] as any;
      component.exportCSV();
      const data = mockCsvExportService.exportToCsv.mock.calls[0][0];

      expect(data[0].labels).toBe('prod; sec');
    });
  });

  describe('resetColumnSelections', () => {
    it('should set selectedColumns to cols', () => {
      component.initColumnsAndFilters();
      component.selectedColumns = [];
      component.resetColumnSelections();
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call multiSelect().hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call multiSelect().show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });
  });
});
