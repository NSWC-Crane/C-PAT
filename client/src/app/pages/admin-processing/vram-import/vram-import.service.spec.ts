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
import { HttpEventType } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VRAMImportService } from './vram-import.service';

describe('VRAMImportService', () => {
  let service: VRAMImportService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VRAMImportService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VRAMImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('upload', () => {
    it('should upload a VRAM file', () => {
      const mockFile = new File(['vram data content'], 'vram-data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const mockResponse = { success: true, recordsImported: 150 };

      service.upload(mockFile).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body).toEqual(mockResponse);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should include file with correct name in form data', () => {
      const mockFile = new File(['data'], 'my-vram-export.xlsx', { type: 'application/vnd.ms-excel' });

      service.upload(mockFile).subscribe();

      const req = httpMock.expectOne(`${apiBase}/import/vram`);
      const formData = req.request.body as FormData;
      const uploadedFile = formData.get('file') as File;

      expect(uploadedFile.name).toBe('my-vram-export.xlsx');
      req.flush({ success: true });
    });

    it('should report upload progress', () => {
      const mockFile = new File(['test data'], 'vram.xlsx', { type: 'application/vnd.ms-excel' });
      const progressEvents: number[] = [];

      service.upload(mockFile).subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          progressEvents.push(Math.round((100 * event.loaded) / event.total));
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.event({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
      req.event({ type: HttpEventType.UploadProgress, loaded: 75, total: 100 });
      req.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
      req.flush({ success: true });

      expect(progressEvents).toContain(25);
      expect(progressEvents).toContain(50);
      expect(progressEvents).toContain(75);
      expect(progressEvents).toContain(100);
    });

    it('should upload CSV file', () => {
      const mockFile = new File(['col1,col2\nval1,val2'], 'vram-data.csv', { type: 'text/csv' });

      service.upload(mockFile).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body.success).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.flush({ success: true, recordsImported: 1 });
    });

    it('should handle large file upload', () => {
      const largeContent = 'x'.repeat(10000);
      const mockFile = new File([largeContent], 'large-vram.xlsx', { type: 'application/vnd.ms-excel' });

      service.upload(mockFile).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body.success).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.flush({ success: true, recordsImported: 5000 });
    });

    it('should handle HTTP error during upload', () => {
      const mockFile = new File(['data'], 'vram.xlsx', { type: 'application/vnd.ms-excel' });

      service.upload(mockFile).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            throw new Error('Expected error');
          }
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 400 bad request for invalid file format', () => {
      const mockFile = new File(['invalid'], 'bad-file.txt', { type: 'text/plain' });

      service.upload(mockFile).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            throw new Error('Expected error');
          }
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.flush('Bad Request - Invalid file format', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 413 payload too large error', () => {
      const mockFile = new File(['data'], 'huge-vram.xlsx', { type: 'application/vnd.ms-excel' });

      service.upload(mockFile).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            throw new Error('Expected error');
          }
        },
        error: (error) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/vram`);

      req.flush('Payload Too Large', { status: 413, statusText: 'Payload Too Large' });
    });
  });

  describe('getVramDataUpdatedDate', () => {
    it('should fetch VRAM data updated date', () => {
      const mockResponse = { updatedDate: '2024-06-15T10:30:00Z' };

      service.getVramDataUpdatedDate().subscribe((data) => {
        expect(data).toEqual(mockResponse);
        expect(data.updatedDate).toBe('2024-06-15T10:30:00Z');
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle null updated date when never imported', () => {
      const mockResponse = { updatedDate: null };

      service.getVramDataUpdatedDate().subscribe((data) => {
        expect(data.updatedDate).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.flush(mockResponse);
    });

    it('should handle response with additional metadata', () => {
      const mockResponse = {
        updatedDate: '2024-06-15T10:30:00Z',
        recordCount: 15000,
        lastImportedBy: 'admin'
      };

      service.getVramDataUpdatedDate().subscribe((data) => {
        expect(data.updatedDate).toBe('2024-06-15T10:30:00Z');
        expect(data.recordCount).toBe(15000);
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.flush(mockResponse);
    });

    it('should handle client-side ErrorEvent', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getVramDataUpdatedDate().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.error(new ErrorEvent('Network error', { message: 'Network failure' }));

      consoleSpy.mockRestore();
    });

    it('should handle server-side HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getVramDataUpdatedDate().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getVramDataUpdatedDate().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getVramDataUpdatedDate().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/iav/vramUpdatedDate`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });
});
