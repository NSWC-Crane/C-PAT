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
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { AppSearchComponent } from './app.search.component';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AppSearchComponent', () => {
  let component: AppSearchComponent;
  let fixture: ComponentFixture<AppSearchComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        features: {
          marketplaceDisabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppSearchComponent, NoopAnimationsModule],
      providers: [{ provide: Router, useValue: mockRouter }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty query initially', () => {
      expect(component.query).toBe('');
    });

    it('should have default placeholder', () => {
      expect(component.placeholder).toBe('Search...');
    });

    it('should have empty filteredItems initially', () => {
      expect(component.filteredItems).toEqual([]);
    });

    it('should inject Router', () => {
      expect(component['router']).toBeTruthy();
    });

    it('should initialize search items in constructor', () => {
      expect(component['searchItems'].length).toBeGreaterThan(0);
    });
  });

  describe('search items initialization', () => {
    it('should include Add POAM item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Add POAM');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/poam-processing/poam-details/ADDPOAM');
    });

    it('should include Asset Processing item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Asset Processing');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/asset-processing');
    });

    it('should include Home item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Home');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/poam-processing');
    });

    it('should include Import Processing item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Import Processing');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/import-processing');
    });

    it('should include Label Processing item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Label Processing');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/label-processing');
    });

    it('should include Manage POAMs item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Manage POAMs');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/poam-processing/poam-manage');
    });

    it('should include Metrics item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Metrics');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/metrics');
    });

    it('should include Notifications item', () => {
      const item = component['searchItems'].find((i) => i.title === 'Notifications');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/notifications');
    });

    it('should include Marketplace item when not disabled', () => {
      const item = component['searchItems'].find((i) => i.title === 'Marketplace');

      expect(item).toBeTruthy();
      expect(item?.path).toBe('/marketplace');
    });
  });

  describe('search items with marketplace disabled', () => {
    beforeEach(async () => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = true;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AppSearchComponent, NoopAnimationsModule],
        providers: [{ provide: Router, useValue: mockRouter }]
      }).compileComponents();

      fixture = TestBed.createComponent(AppSearchComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      (globalThis as any).CPAT.Env.features.marketplaceDisabled = false;
    });

    it('should not include Marketplace item when disabled', () => {
      const item = component['searchItems'].find((i) => i.title === 'Marketplace');

      expect(item).toBeUndefined();
    });

    it('should still include other items when marketplace is disabled', () => {
      expect(component['searchItems'].find((i) => i.title === 'Home')).toBeTruthy();
      expect(component['searchItems'].find((i) => i.title === 'Metrics')).toBeTruthy();
    });
  });

  describe('search', () => {
    it('should filter items based on query', () => {
      component.search({ query: 'poam' });
      expect(component.filteredItems.length).toBeGreaterThan(0);
    });

    it('should find Add POAM when searching for "add"', () => {
      component.search({ query: 'add' });
      expect(component.filteredItems.some((i) => i.title === 'Add POAM')).toBe(true);
    });

    it('should find Manage POAMs when searching for "manage"', () => {
      component.search({ query: 'manage' });
      expect(component.filteredItems.some((i) => i.title === 'Manage POAMs')).toBe(true);
    });

    it('should be case insensitive', () => {
      component.search({ query: 'POAM' });
      const upperResults = [...component.filteredItems];

      component.search({ query: 'poam' });
      const lowerResults = [...component.filteredItems];

      expect(upperResults.length).toBe(lowerResults.length);
    });

    it('should find Home when searching for "home"', () => {
      component.search({ query: 'home' });
      expect(component.filteredItems.some((i) => i.title === 'Home')).toBe(true);
    });

    it('should find multiple items with common text', () => {
      component.search({ query: 'processing' });
      expect(component.filteredItems.length).toBeGreaterThan(1);
    });

    it('should return empty array for non-matching query', () => {
      component.search({ query: 'xyz123nonexistent' });
      expect(component.filteredItems).toEqual([]);
    });

    it('should find items with partial match', () => {
      component.search({ query: 'met' });
      expect(component.filteredItems.some((i) => i.title === 'Metrics')).toBe(true);
    });

    it('should find Notifications when searching for "notif"', () => {
      component.search({ query: 'notif' });
      expect(component.filteredItems.some((i) => i.title === 'Notifications')).toBe(true);
    });

    it('should update filteredItems on each search', () => {
      component.search({ query: 'home' });
      expect(component.filteredItems.length).toBe(1);

      component.search({ query: 'processing' });
      expect(component.filteredItems.length).toBeGreaterThan(1);
    });
  });

  describe('navigateTo', () => {
    it('should navigate to item path', () => {
      const item = { title: 'Home', path: '/poam-processing' };

      component.navigateTo({ value: item });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
    });

    it('should clear query after navigation', () => {
      component.query = 'test';
      const item = { title: 'Home', path: '/poam-processing' };

      component.navigateTo({ value: item });
      expect(component.query).toBe('');
    });

    it('should navigate to Add POAM path', () => {
      const item = { title: 'Add POAM', path: '/poam-processing/poam-details/ADDPOAM' };

      component.navigateTo({ value: item });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing/poam-details/ADDPOAM']);
    });

    it('should navigate to Asset Processing path', () => {
      const item = { title: 'Asset Processing', path: '/asset-processing' };

      component.navigateTo({ value: item });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/asset-processing']);
    });

    it('should navigate to Metrics path', () => {
      const item = { title: 'Metrics', path: '/metrics' };

      component.navigateTo({ value: item });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/metrics']);
    });

    it('should not navigate if item is null', () => {
      component.navigateTo({ value: null as any });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate if item path is empty', () => {
      component.navigateTo({ value: { title: 'Test', path: '' } });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not clear query if navigation fails due to null item', () => {
      component.query = 'test';
      component.navigateTo({ value: null as any });
      expect(component.query).toBe('test');
    });
  });

  describe('template rendering', () => {
    it('should render p-autoComplete', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete).toBeTruthy();
    });

    it('should have correct placeholder', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.componentInstance.placeholder).toBe('Search...');
    });

    it('should have minLength set to 1', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.componentInstance.minLength).toBe(1);
    });

    it('should have scrollHeight set to 500px', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.componentInstance.scrollHeight).toBe('500px');
    });

    it('should have optionLabel set to title', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.componentInstance.optionLabel).toBe('title');
    });

    it('should have w-full class', () => {
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.classes['w-full']).toBe(true);
    });
  });

  describe('autocomplete integration', () => {
    it('should bind query to ngModel', () => {
      component.query = 'test query';
      fixture.detectChanges();
      expect(component.query).toBe('test query');
    });

    it('should bind filteredItems to suggestions', () => {
      component.search({ query: 'home' });
      fixture.detectChanges();
      const autocomplete = fixture.debugElement.query(By.css('p-autoComplete'));

      expect(autocomplete.componentInstance.suggestions).toEqual(component.filteredItems);
    });
  });

  describe('search and navigation workflow', () => {
    it('should complete full search and select workflow', () => {
      component.search({ query: 'home' });
      expect(component.filteredItems.length).toBe(1);
      expect(component.filteredItems[0].title).toBe('Home');

      component.navigateTo({ value: component.filteredItems[0] });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
      expect(component.query).toBe('');
    });

    it('should handle multiple searches before navigation', () => {
      component.search({ query: 'poam' });
      const poamResults = component.filteredItems.length;

      component.search({ query: 'processing' });
      const processingResults = component.filteredItems.length;

      expect(poamResults).not.toBe(processingResults);

      component.navigateTo({ value: component.filteredItems[0] });
      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty search query', () => {
      component.search({ query: '' });
      expect(component.filteredItems.length).toBe(component['searchItems'].length);
    });

    it('should handle single character search', () => {
      component.search({ query: 'a' });
      expect(component.filteredItems.length).toBeGreaterThan(0);
    });

    it('should handle search with spaces', () => {
      component.search({ query: 'add poam' });
      expect(component.filteredItems.some((i) => i.title === 'Add POAM')).toBe(true);
    });

    it('should handle search with leading/trailing spaces', () => {
      component.search({ query: ' home ' });
      expect(component.filteredItems).toEqual([]);
    });

    it('should preserve item structure in filtered results', () => {
      component.search({ query: 'home' });
      const item = component.filteredItems[0];

      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('path');
    });
  });
});
