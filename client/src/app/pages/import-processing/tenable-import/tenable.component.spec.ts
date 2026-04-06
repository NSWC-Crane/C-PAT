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
import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { TenableComponent } from './tenable.component';

describe('TenableComponent', () => {
  let component: TenableComponent;
  let fixture: ComponentFixture<TenableComponent>;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };
  });

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [TenableComponent]
    })
      .overrideComponent(TenableComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableComponent);
    component = fixture.componentInstance;
    (component as any).vulnerabilitiesComponent = () => ({});
    (component as any).tabComponent = () => null;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default mainTotal to 0', () => {
      expect(component.mainTotal).toBe(0);
    });

    it('should default thirtyPlusTotal to 0', () => {
      expect(component.thirtyPlusTotal).toBe(0);
    });

    it('should default exploitableTotal to 0', () => {
      expect(component.exploitableTotal).toBe(0);
    });

    it('should default iavVulnerabilitiesCount to 0', () => {
      expect(component.iavVulnerabilitiesCount).toBe(0);
    });

    it('should default taskOrderCount to 0', () => {
      expect(component.taskOrderCount).toBe(0);
    });

    it('should default failedCredentialCount to 0', () => {
      expect(component.failedCredentialCount).toBe(0);
    });

    it('should default seolCount to 0', () => {
      expect(component.seolCount).toBe(0);
    });

    it('should default activeTabIndex to "0"', () => {
      expect(component.activeTabIndex).toBe('0');
    });

    it('should default loadedTabs to Set containing "0"', () => {
      expect(component.loadedTabs).toBeInstanceOf(Set);
      expect(component.loadedTabs.has('0')).toBe(true);
    });

    it('should default sidebarVisible to false', () => {
      expect(component.sidebarVisible).toBe(false);
    });
  });

  describe('ngOnInit — no saved state', () => {
    it('should set activeTabIndex to "0" when no session state', () => {
      component.ngOnInit();
      expect(component.activeTabIndex).toBe('0');
    });

    it('should add "0" to loadedTabs when no session state', () => {
      component.loadedTabs.clear();
      component.ngOnInit();
      expect(component.loadedTabs.has('0')).toBe(true);
    });
  });

  describe('ngOnInit — with saved state', () => {
    it('should restore activeTabIndex from session storage', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ parentTabIndex: 2 }));
      component.ngOnInit();
      expect(component.activeTabIndex).toBe('2');
    });

    it('should add restored tab index to loadedTabs', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ parentTabIndex: 3 }));
      component.ngOnInit();
      expect(component.loadedTabs.has('3')).toBe(true);
    });

    it('should keep activeTabIndex as "0" when saved state has no parentTabIndex', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ someOtherKey: 'value' }));
      component.ngOnInit();
      expect(component.activeTabIndex).toBe('0');
    });

    it('should convert parentTabIndex number to string', () => {
      sessionStorage.setItem('tenableFilterState', JSON.stringify({ parentTabIndex: 0 }));
      component.ngOnInit();
      expect(typeof component.activeTabIndex).toBe('string');
    });
  });

  describe('onTabChange', () => {
    it('should update activeTabIndex to string of given index', () => {
      component.onTabChange(2);
      expect(component.activeTabIndex).toBe('2');
    });

    it('should convert number index to string', () => {
      component.onTabChange(3);
      expect(typeof component.activeTabIndex).toBe('string');
      expect(component.activeTabIndex).toBe('3');
    });

    it('should add new tab index to loadedTabs', () => {
      component.onTabChange(2);
      expect(component.loadedTabs.has('2')).toBe(true);
    });

    it('should not duplicate tab index in loadedTabs if already loaded', () => {
      component.loadedTabs.add('1');
      component.onTabChange(1);
      expect(component.loadedTabs.size).toBe(2);
    });

    it('should set sidebarVisible to false', () => {
      component.sidebarVisible = true;
      component.onTabChange(1);
      expect(component.sidebarVisible).toBe(false);
    });

    it('should handle string index', () => {
      component.onTabChange('1');
      expect(component.activeTabIndex).toBe('1');
    });

    it('should retain previously loaded tabs when switching', () => {
      component.onTabChange(1);
      component.onTabChange(2);
      expect(component.loadedTabs.has('0')).toBe(true);
      expect(component.loadedTabs.has('1')).toBe(true);
      expect(component.loadedTabs.has('2')).toBe(true);
    });
  });

  describe('onSidebarToggle', () => {
    it('should set sidebarVisible to true', () => {
      component.sidebarVisible = false;
      component.onSidebarToggle(true);
      expect(component.sidebarVisible).toBe(true);
    });

    it('should set sidebarVisible to false', () => {
      component.sidebarVisible = true;
      component.onSidebarToggle(false);
      expect(component.sidebarVisible).toBe(false);
    });
  });

  describe('loadedTabs behavior', () => {
    it('should start with tab "0" already loaded', () => {
      expect(component.loadedTabs.has('0')).toBe(true);
    });

    it('should accumulate loaded tabs across multiple tab changes', () => {
      component.onTabChange(1);
      component.onTabChange(2);
      component.onTabChange(3);
      expect(component.loadedTabs.size).toBe(4);
    });

    it('should not add duplicate when switching back to already-loaded tab', () => {
      component.onTabChange(1);
      const sizeAfterFirst = component.loadedTabs.size;

      component.onTabChange(1);
      expect(component.loadedTabs.size).toBe(sizeAfterFirst);
    });
  });
});
