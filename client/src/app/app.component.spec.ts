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
import { Subject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/services/auth.service';
import { SharedService } from './common/services/shared.service';
import { PayloadService } from './common/services/setPayload.service';
import { InactivityService } from './core/auth/services/inactivity.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockAuthService: any;
  let mockSharedService: any;
  let mockPayloadService: any;
  let mockInactivityService: any;
  let authStateSubject: Subject<{ isAuthenticatedStigman: boolean; isAuthenticatedCpat: boolean }>;

  beforeEach(async () => {
    authStateSubject = new Subject();

    mockAuthService = {
      authState$: authStateSubject.asObservable(),
      handleAuthFlow: vi.fn()
    };

    mockSharedService = {
      getApiConfig: vi.fn().mockReturnValue(of({ classification: 'U' }))
    };

    mockPayloadService = {
      setPayload: vi.fn().mockResolvedValue(undefined)
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
        { provide: SharedService, useValue: mockSharedService },
        { provide: PayloadService, useValue: mockPayloadService },
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

  describe('initial state', () => {
    it('should initialize classification as undefined', () => {
      expect(component.classification).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to authState$', async () => {
      await component.ngOnInit();
      expect(component['authSubscription']).toBeDefined();
    });

    it('should call handleAuthState when authState$ emits', async () => {
      await component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: true, isAuthenticatedCpat: true });
      await Promise.resolve();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });
  });

  describe('handleAuthState — not fully authenticated', () => {
    it('should call inactivityService.stopMonitoring when not authenticated', async () => {
      await component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: false, isAuthenticatedCpat: false });
      await Promise.resolve();
      expect(mockInactivityService.stopMonitoring).toHaveBeenCalled();
    });

    it('should call authService.handleAuthFlow when stigman not authenticated', async () => {
      await component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: false, isAuthenticatedCpat: true });
      await Promise.resolve();
      expect(mockAuthService.handleAuthFlow).toHaveBeenCalled();
    });

    it('should call authService.handleAuthFlow when cpat not authenticated', async () => {
      await component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: true, isAuthenticatedCpat: false });
      await Promise.resolve();
      expect(mockAuthService.handleAuthFlow).toHaveBeenCalled();
    });

    it('should not call setPayload when not fully authenticated', async () => {
      await component.ngOnInit();
      authStateSubject.next({ isAuthenticatedStigman: false, isAuthenticatedCpat: false });
      await Promise.resolve();
      expect(mockPayloadService.setPayload).not.toHaveBeenCalled();
    });
  });

  describe('handleAuthState — fully authenticated', () => {
    const fullyAuthenticated = { isAuthenticatedStigman: true, isAuthenticatedCpat: true };

    it('should call inactivityService.startMonitoring when shouldMonitor returns true', async () => {
      mockInactivityService.shouldMonitor.mockReturnValue(true);
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockInactivityService.startMonitoring).toHaveBeenCalled();
    });

    it('should not call inactivityService.startMonitoring when shouldMonitor returns false', async () => {
      mockInactivityService.shouldMonitor.mockReturnValue(false);
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockInactivityService.startMonitoring).not.toHaveBeenCalled();
    });

    it('should call payloadService.setPayload', async () => {
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should call sharedService.getApiConfig', async () => {
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(mockSharedService.getApiConfig).toHaveBeenCalled();
    });

    it('should set classification from valid api config', async () => {
      mockSharedService.getApiConfig.mockReturnValue(of({ classification: 'S' }));
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(component.classification).toBeDefined();
      expect(component.classification?.classificationText).toBe('SECRET');
    });

    it('should set classification to UNCLASSIFIED for U', async () => {
      mockSharedService.getApiConfig.mockReturnValue(of({ classification: 'U' }));
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(component.classification?.classificationText).toBe('UNCLASSIFIED');
    });

    it('should not set classification when api config lacks classification key', async () => {
      mockSharedService.getApiConfig.mockReturnValue(of({ someOtherKey: 'value' }));
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(component.classification).toBeUndefined();
    });

    it('should not set classification when api config is null', async () => {
      mockSharedService.getApiConfig.mockReturnValue(of(null));
      await component.ngOnInit();
      authStateSubject.next(fullyAuthenticated);
      await Promise.resolve();
      expect(component.classification).toBeUndefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from authSubscription', async () => {
      await component.ngOnInit();
      const spy = vi.spyOn(component['authSubscription']!, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should call inactivityService.stopMonitoring', async () => {
      await component.ngOnInit();
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
