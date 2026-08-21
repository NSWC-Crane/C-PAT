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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService, createMockRouter } from '../../../testing/mocks/service-mocks';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { AdminComponent } from './admin.component';
import { PayloadService } from '../../common/services/setPayload.service';

@Component({ selector: 'cpat-users', template: '', standalone: true })
class MockUsersComponent {}

@Component({ selector: 'cpat-collections', template: '', standalone: true })
class MockCollectionsComponent {}

@Component({ selector: 'cpat-asset-delta', template: '', standalone: true })
class MockAssetDeltaComponent {
  @Input() activated: boolean = false;
}

@Component({ selector: 'cpat-vram-import', template: '', standalone: true })
class MockVRAMImportComponent {}

@Component({ selector: 'cpat-nessus-plugin-mapping', template: '', standalone: true })
class MockNessusPluginMappingComponent {
  @Input() activated: boolean = false;
  updatePluginIds = vi.fn();
}

@Component({ selector: 'cpat-aa-packages', template: '', standalone: true })
class MockAAPackagesComponent {}

@Component({ selector: 'cpat-assigned-teams', template: '', standalone: true })
class MockAssignedTeamsComponent {}

@Component({ selector: 'cpat-app-configuration', template: '', standalone: true })
class MockAppConfigurationComponent {}

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let mockRouter: any;
  let mockPayloadService: any;
  let mockMessageService: any;
  let isAdminSubject: BehaviorSubject<boolean | null>;

  beforeEach(async () => {
    (globalThis as any).CPAT = {
      Env: {
        features: {
          tenableEnabled: true
        }
      }
    };

    isAdminSubject = new BehaviorSubject<boolean | null>(null);

    mockRouter = createMockRouter();

    mockPayloadService = {
      isAdmin$: isAdminSubject.asObservable()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: PayloadService, useValue: mockPayloadService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(AdminComponent, {
        set: {
          imports: [
            ButtonModule,
            FormsModule,
            MockAAPackagesComponent,
            MockAppConfigurationComponent,
            MockAssetDeltaComponent,
            MockAssignedTeamsComponent,
            MockCollectionsComponent,
            MockNessusPluginMappingComponent,
            MockUsersComponent,
            MockVRAMImportComponent,
            TabsModule
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize value to 0', () => {
      expect(component.value()).toBe(0);
    });

    it('should set tenableEnabled from CPAT.Env', () => {
      expect(component.tenableEnabled).toBe(true);
    });
  });

  describe('ngOnInit - Admin Check', () => {
    it('should not navigate when isAdmin$ emits null', () => {
      isAdminSubject.next(null);
      fixture.detectChanges();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when isAdmin$ emits true', () => {
      isAdminSubject.next(true);
      fixture.detectChanges();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to /403 when isAdmin$ emits false', () => {
      isAdminSubject.next(false);
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/403']);
    });

    it('should navigate to /403 when admin status changes from true to false', () => {
      isAdminSubject.next(true);
      fixture.detectChanges();

      expect(mockRouter.navigate).not.toHaveBeenCalled();

      isAdminSubject.next(false);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/403']);
    });

    it('should filter out null emissions and only react to boolean', () => {
      fixture.detectChanges();

      isAdminSubject.next(null);
      isAdminSubject.next(null);
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      isAdminSubject.next(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('navigateToAppInfo', () => {
    it('should navigate to /admin/app-info', () => {
      component.navigateToAppInfo();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/app-info']);
    });
  });

  describe('switchToPluginMapping', () => {
    it('should set value to 4', () => {
      component.switchToPluginMapping();

      expect(component.value()).toBe(4);
    });

    it('should call updatePluginIds on nessusPluginMappingComponent after timeout', async () => {
      vi.useFakeTimers();
      const mockNessusComponent = { updatePluginIds: vi.fn() };

      (component as any).nessusPluginMappingComponent = () => mockNessusComponent;

      component.switchToPluginMapping();
      vi.advanceTimersByTime(0);

      expect(mockNessusComponent.updatePluginIds).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not throw when nessusPluginMappingComponent is undefined', async () => {
      vi.useFakeTimers();
      (component as any).nessusPluginMappingComponent = () => undefined;

      expect(() => {
        component.switchToPluginMapping();
        vi.advanceTimersByTime(0);
      }).not.toThrow();
      vi.useRealTimers();
    });

    it('should not throw when nessusPluginMappingComponent is null', async () => {
      vi.useFakeTimers();
      (component as any).nessusPluginMappingComponent = () => null;

      expect(() => {
        component.switchToPluginMapping();
        vi.advanceTimersByTime(0);
      }).not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from isAdmin$ on destroy', () => {
      isAdminSubject.next(true);
      fixture.detectChanges();

      fixture.destroy();
      mockRouter.navigate.mockClear();

      isAdminSubject.next(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not throw when destroyed', () => {
      fixture.detectChanges();

      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  describe('Tenable Disabled', () => {
    it('should set tenableEnabled to false when CPAT.Env.features.tenableEnabled is false', async () => {
      (globalThis as any).CPAT.Env.features.tenableEnabled = false;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AdminComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: PayloadService, useValue: mockPayloadService }, { provide: MessageService, useValue: mockMessageService }]
      })
        .overrideComponent(AdminComponent, {
          set: {
            imports: [
              ButtonModule,
              FormsModule,
              MockAAPackagesComponent,
              MockAppConfigurationComponent,
              MockAssetDeltaComponent,
              MockAssignedTeamsComponent,
              MockCollectionsComponent,
              MockNessusPluginMappingComponent,
              MockUsersComponent,
              MockVRAMImportComponent,
              TabsModule
            ]
          }
        })
        .compileComponents();

      const newFixture = TestBed.createComponent(AdminComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.tenableEnabled).toBe(false);
    });
  });
});
