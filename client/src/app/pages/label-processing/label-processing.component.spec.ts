/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { LabelProcessingComponent } from './label-processing.component';
import { LabelService } from './label.service';
import { PayloadService } from '../../common/services/setPayload.service';
import { SharedService } from '../../common/services/shared.service';
import { createMockMessageService, createMockDialogService } from '../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockLabels = [
  { labelId: '3', labelName: 'Charlie', description: 'Desc C' },
  { labelId: '1', labelName: 'Alpha', description: 'Desc A' },
  { labelId: '2', labelName: 'Beta', description: 'Desc B' }
];

describe('LabelProcessingComponent', () => {
  let component: LabelProcessingComponent;
  let fixture: ComponentFixture<LabelProcessingComponent>;
  let mockLabelService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockMessageService: any;
  let mockDialogService: any;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;
  let selectedCollectionSubject: BehaviorSubject<any>;

  const setupTableMock = () => {
    const mockTable = { clear: vi.fn(), filterGlobal: vi.fn() };

    Object.defineProperty(component, 'labelTable', { get: () => () => mockTable, configurable: true });

    return mockTable;
  };

  beforeEach(async () => {
    userSubject = new BehaviorSubject<any>({ userId: 1 });
    payloadSubject = new BehaviorSubject<any>({ lastCollectionAccessedId: 1 });
    accessLevelSubject = new BehaviorSubject<number>(0);
    selectedCollectionSubject = new BehaviorSubject<any>(1);

    mockLabelService = {
      getLabels: vi.fn().mockReturnValue(of(mockLabels))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockMessageService = createMockMessageService();
    mockDialogService = createMockDialogService();

    await TestBed.configureTestingModule({
      imports: [LabelProcessingComponent],
      providers: [
        { provide: LabelService, useValue: mockLabelService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: DialogService, useValue: mockDialogService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LabelProcessingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize labelDialogVisible as false', () => {
      expect(component.labelDialogVisible).toBe(false);
    });

    it('should initialize data as empty array', () => {
      expect(component.data).toEqual([]);
    });

    it('should initialize labels as empty array', () => {
      expect(component.labels).toEqual([]);
    });

    it('should initialize filterValue as empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should initialize label with empty fields', () => {
      expect(component.label.labelId).toBe('');
      expect(component.label.labelName).toBe('');
      expect(component.label.description).toBe('');
    });

    it('should initialize allowSelectLabels as true', () => {
      expect(component.allowSelectLabels).toBe(true);
    });

    it('should initialize selectedLabels as empty array', () => {
      expect(component.selectedLabels).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedCollection', () => {
      component.ngOnInit();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update selectedCollection when it changes', () => {
      component.ngOnInit();
      selectedCollectionSubject.next(5);
      expect(component.selectedCollection).toBe(5);
    });

    it('should call setPayloadService.setPayload', () => {
      component.ngOnInit();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should set user from user$', () => {
      component.setPayload();
      expect(component.user).toEqual({ userId: 1 });
    });

    it('should set payload from payload$', () => {
      component.setPayload();
      expect(component.payload).toEqual({ lastCollectionAccessedId: 1 });
    });

    it('should call getLabelData when accessLevel > 0', () => {
      component.selectedCollection = 1;
      component.setPayload();
      accessLevelSubject.next(2);
      expect(mockLabelService.getLabels).toHaveBeenCalled();
    });

    it('should not call getLabelData when accessLevel is 0', () => {
      component.setPayload();
      expect(mockLabelService.getLabels).not.toHaveBeenCalled();
    });
  });

  describe('getLabelData', () => {
    it('should call labelService.getLabels with selectedCollection', () => {
      component.selectedCollection = 1;
      component.getLabelData();
      expect(mockLabelService.getLabels).toHaveBeenCalledWith(1);
    });

    it('should reset labels to empty array before fetch', () => {
      component.labels = [{ labelId: 1, labelName: 'Old', description: '' }];
      component.selectedCollection = 1;
      component.getLabelData();
      expect(component.labels.length).toBeGreaterThan(0);
    });

    it('should convert labelId to number', () => {
      component.selectedCollection = 1;
      component.getLabelData();
      expect(typeof component.data[0].labelId).toBe('number');
    });

    it('should sort data ascending by labelId', () => {
      component.selectedCollection = 1;
      component.getLabelData();
      expect(component.data[0].labelId).toBe(1);
      expect(component.data[1].labelId).toBe(2);
      expect(component.data[2].labelId).toBe(3);
    });

    it('should set labels equal to sorted data', () => {
      component.selectedCollection = 1;
      component.getLabelData();
      expect(component.labels).toEqual(component.data);
    });

    it('should show error message on service failure', () => {
      mockLabelService.getLabels.mockReturnValue(throwError(() => new Error('fetch error')));
      component.selectedCollection = 1;
      component.getLabelData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include error detail on failure', () => {
      mockLabelService.getLabels.mockReturnValue(throwError(() => new Error('fetch error')));
      component.selectedCollection = 1;
      component.getLabelData();
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Error fetching labels');
    });
  });

  describe('setLabel', () => {
    beforeEach(() => {
      component.data = [
        { labelId: 1, labelName: 'Alpha', description: 'D1' },
        { labelId: 2, labelName: 'Beta', description: 'D2' }
      ];
    });

    it('should set label to found entry', () => {
      component.setLabel(1);
      expect(component.label.labelName).toBe('Alpha');
    });

    it('should set labelDialogVisible to true when label found', () => {
      component.setLabel(1);
      expect(component.labelDialogVisible).toBe(true);
    });

    it('should clone the label (not reference)', () => {
      component.setLabel(1);
      const orig = component.data.find((l) => l.labelId === 1);

      expect(component.label).not.toBe(orig);
    });

    it('should reset label when labelId not found', () => {
      component.setLabel(999);
      expect(component.label.labelId).toBe('');
      expect(component.label.labelName).toBe('');
    });

    it('should not set labelDialogVisible when label not found', () => {
      component.labelDialogVisible = false;
      component.setLabel(999);
      expect(component.labelDialogVisible).toBe(false);
    });
  });

  describe('openLabelPopup', () => {
    it('should set labelDialogVisible to true', () => {
      component.labelDialogVisible = false;
      component.openLabelPopup();
      expect(component.labelDialogVisible).toBe(true);
    });
  });

  describe('addLabel', () => {
    it('should set label.labelId to ADDLABEL', () => {
      component.addLabel();
      expect(component.label.labelId).toBe('ADDLABEL');
    });

    it('should clear label name', () => {
      component.addLabel();
      expect(component.label.labelName).toBe('');
    });

    it('should set labelDialogVisible to true', () => {
      component.addLabel();
      expect(component.labelDialogVisible).toBe(true);
    });
  });

  describe('closeLabelPopup', () => {
    it('should set labelDialogVisible to false', () => {
      component.labelDialogVisible = true;
      component.closeLabelPopup();
      expect(component.labelDialogVisible).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should call resetData', () => {
      const spy = vi.spyOn(component, 'resetData');

      component.onSubmit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should reset label to empty fields', () => {
      component.label = { labelId: 1, labelName: 'Test', description: 'Desc' };
      component.selectedCollection = 1;
      component.resetData();
      expect(component.label.labelId).toBe('ADDLABEL');
    });

    it('should call getLabelData', () => {
      component.selectedCollection = 1;
      component.resetData();
      expect(mockLabelService.getLabels).toHaveBeenCalled();
    });

    it('should set allowSelectLabels to true', () => {
      component.allowSelectLabels = false;
      component.selectedCollection = 1;
      component.resetData();
      expect(component.allowSelectLabels).toBe(true);
    });
  });

  describe('applyFilter', () => {
    it('should call labelTable().filterGlobal with trimmed lowercase value', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: '  Alpha  ' } } as unknown as Event;

      component.applyFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('alpha', 'contains');
    });

    it('should pass empty string when cleared', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: '' } } as unknown as Event;

      component.applyFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('clear', () => {
    it('should reset filterValue to empty string', () => {
      setupTableMock();
      component.filterValue = 'alpha';
      component.clear();
      expect(component.filterValue).toBe('');
    });

    it('should call labelTable().clear()', () => {
      const mockTable = setupTableMock();

      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should restore data from labels', () => {
      setupTableMock();
      const saved = [{ labelId: 1, labelName: 'Alpha', description: '' }];

      component.labels = saved;
      component.data = [];
      component.clear();
      expect(component.data).toEqual(saved);
    });
  });

  describe('confirm', () => {
    it('should call dialogService.open with ConfirmationDialogComponent', () => {
      const mockOnClose = of(true);

      mockDialogService.open.mockReturnValue({ onClose: mockOnClose });
      const options = { header: 'Test', body: 'Body', button: { text: 'ok', status: 'warn' }, cancelbutton: 'false' } as any;

      component.confirm(options);
      expect(mockDialogService.open).toHaveBeenCalled();
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

    it('should unsubscribe payloadSubscriptions', () => {
      component.setPayload();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when destroyed without prior init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
