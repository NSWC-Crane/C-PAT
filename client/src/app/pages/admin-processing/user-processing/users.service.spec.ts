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

    it('should delete a team assignment', () => {
      service.deleteTeamAssignment(1, 5).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiBase}/user/1/teams/5?elevate=true`);

      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle client-side errors', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Network unavailable'
      });

      service.getCurrentUser().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/user`);

      req.error(errorEvent);
    });

    it('should handle server-side errors', () => {
      service.getUsers().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/users?elevate=true`);

      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
