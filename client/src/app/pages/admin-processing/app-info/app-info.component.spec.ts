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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { AppInfoComponent } from './app-info.component';
import { AdminProcessingService } from '../admin-processing.service';
import { AppConfigService } from '../../../layout/services/appconfigservice';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

const buildMockAppInfo = () => ({
  date: '2024-01-15T10:00:00Z',
  schema: 'cpat',
  version: '1.2.3',
  requests: {
    totalRequests: 1000,
    totalApiRequests: 800,
    totalRequestDuration: 5000,
    operationIds: {
      'GET /users': {
        totalRequests: 50,
        totalDuration: 200,
        elevatedRequests: 10,
        minDuration: 2,
        maxDuration: 50,
        maxDurationUpdates: 3,
        retried: 1,
        averageRetries: 0.02,
        totalResLength: 10000,
        minResLength: 100,
        maxResLength: 500,
        clients: { browser: 30, api: 20 },
        users: { '1': 40, '2': 10 },
        errors: { '404': 2 }
      },
      'POST /poam': {
        totalRequests: 20,
        totalDuration: 400,
        elevatedRequests: 5,
        minDuration: 10,
        maxDuration: 100,
        maxDurationUpdates: 2,
        retried: 0,
        averageRetries: 0,
        totalResLength: 2000,
        minResLength: 50,
        maxResLength: 200,
        clients: { browser: 20 },
        users: { '1': 20 },
        errors: {}
      }
    }
  },
  mysql: {
    version: '8.0.35',
    tables: {
      users: {
        tableRows: 100,
        tableCollation: 'utf8mb4',
        avgRowLength: 128,
        dataLength: 12800,
        indexLength: 4096,
        autoIncrement: 200,
        createTime: '2024-01-01T00:00:00Z',
        updateTime: '2024-01-15T00:00:00Z',
        rowCount: 100
      }
    },
    variables: { max_connections: '151', wait_timeout: '28800' },
    status: { Uptime: 86400, Threads_connected: 5 }
  },
  nodejs: {
    version: '20.11.0',
    uptime: 3661,
    cpus: [{ model: 'Intel Core i7', speed: 2400 }],
    os: {
      platform: 'linux',
      arch: 'x64',
      osName: 'Ubuntu',
      osRelease: '22.04',
      loadAverage: '0.5 0.3 0.2'
    },
    memory: {
      rss: 52428800,
      heapTotal: 31457280,
      heapUsed: 20971520,
      external: 1048576,
      arrayBuffers: 524288,
      maxRss: 104857600
    },
    environment: {
      NODE_ENV: 'production',
      DB_PASSWORD: 'secret',
      PORT: '8080'
    }
  },
  users: {
    userInfo: {
      '1': {
        username: 'alice',
        created: '2024-01-01',
        lastAccess: '2024-01-15',
        privileges: ['admin'],
        roles: { Viewer: 3, Approver: 1, Submitter: 2, 'CAT-I Approver': 0 }
      },
      '2': {
        username: 'bob',
        created: '2024-01-05',
        lastAccess: '2024-01-14',
        privileges: [],
        roles: { Viewer: 1, Approver: 0, Submitter: 0, 'CAT-I Approver': 0 }
      }
    },
    userPrivilegeCounts: {
      activeInLast30Days: { none: 1, admin: 1, cpat_write: 0, user: 2 },
      activeInLast90Days: { none: 2, admin: 1, cpat_write: 1, user: 3 },
      overall: { none: 3, admin: 2, cpat_write: 1, user: 5 }
    }
  }
});

describe('AppInfoComponent', () => {
  let component: AppInfoComponent;
  let fixture: ComponentFixture<AppInfoComponent>;
  let mockAdminProcessingService: any;
  let mockAppConfigService: any;
  let mockMessageService: any;

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
    mockAdminProcessingService = {
      getAppInfo: vi.fn().mockReturnValue(of(buildMockAppInfo()))
    };

    mockAppConfigService = {
      transitionComplete: signal(false),
      appState: signal({ darkTheme: false })
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AppInfoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminProcessingService, useValue: mockAdminProcessingService },
        { provide: AppConfigService, useValue: mockAppConfigService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(AppInfoComponent, {
        set: {
          imports: [ButtonModule, CardModule, ChartModule, CommonModule, FormsModule, PanelModule, TableModule, TabsModule, ToastModule]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppInfoComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default appInfo signal to null', () => {
      expect(component.appInfo()).toBeNull();
    });

    it('should default operationRows to empty array', () => {
      expect(component.operationRows()).toEqual([]);
    });

    it('should default isPanelsCollapsed to true', () => {
      expect(component.isPanelsCollapsed()).toBe(true);
    });

    it('should default selectedOperation to null', () => {
      expect(component.selectedOperation()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call getAppInfo', async () => {
      await component.ngOnInit();
      expect(mockAdminProcessingService.getAppInfo).toHaveBeenCalled();
    });

    it('should set appInfo after init', async () => {
      await component.ngOnInit();
      expect(component.appInfo()).not.toBeNull();
      expect(component.appInfo()!.version).toBe('1.2.3');
    });

    it('should populate operationRows after init', async () => {
      await component.ngOnInit();
      expect(component.operationRows().length).toBeGreaterThan(0);
    });

    it('should populate variableRows after init', async () => {
      await component.ngOnInit();
      expect(component.variableRows().length).toBeGreaterThan(0);
    });

    it('should populate statusRows after init', async () => {
      await component.ngOnInit();
      expect(component.statusRows().length).toBeGreaterThan(0);
    });

    it('should populate mysqlTableRows after init', async () => {
      await component.ngOnInit();
      expect(component.mysqlTableRows().length).toBeGreaterThan(0);
    });

    it('should populate cpuRows after init', async () => {
      await component.ngOnInit();
      expect(component.cpuRows().length).toBe(1);
    });

    it('should populate environmentRows after init', async () => {
      await component.ngOnInit();
      expect(component.environmentRows().length).toBe(3);
    });

    it('should populate userRows after init', async () => {
      await component.ngOnInit();
      expect(component.userRows().length).toBe(2);
    });

    it('should show error message when getAppInfo fails', async () => {
      mockAdminProcessingService.getAppInfo.mockReturnValue(throwError(() => new Error('Network error')));
      await component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('getAppInfo', () => {
    it('should resolve and set appInfo on success', async () => {
      await component.getAppInfo();
      expect(component.appInfo()).not.toBeNull();
    });

    it('should reject and show error on failure', async () => {
      mockAdminProcessingService.getAppInfo.mockReturnValue(throwError(() => new Error('Error')));
      await expect(component.getAppInfo()).rejects.toBeDefined();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('processOperations (via ngOnInit)', () => {
    it('should map operationId keys to name field', async () => {
      await component.ngOnInit();
      const names = component.operationRows().map((r) => r.name);

      expect(names).toContain('GET /users');
      expect(names).toContain('POST /poam');
    });

    it('should include totalRequests in each row', async () => {
      await component.ngOnInit();
      const row = component.operationRows().find((r) => r.name === 'GET /users');

      expect(row?.totalRequests).toBe(50);
    });
  });

  describe('processVariables (via ngOnInit)', () => {
    it('should map mysql.variables to name/value pairs', async () => {
      await component.ngOnInit();
      const row = component.variableRows().find((r) => r.name === 'max_connections');

      expect(row?.value).toBe('151');
    });
  });

  describe('processStatus (via ngOnInit)', () => {
    it('should map mysql.status to name/value pairs', async () => {
      await component.ngOnInit();
      const row = component.statusRows().find((r) => r.name === 'Uptime');

      expect(row?.value).toBe(86400);
    });
  });

  describe('processMySQLTables (via ngOnInit)', () => {
    it('should map mysql.tables to rows with name field', async () => {
      await component.ngOnInit();
      const row = component.mysqlTableRows().find((r) => r.name === 'users');

      expect(row?.rowCount).toBe(100);
    });
  });

  describe('processCPUInfo (via ngOnInit)', () => {
    it('should set cpuRows from nodejs.cpus', async () => {
      await component.ngOnInit();
      expect(component.cpuRows()[0].model).toBe('Intel Core i7');
      expect(component.cpuRows()[0].speed).toBe(2400);
    });
  });

  describe('processEnvironmentVariables (via ngOnInit)', () => {
    it('should mask PASSWORD values', async () => {
      await component.ngOnInit();
      const row = component.environmentRows().find((r) => r.name === 'DB_PASSWORD');

      expect(row?.value).toBe('***');
    });

    it('should not mask non-password values', async () => {
      await component.ngOnInit();
      const row = component.environmentRows().find((r) => r.name === 'PORT');

      expect(row?.value).toBe('8080');
    });
  });

  describe('processUsers (via ngOnInit)', () => {
    it('should map user info to userRows', async () => {
      await component.ngOnInit();
      const alice = component.userRows().find((u) => u.username === 'alice');

      expect(alice).toBeDefined();
    });

    it('should set userPrivilegeOverall from privilege counts', async () => {
      await component.ngOnInit();
      expect(component.userPrivilegeOverall().length).toBe(4);
    });

    it('should set userPrivilege30Days from privilege counts', async () => {
      await component.ngOnInit();
      expect(component.userPrivilege30Days().length).toBe(4);
    });

    it('should set userPrivilege90Days from privilege counts', async () => {
      await component.ngOnInit();
      expect(component.userPrivilege90Days().length).toBe(4);
    });
  });

  describe('onOperationSelect', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should set isPanelsCollapsed to false', () => {
      component.onOperationSelect({ data: { name: 'GET /users' } });
      expect(component.isPanelsCollapsed()).toBe(false);
    });

    it('should populate selectedOperationClients', () => {
      component.onOperationSelect({ data: { name: 'GET /users' } });
      const clients = component.selectedOperationClients();

      expect(clients.some((c) => c.name === 'browser')).toBe(true);
    });

    it('should populate selectedOperationUsers with usernames', () => {
      component.onOperationSelect({ data: { name: 'GET /users' } });
      const users = component.selectedOperationUsers();

      expect(users.some((u) => u.name === 'alice')).toBe(true);
    });

    it('should populate selectedOperationErrors', () => {
      component.onOperationSelect({ data: { name: 'GET /users' } });
      const errors = component.selectedOperationErrors();

      expect(errors.some((e) => e.name === '404')).toBe(true);
    });

    it('should set empty errors when operation has no errors', () => {
      component.onOperationSelect({ data: { name: 'POST /poam' } });
      expect(component.selectedOperationErrors().length).toBe(0);
    });

    it('should do nothing when event.data is null', () => {
      component.onOperationSelect({ data: null });
      expect(component.isPanelsCollapsed()).toBe(true);
    });
  });

  describe('formatBytes', () => {
    it('should return 0 Bytes for 0', () => {
      expect(component.formatBytes(0)).toBe('0 Bytes');
    });

    it('should return 0 Bytes for undefined', () => {
      expect(component.formatBytes(undefined)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(component.formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(component.formatBytes(1048576)).toBe('1 MB');
    });

    it('should format with decimal places', () => {
      expect(component.formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('formatUptime', () => {
    it('should return 0s for undefined', () => {
      expect(component.formatUptime(undefined)).toBe('0s');
    });

    it('should return 0s for 0', () => {
      expect(component.formatUptime(0)).toBe('0s');
    });

    it('should format seconds only', () => {
      expect(component.formatUptime(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(component.formatUptime(125)).toBe('2m 5s');
    });

    it('should format hours', () => {
      expect(component.formatUptime(3600)).toBe('1h');
    });

    it('should format days hours minutes seconds', () => {
      expect(component.formatUptime(90061)).toBe('1d 1h 1m 1s');
    });

    it('should omit zero parts', () => {
      expect(component.formatUptime(3661)).toBe('1h 1m 1s');
    });
  });

  describe('toggleAllPanels', () => {
    it('should toggle isPanelsCollapsed from true to false', () => {
      expect(component.isPanelsCollapsed()).toBe(true);
      component.toggleAllPanels(null);
      expect(component.isPanelsCollapsed()).toBe(false);
    });

    it('should toggle isPanelsCollapsed from false to true', () => {
      component.isPanelsCollapsed.set(false);
      component.toggleAllPanels(null);
      expect(component.isPanelsCollapsed()).toBe(true);
    });
  });

  describe('goBack', () => {
    it('should call history.back', () => {
      const backSpy = vi.spyOn(globalThis.history, 'back').mockImplementation(() => {});

      component.goBack();
      expect(backSpy).toHaveBeenCalled();
      backSpy.mockRestore();
    });
  });
});
