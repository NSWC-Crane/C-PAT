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
import { PoamExtensionService } from './poam-extend.service';

describe('PoamExtensionService', () => {
  let service: PoamExtensionService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  const mockExtension = {
    poamId: 1,
    extensionTimeAllowed: 30,
    extensionJustification: 'Additional time needed due to resource constraints',
    requestedDate: '2025-01-15',
    approvalStatus: 'Pending',
    approvedDate: null,
    approvedBy: null
  };

  const mockExtensionList = [
    mockExtension,
    {
      poamId: 2,
      extensionTimeAllowed: 60,
      extensionJustification: 'Vendor delay in providing patch',
      requestedDate: '2025-01-10',
      approvalStatus: 'Approved',
      approvedDate: '2025-01-12',
      approvedBy: 'Admin User'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoamExtensionService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PoamExtensionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPoamExtension', () => {
    it('should get extension for a POAM', () => {
      const poamId = 1;

      service.getPoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual(mockExtension);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockExtension);
    });

    it('should handle approved extension', () => {
      const poamId = 2;
      const approvedExtension = mockExtensionList[1];

      service.getPoamExtension(poamId).subscribe((data) => {
        expect(data.approvalStatus).toBe('Approved');
        expect(data.approvedDate).toBe('2025-01-12');
        expect(data.approvedBy).toBe('Admin User');
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(approvedExtension);
    });

    it('should handle null response when no extension exists', () => {
      const poamId = 999;

      service.getPoamExtension(poamId).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(null);
    });

    it('should handle empty object response', () => {
      const poamId = 100;

      service.getPoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual({});
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should handle server error', () => {
      const poamId = 1;

      service.getPoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      const poamId = 1;

      service.getPoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 404 not found', () => {
      const poamId = 9999;

      service.getPoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 401 unauthorized', () => {
      const poamId = 1;

      service.getPoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should work with different poamId values', () => {
      const poamId = 12345;

      service.getPoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual(mockExtension);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockExtension);
    });
  });

  describe('putPoamExtension', () => {
    it('should create/update an extension', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 45,
        extensionJustification: 'New justification for extension'
      };

      const expectedResponse = { ...extensionData, created: true };

      service.putPoamExtension(extensionData).subscribe((data) => {
        expect(data).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(extensionData);
      req.flush(expectedResponse);
    });

    it('should update extension time allowed', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 90,
        extensionJustification: 'Extended due to complexity'
      };

      service.putPoamExtension(extensionData).subscribe((data) => {
        expect(data.extensionTimeAllowed).toBe(90);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      req.flush(extensionData);
    });

    it('should update extension justification', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Updated justification with more details about the delay'
      };

      service.putPoamExtension(extensionData).subscribe((data) => {
        expect(data.extensionJustification).toBe('Updated justification with more details about the delay');
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      req.flush(extensionData);
    });

    it('should handle extension with all fields', () => {
      const fullExtensionData = {
        poamId: 1,
        extensionTimeAllowed: 60,
        extensionJustification: 'Complete justification',
        requestedDate: '2025-01-20',
        approvalStatus: 'Pending',
        approvedDate: null,
        approvedBy: null,
        scheduledCompletionDate: '2025-03-20'
      };

      service.putPoamExtension(fullExtensionData).subscribe((data) => {
        expect(data).toEqual(fullExtensionData);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(fullExtensionData);
      req.flush(fullExtensionData);
    });

    it('should handle approved extension update', () => {
      const approvedExtension = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Approved extension',
        approvalStatus: 'Approved',
        approvedDate: '2025-01-21',
        approvedBy: 'Admin User'
      };

      service.putPoamExtension(approvedExtension).subscribe((data) => {
        expect(data.approvalStatus).toBe('Approved');
        expect(data.approvedBy).toBe('Admin User');
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      req.flush(approvedExtension);
    });

    it('should handle rejected extension update', () => {
      const rejectedExtension = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Insufficient justification',
        approvalStatus: 'Rejected',
        approvedDate: '2025-01-21',
        approvedBy: 'Admin User'
      };

      service.putPoamExtension(rejectedExtension).subscribe((data) => {
        expect(data.approvalStatus).toBe('Rejected');
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      expect(req.request.method).toBe('PUT');
      req.flush(rejectedExtension);
    });

    it('should handle server error on update', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Test'
      };

      service.putPoamExtension(extensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error on update', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Test'
      };

      service.putPoamExtension(extensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 400 bad request', () => {
      const invalidExtensionData = {
        poamId: null,
        extensionTimeAllowed: -1
      };

      service.putPoamExtension(invalidExtensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 unauthorized on update', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Test'
      };

      service.putPoamExtension(extensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 forbidden on update', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: 'Test'
      };

      service.putPoamExtension(extensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 not found on update', () => {
      const extensionData = {
        poamId: 9999,
        extensionTimeAllowed: 30,
        extensionJustification: 'Test'
      };

      service.putPoamExtension(extensionData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle empty justification', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 30,
        extensionJustification: ''
      };

      service.putPoamExtension(extensionData).subscribe((data) => {
        expect(data.extensionJustification).toBe('');
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush(extensionData);
    });

    it('should handle zero extension time', () => {
      const extensionData = {
        poamId: 1,
        extensionTimeAllowed: 0,
        extensionJustification: 'No additional time needed'
      };

      service.putPoamExtension(extensionData).subscribe((data) => {
        expect(data.extensionTimeAllowed).toBe(0);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension`);

      req.flush(extensionData);
    });
  });

  describe('deletePoamExtension', () => {
    it('should delete an extension', () => {
      const poamId = 1;

      service.deletePoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual({ deleted: true });
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });

    it('should handle successful deletion with empty response', () => {
      const poamId = 2;

      service.deletePoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual({});
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should handle successful deletion with null response', () => {
      const poamId = 3;

      service.deletePoamExtension(poamId).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle server error on delete', () => {
      const poamId = 1;

      service.deletePoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error on delete', () => {
      const poamId = 1;

      service.deletePoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.error(new ProgressEvent('Network error'));
    });

    it('should handle 404 not found on delete', () => {
      const poamId = 9999;

      service.deletePoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 401 unauthorized on delete', () => {
      const poamId = 1;

      service.deletePoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 forbidden on delete', () => {
      const poamId = 1;

      service.deletePoamExtension(poamId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should work with different poamId values', () => {
      const poamId = 54321;

      service.deletePoamExtension(poamId).subscribe((data) => {
        expect(data).toEqual({ deleted: true });
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });

    it('should return confirmation message on successful delete', () => {
      const poamId = 1;
      const deleteResponse = { message: 'Extension deleted successfully', poamId: 1 };

      service.deletePoamExtension(poamId).subscribe((data) => {
        expect(data.message).toBe('Extension deleted successfully');
        expect(data.poamId).toBe(1);
      });

      const req = httpMock.expectOne(`${apiBase}/poamExtension/${poamId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });
  });
});
