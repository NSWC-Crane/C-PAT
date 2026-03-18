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
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping.component';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';
import { ImportService } from '../../import-processing/import.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

const buildMockIAVResponse = () => ({
  tableData: [
    {
      iav: '2023-A-0001',
      pluginID: '12345, 67890',
      status: 'Active',
      title: 'Test IAV Entry',
      iavCat: 1,
      type: 'IAVA',
      releaseDate: '2023-01-01T00:00:00Z',
      navyComplyDate: '2023-06-15T00:00:00Z',
      supersededBy: null,
      knownExploits: 0,
      knownDodIncidents: 0,
      nessusPlugins: 2
    },
    {
      iav: '2023-B-0002',
      pluginID: null,
      status: 'Inactive',
      title: 'Second IAV Entry',
      iavCat: 2,
      type: 'IAVB',
      releaseDate: null,
      navyComplyDate: null,
      supersededBy: '2023-A-0001',
      knownExploits: 1,
      knownDodIncidents: 0,
      nessusPlugins: 0
    }
  ],
  nessusPluginsMapped: '2024-01-15T10:00:00Z'
});

describe('NessusPluginMappingComponent', () => {
  let component: NessusPluginMappingComponent;
  let fixture: ComponentFixture<NessusPluginMappingComponent>;
  let mockNessusPluginMappingService: any;
  let mockImportService: any;
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
    mockNessusPluginMappingService = {
      getIAVTableData: vi.fn().mockReturnValue(of(buildMockIAVResponse())),
      mapIAVPluginIds: vi.fn().mockReturnValue(of({}))
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(
        of({
          response: {
            results: [{ pluginID: '12345', xref: 'IAVA #2023-A-0001' }],
            totalRecords: 1
          }
        })
      )
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [NessusPluginMappingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NessusPluginMappingService, useValue: mockNessusPluginMappingService },
        { provide: ImportService, useValue: mockImportService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(NessusPluginMappingComponent, {
        set: {
          imports: [ButtonModule, CommonModule, DatePicker, IconFieldModule, InputIconModule, InputTextModule, FormsModule, MessageModule, ProgressBarModule, TableModule, ToastModule]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(NessusPluginMappingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default tableData to empty array', () => {
      expect(component.tableData).toEqual([]);
    });

    it('should default loading to true', () => {
      expect(component.loading).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default searchValue to empty string', () => {
      expect(component.searchValue).toBe('');
    });

    it('should default isUpdating to false', () => {
      expect(component.isUpdating).toBe(false);
    });

    it('should default updateProgress to 0', () => {
      expect(component.updateProgress).toBe(0);
    });

    it('should default nessusPluginsMapped to null', () => {
      expect(component.nessusPluginsMapped).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call initColumns', () => {
      const spy = vi.spyOn(component, 'initColumns');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call getIAVTableData', () => {
      const spy = vi.spyOn(component, 'getIAVTableData');

      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('initColumns', () => {
    it('should set 12 columns', () => {
      component.initColumns();
      expect(component.cols.length).toBe(12);
    });

    it('should include iav and pluginID fields', () => {
      component.initColumns();
      const fields = component.cols.map((c) => c.field);

      expect(fields).toContain('iav');
      expect(fields).toContain('pluginID');
    });
  });

  describe('getIAVTableData', () => {
    it('should set tableData from response', () => {
      component.getIAVTableData();
      expect(component.tableData.length).toBe(2);
    });

    it('should set totalRecords from tableData length', () => {
      component.getIAVTableData();
      expect(component.totalRecords).toBe(2);
    });

    it('should set nessusPluginsMapped from response', () => {
      component.getIAVTableData();
      expect(component.nessusPluginsMapped).toBe('2024-01-15T10:00:00Z');
    });

    it('should set loading to false on complete', () => {
      component.getIAVTableData();
      expect(component.loading).toBe(false);
    });

    it('should trim date strings at T character for navyComplyDate', () => {
      component.getIAVTableData();
      expect(component.tableData[0].navyComplyDate).toBe('2023-06-15');
    });

    it('should trim date strings at T character for releaseDate', () => {
      component.getIAVTableData();
      expect(component.tableData[0].releaseDate).toBe('2023-01-01');
    });

    it('should set empty string for null navyComplyDate', () => {
      component.getIAVTableData();
      expect(component.tableData[1].navyComplyDate).toBe('');
    });

    it('should split pluginID string into array', () => {
      component.getIAVTableData();
      expect(component.tableData[0].pluginID).toEqual(['12345', '67890']);
    });

    it('should set pluginID to empty array when null', () => {
      component.getIAVTableData();
      expect(component.tableData[1].pluginID).toEqual([]);
    });

    it('should show error when service throws', () => {
      mockNessusPluginMappingService.getIAVTableData.mockReturnValue(throwError(() => new Error('Network error')));
      component.getIAVTableData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error when response format is invalid', () => {
      mockNessusPluginMappingService.getIAVTableData.mockReturnValue(of({ tableData: null }));
      component.getIAVTableData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error when response is null', () => {
      mockNessusPluginMappingService.getIAVTableData.mockReturnValue(of(null));
      component.getIAVTableData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('updatePluginIds', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should reset estimatedTimeRemaining to empty string on complete', () => {
      component.estimatedTimeRemaining = '5m 0s';
      component.updatePluginIds();
      vi.runAllTimers();
      expect(component.estimatedTimeRemaining).toBe('');
    });

    it('should call postTenableAnalysis with correct query shape', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ tool: 'vulndetails', type: 'vuln' })
        })
      );
    });

    it('should call mapIAVPluginIds after batch processing', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(mockNessusPluginMappingService.mapIAVPluginIds).toHaveBeenCalled();
    });

    it('should set isUpdating to false on complete', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(component.isUpdating).toBe(false);
    });

    it('should set updateProgress to 100 on complete', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(component.updateProgress).toBe(100);
    });

    it('should show success message on complete', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should call getIAVTableData again on complete', () => {
      const spy = vi.spyOn(component, 'getIAVTableData');

      component.updatePluginIds();
      vi.runAllTimers();
      expect(spy).toHaveBeenCalled();
    });

    it('should show error message when batch processing fails', () => {
      mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Tenable error')));

      try {
        component.updatePluginIds();
        vi.runAllTimers();
      } catch {
        /* expected */
      }

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('getFilterType', () => {
    it('should return text for iav field', () => {
      expect(component.getFilterType({ field: 'iav' })).toBe('text');
    });

    it('should return text for status field', () => {
      expect(component.getFilterType({ field: 'status' })).toBe('text');
    });

    it('should return text for pluginID field', () => {
      expect(component.getFilterType({ field: 'pluginID' })).toBe('text');
    });

    it('should return numeric for iavCat field', () => {
      expect(component.getFilterType({ field: 'iavCat' })).toBe('numeric');
    });

    it('should return numeric for nessusPlugins field', () => {
      expect(component.getFilterType({ field: 'nessusPlugins' })).toBe('numeric');
    });

    it('should return data for releaseDate field', () => {
      expect(component.getFilterType({ field: 'releaseDate' })).toBe('data');
    });

    it('should return data for navyComplyDate field', () => {
      expect(component.getFilterType({ field: 'navyComplyDate' })).toBe('data');
    });

    it('should return text for unknown fields', () => {
      expect(component.getFilterType({ field: 'unknownField' })).toBe('text');
    });
  });

  describe('clear', () => {
    it('should call table.clear()', () => {
      const mockTable = { clear: vi.fn() } as any;

      component.clear(mockTable);
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset searchValue to empty string', () => {
      component.searchValue = 'test search';
      const mockTable = { clear: vi.fn() } as any;

      component.clear(mockTable);
      expect(component.searchValue).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
