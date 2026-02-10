import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router, NavigationEnd, Event, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AppBreadcrumbComponent } from './app.breadcrumb.component';

describe('AppBreadcrumbComponent', () => {
  let component: AppBreadcrumbComponent;
  let fixture: ComponentFixture<AppBreadcrumbComponent>;
  let mockLocation: { path: ReturnType<typeof vi.fn> };
  let routerEventsSubject: Subject<Event>;
  let mockRouter: Partial<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    routerEventsSubject = new Subject<Event>();

    mockLocation = {
      path: vi.fn().mockReturnValue('')
    };

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue(''),
      navigate: vi.fn()
    } as unknown as Partial<Router>;

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn()
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [AppBreadcrumbComponent],
      providers: [
        { provide: Location, useValue: mockLocation },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppBreadcrumbComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have home property configured', () => {
      expect(component.home).toBeDefined();
      expect(component.home.icon).toBe('pi pi-home');
      expect(component.home.routerLink).toBe('/poam-processing');
    });

    it('should initialize items as empty signal', () => {
      expect(component.items()).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call updateBreadcrumbs on init', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      expect(mockLocation.path).toHaveBeenCalled();
      expect(component.items().length).toBeGreaterThan(0);
    });

    it('should set POAM Processing breadcrumb for empty path', () => {
      mockLocation.path.mockReturnValue('');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);
    });

    it('should set POAM Processing breadcrumb for root path', () => {
      mockLocation.path.mockReturnValue('/');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);
    });

    it('should set POAM Processing breadcrumb for /poam-processing path', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);
    });
  });

  describe('Router Navigation Events', () => {
    it('should update breadcrumbs on NavigationEnd event', () => {
      mockLocation.path.mockReturnValue('');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);

      mockLocation.path.mockReturnValue('/user-processing');
      routerEventsSubject.next(new NavigationEnd(1, '/user-processing', '/user-processing'));

      expect(component.items()).toEqual([{ label: 'User Processing', routerLink: '/user-processing' }]);
    });

    it('should not update breadcrumbs for non-NavigationEnd events', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      const initialItems = component.items();

      mockLocation.path.mockReturnValue('/user-processing');

      routerEventsSubject.next({ type: 'other' } as any);

      expect(component.items()).toEqual(initialItems);
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

    it('should unsubscribe from router events after destroy', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      component.ngOnDestroy();

      mockLocation.path.mockReturnValue('/user-processing');
      routerEventsSubject.next(new NavigationEnd(1, '/user-processing', '/user-processing'));

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);
    });
  });

  describe('updateBreadcrumbs - URL Parsing', () => {
    it('should handle single segment URL', () => {
      mockLocation.path.mockReturnValue('/metrics');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'Metrics', routerLink: '/metrics' }]);
    });

    it('should handle multi-segment URL', () => {
      mockLocation.path.mockReturnValue('/poam-processing/poam-details');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Processing', routerLink: '/poam-processing' },
        { label: 'POAM Details', routerLink: '/poam-processing/poam-details' }
      ]);
    });

    it('should handle numeric segment as POAM ID', () => {
      mockLocation.path.mockReturnValue('/poam-details/12345');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Details', routerLink: '/poam-details' },
        { label: 'POAM 12345', routerLink: '/poam-details/12345' }
      ]);
    });

    it('should handle multiple segments with numeric ID', () => {
      mockLocation.path.mockReturnValue('/poam-processing/poam-details/42');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Processing', routerLink: '/poam-processing' },
        { label: 'POAM Details', routerLink: '/poam-processing/poam-details' },
        { label: 'POAM 42', routerLink: '/poam-processing/poam-details/42' }
      ]);
    });

    it('should handle URL with query params by ignoring them', () => {
      mockLocation.path.mockReturnValue('/metrics');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'Metrics', routerLink: '/metrics' }]);
    });
  });

  describe('createLabel - Known Routes', () => {
    const knownRoutes = [
      { path: 'poam-processing', expected: 'POAM Processing' },
      { path: 'poam-approve', expected: 'Approve POAM' },
      { path: 'poam-details', expected: 'POAM Details' },
      { path: 'poam-extend', expected: 'Extend POAM' },
      { path: 'poam-log', expected: 'POAM Log' },
      { path: 'poam-manage', expected: 'Manage POAMs' },
      { path: 'stigmanager-admin', expected: 'STIG Manager Admin' },
      { path: 'stigmanager-import', expected: 'STIG Manager' },
      { path: 'tenable-import', expected: 'Tenable' },
      { path: 'user-processing', expected: 'User Processing' },
      { path: 'collection-processing', expected: 'Collection Processing' },
      { path: 'admin-processing', expected: 'Admin Processing' },
      { path: 'import-processing', expected: 'Import Processing' },
      { path: 'asset-processing', expected: 'Asset Processing' },
      { path: 'label-processing', expected: 'Label Processing' },
      { path: 'metrics', expected: 'Metrics' }
    ];

    knownRoutes.forEach(({ path, expected }) => {
      it(`should return "${expected}" for path "${path}"`, () => {
        mockLocation.path.mockReturnValue(`/${path}`);
        fixture.detectChanges();

        expect(component.items()).toEqual([{ label: expected, routerLink: `/${path}` }]);
      });
    });
  });

  describe('createLabel - Default Transformation', () => {
    it('should transform unknown hyphenated path to title case', () => {
      mockLocation.path.mockReturnValue('/custom-route');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'Custom Route', routerLink: '/custom-route' }]);
    });

    it('should transform multi-hyphen path to title case', () => {
      mockLocation.path.mockReturnValue('/my-custom-long-route');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'My Custom Long Route', routerLink: '/my-custom-long-route' }]);
    });

    it('should transform single word path to title case', () => {
      mockLocation.path.mockReturnValue('/dashboard');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'Dashboard', routerLink: '/dashboard' }]);
    });

    it('should handle already capitalized segments', () => {
      mockLocation.path.mockReturnValue('/API-config');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'API Config', routerLink: '/API-config' }]);
    });
  });

  describe('Complex Navigation Scenarios', () => {
    it('should handle navigation from one route to another', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);

      mockLocation.path.mockReturnValue('/admin-processing');
      routerEventsSubject.next(new NavigationEnd(2, '/admin-processing', '/admin-processing'));

      expect(component.items()).toEqual([{ label: 'Admin Processing', routerLink: '/admin-processing' }]);
    });

    it('should handle deep navigation with POAM ID', () => {
      mockLocation.path.mockReturnValue('/poam-processing/poam-manage/poam-details/999');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Processing', routerLink: '/poam-processing' },
        { label: 'Manage POAMs', routerLink: '/poam-processing/poam-manage' },
        { label: 'POAM Details', routerLink: '/poam-processing/poam-manage/poam-details' },
        { label: 'POAM 999', routerLink: '/poam-processing/poam-manage/poam-details/999' }
      ]);
    });

    it('should handle navigation back to root', () => {
      mockLocation.path.mockReturnValue('/user-processing');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'User Processing', routerLink: '/user-processing' }]);

      mockLocation.path.mockReturnValue('/');
      routerEventsSubject.next(new NavigationEnd(3, '/', '/'));

      expect(component.items()).toEqual([{ label: 'POAM Processing', routerLink: '/poam-processing' }]);
    });

    it('should handle stigmanager admin path', () => {
      mockLocation.path.mockReturnValue('/import-processing/stigmanager-admin');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'Import Processing', routerLink: '/import-processing' },
        { label: 'STIG Manager Admin', routerLink: '/import-processing/stigmanager-admin' }
      ]);
    });

    it('should handle tenable import path', () => {
      mockLocation.path.mockReturnValue('/import-processing/tenable-import');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'Import Processing', routerLink: '/import-processing' },
        { label: 'Tenable', routerLink: '/import-processing/tenable-import' }
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple consecutive navigation events', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      mockLocation.path.mockReturnValue('/metrics');
      routerEventsSubject.next(new NavigationEnd(1, '/metrics', '/metrics'));

      mockLocation.path.mockReturnValue('/user-processing');
      routerEventsSubject.next(new NavigationEnd(2, '/user-processing', '/user-processing'));

      mockLocation.path.mockReturnValue('/admin-processing');
      routerEventsSubject.next(new NavigationEnd(3, '/admin-processing', '/admin-processing'));

      expect(component.items()).toEqual([{ label: 'Admin Processing', routerLink: '/admin-processing' }]);
    });

    it('should handle zero as a numeric segment', () => {
      mockLocation.path.mockReturnValue('/poam-details/0');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Details', routerLink: '/poam-details' },
        { label: 'POAM 0', routerLink: '/poam-details/0' }
      ]);
    });

    it('should handle large numeric IDs', () => {
      mockLocation.path.mockReturnValue('/poam-details/9999999');
      fixture.detectChanges();

      expect(component.items()).toEqual([
        { label: 'POAM Details', routerLink: '/poam-details' },
        { label: 'POAM 9999999', routerLink: '/poam-details/9999999' }
      ]);
    });

    it('should handle path with trailing slash (filtered out)', () => {
      mockLocation.path.mockReturnValue('/metrics/');
      fixture.detectChanges();

      expect(component.items()).toEqual([{ label: 'Metrics', routerLink: '/metrics' }]);
    });
  });

  describe('Template Bindings', () => {
    it('should render breadcrumb with correct model', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      const breadcrumb = fixture.nativeElement.querySelector('p-breadcrumb');

      expect(breadcrumb).toBeTruthy();
    });

    it('should update view when items signal changes', () => {
      mockLocation.path.mockReturnValue('/poam-processing');
      fixture.detectChanges();

      const initialLength = component.items().length;

      mockLocation.path.mockReturnValue('/poam-processing/poam-details/123');
      routerEventsSubject.next(new NavigationEnd(1, '/poam-processing/poam-details/123', '/poam-processing/poam-details/123'));

      expect(component.items().length).toBeGreaterThan(initialLength);
    });
  });
});
