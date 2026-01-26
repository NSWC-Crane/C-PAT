import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LabelService } from './label.service';

describe('LabelService', () => {
  let service: LabelService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LabelService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LabelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLabels', () => {
    it('should fetch labels for a collection', () => {
      const collectionId = 1;
      const mockLabels = [
        { labelId: 1, labelName: 'Critical', description: 'Critical issues' },
        { labelId: 2, labelName: 'High', description: 'High priority' }
      ];

      service.getLabels(collectionId).subscribe((labels) => {
        expect(labels).toEqual(mockLabels);
      });

      const req = httpMock.expectOne(`${apiBase}/labels/${collectionId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockLabels);
    });

    it('should handle error when fetching labels fails', () => {
      const collectionId = 1;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getLabels(collectionId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/labels/${collectionId}`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getLabel', () => {
    it('should fetch a single label by id', () => {
      const collectionId = 1;
      const labelId = 5;
      const mockLabel = { labelId: 5, labelName: 'Medium', description: 'Medium priority' };

      service.getLabel(collectionId, labelId).subscribe((label) => {
        expect(label).toEqual(mockLabel);
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockLabel);
    });

    it('should handle error when fetching single label fails', () => {
      const collectionId = 1;
      const labelId = 999;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getLabel(collectionId, labelId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('addLabel', () => {
    it('should create a new label', () => {
      const collectionId = 1;
      const newLabel = { labelName: 'New Label', description: 'A new label' };
      const mockResponse = { labelId: 10, ...newLabel };

      service.addLabel(collectionId, newLabel).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newLabel);
      req.flush(mockResponse);
    });

    it('should handle error when adding label fails', () => {
      const collectionId = 1;
      const newLabel = { labelName: 'New Label' };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.addLabel(collectionId, newLabel).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}`);

      req.flush('Error', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });
  });

  describe('updateLabel', () => {
    it('should update an existing label', () => {
      const collectionId = 1;
      const labelId = 5;
      const updatedLabel = { labelName: 'Updated Label', description: 'Updated description' };
      const mockResponse = { labelId: 5, ...updatedLabel };

      service.updateLabel(collectionId, labelId, updatedLabel).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedLabel);
      req.flush(mockResponse);
    });

    it('should handle error when updating label fails', () => {
      const collectionId = 1;
      const labelId = 5;
      const updatedLabel = { labelName: 'Updated Label' };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.updateLabel(collectionId, labelId, updatedLabel).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('deleteLabel', () => {
    it('should delete a label', () => {
      const collectionId = 1;
      const labelId = 5;
      const mockResponse = { labelId: 5, labelName: 'Deleted', description: 'Deleted label' };

      service.deleteLabel(collectionId, labelId).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when deleting label fails', () => {
      const collectionId = 1;
      const labelId = 999;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteLabel(collectionId, labelId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/label/${collectionId}/${labelId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('handleError', () => {
    it('should handle client-side errors (ErrorEvent)', () => {
      const collectionId = 1;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorEvent = new ErrorEvent('Network error', { message: 'Network failure' });

      service.getLabels(collectionId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
          expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', 'Network failure');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/labels/${collectionId}`);

      req.error(errorEvent);

      consoleSpy.mockRestore();
    });
  });
});
