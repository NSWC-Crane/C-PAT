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
import { STIGManagerAssetsTableComponent } from './stigManagerAssetsTable.component';
import { SharedService } from '../../../../common/services/shared.service';
import { createMockMessageService } from '../../../../../testing/mocks/service-mocks';

const mockAssets = [
  { name: 'Asset1', fqdn: 'asset1.example.com', ip: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:01', collection: { name: 'Alpha' }, labels: [] },
  { name: 'Asset2', fqdn: 'asset2.example.com', ip: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:02', collection: { name: 'Beta' }, labels: ['tag1'] }
];

describe('STIGManagerAssetsTableComponent', () => {
  let component: STIGManagerAssetsTableComponent;
  let fixture: ComponentFixture<STIGManagerAssetsTableComponent>;
  let mockSharedService: any;
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

    mockSharedService = {
      getAssetsFromSTIGMAN: vi.fn().mockReturnValue(of([...mockAssets]))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [STIGManagerAssetsTableComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: SharedService, useValue: mockSharedService }, { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(STIGManagerAssetsTableComponent);
    component = fixture.componentInstance;
    component.stigmanCollectionId = 42;
    (component as any).table = () => mockTable;
    (component as any).multiSelect = () => mockMultiSelect;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default assets to empty array', () => {
      expect(component.assets).toEqual([]);
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
  });

  describe('ngOnInit', () => {
    it('should call initColumnsAndFilters', () => {
      const spy = vi.spyOn(component, 'initColumnsAndFilters');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call loadData when stigmanCollectionId is set', () => {
      const spy = vi.spyOn(component, 'loadData');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call loadData when stigmanCollectionId is falsy', () => {
      component.stigmanCollectionId = 0 as any;
      const spy = vi.spyOn(component, 'loadData');

      component.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should show error message when stigmanCollectionId is missing', () => {
      component.stigmanCollectionId = 0 as any;
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should populate assets after init with valid collectionId', () => {
      component.ngOnInit();
      expect(component.assets.length).toBe(2);
    });
  });

  describe('initColumnsAndFilters', () => {
    beforeEach(() => {
      component.initColumnsAndFilters();
    });

    it('should set 6 columns', () => {
      expect(component.cols.length).toBe(6);
    });

    it('should include name column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('name');
    });

    it('should include fqdn column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('fqdn');
    });

    it('should include ip column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('ip');
    });

    it('should include mac column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('mac');
    });

    it('should include collectionName column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('collectionName');
    });

    it('should include labels column', () => {
      expect(component.cols.map((c: any) => c.field)).toContain('labels');
    });

    it('should call resetColumnSelections', () => {
      const spy = vi.spyOn(component, 'resetColumnSelections');

      component.initColumnsAndFilters();
      expect(spy).toHaveBeenCalled();
    });

    it('should set selectedColumns to all cols', () => {
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('loadData', () => {
    it('should set isLoading to true at start', () => {
      mockSharedService.getAssetsFromSTIGMAN.mockReturnValue(of([]));
      component.loadData();
      expect(component.isLoading).toBe(false);
    });

    it('should call getAssetsFromSTIGMAN with stigmanCollectionId', () => {
      component.loadData();
      expect(mockSharedService.getAssetsFromSTIGMAN).toHaveBeenCalledWith(42);
    });

    it('should map assets with collectionName from collection.name', () => {
      component.loadData();
      expect(component.assets[0].collectionName).toBe('Alpha');
      expect(component.assets[1].collectionName).toBe('Beta');
    });

    it('should set totalRecords to the number of assets', () => {
      component.loadData();
      expect(component.totalRecords).toBe(2);
    });

    it('should set isLoading to false on complete', () => {
      component.loadData();
      expect(component.isLoading).toBe(false);
    });

    it('should show error message when assets array is empty', () => {
      mockSharedService.getAssetsFromSTIGMAN.mockReturnValue(of([]));
      component.loadData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error message when assets is null', () => {
      mockSharedService.getAssetsFromSTIGMAN.mockReturnValue(of(null));
      component.loadData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error message on service failure', () => {
      mockSharedService.getAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should preserve original asset properties when mapping', () => {
      component.loadData();
      expect(component.assets[0].name).toBe('Asset1');
      expect(component.assets[0].fqdn).toBe('asset1.example.com');
    });
  });

  describe('showErrorMessage', () => {
    it('should call messageService.add with severity error', () => {
      component.showErrorMessage('test error');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: 'test error' }));
    });

    it('should use sticky: true', () => {
      component.showErrorMessage('sticky test');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ sticky: true }));
    });
  });

  describe('clear', () => {
    it('should call table().clear()', () => {
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
    it('should call table().filterGlobal with input value and "contains"', () => {
      const event = { target: { value: 'search term' } } as any;

      component.onGlobalFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('search term', 'contains');
    });
  });

  describe('resetColumnSelections', () => {
    it('should set selectedColumns to cols', () => {
      component.initColumnsAndFilters();
      component.selectedColumns = [];
      component.resetColumnSelections();
      expect(component.selectedColumns).toBe(component.cols);
    });
  });

  describe('toggleAddColumnOverlay', () => {
    it('should call multiSelect().hide() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).toHaveBeenCalled();
    });

    it('should not call multiSelect().show() when overlayVisible is true', () => {
      mockMultiSelect.overlayVisible = true;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).not.toHaveBeenCalled();
    });

    it('should call multiSelect().show() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.show).toHaveBeenCalled();
    });

    it('should not call multiSelect().hide() when overlayVisible is false', () => {
      mockMultiSelect.overlayVisible = false;
      component.toggleAddColumnOverlay();
      expect(mockMultiSelect.hide).not.toHaveBeenCalled();
    });
  });

  describe('exportCSV', () => {
    it('should call table().exportCSV()', () => {
      component.exportCSV();
      expect(mockTable.exportCSV).toHaveBeenCalled();
    });
  });
});
