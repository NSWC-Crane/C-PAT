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
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamLabelsComponent } from './poam-labels.component';

describe('PoamLabelsComponent', () => {
  let component: PoamLabelsComponent;
  let fixture: ComponentFixture<PoamLabelsComponent>;
  let mockMessageService: any;
  let mockPoamService: any;

  const mockLabelList = [
    { labelId: 1, labelName: 'Critical' },
    { labelId: 2, labelName: 'High' },
    { labelId: 3, labelName: 'Medium' }
  ];

  function createLabel(overrides: any = {}): any {
    return {
      labelId: 1,
      labelName: 'Critical',
      isNew: false,
      ...overrides
    };
  }

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamService = {
      getPoamLabelsByPoam: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PoamLabelsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamLabelsComponent);
    component = fixture.componentInstance;
    component.poamId = 100;
    component.accessLevel = 2;
    component.poamLabels = [];
    component.labelList = [...mockLabelList.map((l) => ({ ...l }))];
    component.poamService = mockPoamService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default property values', () => {
      expect(component.accessLevel).toBe(2);
      expect(component.poamLabels).toEqual([]);
    });

    it('should initialize poamLabels to empty array if null', () => {
      component.poamLabels = null as any;
      component.ngOnInit();
      expect(component.poamLabels).toEqual([]);
    });

    it('should initialize poamLabels to empty array if undefined', () => {
      component.poamLabels = undefined as any;
      component.ngOnInit();
      expect(component.poamLabels).toEqual([]);
    });

    it('should leave poamLabels unchanged if already an array', () => {
      const labels = [createLabel()];

      component.poamLabels = labels;
      component.ngOnInit();
      expect(component.poamLabels).toBe(labels);
    });
  });

  describe('addLabel', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.labelsChanged, 'emit');
    });

    it('should add a new label to the beginning of the array', async () => {
      const existing = createLabel({ labelId: 2 });

      component.poamLabels = [existing];

      await component.addLabel();

      expect(component.poamLabels.length).toBe(2);
      expect(component.poamLabels[0].isNew).toBe(true);
      expect(component.poamLabels[0].labelId).toBeNull();
      expect(component.poamLabels[1].labelId).toBe(2);
    });

    it('should set correct default values on the new label', async () => {
      await component.addLabel();

      const newLabel = component.poamLabels[0];

      expect(newLabel.labelId).toBeNull();
      expect(newLabel.isNew).toBe(true);
    });

    it('should emit labelsChanged', async () => {
      await component.addLabel();
      expect(emitSpy).toHaveBeenCalledWith(component.poamLabels);
    });

    it('should add to an empty array', async () => {
      component.poamLabels = [];
      await component.addLabel();
      expect(component.poamLabels.length).toBe(1);
    });

    it('should support multiple consecutive adds', async () => {
      await component.addLabel();
      await component.addLabel();
      expect(component.poamLabels.length).toBe(2);
      expect(component.poamLabels[0].isNew).toBe(true);
      expect(component.poamLabels[1].isNew).toBe(true);
    });
  });

  describe('onLabelChange', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.labelsChanged, 'emit');
    });

    it('should update an existing label in-place when found by labelId', async () => {
      const label = createLabel({ labelId: 1, isNew: true });

      component.poamLabels = [label];

      await component.onLabelChange({ labelId: 1 });

      expect(component.poamLabels[0].labelName).toBe('Critical');
      expect(component.poamLabels[0].isNew).toBe(false);
    });

    it('should prepend label when not found in current poamLabels', async () => {
      component.poamLabels = [createLabel({ labelId: 2 })];

      await component.onLabelChange({ labelId: 1 });

      expect(component.poamLabels.length).toBe(2);
      expect(component.poamLabels[0].labelId).toBe(1);
      expect(component.poamLabels[0].labelName).toBe('Critical');
    });

    it('should emit labelsChanged after update', async () => {
      component.poamLabels = [createLabel({ labelId: 1 })];
      await component.onLabelChange({ labelId: 1 });
      expect(emitSpy).toHaveBeenCalledWith(component.poamLabels);
    });

    it('should do nothing if label is not in labelList', async () => {
      component.poamLabels = [createLabel()];
      await component.onLabelChange({ labelId: 999 });
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should set isNew to false on the selected label from labelList', async () => {
      await component.onLabelChange({ labelId: 2 });

      const matchingLabel = component.labelList.find((l) => l.labelId === 2);

      expect(matchingLabel.isNew).toBe(false);
    });

    it('should emit when adding a label to an empty array', async () => {
      component.poamLabels = [];
      await component.onLabelChange({ labelId: 1 });

      expect(component.poamLabels.length).toBe(1);
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('deleteLabel', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.labelsChanged, 'emit');
    });

    it('should remove the label at the given index', async () => {
      component.poamLabels = [createLabel({ labelId: 1 }), createLabel({ labelId: 2 }), createLabel({ labelId: 3 })];

      await component.deleteLabel(1);

      expect(component.poamLabels.length).toBe(2);
      expect(component.poamLabels[0].labelId).toBe(1);
      expect(component.poamLabels[1].labelId).toBe(3);
    });

    it('should remove the first label', async () => {
      component.poamLabels = [createLabel({ labelId: 1 }), createLabel({ labelId: 2 })];
      await component.deleteLabel(0);

      expect(component.poamLabels.length).toBe(1);
      expect(component.poamLabels[0].labelId).toBe(2);
    });

    it('should remove the last label leaving empty array', async () => {
      component.poamLabels = [createLabel({ labelId: 1 })];
      await component.deleteLabel(0);
      expect(component.poamLabels.length).toBe(0);
    });

    it('should emit labelsChanged after deletion', async () => {
      component.poamLabels = [createLabel()];
      await component.deleteLabel(0);
      expect(emitSpy).toHaveBeenCalledWith(component.poamLabels);
    });
  });

  describe('getPoamLabels', () => {
    it('should not call service if poamId is falsy', () => {
      component.poamId = null;
      component.getPoamLabels();
      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is ADDPOAM', () => {
      component.poamId = 'ADDPOAM';
      component.getPoamLabels();
      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is undefined', () => {
      component.poamId = undefined;
      component.getPoamLabels();
      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is 0', () => {
      component.poamId = 0;
      component.getPoamLabels();
      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is empty string', () => {
      component.poamId = '';
      component.getPoamLabels();
      expect(mockPoamService.getPoamLabelsByPoam).not.toHaveBeenCalled();
    });

    it('should fetch labels and emit on success', () => {
      const emitSpy = vi.spyOn(component.labelsChanged, 'emit');
      const returnedLabels = [createLabel({ labelId: 1 }), createLabel({ labelId: 2 })];

      mockPoamService.getPoamLabelsByPoam.mockReturnValue(of(returnedLabels));

      component.getPoamLabels();

      expect(mockPoamService.getPoamLabelsByPoam).toHaveBeenCalledWith(100);
      expect(component.poamLabels).toBe(returnedLabels);
      expect(emitSpy).toHaveBeenCalledWith(returnedLabels);
    });

    it('should replace existing labels on success', () => {
      component.poamLabels = [createLabel({ labelId: 99 })];
      const newLabels = [createLabel({ labelId: 1 })];

      mockPoamService.getPoamLabelsByPoam.mockReturnValue(of(newLabels));

      component.getPoamLabels();

      expect(component.poamLabels).toBe(newLabels);
    });

    it('should show error message on failure with error.error.detail', () => {
      const error = { error: { detail: 'Label not found' }, message: 'HTTP error' };

      mockPoamService.getPoamLabelsByPoam.mockReturnValue(throwError(() => error));

      component.getPoamLabels();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load labels: Label not found'
        })
      );
    });

    it('should show error message on failure with error.message fallback', () => {
      const error = { message: 'Network timeout' };

      mockPoamService.getPoamLabelsByPoam.mockReturnValue(throwError(() => error));

      component.getPoamLabels();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to load labels: Network timeout'
        })
      );
    });

    it('should show generic error when no detail or message', () => {
      mockPoamService.getPoamLabelsByPoam.mockReturnValue(throwError(() => ({})));

      component.getPoamLabels();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to load labels: An unexpected error occurred'
        })
      );
    });

    it('should call service with correct poamId', () => {
      component.poamId = 42;
      mockPoamService.getPoamLabelsByPoam.mockReturnValue(of([]));

      component.getPoamLabels();

      expect(mockPoamService.getPoamLabelsByPoam).toHaveBeenCalledWith(42);
    });
  });
});
