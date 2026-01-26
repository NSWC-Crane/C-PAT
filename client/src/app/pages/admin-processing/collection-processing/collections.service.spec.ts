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
});
