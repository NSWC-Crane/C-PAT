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
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping.component';
import { NessusPluginMappingService } from './nessus-plugin-mapping.service';
import { IntegrationService } from '../../integrations/integration.service';
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
  let mockIntegrationService: any;
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
      mapIAVPluginIds: vi.fn().mockReturnValue(of({})),
      putIAVTaskOrder: vi.fn().mockReturnValue(of({}))
    };

    mockIntegrationService = {
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
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(NessusPluginMappingComponent, {
        set: {
          imports: [ButtonModule, CommonModule, DatePicker, IconFieldModule, InputIconModule, InputTextModule, FormsModule, MessageModule, ProgressBarModule, TableModule]
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
      expect(component.tableData()).toEqual([]);
    });

    it('should default loading to true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default searchValue to empty string', () => {
      expect(component.searchValue()).toBe('');
    });

    it('should default isUpdating to false', () => {
      expect(component.isUpdating()).toBe(false);
    });

    it('should default updateProgress to 0', () => {
      expect(component.updateProgress()).toBe(0);
    });

    it('should default nessusPluginsMapped to null', () => {
      expect(component.nessusPluginsMapped()).toBeNull();
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
    it('should set 13 columns', () => {
      component.initColumns();
      expect(component.cols).toHaveLength(13);
    });

    it('should include iav and pluginID fields', () => {
      component.initColumns();
      const fields = component.cols.map((c) => c.field);

      expect(fields).toContain('iav');
      expect(fields).toContain('pluginID');
    });

    it('should include taskOrder field', () => {
      component.initColumns();
      const fields = component.cols.map((c) => c.field);

      expect(fields).toContain('taskOrder');
    });
  });

  describe('row editing', () => {
    beforeEach(() => {
      component.getIAVTableData();
    });

    it('should store a shadow copy on onRowEditInit', () => {
      const rowData = component.tableData()[0];

      component.onRowEditInit(rowData);
      expect(component.editingShadows.get(rowData.iav)).toEqual(rowData);
      expect(component.editingShadows.get(rowData.iav)).not.toBe(rowData);
    });

    it('should call putIAVTaskOrder with trimmed taskOrder on save', () => {
      const rowData = { ...component.tableData()[0], taskOrder: '  TO-2024-001  ' };

      component.onRowEditInit(rowData);
      component.onRowEditSave(rowData);
      expect(mockNessusPluginMappingService.putIAVTaskOrder).toHaveBeenCalledWith({ iav: rowData.iav, taskOrder: 'TO-2024-001' });
    });

    it('should send null when taskOrder is empty on save', () => {
      const rowData = { ...component.tableData()[0], taskOrder: '' };

      component.onRowEditInit(rowData);
      component.onRowEditSave(rowData);
      expect(mockNessusPluginMappingService.putIAVTaskOrder).toHaveBeenCalledWith({ iav: rowData.iav, taskOrder: null });
    });

    it('should update tableData and clear the shadow copy on successful save', () => {
      const rowData = { ...component.tableData()[0], taskOrder: 'TO-2024-001' };

      component.onRowEditInit(rowData);
      component.onRowEditSave(rowData);
      expect(component.tableData()[0].taskOrder).toBe('TO-2024-001');
      expect(component.editingShadows.has(rowData.iav)).toBe(false);
    });

    it('should show success message on save', () => {
      const rowData = { ...component.tableData()[0], taskOrder: 'TO-2024-001' };

      component.onRowEditInit(rowData);
      component.onRowEditSave(rowData);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should restore the shadow copy and show error when save fails', () => {
      mockNessusPluginMappingService.putIAVTaskOrder.mockReturnValue(throwError(() => new Error('Network error')));
      const original = component.tableData()[0];
      const rowData = { ...original, taskOrder: 'TO-2024-001' };

      component.onRowEditInit(original);
      component.onRowEditSave(rowData);
      expect(component.tableData()[0].taskOrder).toBe(original.taskOrder);
      expect(component.editingShadows.has(original.iav)).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should restore the shadow copy on cancel', () => {
      const original = component.tableData()[0];

      component.onRowEditInit(original);
      component.tableData.update((current) => current.map((row) => (row.iav === original.iav ? { ...row, taskOrder: 'discarded' } : row)));
      component.onRowEditCancel(original);
      expect(component.tableData()[0].taskOrder).toBe(original.taskOrder);
      expect(component.editingShadows.has(original.iav)).toBe(false);
    });

    it('should not throw on cancel when no edit is in progress', () => {
      expect(() => component.onRowEditCancel(component.tableData()[0])).not.toThrow();
    });

    it('should restore the cancelled row and keep the other edit when two rows are edited', () => {
      const rowA = component.tableData()[0];
      const rowB = component.tableData()[1];

      component.onRowEditInit(rowA);
      component.onRowEditInit(rowB);
      component.tableData.update((current) => current.map((row) => (row.iav === rowA.iav ? { ...row, taskOrder: 'discarded' } : row)));
      component.onRowEditCancel(rowA);
      expect(component.tableData()[0].taskOrder).toBe(rowA.taskOrder);
      expect(component.editingShadows.has(rowA.iav)).toBe(false);
      expect(component.editingShadows.get(rowB.iav)).toEqual(rowB);
    });

    it('should restore only the failed row when a save fails while another row is being edited', () => {
      mockNessusPluginMappingService.putIAVTaskOrder.mockReturnValue(throwError(() => new Error('Network error')));
      const rowA = component.tableData()[0];
      const rowB = component.tableData()[1];

      component.onRowEditInit(rowA);
      component.onRowEditInit(rowB);
      component.onRowEditSave({ ...rowA, taskOrder: 'TO-2024-001' });
      expect(component.tableData()[0].taskOrder).toBe(rowA.taskOrder);
      expect(component.editingShadows.has(rowA.iav)).toBe(false);
      expect(component.editingShadows.get(rowB.iav)).toEqual(rowB);
    });
  });

  describe('getIAVTableData', () => {
    it('should set tableData from response', () => {
      component.getIAVTableData();
      expect(component.tableData()).toHaveLength(2);
    });

    it('should set totalRecords from tableData length', () => {
      component.getIAVTableData();
      expect(component.totalRecords).toBe(2);
    });

    it('should set nessusPluginsMapped from response', () => {
      component.getIAVTableData();
      expect(component.nessusPluginsMapped()).toBe('2024-01-15T10:00:00Z');
    });

    it('should set loading to false on complete', () => {
      component.getIAVTableData();
      expect(component.loading()).toBe(false);
    });

    it('should trim date strings at T character for navyComplyDate', () => {
      component.getIAVTableData();
      expect(component.tableData()[0].navyComplyDate).toBe('2023-06-15');
    });

    it('should trim date strings at T character for releaseDate', () => {
      component.getIAVTableData();
      expect(component.tableData()[0].releaseDate).toBe('2023-01-01');
    });

    it('should set empty string for null navyComplyDate', () => {
      component.getIAVTableData();
      expect(component.tableData()[1].navyComplyDate).toBe('');
    });

    it('should split pluginID string into array', () => {
      component.getIAVTableData();
      expect(component.tableData()[0].pluginID).toEqual(['12345', '67890']);
    });

    it('should set pluginID to empty array when null', () => {
      component.getIAVTableData();
      expect(component.tableData()[1].pluginID).toEqual([]);
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
      component.estimatedTimeRemaining.set('5m 0s');
      component.updatePluginIds();
      vi.runAllTimers();
      expect(component.estimatedTimeRemaining()).toBe('');
    });

    it('should call postTenableAnalysis with correct query shape', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ tool: 'vulndetails', type: 'vuln' })
        }),
        false
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
      expect(component.isUpdating()).toBe(false);
    });

    it('should set updateProgress to 100 on complete', () => {
      component.updatePluginIds();
      vi.runAllTimers();
      expect(component.updateProgress()).toBe(100);
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

    it('does not report success when the component is destroyed mid-run', () => {
      const pending = new Subject<any>();

      mockIntegrationService.postTenableAnalysis.mockReturnValue(pending.asObservable());

      component.updatePluginIds();
      fixture.destroy();
      vi.runAllTimers();

      expect(mockNessusPluginMappingService.mapIAVPluginIds).not.toHaveBeenCalled();
      expect(mockMessageService.add).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    describe('cache opt-out', () => {
      const batch = (pluginID: string, totalRecords: number) => ({
        response: { results: [{ pluginID, xref: `IAVA #2023-A-000${pluginID}` }], totalRecords }
      });

      it('bypasses the upstream cache for every batch', () => {
        (component as any).batchSize = 1;
        mockIntegrationService.postTenableAnalysis.mockReturnValueOnce(of(batch('1', 2))).mockReturnValueOnce(of(batch('2', 2)));

        component.updatePluginIds();
        vi.runAllTimers();

        expect(mockIntegrationService.postTenableAnalysis).toHaveBeenCalledTimes(2);
        mockIntegrationService.postTenableAnalysis.mock.calls.forEach((call: any[]) => expect(call[1]).toBe(false));
      });

      it('walks a multi-batch run without skipping or repeating an offset', () => {
        (component as any).batchSize = 1;
        mockIntegrationService.postTenableAnalysis
          .mockReturnValueOnce(of(batch('1', 3)))
          .mockReturnValueOnce(of(batch('2', 3)))
          .mockReturnValueOnce(of(batch('3', 3)));

        component.updatePluginIds();
        vi.runAllTimers();

        const offsets = mockIntegrationService.postTenableAnalysis.mock.calls.map((call: any[]) => call[0].query.startOffset);

        expect(offsets).toEqual([0, 1, 2]);
        expect(mockNessusPluginMappingService.mapIAVPluginIds).toHaveBeenCalledTimes(1);
      });

      it('maps every plugin exactly once across a multi-batch run', () => {
        (component as any).batchSize = 1;
        mockIntegrationService.postTenableAnalysis.mockReturnValueOnce(of(batch('1', 2))).mockReturnValueOnce(of(batch('2', 2)));

        component.updatePluginIds();
        vi.runAllTimers();

        const mapped = mockNessusPluginMappingService.mapIAVPluginIds.mock.calls[0][0];
        const pluginIds = mapped.flatMap((entry: any) => entry.pluginIDs ?? []);

        expect(pluginIds).toHaveLength(new Set(pluginIds).size);
      });
    });

    it('should show error message when batch processing fails', () => {
      mockIntegrationService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Tenable error')));

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
      component.searchValue.set('test search');
      const mockTable = { clear: vi.fn() } as any;

      component.clear(mockTable);
      expect(component.searchValue()).toBe('');
    });
  });

  describe('cleanup', () => {
    it('should not throw when destroyed', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
