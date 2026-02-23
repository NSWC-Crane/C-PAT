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
import { SimpleChanges, SimpleChange, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { Router } from '@angular/router';
import { PoamMainchartComponent } from './poam-mainchart.component';

function createMockPoam(overrides: any = {}) {
  return {
    poamId: 1,
    collectionId: 1,
    vulnerabilityId: 'V-12345',
    vulnerabilitySource: 'STIG',
    vulnerabilityTitle: 'Test Vulnerability',
    status: 'Draft',
    rawSeverity: 'CAT I - High',
    adjSeverity: 'High',
    ownerName: 'Test Owner',
    ownerId: 100,
    submitterName: 'Test Submitter',
    submitterId: 200,
    submittedDate: '2025-01-15T00:00:00.000Z',
    scheduledCompletionDate: '2025-06-15T00:00:00.000Z',
    extensionDays: 0,
    extensionDeadline: null,
    lastUpdated: '2025-01-20T10:30:00.000Z',
    taskOrderNumber: 'TO-001',
    assignedTeams: [],
    associatedVulnerabilities: [],
    labels: [],
    ...overrides
  };
}

describe('PoamMainchartComponent', () => {
  let component: PoamMainchartComponent;
  let fixture: ComponentFixture<PoamMainchartComponent>;
  let mockRouter: any;

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
    mockRouter = {
      navigateByUrl: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PoamMainchartComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamMainchartComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize chart data signals as null', () => {
      expect(component.statusChartData()).toBeNull();
      expect(component.labelChartData()).toBeNull();
      expect(component.severityChartData()).toBeNull();
      expect(component.scheduledCompletionChartData()).toBeNull();
      expect(component.taskOrderChartData()).toBeNull();
    });

    it('should initialize selected signals as null', () => {
      expect(component.selectedStatus()).toBeNull();
      expect(component.selectedLabel()).toBeNull();
      expect(component.selectedSeverity()).toBeNull();
      expect(component.selectedScheduledCompletion()).toBeNull();
    });

    it('should initialize selectedOptions with all null values', () => {
      const opts = component.selectedOptions();

      expect(opts.status).toBeNull();
      expect(opts.vulnerabilitySource).toBeNull();
      expect(opts.severity).toBeNull();
      expect(opts.scheduledCompletion).toBeNull();
      expect(opts.taskOrder).toBeNull();
      expect(opts.label).toBeNull();
    });

    it('should initialize poamsForChart and poamLabel as empty arrays', () => {
      expect(component.poamsForChart()).toEqual([]);
      expect(component.poamLabel()).toEqual([]);
    });

    it('should set default canvasHeight', () => {
      expect(component.canvasHeight).toBe('35rem');
    });

    it('should have chart options configured', () => {
      expect(component.chartOptions).toBeDefined();
      expect(component.chartOptions.maintainAspectRatio).toBe(false);
      expect(component.chartOptions.plugins.legend.position).toBe('bottom');
    });

    it('should define poamStatuses options', () => {
      expect(component.poamStatuses.length).toBe(9);
      expect(component.poamStatuses.map((s: any) => s.value)).toContain('Draft');
      expect(component.poamStatuses.map((s: any) => s.value)).toContain('Approved');
      expect(component.poamStatuses.map((s: any) => s.value)).toContain('Closed');
    });

    it('should define poamSeverities options', () => {
      expect(component.poamSeverities.length).toBe(5);
      expect(component.poamSeverities.map((s: any) => s.value)).toContain('CAT I - Critical');
      expect(component.poamSeverities.map((s: any) => s.value)).toContain('CAT III - Low');
    });

    it('should define poamScheduledCompletions options', () => {
      expect(component.poamScheduledCompletions.length).toBe(6);
      expect(component.poamScheduledCompletions.map((s: any) => s.value)).toContain('OVERDUE');
      expect(component.poamScheduledCompletions.map((s: any) => s.value)).toContain('> 365 Days');
    });

    it('should define poamTaskOrders options', () => {
      expect(component.poamTaskOrders).toEqual([
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' }
      ]);
    });
  });

  describe('filterOptions computed', () => {
    it('should return grouped filter options', () => {
      const options = component.filterOptions();
      const groupLabels = options.map((g: any) => g.label);

      expect(groupLabels).toContain('Status');
      expect(groupLabels).toContain('Vulnerability Source');
      expect(groupLabels).toContain('Task Order');
      expect(groupLabels).toContain('Severity');
      expect(groupLabels).toContain('Scheduled Completion');
      expect(groupLabels).toContain('Label');
    });

    it('should prefix status items with "status:"', () => {
      const options = component.filterOptions();
      const statusGroup = options.find((g: any) => g.label === 'Status');

      expect(statusGroup.items[0].value).toMatch(/^status:/);
    });

    it('should include label items from poamLabel signal', () => {
      component.poamLabel.set([{ label: 'Critical' }, { label: 'Infrastructure' }]);

      const options = component.filterOptions();
      const labelGroup = options.find((g: any) => g.label === 'Label');

      expect(labelGroup.items.length).toBe(2);
      expect(labelGroup.items[0].value).toBe('label:Critical');
    });
  });

  describe('initialPoamsData computed', () => {
    it('should return empty array when poams is empty', () => {
      component.poams = [];
      expect(component.initialPoamsData()).toEqual([]);
    });

    it('should return empty array when poams is undefined', () => {
      component.poams = undefined as any;
      expect(component.initialPoamsData()).toEqual([]);
    });

    it('should map poams to simplified data', () => {
      component.poams = [createMockPoam({ poamId: 1, vulnerabilityId: 'V-001', status: 'Draft', submittedDate: '2025-03-15T12:00:00.000Z', taskOrderNumber: 'TO-1' })];

      const result = component.initialPoamsData();

      expect(result).toEqual([
        {
          poamId: 1,
          vulnerabilityId: 'V-001',
          status: 'Draft',
          submittedDate: '2025-03-15',
          taskOrderNumber: 'TO-1'
        }
      ]);
    });

    it('should handle null submittedDate', () => {
      component.poams = [createMockPoam({ submittedDate: null })];

      const result = component.initialPoamsData();

      expect(result[0].submittedDate).toBe('');
    });
  });

  describe('filteredPoams computed', () => {
    it('should return all poams when no filters are active', () => {
      const poams = [createMockPoam({ poamId: 1 }), createMockPoam({ poamId: 2 })];

      component.poams = poams;

      expect(component.filteredPoams()).toEqual(poams);
    });

    it('should filter by status', () => {
      component.poams = [createMockPoam({ poamId: 1, status: 'Draft' }), createMockPoam({ poamId: 2, status: 'Approved' })];
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      const result = component.filteredPoams();

      expect(result.length).toBe(1);
      expect(result[0].poamId).toBe(1);
    });

    it('should filter by vulnerabilitySource', () => {
      component.poams = [createMockPoam({ poamId: 1, vulnerabilitySource: 'STIG' }), createMockPoam({ poamId: 2, vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner' })];
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: 'STIG',
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.filteredPoams().length).toBe(1);
      expect(component.filteredPoams()[0].poamId).toBe(1);
    });

    it('should filter by label', () => {
      component.poams = [createMockPoam({ poamId: 1, labels: [{ labelName: 'Critical' }] }), createMockPoam({ poamId: 2, labels: [{ labelName: 'Low' }] }), createMockPoam({ poamId: 3, labels: [] })];
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: 'Critical'
      });

      expect(component.filteredPoams().length).toBe(1);
      expect(component.filteredPoams()[0].poamId).toBe(1);
    });

    it('should filter by severity', () => {
      component.poams = [createMockPoam({ poamId: 1, rawSeverity: 'CAT I - High' }), createMockPoam({ poamId: 2, rawSeverity: 'CAT II - Medium' })];
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.filteredPoams().length).toBe(1);
      expect(component.filteredPoams()[0].poamId).toBe(1);
    });

    it('should filter by taskOrder Yes', () => {
      component.poams = [createMockPoam({ poamId: 1, taskOrderNumber: 'TO-001' }), createMockPoam({ poamId: 2, taskOrderNumber: '' }), createMockPoam({ poamId: 3, taskOrderNumber: null })];
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: 'Yes',
        label: null
      });

      expect(component.filteredPoams().length).toBe(1);
      expect(component.filteredPoams()[0].poamId).toBe(1);
    });

    it('should filter by taskOrder No', () => {
      component.poams = [createMockPoam({ poamId: 1, taskOrderNumber: 'TO-001' }), createMockPoam({ poamId: 2, taskOrderNumber: '' }), createMockPoam({ poamId: 3, taskOrderNumber: null })];
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: 'No',
        label: null
      });

      expect(component.filteredPoams().length).toBe(2);
    });

    it('should apply multiple filters simultaneously', () => {
      component.poams = [
        createMockPoam({ poamId: 1, status: 'Draft', rawSeverity: 'CAT I - High' }),
        createMockPoam({ poamId: 2, status: 'Draft', rawSeverity: 'CAT II - Medium' }),
        createMockPoam({ poamId: 3, status: 'Approved', rawSeverity: 'CAT I - High' })
      ];
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.filteredPoams().length).toBe(1);
      expect(component.filteredPoams()[0].poamId).toBe(1);
    });
  });

  describe('ngOnChanges', () => {
    it('should initialize component on first poams change with data', () => {
      const poams = [createMockPoam()];

      component.poams = poams;

      const changes: SimpleChanges = {
        poams: new SimpleChange(undefined, poams, true)
      };

      component.ngOnChanges(changes);

      expect(component.poamsForChart().length).toBe(1);
    });

    it('should not initialize when poams is empty', () => {
      component.poams = [];

      const changes: SimpleChanges = {
        poams: new SimpleChange(undefined, [], true)
      };

      component.ngOnChanges(changes);

      expect(component.poamsForChart()).toEqual([]);
    });

    it('should update charts on subsequent poams changes', () => {
      const poams1 = [createMockPoam({ poamId: 1 })];

      component.poams = poams1;
      component.ngOnChanges({
        poams: new SimpleChange(undefined, poams1, true)
      });

      const poams2 = [createMockPoam({ poamId: 1 }), createMockPoam({ poamId: 2 })];

      component.poams = poams2;
      component.ngOnChanges({
        poams: new SimpleChange(poams1, poams2, false)
      });

      expect(component.poamsForChart().length).toBeGreaterThan(0);
    });
  });

  describe('initializePoamLabel', () => {
    it('should collect unique labels from poams', () => {
      component.poams = [createMockPoam({ labels: [{ labelName: 'Critical' }, { labelName: 'High' }] }), createMockPoam({ labels: [{ labelName: 'Critical' }, { labelName: 'Low' }] })];

      component.initializePoamLabel();

      const labels = component.poamLabel().map((l: any) => l.label);

      expect(labels).toContain('Critical');
      expect(labels).toContain('High');
      expect(labels).toContain('Low');
      expect(labels.length).toBe(3);
    });

    it('should handle poams with no labels', () => {
      component.poams = [createMockPoam({ labels: [] }), createMockPoam({ labels: null })];

      component.initializePoamLabel();

      expect(component.poamLabel()).toEqual([]);
    });

    it('should not duplicate labels on second call', () => {
      component.poams = [createMockPoam({ labels: [{ labelName: 'Critical' }] })];

      component.initializePoamLabel();
      component.initializePoamLabel();

      expect(component.poamLabel().length).toBe(1);
    });
  });

  describe('addPoam', () => {
    it('should navigate to ADDPOAM route', () => {
      component.addPoam();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/ADDPOAM');
    });
  });

  describe('onSelectPoam', () => {
    it('should navigate to selected poam details', () => {
      component.poamsForChart.set([{ poamId: 42, vulnerabilityId: 'V-001', status: 'Draft', submittedDate: '', taskOrderNumber: '' }]);

      component.onSelectPoam({ value: 42 });

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    it('should log error when poam is not found', () => {
      component.poamsForChart.set([]);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.onSelectPoam({ value: 999 });

      expect(consoleSpy).toHaveBeenCalledWith('POAM not found');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('onGroupSelect', () => {
    it('should parse selected values and update selectedOptions', () => {
      const event = { value: ['status:Draft', 'severity:CAT I - High'] };

      component.onGroupSelect(event as any);

      const opts = component.selectedOptions();

      expect(opts.status).toBe('Draft');
      expect(opts.severity).toBe('CAT I - High');
      expect(opts.vulnerabilitySource).toBeNull();
    });

    it('should update selectedOptionsValues model', () => {
      const event = { value: ['status:Approved'] };

      component.onGroupSelect(event as any);

      expect(component.selectedOptionsValues()).toEqual(['status:Approved']);
    });

    it('should reset options not present in selection', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      component.onGroupSelect({ value: ['status:Approved'] } as any);

      const opts = component.selectedOptions();

      expect(opts.status).toBe('Approved');
      expect(opts.severity).toBeNull();
    });

    it('should handle empty selection', () => {
      component.onGroupSelect({ value: [] } as any);

      const opts = component.selectedOptions();

      expect(Object.values(opts).every((v) => v === null)).toBe(true);
      expect(component.selectedOptionsValues()).toEqual([]);
    });
  });

  describe('isOptionDisabled', () => {
    it('should return false when no selection for the group', () => {
      expect(component.isOptionDisabled('status', 'Draft')).toBe(false);
    });

    it('should return false when the option matches the selected value', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.isOptionDisabled('status', 'Draft')).toBe(false);
    });

    it('should return true when a different value is selected for the group', () => {
      component.selectedOptions.set({
        status: 'Approved',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.isOptionDisabled('status', 'Draft')).toBe(true);
    });
  });

  describe('resetChartFilters', () => {
    it('should reset all selectedOptions to null', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: 'STIG',
        severity: 'CAT I - High',
        scheduledCompletion: 'OVERDUE',
        taskOrder: 'Yes',
        label: 'Critical'
      });

      component.resetChartFilters();

      const opts = component.selectedOptions();

      expect(Object.values(opts).every((v) => v === null)).toBe(true);
    });

    it('should clear selectedOptionsValues', () => {
      component.selectedOptionsValues.set(['status:Draft']);

      component.resetChartFilters();

      expect(component.selectedOptionsValues()).toEqual([]);
    });
  });

  describe('getScheduledCompletionLabel', () => {
    it('should return OVERDUE for negative days', () => {
      expect(component.getScheduledCompletionLabel(-1)).toBe('OVERDUE');
      expect(component.getScheduledCompletionLabel(-100)).toBe('OVERDUE');
    });

    it('should return "< 30 Days" for 0-30 days', () => {
      expect(component.getScheduledCompletionLabel(0)).toBe('< 30 Days');
      expect(component.getScheduledCompletionLabel(15)).toBe('< 30 Days');
      expect(component.getScheduledCompletionLabel(30)).toBe('< 30 Days');
    });

    it('should return "30-60 Days" for 31-60 days', () => {
      expect(component.getScheduledCompletionLabel(31)).toBe('30-60 Days');
      expect(component.getScheduledCompletionLabel(60)).toBe('30-60 Days');
    });

    it('should return "60-90 Days" for 61-90 days', () => {
      expect(component.getScheduledCompletionLabel(61)).toBe('60-90 Days');
      expect(component.getScheduledCompletionLabel(90)).toBe('60-90 Days');
    });

    it('should return "90-180 Days" for 91-180 days', () => {
      expect(component.getScheduledCompletionLabel(91)).toBe('90-180 Days');
      expect(component.getScheduledCompletionLabel(180)).toBe('90-180 Days');
    });

    it('should return "> 365 Days" for more than 180 days', () => {
      expect(component.getScheduledCompletionLabel(181)).toBe('> 365 Days');
      expect(component.getScheduledCompletionLabel(500)).toBe('> 365 Days');
    });
  });

  describe('calculateDaysDifference', () => {
    it('should use extensionDeadline when provided', () => {
      const futureDate = new Date();

      futureDate.setDate(futureDate.getDate() + 10);

      const result = component.calculateDaysDifference('2020-01-01', 0, futureDate);

      expect(result).toBeGreaterThanOrEqual(9);
      expect(result).toBeLessThanOrEqual(11);
    });

    it('should add extensionDays to scheduledCompletionDate when no extensionDeadline', () => {
      const today = new Date();
      const baseDateStr = today.toISOString();

      const result = component.calculateDaysDifference(baseDateStr, 30, null);

      expect(result).toBeGreaterThanOrEqual(29);
      expect(result).toBeLessThanOrEqual(31);
    });

    it('should return negative for past dates', () => {
      const pastDate = new Date();

      pastDate.setDate(pastDate.getDate() - 10);

      const result = component.calculateDaysDifference(pastDate.toISOString(), 0, null);

      expect(result).toBeLessThan(0);
    });
  });

  describe('getChartSubtitle', () => {
    it('should return empty string when no filters are active', () => {
      expect(component.getChartSubtitle()).toBe('');
    });

    it('should include status filter in subtitle', () => {
      component.selectedOptions.set({
        status: 'Approved',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      expect(component.getChartSubtitle()).toBe('Status: Approved');
    });

    it('should join multiple filters with commas', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      const subtitle = component.getChartSubtitle();

      expect(subtitle).toContain('Status: Draft');
      expect(subtitle).toContain('Severity: CAT I - High');
      expect(subtitle).toContain(', ');
    });

    it('should include all active filters', () => {
      component.selectedOptions.set({
        status: 'Approved',
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: 'OVERDUE',
        taskOrder: 'Yes',
        label: 'Critical'
      });

      const subtitle = component.getChartSubtitle();

      expect(subtitle).toContain('Status: Approved');
      expect(subtitle).toContain('Severity: CAT I - High');
      expect(subtitle).toContain('Scheduled Completion: OVERDUE');
      expect(subtitle).toContain('Task Order: Yes');
      expect(subtitle).toContain('Label: Critical');
    });
  });

  describe('generateChartDataForStatus', () => {
    it('should count poams by status', () => {
      const poams = [createMockPoam({ status: 'Draft' }), createMockPoam({ status: 'Draft' }), createMockPoam({ status: 'Approved' })];

      const result = (component as any).generateChartDataForStatus(poams);

      const draft = result.find((r: any) => r.status === 'Draft');
      const approved = result.find((r: any) => r.status === 'Approved');

      expect(draft.statusCount).toBe(2);
      expect(approved.statusCount).toBe(1);
    });

    it('should return only selected status when filter is active', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      const poams = [createMockPoam({ status: 'Draft' }), createMockPoam({ status: 'Approved' })];

      const result = (component as any).generateChartDataForStatus(poams);

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('Draft');
    });

    it('should return 0 count for selected status not found in filtered poams', () => {
      component.selectedOptions.set({
        status: 'Rejected',
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      const result = (component as any).generateChartDataForStatus([createMockPoam({ status: 'Draft' })]);

      expect(result[0].statusCount).toBe(0);
    });
  });

  describe('generateChartDataForLabel', () => {
    it('should count poams by label', () => {
      const poams = [createMockPoam({ labels: [{ labelName: 'Critical' }, { labelName: 'Network' }] }), createMockPoam({ labels: [{ labelName: 'Critical' }] }), createMockPoam({ labels: [] })];

      const result = (component as any).generateChartDataForLabel(poams);

      const critical = result.find((r: any) => r.label === 'Critical');
      const network = result.find((r: any) => r.label === 'Network');

      expect(critical.labelCount).toBe(2);
      expect(network.labelCount).toBe(1);
    });

    it('should return only selected label when filter is active', () => {
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: null,
        scheduledCompletion: null,
        taskOrder: null,
        label: 'Critical'
      });

      const poams = [createMockPoam({ labels: [{ labelName: 'Critical' }] }), createMockPoam({ labels: [{ labelName: 'Network' }] })];

      const result = (component as any).generateChartDataForLabel(poams);

      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Critical');
    });

    it('should handle poams with no labels', () => {
      const result = (component as any).generateChartDataForLabel([createMockPoam({ labels: [] }), createMockPoam({ labels: null })]);

      expect(result).toEqual([]);
    });
  });

  describe('generateChartDataForSeverity', () => {
    it('should count poams by rawSeverity', () => {
      const poams = [createMockPoam({ rawSeverity: 'CAT I - High' }), createMockPoam({ rawSeverity: 'CAT I - High' }), createMockPoam({ rawSeverity: 'CAT II - Medium' })];

      const result = component.generateChartDataForSeverity(poams);

      const catI = result.find((r: any) => r.severity === 'CAT I - High');
      const catII = result.find((r: any) => r.severity === 'CAT II - Medium');

      expect(catI.severityCount).toBe(2);
      expect(catII.severityCount).toBe(1);
    });

    it('should return only selected severity when filter is active', () => {
      component.selectedOptions.set({
        status: null,
        vulnerabilitySource: null,
        severity: 'CAT I - High',
        scheduledCompletion: null,
        taskOrder: null,
        label: null
      });

      const result = component.generateChartDataForSeverity([createMockPoam({ rawSeverity: 'CAT I - High' }), createMockPoam({ rawSeverity: 'CAT II - Medium' })]);

      expect(result.length).toBe(1);
      expect(result[0].severity).toBe('CAT I - High');
    });
  });

  describe('generateChartDataForScheduledCompletion', () => {
    it('should categorize poams by completion timeframe', () => {
      const pastDate = new Date();

      pastDate.setDate(pastDate.getDate() - 10);

      const soon = new Date();

      soon.setDate(soon.getDate() + 15);

      const poams = [createMockPoam({ scheduledCompletionDate: pastDate.toISOString(), extensionDays: 0, extensionDeadline: null }), createMockPoam({ scheduledCompletionDate: soon.toISOString(), extensionDays: 0, extensionDeadline: null })];

      const result = component.generateChartDataForScheduledCompletion(poams);

      const overdue = result.find((r: any) => r.scheduledCompletion === 'OVERDUE');
      const under30 = result.find((r: any) => r.scheduledCompletion === '< 30 Days');

      expect(overdue?.scheduledCompletionCount).toBe(1);
      expect(under30?.scheduledCompletionCount).toBe(1);
    });
  });

  describe('generateChartDataForTaskOrder', () => {
    it('should count poams with and without task orders', () => {
      const poams = [createMockPoam({ taskOrderNumber: 'TO-001' }), createMockPoam({ taskOrderNumber: '' }), createMockPoam({ taskOrderNumber: null })];

      const result = component.generateChartDataForTaskOrder(poams);

      expect(result[0]).toEqual({ hasTaskOrder: true, count: 1 });
      expect(result[1]).toEqual({ hasTaskOrder: false, count: 2 });
    });

    it('should return zeros for empty input', () => {
      const result = component.generateChartDataForTaskOrder([]);

      expect(result[0].count).toBe(0);
      expect(result[1].count).toBe(0);
    });
  });

  describe('exportChart', () => {
    it('should log error for invalid chart type', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.exportChart('invalid');

      expect(consoleSpy).toHaveBeenCalledWith('Invalid chart type');
      consoleSpy.mockRestore();
    });

    it('should log error when chart reference is not found', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      Object.defineProperty(component, 'statusChartRef', { value: signal(undefined) });
      component.exportChart('status');

      expect(consoleSpy).toHaveBeenCalledWith('Chart reference not found');
      consoleSpy.mockRestore();
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset all signals and state', () => {
      component.poamsForChart.set([{ poamId: 1 }]);
      component.poamLabel.set([{ label: 'Test' }]);
      component.statusChartData.set({ labels: [''], datasets: [] });

      component.ngOnDestroy();

      expect(component.poamsForChart()).toEqual([]);
      expect(component.poamLabel()).toEqual([]);
      expect(component.selectedPoamId()).toBeNull();
      expect(component.statusChartData()).toBeNull();
      expect(component.labelChartData()).toBeNull();
      expect(component.severityChartData()).toBeNull();
      expect(component.scheduledCompletionChartData()).toBeNull();
      expect(component.taskOrderChartData()).toBeNull();
    });

    it('should reset selectedOptions to all null', () => {
      component.selectedOptions.set({
        status: 'Draft',
        vulnerabilitySource: 'STIG',
        severity: 'CAT I - High',
        scheduledCompletion: 'OVERDUE',
        taskOrder: 'Yes',
        label: 'Critical'
      });

      component.ngOnDestroy();

      const opts = component.selectedOptions();

      expect(Object.values(opts).every((v) => v === null)).toBe(true);
    });

    it('should clear selectedOptionsValues', () => {
      component.selectedOptionsValues.set(['status:Draft']);

      component.ngOnDestroy();

      expect(component.selectedOptionsValues()).toEqual([]);
    });
  });
});
