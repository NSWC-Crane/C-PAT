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
import { AssignedTeamService } from './assignedTeam-processing.service';

describe('AssignedTeamService', () => {
  let service: AssignedTeamService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssignedTeamService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AssignedTeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAssignedTeams', () => {
    it('should fetch all assigned teams', () => {
      const mockTeams = [
        { assignedTeamId: 1, assignedTeamName: 'Team Alpha', adTeam: 'AD_ALPHA' },
        { assignedTeamId: 2, assignedTeamName: 'Team Beta', adTeam: 'AD_BETA' },
        { assignedTeamId: 3, assignedTeamName: 'Team Gamma', adTeam: null }
      ];

      service.getAssignedTeams().subscribe((data) => {
        expect(data).toEqual(mockTeams);
        expect(data.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams`);

      expect(req.request.method).toBe('GET');
      req.flush(mockTeams);
    });

    it('should return empty array when no teams exist', () => {
      service.getAssignedTeams().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams`);

      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssignedTeams().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getAssignedTeam', () => {
    it('should fetch a single assigned team by id', () => {
      const mockTeam = { assignedTeamId: 1, assignedTeamName: 'Team Alpha', adTeam: 'AD_ALPHA' };

      service.getAssignedTeam(1).subscribe((data) => {
        expect(data).toEqual(mockTeam);
        expect(data.assignedTeamId).toBe(1);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockTeam);
    });

    it('should fetch team without adTeam', () => {
      const mockTeam = { assignedTeamId: 5, assignedTeamName: 'Standalone Team', adTeam: null };

      service.getAssignedTeam(5).subscribe((data) => {
        expect(data).toEqual(mockTeam);
        expect(data.adTeam).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam/5`);

      req.flush(mockTeam);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAssignedTeam(999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('postAssignedTeam', () => {
    it('should create a new assigned team', () => {
      const newTeam = { assignedTeamId: 0, assignedTeamName: 'New Team', adTeam: 'AD_NEW' };
      const createdTeam = { assignedTeamId: 10, assignedTeamName: 'New Team', adTeam: 'AD_NEW' };

      service.postAssignedTeam(newTeam).subscribe((data) => {
        expect(data).toEqual(createdTeam);
        expect(data.assignedTeamId).toBe(10);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTeam);
      req.flush(createdTeam);
    });

    it('should create team without adTeam', () => {
      const newTeam = { assignedTeamId: 0, assignedTeamName: 'Simple Team', adTeam: null };
      const createdTeam = { assignedTeamId: 11, assignedTeamName: 'Simple Team', adTeam: null };

      service.postAssignedTeam(newTeam).subscribe((data) => {
        expect(data).toEqual(createdTeam);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      expect(req.request.body.adTeam).toBeNull();
      req.flush(createdTeam);
    });

    it('should handle 400 bad request error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidTeam = { assignedTeamId: 0, assignedTeamName: '', adTeam: null };

      service.postAssignedTeam(invalidTeam).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict error for duplicate team name', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duplicateTeam = { assignedTeamId: 0, assignedTeamName: 'Existing Team', adTeam: null };

      service.postAssignedTeam(duplicateTeam).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('putAssignedTeam', () => {
    it('should update an existing assigned team', () => {
      const teamToUpdate = { assignedTeamId: 1, assignedTeamName: 'Updated Team', adTeam: 'AD_UPDATED' };
      const updatedTeam = { assignedTeamId: 1, assignedTeamName: 'Updated Team', adTeam: 'AD_UPDATED' };

      service.putAssignedTeam(teamToUpdate).subscribe((data) => {
        expect(data).toEqual(updatedTeam);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(teamToUpdate);
      req.flush(updatedTeam);
    });

    it('should update team name only', () => {
      const teamToUpdate = { assignedTeamId: 2, assignedTeamName: 'Renamed Team', adTeam: 'AD_ORIGINAL' };

      service.putAssignedTeam(teamToUpdate).subscribe((data) => {
        expect(data.assignedTeamName).toBe('Renamed Team');
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      req.flush(teamToUpdate);
    });

    it('should clear adTeam value', () => {
      const teamToUpdate = { assignedTeamId: 3, assignedTeamName: 'Team', adTeam: null };

      service.putAssignedTeam(teamToUpdate).subscribe((data) => {
        expect(data.adTeam).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      req.flush(teamToUpdate);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const teamToUpdate = { assignedTeamId: 999, assignedTeamName: 'Nonexistent', adTeam: null };

      service.putAssignedTeam(teamToUpdate).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeam`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('deleteAssignedTeam', () => {
    it('should delete an assigned team', () => {
      const mockResponse = { success: true };

      service.deleteAssignedTeam(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle successful deletion with empty response', () => {
      service.deleteAssignedTeam(5).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/5`);

      req.flush(null);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAssignedTeam(999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict when team is in use', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAssignedTeam(2).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/2`);

      req.flush('Conflict - Team in use', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('postAssignedTeamPermission', () => {
    it('should create a new team permission', () => {
      const permission = { assignedTeamId: 1, collectionId: 100 };
      const createdPermission = { assignedTeamId: 1, collectionId: 100 };

      service.postAssignedTeamPermission(permission).subscribe((data) => {
        expect(data).toEqual(createdPermission);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(permission);
      req.flush(createdPermission);
    });

    it('should handle multiple permissions for same team', () => {
      const permission = { assignedTeamId: 1, collectionId: 200 };

      service.postAssignedTeamPermission(permission).subscribe((data) => {
        expect(data.assignedTeamId).toBe(1);
        expect(data.collectionId).toBe(200);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions`);

      req.flush(permission);
    });

    it('should handle 400 bad request error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidPermission = { assignedTeamId: -1, collectionId: -1 };

      service.postAssignedTeamPermission(invalidPermission).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict for duplicate permission', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duplicatePermission = { assignedTeamId: 1, collectionId: 100 };

      service.postAssignedTeamPermission(duplicatePermission).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions`);

      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('deleteAssignedTeamPermission', () => {
    it('should delete a team permission', () => {
      const mockResponse = { success: true };

      service.deleteAssignedTeamPermission(1, 100).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions/1/100`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle successful deletion with null response', () => {
      service.deleteAssignedTeamPermission(2, 200).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions/2/200`);

      req.flush(null);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAssignedTeamPermission(999, 999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions/999/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should construct correct URL with both parameters', () => {
      service.deleteAssignedTeamPermission(5, 10).subscribe();

      const req = httpMock.expectOne(`${apiBase}/assignedTeams/permissions/5/10`);

      expect(req.request.url).toContain('/5/10');
      req.flush({ success: true });
    });
  });
});
