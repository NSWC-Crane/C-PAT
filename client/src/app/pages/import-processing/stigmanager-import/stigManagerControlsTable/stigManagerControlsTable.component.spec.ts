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
import { SimpleChange } from '@angular/core';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { STIGManagerControlsTableComponent } from './stigManagerControlsTable.component';
import { SharedService } from '../../../../common/services/shared.service';
import { PoamService } from '../../../poam-processing/poams.service';
import { createMockMessageService, createMockRouter } from '../../../../../testing/mocks/service-mocks';

const mockRawFindings = [
  {
    cci: 'CCI-000001',
    definition: 'Test definition',
    apAcronym: 'AC',
    assetCount: 5,
    rules: [{ title: 'Rule Title One', ruleId: 'SV-001r1', version: '1', severity: 'high' }],
    groups: [{ title: 'Group One', groupId: 'V-001', severity: 'high' }],
    stigs: [{ ruleCount: 1, benchmarkId: 'BENCH-001', revisionStr: 'V1R1', benchmarkDate: '2024-01-01', revisionPinned: false }],
    ccis: [{ cci: 'CCI-000001', control: 'AC-1', apAcronym: 'AC', definition: 'Test' }]
  },
  {
    cci: 'CCI-000002',
    definition: 'Test definition 2',
    apAcronym: 'CM',
    assetCount: 3,
    rules: [{ title: 'Rule Title Two', ruleId: 'SV-002r1', version: '1', severity: 'medium' }],
    groups: [{ title: 'Group Two', groupId: 'V-002', severity: 'medium' }],
    stigs: [{ ruleCount: 1, benchmarkId: 'BENCH-002', revisionStr: 'V1R1', benchmarkDate: '2024-01-01', revisionPinned: false }],
    ccis: [{ cci: 'CCI-000002', control: 'CM-1', apAcronym: 'CM', definition: 'Test 2' }]
  }
];

const mockPoamVulns = [
  { vulnerabilityId: 'V-001', poamId: 10, status: 'Approved', parentStatus: null, parentPoamId: null },
  { vulnerabilityId: 'V-003', poamId: 20, status: 'Associated', parentStatus: 'Draft', parentPoamId: 5 }
];

const mockRuleData = {
  title: 'Rule Title',
  detail: { vulnDiscussion: 'Discussion text' },
  check: { content: 'Check content' },
  fix: { text: 'Fix text' }
};

describe('STIGManagerControlsTableComponent', () => {
  let component: STIGManagerControlsTableComponent;
  let fixture: ComponentFixture<STIGManagerControlsTableComponent>;
  let mockSharedService: any;
  let mockPoamService: any;
  let mockMessageService: any;
  let mockRouter: any;
  let mockControlsTable: any;
  let mockFindingsTable: any;

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
    mockControlsTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn(), filteredValue: null };
    mockFindingsTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn(), filteredValue: null };

    mockSharedService = {
      getFindingsByCCIFromSTIGMAN: vi.fn().mockReturnValue(of([...mockRawFindings])),
      getRuleDataFromSTIGMAN: vi.fn().mockReturnValue(of(mockRuleData))
    };

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of([...mockPoamVulns]))
    };

    mockMessageService = createMockMessageService();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [STIGManagerControlsTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(STIGManagerControlsTableComponent);
    component = fixture.componentInstance;
    component.stigmanCollectionId = 42;
    component.selectedCollection = 7;
    (component as any).controlsTable = () => mockControlsTable;
    (component as any).findingsTable = () => mockFindingsTable;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default controlSummaries to empty array', () => {
      expect(component.controlSummaries).toEqual([]);
    });

    it('should default controlFindings to empty array', () => {
      expect(component.controlFindings).toEqual([]);
    });

    it('should default existingPoams to empty array', () => {
      expect(component.existingPoams).toEqual([]);
    });

    it('should default selectedControl to null', () => {
      expect(component.selectedControl).toBeNull();
    });

    it('should default viewMode to "summary"', () => {
      expect(component.viewMode).toBe('summary');
    });

    it('should default loadingControls to true', () => {
      expect(component.loadingControls).toBe(true);
    });

    it('should default loadingFindings to false', () => {
      expect(component.loadingFindings).toBe(false);
    });

    it('should default controlsCount to 0', () => {
      expect(component.controlsCount).toBe(0);
    });

    it('should default findingsCount to 0', () => {
      expect(component.findingsCount).toBe(0);
    });

    it('should have 8 controlColumns defined', () => {
      expect(component.controlColumns.length).toBe(8);
    });

    it('should have 8 findingColumns defined', () => {
      expect(component.findingColumns.length).toBe(8);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadControlsData when stigmanCollectionId is set', () => {
      const spy = vi.spyOn(component as any, 'loadControlsData');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call loadControlsData when stigmanCollectionId is 0', () => {
      component.stigmanCollectionId = 0;
      const spy = vi.spyOn(component as any, 'loadControlsData');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should populate controlSummaries after init', () => {
      component.ngOnInit();
      expect(component.controlSummaries.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnChanges', () => {
    it('should call loadControlsData when stigmanCollectionId changes after first change', () => {
      const spy = vi.spyOn(component as any, 'loadControlsData');

      component.ngOnChanges({
        stigmanCollectionId: new SimpleChange(1, 99, false)
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should not call loadControlsData on firstChange', () => {
      const spy = vi.spyOn(component as any, 'loadControlsData');

      component.ngOnChanges({
        stigmanCollectionId: new SimpleChange(null, 42, true)
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call loadControlsData when unrelated input changes', () => {
      const spy = vi.spyOn(component as any, 'loadControlsData');

      component.ngOnChanges({
        selectedCollection: new SimpleChange(1, 2, false)
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('loadControlsData (private, tested via ngOnInit)', () => {
    it('should call getFindingsByCCIFromSTIGMAN with stigmanCollectionId', () => {
      component.ngOnInit();
      expect(mockSharedService.getFindingsByCCIFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should show warn message when no findings returned', () => {
      mockSharedService.getFindingsByCCIFromSTIGMAN.mockReturnValue(of([]));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should show warn message when findings is null', () => {
      mockSharedService.getFindingsByCCIFromSTIGMAN.mockReturnValue(of(null));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });

    it('should set loadingControls to false when no findings', () => {
      mockSharedService.getFindingsByCCIFromSTIGMAN.mockReturnValue(of([]));
      component.ngOnInit();
      expect(component.loadingControls).toBe(false);
    });

    it('should show error message on service failure', () => {
      mockSharedService.getFindingsByCCIFromSTIGMAN.mockReturnValue(throwError(() => new Error('Network')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set loadingControls to false on error', () => {
      mockSharedService.getFindingsByCCIFromSTIGMAN.mockReturnValue(throwError(() => new Error('Network')));
      component.ngOnInit();
      expect(component.loadingControls).toBe(false);
    });
  });

  describe('processControlSummaries (private, tested via ngOnInit)', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should create one summary per unique control', () => {
      expect(component.controlSummaries.length).toBe(2);
    });

    it('should set control field on each summary', () => {
      const controls = component.controlSummaries.map((s) => s.control);

      expect(controls).toContain('AC-1');
      expect(controls).toContain('CM-1');
    });

    it('should count findingCount correctly', () => {
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1');

      expect(ac1?.findingCount).toBe(1);
    });

    it('should count highCount correctly', () => {
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1');

      expect(ac1?.highCount).toBe(1);
    });

    it('should count mediumCount correctly', () => {
      const cm1 = component.controlSummaries.find((s) => s.control === 'CM-1');

      expect(cm1?.mediumCount).toBe(1);
    });

    it('should sum assetCount from findings', () => {
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1');

      expect(ac1?.assetCount).toBe(5);
    });

    it('should emit controlsCountChange with count', () => {
      const emitSpy = vi.spyOn(component.controlsCountChange, 'emit');

      component.ngOnInit();
      expect(emitSpy).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should set controlsCount', () => {
      expect(component.controlsCount).toBe(2);
    });

    it('should sort summaries by control name', () => {
      const controls = component.controlSummaries.map((s) => s.control);

      expect(controls[0]).toBe('AC-1');
      expect(controls[1]).toBe('CM-1');
    });
  });

  describe('updateControlPoamPercentages (private, tested via ngOnInit)', () => {
    it('should call getVulnerabilityIdsWithPoamByCollection when selectedCollection is set', () => {
      component.ngOnInit();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalledWith(7);
    });

    it('should not call getVulnerabilityIdsWithPoamByCollection when selectedCollection is 0', () => {
      component.selectedCollection = 0;
      component.ngOnInit();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).not.toHaveBeenCalled();
    });

    it('should set loadingControls to false after success', () => {
      component.ngOnInit();
      expect(component.loadingControls).toBe(false);
    });

    it('should calculate poamPercentage for summaries with matching groupIds', () => {
      component.ngOnInit();
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1');

      expect(ac1?.poamPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should show error message when getVulnerabilityIdsWithPoamByCollection fails', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('POAM error')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should set loadingControls to false on poam service error', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('POAM error')));
      component.ngOnInit();
      expect(component.loadingControls).toBe(false);
    });

    it('should exclude draft/rejected poams from percentage calculation', () => {
      const poamsWithDraft = [
        { vulnerabilityId: 'V-001', poamId: 10, status: 'Draft', parentStatus: null },
        { vulnerabilityId: 'V-002', poamId: 11, status: 'Approved', parentStatus: null }
      ];

      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of(poamsWithDraft));
      component.ngOnInit();
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1');

      expect(ac1?.poamPercentage).toBe(0);
    });
  });

  describe('selectControl', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set selectedControl', () => {
      const control = component.controlSummaries[0];

      component.selectControl(control);
      expect(component.selectedControl).toBe(control);
    });

    it('should set viewMode to "findings"', () => {
      component.selectControl(component.controlSummaries[0]);
      expect(component.viewMode).toBe('findings');
    });

    it('should load findings for the selected control', () => {
      component.selectControl(component.controlSummaries[0]);
      expect(component.controlFindings.length).toBeGreaterThan(0);
    });

    it('should set findingsCount after selecting control', () => {
      component.selectControl(component.controlSummaries[0]);
      expect(component.findingsCount).toBeGreaterThan(0);
    });
  });

  describe('loadFindingsForControl (private, tested via selectControl)', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should populate controlFindings with matching raw findings', () => {
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      expect(component.controlFindings.length).toBeGreaterThan(0);
    });

    it('should map severity using mapSeverity', () => {
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      const finding = component.controlFindings[0];

      expect(finding.severity).toBe('CAT I - High');
    });

    it('should set loadingFindings to false after load', () => {
      component.selectControl(component.controlSummaries[0]);
      expect(component.loadingFindings).toBe(false);
    });

    it('should call updateExistingPoams via getVulnerabilityIdsWithPoamByCollection', () => {
      component.selectControl(component.controlSummaries[0]);
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalled();
    });
  });

  describe('updateExistingPoams (private, tested via selectControl)', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set hasExistingPoam to true for matching vulnerability', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([{ vulnerabilityId: 'V-001', poamId: 10, status: 'Approved', parentStatus: null }]));
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      const finding = component.controlFindings.find((f) => f.groupId === 'V-001');

      expect(finding?.hasExistingPoam).toBe(true);
    });

    it('should set poamStatus to "No Existing POAM" when no match', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([]));
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      const finding = component.controlFindings[0];

      expect(finding?.poamStatus).toBe('No Existing POAM');
    });

    it('should set isAssociated when status is "Associated"', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of([{ vulnerabilityId: 'V-001', poamId: 20, status: 'Associated', parentStatus: 'Draft', parentPoamId: 5 }]));
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      const finding = component.controlFindings.find((f) => f.groupId === 'V-001');

      expect(finding?.isAssociated).toBe(true);
    });

    it('should not call poamService when selectedCollection is 0', () => {
      component.selectedCollection = 0;
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockClear();
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).not.toHaveBeenCalled();
    });

    it('should show error when getVulnerabilityIdsWithPoamByCollection fails during updateExistingPoams', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('Error')));
      const ac1 = component.controlSummaries.find((s) => s.control === 'AC-1')!;

      component.selectControl(ac1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('backToControlSummary', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.selectControl(component.controlSummaries[0]);
    });

    it('should set viewMode back to "summary"', () => {
      component.backToControlSummary();
      expect(component.viewMode).toBe('summary');
    });

    it('should set selectedControl to null', () => {
      component.backToControlSummary();
      expect(component.selectedControl).toBeNull();
    });

    it('should clear controlFindings', () => {
      component.backToControlSummary();
      expect(component.controlFindings).toEqual([]);
    });

    it('should reset findingsCount to 0', () => {
      component.backToControlSummary();
      expect(component.findingsCount).toBe(0);
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

    it('should return "green" for approved', () => {
      expect(component.getPoamStatusColor('Approved')).toBe('green');
    });

    it('should return "black" for closed', () => {
      expect(component.getPoamStatusColor('Closed')).toBe('black');
    });

    it('should return "gray" for unknown status', () => {
      expect(component.getPoamStatusColor('unknown')).toBe('gray');
    });

    it('should use parentStatus when status is "Associated"', () => {
      expect(component.getPoamStatusColor('Associated', 'Approved')).toBe('green');
    });

    it('should return "gray" when Associated has no parentStatus', () => {
      expect(component.getPoamStatusColor('Associated', undefined)).toBe('gray');
    });
  });

  describe('getPoamStatusIcon', () => {
    it('should return info-circle when isAssociated is true', () => {
      expect(component.getPoamStatusIcon('Approved', true)).toBe('pi pi-info-circle');
    });

    it('should return plus-circle for "no existing poam"', () => {
      expect(component.getPoamStatusIcon('No Existing POAM')).toBe('pi pi-plus-circle');
    });

    it('should return ban for expired', () => {
      expect(component.getPoamStatusIcon('Expired')).toBe('pi pi-ban');
    });

    it('should return ban for rejected', () => {
      expect(component.getPoamStatusIcon('Rejected')).toBe('pi pi-ban');
    });

    it('should return check-circle for approved', () => {
      expect(component.getPoamStatusIcon('Approved')).toBe('pi pi-check-circle');
    });

    it('should return check-circle for draft', () => {
      expect(component.getPoamStatusIcon('Draft')).toBe('pi pi-check-circle');
    });

    it('should return question-circle for unknown', () => {
      expect(component.getPoamStatusIcon('unknown')).toBe('pi pi-question-circle');
    });
  });

  describe('getPoamStatusTooltip', () => {
    it('should indicate no existing POAM when hasExistingPoam is false', () => {
      const tooltip = component.getPoamStatusTooltip(undefined, false);

      expect(tooltip).toContain('No Existing POAM');
    });

    it('should indicate unknown status when status is falsy and hasExistingPoam is true', () => {
      const tooltip = component.getPoamStatusTooltip(undefined, true);

      expect(tooltip).toContain('Unknown');
    });

    it('should include POAM status when hasExistingPoam and status provided', () => {
      const tooltip = component.getPoamStatusTooltip('Approved', true);

      expect(tooltip).toContain('Approved');
    });

    it('should indicate associated POAM when status is Associated', () => {
      const tooltip = component.getPoamStatusTooltip('Associated', true, 'Draft');

      expect(tooltip).toContain('associated');
      expect(tooltip).toContain('Draft');
    });
  });

  describe('addPoam', () => {
    it('should show error when rowData has no ruleId', () => {
      component.addPoam({ groupId: 'V-001', ruleId: '', ruleTitle: '', groupTitle: '', severity: '', assetCount: 0, control: '', apAcronym: '', benchmarkId: '', hasExistingPoam: false });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error when rowData has no groupId', () => {
      component.addPoam({ groupId: '', ruleId: 'SV-001r1', ruleTitle: '', groupTitle: '', severity: '', assetCount: 0, control: '', apAcronym: '', benchmarkId: '', hasExistingPoam: false });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should call getRuleDataFromSTIGMAN with ruleId', () => {
      component.addPoam({ groupId: 'V-001', ruleId: 'SV-001r1', ruleTitle: 'T', groupTitle: 'G', severity: 'CAT I - High', assetCount: 1, control: 'AC-1', apAcronym: 'AC', benchmarkId: 'BENCH', hasExistingPoam: false });
      expect(mockSharedService.getRuleDataFromSTIGMAN).toHaveBeenCalledWith('SV-001r1');
    });

    it('should navigate to ADDPOAM when no existing poam', () => {
      component.existingPoams = [];
      component.addPoam({ groupId: 'V-999', ruleId: 'SV-001r1', ruleTitle: 'T', groupTitle: 'G', severity: 'CAT I - High', assetCount: 1, control: 'AC-1', apAcronym: 'AC', benchmarkId: 'BENCH', hasExistingPoam: false });
      expect(mockRouter.navigate).toHaveBeenCalledWith([expect.stringContaining('ADDPOAM')], expect.objectContaining({ state: expect.objectContaining({ vulnerabilityId: 'V-999' }) }));
    });

    it('should navigate to existing poamId when poam exists', () => {
      component.existingPoams = [{ vulnerabilityId: 'V-001', poamId: 10 }];
      component.addPoam({ groupId: 'V-001', ruleId: 'SV-001r1', ruleTitle: 'T', groupTitle: 'G', severity: 'CAT I - High', assetCount: 1, control: 'AC-1', apAcronym: 'AC', benchmarkId: 'BENCH', hasExistingPoam: true });
      expect(mockRouter.navigate).toHaveBeenCalledWith([expect.stringContaining('10')], expect.any(Object));
    });

    it('should show error when getRuleDataFromSTIGMAN fails', () => {
      mockSharedService.getRuleDataFromSTIGMAN.mockReturnValue(throwError(() => new Error('Rule error')));
      component.addPoam({ groupId: 'V-001', ruleId: 'SV-001r1', ruleTitle: 'T', groupTitle: 'G', severity: 'CAT I - High', assetCount: 1, control: 'AC-1', apAcronym: 'AC', benchmarkId: 'BENCH', hasExistingPoam: false });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('filterControlsGlobal', () => {
    it('should call controlsTable().filterGlobal with input value', () => {
      const event = { target: { value: 'test' } } as any;

      component.filterControlsGlobal(event);
      expect(mockControlsTable.filterGlobal).toHaveBeenCalledWith('test', 'contains');
    });

    it('should handle missing target value gracefully', () => {
      const event = { target: null } as any;

      expect(() => component.filterControlsGlobal(event)).not.toThrow();
    });
  });

  describe('filterFindingsGlobal', () => {
    it('should call findingsTable().filterGlobal with input value', () => {
      const event = { target: { value: 'find' } } as any;

      component.filterFindingsGlobal(event);
      expect(mockFindingsTable.filterGlobal).toHaveBeenCalledWith('find', 'contains');
    });
  });

  describe('onControlsFilter', () => {
    it('should update controlsCount from filteredValue when present', () => {
      mockControlsTable.filteredValue = [{ control: 'AC-1' }, { control: 'CM-1' }];
      component.onControlsFilter({});
      expect(component.controlsCount).toBe(2);
    });

    it('should use controlSummaries.length when filteredValue is null', () => {
      component.controlSummaries = [{ control: 'AC-1' } as any, { control: 'CM-1' } as any];
      mockControlsTable.filteredValue = null;
      component.onControlsFilter({});
      expect(component.controlsCount).toBe(2);
    });

    it('should emit controlsCountChange', () => {
      const emitSpy = vi.spyOn(component.controlsCountChange, 'emit');

      component.onControlsFilter({});
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('onFindingsFilter', () => {
    it('should update findingsCount from filteredValue when present', () => {
      mockFindingsTable.filteredValue = [{ groupId: 'V-001' }];
      component.onFindingsFilter({});
      expect(component.findingsCount).toBe(1);
    });

    it('should use controlFindings.length when filteredValue is null', () => {
      component.controlFindings = [{ groupId: 'V-001' } as any];
      mockFindingsTable.filteredValue = null;
      component.onFindingsFilter({});
      expect(component.findingsCount).toBe(1);
    });
  });

  describe('clearControlsFilter', () => {
    it('should call controlsTable().clear()', () => {
      component.clearControlsFilter();
      expect(mockControlsTable.clear).toHaveBeenCalled();
    });
  });

  describe('clearFindingsFilter', () => {
    it('should call findingsTable().clear()', () => {
      component.clearFindingsFilter();
      expect(mockFindingsTable.clear).toHaveBeenCalled();
    });
  });

  describe('exportControlsCSV', () => {
    it('should call controlsTable().exportCSV()', () => {
      component.exportControlsCSV();
      expect(mockControlsTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('exportFindingsCSV', () => {
    it('should call findingsTable().exportCSV()', () => {
      component.exportFindingsCSV();
      expect(mockFindingsTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
