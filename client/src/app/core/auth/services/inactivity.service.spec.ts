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
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { InactivityService } from './inactivity.service';
import { AuthService } from './auth.service';
import { PayloadService } from '../../../common/services/setPayload.service';

describe('InactivityService', () => {
  let service: InactivityService;
  let mockAuthService: any;
  let mockRouter: any;
  let mockPayloadService: any;
  let isAdmin$: BehaviorSubject<boolean>;

  function createService() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [InactivityService, { provide: AuthService, useValue: mockAuthService }, { provide: Router, useValue: mockRouter }, { provide: PayloadService, useValue: mockPayloadService }]
    });

    return TestBed.inject(InactivityService);
  }

  beforeEach(() => {
    vi.useFakeTimers();

    isAdmin$ = new BehaviorSubject<boolean>(false);

    mockAuthService = {
      logout: vi.fn().mockReturnValue(of(undefined))
    };

    mockRouter = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true))
    };

    mockPayloadService = {
      isAdmin$: isAdmin$.asObservable()
    };

    Object.defineProperty(globalThis, 'location', {
      value: { pathname: '/dashboard' },
      writable: true,
      configurable: true
    });

    service = createService();
  });

  afterEach(() => {
    service.stopMonitoring();
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have warningState$ observable', () => {
      expect(service.warningState$).toBeDefined();
    });

    it('should emit warning state when triggered', () =>
      new Promise<void>((resolve) => {
        service.warningState$.pipe(take(1)).subscribe((state) => {
          expect(state.show).toBe(false);
          resolve();
        });

        service['showWarning$'].next({ show: false });
      }));
  });

  describe('startMonitoring', () => {
    it('should set isMonitoring to true', () => {
      service.startMonitoring();
      expect(service['isMonitoring']).toBe(true);
    });

    it('should set lastActivity to current time', () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();

      expect(service['lastActivity']).toBe(now);
    });

    it('should subscribe to isAdmin$ from payloadService', () => {
      service.startMonitoring();
      expect(service['isAdmin']).toBe(false);

      isAdmin$.next(true);
      expect(service['isAdmin']).toBe(true);
    });

    it('should not restart monitoring if already monitoring', () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();
      expect(service['lastActivity']).toBe(now);

      vi.advanceTimersByTime(100);

      service.startMonitoring();

      expect(service['lastActivity']).toBe(now);
    });
  });

  describe('stopMonitoring', () => {
    it('should set isMonitoring to false', () => {
      service.startMonitoring();
      expect(service['isMonitoring']).toBe(true);

      service.stopMonitoring();
      expect(service['isMonitoring']).toBe(false);
    });

    it('should reset warningShown to false', () => {
      service.startMonitoring();
      service['warningShown'] = true;

      service.stopMonitoring();
      expect(service['warningShown']).toBe(false);
    });

    it('should create new destroy$ subject', () => {
      service.startMonitoring();
      const originalDestroy$ = service['destroy$'];

      service.stopMonitoring();
      expect(service['destroy$']).not.toBe(originalDestroy$);
    });
  });

  describe('getActiveTimeout', () => {
    it('should return DEFAULT_INACTIVITY_TIMEOUT for non-admin users', () => {
      service['isAdmin'] = false;
      const timeout = service['getActiveTimeout']();

      expect(timeout).toBe(service['DEFAULT_INACTIVITY_TIMEOUT']);
    });

    it('should return ADMIN_INACTIVITY_TIMEOUT for admin users', () => {
      service['isAdmin'] = true;
      const timeout = service['getActiveTimeout']();

      expect(timeout).toBe(service['ADMIN_INACTIVITY_TIMEOUT']);
    });
  });

  describe('shouldMonitor', () => {
    it('should return true for normal paths', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(true);
    });

    it('should return false for /401 path', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/401' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(false);
    });

    it('should return false for /403 path', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/403' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(false);
    });

    it('should return false for /404 path', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/404' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(false);
    });

    it('should return false for /not-activated path', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/not-activated' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(false);
    });

    it('should return false for paths containing error paths', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/some/nested/401/page' },
        writable: true,
        configurable: true
      });

      expect(service.shouldMonitor()).toBe(false);
    });
  });

  describe('dismissWarning', () => {
    it('should set warningShown to false', () => {
      service['warningShown'] = true;
      service.dismissWarning();
      expect(service['warningShown']).toBe(false);
    });

    it('should emit show: false on showWarning$', () =>
      new Promise<void>((resolve) => {
        service.warningState$.pipe(take(1)).subscribe((state) => {
          expect(state.show).toBe(false);
          resolve();
        });

        service.dismissWarning();
      }));

    it('should update lastActivity to current time', () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.dismissWarning();

      expect(service['lastActivity']).toBe(now);
    });

    it('should unsubscribe countdownSubscription if exists', () => {
      const mockSubscription = { unsubscribe: vi.fn() };

      service['countdownSubscription'] = mockSubscription as any;

      service.dismissWarning();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('performLogout', () => {
    it('should call stopMonitoring', () => {
      const stopMonitoringSpy = vi.spyOn(service, 'stopMonitoring');

      service['performLogout']();
      expect(stopMonitoringSpy).toHaveBeenCalled();
    });

    it('should emit show: false on showWarning$', () =>
      new Promise<void>((resolve) => {
        service.warningState$.pipe(take(1)).subscribe((state) => {
          expect(state.show).toBe(false);
          resolve();
        });

        service['performLogout']();
      }));

    it('should call authService.logout', () => {
      service['performLogout']();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should navigate to /401 on successful logout', async () => {
      mockAuthService.logout.mockReturnValue(of(undefined));

      service['performLogout']();
      await vi.runAllTimersAsync();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/401']);
    });

    it('should navigate to /401 on logout error', async () => {
      mockAuthService.logout.mockReturnValue(throwError(() => new Error('Logout failed')));

      service['performLogout']();
      await vi.runAllTimersAsync();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/401']);
    });
  });

  describe('showWarningDialog', () => {
    it('should set warningShown to true', () => {
      service['showWarningDialog']();
      expect(service['warningShown']).toBe(true);
    });

    it('should emit initial countdown value', () =>
      new Promise<void>((resolve) => {
        service.warningState$.pipe(take(1)).subscribe((state) => {
          expect(state.show).toBe(true);
          expect(state.countdown).toBe(60);
          resolve();
        });

        service['showWarningDialog']();
      }));

    it('should not show warning dialog if already shown', () => {
      service['warningShown'] = true;
      const showWarningSpy = vi.spyOn(service['showWarning$'], 'next');

      service['showWarningDialog']();

      expect(showWarningSpy).not.toHaveBeenCalled();
    });

    it('should decrement countdown every second', async () => {
      const emissions: any[] = [];
      const subscription = service.warningState$.subscribe((state) => {
        emissions.push({ ...state });
      });

      service['showWarningDialog']();

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      subscription.unsubscribe();
      service.stopMonitoring();

      expect(emissions.length).toBeGreaterThanOrEqual(3);
      expect(emissions[0].countdown).toBe(60);
      expect(emissions[1].countdown).toBe(59);
      expect(emissions[2].countdown).toBe(58);
    });

    it('should call performLogout when countdown reaches 0', async () => {
      const performLogoutSpy = vi.spyOn(service as any, 'performLogout');

      service['showWarningDialog']();

      await vi.advanceTimersByTimeAsync(60000);

      expect(performLogoutSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });
  });

  describe('Activity Listeners', () => {
    it('should update lastActivity on document click', async () => {
      const initialTime = Date.now();

      vi.setSystemTime(initialTime);

      service.startMonitoring();

      vi.setSystemTime(initialTime + 100);

      document.dispatchEvent(new MouseEvent('click'));
      await vi.advanceTimersByTimeAsync(0);

      expect(service['lastActivity']).toBe(initialTime + 100);

      service.stopMonitoring();
    });

    it('should update lastActivity on keydown', async () => {
      const initialTime = Date.now();

      vi.setSystemTime(initialTime);

      service.startMonitoring();

      vi.setSystemTime(initialTime + 100);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      await vi.advanceTimersByTimeAsync(0);

      expect(service['lastActivity']).toBe(initialTime + 100);

      service.stopMonitoring();
    });

    it('should update lastActivity on scroll', async () => {
      const initialTime = Date.now();

      vi.setSystemTime(initialTime);

      service.startMonitoring();

      vi.setSystemTime(initialTime + 100);

      document.dispatchEvent(new Event('scroll'));
      await vi.advanceTimersByTimeAsync(0);

      expect(service['lastActivity']).toBe(initialTime + 100);

      service.stopMonitoring();
    });

    it('should update lastActivity on window focus', async () => {
      const initialTime = Date.now();

      vi.setSystemTime(initialTime);

      service.startMonitoring();

      vi.setSystemTime(initialTime + 100);

      window.dispatchEvent(new FocusEvent('focus'));
      await vi.advanceTimersByTimeAsync(0);

      expect(service['lastActivity']).toBe(initialTime + 100);

      service.stopMonitoring();
    });

    it('should dismiss warning when activity is detected while warning is shown', async () => {
      service.startMonitoring();
      service['warningShown'] = true;

      const dismissWarningSpy = vi.spyOn(service, 'dismissWarning');

      document.dispatchEvent(new MouseEvent('click'));
      await vi.advanceTimersByTimeAsync(0);

      expect(dismissWarningSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });
  });

  describe('Periodic Check', () => {
    it('should show warning dialog when inactivity threshold is reached', async () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();

      const showWarningDialogSpy = vi.spyOn(service as any, 'showWarningDialog');

      service['lastActivity'] = now - 850000;

      await vi.advanceTimersByTimeAsync(10000);

      expect(showWarningDialogSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });

    it('should not show warning if warningShown is true', async () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();
      service['warningShown'] = true;

      const showWarningDialogSpy = vi.spyOn(service as any, 'showWarningDialog');

      service['lastActivity'] = now - 850000;
      await vi.advanceTimersByTimeAsync(10000);

      expect(showWarningDialogSpy).not.toHaveBeenCalled();

      service.stopMonitoring();
    });

    it('should use admin timeout when user is admin', async () => {
      isAdmin$.next(true);

      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();

      const showWarningDialogSpy = vi.spyOn(service as any, 'showWarningDialog');

      service['lastActivity'] = now - 550000;

      await vi.advanceTimersByTimeAsync(10000);

      expect(showWarningDialogSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });

    it('should not show warning if within timeout threshold', async () => {
      const now = Date.now();

      vi.setSystemTime(now);

      service.startMonitoring();

      const showWarningDialogSpy = vi.spyOn(service as any, 'showWarningDialog');

      service['lastActivity'] = now - 60000;

      await vi.advanceTimersByTimeAsync(10000);

      expect(showWarningDialogSpy).not.toHaveBeenCalled();

      service.stopMonitoring();
    });
  });

  describe('Integration - Full Inactivity Flow', () => {
    it('should complete full inactivity cycle: monitoring → warning → logout', async () => {
      const now = Date.now();

      vi.setSystemTime(now);

      const performLogoutSpy = vi.spyOn(service as any, 'performLogout');

      service.startMonitoring();

      service['lastActivity'] = now - 850000;

      await vi.advanceTimersByTimeAsync(10000);

      expect(service['warningShown']).toBe(true);

      await vi.advanceTimersByTimeAsync(60000);

      expect(performLogoutSpy).toHaveBeenCalled();
    });

    it('should cancel logout if user becomes active during countdown', async () => {
      const now = Date.now();

      vi.setSystemTime(now);

      const performLogoutSpy = vi.spyOn(service as any, 'performLogout');

      service.startMonitoring();

      service['lastActivity'] = now - 850000;
      await vi.advanceTimersByTimeAsync(10000);

      expect(service['warningShown']).toBe(true);

      document.dispatchEvent(new MouseEvent('click'));
      await vi.advanceTimersByTimeAsync(0);

      expect(service['warningShown']).toBe(false);
      await vi.advanceTimersByTimeAsync(60000);

      expect(performLogoutSpy).not.toHaveBeenCalled();

      service.stopMonitoring();
    });
  });

  describe('Timeout Constants', () => {
    it('should have correct default timeout value', () => {
      expect(service['DEFAULT_INACTIVITY_TIMEOUT']).toBe(900000);
    });

    it('should have correct admin timeout value', () => {
      expect(service['ADMIN_INACTIVITY_TIMEOUT']).toBe(600000);
    });

    it('should have admin timeout less than default timeout', () => {
      expect(service['ADMIN_INACTIVITY_TIMEOUT']).toBeLessThan(service['DEFAULT_INACTIVITY_TIMEOUT']);
    });

    it('should have correct countdown duration', () => {
      expect(service['COUNTDOWN_DURATION']).toBe(60);
    });

    it('should have correct check interval', () => {
      expect(service['CHECK_INTERVAL']).toBe(10000);
    });
  });

  describe('NgZone Integration', () => {
    it('should run activity listeners outside Angular zone', () => {
      const ngZone = TestBed.inject(NgZone);
      const runOutsideAngularSpy = vi.spyOn(ngZone, 'runOutsideAngular');

      service.startMonitoring();

      expect(runOutsideAngularSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });

    it('should run warning dismissal inside Angular zone', () => {
      const ngZone = TestBed.inject(NgZone);
      const runSpy = vi.spyOn(ngZone, 'run');

      service.startMonitoring();
      service['warningShown'] = true;

      document.dispatchEvent(new MouseEvent('click'));

      expect(runSpy).toHaveBeenCalled();

      service.stopMonitoring();
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe checkSubscription on stopMonitoring', () => {
      service.startMonitoring();

      const checkSubscription = service['checkSubscription'];

      expect(checkSubscription).toBeDefined();

      const unsubscribeSpy = vi.spyOn(checkSubscription!, 'unsubscribe');

      service.stopMonitoring();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe countdownSubscription on stopMonitoring', async () => {
      service.startMonitoring();

      service['showWarningDialog']();
      await vi.advanceTimersByTimeAsync(0);

      const countdownSubscription = service['countdownSubscription'];

      expect(countdownSubscription).toBeDefined();

      const unsubscribeSpy = vi.spyOn(countdownSubscription!, 'unsubscribe');

      service.stopMonitoring();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple startMonitoring calls gracefully', () => {
      service.startMonitoring();
      service.startMonitoring();
      service.startMonitoring();

      expect(service['isMonitoring']).toBe(true);

      service.stopMonitoring();
    });

    it('should handle stopMonitoring when not monitoring', () => {
      expect(() => service.stopMonitoring()).not.toThrow();
    });

    it('should handle dismissWarning when no warning is shown', () => {
      service['warningShown'] = false;

      expect(() => service.dismissWarning()).not.toThrow();
      expect(service['warningShown']).toBe(false);
    });

    it('should handle multiple dismissWarning calls', () => {
      service['warningShown'] = true;

      service.dismissWarning();
      service.dismissWarning();
      service.dismissWarning();

      expect(service['warningShown']).toBe(false);
    });
  });
});
