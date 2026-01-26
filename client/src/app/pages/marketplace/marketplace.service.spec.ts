import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketplaceService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MarketplaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getThemes', () => {
    it('should fetch all available themes', () => {
      const mockThemes = [
        { themeId: 1, themeName: 'Dark Mode', price: 100, description: 'A sleek dark theme' },
        { themeId: 2, themeName: 'Ocean Blue', price: 150, description: 'A calming blue theme' },
        { themeId: 3, themeName: 'Forest Green', price: 200, description: 'A nature-inspired theme' }
      ];

      service.getThemes().subscribe((themes) => {
        expect(themes).toEqual(mockThemes);
        expect(themes.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/themes`);

      expect(req.request.method).toBe('GET');
      req.flush(mockThemes);
    });

    it('should return empty array when no themes available', () => {
      service.getThemes().subscribe((themes) => {
        expect(themes).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/themes`);

      req.flush([]);
    });

    it('should handle error when fetching themes fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getThemes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/themes`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('purchaseTheme', () => {
    it('should purchase a theme successfully', () => {
      const userId = 1;
      const themeId = 2;
      const mockResponse = { success: true, message: 'Theme purchased successfully', pointsRemaining: 350 };

      service.purchaseTheme(userId, themeId).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        expect(result.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/purchase`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId, themeId });
      req.flush(mockResponse);
    });

    it('should handle insufficient points error', () => {
      const userId = 1;
      const themeId = 5;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.purchaseTheme(userId, themeId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/purchase`);

      req.flush({ error: 'Insufficient points' }, { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should handle already owned theme error', () => {
      const userId = 1;
      const themeId = 1;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.purchaseTheme(userId, themeId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/purchase`);

      req.flush({ error: 'Theme already owned' }, { status: 409, statusText: 'Conflict' });

      consoleSpy.mockRestore();
    });
  });

  describe('getUserThemes', () => {
    it('should fetch user owned themes', () => {
      const mockUserThemes = [
        { themeId: 1, themeName: 'Dark Mode', purchaseDate: '2024-01-15' },
        { themeId: 3, themeName: 'Forest Green', purchaseDate: '2024-02-20' }
      ];

      service.getUserThemes().subscribe((themes) => {
        expect(themes).toEqual(mockUserThemes);
        expect(themes.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-themes`);

      expect(req.request.method).toBe('GET');
      req.flush(mockUserThemes);
    });

    it('should return empty array when user has no themes', () => {
      service.getUserThemes().subscribe((themes) => {
        expect(themes).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-themes`);

      req.flush([]);
    });

    it('should handle error when fetching user themes fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getUserThemes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-themes`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      consoleSpy.mockRestore();
    });
  });

  describe('getUserPoints', () => {
    it('should fetch user points balance', () => {
      const mockPoints = { userId: 1, points: 500, lastUpdated: '2024-03-01' };

      service.getUserPoints().subscribe((result) => {
        expect(result).toEqual(mockPoints);
        expect(result.points).toBe(500);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-points`);

      expect(req.request.method).toBe('GET');
      req.flush(mockPoints);
    });

    it('should return zero points for new user', () => {
      const mockPoints = { userId: 99, points: 0, lastUpdated: null };

      service.getUserPoints().subscribe((result) => {
        expect(result.points).toBe(0);
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-points`);

      req.flush(mockPoints);
    });

    it('should handle error when fetching user points fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getUserPoints().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-points`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('handleError', () => {
    it('should handle client-side errors (ErrorEvent)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorEvent = new ErrorEvent('Network error', { message: 'Network failure' });

      service.getThemes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
          expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', 'Network failure');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/themes`);

      req.error(errorEvent);

      consoleSpy.mockRestore();
    });

    it('should handle server-side errors with detailed logging', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getUserPoints().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/marketplace/user-points`);

      req.flush({ message: 'Database error' }, { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });
});
