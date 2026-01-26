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
import { AppConfigurationService } from './app-configuration.service';

describe('AppConfigurationService', () => {
  let service: AppConfigurationService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppConfigurationService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AppConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAppConfiguration', () => {
    it('should fetch app configuration', () => {
      const mockConfig = [
        { settingName: 'cat-i_scheduled_completion_max', settingValue: '30' },
        { settingName: 'cat-ii_scheduled_completion_max', settingValue: '180' },
        { settingName: 'cat-iii_scheduled_completion_max', settingValue: '365' }
      ];

      service.getAppConfiguration().subscribe((data) => {
        expect(data).toEqual(mockConfig);
        expect(data.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
    });

    it('should return empty array when no configuration exists', () => {
      service.getAppConfiguration().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      req.flush([]);
    });

    it('should handle configuration with various setting types', () => {
      const mockConfig = [
        { settingName: 'feature_enabled', settingValue: 'true' },
        { settingName: 'max_items', settingValue: '100' },
        { settingName: 'api_url', settingValue: 'https://api.example.com' }
      ];

      service.getAppConfiguration().subscribe((data) => {
        expect(data).toEqual(mockConfig);
        expect(data[0].settingValue).toBe('true');
        expect(data[1].settingValue).toBe('100');
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      req.flush(mockConfig);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppConfiguration().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppConfiguration().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAppConfiguration().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfig`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('putAppConfiguration', () => {
    it('should update app configuration', () => {
      const configToUpdate = [
        { settingName: 'cat-i_scheduled_completion_max', settingValue: '45' },
        { settingName: 'cat-ii_scheduled_completion_max', settingValue: '200' }
      ];
      const mockResponse = { success: true, updated: 2 };

      service.putAppConfiguration(configToUpdate).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(configToUpdate);
      req.flush(mockResponse);
    });

    it('should update single configuration setting', () => {
      const configToUpdate = { settingName: 'feature_flag', settingValue: 'false' };
      const mockResponse = { success: true };

      service.putAppConfiguration(configToUpdate).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(configToUpdate);
      req.flush(mockResponse);
    });

    it('should handle empty configuration update', () => {
      const configToUpdate: any[] = [];
      const mockResponse = { success: true, updated: 0 };

      service.putAppConfiguration(configToUpdate).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      expect(req.request.body).toEqual([]);
      req.flush(mockResponse);
    });

    it('should handle HTTP error on update', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const configToUpdate = { settingName: 'test', settingValue: 'value' };

      service.putAppConfiguration(configToUpdate).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 400 bad request error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidConfig = { invalidField: 'data' };

      service.putAppConfiguration(invalidConfig).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle 403 forbidden error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const configToUpdate = { settingName: 'restricted', settingValue: 'value' };

      service.putAppConfiguration(configToUpdate).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      consoleSpy.mockRestore();
    });

    it('should send configuration with numeric values as strings', () => {
      const configToUpdate = [
        { settingName: 'timeout_ms', settingValue: '5000' },
        { settingName: 'max_retries', settingValue: '3' }
      ];

      service.putAppConfiguration(configToUpdate).subscribe();

      const req = httpMock.expectOne(`${apiBase}/appConfiguration`);

      expect(req.request.body[0].settingValue).toBe('5000');
      expect(req.request.body[1].settingValue).toBe('3');
      req.flush({ success: true });
    });
  });
});
