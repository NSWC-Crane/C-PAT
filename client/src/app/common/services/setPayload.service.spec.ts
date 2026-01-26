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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, firstValueFrom, filter } from 'rxjs';
import { PayloadService } from './setPayload.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { Users } from '../models/users.model';

describe('PayloadService', () => {
  let service: PayloadService;
  let mockUsersService: { getCurrentUser: ReturnType<typeof vi.fn> };

  const mockUser: Users = {
    userId: 1,
    userName: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    created: '2024-01-01',
    lastAccess: '2024-01-15',
    lastCollectionAccessedId: 100,
    accountStatus: 'Active',
    fullName: 'Test User',
    officeOrg: 'Test Org',
    defaultTheme: 'light',
    isAdmin: false,
    lastClaims: null,
    points: 0,
    permissions: [
      { collectionId: 100, accessLevel: 2 },
      { collectionId: 200, accessLevel: 1 }
    ]
  };

  const mockAdminUser: Users = {
    ...mockUser,
    userId: 2,
    userName: 'adminuser',
    isAdmin: true
  };

  beforeEach(() => {
    mockUsersService = {
      getCurrentUser: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [PayloadService, { provide: UsersService, useValue: mockUsersService }]
    });

    service = TestBed.inject(PayloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null user initially', async () => {
      const user = await firstValueFrom(service.user$);

      expect(user).toBeNull();
    });

    it('should have null payload initially', async () => {
      const payload = await firstValueFrom(service.payload$);

      expect(payload).toBeNull();
    });

    it('should have zero access level initially', async () => {
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(0);
    });

    it('should have isAdmin as false initially', async () => {
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(false);
    });
  });

  describe('setPayload', () => {
    it('should set user data when getCurrentUser succeeds', async () => {
      mockUsersService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setPayload();

      const user = await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));

      expect(user.userId).toBe(1);
      expect(user.userName).toBe('testuser');
    });

    it('should set payload with mapped permissions', async () => {
      mockUsersService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setPayload();

      const payload = await firstValueFrom(service.payload$.pipe(filter((p) => p !== null)));

      expect(payload.collections).toHaveLength(2);
      expect(payload.collections[0]).toEqual({ collectionId: 100, accessLevel: 2 });
      expect(payload.collections[1]).toEqual({ collectionId: 200, accessLevel: 1 });
    });

    it('should set access level based on lastCollectionAccessedId', async () => {
      mockUsersService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(2);
    });

    it('should set isAdmin to false for non-admin user', async () => {
      mockUsersService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(false);
    });

    it('should set isAdmin to true for admin user', async () => {
      mockUsersService.getCurrentUser.mockReturnValue(of(mockAdminUser));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(true);
    });

    it('should handle user with no permissions', async () => {
      const userNoPermissions: Users = {
        ...mockUser,
        permissions: []
      };

      mockUsersService.getCurrentUser.mockReturnValue(of(userNoPermissions));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(0);
    });

    it('should handle user with undefined permissions', async () => {
      const userUndefinedPermissions: Users = {
        ...mockUser,
        permissions: undefined as any
      };

      mockUsersService.getCurrentUser.mockReturnValue(of(userUndefinedPermissions));

      service.setPayload();

      const payload = await firstValueFrom(service.payload$.pipe(filter((p) => p !== null)));

      expect(payload.collections).toBeUndefined();
    });

    it('should set accessLevel to 0 when lastCollectionAccessedId not found in permissions', async () => {
      const userDifferentCollection: Users = {
        ...mockUser,
        lastCollectionAccessedId: 999
      };

      mockUsersService.getCurrentUser.mockReturnValue(of(userDifferentCollection));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(0);
    });

    it('should handle error when getCurrentUser fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUsersService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));

      service.setPayload();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle response with no userId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUsersService.getCurrentUser.mockReturnValue(of({} as Users));

      service.setPayload();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle null response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUsersService.getCurrentUser.mockReturnValue(of(null));

      service.setPayload();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle user with isAdmin undefined', async () => {
      const userUndefinedAdmin: Users = {
        ...mockUser,
        isAdmin: undefined as any
      };

      mockUsersService.getCurrentUser.mockReturnValue(of(userUndefinedAdmin));

      service.setPayload();

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(false);
    });
  });
});
