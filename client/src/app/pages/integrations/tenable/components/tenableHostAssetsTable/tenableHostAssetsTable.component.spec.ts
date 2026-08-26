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
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableHostAssetsTableComponent } from './tenableHostAssetsTable.component';
import { IntegrationService } from '../../../integration.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

const DAY_SECONDS = 86400;
const daysAgo = (days: number) => String(Math.floor(Date.now() / 1000) - days * DAY_SECONDS);

const mockHostResponse = {
  response: [
    {
      id: 'host-1',
      name: 'Server Alpha',
      os: 'Windows Server 2019',
      macAddress: 'AA:BB:CC:DD:EE:01',
      netBios: 'ALPHA',
      dns: 'alpha.example.com',
      ipAddress: '10.0.0.1',
      uuid: 'uuid-1',
      source: [{ type: 'nessus' }],
      acr: { score: '8', lastEvaluatedTime: '1700000000' },
      aes: { score: '450' },
      lastSeen: daysAgo(5),
      firstSeen: '1690000000',
      systemType: 'general-purpose,router'
    },
    {
      id: 'host-2',
      name: 'Appliance Beta',
      os: 'Linux',
      macAddress: 'AA:BB:CC:DD:EE:02',
      netBios: '',
      dns: 'beta.example.com',
      ipAddress: '10.0.0.2',
      uuid: 'uuid-2',
      source: null,
      acr: null,
      aes: null,
      lastSeen: '-1',
      firstSeen: undefined,
      systemType: null
    }
  ]
};

describe('TenableHostAssetsTableComponent', () => {
  let component: TenableHostAssetsTableComponent;
  let fixture: ComponentFixture<TenableHostAssetsTableComponent>;
  let mockIntegrationService: any;
  let mockMessageService: any;
  let mockTable: any;
  let mockMultiSelect: any;

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
    mockTable = { clear: vi.fn(), filterGlobal: vi.fn(), exportCSV: vi.fn() };
    mockMultiSelect = { overlayVisible: vi.fn().mockReturnValue(false), hide: vi.fn(), show: vi.fn() };

    mockIntegrationService = {
      postTenableHostSearch: vi.fn().mockReturnValue(of({ ...mockHostResponse }))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableHostAssetsTableComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: IntegrationService, useValue: mockIntegrationService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(TenableHostAssetsTableComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableHostAssetsTableComponent);
    component = fixture.componentInstance;
    (component as any).hostAssetTable = () => mockTable;
    (component as any).columnSelect = () => mockMultiSelect;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default affectedAssets to empty array', () => {
      expect(component.affectedAssets()).toEqual([]);
    });

    it('should default isLoading to true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords()).toBe(0);
    });

    it('should default filterValue to empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should default selectedHost signal to null', () => {
      expect(component.selectedHost()).toBeNull();
    });

    it('should default displayDialog signal to false', () => {
      expect(component.displayDialog()).toBe(false);
    });
  });

  describe('initColumnsAndFilters', () => {
    beforeEach(() => {
      component.initColumnsAndFilters();
    });

    it('should set 13 columns', () => {
      expect(component.cols).toHaveLength(13);
    });

    it('should include name column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('name');
    });

    it('should include aes column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('aes');
    });

    it('should include acr column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('acr');
    });

    it('should include firstSeen and lastSeen columns', () => {
      const fields = component.cols.map((c: any) => c.field);

      expect(fields).toContain('firstSeen');
      expect(fields).toContain('lastSeen');
    });

    it('should set selectedColumns to include all default fields', () => {
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('name');
      expect(fields).toContain('ipAddress');
      expect(fields).toContain('acr');
    });
  });

  describe('getAffectedAssets', () => {
    beforeEach(() => {
      component.lastSeenRange.set('all');
    });

    it('should return early when tenableRepoId is not set', () => {
      (component as any).tenableRepoId = () => undefined;
      component.getAffectedAssets();
      expect(mockIntegrationService.postTenableHostSearch).not.toHaveBeenCalled();
    });

    it('should call postTenableHostSearch with tenableRepoId filter', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      const callArgs = mockIntegrationService.postTenableHostSearch.mock.calls[0][0];
      const repoFilter = callArgs.filters.and.find((f: any) => f.property === 'repositoryHost');

      expect(repoFilter?.value).toBe('42');
    });

    it('should map host assets from response', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()).toHaveLength(2);
    });

    it('should extract source type from source array', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[0].source).toBe('nessus');
    });

    it('should default source to empty string when source is null', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[1].source).toBe('');
    });

    it('should extract acr score', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[0].acr).toBe('8');
    });

    it('should default acr to empty string when null', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[1].acr).toBe('');
    });

    it('should extract aes score', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[0].aes).toBe('450');
    });

    it('should format systemType with capitalization and spaces', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[0].systemType).toBe('General-Purpose, Router');
    });

    it('should default systemType to empty string when null', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[1].systemType).toBe('');
    });

    it('should format lastSeen timestamp', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[0].lastSeen).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should set lastSeen to undefined for "-1"', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.affectedAssets()[1].lastSeen).toBeUndefined();
    });

    it('should set isLoading to false on success', () => {
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      expect(component.isLoading()).toBe(false);
    });

    it('should show error and set isLoading=false on failure', () => {
      (component as any).tenableRepoId = () => 42;
      mockIntegrationService.postTenableHostSearch.mockReturnValue(throwError(() => new Error('fail')));
      component.getAffectedAssets();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('load generation guard', () => {
    it('keeps the newest repository result when an earlier load lands afterwards', () => {
      const first = new Subject<any>();
      const second = new Subject<any>();

      mockIntegrationService.postTenableHostSearch.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());

      (component as any).tenableRepoId = () => 1;
      component.getAffectedAssets();
      (component as any).tenableRepoId = () => 2;
      component.getAffectedAssets();

      second.next({ response: [{ name: 'repo-2-host', lastSeen: daysAgo(1) }] });
      first.next({ response: [{ name: 'repo-1-host', lastSeen: daysAgo(1) }] });

      expect(component.affectedAssets()[0].name).toBe('repo-2-host');
    });
  });

  describe('last seen window', () => {
    const windowedResponse = {
      response: [
        { id: 'recent', name: 'Recent', lastSeen: daysAgo(5) },
        { id: 'mid', name: 'Mid', lastSeen: daysAgo(45) },
        { id: 'stale', name: 'Stale', lastSeen: daysAgo(200) },
        { id: 'never', name: 'Never', lastSeen: '-1' }
      ]
    };

    beforeEach(() => {
      mockIntegrationService.postTenableHostSearch.mockReturnValue(of(windowedResponse));
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
    });

    it('should default the window to 90 days', () => {
      expect(component.lastSeenRange()).toBe('90');
    });

    it('should keep only hosts last seen within 90 days by default', () => {
      expect(component.affectedAssets().map((host: any) => host.name)).toEqual(['Recent', 'Mid']);
    });

    it('should narrow to hosts last seen within 30 days', () => {
      component.onLastSeenRangeChange('30');
      expect(component.affectedAssets().map((host: any) => host.name)).toEqual(['Recent']);
    });

    it('should narrow to hosts last seen within 7 days', () => {
      component.onLastSeenRangeChange('7');
      expect(component.affectedAssets().map((host: any) => host.name)).toEqual(['Recent']);
    });

    it('should restore every host under all time', () => {
      component.onLastSeenRangeChange('all');
      expect(component.affectedAssets().map((host: any) => host.name)).toEqual(['Recent', 'Mid', 'Stale', 'Never']);
    });

    it('should exclude hosts that have never been seen from bounded windows', () => {
      component.onLastSeenRangeChange('7');
      expect(component.affectedAssets().some((host: any) => host.name === 'Never')).toBe(false);
    });

    it('should report the windowed count in totalRecords', () => {
      expect(component.totalRecords()).toBe(2);
      component.onLastSeenRangeChange('all');
      expect(component.totalRecords()).toBe(4);
    });

    it('should not refetch when the window changes', () => {
      const callCount = mockIntegrationService.postTenableHostSearch.mock.calls.length;

      component.onLastSeenRangeChange('7');
      component.onLastSeenRangeChange('all');
      expect(mockIntegrationService.postTenableHostSearch.mock.calls).toHaveLength(callCount);
    });

    it('should keep the formatted lastSeen for display', () => {
      expect(component.affectedAssets()[0].lastSeen).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should not expose lastSeenRaw as a selectable column', () => {
      component.initColumnsAndFilters();
      expect(component.cols.map((col: any) => col.field)).not.toContain('lastSeenRaw');
    });
  });

  describe('formatTimestamp', () => {
    it('should return undefined for undefined input', () => {
      expect(component.formatTimestamp(undefined)).toBeUndefined();
    });

    it('should return undefined for "-1"', () => {
      expect(component.formatTimestamp('-1')).toBeUndefined();
    });

    it('should format unix timestamp string as MM/dd/yyyy', () => {
      const result = component.formatTimestamp('1700000000');

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return slash-formatted date string as-is', () => {
      expect(component.formatTimestamp('11/14/2023')).toBe('11/14/2023');
    });

    it('should return empty string for non-numeric string', () => {
      expect(component.formatTimestamp('not-a-number')).toBe('');
    });

    it('should handle numeric timestamp', () => {
      const result = component.formatTimestamp(1700000000);

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('onHostNameClick', () => {
    it('should set selectedHost signal to the clicked host', () => {
      const host = { id: 'host-1', name: 'Alpha' };
      const event = { stopPropagation: vi.fn() } as any;

      component.onHostNameClick(host, event);
      expect(component.selectedHost()).toEqual(host);
    });

    it('should set displayDialog signal to true', () => {
      const event = { stopPropagation: vi.fn() } as any;

      component.onHostNameClick({ id: 'x' }, event);
      expect(component.displayDialog()).toBe(true);
    });

    it('should call event.stopPropagation', () => {
      const event = { stopPropagation: vi.fn() } as any;

      component.onHostNameClick({ id: 'x' }, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('showErrorMessage', () => {
    it('should call messageService.add with error severity and sticky', () => {
      component.showErrorMessage('test error');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'test error', sticky: true }));
    });
  });

  describe('clear', () => {
    it('should call hostAssetTable().clear()', () => {
      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset filterValue to empty string', () => {
      component.filterValue = 'some filter';
      component.clear();
      expect(component.filterValue).toBe('');
    });

    it('should reset the last seen window to all time', () => {
      component.onLastSeenRangeChange('7');
      component.clear();
      expect(component.lastSeenRange()).toBe('all');
    });
  });

  describe('onGlobalFilter', () => {
    it('should call filterGlobal with input value and "contains"', () => {
      const event = { target: { value: 'search' } } as any;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search', 'contains');
    });
  });

  describe('exportCSV', () => {
    it('should call hostAssetTable().exportCSV()', () => {
      component.exportCSV();
      expect(mockTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('resetColumnSelections', () => {
    it('should reset selectedColumns to default fields', () => {
      component.initColumnsAndFilters();
      component.selectedColumns = [];
      component.resetColumnSelections();
      expect(component.selectedColumns.length).toBeGreaterThan(0);
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('name');
      expect(fields).toContain('ipAddress');
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(false);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = vi.fn().mockReturnValue(true);
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should not update affectedAssets after destroy (takeUntilDestroyed)', () => {
      const subject = new Subject<any>();

      mockIntegrationService.postTenableHostSearch.mockReturnValue(subject.asObservable());
      (component as any).tenableRepoId = () => 42;
      component.getAffectedAssets();
      fixture.destroy();
      subject.next({ ...mockHostResponse });
      expect(component.affectedAssets()).toEqual([]);
    });

    it('should not throw when destroyed', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
