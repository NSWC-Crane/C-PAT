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
import { PoamMilestonesComponent } from './poam-milestones.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as jasmine from 'jasmine-core';

interface Milestone {
  milestoneId: string;
  milestoneComments: string | null;
  milestoneDate: Date;
  milestoneStatus: string;
  assignedTeamId: number | null;
  isNew?: boolean;
  editing?: boolean;
}

describe('PoamMilestonesComponent', () => {
  let component: PoamMilestonesComponent;
  let fixture: ComponentFixture<PoamMilestonesComponent>;
  let mockPoamService: any;
  let messageService: MessageService;
  let confirmationService: ConfirmationService;

  beforeEach(async () => {
    mockPoamService = {
      addPoamMilestone: jasmine.createSpy('addPoamMilestone').and.returnValue(of({ milestoneId: '123' })),
      updatePoamMilestone: jasmine.createSpy('updatePoamMilestone').and.returnValue(of({})),
      deletePoamMilestone: jasmine.createSpy('deletePoamMilestone').and.returnValue(of({}))
    };

    messageService = jasmine.createSpyObj('MessageService', ['add']);
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    (confirmationService.confirm as jasmine.Spy).and.callFake((options) => {
      if (options.accept) options.accept();
    });

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamMilestonesComponent,
        FormsModule
      ],
      providers: [
        { provide: MessageService, useValue: messageService },
        { provide: ConfirmationService, useValue: confirmationService },
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamMilestonesComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft',
      scheduledCompletionDate: '2023-12-31'
    };
    component.accessLevel = 2;
    component.assignedTeamOptions = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' },
      { assignedTeamId: 2, assignedTeamName: 'Team B' }
    ];
    component.poamMilestones = [];

    component.editingMilestoneId = signal<string | null>(null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new milestone', () => {
    const milestonesSpy = spyOn(component.milestonesChanged, 'emit');
    component.onAddNewMilestone();
    expect(component.poamMilestones.length).toBe(1);
    expect(component.poamMilestones[0].isNew).toBeTruthy();
    expect(milestonesSpy).toHaveBeenCalled();
  });

  it('should get team name correctly', () => {
    const teamName = component.getTeamName(1);
    expect(teamName).toBe('Team A');

    const nonExistentTeam = component.getTeamName(999);
    expect(nonExistentTeam).toBe('');
  });

  it('should validate milestone fields correctly', () => {
    const validMilestone: Milestone = {
      milestoneComments: 'Test comments',
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: 1,
      milestoneId: '123'
    };

    const validateMethodSpy = spyOn<any>(component, 'validateMilestoneFields').and.callThrough();
    component['validateMilestoneFields'](validMilestone);
    expect(validateMethodSpy).toHaveBeenCalled();

    const invalidMilestone: Milestone = { ...validMilestone, milestoneComments: null };
    component['validateMilestoneFields'](invalidMilestone);
    expect(messageService.add).toHaveBeenCalled();
  });

  it('should handle row edit initialization correctly', () => {
    const milestone: Milestone = {
      milestoneId: '123',
      milestoneComments: 'Test',
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: 1
    };

    component.onRowEditInit(milestone);
    expect(milestone.editing).toBeTruthy();
    expect(component.editingMilestoneId()).toBe('123');
    expect(component.clonedMilestones['123']).toEqual(milestone);
  });

  it('should delete a milestone', () => {
    const milestone: Milestone = {
      milestoneId: '123',
      milestoneComments: 'Test',
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: 1
    };

    component.poamMilestones = [milestone];

    const milestonesSpy = spyOn(component.milestonesChanged, 'emit');

    component.deleteMilestone(milestone, 0);
    expect(confirmationService.confirm).toHaveBeenCalled();
    expect(mockPoamService.deletePoamMilestone).toHaveBeenCalledWith('12345', '123', false);
    expect(milestonesSpy).toHaveBeenCalled();
  });

  it('should handle milestone save failure', async () => {
    const milestone: Milestone = {
      milestoneId: '123',
      milestoneComments: 'Test',
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: 1,
      isNew: true
    };

    mockPoamService.addPoamMilestone.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    spyOn<any>(component, 'validateMilestoneFields').and.returnValue(true);
    spyOn<any>(component, 'validateMilestoneDate').and.returnValue(true);

    await component.onRowEditSave(milestone);
    expect(messageService.add).toHaveBeenCalled();
  });

  it('should cancel row editing', () => {
    const originalMilestone: Milestone = {
      milestoneId: '123',
      milestoneComments: 'Original',
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: 1
    };

    const editedMilestone: Milestone = {
      ...originalMilestone,
      milestoneComments: 'Edited',
      editing: true
    };

    component.clonedMilestones['123'] = { ...originalMilestone };
    component.poamMilestones = [editedMilestone];

    component.onRowEditCancel(editedMilestone, 0);

    expect(component.poamMilestones[0].milestoneComments).toBe('Original');
    expect(component.poamMilestones[0].editing).toBeFalsy();
    expect(component.editingMilestoneId()).toBeNull();
  });

  it('should handle date validation correctly', () => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 10);

    const futureMilestone: Milestone = {
      milestoneId: '123',
      milestoneComments: 'Test',
      milestoneDate: validDate,
      milestoneStatus: 'Pending',
      assignedTeamId: 1
    };

    component.poam = {
      ...component.poam,
      scheduledCompletionDate: new Date(validDate.getTime() + 86400000 * 15)
    };

    const result = component['validateMilestoneDate'](futureMilestone);
    expect(result).toBeTruthy();

    const exceededDate = new Date();
    exceededDate.setDate(exceededDate.getDate() + 30);

    const exceededMilestone: Milestone = {
      ...futureMilestone,
      milestoneDate: exceededDate
    };

    const exceededResult = component['validateMilestoneDate'](exceededMilestone);
    expect(exceededResult).toBeFalsy();
    expect(messageService.add).toHaveBeenCalled();
  });
});
