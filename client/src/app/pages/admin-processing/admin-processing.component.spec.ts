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
import { ToastModule } from 'primeng/toast';
import { AdminProcessingComponent } from './admin-processing.component';
import { PayloadService } from '../../common/services/setPayload.service';

@Component({ selector: 'cpat-user-processing', template: '', standalone: true })
class MockUserProcessingComponent {}

@Component({ selector: 'cpat-collection-processing', template: '', standalone: true })
class MockCollectionProcessingComponent {}

@Component({ selector: 'cpat-stigmanager-admin', template: '', standalone: true })
class MockSTIGManagerAdminComponent {}

@Component({ selector: 'cpat-tenable-admin', template: '', standalone: true })
class MockTenableAdminComponent {}

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

@Component({ selector: 'cpat-aa-package-processing', template: '', standalone: true })
class MockAAPackageProcessingComponent {}

@Component({ selector: 'cpat-assigned-team-processing', template: '', standalone: true })
class MockAssignedTeamProcessingComponent {}

@Component({ selector: 'cpat-app-configuration', template: '', standalone: true })
class MockAppConfigurationComponent {}

describe('AdminProcessingComponent', () => {
  let component: AdminProcessingComponent;
  let fixture: ComponentFixture<AdminProcessingComponent>;
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
      imports: [AdminProcessingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: PayloadService, useValue: mockPayloadService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(AdminProcessingComponent, {
        set: {
          imports: [
            ButtonModule,
            FormsModule,
            MockAAPackageProcessingComponent,
            MockAppConfigurationComponent,
            MockAssetDeltaComponent,
            MockAssignedTeamProcessingComponent,
            MockCollectionProcessingComponent,
            MockNessusPluginMappingComponent,
            MockSTIGManagerAdminComponent,
            MockTenableAdminComponent,
            MockUserProcessingComponent,
            MockVRAMImportComponent,
            TabsModule,
            ToastModule
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminProcessingComponent);
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
      expect(component.value).toBe(0);
    });

    it('should initialize user as undefined', () => {
      expect(component.user).toBeUndefined();
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
    it('should navigate to /admin-processing/app-info', () => {
      component.navigateToAppInfo();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin-processing/app-info']);
    });
  });

  describe('switchToPluginMapping', () => {
    it('should set value to 6', () => {
      component.switchToPluginMapping();

      expect(component.value).toBe(6);
    });

    it('should call updatePluginIds on nessusPluginMappingComponent after timeout', async () => {
      vi.useFakeTimers();
      const mockNessusComponent = { updatePluginIds: vi.fn() };

      component.nessusPluginMappingComponent = mockNessusComponent as any;

      component.switchToPluginMapping();
      vi.advanceTimersByTime(0);

      expect(mockNessusComponent.updatePluginIds).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not throw when nessusPluginMappingComponent is undefined', async () => {
      vi.useFakeTimers();
      component.nessusPluginMappingComponent = undefined as any;

      expect(() => {
        component.switchToPluginMapping();
        vi.advanceTimersByTime(0);
      }).not.toThrow();
      vi.useRealTimers();
    });

    it('should not throw when nessusPluginMappingComponent is null', async () => {
      vi.useFakeTimers();
      component.nessusPluginMappingComponent = null as any;

      expect(() => {
        component.switchToPluginMapping();
        vi.advanceTimersByTime(0);
      }).not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from isAdmin$ on destroy', () => {
      isAdminSubject.next(true);
      fixture.detectChanges();

      component.ngOnDestroy();

      isAdminSubject.next(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not throw when called multiple times', () => {
      fixture.detectChanges();

      expect(() => {
        component.ngOnDestroy();
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Tenable Disabled', () => {
    it('should set tenableEnabled to false when CPAT.Env.features.tenableEnabled is false', async () => {
      (globalThis as any).CPAT.Env.features.tenableEnabled = false;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AdminProcessingComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: mockRouter }, { provide: PayloadService, useValue: mockPayloadService }, { provide: MessageService, useValue: mockMessageService }]
      })
        .overrideComponent(AdminProcessingComponent, {
          set: {
            imports: [
              ButtonModule,
              FormsModule,
              MockAAPackageProcessingComponent,
              MockAppConfigurationComponent,
              MockAssetDeltaComponent,
              MockAssignedTeamProcessingComponent,
              MockCollectionProcessingComponent,
              MockNessusPluginMappingComponent,
              MockSTIGManagerAdminComponent,
              MockTenableAdminComponent,
              MockUserProcessingComponent,
              MockVRAMImportComponent,
              TabsModule,
              ToastModule
            ]
          }
        })
        .compileComponents();

      const newFixture = TestBed.createComponent(AdminProcessingComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.tenableEnabled).toBe(false);
    });
  });
});
