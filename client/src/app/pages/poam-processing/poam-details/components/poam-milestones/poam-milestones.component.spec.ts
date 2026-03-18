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
import { DatePipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { createMockConfirmationService, createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamMilestonesComponent, Milestone } from './poam-milestones.component';
import { addDays } from 'date-fns';

describe('PoamMilestonesComponent', () => {
  let component: PoamMilestonesComponent;
  let fixture: ComponentFixture<PoamMilestonesComponent>;
  let mockConfirmationService: any;
  let mockMessageService: any;

  const mockTeamOptions = [
    { assignedTeamId: 1, assignedTeamName: 'Team Alpha' },
    { assignedTeamId: 2, assignedTeamName: 'Team Beta' },
    { assignedTeamId: 3, assignedTeamName: 'Team Gamma' }
  ];

  function createMilestone(overrides: Partial<Milestone> = {}): Milestone {
    return {
      milestoneId: 'ms-1',
      milestoneComments: 'Test milestone',
      milestoneDate: new Date('2026-06-01'),
      milestoneChangeComments: null,
      milestoneChangeDate: null,
      milestoneStatus: 'Pending',
      assignedTeamIds: [1],
      isNew: false,
      editing: false,
      dateModified: false,
      ...overrides
    };
  }

  beforeEach(async () => {
    mockConfirmationService = createMockConfirmationService();
    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [PoamMilestonesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
      .overrideComponent(PoamMilestonesComponent, {
        set: {
          providers: [DatePipe, { provide: ConfirmationService, useValue: mockConfirmationService }, { provide: MessageService, useValue: mockMessageService }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PoamMilestonesComponent);
    component = fixture.componentInstance;
    component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
    component.accessLevel = 2;
    component.assignedTeamOptions = mockTeamOptions;
    component.poamMilestones = [];
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
      expect(component.editingMilestoneId()).toBeNull();
      expect(component.clonedMilestones).toEqual({});
      expect(component.defaultMilestoneDateOffset).toBe(30);
      expect(component.milestoneStatusOptions).toEqual([
        { label: 'Pending', value: 'Pending' },
        { label: 'Complete', value: 'Complete' }
      ]);
    });

    it('should initialize poamMilestones to empty array if not an array', () => {
      component.poamMilestones = null as any;
      component.ngOnInit();
      expect(component.poamMilestones).toEqual([]);
    });

    it('should leave poamMilestones unchanged if already an array', () => {
      const milestones = [createMilestone()];

      component.poamMilestones = milestones;
      component.ngOnInit();
      expect(component.poamMilestones).toBe(milestones);
    });

    it('should initialize poamMilestones to empty array if undefined', () => {
      component.poamMilestones = undefined as any;
      component.ngOnInit();
      expect(component.poamMilestones).toEqual([]);
    });
  });

  describe('onAddNewMilestone', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.milestonesChanged, 'emit');
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should add a new milestone to the beginning of the array', () => {
      const existing = createMilestone({ milestoneId: 'existing-1' });

      component.poamMilestones = [existing];

      component.onAddNewMilestone();

      expect(component.poamMilestones.length).toBe(2);
      expect(component.poamMilestones[0].isNew).toBe(true);
      expect(component.poamMilestones[1].milestoneId).toBe('existing-1');
    });

    it('should set new milestone with correct default values', () => {
      component.onAddNewMilestone();

      const newMilestone = component.poamMilestones[0];

      expect(newMilestone.milestoneComments).toBeNull();
      expect(newMilestone.milestoneChangeComments).toBeNull();
      expect(newMilestone.milestoneChangeDate).toBeNull();
      expect(newMilestone.milestoneStatus).toBe('Pending');
      expect(newMilestone.assignedTeamIds).toEqual([]);
      expect(newMilestone.isNew).toBe(true);
      expect(newMilestone.editing).toBe(true);
      expect(newMilestone.dateModified).toBe(false);
    });

    it('should generate a temp ID starting with "temp_"', () => {
      component.onAddNewMilestone();
      expect(component.poamMilestones[0].milestoneId).toMatch(/^temp_\d+$/);
    });

    it('should set editingMilestoneId to the new milestone temp ID', () => {
      component.onAddNewMilestone();
      expect(component.editingMilestoneId()).toBe(component.poamMilestones[0].milestoneId);
    });

    it('should clone the new milestone', () => {
      component.onAddNewMilestone();
      const newId = component.poamMilestones[0].milestoneId;

      expect(component.clonedMilestones[newId]).toBeDefined();
      expect(component.clonedMilestones[newId].milestoneStatus).toBe('Pending');
    });

    it('should emit milestonesChanged', () => {
      component.onAddNewMilestone();
      expect(emitSpy).toHaveBeenCalledWith(component.poamMilestones);
    });

    it('should initialize poamMilestones if not an array', () => {
      component.poamMilestones = null as any;
      component.onAddNewMilestone();
      expect(Array.isArray(component.poamMilestones)).toBe(true);
      expect(component.poamMilestones.length).toBe(1);
    });

    it('should call table.initRowEdit on setTimeout', () => {
      const mockTable = { initRowEdit: vi.fn(), cancelRowEdit: vi.fn() };

      vi.spyOn(component, 'table' as any).mockReturnValue(mockTable);

      component.onAddNewMilestone();
      vi.runAllTimers();

      expect(mockTable.initRowEdit).toHaveBeenCalledWith(component.poamMilestones[0]);
    });

    it('should handle missing table gracefully on setTimeout', () => {
      vi.spyOn(component, 'table' as any).mockReturnValue(undefined);

      component.onAddNewMilestone();
      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });

  describe('calculateDefaultMilestoneDate (via onAddNewMilestone)', () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should default to 30 days from now when no scheduled completion date', () => {
      component.poam = { status: 'Draft', scheduledCompletionDate: null, extensionDays: 0 };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);
      const expected = addDays(new Date('2026-03-01'), 30);

      expect(milestoneDate.toDateString()).toBe(expected.toDateString());
    });

    it('should use default date if before scheduled completion date', () => {
      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);
      const expected = addDays(new Date('2026-03-01'), 30);

      expect(milestoneDate.toDateString()).toBe(expected.toDateString());
    });

    it('should cap at scheduled completion date if default exceeds it', () => {
      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-03-15', extensionDays: 0 };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);

      expect(milestoneDate.toDateString()).toBe(new Date('2026-03-15').toDateString());
    });

    it('should use extension deadline when extension days > 0 and extensionDeadline is set', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-03-10',
        extensionDays: 30,
        extensionDeadline: '2026-04-10'
      };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);
      const expected = addDays(new Date('2026-03-01'), 30);

      expect(milestoneDate.toDateString()).toBe(expected.toDateString());
    });

    it('should cap at extension deadline when default exceeds it', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-03-10',
        extensionDays: 10,
        extensionDeadline: '2026-03-20'
      };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);

      expect(milestoneDate.toDateString()).toBe(new Date('2026-03-20').toDateString());
    });

    it('should fall back to scheduled completion date if extensionDeadline is invalid', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-03-15',
        extensionDays: 10,
        extensionDeadline: 'invalid-date'
      };
      component.onAddNewMilestone();

      const milestoneDate = new Date(component.poamMilestones[0].milestoneDate);

      expect(milestoneDate.toDateString()).toBe(new Date('2026-03-15').toDateString());
    });
  });

  describe('onDateChange', () => {
    it('should set dateModified to true for new milestones', () => {
      const milestone = createMilestone({ isNew: true, dateModified: false });

      component.onDateChange(milestone);
      expect(milestone.dateModified).toBe(true);
    });

    it('should not set dateModified for existing milestones', () => {
      const milestone = createMilestone({ isNew: false, dateModified: false });

      component.onDateChange(milestone);
      expect(milestone.dateModified).toBe(false);
    });
  });

  describe('onRowEditInit', () => {
    it('should set editing to true on milestone', () => {
      const milestone = createMilestone({ editing: false });

      component.onRowEditInit(milestone);
      expect(milestone.editing).toBe(true);
    });

    it('should set editingMilestoneId signal', () => {
      const milestone = createMilestone({ milestoneId: 'ms-42' });

      component.onRowEditInit(milestone);
      expect(component.editingMilestoneId()).toBe('ms-42');
    });

    it('should clone the milestone', () => {
      const milestone = createMilestone({ milestoneId: 'ms-42', milestoneComments: 'Original' });

      component.onRowEditInit(milestone);
      expect(component.clonedMilestones['ms-42']).toBeDefined();
      expect(component.clonedMilestones['ms-42'].milestoneComments).toBe('Original');
    });

    it('should create a shallow copy, not reference', () => {
      const milestone = createMilestone({ milestoneId: 'ms-42' });

      component.onRowEditInit(milestone);
      milestone.milestoneComments = 'Modified';
      expect(component.clonedMilestones['ms-42'].milestoneComments).toBe('Test milestone');
    });
  });

  describe('onRowEditSave', () => {
    it('should fail validation if milestoneComments is missing', () => {
      const milestone = createMilestone({ milestoneComments: null });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Milestone Comments is a required field.'
        })
      );
    });

    it('should fail validation if milestoneDate is missing', () => {
      const milestone = createMilestone({ milestoneDate: null as any });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Milestone Date is a required field.'
        })
      );
    });

    it('should fail validation if milestoneStatus is missing', () => {
      const milestone = createMilestone({ milestoneStatus: '' });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Milestone Status is a required field.'
        })
      );
    });

    it('should fail validation if assignedTeamIds is empty', () => {
      const milestone = createMilestone({ assignedTeamIds: [] });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'At least one Milestone Team is required.'
        })
      );
    });

    it('should fail if milestone date exceeds scheduled completion date (no extension)', () => {
      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-06-01', extensionDays: 0 };
      const milestone = createMilestone({ milestoneDate: new Date('2026-07-01') });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
        })
      );
    });

    it('should fail if milestone date exceeds extension deadline', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-06-01',
        extensionDays: 30,
        extensionDeadline: '2026-07-01'
      };
      const milestone = createMilestone({ milestoneDate: new Date('2026-08-01') });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.'
        })
      );
    });

    it('should pass date validation when no scheduled completion date', () => {
      component.poam = { status: 'Draft', scheduledCompletionDate: null, extensionDays: 0 };
      const milestone = createMilestone({ milestoneDate: new Date('2099-01-01') });

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show confirmation dialog for new milestone with unmodified date', () => {
      const milestone = createMilestone({ isNew: true, dateModified: false });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.onRowEditSave(milestone);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The milestone date has not been modified. Would you like to proceed?',
          header: 'Confirm Milestone Date'
        })
      );
    });

    it('should finalize edit when confirmation dialog is accepted', () => {
      const milestone = createMilestone({ isNew: true, dateModified: false, editing: true });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.poamMilestones = [milestone];
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      component.onRowEditSave(milestone);

      expect(milestone.editing).toBe(false);
      expect(milestone.isNew).toBe(false);
    });

    it('should not finalize when confirmation dialog is rejected', () => {
      const milestone = createMilestone({ isNew: true, dateModified: false, editing: true });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };

      mockConfirmationService.confirm.mockImplementation((config: any) => config.reject());
      component.onRowEditSave(milestone);

      expect(milestone.editing).toBe(true);
      expect(milestone.isNew).toBe(true);
    });

    it('should skip confirmation dialog for new milestone with modified date', () => {
      const milestone = createMilestone({ isNew: true, dateModified: true });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.poamMilestones = [milestone];
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockConfirmationService.confirm).not.toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should skip confirmation dialog for existing milestone', () => {
      const milestone = createMilestone({ isNew: false });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockConfirmationService.confirm).not.toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });
  });

  describe('validateMilestoneChangeFields (via onRowEditSave)', () => {
    it('should skip validation for new milestones', () => {
      const milestone = createMilestone({
        isNew: true,
        dateModified: true,
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.poam = {
        status: 'Extension Requested',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 30,
        extensionDeadline: '2027-01-30'
      };
      component.poamMilestones = [milestone];
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should skip validation when change fields are not editable', () => {
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should fail if change date set without change comments', () => {
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.poam = {
        status: 'Extension Requested',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'When providing a milestone change date, you must also include milestone change comments.'
        })
      );
    });

    it('should fail if change date is in the past', () => {
      vi.useFakeTimers({ now: new Date('2026-06-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-05-01'),
        milestoneChangeComments: 'Updated comments'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Milestone change date cannot be set to a past date.'
        })
      );

      vi.useRealTimers();
    });

    it('should fail if change date exceeds effective deadline (no extension)', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2027-01-15'),
        milestoneChangeComments: 'Updated'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'The Milestone change date provided exceeds the POAM scheduled completion date.'
        })
      );

      vi.useRealTimers();
    });

    it('should fail if change date exceeds effective deadline (with extension)', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2027-02-15'),
        milestoneChangeComments: 'Updated'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 30,
        extensionDeadline: '2027-01-30'
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'The Milestone change date provided exceeds the POAM scheduled completion date and the allowed extension time.'
        })
      );

      vi.useRealTimers();
    });

    it('should pass validation with valid change date and comments', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: 'Updated comments'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));

      vi.useRealTimers();
    });

    it('should handle change date as ISO string', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: '2026-06-01',
        milestoneChangeComments: 'Updated'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));

      vi.useRealTimers();
    });

    it('should pass when no change date is provided', () => {
      const milestone = createMilestone({
        milestoneChangeDate: null,
        milestoneChangeComments: null
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });
  });

  describe('finalizeRowEdit (via onRowEditSave)', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.milestonesChanged, 'emit');
    });

    it('should set editing to false', () => {
      const milestone = createMilestone({ editing: true });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(milestone.editing).toBe(false);
    });

    it('should clear editingMilestoneId', () => {
      const milestone = createMilestone();

      component.editingMilestoneId.set('ms-1');
      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(component.editingMilestoneId()).toBeNull();
    });

    it('should remove cloned milestone', () => {
      const milestone = createMilestone();

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(component.clonedMilestones[milestone.milestoneId]).toBeUndefined();
    });

    it('should clear isNew and dateModified for new milestones', () => {
      const milestone = createMilestone({ isNew: true, dateModified: true });

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      component.onRowEditSave(milestone);

      expect(milestone.isNew).toBe(false);
      expect(milestone.dateModified).toBeUndefined();
    });

    it('should show success message', () => {
      const milestone = createMilestone();

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Milestone updated. Remember to save the POAM to persist changes.'
        })
      );
    });

    it('should emit milestonesChanged', () => {
      const milestone = createMilestone();

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.poamMilestones = [milestone];
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(emitSpy).toHaveBeenCalledWith(component.poamMilestones);
    });

    it('should call table.cancelRowEdit if table is available', () => {
      const mockTable = { cancelRowEdit: vi.fn(), initRowEdit: vi.fn() };

      vi.spyOn(component, 'table' as any).mockReturnValue(mockTable);

      const milestone = createMilestone();

      component.poam = { status: 'Draft', scheduledCompletionDate: '2026-12-31', extensionDays: 0 };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockTable.cancelRowEdit).toHaveBeenCalledWith(milestone);
    });
  });

  describe('onRowEditCancel', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.milestonesChanged, 'emit');
    });

    it('should remove new milestone from array', () => {
      const newMilestone = createMilestone({ isNew: true, milestoneId: 'temp_1' });

      component.poamMilestones = [newMilestone, createMilestone({ milestoneId: 'ms-2' })];

      component.onRowEditCancel(newMilestone, 0);

      expect(component.poamMilestones.length).toBe(1);
      expect(component.poamMilestones[0].milestoneId).toBe('ms-2');
    });

    it('should restore cloned milestone for existing milestone', () => {
      const milestone = createMilestone({ milestoneId: 'ms-1', milestoneComments: 'Modified' });

      component.poamMilestones = [milestone];
      component.clonedMilestones['ms-1'] = createMilestone({
        milestoneId: 'ms-1',
        milestoneComments: 'Original'
      });

      component.onRowEditCancel(milestone, 0);

      expect(component.poamMilestones[0].milestoneComments).toBe('Original');
      expect(component.poamMilestones[0].editing).toBe(false);
    });

    it('should delete cloned milestone after restore', () => {
      const milestone = createMilestone({ milestoneId: 'ms-1' });

      component.poamMilestones = [milestone];
      component.clonedMilestones['ms-1'] = { ...milestone };

      component.onRowEditCancel(milestone, 0);

      expect(component.clonedMilestones['ms-1']).toBeUndefined();
    });

    it('should just set editing to false if no clone exists', () => {
      const milestone = createMilestone({ milestoneId: 'ms-1', editing: true, isNew: false });

      component.poamMilestones = [milestone];

      component.onRowEditCancel(milestone, 0);

      expect(milestone.editing).toBe(false);
    });

    it('should clear editingMilestoneId', () => {
      const milestone = createMilestone({ isNew: true });

      component.poamMilestones = [milestone];
      component.editingMilestoneId.set(milestone.milestoneId);

      component.onRowEditCancel(milestone, 0);

      expect(component.editingMilestoneId()).toBeNull();
    });

    it('should emit milestonesChanged', () => {
      const milestone = createMilestone({ isNew: true });

      component.poamMilestones = [milestone];

      component.onRowEditCancel(milestone, 0);

      expect(emitSpy).toHaveBeenCalledWith(component.poamMilestones);
    });
  });

  describe('deleteMilestone', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.milestonesChanged, 'emit');
    });

    it('should show confirmation dialog', () => {
      const milestone = createMilestone();

      component.poamMilestones = [milestone];

      component.deleteMilestone(milestone, 0);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Are you sure you want to delete this milestone?',
          header: 'Delete Confirmation'
        })
      );
    });

    it('should remove milestone on accept', () => {
      const milestone1 = createMilestone({ milestoneId: 'ms-1' });
      const milestone2 = createMilestone({ milestoneId: 'ms-2' });

      component.poamMilestones = [milestone1, milestone2];

      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      component.deleteMilestone(milestone1, 0);

      expect(component.poamMilestones.length).toBe(1);
      expect(component.poamMilestones[0].milestoneId).toBe('ms-2');
    });

    it('should emit milestonesChanged on accept', () => {
      const milestone = createMilestone();

      component.poamMilestones = [milestone];

      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      component.deleteMilestone(milestone, 0);

      expect(emitSpy).toHaveBeenCalledWith(component.poamMilestones);
    });

    it('should show success message on accept', () => {
      const milestone = createMilestone();

      component.poamMilestones = [milestone];

      mockConfirmationService.confirm.mockImplementation((config: any) => config.accept());
      component.deleteMilestone(milestone, 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Milestone deleted. Remember to save the POAM to persist changes.'
        })
      );
    });

    it('should not remove milestone if confirmation is not accepted', () => {
      const milestone = createMilestone();

      component.poamMilestones = [milestone];

      component.deleteMilestone(milestone, 0);

      expect(component.poamMilestones.length).toBe(1);
    });
  });

  describe('isChangeFieldsEditable (via validation)', () => {
    it('should be editable when extensionDays > 0', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 10
      };
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'When providing a milestone change date, you must also include milestone change comments.'
        })
      );
    });

    it('should be editable when status is Extension Requested', () => {
      component.poam = {
        status: 'Extension Requested',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'When providing a milestone change date, you must also include milestone change comments.'
        })
      );
    });

    it('should be editable when status is Approved', () => {
      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'When providing a milestone change date, you must also include milestone change comments.'
        })
      );
    });

    it('should not validate change fields when status is Draft with no extensions', () => {
      component.poam = {
        status: 'Draft',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      const milestone = createMilestone({
        milestoneChangeDate: new Date('2026-06-01'),
        milestoneChangeComments: null
      });

      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });
  });

  describe('getEffectiveDeadline (via validateMilestoneChangeFields)', () => {
    it('should use extension deadline when extension days > 0', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2027-02-01'),
        milestoneChangeComments: 'Updated'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 30,
        extensionDeadline: '2027-01-30'
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.stringContaining('extension time')
        })
      );

      vi.useRealTimers();
    });

    it('should use scheduled completion date when no extension', () => {
      vi.useFakeTimers({ now: new Date('2026-03-01') });

      const milestone = createMilestone({
        milestoneChangeDate: new Date('2027-01-15'),
        milestoneChangeComments: 'Updated'
      });

      component.poam = {
        status: 'Approved',
        scheduledCompletionDate: '2026-12-31',
        extensionDays: 0
      };
      component.clonedMilestones[milestone.milestoneId] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: expect.not.stringContaining('extension time')
        })
      );

      vi.useRealTimers();
    });
  });
});
