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
import { UsersService } from './users.service';
import { mockUser, mockUserList } from '../../../../testing/fixtures/user-fixtures';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Retrieval Methods', () => {
    it('should get a user by ID', () => {
      service.getUser(1).subscribe((data) => {
        expect(data).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${apiBase}/user/1?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should get the current user', () => {
      service.getCurrentUser().subscribe((data) => {
        expect(data).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${apiBase}/user`);

      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should get all users', () => {
      service.getUsers().subscribe((data) => {
        expect(data).toEqual(mockUserList);
      });

      const req = httpMock.expectOne(`${apiBase}/users?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush(mockUserList);
    });
  });

  describe('User Creation Methods', () => {
    it('should create (onboard) a user', () => {
      const newUser = { userName: 'jdoe', firstName: 'John', lastName: 'Doe', email: 'jdoe@example.com', accountStatus: 'ACTIVE' };
      const createdUser = { ...mockUser, ...newUser, userId: 99 };

      service.createUser(newUser).subscribe((data) => {
        expect(data).toEqual(createdUser);
      });

      const req = httpMock.expectOne(`${apiBase}/user?elevate=true`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(createdUser);
    });

    it('should surface the original error on duplicate username', () => {
      const newUser = { userName: 'jdoe', accountStatus: 'ACTIVE' };

      service.createUser(newUser).subscribe({
        error: (error) => {
          expect(error.status).toBe(422);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/user?elevate=true`);

      req.flush({ error: 'A user with this username already exists' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('User Update Methods', () => {
    it('should update a user', () => {
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      service.updateUser(updatedUser).subscribe((data) => {
        expect(data).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${apiBase}/user?elevate=true`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedUser);
      req.flush(updatedUser);
    });

    it('should update user last collection', () => {
      const userData = { userId: 1, lastCollectionAccessedId: 5 };

      service.updateUserLastCollection(userData).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/updateLastCollection`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(userData);
      req.flush({ success: true });
    });

    it('should update user theme', () => {
      const themeData = { userId: 1, userTheme: 'dark' };

      service.updateUserTheme(themeData).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/updateTheme`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(themeData);
      req.flush({ ...mockUser, userTheme: 'dark' });
    });

    it('should update user points', () => {
      const pointsData = { userId: 1, points: 100 };

      service.updateUserPoints(pointsData).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/updatePoints?elevate=true`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(pointsData);
      req.flush({ ...mockUser, points: 100 });
    });

    it('should disable a user', () => {
      service.disableUser(1).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/disable?elevate=true`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({ success: true });
    });
  });

  describe('Permission Methods', () => {
    it('should post a new permission', () => {
      const permission = { userId: 1, collectionId: 1, accessLevel: 'admin' };

      service.postPermission(permission).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/permission?elevate=true`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(permission);
      req.flush({ success: true });
    });

    it('should update a permission', () => {
      const permission = { userId: 1, collectionId: 1, accessLevel: 'viewer' };

      service.updatePermission(permission).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/permission?elevate=true`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(permission);
      req.flush({ success: true });
    });

    it('should delete a permission', () => {
      service.deletePermission(1, 10).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/permission/1/10?elevate=true`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should surface the effective access level a post settled on', () => {
      let result: any;

      service.postPermission({ userId: 1, collectionId: 10, accessLevel: 1 }).subscribe((data) => {
        result = data;
      });

      httpMock.expectOne(`${apiBase}/permission?elevate=true`).flush({
        userId: 1,
        collectionId: 10,
        accessLevel: 1,
        effectiveAccessLevel: 3,
        teamFloor: 3,
        coveringTeams: ['Alpha Team']
      });

      expect(result.accessLevel).toBe(1);
      expect(result.effectiveAccessLevel).toBe(3);
      expect(result.coveringTeams).toEqual(['Alpha Team']);
    });

    it('should surface a delete that left team-granted access in place', () => {
      let result: any;

      service.deletePermission(1, 10).subscribe((data) => {
        result = data;
      });

      httpMock.expectOne(`${apiBase}/permission/1/10?elevate=true`).flush({
        userId: 1,
        collectionId: 10,
        removed: false,
        effectiveAccessLevel: 2,
        teamFloor: 2,
        coveringTeams: ['Alpha Team']
      });

      expect(result.removed).toBe(false);
      expect(result.effectiveAccessLevel).toBe(2);
    });

    it('should surface a delete that removed access entirely', () => {
      let result: any;

      service.deletePermission(1, 10).subscribe((data) => {
        result = data;
      });

      httpMock.expectOne(`${apiBase}/permission/1/10?elevate=true`).flush({
        userId: 1,
        collectionId: 10,
        removed: true,
        effectiveAccessLevel: null,
        teamFloor: null,
        coveringTeams: []
      });

      expect(result.removed).toBe(true);
      expect(result.effectiveAccessLevel).toBeNull();
    });
  });

  describe('Team Assignment Methods', () => {
    it('should post a team assignment', () => {
      const assignment = { userId: 1, assignedTeamId: 5, isTeamLead: false };

      service.postTeamAssignment(assignment).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/teams?elevate=true`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(assignment);
      req.flush({ success: true });
    });

    it('should update a team assignment', () => {
      const assignment = { userId: 1, assignedTeamId: 5, isTeamLead: true };

      service.putTeamAssignment(assignment).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/teams?elevate=true`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(assignment);
      req.flush({ success: true });
    });

    it('should delete a team assignment without revoking permissions by default', () => {
      service.deleteTeamAssignment(1, 5).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/teams/5?elevate=true&revokePermissions=false`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should delete a team assignment and revoke permissions when asked', () => {
      service.deleteTeamAssignment(1, 5, true).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/teams/5?elevate=true&revokePermissions=true`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should fetch a grant preview', () => {
      service.getGrantPreview(1, 5, 3).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/teams/5/grantPreview?elevate=true&accessLevel=3`);

      expect(req.request.method).toBe('GET');
      req.flush({ additions: [], updates: [], unchanged: [] });
    });

    it('should fetch a revocation preview', () => {
      service.getRevocationPreview(1, 5).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/teams/5/revocationPreview?elevate=true`);

      expect(req.request.method).toBe('GET');
      req.flush({ removals: [], downgrades: [], unaffected: [] });
    });
  });

  describe('Error Handling', () => {
    it('should propagate client-side errors', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Network unavailable'
      });

      let received: any;

      service.getCurrentUser().subscribe({
        error: (error) => {
          received = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/user`);

      req.error(errorEvent);
      expect(received.error).toBe(errorEvent);
    });

    it('should propagate server errors with status and detail intact', () => {
      let received: any;

      service.getUsers().subscribe({
        error: (error) => {
          received = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/users?elevate=true`);

      req.flush({ error: 'Resource not found.', detail: 'Team assignment not found' }, { status: 404, statusText: 'Not Found' });
      expect(received.status).toBe(404);
      expect(received.error.detail).toBe('Team assignment not found');
    });
  });
});
