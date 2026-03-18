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
import { PoamApproversComponent } from './poam-approvers.component';

describe('PoamApproversComponent', () => {
  let component: PoamApproversComponent;
  let fixture: ComponentFixture<PoamApproversComponent>;
  let mockMessageService: any;
  let mockPoamService: any;

  const mockCollectionApprovers = [
    { userId: 10, fullName: 'Alice Approver' },
    { userId: 20, fullName: 'Bob Reviewer' },
    { userId: 30, fullName: 'Carol Manager' }
  ];

  function createApprover(overrides: any = {}): any {
    return {
      userId: 10,
      fullName: 'Alice Approver',
      approvalStatus: 'Not Reviewed',
      approvedDate: null,
      comments: '',
      isNew: false,
      ...overrides
    };
  }

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamService = {
      getPoamApprovers: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PoamApproversComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamApproversComponent);
    component = fixture.componentInstance;
    component.poamId = 100;
    component.accessLevel = 2;
    component.poamApprovers = [];
    component.collectionApprovers = mockCollectionApprovers;
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
      expect(component.poamApprovers).toEqual([]);
    });

    it('should initialize poamApprovers to empty array if not an array', () => {
      component.poamApprovers = null as any;
      component.ngOnInit();
      expect(component.poamApprovers).toEqual([]);
    });

    it('should initialize poamApprovers to empty array if undefined', () => {
      component.poamApprovers = undefined as any;
      component.ngOnInit();
      expect(component.poamApprovers).toEqual([]);
    });

    it('should leave poamApprovers unchanged if already an array', () => {
      const approvers = [createApprover()];

      component.poamApprovers = approvers;
      component.ngOnInit();
      expect(component.poamApprovers).toBe(approvers);
    });

    it('should leave an empty array unchanged', () => {
      component.poamApprovers = [];
      component.ngOnInit();
      expect(component.poamApprovers).toEqual([]);
    });
  });

  describe('getApproverName', () => {
    it('should return full name for a matching userId', () => {
      const result = component.getApproverName(10);

      expect(result).toBe('Alice Approver');
    });

    it('should return full name for another matching userId', () => {
      const result = component.getApproverName(20);

      expect(result).toBe('Bob Reviewer');
    });

    it('should return empty string for non-existent userId', () => {
      const result = component.getApproverName(999);

      expect(result).toBe('');
    });

    it('should return empty string when collectionApprovers is empty', () => {
      component.collectionApprovers = [];
      const result = component.getApproverName(10);

      expect(result).toBe('');
    });
  });

  describe('addApprover', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.approversChanged, 'emit');
    });

    it('should add a new approver to the beginning of the array', async () => {
      const existing = createApprover({ userId: 20 });

      component.poamApprovers = [existing];

      await component.addApprover();

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].isNew).toBe(true);
      expect(component.poamApprovers[1].userId).toBe(20);
    });

    it('should set correct default values on the new approver', async () => {
      await component.addApprover();

      const newApprover = component.poamApprovers[0];

      expect(newApprover.userId).toBeNull();
      expect(newApprover.approvalStatus).toBe('Not Reviewed');
      expect(newApprover.approvedDate).toBeNull();
      expect(newApprover.comments).toBe('');
      expect(newApprover.isNew).toBe(true);
    });

    it('should emit approversChanged', async () => {
      await component.addApprover();
      expect(emitSpy).toHaveBeenCalledWith(component.poamApprovers);
    });

    it('should add to an empty array', async () => {
      component.poamApprovers = [];
      await component.addApprover();
      expect(component.poamApprovers.length).toBe(1);
    });

    it('should add multiple approvers with repeated calls', async () => {
      await component.addApprover();
      await component.addApprover();
      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].isNew).toBe(true);
      expect(component.poamApprovers[1].isNew).toBe(true);
    });
  });

  describe('onApproverChange', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.approversChanged, 'emit');
    });

    it('should update an existing approver in-place when found by userId', async () => {
      const approver = createApprover({ userId: 10, comments: 'Old comment', isNew: true });

      component.poamApprovers = [approver];

      await component.onApproverChange({ userId: 10, comments: 'Updated comment' });

      expect(component.poamApprovers[0].fullName).toBe('Alice Approver');
      expect(component.poamApprovers[0].comments).toBe('Updated comment');
      expect(component.poamApprovers[0].isNew).toBe(false);
      expect(component.poamApprovers[0].approvalStatus).toBe('Not Reviewed');
    });

    it('should add approver to beginning and filter out null userId entries when not found by index', async () => {
      const nullApprover = { userId: null, approvalStatus: 'Not Reviewed', approvedDate: null, comments: '', isNew: true };
      const existingApprover = createApprover({ userId: 20 });

      component.poamApprovers = [nullApprover, existingApprover];

      await component.onApproverChange({ userId: 10 });

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].userId).toBe(10);
      expect(component.poamApprovers[0].fullName).toBe('Alice Approver');
      expect(component.poamApprovers[1].userId).toBe(20);
    });

    it('should emit approversChanged after update', async () => {
      component.poamApprovers = [createApprover({ userId: 10 })];
      await component.onApproverChange({ userId: 10 });
      expect(emitSpy).toHaveBeenCalledWith(component.poamApprovers);
    });

    it('should do nothing if selected approver is not in collectionApprovers', async () => {
      component.poamApprovers = [createApprover()];
      await component.onApproverChange({ userId: 999 });
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should set approvedDate to null on change', async () => {
      const approver = createApprover({ userId: 10, approvedDate: '2026-01-01' });

      component.poamApprovers = [approver];

      await component.onApproverChange({ userId: 10, comments: '' });

      expect(component.poamApprovers[0].approvedDate).toBeNull();
    });

    it('should reset approvalStatus to Not Reviewed on change', async () => {
      const approver = createApprover({ userId: 10, approvalStatus: 'Approved' });

      component.poamApprovers = [approver];

      await component.onApproverChange({ userId: 10, comments: '' });

      expect(component.poamApprovers[0].approvalStatus).toBe('Not Reviewed');
    });

    it('should preserve comments from the approver parameter', async () => {
      component.poamApprovers = [];
      await component.onApproverChange({ userId: 10, comments: 'My notes' });

      expect(component.poamApprovers[0].comments).toBe('My notes');
    });

    it('should default comments to empty string if not provided', async () => {
      component.poamApprovers = [];
      await component.onApproverChange({ userId: 10 });

      expect(component.poamApprovers[0].comments).toBe('');
    });
  });

  describe('deleteApprover', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.approversChanged, 'emit');
    });

    it('should remove the approver at the given index', async () => {
      component.poamApprovers = [createApprover({ userId: 10 }), createApprover({ userId: 20 }), createApprover({ userId: 30 })];

      await component.deleteApprover(1);

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].userId).toBe(10);
      expect(component.poamApprovers[1].userId).toBe(30);
    });

    it('should remove the first approver', async () => {
      component.poamApprovers = [createApprover({ userId: 10 }), createApprover({ userId: 20 })];

      await component.deleteApprover(0);

      expect(component.poamApprovers.length).toBe(1);
      expect(component.poamApprovers[0].userId).toBe(20);
    });

    it('should remove the last approver leaving empty array', async () => {
      component.poamApprovers = [createApprover({ userId: 10 })];

      await component.deleteApprover(0);

      expect(component.poamApprovers.length).toBe(0);
    });

    it('should emit approversChanged after deletion', async () => {
      component.poamApprovers = [createApprover()];

      await component.deleteApprover(0);

      expect(emitSpy).toHaveBeenCalledWith(component.poamApprovers);
    });
  });

  describe('getPoamApprovers', () => {
    it('should not call service if poamId is falsy', () => {
      component.poamId = null;
      component.getPoamApprovers();
      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is "ADDPOAM"', () => {
      component.poamId = 'ADDPOAM';
      component.getPoamApprovers();
      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is undefined', () => {
      component.poamId = undefined;
      component.getPoamApprovers();
      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is 0', () => {
      component.poamId = 0;
      component.getPoamApprovers();
      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is empty string', () => {
      component.poamId = '';
      component.getPoamApprovers();
      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should fetch approvers on success', () => {
      const emitSpy = vi.spyOn(component.approversChanged, 'emit');
      const returnedApprovers = [createApprover({ userId: 10 }), createApprover({ userId: 20 })];

      mockPoamService.getPoamApprovers.mockReturnValue(of(returnedApprovers));

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).toHaveBeenCalledWith(100);
      expect(component.poamApprovers).toBe(returnedApprovers);
      expect(emitSpy).toHaveBeenCalledWith(returnedApprovers);
    });

    it('should replace existing approvers on success', () => {
      component.poamApprovers = [createApprover({ userId: 99 })];
      const newApprovers = [createApprover({ userId: 10 })];

      mockPoamService.getPoamApprovers.mockReturnValue(of(newApprovers));

      component.getPoamApprovers();

      expect(component.poamApprovers).toBe(newApprovers);
    });

    it('should show error message on failure with error.error.detail', () => {
      const error = { error: { detail: 'Server exploded' }, message: 'HTTP error' };

      mockPoamService.getPoamApprovers.mockReturnValue(throwError(() => error));

      component.getPoamApprovers();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load approvers: Server exploded'
        })
      );
    });

    it('should show error message on failure with error.message fallback', () => {
      const error = { message: 'Network failure' };

      mockPoamService.getPoamApprovers.mockReturnValue(throwError(() => error));

      component.getPoamApprovers();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to load approvers: Network failure'
        })
      );
    });

    it('should show generic error message when no detail or message', () => {
      mockPoamService.getPoamApprovers.mockReturnValue(throwError(() => ({})));

      component.getPoamApprovers();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to load approvers: An unexpected error occurred'
        })
      );
    });

    it('should call service with correct poamId', () => {
      component.poamId = 42;
      mockPoamService.getPoamApprovers.mockReturnValue(of([]));

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).toHaveBeenCalledWith(42);
    });
  });
});
