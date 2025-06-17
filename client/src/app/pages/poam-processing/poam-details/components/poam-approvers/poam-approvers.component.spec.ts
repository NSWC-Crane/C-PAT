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
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

describe('PoamApproversComponent', () => {
  let component: PoamApproversComponent;
  let fixture: ComponentFixture<PoamApproversComponent>;
  let mockPoamService: any;

  beforeEach(async () => {
    mockPoamService = {
      getPoamApprovers: jasmine.createSpy('getPoamApprovers').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamApproversComponent,
        FormsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamApproversComponent);
    component = fixture.componentInstance;

    component.poamId = '12345';
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

  describe('ngOnInit', () => {
    it('should initialize poamApprovers as empty array if not an array', () => {
      component.poamApprovers = null as any;
      component.ngOnInit();
      expect(component.poamApprovers).toEqual([]);
    });

    it('should keep existing poamApprovers if already an array', () => {
      const existingApprovers = [{ userId: 1, approvalStatus: 'Approved' }];
      component.poamApprovers = existingApprovers;
      component.ngOnInit();
      expect(component.poamApprovers).toBe(existingApprovers);
    });
  });

  describe('getApproverName', () => {
    it('should return the full name of an existing approver', () => {
      const approverName = component.getApproverName(1);
      expect(approverName).toBe('John Doe');
    });

    it('should return empty string for non-existent approver', () => {
      const approverName = component.getApproverName(999);
      expect(approverName).toBe('');
    });
  });

  describe('addApprover', () => {
    it('should add a new approver with default values', async () => {
      const approversChangedSpy = spyOn(component.approversChanged, 'emit');

      await component.addApprover();

      expect(component.poamApprovers.length).toBe(1);
      expect(component.poamApprovers[0]).toEqual({
        userId: null,
        approvalStatus: 'Not Reviewed',
        approvedDate: null,
        comments: '',
        isNew: true
      });
      expect(approversChangedSpy).toHaveBeenCalledWith(component.poamApprovers);
    });

    it('should add new approver at the beginning of the array', async () => {
      component.poamApprovers = [{ userId: 1, approvalStatus: 'Approved', approvedDate: null, comments: '', isNew: false }];

      await component.addApprover();

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].isNew).toBe(true);
      expect(component.poamApprovers[1].userId).toBe(1);
    });
  });

  describe('onApproverChange', () => {
    it('should update approver when valid userId is selected', async () => {
      const approversChangedSpy = spyOn(component.approversChanged, 'emit');
      const approver = {
        userId: 1,
        comments: 'Test comment'
      };

      await component.onApproverChange(approver);

      expect(component.poamApprovers.length).toBe(1);
      expect(component.poamApprovers[0]).toEqual({
        userId: 1,
        fullName: 'John Doe',
        approvalStatus: 'Not Reviewed',
        approvedDate: null,
        comments: 'Test comment',
        isNew: false
      });
      expect(approversChangedSpy).toHaveBeenCalledWith(component.poamApprovers);
    });

    it('should update existing approver in place', async () => {
      component.poamApprovers = [
        { userId: 1, fullName: 'John Doe', approvalStatus: 'Approved', approvedDate: null, comments: 'Old comment', isNew: false }
      ];

      const approver = {
        userId: 1,
        comments: 'Updated comment'
      };

      await component.onApproverChange(approver);

      expect(component.poamApprovers.length).toBe(1);
      expect(component.poamApprovers[0].comments).toBe('Updated comment');
      expect(component.poamApprovers[0].approvalStatus).toBe('Not Reviewed');
    });

    it('should handle approver with no comments', async () => {
      const approver = {
        userId: 2,
        comments: undefined
      };

      await component.onApproverChange(approver);

      expect(component.poamApprovers[0].comments).toBe('');
    });

    it('should not add approver if userId not found in collectionApprovers', async () => {
      const approversChangedSpy = spyOn(component.approversChanged, 'emit');
      const approver = {
        userId: 999,
        comments: 'Test'
      };

      await component.onApproverChange(approver);

      expect(component.poamApprovers.length).toBe(0);
      expect(approversChangedSpy).not.toHaveBeenCalled();
    });

    it('should filter out null userId approvers when adding new one', async () => {
      component.poamApprovers = [
        { userId: null, approvalStatus: 'Not Reviewed', isNew: true },
        { userId: 2, fullName: 'Jane Smith', approvalStatus: 'Approved', isNew: false }
      ];

      const approver = {
        userId: 1,
        comments: 'Test'
      };

      await component.onApproverChange(approver);

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers.find(a => a.userId === null)).toBeUndefined();
    });
  });

  describe('deleteApprover', () => {
    it('should delete approver at specified index', async () => {
      const approversChangedSpy = spyOn(component.approversChanged, 'emit');
      component.poamApprovers = [
        { userId: 1, approvalStatus: 'Approved' },
        { userId: 2, approvalStatus: 'Not Reviewed' },
        { userId: 3, approvalStatus: 'Rejected' }
      ];

      await component.deleteApprover(1);

      expect(component.poamApprovers.length).toBe(2);
      expect(component.poamApprovers[0].userId).toBe(1);
      expect(component.poamApprovers[1].userId).toBe(3);
      expect(approversChangedSpy).toHaveBeenCalledWith(component.poamApprovers);
    });

    it('should handle deletion of last item', async () => {
      component.poamApprovers = [{ userId: 1, approvalStatus: 'Approved' }];

      await component.deleteApprover(0);

      expect(component.poamApprovers.length).toBe(0);
    });
  });

  describe('getPoamApprovers', () => {
    it('should not fetch approvers if poamId is not set', () => {
      component.poamId = null;

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should not fetch approvers if poamId is ADDPOAM', () => {
      component.poamId = 'ADDPOAM';

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).not.toHaveBeenCalled();
    });

    it('should fetch approvers successfully', () => {
      const mockApprovers = [
        { userId: 1, approvalStatus: 'Approved', approvedDate: '2024-01-01', comments: 'Good' },
        { userId: 2, approvalStatus: 'Not Reviewed', approvedDate: null, comments: '' }
      ];
      mockPoamService.getPoamApprovers.and.returnValue(of(mockApprovers));
      const approversChangedSpy = spyOn(component.approversChanged, 'emit');

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).toHaveBeenCalledWith('12345');
      expect(component.poamApprovers).toEqual(mockApprovers);
      expect(approversChangedSpy).toHaveBeenCalledWith(mockApprovers);
    });

    it('should handle error when fetching approvers', () => {
      const messageServiceSpy = spyOn(component['messageService'], 'add');
      mockPoamService.getPoamApprovers.and.returnValue(
        throwError(() => new Error('Test error'))
      );

      component.getPoamApprovers();

      expect(mockPoamService.getPoamApprovers).toHaveBeenCalledWith('12345');
      expect(messageServiceSpy).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load approvers: Test error'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty collectionApprovers', async () => {
      component.collectionApprovers = [];
      const approver = { userId: 1, comments: 'Test' };

      await component.onApproverChange(approver);

      expect(component.poamApprovers.length).toBe(0);
    });

    it('should handle multiple rapid additions', async () => {
      await component.addApprover();
      await component.addApprover();
      await component.addApprover();

      expect(component.poamApprovers.length).toBe(3);
      expect(component.poamApprovers.every(a => a.isNew)).toBe(true);
    });

    it('should maintain order when updating approvers', async () => {
      component.poamApprovers = [
        { userId: 2, fullName: 'Jane Smith', approvalStatus: 'Approved', isNew: false }
      ];

      const approver = { userId: 1, comments: 'New' };
      await component.onApproverChange(approver);

      expect(component.poamApprovers[0].userId).toBe(1);
      expect(component.poamApprovers[1].userId).toBe(2);
    });
  });

  describe('Component Inputs and Outputs', () => {
    it('should have correct default values', () => {
      const newFixture = TestBed.createComponent(PoamApproversComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.accessLevel).toBe(0);
      expect(newComponent.poamApprovers).toEqual([]);
      expect(newComponent.collectionApprovers).toEqual([]);
    });

    it('should emit approversChanged event', (done) => {
      component.approversChanged.subscribe((approvers) => {
        expect(approvers).toEqual(component.poamApprovers);
        done();
      });

      component.addApprover();
    });
  });
});
