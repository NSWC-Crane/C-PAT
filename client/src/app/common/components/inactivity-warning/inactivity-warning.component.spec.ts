/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { InactivityWarningComponent } from './inactivity-warning.component';
import { InactivityService } from '../../../core/auth/services/inactivity.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

beforeAll(() => {
  (globalThis as any).CPAT = {
    Env: {
      basePath: '/',
      apiBase: '/api',
      inactivityTimeout: 900000,
      adminInactivityTimeout: 600000
    }
  };
});

describe('InactivityWarningComponent', () => {
  let component: InactivityWarningComponent;
  let fixture: ComponentFixture<InactivityWarningComponent>;
  let mockInactivityService: {
    warningState$: Subject<{ show: boolean; countdown?: number }>;
    dismissWarning: ReturnType<typeof vi.fn>;
    stopMonitoring: ReturnType<typeof vi.fn>;
  };
  let originalLocation: Location;

  beforeEach(async () => {
    mockInactivityService = {
      warningState$: new Subject<{ show: boolean; countdown?: number }>(),
      dismissWarning: vi.fn(),
      stopMonitoring: vi.fn()
    };

    originalLocation = globalThis.location;
    const mockLocation = {
      ...originalLocation,
      href: ''
    };

    Object.defineProperty(globalThis, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [InactivityWarningComponent, NoopAnimationsModule],
      providers: [{ provide: InactivityService, useValue: mockInactivityService }]
    }).compileComponents();

    fixture = TestBed.createComponent(InactivityWarningComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have visible set to false by default', () => {
      expect(component.visible).toBe(false);
    });

    it('should have countdown set to 60 by default', () => {
      expect(component.countdown).toBe(60);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to warningState$', () => {
      fixture.detectChanges();

      expect(component.visible).toBe(false);
    });

    it('should update visible when warningState$ emits show: true', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true });

      expect(component.visible).toBe(true);
    });

    it('should update visible when warningState$ emits show: false', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true });
      expect(component.visible).toBe(true);

      mockInactivityService.warningState$.next({ show: false });
      expect(component.visible).toBe(false);
    });

    it('should update countdown when warningState$ emits countdown value', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: 45 });

      expect(component.countdown).toBe(45);
    });

    it('should not update countdown when warningState$ emits without countdown', () => {
      fixture.detectChanges();

      component.countdown = 30;
      mockInactivityService.warningState$.next({ show: true });

      expect(component.countdown).toBe(30);
    });

    it('should handle multiple state updates', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: 60 });
      expect(component.visible).toBe(true);
      expect(component.countdown).toBe(60);

      mockInactivityService.warningState$.next({ show: true, countdown: 59 });
      expect(component.countdown).toBe(59);

      mockInactivityService.warningState$.next({ show: true, countdown: 58 });
      expect(component.countdown).toBe(58);
    });

    it('should handle countdown reaching zero', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: 1 });
      expect(component.countdown).toBe(1);

      mockInactivityService.warningState$.next({ show: true, countdown: 0 });
      expect(component.countdown).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from warningState$ on destroy', () => {
      fixture.detectChanges();

      const subscription = component['warningSubscription'];

      expect(subscription).toBeTruthy();

      component.ngOnDestroy();

      expect(subscription?.closed).toBe(true);
    });

    it('should handle destroy when subscription is undefined', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not receive updates after destroy', () => {
      fixture.detectChanges();

      component.ngOnDestroy();

      component.visible = false;
      component.countdown = 60;

      mockInactivityService.warningState$.next({ show: true, countdown: 30 });

      expect(component.visible).toBe(false);
      expect(component.countdown).toBe(60);
    });
  });

  describe('keepWorking', () => {
    it('should call inactivityService.dismissWarning', () => {
      fixture.detectChanges();

      component.keepWorking();

      expect(mockInactivityService.dismissWarning).toHaveBeenCalled();
    });

    it('should call dismissWarning exactly once', () => {
      fixture.detectChanges();

      component.keepWorking();

      expect(mockInactivityService.dismissWarning).toHaveBeenCalledTimes(1);
    });
  });

  describe('logoutNow', () => {
    it('should call inactivityService.stopMonitoring', () => {
      fixture.detectChanges();

      component.logoutNow();

      expect(mockInactivityService.stopMonitoring).toHaveBeenCalled();
    });

    it('should call stopMonitoring exactly once', () => {
      fixture.detectChanges();

      component.logoutNow();

      expect(mockInactivityService.stopMonitoring).toHaveBeenCalledTimes(1);
    });

    it('should redirect to root path', () => {
      fixture.detectChanges();

      component.logoutNow();

      expect(globalThis.location.href).toBe('/');
    });

    it('should call stopMonitoring before redirect', () => {
      fixture.detectChanges();

      let stopMonitoringCalledFirst = false;

      mockInactivityService.stopMonitoring.mockImplementation(() => {
        stopMonitoringCalledFirst = globalThis.location.href === '';
      });

      component.logoutNow();

      expect(stopMonitoringCalledFirst).toBe(true);
    });
  });

  describe('template rendering', () => {
    it('should render p-dialog', () => {
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(By.css('p-dialog'));

      expect(dialog).toBeTruthy();
    });

    it('should have dialog not visible initially', () => {
      fixture.detectChanges();
      expect(component.visible).toBe(false);
    });

    it('should show dialog when visible is true', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      expect(component.visible).toBe(true);
    });

    it('should have modal set to true', () => {
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.modal).toBe(true);
    });

    it('should have closable set to false', () => {
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.closable).toBe(false);
    });

    it('should have draggable set to false', () => {
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.draggable).toBe(false);
    });

    it('should have resizable set to false', () => {
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(By.css('p-dialog'));
      const dialogComponent = dialog.componentInstance;

      expect(dialogComponent.resizable).toBe(false);
    });

    it('should render warning icon when dialog is visible', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.pi-exclamation-triangle'));

      expect(icon).toBeTruthy();
    });

    it('should render "Inactivity Detected" heading when dialog is visible', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      const heading = fixture.debugElement.query(By.css('h3'));

      expect(heading).toBeTruthy();
      expect(heading.nativeElement.textContent).toContain('Inactivity Detected');
    });

    it('should display countdown value', () => {
      component.visible = true;
      component.countdown = 42;
      fixture.detectChanges();

      const countdownElement = fixture.debugElement.query(By.css('.text-primary'));

      expect(countdownElement).toBeTruthy();
      expect(countdownElement.nativeElement.textContent).toContain('42');
    });

    it('should render Keep Working button when dialog is visible', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const keepWorkingButton = buttons.find((btn) => btn.attributes['label'] === 'Keep Working');

      expect(keepWorkingButton).toBeTruthy();
    });

    it('should render Log Out button when dialog is visible', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const logOutButton = buttons.find((btn) => btn.attributes['label'] === 'Log Out');

      expect(logOutButton).toBeTruthy();
    });

    it('should render Log Out button with sign-out icon', () => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const logOutButton = buttons.find((btn) => btn.attributes['label'] === 'Log Out');

      expect(logOutButton?.attributes['icon']).toBe('pi pi-sign-out');
    });
  });

  describe('button interactions', () => {
    beforeEach(() => {
      component.visible = true;
      component.countdown = 60;
      fixture.detectChanges();
    });

    it('should call keepWorking when Keep Working button is clicked', () => {
      const keepWorkingSpy = vi.spyOn(component, 'keepWorking');

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const keepWorkingButton = buttons.find((btn) => btn.attributes['label'] === 'Keep Working');

      keepWorkingButton?.triggerEventHandler('onClick', {});

      expect(keepWorkingSpy).toHaveBeenCalled();
    });

    it('should call logoutNow when Log Out button is clicked', () => {
      const logoutNowSpy = vi.spyOn(component, 'logoutNow');

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const logOutButton = buttons.find((btn) => btn.attributes['label'] === 'Log Out');

      logOutButton?.triggerEventHandler('onClick', {});

      expect(logoutNowSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      fixture.detectChanges();

      for (let i = 60; i >= 50; i--) {
        mockInactivityService.warningState$.next({ show: true, countdown: i });
      }

      expect(component.countdown).toBe(50);
      expect(component.visible).toBe(true);
    });

    it('should handle toggle visibility multiple times', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true });
      expect(component.visible).toBe(true);

      mockInactivityService.warningState$.next({ show: false });
      expect(component.visible).toBe(false);

      mockInactivityService.warningState$.next({ show: true });
      expect(component.visible).toBe(true);
    });

    it('should handle countdown with zero value', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: 0 });

      expect(component.countdown).toBe(0);
    });

    it('should handle negative countdown value gracefully', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: -1 });

      expect(component.countdown).toBe(-1);
    });

    it('should preserve countdown when only visibility changes', () => {
      fixture.detectChanges();

      mockInactivityService.warningState$.next({ show: true, countdown: 45 });
      expect(component.countdown).toBe(45);

      mockInactivityService.warningState$.next({ show: false });
      expect(component.countdown).toBe(45);
    });
  });

  describe('BehaviorSubject variation', () => {
    let behaviorSubjectService: {
      warningState$: BehaviorSubject<{ show: boolean; countdown?: number }>;
      dismissWarning: ReturnType<typeof vi.fn>;
      stopMonitoring: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      behaviorSubjectService = {
        warningState$: new BehaviorSubject<{ show: boolean; countdown?: number }>({ show: false }),
        dismissWarning: vi.fn(),
        stopMonitoring: vi.fn()
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [InactivityWarningComponent, NoopAnimationsModule],
        providers: [{ provide: InactivityService, useValue: behaviorSubjectService }]
      }).compileComponents();

      fixture = TestBed.createComponent(InactivityWarningComponent);
      component = fixture.componentInstance;
    });

    it('should receive initial state from BehaviorSubject', () => {
      fixture.detectChanges();

      expect(component.visible).toBe(false);
    });

    it('should receive initial state with countdown from BehaviorSubject', () => {
      behaviorSubjectService.warningState$.next({ show: true, countdown: 55 });

      fixture.detectChanges();

      expect(component.visible).toBe(true);
      expect(component.countdown).toBe(55);
    });
  });
});
