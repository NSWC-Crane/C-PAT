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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PoamLogService } from './poam-log.service';

describe('PoamLogService', () => {
  let service: PoamLogService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [PoamLogService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PoamLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPoamLogByPoamId', () => {
    it('should fetch log entries for a poam', () => {
      const poamId = 123;
      const mockLogs = [
        {
          logId: 1,
          poamId: 123,
          userId: 1,
          action: 'Created',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          logId: 2,
          poamId: 123,
          userId: 2,
          action: 'Updated status',
          timestamp: '2024-01-01T11:00:00Z'
        }
      ];

      service.getPoamLogByPoamId(poamId).subscribe((logs) => {
        expect(logs).toEqual(mockLogs);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockLogs);
    });

    it('should return empty array when no logs exist', () => {
      const poamId = 456;

      service.getPoamLogByPoamId(poamId).subscribe((logs) => {
        expect(logs).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush([]);
    });

    it('should handle single log entry', () => {
      const poamId = 789;
      const mockLog = [
        {
          logId: 1,
          poamId: 789,
          action: 'Created'
        }
      ];

      service.getPoamLogByPoamId(poamId).subscribe((logs) => {
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('Created');
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush(mockLog);
    });

    it('should handle server error and log it', () => {
      const poamId = 123;
      let errorReceived: Error | null = null;

      service.getPoamLogByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle 404 not found error', () => {
      const poamId = 999;
      let errorReceived: Error | null = null;

      service.getPoamLogByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle 401 unauthorized error', () => {
      const poamId = 123;
      let errorReceived: Error | null = null;

      service.getPoamLogByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });

    it('should handle 403 forbidden error', () => {
      const poamId = 123;
      let errorReceived: Error | null = null;

      service.getPoamLogByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });

    it('should handle client-side error', () => {
      const poamId = 123;
      let errorReceived: Error | null = null;

      service.getPoamLogByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.error(new ProgressEvent('error'));

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle logs with various action types', () => {
      const poamId = 123;
      const mockLogs = [
        { logId: 1, action: 'Created' },
        { logId: 2, action: 'Status Changed' },
        { logId: 3, action: 'Milestone Added' },
        { logId: 4, action: 'Approver Assigned' },
        { logId: 5, action: 'Comment Added' }
      ];

      service.getPoamLogByPoamId(poamId).subscribe((logs) => {
        expect(logs.length).toBe(5);
        expect(logs.map((l: any) => l.action)).toEqual(['Created', 'Status Changed', 'Milestone Added', 'Approver Assigned', 'Comment Added']);
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush(mockLogs);
    });

    it('should handle logs with detailed change information', () => {
      const poamId = 123;
      const mockLogs = [
        {
          logId: 1,
          poamId: 123,
          userId: 1,
          userName: 'John Doe',
          action: 'Updated',
          before: 'Draft',
          after: 'Submitted',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      service.getPoamLogByPoamId(poamId).subscribe((logs) => {
        expect(logs[0].before).toBe('Draft');
        expect(logs[0].after).toBe('Submitted');
        expect(logs[0].userName).toBe('John Doe');
      });

      const req = httpMock.expectOne(`${apiBase}/poamLog/${poamId}`);

      req.flush(mockLogs);
    });
  });
});
