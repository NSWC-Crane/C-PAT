/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ElementRef, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Event, Router } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNavigationComponent } from './app.navigation.component';
import { AppConfigService } from '../services/appconfigservice';
import { PayloadService } from '../../common/services/setPayload.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { SharedService } from '../../common/services/shared.service';
import { provideUiTour } from 'ngx-ui-tour-primeng';

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
      accessLevel$: new BehaviorSubject<any>(0).asObservable()
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
      user: signal<any>({ userId: 1, accountStatus: 'ACTIVE' }),
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
      getApiConfig: vi.fn().mockReturnValue(of({ classification: 'U' })),
      startTour: vi.fn(),
      startTour$: new Subject()
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
        { provide: Renderer2, useValue: { listen: vi.fn().mockReturnValue(vi.fn()) } },
        provideUiTour()
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

    it('should initialize user as null', () => {
      expect(component.user()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to authService.user$ and set user', () => {
      fixture.detectChanges();
      expect(component.user()).toEqual({ userId: 1, accountStatus: 'ACTIVE' });
    });

    it('should call getCollections on init', () => {
      fixture.detectChanges();
      expect(mockCollectionsService.getCollections).toHaveBeenCalled();
    });

    it('should not call services when user is null', () => {
      authUserSubject.next(null);
      fixture.detectChanges();

      expect(mockCollectionsService.getCollections).not.toHaveBeenCalled();
    });
  });

  describe('getCollections', () => {
    it('should call sharedService.setSelectedCollection when user has lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE', lastCollectionAccessedId: 1 });
      fixture.detectChanges();

      expect(mockSharedService.setSelectedCollection).toHaveBeenCalledWith(1);
    });

    it('should not seed the selected collection when user has no lastCollectionAccessedId', () => {
      authUserSubject.next({ userId: 1, accountStatus: 'ACTIVE' });
      fixture.detectChanges();

      expect(mockSharedService.setSelectedCollection).not.toHaveBeenCalled();
    });

    it('should handle error from collections service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectionsService.getCollections.mockReturnValue(throwError(() => new Error('Collections error')));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading collections:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('resetWorkspace', () => {
    beforeEach(() => {
      component.user.set({ userId: 1, lastCollectionAccessedId: 1 });
    });

    it('should call sharedService.setSelectedCollection', () => {
      component.resetWorkspace(1);
      expect(mockSharedService.setSelectedCollection).toHaveBeenCalledWith(1);
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

    it('should stop pending subscriptions after destroy', () => {
      fixture.detectChanges();
      fixture.destroy();

      expect(() => authUserSubject.next({ userId: 2, accountStatus: 'ACTIVE' })).not.toThrow();
    });
  });
});
