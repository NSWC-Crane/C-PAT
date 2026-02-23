import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { PLATFORM_ID, ElementRef, Renderer2, signal } from '@angular/core';
import { Router, Event, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { AppTopBarComponent } from './app.topbar.component';
import { AppConfigService } from '../services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { AuthService } from '../../core/auth/services/auth.service';

describe('AppTopBarComponent', () => {
  let component: AppTopBarComponent;
  let fixture: ComponentFixture<AppTopBarComponent>;
  let mockConfigService: any;
  let mockPayloadService: any;
  let mockUserService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let routerEventsSubject: Subject<Event>;
  let appStateSignal: any;
  let userSubject: BehaviorSubject<any>;
  let authUserSubject: BehaviorSubject<any>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/test/',
        apiBase: '/api',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true,
          marketplaceDisabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    appStateSignal = signal({
      preset: 'Aura',
      primary: 'noir',
      surface: 'soho',
      darkTheme: true,
      menuActive: false,
      RTL: false
    });

    routerEventsSubject = new Subject<Event>();
    userSubject = new BehaviorSubject<any>({ userId: 1, userName: 'testuser', defaultTheme: null });
    authUserSubject = new BehaviorSubject<any>({ userId: 1, accountStatus: 'ACTIVE' });

    mockConfigService = {
      appState: appStateSignal
    };

    mockPayloadService = {
      user$: userSubject.asObservable(),
      payload$: new BehaviorSubject(null).asObservable(),
      accessLevel$: new BehaviorSubject(0).asObservable(),
      setPayload: vi.fn()
    };

    mockUserService = {
      updateUserTheme: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockNotificationService = {
      getUnreadNotificationCount: vi.fn().mockReturnValue(of(5))
    };

    mockAuthService = {
      user$: authUserSubject.asObservable()
    };

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue(''),
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppTopBarComponent],
      providers: [
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: UsersService, useValue: mockUserService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn() } } } },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ElementRef, useValue: { nativeElement: { children: [{ classList: { toggle: vi.fn() } }] } } },
        { provide: Renderer2, useValue: { listen: vi.fn().mockReturnValue(vi.fn()) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppTopBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set basePath from CPAT.Env', () => {
      expect(component.basePath).toBe('/test/');
    });

    it('should set docsDisabled from CPAT.Env.features', () => {
      expect(component.docsDisabled).toBe(false);
    });

    it('should have showConfigurator default to true', () => {
      expect(component.showConfigurator).toBe(true);
    });

    it('should initialize notificationCount as null', () => {
      expect(component.notificationCount).toBeNull();
    });

    it('should initialize scrollListener as null', () => {
      expect(component.scrollListener).toBeNull();
    });
  });

  describe('isDarkMode', () => {
    it('should return true when darkTheme is true', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: true });
      expect(component.isDarkMode()).toBe(true);
    });

    it('should return false when darkTheme is false', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: false });
      expect(component.isDarkMode()).toBe(false);
    });
  });

  describe('ngOnInit - Notification Setup', () => {
    it('should call getUnreadNotificationCount for active users', () => {
      vi.useFakeTimers();
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(mockNotificationService.getUnreadNotificationCount).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should set notificationCount when count is greater than 0', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(5));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBe(5);
      vi.useRealTimers();
    });

    it('should set notificationCount to null when count is 0', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(0));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBeNull();
      vi.useRealTimers();
    });

    it('should not fetch notifications for non-active user', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'PENDING' });
      vi.useFakeTimers();
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(mockNotificationService.getUnreadNotificationCount).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not fetch notifications when user is null', () => {
      authUserSubject.next(null);
      vi.useFakeTimers();
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(mockNotificationService.getUnreadNotificationCount).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should handle error from notification service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNotificationService.getUnreadNotificationCount.mockReturnValue(throwError(() => new Error('Notification error')));
      vi.useFakeTimers();
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBeNull();
      consoleSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('fetchNotificationCount - Response Parsing', () => {
    it('should handle numeric response directly', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(42));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBe(42);
      vi.useRealTimers();
    });

    it('should handle array response by returning length', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of([1, 2, 3]));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBe(3);
      vi.useRealTimers();
    });

    it('should handle string response by parsing to number', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of('7'));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBe(7);
      vi.useRealTimers();
    });

    it('should return 0 for unparseable response', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of('not-a-number'));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBeNull();
      vi.useRealTimers();
    });

    it('should handle empty array response', () => {
      vi.useFakeTimers();
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of([]));
      fixture.detectChanges();

      vi.advanceTimersByTime(500);

      expect(component.notificationCount).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('toggleDarkMode', () => {
    it('should toggle darkTheme from true to false', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: true });
      component.toggleDarkMode();
      expect(appStateSignal().darkTheme).toBe(false);
    });

    it('should toggle darkTheme from false to true', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: false });
      component.toggleDarkMode();
      expect(appStateSignal().darkTheme).toBe(true);
    });

    it('should call saveUserPreferences after toggling', () => {
      const saveSpy = vi.spyOn(component, 'saveUserPreferences');

      component.toggleDarkMode();
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('saveUserPreferences', () => {
    it('should call userService.updateUserTheme with correct data', () => {
      userSubject.next({ userId: 42, userName: 'testuser', defaultTheme: null });
      component.saveUserPreferences();

      expect(mockUserService.updateUserTheme).toHaveBeenCalledWith({
        userId: 42,
        defaultTheme: expect.any(String)
      });
    });

    it('should serialize current appState into defaultTheme', () => {
      appStateSignal.set({
        preset: 'Lara',
        primary: 'blue',
        surface: 'slate',
        darkTheme: false,
        menuActive: false,
        RTL: true
      });
      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: null });
      component.saveUserPreferences();

      const call = mockUserService.updateUserTheme.mock.calls[0][0];
      const parsed = JSON.parse(call.defaultTheme);

      expect(parsed.preset).toBe('Lara');
      expect(parsed.primary).toBe('blue');
      expect(parsed.surface).toBe('slate');
      expect(parsed.darkTheme).toBe(false);
      expect(parsed.rtl).toBe(true);
    });

    it('should handle error from updateUserTheme', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUserService.updateUserTheme.mockReturnValue(throwError(() => new Error('Save failed')));
      userSubject.next({ userId: 1, userName: 'testuser', defaultTheme: null });

      component.saveUserPreferences();

      expect(consoleSpy).toHaveBeenCalledWith('Error saving user preferences:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should skip null users from payload service', () => {
      userSubject.next(null);
      component.saveUserPreferences();

      expect(mockUserService.updateUserTheme).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();

      const destroySubject = (component as any).destroy$ as Subject<void>;
      const completeSpy = vi.spyOn(destroySubject, 'complete');
      const nextSpy = vi.spyOn(destroySubject, 'next');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unbind scroll listener if bound', () => {
      const listenerFn = vi.fn();

      component.scrollListener = listenerFn;

      component.ngOnDestroy();

      expect(listenerFn).toHaveBeenCalled();
      expect(component.scrollListener).toBeNull();
    });

    it('should not error if scrollListener is null', () => {
      component.scrollListener = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('CPAT.Env Configuration', () => {
    it('should set docsDisabled to true when configured', async () => {
      (globalThis as any).CPAT.Env.features.docsDisabled = true;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AppTopBarComponent],
        providers: [
          { provide: AppConfigService, useValue: mockConfigService },
          { provide: PayloadService, useValue: mockPayloadService },
          { provide: UsersService, useValue: mockUserService },
          { provide: NotificationService, useValue: mockNotificationService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn() } } } },
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: ElementRef, useValue: { nativeElement: { children: [{ classList: { toggle: vi.fn() } }] } } },
          { provide: Renderer2, useValue: { listen: vi.fn().mockReturnValue(vi.fn()) } }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(AppTopBarComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.docsDisabled).toBe(true);

      (globalThis as any).CPAT.Env.features.docsDisabled = false;
    });

    it('should use basePath from CPAT.Env', () => {
      expect(component.basePath).toBe('/test/');
    });
  });

  describe('showConfigurator Input', () => {
    it('should default to true', () => {
      expect(component.showConfigurator).toBe(true);
    });

    it('should accept false value', () => {
      component.showConfigurator = false;
      expect(component.showConfigurator).toBe(false);
    });
  });
});
