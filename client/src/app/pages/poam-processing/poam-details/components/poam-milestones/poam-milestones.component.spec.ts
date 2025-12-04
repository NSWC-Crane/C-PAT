/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { addDays } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Subject } from 'rxjs';
import { Milestone, PoamMilestonesComponent } from './poam-milestones.component';

describe('PoamMilestonesComponent', () => {
  let component: PoamMilestonesComponent;
  let fixture: ComponentFixture<PoamMilestonesComponent>;
  let confirmationService: ConfirmationService;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockTable: jasmine.SpyObj<Table>;

  beforeEach(async () => {
    mockTable = jasmine.createSpyObj('Table', ['initRowEdit', 'cancelRowEdit']);

    mockMessageService = {
      add: jasmine.createSpy('add'),
      addAll: jasmine.createSpy('addAll'),
      clear: jasmine.createSpy('clear'),
      messageObserver: new Subject().asObservable(),
      clearObserver: new Subject().asObservable()
    } as jasmine.SpyObj<MessageService>;

    await TestBed.configureTestingModule({
      imports: [PoamMilestonesComponent, FormsModule],
      providers: [{ provide: MessageService, useValue: mockMessageService }, ConfirmationService, DatePipe]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamMilestonesComponent);
    component = fixture.componentInstance;

    confirmationService = fixture.debugElement.injector.get(ConfirmationService);

    component.poam = {
      status: 'Draft',
      scheduledCompletionDate: addDays(new Date(), 60),
      extensionDays: 0
    };
    component.accessLevel = 4;
    component.assignedTeamOptions = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' },
      { assignedTeamId: 2, assignedTeamName: 'Team B' }
    ];
    component.poamMilestones = [];

    fixture.detectChanges();
    component.table = signal(mockTable);
  });

  beforeEach(() => {
    if (mockMessageService) {
      mockMessageService.add.calls.reset();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize empty array if poamMilestones is not an array', () => {
      component.poamMilestones = null as any;
      component.ngOnInit();
      expect(component.poamMilestones).toEqual([]);
    });

    it('should keep existing milestones array', () => {
      const milestones: Milestone[] = [
        {
          milestoneId: '1',
          milestoneComments: 'Test',
          milestoneDate: new Date(),
          milestoneStatus: 'Pending',
          assignedTeamId: 1
        }
      ];

      component.poamMilestones = milestones;
      component.ngOnInit();
      expect(component.poamMilestones).toBe(milestones);
    });
  });

  describe('onAddNewMilestone', () => {
    it('should add a new milestone with default values', fakeAsync(() => {
      spyOn(component.milestonesChanged, 'emit');
      component.poamMilestones = [];

      component.onAddNewMilestone();
      tick();

      expect(component.poamMilestones.length).toBe(1);
      const newMilestone = component.poamMilestones[0];

      expect(newMilestone.milestoneId).toContain('temp_');
      expect(newMilestone.milestoneComments).toBeNull();
      expect(newMilestone.milestoneStatus).toBe('Pending');
      expect(newMilestone.assignedTeamId).toBeNull();
      expect(newMilestone.isNew).toBe(true);
      expect(newMilestone.editing).toBe(true);
      expect(component.editingMilestoneId()).toBe(newMilestone.milestoneId);
      expect(component.milestonesChanged.emit).toHaveBeenCalledWith(component.poamMilestones);
    }));

    it('should set default date 30 days from now', () => {
      const expectedDate = addDays(new Date(), 30);

      component.onAddNewMilestone();

      const newMilestone = component.poamMilestones[0];
      const milestoneDate = new Date(newMilestone.milestoneDate);

      expect(milestoneDate.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe('onDateChange', () => {
    it('should set dateModified flag for new milestones', () => {
      const milestone: Milestone = {
        milestoneId: 'temp_123',
        milestoneComments: null,
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: null,
        isNew: true
      };

      component.onDateChange(milestone);
      expect(milestone.dateModified).toBe(true);
    });

    it('should not set dateModified flag for existing milestones', () => {
      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1,
        isNew: false
      };

      component.onDateChange(milestone);
      expect(milestone.dateModified).toBeUndefined();
    });
  });

  describe('onRowEditInit', () => {
    it('should initialize editing state', () => {
      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1
      };

      component.onRowEditInit(milestone);

      expect(milestone.editing).toBe(true);
      expect(component.editingMilestoneId()).toBe('123');
      expect(component.clonedMilestones['123']).toEqual(milestone);
    });
  });

  describe('onRowEditSave', () => {
    let milestone: Milestone;

    beforeEach(() => {
      milestone = {
        milestoneId: '123',
        milestoneComments: 'Test milestone',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1,
        editing: true
      };
      component.clonedMilestones['123'] = { ...milestone };
    });

    it('should validate required fields and show error for missing comments', () => {
      milestone.milestoneComments = null;
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Information',
        detail: 'Milestone Comments is a required field.'
      });
    });

    it('should validate required fields and show error for missing date', () => {
      milestone.milestoneDate = null as any;
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Information',
        detail: 'Milestone Date is a required field.'
      });
    });

    it('should validate required fields and show error for missing status', () => {
      milestone.milestoneStatus = '';
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Information',
        detail: 'Milestone Status is a required field.'
      });
    });

    it('should validate required fields and show error for missing team', () => {
      milestone.assignedTeamId = null;
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Information',
        detail: 'Milestone Team is a required field.'
      });
    });

    it('should validate milestone date against scheduled completion date', () => {
      component.poam.scheduledCompletionDate = new Date();
      milestone.milestoneDate = addDays(new Date(), 10);
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Information',
        detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
      });
    });

    it('should validate milestone date with extension time', () => {
      component.poam.scheduledCompletionDate = new Date();
      component.poam.extensionDays = 5;
      milestone.milestoneDate = addDays(new Date(), 10);
      component.onRowEditSave(milestone);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Information',
        detail: 'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.'
      });
    });

    it('should show confirmation dialog for new milestone with unmodified date', () => {
      const confirmSpy = spyOn(confirmationService, 'confirm');

      milestone.isNew = true;
      milestone.dateModified = false;

      component.onRowEditSave(milestone);

      expect(confirmSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'The milestone date has not been modified. Would you like to proceed?',
          header: 'Confirm Milestone Date'
        })
      );
    });

    it('should finalize edit when confirmation is accepted', () => {
      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        config.accept();

        return confirmationService;
      });
      spyOn(component.milestonesChanged, 'emit');
      milestone.isNew = true;
      milestone.dateModified = false;

      component.onRowEditSave(milestone);

      expect(milestone.editing).toBe(false);
      expect(milestone.isNew).toBe(false);
      expect(component.editingMilestoneId()).toBeNull();
      expect(component.milestonesChanged.emit).toHaveBeenCalled();
    });

    describe('onRowEditSave', () => {
      let milestone: Milestone;

      beforeEach(() => {
        milestone = {
          milestoneId: '123',
          milestoneComments: 'Test milestone',
          milestoneDate: new Date(),
          milestoneStatus: 'Pending',
          assignedTeamId: 1,
          editing: true
        };
        component.clonedMilestones['123'] = { ...milestone };
      });

      it('should validate required fields and show error for missing comments', () => {
        milestone.milestoneComments = null;
        component.onRowEditSave(milestone);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Information',
          detail: 'Milestone Comments is a required field.'
        });
      });

      it('should save milestone successfully', () => {
        spyOn(component.milestonesChanged, 'emit');
        component.onRowEditSave(milestone);

        expect(milestone.editing).toBe(false);
        expect(component.editingMilestoneId()).toBeNull();
        expect(component.clonedMilestones['123']).toBeUndefined();
        expect(mockTable.cancelRowEdit).toHaveBeenCalledWith(milestone);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'Milestone updated. Remember to save the POAM to persist changes.'
        });
        expect(component.milestonesChanged.emit).toHaveBeenCalledWith(component.poamMilestones);
      });
    });
  });

  describe('onRowEditCancel', () => {
    it('should remove new milestone on cancel', () => {
      spyOn(component.milestonesChanged, 'emit');
      const newMilestone: Milestone = {
        milestoneId: 'temp_123',
        milestoneComments: null,
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: null,
        isNew: true,
        editing: true
      };

      component.poamMilestones = [newMilestone];

      component.onRowEditCancel(newMilestone, 0);

      expect(component.poamMilestones.length).toBe(0);
      expect(component.editingMilestoneId()).toBeNull();
      expect(component.milestonesChanged.emit).toHaveBeenCalled();
    });

    it('should restore original values for existing milestone', () => {
      spyOn(component.milestonesChanged, 'emit');
      const originalMilestone = {
        milestoneId: '123',
        milestoneComments: 'Original',
        milestoneDate: new Date('2024-01-01'),
        milestoneStatus: 'Pending',
        assignedTeamId: 1,
        editing: false
      };

      const editedMilestone = {
        ...originalMilestone,
        milestoneComments: 'Edited',
        editing: true
      };

      component.clonedMilestones['123'] = originalMilestone;
      component.poamMilestones = [editedMilestone];

      component.onRowEditCancel(editedMilestone, 0);

      expect(component.poamMilestones[0]).toEqual(originalMilestone);
      expect(component.clonedMilestones['123']).toBeUndefined();
      expect(component.editingMilestoneId()).toBeNull();
      expect(component.milestonesChanged.emit).toHaveBeenCalled();
    });
  });

  describe('deleteMilestone', () => {
    it('should show confirmation dialog', () => {
      const confirmSpy = spyOn(confirmationService, 'confirm');
      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1
      };

      component.poamMilestones = [milestone];
      component.deleteMilestone(milestone, 0);

      expect(confirmSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Are you sure you want to delete this milestone?',
          header: 'Delete Confirmation'
        })
      );
    });

    it('should delete milestone when confirmed', () => {
      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        config.accept();

        return confirmationService;
      });
      spyOn(component.milestonesChanged, 'emit');
      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1
      };

      component.poamMilestones = [milestone];

      component.deleteMilestone(milestone, 0);

      expect(component.poamMilestones.length).toBe(0);
      expect(component.milestonesChanged.emit).toHaveBeenCalledWith([]);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Milestone deleted. Remember to save the POAM to persist changes.'
      });
    });

    it('should not delete milestone when rejected', () => {
      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        if (config.reject) config.reject();

        return confirmationService;
      });
      spyOn(component.milestonesChanged, 'emit');
      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: new Date(),
        milestoneStatus: 'Pending',
        assignedTeamId: 1
      };

      component.poamMilestones = [milestone];

      component.deleteMilestone(milestone, 0);

      expect(component.poamMilestones.length).toBe(1);
      expect(component.milestonesChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('getTeamName', () => {
    it('should return team name for valid team ID', () => {
      const teamName = component.getTeamName(1);

      expect(teamName).toBe('Team A');
    });

    it('should return empty string for invalid team ID', () => {
      const teamName = component.getTeamName(999);

      expect(teamName).toBe('');
    });

    it('should return empty string for null team ID', () => {
      const teamName = component.getTeamName(null as any);

      expect(teamName).toBe('');
    });

    it('should return empty string when no team options', () => {
      component.assignedTeamOptions = [];
      const teamName = component.getTeamName(1);

      expect(teamName).toBe('');
    });

    it('should return empty string when team options is null', () => {
      component.assignedTeamOptions = null as any;
      const teamName = component.getTeamName(1);

      expect(teamName).toBe('');
    });
  });

  describe('milestone date validation edge cases', () => {
    it('should allow milestone date when no scheduled completion date', () => {
      spyOn(component.milestonesChanged, 'emit');
      component.poam.scheduledCompletionDate = null;

      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: addDays(new Date(), 100),
        milestoneStatus: 'Pending',
        assignedTeamId: 1,
        editing: true
      };

      component.clonedMilestones['123'] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Milestone updated. Remember to save the POAM to persist changes.'
      });
    });

    it('should handle exact scheduled completion date', () => {
      spyOn(component.milestonesChanged, 'emit');
      const completionDate = new Date('2024-12-31');

      component.poam.scheduledCompletionDate = completionDate;

      const milestone: Milestone = {
        milestoneId: '123',
        milestoneComments: 'Test',
        milestoneDate: completionDate,
        milestoneStatus: 'Pending',
        assignedTeamId: 1,
        editing: true
      };

      component.clonedMilestones['123'] = { ...milestone };

      component.onRowEditSave(milestone);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Milestone updated. Remember to save the POAM to persist changes.'
      });
    });
  });
});
