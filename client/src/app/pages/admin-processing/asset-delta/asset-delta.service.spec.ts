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
import { AssetDeltaService } from './asset-delta.service';

describe('AssetDeltaService', () => {
  let service: AssetDeltaService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetDeltaService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AssetDeltaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('upload', () => {
    it('should upload a CSV file to a single collection', () => {
      const mockFile = new File(['col1,col2\nval1,val2'], 'assets.csv', { type: 'text/csv' });
      const collectionId = 1;
      const mockResponse = { success: true, imported: 5 };

      service.upload(mockFile, collectionId).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body).toEqual(mockResponse);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/${collectionId}`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should upload a non-CSV file with correct content type', () => {
      const mockFile = new File(['data'], 'assets.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const collectionId = 2;

      service.upload(mockFile, collectionId).subscribe();

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/${collectionId}`);

      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should report upload progress', () => {
      const mockFile = new File(['test data'], 'assets.csv', { type: 'text/csv' });
      const collectionId = 1;
      const progressEvents: number[] = [];

      service.upload(mockFile, collectionId).subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          progressEvents.push(Math.round((100 * event.loaded) / event.total));
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/${collectionId}`);

      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
      req.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
      req.flush({ success: true });

      expect(progressEvents).toContain(50);
      expect(progressEvents).toContain(100);
    });

    it('should handle client-side ErrorEvent', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      let errorReceived: Error | null = null;

      service.upload(mockFile, 1).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/1`);

      req.error(new ErrorEvent('Network error', { message: 'Network failure' }));

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toContain('Something bad happened');
      consoleSpy.mockRestore();
    });

    it('should handle server-side HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      let errorReceived: Error | null = null;

      service.upload(mockFile, 1).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/1`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toContain('Something bad happened');
      consoleSpy.mockRestore();
    });

    it('should handle 400 bad request for invalid file', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFile = new File(['invalid'], 'bad.txt', { type: 'text/plain' });
      let errorReceived: Error | null = null;

      service.upload(mockFile, 1).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/1`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toContain('Something bad happened');

      consoleSpy.mockRestore();
    });
  });

  describe('uploadToMultipleCollections', () => {
    it('should upload a file to multiple collections', () => {
      const mockFile = new File(['col1,col2\nval1,val2'], 'assets.csv', { type: 'text/csv' });
      const collectionIds = [1, 2, 3];
      const mockResponse = { success: true, collections: 3, imported: 15 };

      service.uploadToMultipleCollections(mockFile, collectionIds).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body).toEqual(mockResponse);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should include collection IDs in form data', () => {
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      const collectionIds = [10, 20, 30];

      service.uploadToMultipleCollections(mockFile, collectionIds).subscribe();

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);
      const formData = req.request.body as FormData;

      expect(formData.get('collectionIds')).toBe(JSON.stringify(collectionIds));
      req.flush({ success: true });
    });

    it('should upload to single collection in array', () => {
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      const collectionIds = [5];

      service.uploadToMultipleCollections(mockFile, collectionIds).subscribe();

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);
      const formData = req.request.body as FormData;

      expect(formData.get('collectionIds')).toBe('[5]');
      req.flush({ success: true });
    });

    it('should handle empty collection array', () => {
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      const collectionIds: number[] = [];

      service.uploadToMultipleCollections(mockFile, collectionIds).subscribe();

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);
      const formData = req.request.body as FormData;

      expect(formData.get('collectionIds')).toBe('[]');
      req.flush({ success: true });
    });

    it('should report upload progress for multiple collections', () => {
      const mockFile = new File(['test data'], 'assets.csv', { type: 'text/csv' });
      const collectionIds = [1, 2];
      let progressReported = false;

      service.uploadToMultipleCollections(mockFile, collectionIds).subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          progressReported = true;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);

      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
      req.flush({ success: true });

      expect(progressReported).toBe(true);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFile = new File(['data'], 'assets.csv', { type: 'text/csv' });
      let errorReceived: Error | null = null;

      service.uploadToMultipleCollections(mockFile, [1, 2]).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/import/assetlist/multiple`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toContain('Something bad happened');
      consoleSpy.mockRestore();
    });
  });

  describe('getAssetDeltaListByCollection', () => {
    it('should fetch asset delta list for a specific collection', () => {
      const collectionId = 1;
      const mockDeltaList = [
        { assetId: 1, assetName: 'Asset1', status: 'added' },
        { assetId: 2, assetName: 'Asset2', status: 'removed' },
        { assetId: 3, assetName: 'Asset3', status: 'modified' }
      ];

      service.getAssetDeltaListByCollection(collectionId).subscribe((data) => {
        expect(data).toEqual(mockDeltaList);
        expect(data.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list/${collectionId}`);

      expect(req.request.method).toBe('GET');
      req.flush(mockDeltaList);
    });

    it('should return empty array for collection with no deltas', () => {
      service.getAssetDeltaListByCollection(99).subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list/99`);

      req.flush([]);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssetDeltaListByCollection(999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('getAssetDeltaList', () => {
    it('should fetch all asset delta list', () => {
      const mockDeltaList = [
        { assetId: 1, assetName: 'Asset1', collectionId: 1, status: 'added' },
        { assetId: 2, assetName: 'Asset2', collectionId: 2, status: 'removed' }
      ];

      service.getAssetDeltaList().subscribe((data) => {
        expect(data).toEqual(mockDeltaList);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list`);

      expect(req.request.method).toBe('GET');
      req.flush(mockDeltaList);
    });

    it('should return empty array when no deltas exist', () => {
      service.getAssetDeltaList().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list`);

      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssetDeltaList().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/list`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getAssetDeltaTeams', () => {
    it('should fetch asset delta teams', () => {
      const mockTeams = [
        { teamId: 1, teamName: 'Team Alpha', deltaCount: 5 },
        { teamId: 2, teamName: 'Team Beta', deltaCount: 3 }
      ];

      service.getAssetDeltaTeams().subscribe((data) => {
        expect(data).toEqual(mockTeams);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/teams`);

      expect(req.request.method).toBe('GET');
      req.flush(mockTeams);
    });

    it('should return empty array when no teams have deltas', () => {
      service.getAssetDeltaTeams().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/teams`);

      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssetDeltaTeams().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/teams`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssetDeltaTeams().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.message).toContain('Something bad happened');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assets/delta/teams`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });
  });
});
