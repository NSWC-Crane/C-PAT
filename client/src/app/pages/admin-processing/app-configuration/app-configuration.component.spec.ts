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
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { AppConfigurationComponent } from './app-configuration.component';
import { AppConfigurationService } from './app-configuration.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

describe('AppConfigurationComponent', () => {
  let component: AppConfigurationComponent;
  let fixture: ComponentFixture<AppConfigurationComponent>;
  let mockAppConfigurationService: any;
  let mockMessageService: any;

  const mockConfigs = [
    { settingName: 'setting.one', settingValue: 'value1' },
    { settingName: 'setting.two', settingValue: 'value2' },
    { settingName: 'setting.three', settingValue: 'value3' }
  ];

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
    mockAppConfigurationService = {
      getAppConfiguration: vi.fn().mockReturnValue(of([...mockConfigs])),
      putAppConfiguration: vi.fn().mockReturnValue(of({}))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AppConfigurationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AppConfigurationService, useValue: mockAppConfigurationService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(AppConfigurationComponent, {
        set: {
          imports: [ButtonModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, TableModule, ToastModule]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppConfigurationComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default appConfiguration to empty array', () => {
      expect(component.appConfiguration).toEqual([]);
    });

    it('should default editingAppConfiguration to null', () => {
      expect(component.editingAppConfiguration).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadAppConfiguration', () => {
      component.ngOnInit();
      expect(mockAppConfigurationService.getAppConfiguration).toHaveBeenCalled();
    });

    it('should populate appConfiguration after init', () => {
      component.ngOnInit();
      expect(component.appConfiguration).toEqual(mockConfigs);
    });
  });

  describe('loadAppConfiguration', () => {
    it('should set appConfiguration on success', () => {
      component.loadAppConfiguration();
      expect(component.appConfiguration).toEqual(mockConfigs);
    });

    it('should set appConfiguration to empty array when response is null', () => {
      mockAppConfigurationService.getAppConfiguration.mockReturnValue(of(null));
      component.loadAppConfiguration();
      expect(component.appConfiguration).toEqual([]);
    });

    it('should show error message on failure', () => {
      mockAppConfigurationService.getAppConfiguration.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadAppConfiguration();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('onRowEditInit', () => {
    it('should store a copy of the config in editingAppConfiguration', () => {
      const config = { settingName: 'setting.one', settingValue: 'value1' };

      component.onRowEditInit(config);
      expect(component.editingAppConfiguration).toEqual(config);
      expect(component.editingAppConfiguration).not.toBe(config);
    });
  });

  describe('onRowEditSave', () => {
    it('should call putAppConfiguration with the config', () => {
      const config = { settingName: 'setting.one', settingValue: 'updated' };

      component.onRowEditSave(config);
      expect(mockAppConfigurationService.putAppConfiguration).toHaveBeenCalledWith(config);
    });

    it('should show success message with setting name', () => {
      const config = { settingName: 'setting.one', settingValue: 'updated' };

      component.onRowEditSave(config);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: 'setting.one updated.' }));
    });

    it('should clear editingAppConfiguration on success', () => {
      component.editingAppConfiguration = { settingName: 'setting.one', settingValue: 'old' };
      component.onRowEditSave({ settingName: 'setting.one', settingValue: 'new' });
      expect(component.editingAppConfiguration).toBeNull();
    });

    it('should show error message on failure', () => {
      mockAppConfigurationService.putAppConfiguration.mockReturnValue(throwError(() => new Error('Error')));
      component.onRowEditSave({ settingName: 'setting.one', settingValue: 'x' });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should not clear editingAppConfiguration on error', () => {
      mockAppConfigurationService.putAppConfiguration.mockReturnValue(throwError(() => new Error('Error')));
      component.editingAppConfiguration = { settingName: 'setting.one', settingValue: 'old' };
      component.onRowEditSave({ settingName: 'setting.one', settingValue: 'x' });
      expect(component.editingAppConfiguration).not.toBeNull();
    });
  });

  describe('onRowEditCancel', () => {
    it('should restore original config at the given index', () => {
      component.editingAppConfiguration = { settingName: 'setting.one', settingValue: 'original' };
      component.appConfiguration = [{ settingName: 'setting.one', settingValue: 'modified' }, ...mockConfigs.slice(1)];
      component.onRowEditCancel(0);
      expect(component.appConfiguration[0].settingValue).toBe('original');
    });

    it('should clear editingAppConfiguration after cancel', () => {
      component.editingAppConfiguration = { settingName: 'setting.one', settingValue: 'original' };
      component.appConfiguration = [...mockConfigs];
      component.onRowEditCancel(0);
      expect(component.editingAppConfiguration).toBeNull();
    });
  });

  describe('filterGlobal', () => {
    it('should call table filterGlobal with contains', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: { value: 'setting' } } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('setting', 'contains');
    });

    it('should pass empty string when target is null', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).table = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: null } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });
});
