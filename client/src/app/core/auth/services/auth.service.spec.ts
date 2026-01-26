import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockOidcSecurityService: any;
  let mockUsersService: any;
  let mockRouter: any;

  const mockUserData = {
    userId: 1,
    userName: 'testuser',
    email: 'test@example.com',
    permissions: [{ accessLevel: 2 }, { accessLevel: 4 }, { accessLevel: 1 }]
  };

  const mockAuthResultsBothAuthenticated = [
    { configId: 'stigman', isAuthenticated: true },
    { configId: 'cpat', isAuthenticated: true }
  ];

  const mockAuthResultsStigmanOnly = [
    { configId: 'stigman', isAuthenticated: true },
    { configId: 'cpat', isAuthenticated: false }
  ];

  const mockAuthResultsNoneAuthenticated = [
    { configId: 'stigman', isAuthenticated: false },
    { configId: 'cpat', isAuthenticated: false }
  ];

  function createService() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: OidcSecurityService, useValue: mockOidcSecurityService }, { provide: UsersService, useValue: mockUsersService }, { provide: Router, useValue: mockRouter }]
    });

    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    mockOidcSecurityService = {
      checkAuthMultiple: vi.fn().mockReturnValue(of(mockAuthResultsNoneAuthenticated)),
      getAccessToken: vi.fn().mockReturnValue(of('mock-token')),
      isAuthenticated: vi.fn().mockReturnValue(of(true)),
      authorize: vi.fn(),
      logoff: vi.fn().mockReturnValue(of(undefined))
    };

    mockUsersService = {
      getCurrentUser: vi.fn().mockReturnValue(of(mockUserData))
    };

    mockRouter = {
      navigateByUrl: vi.fn()
    };

    sessionStorage.clear();
    service = createService();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have null user initially', () =>
      new Promise<void>((resolve) => {
        service.user$.pipe(take(1)).subscribe((user) => {
          expect(user).toBeNull();
          resolve();
        });
      }));

    it('should have access level 0 initially', () =>
      new Promise<void>((resolve) => {
        service.accessLevel$.pipe(take(1)).subscribe((level) => {
          expect(level).toBe(0);
          resolve();
        });
      }));

    it('should have both auth states false initially', () =>
      new Promise<void>((resolve) => {
        service.authState$.pipe(take(1)).subscribe((state) => {
          expect(state.isAuthenticatedStigman).toBe(false);
          expect(state.isAuthenticatedCpat).toBe(false);
          resolve();
        });
      }));
  });

  describe('getAccessToken', () => {
    it('should return access token for cpat', () => {
      const token = 'test-access-token';

      mockOidcSecurityService.getAccessToken.mockReturnValue(of(token));

      service.getAccessToken('cpat').subscribe((result) => {
        expect(result).toBe(token);
      });

      expect(mockOidcSecurityService.getAccessToken).toHaveBeenCalledWith('cpat');
    });

    it('should return token for stigman', () => {
      const token = 'stigman-token';

      mockOidcSecurityService.getAccessToken.mockReturnValue(of(token));

      service.getAccessToken('stigman').subscribe((result) => {
        expect(result).toBe(token);
      });

      expect(mockOidcSecurityService.getAccessToken).toHaveBeenCalledWith('stigman');
    });

    it('should throw error when token is null', () => {
      mockOidcSecurityService.getAccessToken.mockReturnValue(of(null));

      service.getAccessToken('cpat').subscribe({
        error: (err) => {
          expect(err.message).toContain('Access token not available');
        }
      });
    });

    it('should throw error when token is empty', () => {
      mockOidcSecurityService.getAccessToken.mockReturnValue(of(''));

      service.getAccessToken('cpat').subscribe({
        error: (err) => {
          expect(err.message).toContain('Access token not available');
        }
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      mockOidcSecurityService.isAuthenticated.mockReturnValue(of(true));

      service.isAuthenticated('cpat').subscribe((result) => {
        expect(result).toBe(true);
      });

      expect(mockOidcSecurityService.isAuthenticated).toHaveBeenCalledWith('cpat');
    });

    it('should return false when not authenticated', () => {
      mockOidcSecurityService.isAuthenticated.mockReturnValue(of(false));

      service.isAuthenticated('stigman').subscribe((result) => {
        expect(result).toBe(false);
      });

      expect(mockOidcSecurityService.isAuthenticated).toHaveBeenCalledWith('stigman');
    });
  });

  describe('getUserData', () => {
    it('should fetch current user from UsersService', () => {
      service.getUserData().subscribe((user) => {
        expect(user).toEqual(mockUserData);
      });

      expect(mockUsersService.getCurrentUser).toHaveBeenCalled();
    });

    it('should return user with permissions array', () => {
      const userWithPermissions = { ...mockUserData, permissions: [{ accessLevel: 5 }] };

      mockUsersService.getCurrentUser.mockReturnValue(of(userWithPermissions));

      service.getUserData().subscribe((user) => {
        expect(user.permissions).toHaveLength(1);
        expect(user.permissions[0].accessLevel).toBe(5);
      });
    });
  });

  describe('login', () => {
    it('should call authorize with cpat', () => {
      service.login('cpat');
      expect(mockOidcSecurityService.authorize).toHaveBeenCalledWith('cpat');
    });

    it('should call authorize with stigman', () => {
      service.login('stigman');
      expect(mockOidcSecurityService.authorize).toHaveBeenCalledWith('stigman');
    });
  });

  describe('logout', () => {
    it('should logoff from stigman first then cpat', () => {
      service.logout().subscribe(() => {
        expect(mockOidcSecurityService.logoff).toHaveBeenCalledWith('stigman', undefined);
        expect(mockOidcSecurityService.logoff).toHaveBeenCalledWith('cpat', undefined);
      });
    });

    it('should reset auth state after logout', () =>
      new Promise<void>((resolve) => {
        service.logout().subscribe(() => {
          service.authState$.pipe(take(1)).subscribe((state) => {
            expect(state.isAuthenticatedStigman).toBe(false);
            expect(state.isAuthenticatedCpat).toBe(false);
            resolve();
          });
        });
      }));

    it('should reset user to null after logout', () =>
      new Promise<void>((resolve) => {
        service.logout().subscribe(() => {
          service.user$.pipe(take(1)).subscribe((user) => {
            expect(user).toBeNull();
            resolve();
          });
        });
      }));

    it('should reset access level to 0 after logout', () =>
      new Promise<void>((resolve) => {
        service.logout().subscribe(() => {
          service.accessLevel$.pipe(take(1)).subscribe((level) => {
            expect(level).toBe(0);
            resolve();
          });
        });
      }));

    it('should handle logout errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockOidcSecurityService.logoff.mockReturnValue(throwError(() => new Error('Logout failed')));
      let nextCalled = false;
      let errorCalled = false;

      service.logout().subscribe({
        next: (result) => {
          nextCalled = true;
          expect(result).toBeUndefined();
        },
        error: () => {
          errorCalled = true;
        }
      });

      expect(nextCalled).toBe(true);
      expect(errorCalled).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('clearValidationFailure', () => {
    it('should remove audience-validation-failed from sessionStorage', () => {
      sessionStorage.setItem('audience-validation-failed', 'true');
      expect(sessionStorage.getItem('audience-validation-failed')).toBe('true');

      service.clearValidationFailure();

      expect(sessionStorage.getItem('audience-validation-failed')).toBeNull();
    });

    it('should not throw when key does not exist', () => {
      expect(() => service.clearValidationFailure()).not.toThrow();
    });
  });

  describe('handleAuthFlow with different auth states', () => {
    it('should trigger stigman login when neither authenticated', () =>
      new Promise<void>((resolve) => {
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsNoneAuthenticated));
        mockOidcSecurityService.authorize.mockClear();

        service = createService();

        setTimeout(() => {
          expect(mockOidcSecurityService.authorize).toHaveBeenCalledWith('stigman');
          resolve();
        }, 10);
      }));

    it('should trigger cpat login when only stigman authenticated', () =>
      new Promise<void>((resolve) => {
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsStigmanOnly));
        mockOidcSecurityService.authorize.mockClear();

        service = createService();

        setTimeout(() => {
          expect(mockOidcSecurityService.authorize).toHaveBeenCalledWith('cpat');
          resolve();
        }, 10);
      }));

    it('should not trigger login when both authenticated', () =>
      new Promise<void>((resolve) => {
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsBothAuthenticated));
        mockOidcSecurityService.authorize.mockClear();

        service = createService();

        setTimeout(() => {
          expect(mockOidcSecurityService.authorize).not.toHaveBeenCalled();
          resolve();
        }, 10);
      }));
  });

  describe('initializeAuth skips on error paths', () => {
    it('should skip auth on 401 page', () =>
      new Promise<void>((resolve) => {
        const originalLocation = globalThis.location;

        Object.defineProperty(globalThis, 'location', {
          value: { pathname: '/401' },
          writable: true,
          configurable: true
        });

        mockOidcSecurityService.checkAuthMultiple.mockClear();
        service = createService();

        setTimeout(() => {
          expect(mockOidcSecurityService.checkAuthMultiple).not.toHaveBeenCalled();
          Object.defineProperty(globalThis, 'location', {
            value: originalLocation,
            writable: true,
            configurable: true
          });
          resolve();
        }, 10);
      }));

    it('should skip auth on not-activated page', () =>
      new Promise<void>((resolve) => {
        const originalLocation = globalThis.location;

        Object.defineProperty(globalThis, 'location', {
          value: { pathname: '/not-activated' },
          writable: true,
          configurable: true
        });

        mockOidcSecurityService.checkAuthMultiple.mockClear();
        service = createService();

        setTimeout(() => {
          expect(mockOidcSecurityService.checkAuthMultiple).not.toHaveBeenCalled();
          Object.defineProperty(globalThis, 'location', {
            value: originalLocation,
            writable: true,
            configurable: true
          });
          resolve();
        }, 10);
      }));
  });

  describe('initializeAuth redirect handling', () => {
    it('should redirect when both auth complete and redirect URL stored', () =>
      new Promise<void>((resolve) => {
        sessionStorage.setItem('auth-redirect-url', '/poams/123');
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsBothAuthenticated));
        mockUsersService.getCurrentUser.mockReturnValue(of(mockUserData));

        service = createService();

        setTimeout(() => {
          expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poams/123');
          expect(sessionStorage.getItem('auth-redirect-url')).toBeNull();
          resolve();
        }, 10);
      }));

    it('should not redirect when only stigman authenticated', () =>
      new Promise<void>((resolve) => {
        sessionStorage.setItem('auth-redirect-url', '/poams/123');
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsStigmanOnly));

        service = createService();

        setTimeout(() => {
          expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
          resolve();
        }, 10);
      }));

    it('should not redirect when no URL stored', () =>
      new Promise<void>((resolve) => {
        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(of(mockAuthResultsBothAuthenticated));
        mockUsersService.getCurrentUser.mockReturnValue(of(mockUserData));

        service = createService();

        setTimeout(() => {
          expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
          resolve();
        }, 10);
      }));
  });

  describe('initializeAuth error handling', () => {
    it('should handle auth initialization errors', () =>
      new Promise<void>((resolve) => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockOidcSecurityService.checkAuthMultiple.mockReturnValue(throwError(() => new Error('Auth check failed')));

        service = createService();

        setTimeout(() => {
          service.authState$.pipe(take(1)).subscribe((state) => {
            expect(state.isAuthenticatedStigman).toBe(false);
            expect(state.isAuthenticatedCpat).toBe(false);
            consoleSpy.mockRestore();
            resolve();
          });
        }, 10);
      }));
  });
});
