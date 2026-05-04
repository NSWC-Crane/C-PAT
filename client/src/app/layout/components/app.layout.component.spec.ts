import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { AppLayoutComponent } from './app.layout.component';
import { AppConfigService } from '../services/appconfigservice';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { SharedService } from '../../common/services/shared.service';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;
  let mockConfigService: any;
  let mockUserService: any;
  let mockAuthService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockRouter: any;
  let appStateSignal: any;
  let authUserSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<any>;

  const mockCollections = [
    { collectionId: 1, collectionName: 'Collection A', collectionType: 'C-PAT' },
    { collectionId: 2, collectionName: 'Collection B', collectionType: 'STIG Manager' }
  ];

  const mockCollectionBasicList = [
    { collectionId: 1, collectionName: 'Collection A', collectionType: 'C-PAT', manualCreationAllowed: true },
    { collectionId: 2, collectionName: 'Collection B', collectionType: 'STIG Manager', manualCreationAllowed: false }
  ];

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

    authUserSubject = new BehaviorSubject<any>({
      userId: 1,
      accountStatus: 'ACTIVE',
      lastCollectionAccessedId: 1,
      isAdmin: false,
      name: 'Test User',
      email: 'test@example.com'
    });
    accessLevelSubject = new BehaviorSubject<any>(2);

    mockConfigService = {
      appState: appStateSignal
    };

    mockUserService = {
      updateUserLastCollection: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockAuthService = {
      user$: authUserSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable(),
      logout: vi.fn().mockReturnValue(of(true))
    };

    mockCollectionsService = {
      getCollections: vi.fn().mockReturnValue(of(mockCollections)),
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollectionBasicList))
    };

    mockSharedService = {
      setSelectedCollection: vi.fn()
    };

    mockRouter = {
      events: new Subject().asObservable(),
      url: '/home',
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue(''),
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn() } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize items as empty array', () => {
      expect(component.items).toEqual([]);
    });

    it('should initialize collections as empty array', () => {
      expect(component.collections).toEqual([]);
    });

    it('should initialize collectionType as C-PAT', () => {
      expect(component.collectionType).toBe('C-PAT');
    });

    it('should initialize collectionName as empty string', () => {
      expect(component.collectionName).toBe('');
    });

    it('should initialize manualCreationAllowed as true', () => {
      expect(component.manualCreationAllowed).toBe(true);
    });

    it('should initialize selectedCollection as null', () => {
      expect(component.selectedCollection).toBeNull();
    });

    it('should initialize confirmPopupVisible as false', () => {
      expect(component.confirmPopupVisible).toBe(false);
    });

    it('should initialize userMenu as empty array', () => {
      expect(component.userMenu).toEqual([]);
    });

    it('should initialize currentUser as null', () => {
      expect(component.currentUser).toBeNull();
    });
  });

  describe('isDarkMode Getter', () => {
    it('should return true when darkTheme is true', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: true });
      expect(component.isDarkMode).toBe(true);
    });

    it('should return false when darkTheme is false', () => {
      appStateSignal.set({ ...appStateSignal(), darkTheme: false });
      expect(component.isDarkMode).toBe(false);
    });
  });

  describe('tooltipContent Getter', () => {
    it('should return user name and email when currentUser is set', () => {
      component.currentUser = { name: 'Test User', email: 'test@example.com' };
      expect(component.tooltipContent).toContain('Test User');
      expect(component.tooltipContent).toContain('test@example.com');
    });

    it('should return default name when currentUser is null', () => {
      component.currentUser = null;
      expect(component.tooltipContent).toContain('C-PAT User');
    });

    it('should return default name when currentUser has no name', () => {
      component.currentUser = { email: 'test@example.com' };
      expect(component.tooltipContent).toContain('C-PAT User');
    });
  });

  describe('ngOnInit', () => {
    it('should set currentUser from authService.user$', () => {
      fixture.detectChanges();
      expect(component.currentUser).toEqual(expect.objectContaining({ userId: 1 }));
    });

    it('should set user and accessLevel from combined observables', () => {
      fixture.detectChanges();
      expect(component.user).toEqual(expect.objectContaining({ userId: 1 }));
      expect(component.accessLevel).toBe(2);
    });

    it('should call getCollections and getCollectionBasicList', () => {
      fixture.detectChanges();
      expect(mockCollectionsService.getCollections).toHaveBeenCalled();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set menu items after loading collections', () => {
      fixture.detectChanges();
      expect(component.items.length).toBeGreaterThan(0);
    });

    it('should not subscribe when user is null', () => {
      authUserSubject.next(null);
      fixture.detectChanges();
      expect(mockCollectionsService.getCollections).not.toHaveBeenCalled();
    });

    it('should handle error from combineLatest', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      accessLevelSubject.error(new Error('Access error'));

      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error in initialization:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('loadCollections', () => {
    it('should populate collections from service', () => {
      fixture.detectChanges();
      expect(component.collections).toEqual(mockCollections);
    });

    it('should set selectedCollection when user has lastCollectionAccessedId', () => {
      fixture.detectChanges();
      expect(component.selectedCollection).toEqual(mockCollections[0]);
    });

    it('should set collectionType from basic list data', () => {
      fixture.detectChanges();
      expect(component.collectionType).toBe('C-PAT');
    });

    it('should set collectionName from basic list data', () => {
      fixture.detectChanges();
      expect(component.collectionName).toBe('Collection A');
    });

    it('should set manualCreationAllowed from basic list data', () => {
      fixture.detectChanges();
      expect(component.manualCreationAllowed).toBe(true);
    });

    it('should not set selectedCollection when user has no lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE', lastCollectionAccessedId: 0, isAdmin: false });
      fixture.detectChanges();

      expect(component.selectedCollection).toBeNull();
    });

    it('should handle error from collections service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectionsService.getCollections.mockReturnValue(throwError(() => new Error('Collections error')));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading collections:', expect.any(Error));
      expect(component.collectionType).toBe('C-PAT');
      consoleSpy.mockRestore();
    });

    it('should set collection data from second collection when matching', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE', lastCollectionAccessedId: 2, isAdmin: false });
      fixture.detectChanges();

      expect(component.selectedCollection).toEqual(mockCollections[1]);
      expect(component.collectionType).toBe('STIG Manager');
      expect(component.collectionName).toBe('Collection B');
      expect(component.manualCreationAllowed).toBe(false);
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

    it('should return "info" for unknown collectionType', () => {
      expect(component.getTagColor('Unknown')).toBe('info');
    });
  });

  describe('onCollectionClick', () => {
    it('should call resetWorkspace when collection has collectionId', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({ collectionId: 2 });
      expect(resetSpy).toHaveBeenCalledWith(2);
    });

    it('should not call resetWorkspace when collectionId is falsy', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({ collectionId: 0 });
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('should not call resetWorkspace when collection has no collectionId', () => {
      const resetSpy = vi.spyOn(component, 'resetWorkspace');

      component.onCollectionClick({});
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe('resetWorkspace', () => {
    beforeEach(() => {
      component.collections = [...mockCollections];
    });

    it('should call sharedService.setSelectedCollection', () => {
      component.resetWorkspace(1);
      expect(mockSharedService.setSelectedCollection).toHaveBeenCalledWith(1);
    });

    it('should set selectedCollection from collections array', () => {
      component.resetWorkspace(2);
      expect(component.selectedCollection).toEqual(mockCollections[1]);
    });

    it('should call updateUserLastCollection', () => {
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

  describe('setUserMenuItems', () => {
    it('should include Marketplace and Log Out when marketplace is enabled', () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
      component.setUserMenuItems();

      const labels = component.userMenu.filter((m) => m.label).map((m) => m.label);

      expect(labels).toContain('Marketplace');
      expect(labels).toContain('Log Out');
    });

    it('should include separator when marketplace is enabled', () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
      component.setUserMenuItems();

      expect(component.userMenu.some((m) => m.separator)).toBe(true);
    });

    it('should only include Log Out when marketplace is disabled', () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = true;
      component.setUserMenuItems();

      expect(component.userMenu.length).toBe(1);
      expect(component.userMenu[0].label).toBe('Log Out');

      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
    });

    it('should assign command functions to menu items', () => {
      component.setUserMenuItems();
      component.userMenu
        .filter((m) => m.label)
        .forEach((item) => {
          expect(item.command).toBeDefined();
        });
    });
  });

  describe('setupUserMenuActions', () => {
    it('should wire Marketplace command to goToMarketplace', () => {
      component.setUserMenuItems();
      component.setupUserMenuActions();

      const marketplaceItem = component.userMenu.find((m) => m.label === 'Marketplace');

      expect(marketplaceItem?.command).toBeDefined();
    });

    it('should wire Log Out command to logout', () => {
      component.setUserMenuItems();
      component.setupUserMenuActions();

      const logoutItem = component.userMenu.find((m) => m.label === 'Log Out');

      expect(logoutItem?.command).toBeDefined();
    });
  });

  describe('setMenuItems', () => {
    beforeEach(() => {
      component.user = { userId: 1, isAdmin: false };
      component.accessLevel = 2;
      component.collectionType = 'C-PAT';
      component.manualCreationAllowed = true;
    });

    it('should always include Home item', () => {
      (component as any).setMenuItems();
      const homeItem = component.items.find((i) => i.label === 'Home');

      expect(homeItem).toBeDefined();
    });

    it('should include Admin Portal when user is admin', () => {
      component.user = { userId: 1, isAdmin: true };
      (component as any).setMenuItems();
      const adminItem = component.items.find((i) => i.label === 'Admin Portal');

      expect(adminItem).toBeDefined();
    });

    it('should not include Admin Portal when user is not admin', () => {
      component.user = { userId: 1, isAdmin: false };
      (component as any).setMenuItems();
      const adminItem = component.items.find((i) => i.label === 'Admin Portal');

      expect(adminItem).toBeUndefined();
    });

    it('should include Metrics when accessLevel >= 1', () => {
      component.accessLevel = 1;
      (component as any).setMenuItems();
      const metricsItem = component.items.find((i) => i.label === 'Metrics');

      expect(metricsItem).toBeDefined();
    });

    it('should not include Metrics when accessLevel < 1', () => {
      component.accessLevel = 0;
      (component as any).setMenuItems();
      const metricsItem = component.items.find((i) => i.label === 'Metrics');

      expect(metricsItem).toBeUndefined();
    });

    it('should include STIG Manager when collectionType is STIG Manager', () => {
      component.collectionType = 'STIG Manager';
      (component as any).setMenuItems();
      const stigItem = component.items.find((i) => i.label === 'STIG Manager');

      expect(stigItem).toBeDefined();
    });

    it('should not include STIG Manager when collectionType is not STIG Manager', () => {
      component.collectionType = 'C-PAT';
      (component as any).setMenuItems();
      const stigItem = component.items.find((i) => i.label === 'STIG Manager');

      expect(stigItem).toBeUndefined();
    });

    it('should include Tenable when collectionType is Tenable', () => {
      component.collectionType = 'Tenable';
      (component as any).setMenuItems();
      const tenableItem = component.items.find((i) => i.label === 'Tenable');

      expect(tenableItem).toBeDefined();
    });

    it('should include Manual POAM Entry when accessLevel >= 2 and manualCreationAllowed', () => {
      component.accessLevel = 2;
      component.manualCreationAllowed = true;
      (component as any).setMenuItems();
      const manualItem = component.items.find((i) => i.label === 'Manual POAM Entry');

      expect(manualItem).toBeDefined();
    });

    it('should not include Manual POAM Entry when manualCreationAllowed is false', () => {
      component.accessLevel = 2;
      component.manualCreationAllowed = false;
      (component as any).setMenuItems();
      const manualItem = component.items.find((i) => i.label === 'Manual POAM Entry');

      expect(manualItem).toBeUndefined();
    });

    it('should not include Manual POAM Entry when accessLevel < 2', () => {
      component.accessLevel = 1;
      component.manualCreationAllowed = true;
      (component as any).setMenuItems();
      const manualItem = component.items.find((i) => i.label === 'Manual POAM Entry');

      expect(manualItem).toBeUndefined();
    });

    it('should always include Log Out item', () => {
      (component as any).setMenuItems();
      const logoutItem = component.items.find((i) => i.label === 'Log Out');

      expect(logoutItem).toBeDefined();
    });

    it('should include Asset Processing and Label Processing when accessLevel >= 1', () => {
      component.accessLevel = 1;
      (component as any).setMenuItems();
      expect(component.items.find((i) => i.label === 'Asset Processing')).toBeDefined();
      expect(component.items.find((i) => i.label === 'Label Processing')).toBeDefined();
    });
  });

  describe('handleMenuClick', () => {
    it('should call item.command when command exists', () => {
      const commandFn = vi.fn();
      const item = { label: 'Test', command: commandFn };

      component.handleMenuClick(item);
      expect(commandFn).toHaveBeenCalled();
    });

    it('should navigate when routerLink exists and no command', () => {
      const item = { label: 'Test', routerLink: ['/test-route'] };

      component.handleMenuClick(item);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route']);
    });

    it('should not navigate when command exists', () => {
      const item = { label: 'Test', command: vi.fn(), routerLink: ['/test-route'] };

      component.handleMenuClick(item);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should do nothing when item has neither command nor routerLink', () => {
      const item = { label: 'Test' };

      component.handleMenuClick(item);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Confirm Popup', () => {
    it('should set confirmPopupVisible to true on showConfirmPopup', () => {
      component.showConfirmPopup();
      expect(component.confirmPopupVisible).toBe(true);
    });

    it('should navigate to ADDPOAM and close popup on confirm', () => {
      component.confirmPopupVisible = true;
      component.onConfirm();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/ADDPOAM']);
      expect(component.confirmPopupVisible).toBe(false);
    });

    it('should close popup on reject', () => {
      component.confirmPopupVisible = true;
      component.onReject();
      expect(component.confirmPopupVisible).toBe(false);
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
  });
});
