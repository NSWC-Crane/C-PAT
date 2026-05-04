import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { PLATFORM_ID, ElementRef, Renderer2, signal } from '@angular/core';
import { Router, Event, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { AppNavigationComponent } from './app.navigation.component';
import { AppConfigService } from '../services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { SharedService } from '../../common/services/shared.service';

describe('AppNavigationComponent', () => {
  let component: AppNavigationComponent;
  let fixture: ComponentFixture<AppNavigationComponent>;
  let mockConfigService: any;
  let mockPayloadService: any;
  let mockUserService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockRouter: any;
  let routerEventsSubject: Subject<Event>;
  let appStateSignal: any;
  let authUserSubject: BehaviorSubject<any>;
  let payloadUserSubject: BehaviorSubject<any>;

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
    authUserSubject = new BehaviorSubject<any>({ userId: 1, accountStatus: 'ACTIVE' });
    payloadUserSubject = new BehaviorSubject<any>({ userId: 1, userName: 'testuser', defaultTheme: null });

    mockConfigService = {
      appState: appStateSignal,
      newsActive: signal(false)
    };

    mockPayloadService = {
      user$: payloadUserSubject.asObservable(),
      payload$: new BehaviorSubject<any>(null).asObservable(),
      accessLevel$: new BehaviorSubject<any>(0).asObservable(),
      setPayload: vi.fn()
    };

    mockUserService = {
      updateUserTheme: vi.fn().mockReturnValue(of({ success: true })),
      updateUserLastCollection: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockNotificationService = {
      getUnreadNotificationCount: vi.fn().mockReturnValue(of(5))
    };

    mockAuthService = {
      user$: authUserSubject.asObservable(),
      accessLevel$: new BehaviorSubject<number>(0).asObservable(),
      logout: vi.fn().mockReturnValue(of(true))
    };

    mockCollectionsService = {
      getCollections: vi.fn().mockReturnValue(
        of([
          { collectionId: 1, collectionName: 'Collection A', collectionType: 'C-PAT' },
          { collectionId: 2, collectionName: 'Collection B', collectionType: 'STIG Manager' }
        ])
      ),
      getCollectionBasicList: vi.fn().mockReturnValue(of([]))
    };

    mockSharedService = {
      setSelectedCollection: vi.fn(),
      getApiConfig: vi.fn().mockReturnValue(of({ classification: 'U' }))
    };

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue(''),
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppNavigationComponent],
      providers: [
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: UsersService, useValue: mockUserService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn() } } } },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ElementRef, useValue: { nativeElement: { children: [{ classList: { add: vi.fn(), remove: vi.fn() } }] } } },
        { provide: Renderer2, useValue: { listen: vi.fn().mockReturnValue(vi.fn()) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavigationComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize collections as empty array', () => {
      expect(component.collections).toEqual([]);
    });

    it('should initialize notificationCount as null', () => {
      expect(component.notificationCount).toBeNull();
    });

    it('should initialize selectedCollection as null', () => {
      expect(component.selectedCollection).toBeNull();
    });

    it('should initialize selectCollectionMsg as false', () => {
      expect(component.selectCollectionMsg).toBe(false);
    });

    it('should initialize collectionName as "Select Collection"', () => {
      expect(component.collectionName).toBe('Select Collection');
    });

    it('should have default userMenu with Log Out', () => {
      expect(component.userMenu).toEqual([{ label: 'Log Out', icon: 'pi pi-sign-out' }]);
    });

    it('should have showConfigurator default to true', () => {
      expect(component.showConfigurator).toBe(true);
    });

    it('should have showMenuButton default to true', () => {
      expect(component.showMenuButton).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute isDarkMode from appState', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: true });
      expect(component.isDarkMode()).toBe(true);

      appStateSignal.set({ ...appStateSignal(), darkTheme: false });
      expect(component.isDarkMode()).toBe(false);
    });

    it('should compute isMenuActive from appState', () => {
      appStateSignal.set({ ...appStateSignal(), menuActive: true });
      expect(component.isMenuActive()).toBe(true);

      appStateSignal.set({ ...appStateSignal(), menuActive: false });
      expect(component.isMenuActive()).toBe(false);
    });

    it('should compute isNewsActive from configService', () => {
      mockConfigService.newsActive.set(true);
      expect(component.isNewsActive()).toBe(true);

      mockConfigService.newsActive.set(false);
      expect(component.isNewsActive()).toBe(false);
    });

    it('should compute landingClass for dark mode', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: true });
      mockConfigService.newsActive.set(false);

      const classes = component.landingClass();

      expect(classes['layout-dark']).toBe(true);
      expect(classes['layout-light']).toBe(false);
      expect(classes['layout-news-active']).toBe(false);
    });

    it('should compute landingClass for light mode with news active', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: false });
      mockConfigService.newsActive.set(true);

      const classes = component.landingClass();

      expect(classes['layout-dark']).toBe(false);
      expect(classes['layout-light']).toBe(true);
      expect(classes['layout-news-active']).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to authService.user$ and set user', () => {
      fixture.detectChanges();
      expect(component.user).toEqual({ userId: 1, accountStatus: 'ACTIVE' });
    });

    it('should call getCollections on init', () => {
      fixture.detectChanges();
      expect(mockCollectionsService.getCollections).toHaveBeenCalled();
    });

    it('should call getUnreadNotificationCount on init', () => {
      fixture.detectChanges();
      expect(mockNotificationService.getUnreadNotificationCount).toHaveBeenCalled();
    });

    it('should not call services when user is null', () => {
      authUserSubject.next(null);
      fixture.detectChanges();

      expect(mockCollectionsService.getCollections).not.toHaveBeenCalled();
      expect(mockNotificationService.getUnreadNotificationCount).not.toHaveBeenCalled();
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
  });

  describe('getCollections', () => {
    it('should populate collections array', () => {
      fixture.detectChanges();
      expect(component.collections.length).toBe(2);
    });

    it('should set selectedCollection when user has lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE', lastCollectionAccessedId: 1 });
      fixture.detectChanges();

      expect(component.selectedCollection).toEqual({ collectionId: 1, collectionName: 'Collection A', collectionType: 'C-PAT' });
    });

    it('should call sharedService.setSelectedCollection when user has lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE', lastCollectionAccessedId: 1 });
      fixture.detectChanges();

      expect(mockSharedService.setSelectedCollection).toHaveBeenCalledWith(1);
    });

    it('should not set selectedCollection when user has no lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE' });
      fixture.detectChanges();

      expect(component.selectedCollection).toBeNull();
    });

    it('should handle error from collections service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectionsService.getCollections.mockReturnValue(throwError(() => new Error('Collections error')));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading collections:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getTagColor', () => {
    it('should return "secondary" for C-PAT', () => {
      expect(component.getTagColor('C-PAT')).toBe('secondary');
    });

    it('should return "success" for STIG Manager', () => {
      expect(component.getTagColor('STIG Manager')).toBe('success');
    });

    it('should return "danger" for Tenable', () => {
      expect(component.getTagColor('Tenable')).toBe('danger');
    });

    it('should return "info" for unknown origins', () => {
      expect(component.getTagColor('Unknown')).toBe('info');
    });

    it('should return "info" for empty string', () => {
      expect(component.getTagColor('')).toBe('info');
    });
  });

  describe('getNotificationCount', () => {
    it('should set notificationCount when count is greater than 0', () => {
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(5));
      component.getNotificationCount();

      expect(component.notificationCount).toBe(5);
    });

    it('should set notificationCount to null when count is 0', () => {
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(0));
      component.getNotificationCount();

      expect(component.notificationCount).toBeNull();
    });

    it('should set notificationCount to null for negative count', () => {
      mockNotificationService.getUnreadNotificationCount.mockReturnValue(of(-1));
      component.getNotificationCount();

      expect(component.notificationCount).toBeNull();
    });

    it('should handle error from notification service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNotificationService.getUnreadNotificationCount.mockReturnValue(throwError(() => new Error('Notification error')));
      component.getNotificationCount();

      expect(consoleSpy).toHaveBeenCalledWith('Error getting notification count:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('setMenuItems', () => {
    it('should include Marketplace and Log Out when marketplace is enabled', () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
      component.setMenuItems();

      expect(component.userMenu.length).toBe(2);
      expect(component.userMenu[0].label).toBe('Marketplace');
      expect(component.userMenu[0].icon).toBe('pi pi-shopping-cart');
      expect(component.userMenu[1].label).toBe('Log Out');
    });

    it('should only include Log Out when marketplace is disabled', () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = true;
      component.setMenuItems();

      expect(component.userMenu.length).toBe(1);
      expect(component.userMenu[0].label).toBe('Log Out');
      expect(component.userMenu[0].icon).toBe('pi pi-sign-out');

      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
    });
  });

  describe('setupUserMenuActions', () => {
    it('should assign command functions to menu items', () => {
      component.setMenuItems();
      component.setupUserMenuActions();

      component.userMenu.forEach((item) => {
        expect(item.command).toBeDefined();
        expect(typeof item.command).toBe('function');
      });
    });
  });

  describe('goToMarketplace', () => {
    it('should navigate to /marketplace', () => {
      component.goToMarketplace();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/marketplace']);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should navigate to /login on successful logout', () => {
      component.logout();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle error from logout', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockAuthService.logout.mockReturnValue(throwError(() => new Error('Logout failed')));
      component.logout();

      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('onCollectionClick', () => {
    beforeEach(() => {
      component.user = { userId: 1, lastCollectionAccessedId: 1 };
      component.collections = [
        { collectionId: 1, collectionName: 'Collection A', collectionType: 'C-PAT' },
        { collectionId: 2, collectionName: 'Collection B', collectionType: 'STIG Manager' }
      ];
    });

    it('should call resetWorkspace with collectionId when event has value', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({ value: { collectionId: 2 } });

      expect(resetSpy).toHaveBeenCalledWith(2);
    });

    it('should not call resetWorkspace when event has no value', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({});

      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('should not call resetWorkspace when event value has no collectionId', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({ value: {} });

      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('should not call resetWorkspace when event is null', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick(null);

      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe('resetWorkspace', () => {
    beforeEach(() => {
      component.collections = [
        { collectionId: 1, collectionName: 'Collection A' },
        { collectionId: 2, collectionName: 'Collection B' }
      ];
      component.user = { userId: 1, lastCollectionAccessedId: 1 };
    });

    it('should call sharedService.setSelectedCollection', () => {
      component.resetWorkspace(1);
      expect(mockSharedService.setSelectedCollection).toHaveBeenCalledWith(1);
    });

    it('should set selectedCollection from collections array', () => {
      component.resetWorkspace(2);
      expect(component.selectedCollection).toEqual({ collectionId: 2, collectionName: 'Collection B' });
    });

    it('should not update user when collectionId matches lastCollectionAccessedId', () => {
      component.resetWorkspace(1);
      expect(mockUserService.updateUserLastCollection).not.toHaveBeenCalled();
    });

    it('should call updateUserLastCollection when collectionId differs', () => {
      component.resetWorkspace(2);
      expect(mockUserService.updateUserLastCollection).toHaveBeenCalledWith({
        userId: 1,
        lastCollectionAccessedId: 2
      });
    });

    it('should handle error from updateUserLastCollection', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUserService.updateUserLastCollection.mockReturnValue(throwError(() => new Error('Update error')));
      component.resetWorkspace(2);

      expect(consoleSpy).toHaveBeenCalledWith('Error updating user:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Scroll Listener', () => {
    it('should initialize scrollListener as undefined', () => {
      expect(component.scrollListener).toBeUndefined();
    });

    it('should unbind scroll listener and set to null', () => {
      const listenerFn = vi.fn();

      component.scrollListener = listenerFn;

      component.unbindScrollListener();

      expect(listenerFn).toHaveBeenCalled();
      expect(component.scrollListener).toBeNull();
    });

    it('should not error if scrollListener is already null', () => {
      component.scrollListener = null;
      expect(() => component.unbindScrollListener()).not.toThrow();
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

    it('should unbind scroll listener on destroy', () => {
      const listenerFn = vi.fn();

      component.scrollListener = listenerFn;

      component.ngOnDestroy();

      expect(listenerFn).toHaveBeenCalled();
      expect(component.scrollListener).toBeNull();
    });

    it('should not error when scrollListener is null on destroy', () => {
      component.scrollListener = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
