/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { LabelComponent } from './label.component';
import { LabelService } from '../label.service';
import { PoamService } from '../../poam-processing/poams.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { createMockMessageService, createMockDialogService } from '../../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockPoams = [
  { poamId: 1, vulnerabilityId: 'CVE-001', vulnerabilityTitle: 'Title One', rawSeverity: 'high' },
  { poamId: 2, vulnerabilityId: 'CVE-002', vulnerabilityTitle: 'Title Two', rawSeverity: 'medium' },
  { poamId: 3, vulnerabilityId: 'CVE-003', vulnerabilityTitle: 'Title Three', rawSeverity: 'low' }
];

describe('LabelComponent', () => {
  let component: LabelComponent;
  let fixture: ComponentFixture<LabelComponent>;
  let mockLabelService: any;
  let mockPoamService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let mockDialogService: any;
  let selectedCollectionSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    selectedCollectionSubject = new BehaviorSubject<any>(1);
    accessLevelSubject = new BehaviorSubject<number>(0);

    mockLabelService = {
      addLabel: vi.fn().mockReturnValue(of({ labelId: 10 })),
      updateLabel: vi.fn().mockReturnValue(of({ labelId: 5, labelName: 'Updated' })),
      deleteLabel: vi.fn().mockReturnValue(of({}))
    };

    mockPoamService = {
      getVulnerabilityIdsWithPoamByCollection: vi.fn().mockReturnValue(of(mockPoams)),
      getPoamsByLabel: vi.fn().mockReturnValue(of(mockPoams)),
      postPoamLabel: vi.fn().mockReturnValue(of({})),
      deletePoamLabel: vi.fn().mockReturnValue(of({}))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();
    mockDialogService = createMockDialogService();

    await TestBed.configureTestingModule({
      imports: [LabelComponent],
      providers: [
        { provide: LabelService, useValue: mockLabelService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: DialogService, useValue: mockDialogService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
    component.label = { labelId: '', labelName: '', description: '' };
    component.labels = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize errorMessage as empty string', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialize data as empty array', () => {
      expect(component.data).toEqual([]);
    });

    it('should initialize showLaborCategorySelect as false', () => {
      expect(component.showLaborCategorySelect).toBe(false);
    });

    it('should initialize displayPoams as empty array', () => {
      expect(component.displayPoams).toEqual([]);
    });

    it('should initialize loadingPoams as false', () => {
      expect(component.loadingPoams).toBe(false);
    });

    it('should initialize availablePoams as empty array', () => {
      expect(component.availablePoams).toEqual([]);
    });

    it('should initialize selectedPoams as empty array', () => {
      expect(component.selectedPoams).toEqual([]);
    });

    it('should initialize poamSuggestions as empty array', () => {
      expect(component.poamSuggestions).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedCollection', () => {
      component.ngOnInit();
      expect(component.selectedCollection).toBe(1);
    });

    it('should call loadAvailablePoams when collectionId is truthy', () => {
      const spy = vi.spyOn(component, 'loadAvailablePoams');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call loadAvailablePoams when collectionId is falsy', () => {
      selectedCollectionSubject.next(null);
      const spy = vi.spyOn(component, 'loadAvailablePoams');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should update selectedCollection when it changes', () => {
      component.ngOnInit();
      selectedCollectionSubject.next(7);
      expect(component.selectedCollection).toBe(7);
    });

    it('should subscribe to accessLevel$', () => {
      accessLevelSubject.next(2);
      component.ngOnInit();
      expect((component as any).accessLevel).toBe(2);
    });

    it('should update accessLevel when it changes', () => {
      component.ngOnInit();
      accessLevelSubject.next(3);
      expect((component as any).accessLevel).toBe(3);
    });
  });

  describe('ngOnChanges', () => {
    it('should clone label from currentValue', () => {
      const newLabel = { labelId: 5, labelName: 'Test', description: 'D' };
      const changes: SimpleChanges = { label: new SimpleChange(null, newLabel, true) };

      component.ngOnChanges(changes);
      expect(component.label).toEqual(newLabel);
      expect(component.label).not.toBe(newLabel);
    });

    it('should call loadPoamsByLabel when labelId is set and not ADDLABEL', () => {
      const spy = vi.spyOn(component, 'loadPoamsByLabel');
      const newLabel = { labelId: 5, labelName: 'Test', description: '' };
      const changes: SimpleChanges = { label: new SimpleChange(null, newLabel, true) };

      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalled();
    });

    it('should clear displayPoams when labelId is ADDLABEL', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      const newLabel = { labelId: 'ADDLABEL', labelName: 'New', description: '' };
      const changes: SimpleChanges = { label: new SimpleChange(null, newLabel, true) };

      component.ngOnChanges(changes);
      expect(component.displayPoams).toEqual([]);
    });

    it('should clear displayPoams when labelId is empty', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      const newLabel = { labelId: '', labelName: 'New', description: '' };
      const changes: SimpleChanges = { label: new SimpleChange(null, newLabel, true) };

      component.ngOnChanges(changes);
      expect(component.displayPoams).toEqual([]);
    });

    it('should do nothing when label change is absent', () => {
      const spy = vi.spyOn(component, 'loadPoamsByLabel');
      const changes: SimpleChanges = {};

      component.ngOnChanges(changes);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should do nothing when currentValue is null', () => {
      const spy = vi.spyOn(component, 'loadPoamsByLabel');
      const changes: SimpleChanges = { label: new SimpleChange({ labelId: 1 }, null, false) };

      component.ngOnChanges(changes);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('loadAvailablePoams', () => {
    it('should return early when selectedCollection is not set', () => {
      component.selectedCollection = null;
      component.loadAvailablePoams();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).not.toHaveBeenCalled();
    });

    it('should call poamService.getVulnerabilityIdsWithPoamByCollection with selectedCollection', () => {
      component.selectedCollection = 1;
      component.loadAvailablePoams();
      expect(mockPoamService.getVulnerabilityIdsWithPoamByCollection).toHaveBeenCalledWith(1);
    });

    it('should set availablePoams from response', () => {
      component.selectedCollection = 1;
      component.loadAvailablePoams();
      expect(component.availablePoams).toEqual(mockPoams);
    });

    it('should set availablePoams to empty array when response is null', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(of(null));
      component.selectedCollection = 1;
      component.loadAvailablePoams();
      expect(component.availablePoams).toEqual([]);
    });

    it('should show error message on service failure', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedCollection = 1;
      component.loadAvailablePoams();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail on failure', () => {
      mockPoamService.getVulnerabilityIdsWithPoamByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.selectedCollection = 1;
      component.loadAvailablePoams();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error loading available POAMs');
    });
  });

  describe('loadPoamsByLabel', () => {
    beforeEach(() => {
      component.label = { labelId: 5, labelName: 'Test', description: '' };
    });

    it('should clear displayPoams and return when labelId is ADDLABEL', () => {
      component.label = { labelId: 'ADDLABEL', labelName: 'New' };
      component.displayPoams = [{ poamId: 1 }];
      component.loadPoamsByLabel();
      expect(component.displayPoams).toEqual([]);
      expect(mockPoamService.getPoamsByLabel).not.toHaveBeenCalled();
    });

    it('should clear displayPoams and return when labelId is falsy', () => {
      component.label = { labelId: null };
      component.displayPoams = [{ poamId: 1 }];
      component.loadPoamsByLabel();
      expect(component.displayPoams).toEqual([]);
    });

    it('should set loadingPoams to true before fetch', () => {
      let capturedLoading: boolean | undefined;

      mockPoamService.getPoamsByLabel.mockImplementation(() => {
        capturedLoading = component.loadingPoams;

        return of(mockPoams);
      });
      component.loadPoamsByLabel();
      expect(capturedLoading).toBe(true);
    });

    it('should call poamService.getPoamsByLabel with labelId', () => {
      component.loadPoamsByLabel();
      expect(mockPoamService.getPoamsByLabel).toHaveBeenCalledWith(5);
    });

    it('should map response items with isNew: false', () => {
      component.loadPoamsByLabel();
      expect(component.displayPoams.every((p) => p.isNew === false)).toBe(true);
    });

    it('should spread original poam fields', () => {
      component.loadPoamsByLabel();
      expect(component.displayPoams[0].poamId).toBe(1);
      expect(component.displayPoams[0].vulnerabilityId).toBe('CVE-001');
    });

    it('should set loadingPoams to false after success', () => {
      component.loadPoamsByLabel();
      expect(component.loadingPoams).toBe(false);
    });

    it('should handle null response gracefully', () => {
      mockPoamService.getPoamsByLabel.mockReturnValue(of(null));
      component.loadPoamsByLabel();
      expect(component.displayPoams).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockPoamService.getPoamsByLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.loadPoamsByLabel();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should set loadingPoams to false on error', () => {
      mockPoamService.getPoamsByLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.loadPoamsByLabel();
      expect(component.loadingPoams).toBe(false);
    });

    it('should set displayPoams to empty on error', () => {
      mockPoamService.getPoamsByLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.loadPoamsByLabel();
      expect(component.displayPoams).toEqual([]);
    });

    it('should include error detail on failure', () => {
      mockPoamService.getPoamsByLabel.mockReturnValue(throwError(() => new Error('load fail')));
      component.loadPoamsByLabel();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error loading POAMs');
    });
  });

  describe('searchPoams', () => {
    beforeEach(() => {
      component.availablePoams = mockPoams;
      component.displayPoams = [];
    });

    it('should filter by poamId string match', () => {
      component.searchPoams({ query: '1' } as any);
      expect(component.poamSuggestions.some((p) => p.poamId === 1)).toBe(true);
    });

    it('should filter by vulnerabilityId match', () => {
      component.searchPoams({ query: 'CVE-002' } as any);
      expect(component.poamSuggestions.some((p) => p.poamId === 2)).toBe(true);
    });

    it('should filter by vulnerabilityTitle match', () => {
      component.searchPoams({ query: 'title three' } as any);
      expect(component.poamSuggestions.some((p) => p.poamId === 3)).toBe(true);
    });

    it('should exclude already added poams (not isNew)', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      component.searchPoams({ query: '1' } as any);
      expect(component.poamSuggestions.some((p) => p.poamId === 1)).toBe(false);
    });

    it('should not exclude new rows from suggestions', () => {
      component.displayPoams = [{ poamId: 1, isNew: true }];
      component.searchPoams({ query: '1' } as any);
      expect(component.poamSuggestions.some((p) => p.poamId === 1)).toBe(true);
    });

    it('should return empty array when no match', () => {
      component.searchPoams({ query: 'zzzzz' } as any);
      expect(component.poamSuggestions).toEqual([]);
    });
  });

  describe('parseVulnerabilityIds', () => {
    beforeEach(() => {
      component.availablePoams = mockPoams;
      component.displayPoams = [];
    });

    it('should return early for empty/whitespace input', () => {
      const rowData = { selectedPoams: [] };

      component.parseVulnerabilityIds('   ', rowData);
      expect(rowData.selectedPoams).toEqual([]);
    });

    it('should match single vulnerabilityId', () => {
      const rowData: any = {};

      component.parseVulnerabilityIds('CVE-001', rowData);
      expect(rowData.selectedPoams).toEqual(expect.arrayContaining([expect.objectContaining({ vulnerabilityId: 'CVE-001' })]));
    });

    it('should match multiple comma-separated ids', () => {
      const rowData: any = {};

      component.parseVulnerabilityIds('CVE-001, CVE-002', rowData);
      expect(rowData.selectedPoams.length).toBe(2);
    });

    it('should skip already-added poams (not isNew)', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      const rowData: any = {};

      component.parseVulnerabilityIds('CVE-001', rowData);
      expect(rowData.selectedPoams || []).toHaveLength(0);
    });

    it('should skip already-selected poams', () => {
      const rowData: any = { selectedPoams: [{ poamId: 1 }] };

      component.parseVulnerabilityIds('CVE-001', rowData);
      expect(rowData.selectedPoams.filter((p: any) => p.poamId === 1).length).toBe(1);
    });

    it('should use empty array for selectedPoams when not defined', () => {
      const rowData: any = {};

      component.parseVulnerabilityIds('CVE-001', rowData);
      expect(rowData.selectedPoams).toBeDefined();
    });
  });

  describe('onPasteVulnerabilityIds', () => {
    it('should call event.preventDefault', () => {
      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn(), clipboardData: { getData: vi.fn().mockReturnValue('CVE-001') } } as any;

      component.availablePoams = mockPoams;
      component.displayPoams = [];
      component.onPasteVulnerabilityIds(event, {});
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call event.stopPropagation', () => {
      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn(), clipboardData: { getData: vi.fn().mockReturnValue('') } } as any;

      component.onPasteVulnerabilityIds(event, {});
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not call parseVulnerabilityIds when clipboard data is empty', () => {
      const spy = vi.spyOn(component, 'parseVulnerabilityIds');
      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn(), clipboardData: { getData: vi.fn().mockReturnValue('') } } as any;

      component.onPasteVulnerabilityIds(event, {});
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('addPoamRow', () => {
    it('should prepend a new row to displayPoams', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      component.addPoamRow();
      expect(component.displayPoams.length).toBe(2);
      expect(component.displayPoams[0].isNew).toBe(true);
    });

    it('should set correct fields on new row', () => {
      component.displayPoams = [];
      component.addPoamRow();
      const row = component.displayPoams[0];

      expect(row.isNew).toBe(true);
      expect(row.selectedPoams).toEqual([]);
      expect(row.poamId).toBeNull();
      expect(row.vulnerabilityId).toBe('');
      expect(row.vulnerabilityTitle).toBe('');
      expect(row.rawSeverity).toBe('');
    });

    it('should preserve existing rows', () => {
      const existing = { poamId: 5, isNew: false };

      component.displayPoams = [existing];
      component.addPoamRow();
      expect(component.displayPoams[1]).toEqual(existing);
    });
  });

  describe('onPoamAdd', () => {
    it('should show validation error when no selectedPoams', async () => {
      const rowData = { selectedPoams: [] };

      await component.onPoamAdd(rowData, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Validation Error' }));
    });

    it('should show validation error when selectedPoams is undefined', async () => {
      const rowData = {};

      await component.onPoamAdd(rowData as any, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Validation Error' }));
    });

    it('should warn on duplicate poam', async () => {
      component.label = { labelId: 1, labelName: 'Test' };
      component.displayPoams = [{ poamId: 1, isNew: false }];
      const rowData = { selectedPoams: [{ poamId: 1 }] };

      await component.onPoamAdd(rowData, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Duplicate POAM' }));
    });

    it('should call poamService.postPoamLabel for non-duplicate', async () => {
      component.label = { labelId: 1, labelName: 'Test' };
      component.displayPoams = [{ poamId: 99, isNew: false }];
      const rowData = { selectedPoams: [{ poamId: 5 }] };

      await component.onPoamAdd(rowData, 0);
      expect(mockPoamService.postPoamLabel).toHaveBeenCalledWith({ poamId: 5, labelId: 1 });
    });

    it('should show success message after adding poam', async () => {
      component.label = { labelId: 1, labelName: 'Test' };
      component.displayPoams = [];
      const rowData = { selectedPoams: [{ poamId: 5 }] };

      await component.onPoamAdd(rowData, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should show error message when postPoamLabel fails', async () => {
      mockPoamService.postPoamLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.label = { labelId: 1, labelName: 'Test' };
      component.displayPoams = [];
      const rowData = { selectedPoams: [{ poamId: 5 }] };

      await component.onPoamAdd(rowData, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should splice new row from displayPoams by index', async () => {
      component.label = { labelId: 1, labelName: 'Test' };
      component.displayPoams = [
        { isNew: true, selectedPoams: [{ poamId: 5 }] },
        { poamId: 2, isNew: false }
      ];
      await component.onPoamAdd(component.displayPoams[0], 0);
      expect(component.displayPoams.length).toBe(2);
    });
  });

  describe('deletePoamFromLabel', () => {
    it('should splice new row without calling service', async () => {
      component.displayPoams = [{ poamId: 1, isNew: true }];
      await component.deletePoamFromLabel({ poamId: 1, isNew: true }, 0);
      expect(mockPoamService.deletePoamLabel).not.toHaveBeenCalled();
      expect(component.displayPoams.length).toBe(0);
    });

    it('should call poamService.deletePoamLabel for existing poam', async () => {
      component.label = { labelId: 2, labelName: 'Test' };
      component.displayPoams = [{ poamId: 5, isNew: false }];
      await component.deletePoamFromLabel({ poamId: 5, isNew: false }, 0);
      expect(mockPoamService.deletePoamLabel).toHaveBeenCalledWith(5, 2);
    });

    it('should splice row from displayPoams on success', async () => {
      component.label = { labelId: 2, labelName: 'Test' };
      component.displayPoams = [
        { poamId: 5, isNew: false },
        { poamId: 6, isNew: false }
      ];
      await component.deletePoamFromLabel({ poamId: 5, isNew: false }, 0);
      expect(component.displayPoams.length).toBe(1);
    });

    it('should show success message on delete', async () => {
      component.label = { labelId: 2, labelName: 'Test' };
      component.displayPoams = [{ poamId: 5, isNew: false }];
      await component.deletePoamFromLabel({ poamId: 5, isNew: false }, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should show error message on service failure', async () => {
      mockPoamService.deletePoamLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.label = { labelId: 2, labelName: 'Test' };
      component.displayPoams = [{ poamId: 5, isNew: false }];
      await component.deletePoamFromLabel({ poamId: 5, isNew: false }, 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('getSeverity', () => {
    it('should return danger for CRITICAL', () => {
      expect(component.getSeverity('CRITICAL')).toBe('danger');
    });

    it('should return danger for CAT I', () => {
      expect(component.getSeverity('CAT I')).toBe('danger');
    });

    it('should return warn for HIGH', () => {
      expect(component.getSeverity('HIGH')).toBe('warn');
    });

    it('should return warn for CAT II', () => {
      expect(component.getSeverity('CAT II')).toBe('warn');
    });

    it('should return info for MEDIUM', () => {
      expect(component.getSeverity('MEDIUM')).toBe('info');
    });

    it('should return info for CAT III', () => {
      expect(component.getSeverity('CAT III')).toBe('info');
    });

    it('should return contrast for LOW', () => {
      expect(component.getSeverity('LOW')).toBe('contrast');
    });

    it('should return secondary for unknown severity', () => {
      expect(component.getSeverity('UNKNOWN')).toBe('secondary');
    });

    it('should return secondary for empty string', () => {
      expect(component.getSeverity('')).toBe('secondary');
    });

    it('should handle lowercase input via toUpperCase', () => {
      expect(component.getSeverity('critical')).toBe('danger');
    });

    it('should handle undefined gracefully', () => {
      expect(component.getSeverity(undefined as any)).toBe('secondary');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.selectedCollection = 1;
    });

    it('should not proceed when validData returns false (no labelName)', () => {
      component.label = { labelId: 'ADDLABEL', labelName: '', description: '' };
      mockDialogService.open.mockReturnValue({ onClose: of(false) });
      component.onSubmit();
      expect(mockLabelService.addLabel).not.toHaveBeenCalled();
    });

    it('should call addLabel when labelId is ADDLABEL', () => {
      component.label = { labelId: 'ADDLABEL', labelName: 'New Label', description: '' };
      component.labels = [];
      component.onSubmit();
      expect(mockLabelService.addLabel).toHaveBeenCalled();
    });

    it('should call addLabel with labelId=0 when ADDLABEL', () => {
      component.label = { labelId: 'ADDLABEL', labelName: 'New Label', description: '' };
      component.labels = [];
      component.onSubmit();
      const call = mockLabelService.addLabel.mock.calls[0];

      expect(call[1].labelId).toBe(0);
    });

    it('should emit labelchange with labelId after addLabel success', () => {
      const spy = vi.spyOn(component.labelchange, 'emit');

      component.label = { labelId: 'ADDLABEL', labelName: 'New Label', description: '' };
      component.labels = [];
      component.onSubmit();
      expect(spy).toHaveBeenCalledWith(10);
    });

    it('should show error message when addLabel fails', () => {
      mockLabelService.addLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.label = { labelId: 'ADDLABEL', labelName: 'New Label', description: '' };
      component.labels = [];
      component.onSubmit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should call updateLabel when labelId is a number', () => {
      component.label = { labelId: 5, labelName: 'Existing', description: '' };
      component.onSubmit();
      expect(mockLabelService.updateLabel).toHaveBeenCalledWith(1, 5, expect.any(Object));
    });

    it('should emit labelchange after updateLabel', () => {
      const spy = vi.spyOn(component.labelchange, 'emit');

      component.label = { labelId: 5, labelName: 'Existing', description: '' };
      component.onSubmit();
      expect(spy).toHaveBeenCalled();
    });

    it('should pass collectionId from selectedCollection', () => {
      component.label = { labelId: 5, labelName: 'Existing', description: '' };
      component.onSubmit();
      const call = mockLabelService.updateLabel.mock.calls[0];

      expect(call[2].collectionId).toBe(1);
    });
  });

  describe('resetData', () => {
    it('should reset label to empty fields', () => {
      component.label = { labelId: 5, labelName: 'Test', description: 'D' };
      component.resetData();
      expect(component.label).toEqual({ labelId: '', labelName: '', description: '' });
    });

    it('should clear displayPoams', () => {
      component.displayPoams = [{ poamId: 1, isNew: false }];
      component.resetData();
      expect(component.displayPoams).toEqual([]);
    });

    it('should emit labelchange', () => {
      const spy = vi.spyOn(component.labelchange, 'emit');

      component.resetData();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('validData', () => {
    it('should return false when labelName is empty', () => {
      mockDialogService.open.mockReturnValue({ onClose: of(false) });
      component.label = { labelId: 5, labelName: '', description: '' };
      expect(component.validData()).toBe(false);
    });

    it('should return false when labelName is undefined', () => {
      mockDialogService.open.mockReturnValue({ onClose: of(false) });
      component.label = { labelId: 5, labelName: undefined, description: '' };
      expect(component.validData()).toBe(false);
    });

    it('should return false for ADDLABEL when name already exists', () => {
      mockDialogService.open.mockReturnValue({ onClose: of(false) });
      component.label = { labelId: 'ADDLABEL', labelName: 'Existing', description: '' };
      component.labels = [{ labelId: 1, labelName: 'Existing' }];
      expect(component.validData()).toBe(false);
    });

    it('should return true for ADDLABEL when name does not exist', () => {
      component.label = { labelId: 'ADDLABEL', labelName: 'Brand New', description: '' };
      component.labels = [{ labelId: 1, labelName: 'Existing' }];
      expect(component.validData()).toBe(true);
    });

    it('should return true for existing label with valid name', () => {
      component.label = { labelId: 5, labelName: 'Valid Name', description: '' };
      component.labels = [];
      expect(component.validData()).toBe(true);
    });
  });

  describe('invalidData', () => {
    it('should call dialogService.open', () => {
      mockDialogService.open.mockReturnValue({ onClose: of(false) });
      component.invalidData('Test error');
      expect(mockDialogService.open).toHaveBeenCalled();
    });
  });

  describe('deleteLabel', () => {
    it('should call labelService.deleteLabel', () => {
      component.deleteLabel({ collectionId: 1, labelId: 5 });
      expect(mockLabelService.deleteLabel).toHaveBeenCalledWith(1, 5);
    });

    it('should show success message on delete', () => {
      component.deleteLabel({ collectionId: 1, labelId: 5 });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should emit labelchange after success', () => {
      const spy = vi.spyOn(component.labelchange, 'emit');

      component.deleteLabel({ collectionId: 1, labelId: 5 });
      expect(spy).toHaveBeenCalled();
    });

    it('should show error message on failure', () => {
      mockLabelService.deleteLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.deleteLabel({ collectionId: 1, labelId: 5 });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail on failure', () => {
      mockLabelService.deleteLabel.mockReturnValue(throwError(() => new Error('fail')));
      component.deleteLabel({ collectionId: 1, labelId: 5 });
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Failed to delete label');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      component.ngOnInit();
      const spy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptions', () => {
      component.ngOnInit();
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without prior init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
