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
import { AssetService } from './assets.service';
import { mockAsset, mockLabel } from '../../../testing/fixtures/user-fixtures';

describe('AssetService', () => {
  let service: AssetService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  const mockAssetList = [mockAsset, { ...mockAsset, assetId: 2, assetName: 'Asset 2' }, { ...mockAsset, assetId: 3, assetName: 'Asset 3' }];

  const mockLabelList = [mockLabel, { ...mockLabel, labelId: 2, labelName: 'High Priority' }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AssetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Asset Retrieval Methods', () => {
    it('should get assets by collection', () => {
      service.getAssetsByCollection(1).subscribe((data) => {
        expect(data).toEqual(mockAssetList);
      });

      const req = httpMock.expectOne(`${apiBase}/assets/collection/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockAssetList);
    });

    it('should get labels for a collection', () => {
      service.getLabels(1).subscribe((data) => {
        expect(data).toEqual(mockLabelList);
      });

      const req = httpMock.expectOne(`${apiBase}/labels/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockLabelList);
    });

    it('should get asset labels by asset ID', () => {
      const assetLabels = [{ assetId: 1, labelId: 1, labelName: 'Critical' }];

      service.getAssetLabels(1).subscribe((data) => {
        expect(data).toEqual(assetLabels);
      });

      const req = httpMock.expectOne(`${apiBase}/assetLabels/asset/1`);

      expect(req.request.method).toBe('GET');
      req.flush(assetLabels);
    });

    it('should get collection asset label metrics', () => {
      const metrics = [
        { labelName: 'Critical', count: 5 },
        { labelName: 'High', count: 10 }
      ];

      service.getCollectionAssetLabel(1).subscribe((data) => {
        expect(data).toEqual(metrics);
      });

      const req = httpMock.expectOne(`${apiBase}/metrics/collection/1/assetlabel`);

      expect(req.request.method).toBe('GET');
      req.flush(metrics);
    });
  });

  describe('Asset CRUD Operations', () => {
    it('should post a new asset', () => {
      const newAsset = {
        assetName: 'New Asset',
        collectionId: 1,
        description: 'New asset description'
      };

      service.postAsset(newAsset).subscribe((data) => {
        expect(data).toEqual({ ...mockAsset, ...newAsset });
      });

      const req = httpMock.expectOne(`${apiBase}/asset`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newAsset);
      req.flush({ ...mockAsset, ...newAsset });
    });

    it('should update an existing asset', () => {
      const updatedAsset = { ...mockAsset, assetName: 'Updated Asset' };

      service.updateAsset(updatedAsset).subscribe((data) => {
        expect(data).toEqual(updatedAsset);
      });

      const req = httpMock.expectOne(`${apiBase}/asset`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedAsset);
      req.flush(updatedAsset);
    });

    it('should delete an asset by asset ID', () => {
      service.deleteAssetsByAssetId(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/asset/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should delete assets by POAM ID', () => {
      service.deleteAssetsByPoamId(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/assets/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Asset Label Operations', () => {
    it('should post an asset label', () => {
      const assetLabel = { assetId: 1, labelId: 1 };

      service.postAssetLabel(assetLabel).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/assetLabel`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(assetLabel);
      req.flush({ success: true });
    });

    it('should delete an asset label', () => {
      service.deleteAssetLabel(1, 5).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/assetLabel/asset/1/label/5`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle client-side errors', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Network unavailable'
      });

      service.getAssetsByCollection(1).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assets/collection/1`);

      req.error(errorEvent);
    });

    it('should handle server-side errors', () => {
      service.postAsset({}).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/asset`);

      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle 404 errors', () => {
      service.getAssetLabels(999).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assetLabels/asset/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
