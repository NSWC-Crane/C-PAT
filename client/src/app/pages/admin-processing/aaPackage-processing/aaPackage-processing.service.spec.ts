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
import { AAPackageService } from './aaPackage-processing.service';
import { AAPackage } from '../../../common/models/aaPackage.model';

describe('AAPackageService', () => {
  let service: AAPackageService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AAPackageService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AAPackageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAAPackages', () => {
    it('should fetch all AA packages', () => {
      const mockPackages: AAPackage[] = [
        { aaPackageId: 1, aaPackage: 'Package Alpha' },
        { aaPackageId: 2, aaPackage: 'Package Beta' },
        { aaPackageId: 3, aaPackage: 'Package Gamma' }
      ];

      service.getAAPackages().subscribe((data) => {
        expect(data).toEqual(mockPackages);
        expect(data.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackages`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPackages);
    });

    it('should return empty array when no packages exist', () => {
      service.getAAPackages().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackages`);

      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAAPackages().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackages`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAAPackages().subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackages`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });
  });

  describe('getAAPackage', () => {
    it('should fetch a single AA package by id', () => {
      const mockPackage: AAPackage = { aaPackageId: 1, aaPackage: 'Package Alpha' };

      service.getAAPackage(1).subscribe((data) => {
        expect(data).toEqual(mockPackage);
        expect(data.aaPackageId).toBe(1);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/1`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPackage);
    });

    it('should fetch package with different id', () => {
      const mockPackage: AAPackage = { aaPackageId: 42, aaPackage: 'Special Package' };

      service.getAAPackage(42).subscribe((data) => {
        expect(data).toEqual(mockPackage);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/42`);

      req.flush(mockPackage);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAAPackage(999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('postAAPackage', () => {
    it('should create a new AA package', () => {
      const newPackage: AAPackage = { aaPackageId: 0, aaPackage: 'New Package' };
      const createdPackage: AAPackage = { aaPackageId: 10, aaPackage: 'New Package' };

      service.postAAPackage(newPackage).subscribe((data) => {
        expect(data).toEqual(createdPackage);
        expect(data.aaPackageId).toBe(10);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPackage);
      req.flush(createdPackage);
    });

    it('should create package with special characters in name', () => {
      const newPackage: AAPackage = { aaPackageId: 0, aaPackage: 'Package (Test) - 2024' };
      const createdPackage: AAPackage = { aaPackageId: 11, aaPackage: 'Package (Test) - 2024' };

      service.postAAPackage(newPackage).subscribe((data) => {
        expect(data.aaPackage).toBe('Package (Test) - 2024');
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush(createdPackage);
    });

    it('should handle 400 bad request error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidPackage: AAPackage = { aaPackageId: 0, aaPackage: '' };

      service.postAAPackage(invalidPackage).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict error for duplicate package', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duplicatePackage: AAPackage = { aaPackageId: 0, aaPackage: 'Existing Package' };

      service.postAAPackage(duplicatePackage).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('putAAPackage', () => {
    it('should update an existing AA package', () => {
      const packageToUpdate: AAPackage = { aaPackageId: 1, aaPackage: 'Updated Package' };

      service.putAAPackage(packageToUpdate).subscribe((data) => {
        expect(data).toEqual(packageToUpdate);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(packageToUpdate);
      req.flush(packageToUpdate);
    });

    it('should update package name only', () => {
      const packageToUpdate: AAPackage = { aaPackageId: 5, aaPackage: 'Renamed Package' };

      service.putAAPackage(packageToUpdate).subscribe((data) => {
        expect(data.aaPackage).toBe('Renamed Package');
        expect(data.aaPackageId).toBe(5);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush(packageToUpdate);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const packageToUpdate: AAPackage = { aaPackageId: 999, aaPackage: 'Nonexistent' };

      service.putAAPackage(packageToUpdate).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict error for duplicate name', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const packageToUpdate: AAPackage = { aaPackageId: 1, aaPackage: 'Already Exists' };

      service.putAAPackage(packageToUpdate).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage`);

      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('deleteAAPackage', () => {
    it('should delete an AA package', () => {
      const mockResponse = { success: true };

      service.deleteAAPackage(1).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle successful deletion with null response', () => {
      service.deleteAAPackage(5).subscribe((data) => {
        expect(data).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/5`);

      req.flush(null);
    });

    it('should handle 404 not found error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAAPackage(999).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/999`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });

    it('should handle 409 conflict when package is in use', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAAPackage(2).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/2`);

      req.flush('Conflict - Package in use', { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });

    it('should handle 403 forbidden error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteAAPackage(3).subscribe({
        next: () => {
          throw new Error('Expected error');
        },
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${apiBase}/aaPackage/3`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      consoleSpy.mockRestore();
    });
  });
});
