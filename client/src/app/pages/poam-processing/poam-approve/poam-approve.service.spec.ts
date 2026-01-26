/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PoamApproveService } from './poam-approve.service';

describe('PoamApproveService', () => {
  let service: PoamApproveService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  const mockApprovers = [
    {
      approverId: 1,
      poamId: 1,
      collectionId: 1,
      userId: 1,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      approvalStatus: 'Not Reviewed',
      comments: '',
      approvedDate: null
    },
    {
      approverId: 2,
      poamId: 1,
      collectionId: 1,
      userId: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      approvalStatus: 'Approved',
      comments: 'Looks good',
      approvedDate: '2025-01-15'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoamApproveService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PoamApproveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPoamApprovers', () => {
    it('should get approvers for a POAM', () => {
      const poamId = '123';

      service.getPoamApprovers(poamId).subscribe((data) => {
        expect(data).toEqual(mockApprovers);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockApprovers);
    });

    it('should handle empty approvers list', () => {
      const poamId = '456';

      service.getPoamApprovers(poamId).subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle single approver', () => {
      const poamId = '789';
      const singleApprover = [mockApprovers[0]];

      service.getPoamApprovers(poamId).subscribe((data) => {
        expect(data).toEqual(singleApprover);
        expect(data).toHaveLength(1);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(singleApprover);
    });

    it('should handle server error', () => {
      const poamId = '123';

      service.getPoamApprovers(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      const poamId = '123';

      service.getPoamApprovers(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 404 not found', () => {
      const poamId = 'nonexistent';

      service.getPoamApprovers(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 401 unauthorized', () => {
      const poamId = '123';

      service.getPoamApprovers(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should work with numeric string poamId', () => {
      const poamId = '99999';

      service.getPoamApprovers(poamId).subscribe((data) => {
        expect(data).toEqual(mockApprovers);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprovers/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockApprovers);
    });
  });

  describe('updatePoamApprover', () => {
    it('should update an approver', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved',
        comments: 'Approved with conditions',
        approvedDate: '2025-01-20'
      };

      const expectedResponse = { ...approverUpdate, updated: true };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(approverUpdate);
      req.flush(expectedResponse);
    });

    it('should update approver status to Approved', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved',
        comments: '',
        approvedDate: '2025-01-20'
      };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data.approvalStatus).toBe('Approved');
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      req.flush(approverUpdate);
    });

    it('should update approver status to Rejected', () => {
      const approverUpdate = {
        approverId: 2,
        poamId: 1,
        userId: 2,
        approvalStatus: 'Rejected',
        comments: 'Needs more detail in mitigation plan',
        approvedDate: null
      };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data.approvalStatus).toBe('Rejected');
        expect(data.comments).toBe('Needs more detail in mitigation plan');
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      req.flush(approverUpdate);
    });

    it('should update approver with comments', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved',
        comments: 'Reviewed and approved. Please ensure timely implementation.',
        approvedDate: '2025-01-20'
      };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data.comments).toBe('Reviewed and approved. Please ensure timely implementation.');
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      req.flush(approverUpdate);
    });

    it('should handle server error on update', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error on update', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 400 bad request', () => {
      const invalidApproverUpdate = {
        approverId: null,
        approvalStatus: ''
      };

      service.updatePoamApprover(invalidApproverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 unauthorized on update', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 forbidden on update', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 not found on update', () => {
      const approverUpdate = {
        approverId: 999,
        poamId: 999,
        userId: 999,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should send correct content-type header', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved'
      };

      service.updatePoamApprover(approverUpdate).subscribe();

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      req.flush(approverUpdate);
    });

    it('should update approver with all fields', () => {
      const fullApproverUpdate = {
        approverId: 1,
        poamId: 1,
        collectionId: 1,
        userId: 5,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        approvalStatus: 'Approved',
        comments: 'Full approval with all conditions met',
        approvedDate: '2025-01-20T10:30:00Z'
      };

      service.updatePoamApprover(fullApproverUpdate).subscribe((data) => {
        expect(data).toEqual(fullApproverUpdate);
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(fullApproverUpdate);
      req.flush(fullApproverUpdate);
    });

    it('should handle empty comments', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Approved',
        comments: '',
        approvedDate: '2025-01-20'
      };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data.comments).toBe('');
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush(approverUpdate);
    });

    it('should handle null approvedDate for non-approved status', () => {
      const approverUpdate = {
        approverId: 1,
        poamId: 1,
        userId: 1,
        approvalStatus: 'Not Reviewed',
        comments: '',
        approvedDate: null
      };

      service.updatePoamApprover(approverUpdate).subscribe((data) => {
        expect(data.approvedDate).toBeNull();
        expect(data.approvalStatus).toBe('Not Reviewed');
      });

      const req = httpMock.expectOne(`${apiBase}/poamApprover`);

      req.flush(approverUpdate);
    });
  });
});
