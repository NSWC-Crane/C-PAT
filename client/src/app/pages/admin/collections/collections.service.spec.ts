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
import { CollectionsService } from './collections.service';
import { mockCollection, mockCollectionList } from '../../../../testing/fixtures/user-fixtures';
import { mockPoamList } from '../../../../testing/fixtures/poam-fixtures';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CollectionsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CollectionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Collection Retrieval Methods', () => {
    it('should get all collections with elevate parameter', () => {
      service.getAllCollections().subscribe((data) => {
        expect(data).toEqual(mockCollectionList);
      });

      const req = httpMock.expectOne(`${apiBase}/collections?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockCollectionList);
    });

    it('should get collections without elevate parameter', () => {
      service.getCollections().subscribe((data) => {
        expect(data).toEqual(mockCollectionList);
      });

      const req = httpMock.expectOne(`${apiBase}/collections`);

      expect(req.request.method).toBe('GET');
      req.flush(mockCollectionList);
    });

    it('should get collection basic list', () => {
      const basicList = mockCollectionList.map((c) => ({
        collectionId: c.collectionId,
        collectionName: c.collectionName
      }));

      service.getCollectionBasicList().subscribe((data) => {
        expect(data).toEqual(basicList);
      });

      const req = httpMock.expectOne(`${apiBase}/collections/basiclist`);

      expect(req.request.method).toBe('GET');
      req.flush(basicList);
    });
  });

  describe('Collection CRUD Operations', () => {
    it('should add a new collection', () => {
      const newCollection = {
        collectionName: 'New Collection',
        description: 'New description'
      };

      service.addCollection(newCollection).subscribe((data) => {
        expect(data).toEqual({ ...mockCollection, ...newCollection });
      });

      const req = httpMock.expectOne(`${apiBase}/collection`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCollection);
      req.flush({ ...mockCollection, ...newCollection });
    });

    it('should update an existing collection', () => {
      const updatedCollection = {
        ...mockCollection,
        collectionName: 'Updated Collection'
      };

      service.updateCollection(updatedCollection).subscribe((data) => {
        expect(data).toEqual(updatedCollection);
      });

      const req = httpMock.expectOne(`${apiBase}/collection`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedCollection);
      req.flush(updatedCollection);
    });

    it('should delete a collection', () => {
      service.deleteCollection(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/collection/1?elevate=true`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Collection Permissions', () => {
    it('should get collection permissions', () => {
      const mockPermissions = [
        { userId: 1, accessLevel: 'admin' },
        { userId: 2, accessLevel: 'viewer' }
      ];

      service.getCollectionPermissions(1).subscribe((data) => {
        expect(data).toEqual(mockPermissions);
      });

      const req = httpMock.expectOne(`${apiBase}/permissions/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);
    });

    it('should get collection permission detail with elevate', () => {
      const mockDetail = [{ userId: 1, accessLevel: 4, direct: null, teamGrants: [], exclusions: [] }];

      service.getCollectionPermissionDetail(1).subscribe((data) => {
        expect(data).toEqual(mockDetail);
      });

      const req = httpMock.expectOne(`${apiBase}/permissions/1/detail?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockDetail);
    });
  });

  describe('Collection team sync', () => {
    it('should get the team sync snapshot with elevate parameter', () => {
      const mockSnapshot = { collectionId: 1, collectionType: 'STIG Manager', originCollectionId: 21, poams: [] };

      service.getTeamSyncSnapshot(1).subscribe((data) => {
        expect(data).toEqual(mockSnapshot);
      });

      const req = httpMock.expectOne(`${apiBase}/collection/1/teamSync?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockSnapshot);
    });

    it('should post team sync changes with elevate parameter', () => {
      const changes = [{ poamId: 10, add: [1], remove: [2] }];
      const mockResponse = { results: [{ poamId: 10, added: [1], removed: [2] }] };

      service.applyTeamSync(1, changes).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/collection/1/teamSync?elevate=true`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ changes });
      req.flush(mockResponse);
    });
  });

  describe('Collection POAMs', () => {
    it('should get POAMs by collection with all related data', () => {
      service.getPoamsByCollection(1).subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne(`${apiBase}/poams/collection/1?milestones=true&labels=true&assignedTeams=true&associatedVulnerabilities=true&teamMitigations=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });

    it('should handle string collection ID', () => {
      service.getPoamsByCollection('1').subscribe((data) => {
        expect(data).toEqual(mockPoamList);
      });

      const req = httpMock.expectOne(`${apiBase}/poams/collection/1?milestones=true&labels=true&assignedTeams=true&associatedVulnerabilities=true&teamMitigations=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoamList);
    });
  });

  describe('Collection Approvers', () => {
    it('should add a collection approver', () => {
      const approver = {
        collectionId: 1,
        userId: 1,
        status: 'pending'
      };

      service.addCollectionAprover(approver).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/collectionApprover`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(approver);
      req.flush({ success: true });
    });

    it('should update a collection approver', () => {
      const approver = {
        collectionId: 1,
        userId: 1,
        status: 'approved'
      };

      service.putCollectionApprover(approver).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/collectionApprover`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(approver);
      req.flush({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and rethrow them', () => {
      const errorResponse = { status: 500, statusText: 'Server Error' };

      service.getCollections().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/collections`);

      req.flush('Internal Server Error', errorResponse);
    });

    it('should handle 404 errors', () => {
      service.getCollectionPermissions(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/permissions/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Caching behavior', () => {
    it('should return cached result for getCollections without a second HTTP request', () => {
      service.getCollections().subscribe();
      httpMock.expectOne(`${apiBase}/collections`).flush(mockCollectionList);

      let result: any;

      service.getCollections().subscribe((data) => {
        result = data;
      });
      httpMock.expectNone(`${apiBase}/collections`);
      expect(result).toEqual(mockCollectionList);
    });

    it('should return cached result for getCollectionBasicList without a second HTTP request', () => {
      const basicList = mockCollectionList.map((c) => ({ collectionId: c.collectionId, collectionName: c.collectionName }));

      service.getCollectionBasicList().subscribe();
      httpMock.expectOne(`${apiBase}/collections/basiclist`).flush(basicList);

      let result: any;

      service.getCollectionBasicList().subscribe((data) => {
        result = data;
      });
      httpMock.expectNone(`${apiBase}/collections/basiclist`);
      expect(result).toEqual(basicList);
    });

    it('should return cached result for getAllCollections without a second HTTP request', () => {
      service.getAllCollections().subscribe();
      httpMock.expectOne(`${apiBase}/collections?elevate=true`).flush(mockCollectionList);

      let result: any;

      service.getAllCollections().subscribe((data) => {
        result = data;
      });
      httpMock.expectNone(`${apiBase}/collections?elevate=true`);
      expect(result).toEqual(mockCollectionList);
    });

    const basicListFixture = () => mockCollectionList.map((c) => ({ collectionId: c.collectionId, collectionName: c.collectionName }));

    const primeAllCaches = () => {
      service.getCollections().subscribe();
      httpMock.expectOne(`${apiBase}/collections`).flush(mockCollectionList);

      service.getAllCollections().subscribe();
      httpMock.expectOne(`${apiBase}/collections?elevate=true`).flush(mockCollectionList);

      service.getCollectionBasicList().subscribe();
      httpMock.expectOne(`${apiBase}/collections/basiclist`).flush(basicListFixture());
    };

    const expectAllCachesRefetched = () => {
      const refreshed: any = {};

      service.getCollections().subscribe((data) => (refreshed.collections = data));
      service.getAllCollections().subscribe((data) => (refreshed.allCollections = data));
      service.getCollectionBasicList().subscribe((data) => (refreshed.basicList = data));

      const basicList = basicListFixture();

      httpMock.expectOne(`${apiBase}/collections`).flush(mockCollectionList);
      httpMock.expectOne(`${apiBase}/collections?elevate=true`).flush(mockCollectionList);
      httpMock.expectOne(`${apiBase}/collections/basiclist`).flush(basicList);

      expect(refreshed.collections).toEqual(mockCollectionList);
      expect(refreshed.allCollections).toEqual(mockCollectionList);
      expect(refreshed.basicList).toEqual(basicList);
    };

    it('should invalidate all caches after addCollection', () => {
      primeAllCaches();

      service.addCollection({ collectionName: 'New' }).subscribe();
      httpMock.expectOne(`${apiBase}/collection`).flush(mockCollection);

      expectAllCachesRefetched();
    });

    it('should invalidate all caches after updateCollection', () => {
      primeAllCaches();

      service.updateCollection(mockCollection).subscribe();
      httpMock.expectOne(`${apiBase}/collection`).flush(mockCollection);

      expectAllCachesRefetched();
    });

    it('should invalidate all caches after deleteCollection', () => {
      primeAllCaches();

      service.deleteCollection(1).subscribe();
      httpMock.expectOne(`${apiBase}/collection/1?elevate=true`).flush({ success: true });

      expectAllCachesRefetched();
    });

    it('should reset cache on HTTP error so next call retries', () => {
      let capturedError: any;

      service.getCollections().subscribe({ error: (error) => (capturedError = error) });
      httpMock.expectOne(`${apiBase}/collections`).flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(capturedError.status).toBe(500);

      let retried: any;

      service.getCollections().subscribe((data) => (retried = data));
      httpMock.expectOne(`${apiBase}/collections`).flush(mockCollectionList);

      expect(retried).toEqual(mockCollectionList);
    });
  });
});
