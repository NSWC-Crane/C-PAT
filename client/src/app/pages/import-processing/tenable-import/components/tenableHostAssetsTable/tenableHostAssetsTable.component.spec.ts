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
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TenableHostAssetsTableComponent } from './tenableHostAssetsTable.component';
import { ImportService } from '../../../import.service';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';

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
      lastSeen: '1700000000',
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
  let mockImportService: any;
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
    mockMultiSelect = { overlayVisible: false, hide: vi.fn(), show: vi.fn() };

    mockImportService = {
      postTenableHostSearch: vi.fn().mockReturnValue(of({ ...mockHostResponse }))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [TenableHostAssetsTableComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ImportService, useValue: mockImportService }, { provide: MessageService, useValue: mockMessageService }]
    })
      .overrideComponent(TenableHostAssetsTableComponent, {
        set: { imports: [], template: '<div></div>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenableHostAssetsTableComponent);
    component = fixture.componentInstance;
    (component as any).hostAssetTable = () => mockTable;
    (component as any).multiSelect = () => mockMultiSelect;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default affectedAssets to empty array', () => {
      expect(component.affectedAssets).toEqual([]);
    });

    it('should default isLoading to true', () => {
      expect(component.isLoading).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
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
      expect(component.cols.length).toBe(13);
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

    it('should set exportColumns matching cols length', () => {
      expect(component.exportColumns.length).toBe(13);
    });

    it('should set selectedColumns to include all default fields', () => {
      const fields = component.selectedColumns.map((c: any) => c.field);

      expect(fields).toContain('name');
      expect(fields).toContain('ipAddress');
      expect(fields).toContain('acr');
    });
  });

  describe('getAffectedAssets', () => {
    it('should return early when tenableRepoId is not set', () => {
      component.tenableRepoId = undefined as any;
      component.getAffectedAssets();
      expect(mockImportService.postTenableHostSearch).not.toHaveBeenCalled();
    });

    it('should call postTenableHostSearch with tenableRepoId filter', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      const callArgs = mockImportService.postTenableHostSearch.mock.calls[0][0];
      const repoFilter = callArgs.filters.and.find((f: any) => f.property === 'repositoryHost');

      expect(repoFilter?.value).toBe('42');
    });

    it('should map host assets from response', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets.length).toBe(2);
    });

    it('should extract source type from source array', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[0].source).toBe('nessus');
    });

    it('should default source to empty string when source is null', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[1].source).toBe('');
    });

    it('should extract acr score', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[0].acr).toBe('8');
    });

    it('should default acr to empty string when null', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[1].acr).toBe('');
    });

    it('should extract aes score', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[0].aes).toBe('450');
    });

    it('should format systemType with capitalization and spaces', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[0].systemType).toBe('General-Purpose, Router');
    });

    it('should default systemType to empty string when null', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[1].systemType).toBe('');
    });

    it('should format lastSeen timestamp', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[0].lastSeen).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should set lastSeen to undefined for "-1"', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.affectedAssets[1].lastSeen).toBeUndefined();
    });

    it('should set isLoading to false on success', () => {
      component.tenableRepoId = 42;
      component.getAffectedAssets();
      expect(component.isLoading).toBe(false);
    });

    it('should show error and set isLoading=false on failure', () => {
      component.tenableRepoId = 42;
      mockImportService.postTenableHostSearch.mockReturnValue(throwError(() => new Error('fail')));
      component.getAffectedAssets();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.isLoading).toBe(false);
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
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should call show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
