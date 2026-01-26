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
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';

describe('NessusPluginMappingService', () => {
  let service: NessusPluginMappingService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NessusPluginMappingService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NessusPluginMappingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getIAVTableData', () => {
    it('should fetch IAV table data', () => {
      const mockIAVData = [
        { iavNumber: '2024-A-0001', pluginId: 12345, title: 'Critical Vulnerability' },
        { iavNumber: '2024-A-0002', pluginId: 12346, title: 'High Vulnerability' },
        { iavNumber: '2024-B-0001', pluginId: null, title: 'Unmapped Vulnerability' }
      ];

      service.getIAVTableData().subscribe((data) => {
        expect(data).toEqual(mockIAVData);
        expect(data.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      expect(req.request.method).toBe('GET');
      req.flush(mockIAVData);
    });

    it('should return empty array when no IAV data exists', () => {
      service.getIAVTableData().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.flush([]);
    });

    it('should handle IAV data with various fields', () => {
      const mockIAVData = [
        {
          iavNumber: '2024-A-0001',
          pluginId: 12345,
          title: 'Test Vulnerability',
          severity: 'Critical',
          releaseDate: '2024-01-15',
          affectedProducts: ['Windows Server 2019', 'Windows 10']
        }
      ];

      service.getIAVTableData().subscribe((data) => {
        expect(data[0].iavNumber).toBe('2024-A-0001');
        expect(data[0].affectedProducts.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.flush(mockIAVData);
    });

    it('should handle client-side ErrorEvent', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getIAVTableData().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.error(new ErrorEvent('Network error', { message: 'Network failure' }));

      consoleSpy.mockRestore();
    });

    it('should handle server-side HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getIAVTableData().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getIAVTableData().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });

    it('should handle 403 forbidden error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getIAVTableData().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/iavSummary`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      consoleSpy.mockRestore();
    });
  });

  describe('mapIAVPluginIds', () => {
    it('should map IAV plugin IDs', () => {
      const mappedData = [
        { iavNumber: '2024-A-0001', pluginId: 12345 },
        { iavNumber: '2024-A-0002', pluginId: 12346 }
      ];
      const mockResponse = { success: true, mappedCount: 2 };

      service.mapIAVPluginIds(mappedData).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mappedData);
      req.flush(mockResponse);
    });

    it('should map single IAV plugin ID', () => {
      const mappedData = [{ iavNumber: '2024-B-0001', pluginId: 99999 }];
      const mockResponse = { success: true, mappedCount: 1 };

      service.mapIAVPluginIds(mappedData).subscribe((data) => {
        expect(data.mappedCount).toBe(1);
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      expect(req.request.body.length).toBe(1);
      req.flush(mockResponse);
    });

    it('should handle empty mapping array', () => {
      const mappedData: any[] = [];
      const mockResponse = { success: true, mappedCount: 0 };

      service.mapIAVPluginIds(mappedData).subscribe((data) => {
        expect(data.mappedCount).toBe(0);
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      expect(req.request.body).toEqual([]);
      req.flush(mockResponse);
    });

    it('should handle large batch mapping', () => {
      const mappedData = Array.from({ length: 100 }, (_, i) => ({
        iavNumber: `2024-A-${String(i).padStart(4, '0')}`,
        pluginId: 10000 + i
      }));
      const mockResponse = { success: true, mappedCount: 100 };

      service.mapIAVPluginIds(mappedData).subscribe((data) => {
        expect(data.mappedCount).toBe(100);
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      expect(req.request.body.length).toBe(100);
      req.flush(mockResponse);
    });

    it('should handle mapping with null plugin IDs (unmapping)', () => {
      const mappedData = [
        { iavNumber: '2024-A-0001', pluginId: null },
        { iavNumber: '2024-A-0002', pluginId: null }
      ];
      const mockResponse = { success: true, unmappedCount: 2 };

      service.mapIAVPluginIds(mappedData).subscribe((data) => {
        expect(data.unmappedCount).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      req.flush(mockResponse);
    });

    it('should handle client-side ErrorEvent', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mappedData = [{ iavNumber: '2024-A-0001', pluginId: 12345 }];

      service.mapIAVPluginIds(mappedData).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      req.error(new ErrorEvent('Network error', { message: 'Network failure' }));

      consoleSpy.mockRestore();
    });

    it('should handle server-side HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mappedData = [{ iavNumber: '2024-A-0001', pluginId: 12345 }];

      service.mapIAVPluginIds(mappedData).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 400 bad request for invalid data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidData = [{ invalidField: 'data' }];

      service.mapIAVPluginIds(invalidData).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle 403 forbidden error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mappedData = [{ iavNumber: '2024-A-0001', pluginId: 12345 }];

      service.mapIAVPluginIds(mappedData).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/mapPluginIds`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      consoleSpy.mockRestore();
    });
  });
});
