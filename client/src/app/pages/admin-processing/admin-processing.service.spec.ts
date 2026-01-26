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
import { AdminProcessingService } from './admin-processing.service';

describe('AdminProcessingService', () => {
  let service: AdminProcessingService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminProcessingService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AdminProcessingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAppInfo', () => {
    it('should fetch app info with elevate parameter', () => {
      const mockAppInfo = {
        version: '1.0.0',
        name: 'C-PAT',
        environment: 'development'
      };

      service.getAppInfo().subscribe((data) => {
        expect(data).toEqual(mockAppInfo);
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockAppInfo);
    });

    it('should return complex app info structure', () => {
      const mockAppInfo = {
        version: '2.5.0',
        name: 'C-PAT',
        environment: 'production',
        features: {
          tenableEnabled: true,
          aiEnabled: false
        },
        buildInfo: {
          date: '2024-01-15',
          commit: 'abc123'
        }
      };

      service.getAppInfo().subscribe((data) => {
        expect(data).toEqual(mockAppInfo);
        expect(data.features.tenableEnabled).toBe(true);
        expect(data.buildInfo.commit).toBe('abc123');
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush(mockAppInfo);
    });

    it('should handle client-side ErrorEvent', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppInfo().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Error:');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.error(new ErrorEvent('Network error', { message: 'Network failure' }));

      consoleSpy.mockRestore();
    });

    it('should handle server-side HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppInfo().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Error Code: 500');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppInfo().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Error Code: 401');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });

    it('should handle 403 forbidden error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppInfo().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Error Code: 403');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      consoleSpy.mockRestore();
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppInfo().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Error Code: 404');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should handle empty response', () => {
      service.getAppInfo().subscribe((data) => {
        expect(data).toEqual({});
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush({});
    });

    it('should handle null response', () => {
      service.getAppInfo().subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/op/appinfo?elevate=true`);

      req.flush(null);
    });
  });
});
