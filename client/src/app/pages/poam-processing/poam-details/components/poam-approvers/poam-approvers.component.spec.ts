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
import { PoamApproversComponent } from './poam-approvers.component';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import * as jasmine from 'jasmine-core';

describe('PoamApproversComponent', () => {
  let component: PoamApproversComponent;
  let fixture: ComponentFixture<PoamApproversComponent>;
  let mockPoamService: any;
  let messageService: MessageService;

  beforeEach(async () => {
    mockPoamService = {
      addPoamApprover: jasmine.createSpy('addPoamApprover').and.returnValue(of({})),
      getPoamApprovers: jasmine.createSpy('getPoamApprovers').and.returnValue(of([])),
      deletePoamApprover: jasmine.createSpy('deletePoamApprover').and.returnValue(of({}))
    };

    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamApproversComponent,
        FormsModule
      ],
      providers: [
        { provide: MessageService, useValue: messageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamApproversComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft'
    };
    component.accessLevel = 2;
    component.poamApprovers = [];
    component.collectionApprovers = [
      { userId: 1, fullName: 'John Doe' },
      { userId: 2, fullName: 'Jane Smith' }
    ];
    component.poamService = mockPoamService;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get approver name correctly', () => {
    const approverName = component.getApproverName(1);
    expect(approverName).toBe('John Doe');

    const nonExistentApprover = component.getApproverName(999);
    expect(nonExistentApprover).toBe('');
  });

  it('should add a new approver', () => {
    const approversChangedSpy = spyOn(component.approversChanged, 'emit');
    component.addApprover();
    expect(component.poamApprovers.length).toBe(1);
    expect(component.poamApprovers[0].isNew).toBeTruthy();
    expect(component.poamApprovers[0].approvalStatus).toBe('Not Reviewed');
    expect(approversChangedSpy).toHaveBeenCalled();
  });

  it('should handle approver change when userId is selected', async () => {
    component.addApprover();
    const approver = component.poamApprovers[0];
    approver.userId = 1;

    const confirmSpy = spyOn(component, 'confirmCreateApprover').and.callThrough();
    const approversChangedSpy = spyOn(component.approversChanged, 'emit');

    await component.onApproverChange(approver, 0);

    expect(confirmSpy).toHaveBeenCalledWith(approver);
    expect(approversChangedSpy).toHaveBeenCalled();
  });

  it('should handle approver change when userId is null', async () => {
    component.addApprover();
    const approver = component.poamApprovers[0];
    approver.userId = null;

    const approversChangedSpy = spyOn(component.approversChanged, 'emit');

    await component.onApproverChange(approver, 0);

    expect(component.poamApprovers.length).toBe(0);
    expect(approversChangedSpy).toHaveBeenCalled();
  });

  it('should delete an existing approver', async () => {
    const approver = {
      poamId: '12345',
      userId: 1,
      approvalStatus: 'Not Reviewed',
      comments: ''
    };

    component.poamApprovers = [approver];

    const confirmSpy = spyOn(component, 'confirmDeleteApprover').and.callThrough();
    const approversChangedSpy = spyOn(component.approversChanged, 'emit');

    await component.deleteApprover(approver, 0);

    expect(confirmSpy).toHaveBeenCalledWith(approver);
    expect(approversChangedSpy).toHaveBeenCalled();
  });

  it('should handle delete for a new approver', async () => {
    component.addApprover();
    const approver = component.poamApprovers[0];

    const approversChangedSpy = spyOn(component.approversChanged, 'emit');

    await component.deleteApprover(approver, 0);

    expect(component.poamApprovers.length).toBe(0);
    expect(approversChangedSpy).toHaveBeenCalled();
  });

  it('should create an approver successfully', () => {
    const newApprover = {
      poamId: '12345',
      userId: 1,
      approvalStatus: 'Not Reviewed',
      comments: '',
      isNew: true
    };

    component.confirmCreateApprover(newApprover);

    expect(mockPoamService.addPoamApprover).toHaveBeenCalled();
    expect(mockPoamService.getPoamApprovers).toHaveBeenCalledWith('12345');
  });

  it('should handle error when creating an approver', () => {
    mockPoamService.addPoamApprover.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const newApprover = {
      poamId: '12345',
      userId: 1,
      approvalStatus: 'Not Reviewed',
      comments: '',
      isNew: true
    };

    component.confirmCreateApprover(newApprover);

    expect(messageService.add).toHaveBeenCalled();
  });

  it('should delete an approver successfully', () => {
    const approver = {
      poamId: '12345',
      userId: 1,
      approvalStatus: 'Not Reviewed',
      comments: ''
    };

    component.poamApprovers = [approver];

    component.confirmDeleteApprover(approver);

    expect(mockPoamService.deletePoamApprover).toHaveBeenCalledWith('12345', 1);
  });

  it('should handle error when deleting an approver', () => {
    mockPoamService.deletePoamApprover.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    const approver = {
      poamId: '12345',
      userId: 1,
      approvalStatus: 'Not Reviewed',
      comments: ''
    };

    component.confirmDeleteApprover(approver);

    expect(messageService.add).toHaveBeenCalled();
  });
});
