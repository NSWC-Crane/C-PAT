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
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { PoamAttachmentService } from './poam-attachments.service';

describe('PoamAttachmentService', () => {
  let service: PoamAttachmentService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoamAttachmentService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PoamAttachmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAttachmentsByPoamId', () => {
    it('should fetch attachments for a poam', () => {
      const poamId = 123;
      const mockAttachments = [
        { attachmentId: 1, poamId: 123, filename: 'doc1.pdf', contentType: 'application/pdf' },
        { attachmentId: 2, poamId: 123, filename: 'image.png', contentType: 'image/png' }
      ];

      service.getAttachmentsByPoamId(poamId).subscribe((attachments) => {
        expect(attachments).toEqual(mockAttachments);
        expect(attachments.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachments/poam/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockAttachments);
    });

    it('should return empty array when no attachments exist', () => {
      const poamId = 456;

      service.getAttachmentsByPoamId(poamId).subscribe((attachments) => {
        expect(attachments).toEqual([]);
        expect(attachments.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachments/poam/${poamId}`);

      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle error when fetching attachments fails', () => {
      const poamId = 789;
      let errorReceived: any = null;

      service.getAttachmentsByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachments/poam/${poamId}`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(500);
    });

    it('should handle 404 when poam not found', () => {
      const poamId = 999;
      let errorReceived: any = null;

      service.getAttachmentsByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachments/poam/${poamId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(404);
    });
  });

  describe('uploadAttachment', () => {
    it('should upload a file with correct FormData', () => {
      const poamId = 123;
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = { attachmentId: 1, filename: 'test.pdf' };

      service.uploadAttachment(mockFile, poamId).subscribe((event) => {
        if (event instanceof HttpResponse) {
          expect(event.body).toEqual(mockResponse);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      const formData = req.request.body as FormData;

      expect(formData.get('poamId')).toBe('123');
      expect(formData.get('file')).toBeTruthy();

      req.flush(mockResponse);
    });

    it('should report upload progress', () => {
      const poamId = 456;
      const mockFile = new File(['test content'], 'large-file.pdf', { type: 'application/pdf' });
      const events: any[] = [];

      service.uploadAttachment(mockFile, poamId).subscribe((event) => {
        events.push(event);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment`);

      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
      req.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
      req.flush({ attachmentId: 1 });

      expect(events.length).toBeGreaterThan(1);
      const progressEvents = events.filter((e) => e.type === HttpEventType.UploadProgress);

      expect(progressEvents.length).toBe(2);
    });

    it('should handle upload error', () => {
      const poamId = 789;
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      service.uploadAttachment(mockFile, poamId).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment`);

      req.flush('File too large', { status: 413, statusText: 'Payload Too Large' });
    });

    it('should handle unauthorized upload attempt', () => {
      const poamId = 123;
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      service.uploadAttachment(mockFile, poamId).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should preserve original filename in FormData', () => {
      const poamId = 123;
      const originalFilename = 'My Document (Final v2).pdf';
      const mockFile = new File(['content'], originalFilename, { type: 'application/pdf' });

      service.uploadAttachment(mockFile, poamId).subscribe();

      const req = httpMock.expectOne(`${apiBase}/poamAttachment`);
      const formData = req.request.body as FormData;
      const uploadedFile = formData.get('file') as File;

      expect(uploadedFile.name).toBe(originalFilename);

      req.flush({ attachmentId: 1 });
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment as blob', () => {
      const poamId = 123;
      const attachmentId = 456;
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      service.downloadAttachment(poamId, attachmentId).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        expect(blob.size).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`);

      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should handle download of different file types', () => {
      const poamId = 123;
      const attachmentId = 789;
      const mockImageBlob = new Blob(['PNG data'], { type: 'image/png' });

      service.downloadAttachment(poamId, attachmentId).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`);

      req.flush(mockImageBlob);
    });

    it('should handle 404 when attachment not found', () => {
      const poamId = 123;
      const attachmentId = 999;
      let errorReceived: any = null;

      service.downloadAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`);

      req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(404);
    });

    it('should handle forbidden download attempt', () => {
      const poamId = 123;
      const attachmentId = 456;
      let errorReceived: any = null;

      service.downloadAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`);

      req.error(new ProgressEvent('error'), { status: 403, statusText: 'Forbidden' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(403);
    });

    it('should handle server error during download', () => {
      const poamId = 123;
      const attachmentId = 456;
      let errorReceived: any = null;

      service.downloadAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/attachment/${attachmentId}`);

      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(500);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete an attachment', () => {
      const poamId = 123;
      const attachmentId = 456;
      const mockResponse = { success: true };

      service.deleteAttachment(poamId, attachmentId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle 404 when deleting non-existent attachment', () => {
      const poamId = 123;
      const attachmentId = 999;
      let errorReceived: any = null;

      service.deleteAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(404);
    });

    it('should handle forbidden delete attempt', () => {
      const poamId = 123;
      const attachmentId = 456;
      let errorReceived: any = null;

      service.deleteAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(403);
    });

    it('should handle unauthorized delete attempt', () => {
      const poamId = 123;
      const attachmentId = 456;
      let errorReceived: any = null;

      service.deleteAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(401);
    });

    it('should handle server error during delete', () => {
      const poamId = 123;
      const attachmentId = 456;
      let errorReceived: any = null;

      service.deleteAttachment(poamId, attachmentId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived.status).toBe(500);
    });

    it('should return empty response on successful delete', () => {
      const poamId = 123;
      const attachmentId = 456;

      service.deleteAttachment(poamId, attachmentId).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/poamAttachment/poam/${poamId}/${attachmentId}`);

      req.flush(null);
    });
  });
});
