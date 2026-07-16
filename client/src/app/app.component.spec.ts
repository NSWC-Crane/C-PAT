/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/services/auth.service';
import { InactivityService } from './core/auth/services/inactivity.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockAuthService: any;
  let mockInactivityService: any;
  let authStateSubject: Subject<{ isAuthenticatedStigman: boolean; isAuthenticatedCpat: boolean }>;

  beforeEach(async () => {
    authStateSubject = new Subject();

    mockAuthService = {
      authState$: authStateSubject.asObservable(),
      handleAuthFlow: vi.fn()
    };

    mockInactivityService = {
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      shouldMonitor: vi.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: InactivityService, useValue: mockInactivityService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to authState$', async () => {
      component.ngOnInit();
      expect(component['authSubscription']).toBeDefined();
    });
  });

  describe('handleAuthState — not fully authenticated', () => {
    it('should call inactivityService.stopMonitoring when not authenticated', async () => {
      component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: false, isAuthenticatedCpat: false });
      await Promise.resolve();
      expect(mockInactivityService.stopMonitoring).toHaveBeenCalled();
    });

    it('should call authService.handleAuthFlow when stigman not authenticated', async () => {
      component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: false, isAuthenticatedCpat: true });
      await Promise.resolve();
      expect(mockAuthService.handleAuthFlow).toHaveBeenCalled();
    });

    it('should call authService.handleAuthFlow when cpat not authenticated', async () => {
      component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: true, isAuthenticatedCpat: false });
      await Promise.resolve();
      expect(mockAuthService.handleAuthFlow).toHaveBeenCalled();
    });
  });

  describe('handleAuthState — fully authenticated', () => {
    const fullyAuthenticated = { isAuthenticatedStigman: true, isAuthenticatedCpat: true };

    it('should call inactivityService.startMonitoring when shouldMonitor returns true', async () => {
      mockInactivityService.shouldMonitor.mockReturnValue(true);
      component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockInactivityService.startMonitoring).toHaveBeenCalled();
    });

    it('should not call inactivityService.startMonitoring when shouldMonitor returns false', async () => {
      mockInactivityService.shouldMonitor.mockReturnValue(false);
      component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockInactivityService.startMonitoring).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from authSubscription', async () => {
      component.ngOnInit();
      const spy = vi.spyOn(component['authSubscription'], 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should call inactivityService.stopMonitoring', async () => {
      component.ngOnInit();
      component.ngOnDestroy();
      expect(mockInactivityService.stopMonitoring).toHaveBeenCalled();
    });

    it('should not throw when destroyed before ngOnInit', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should still call stopMonitoring when authSubscription is undefined', () => {
      component['authSubscription'] = undefined;
      component.ngOnDestroy();
      expect(mockInactivityService.stopMonitoring).toHaveBeenCalled();
    });
  });
});
