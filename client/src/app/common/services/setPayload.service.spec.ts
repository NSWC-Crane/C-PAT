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
import { Subject, firstValueFrom, filter } from 'rxjs';
import { PayloadService } from './setPayload.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { Users } from '../models/users.model';

describe('PayloadService', () => {
  let service: PayloadService;
  let userSubject: Subject<Users | null>;

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
    userSubject = new Subject<Users | null>();

    TestBed.configureTestingModule({
      providers: [PayloadService, { provide: AuthService, useValue: { user$: userSubject.asObservable() } }]
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

  describe('when authService.user$ emits a valid user', () => {
    it('should set user data', async () => {
      userSubject.next(mockUser);

      const user = await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));

      expect(user.userId).toBe(1);
      expect(user.userName).toBe('testuser');
    });

    it('should set payload with mapped permissions', async () => {
      userSubject.next(mockUser);

      const payload = await firstValueFrom(service.payload$.pipe(filter((p) => p !== null)));

      expect(payload.collections).toHaveLength(2);
      expect(payload.collections[0]).toEqual({ collectionId: 100, accessLevel: 2 });
      expect(payload.collections[1]).toEqual({ collectionId: 200, accessLevel: 1 });
    });

    it('should set access level based on lastCollectionAccessedId', async () => {
      userSubject.next(mockUser);

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(2);
    });

    it('should set isAdmin to false for non-admin user', async () => {
      userSubject.next(mockUser);

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(false);
    });

    it('should set isAdmin to true for admin user', async () => {
      userSubject.next(mockAdminUser);

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(true);
    });

    it('should set accessLevel to 0 when user has no permissions', async () => {
      userSubject.next({ ...mockUser, permissions: [] });

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(0);
    });

    it('should set payload.collections to undefined when permissions are undefined', async () => {
      userSubject.next({ ...mockUser, permissions: undefined as any });

      const payload = await firstValueFrom(service.payload$.pipe(filter((p) => p !== null)));

      expect(payload.collections).toBeUndefined();
    });

    it('should set accessLevel to 0 when lastCollectionAccessedId not in permissions', async () => {
      userSubject.next({ ...mockUser, lastCollectionAccessedId: 999 });

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const level = await firstValueFrom(service.accessLevel$);

      expect(level).toBe(0);
    });

    it('should set isAdmin to false when isAdmin is undefined', async () => {
      userSubject.next({ ...mockUser, isAdmin: undefined as any });

      await firstValueFrom(service.user$.pipe(filter((u) => u !== null)));
      const isAdmin = await firstValueFrom(service.isAdmin$);

      expect(isAdmin).toBe(false);
    });
  });

  describe('when authService.user$ emits a value that should be filtered', () => {
    it('should not update subjects when user has no userId', async () => {
      userSubject.next({} as Users);

      const user = await firstValueFrom(service.user$);

      expect(user).toBeNull();
    });

    it('should not update subjects when null is emitted', async () => {
      userSubject.next(null);

      const user = await firstValueFrom(service.user$);

      expect(user).toBeNull();
    });
  });

  describe('when authService.user$ errors', () => {
    it('should log the error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      userSubject.error(new Error('Auth error'));

      expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
