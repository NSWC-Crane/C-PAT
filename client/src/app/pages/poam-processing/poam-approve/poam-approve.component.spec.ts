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
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockActivatedRoute, createMockMessageService, createMockRouter } from '../../../../testing/mocks/service-mocks';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { PoamService } from '../poams.service';
import { PoamApproveComponent } from './poam-approve.component';
import { PoamApproveService } from './poam-approve.service';

describe('PoamApproveComponent', () => {
  let component: PoamApproveComponent;
  let fixture: ComponentFixture<PoamApproveComponent>;
  let mockRouter: any;
  let mockMessageService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockPoamApproveService: any;
  let mockPoamService: any;
  let selectedCollectionSubject: BehaviorSubject<number>;
  let accessLevelSubject: BehaviorSubject<number>;

  const mockUser = {
    userId: 100,
    userName: 'testuser'
  };

  const mockApprovers = [
    {
      userId: 100,
      approvalStatus: 'Not Reviewed',
      approvedDate: '2024-06-15T00:00:00Z',
      comments: 'Pending review'
    },
    {
      userId: 200,
      approvalStatus: 'Approved',
      approvedDate: '2024-06-10T00:00:00Z',
      comments: 'Looks good'
    }
  ];

  const mockPoamResponse = {
    poamId: 42,
    status: 'Draft',
    hqs: true
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    selectedCollectionSubject = new BehaviorSubject<number>(1);
    accessLevelSubject = new BehaviorSubject<number>(0);

    mockRouter = createMockRouter();
    mockMessageService = createMockMessageService();

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject(mockUser),
      payload$: new BehaviorSubject({ lastCollectionAccessedId: 1 }),
      accessLevel$: accessLevelSubject
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockPoamApproveService = {
      getPoamApprovers: vi.fn().mockReturnValue(of(mockApprovers)),
      updatePoamApprover: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockPoamService = {
      getPoam: vi.fn().mockReturnValue(of(mockPoamResponse))
    };

    await TestBed.configureTestingModule({
      imports: [PoamApproveComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute({ poamId: '42' }) },
        { provide: MessageService, useValue: mockMessageService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamApproveService, useValue: mockPoamApproveService },
        { provide: PoamService, useValue: mockPoamService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamApproveComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default property values', () => {
      expect(component.isLoggedIn).toBe(false);
      expect(component.hqsChecked).toBe(false);
      expect(component.displayDialog).toBe(false);
      expect(component.displayConfirmDialog).toBe(false);
      expect(component.confirmDialogMessage).toBe('');
    });

    it('should have approval status options defined', () => {
      expect(component.approvalStatusOptions).toHaveLength(4);
      expect(component.approvalStatusOptions.map((o: any) => o.value)).toEqual(['Not Reviewed', 'False-Positive', 'Approved', 'Rejected']);
    });
  });

  describe('ngOnInit', () => {
    it('should extract poamId from route params', () => {
      fixture.detectChanges();
      expect(component.poamId).toBe('42');
    });

    it('should subscribe to selectedCollection from sharedService', () => {
      fixture.detectChanges();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update selectedCollection when sharedService emits', () => {
      fixture.detectChanges();
      selectedCollectionSubject.next(5);
      expect(component.selectedCollection).toBe(5);
    });

    it('should call setPayload on init', () => {
      fixture.detectChanges();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });
  });

  describe('setPayload', () => {
    it('should set user from payload service', () => {
      fixture.detectChanges();
      expect(component.user).toEqual(mockUser);
    });

    it('should set payload from payload service', () => {
      fixture.detectChanges();
      expect(component.payload).toEqual({ lastCollectionAccessedId: 1 });
    });

    it('should not call getData when accessLevel is 0', () => {
      fixture.detectChanges();
      expect(mockPoamApproveService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should call getData when accessLevel is greater than 0', () => {
      fixture.detectChanges();
      accessLevelSubject.next(2);
      expect(mockPoamApproveService.getPoamApprovers).toHaveBeenCalledWith('42');
    });

    it('should update accessLevel property', () => {
      fixture.detectChanges();
      accessLevelSubject.next(3);
      expect((component as any).accessLevel).toBe(3);
    });
  });

  describe('getData', () => {
    beforeEach(() => {
      fixture.detectChanges();
      accessLevelSubject.next(2);
    });

    it('should call getPoamApprovers and getPoam via forkJoin', () => {
      expect(mockPoamApproveService.getPoamApprovers).toHaveBeenCalledWith('42');
      expect(mockPoamService.getPoam).toHaveBeenCalledWith('42');
    });

    it('should set approvalStatus from matching user approval', () => {
      expect(component.approvalStatus).toBe('Not Reviewed');
    });

    it('should set approvedDate from matching user approval', () => {
      expect(component.dates.approvedDate).toBeDefined();
      expect(component.dates.approvedDate instanceof Date).toBe(true);
    });

    it('should set comments from matching user approval', () => {
      expect(component.comments).toBe('Pending review');
    });

    it('should set hqsChecked from poam response', () => {
      expect(component.hqsChecked).toBe(true);
    });

    it('should set displayDialog to true on success', () => {
      expect(component.displayDialog).toBe(true);
    });

    describe('when user is not an approver', () => {
      beforeEach(() => {
        mockPoamApproveService.getPoamApprovers.mockReturnValue(of([{ userId: 999, approvalStatus: 'Approved', approvedDate: '2024-01-01', comments: 'ok' }]));

        component.displayDialog = false;
        (component as any).getData();
      });

      it('should set approvalStatus to null', () => {
        expect(component.approvalStatus).toBeNull();
      });

      it('should set approvedDate to current date', () => {
        expect(component.dates.approvedDate).toBeDefined();
        expect(component.dates.approvedDate instanceof Date).toBe(true);
      });

      it('should set comments to null', () => {
        expect(component.comments).toBeNull();
      });

      it('should still set hqsChecked from poam response', () => {
        expect(component.hqsChecked).toBe(true);
      });

      it('should still show the dialog', () => {
        expect(component.displayDialog).toBe(true);
      });
    });

    describe('when approvedDate is null in approval', () => {
      beforeEach(() => {
        mockPoamApproveService.getPoamApprovers.mockReturnValue(of([{ userId: 100, approvalStatus: 'Not Reviewed', approvedDate: null, comments: null }]));

        (component as any).getData();
      });

      it('should default approvedDate to current date', () => {
        expect(component.dates.approvedDate instanceof Date).toBe(true);
      });
    });

    describe('when hqs is falsy in poam response', () => {
      beforeEach(() => {
        mockPoamService.getPoam.mockReturnValue(of({ poamId: 42, hqs: 0 }));
        (component as any).getData();
      });

      it('should set hqsChecked to false', () => {
        expect(component.hqsChecked).toBe(false);
      });
    });

    describe('when hqs is undefined in poam response', () => {
      beforeEach(() => {
        mockPoamService.getPoam.mockReturnValue(of({ poamId: 42 }));
        (component as any).getData();
      });

      it('should set hqsChecked to false', () => {
        expect(component.hqsChecked).toBe(false);
      });
    });

    describe('on error', () => {
      beforeEach(() => {
        mockPoamApproveService.getPoamApprovers.mockReturnValue(throwError(() => ({ status: 500, message: 'Server Error' })));

        component.displayDialog = false;
        (component as any).getData();
      });

      it('should display an error message', () => {
        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            summary: 'Error'
          })
        );
      });

      it('should not show the dialog', () => {
        expect(component.displayDialog).toBe(false);
      });
    });
  });

  describe('confirm', () => {
    it('should set confirmDialogMessage', () => {
      component.confirm('Are you sure?');
      expect(component.confirmDialogMessage).toBe('Are you sure?');
    });

    it('should set displayConfirmDialog to true', () => {
      component.confirm('Confirm this action');
      expect(component.displayConfirmDialog).toBe(true);
    });
  });

  describe('cancelApproval', () => {
    it('should set displayDialog to false', () => {
      component.displayDialog = true;
      component.poamId = '42';
      component.cancelApproval();
      expect(component.displayDialog).toBe(false);
    });

    it('should navigate to poam details page', () => {
      component.poamId = '42';
      component.cancelApproval();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });
  });

  describe('submitApprovalData', () => {
    beforeEach(() => {
      fixture.detectChanges();
      accessLevelSubject.next(2);

      component.poamId = '42';
      component.user = mockUser;
      component.approvalStatus = 'Approved';
      component.dates.approvedDate = new Date(2024, 5, 15);
      component.comments = 'Looks good';
      component.hqsChecked = true;
    });

    it('should call updatePoamApprover with correct approval data', () => {
      component.submitApprovalData();

      expect(mockPoamApproveService.updatePoamApprover).toHaveBeenCalledWith({
        poamId: 42,
        userId: 100,
        approvalStatus: 'Approved',
        approvedDate: '2024-06-15',
        comments: 'Looks good',
        hqs: true
      });
    });

    it('should format approvedDate as yyyy-MM-dd', () => {
      component.dates.approvedDate = new Date(2025, 0, 1);
      component.submitApprovalData();

      expect(mockPoamApproveService.updatePoamApprover).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedDate: '2025-01-01'
        })
      );
    });

    it('should convert poamId to number', () => {
      component.poamId = '99';
      component.submitApprovalData();

      expect(mockPoamApproveService.updatePoamApprover).toHaveBeenCalledWith(
        expect.objectContaining({
          poamId: 99
        })
      );
    });

    it('should convert hqsChecked to boolean', () => {
      component.hqsChecked = false;
      component.submitApprovalData();

      expect(mockPoamApproveService.updatePoamApprover).toHaveBeenCalledWith(
        expect.objectContaining({
          hqs: false
        })
      );
    });

    it('should display success message on successful update', () => {
      component.submitApprovalData();

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Approval saved successfully.'
      });
    });

    it('should set displayDialog to false after timeout on success', () => {
      component.displayDialog = true;
      component.submitApprovalData();

      expect(component.displayDialog).toBe(true);

      vi.advanceTimersByTime(1000);

      expect(component.displayDialog).toBe(false);
    });

    it('should navigate to poam details after timeout on success', () => {
      component.submitApprovalData();

      vi.advanceTimersByTime(1000);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/42');
    });

    describe('on error', () => {
      beforeEach(() => {
        mockPoamApproveService.updatePoamApprover.mockReturnValue(throwError(() => ({ status: 500, message: 'Update failed' })));
      });

      it('should display an error message', () => {
        component.submitApprovalData();

        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            summary: 'Error'
          })
        );
      });

      it('should not navigate on error', () => {
        component.submitApprovalData();

        vi.advanceTimersByTime(2000);

        expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      });

      it('should not close dialog on error', () => {
        component.displayDialog = true;
        component.submitApprovalData();

        vi.advanceTimersByTime(2000);

        expect(component.displayDialog).toBe(true);
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      fixture.detectChanges();
      accessLevelSubject.next(2);

      const subscriptionsSpy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscriptionsSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from all payload subscriptions', () => {
      fixture.detectChanges();

      const payloadSubs = (component as any).payloadSubscription;
      const spies = payloadSubs.map((sub: any) => vi.spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();

      spies.forEach((spy: any) => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should handle cleanup when no payload subscriptions exist', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
