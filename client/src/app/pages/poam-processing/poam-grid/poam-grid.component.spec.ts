/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload } from 'primeng/fileupload';
import { Table } from 'primeng/table';
import { Subject, of, throwError } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../poams.service';
import { PoamGridComponent } from './poam-grid.component';

describe('PoamGridComponent', () => {
  let component: PoamGridComponent;
  let fixture: ComponentFixture<PoamGridComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialogService: jasmine.SpyObj<DialogService>;
  let mockPayloadService: jasmine.SpyObj<PayloadService>;
  let mockCollectionsService: jasmine.SpyObj<CollectionsService>;
  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockPoamService: jasmine.SpyObj<PoamService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockDialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockFileUpload: jasmine.SpyObj<FileUpload>;
  let mockTable: jasmine.SpyObj<Table>;

  const mockPoamsData = [
    {
      poamId: '1',
      status: 'approved',
      vulnerabilityId: 'V-12345',
      vulnerabilitySource: 'STIG',
      vulnerabilityTitle: 'Test Vulnerability 1',
      adjSeverity: 'High',
      ownerName: 'John Doe',
      submittedDate: '2024-01-01T00:00:00',
      scheduledCompletionDate: '2024-12-31T00:00:00',
      lastUpdated: '2024-01-15T00:00:00',
      assignedTeams: [{ assignedTeamName: 'Team A', complete: 'true' }],
      labels: [{ labelName: 'Critical' }],
      associatedVulnerabilities: ['V-67890']
    },
    {
      poamId: '2',
      status: 'closed',
      vulnerabilityId: 'V-23456',
      vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
      vulnerabilityTitle: 'Test Vulnerability 2',
      adjSeverity: 'Medium',
      submitterName: 'Jane Doe',
      submittedDate: '2024-02-01T00:00:00',
      scheduledCompletionDate: '2024-11-30T00:00:00',
      lastUpdated: '2024-02-15T00:00:00',
      assignedTeams: [],
      labels: [],
      associatedVulnerabilities: []
    }
  ];

  const mockCollection = {
    collectionId: 1,
    collectionName: 'Test Collection',
    collectionOrigin: 'C-PAT',
    originCollectionId: null,
    ccsafa: 'TEST-CCSAFA',
    systemName: 'Test System',
    systemType: 'Test Type'
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockDialogService = jasmine.createSpyObj('DialogService', ['open']);
    mockPayloadService = jasmine.createSpyObj('PayloadService', ['setPayload'], {
      user$: new Subject()
    });
    mockCollectionsService = jasmine.createSpyObj('CollectionsService', ['getCollectionBasicList']);
    mockImportService = jasmine.createSpyObj('ImportService', ['postTenableAnalysis', 'getTenablePlugin']);
    mockSharedService = jasmine.createSpyObj('SharedService', ['getSTIGMANAffectedAssetsByPoam'], {
      selectedCollection: new Subject()
    });
    mockPoamService = jasmine.createSpyObj('PoamService', ['getPoamAssetsByCollectionId']);
    mockMessageService = {
      add: jasmine.createSpy('add'),
      addAll: jasmine.createSpy('addAll'),
      clear: jasmine.createSpy('clear'),
      messageObserver: new Subject().asObservable(),
      clearObserver: new Subject().asObservable()
    } as jasmine.SpyObj<MessageService>;
    mockDialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close'], {
      onClose: new Subject()
    });
    mockFileUpload = jasmine.createSpyObj('FileUpload', ['clear']);
    mockTable = jasmine.createSpyObj('Table', ['clear'], {
      filters: {}
    });

    mockCollectionsService.getCollectionBasicList.and.returnValue(of([mockCollection]));
    mockPoamService.getPoamAssetsByCollectionId.and.returnValue(of([]));
    mockSharedService.getSTIGMANAffectedAssetsByPoam.and.returnValue(of([]));
    mockImportService.postTenableAnalysis.and.returnValue(of({ response: { results: [] } }));
    mockImportService.getTenablePlugin.and.returnValue(of({ response: {} }));

    await TestBed.configureTestingModule({
      imports: [PoamGridComponent, FormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: DialogService, useValue: mockDialogService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: ImportService, useValue: mockImportService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamGridComponent);
    component = fixture.componentInstance;

    Object.defineProperty(component, 'fileUpload', {
      value: signal(mockFileUpload)
    });
    Object.defineProperty(component, 'table', {
      value: signal(mockTable)
    });

    await component.ngOnInit();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set payload and apply default filters', fakeAsync(() => {
      spyOn(component, 'setPayload');

      component.ngOnInit();
      tick(10);

      expect(component.setPayload).toHaveBeenCalled();
      expect(mockTable.filters['status']).toEqual([{ value: 'closed', matchMode: 'notEquals' }]);
    }));
  });

  describe('Input setters', () => {
    it('should set poamsData through input setter', () => {
      component.poamsData = mockPoamsData;
      expect(component['poamsDataSignal']()).toEqual(mockPoamsData);
    });

    it('should handle null poamsData', () => {
      component.poamsData = null as any;
      expect(component['poamsDataSignal']()).toEqual([]);
    });

    it('should set affectedAssetCounts and mark as loaded', () => {
      const assetCounts = [
        { vulnerabilityId: 'V-12345', assetCount: 5 },
        { vulnerabilityId: 'V-67890', assetCount: 3 }
      ];

      component.affectedAssetCounts = assetCounts;

      expect(component.affectedAssetCounts).toEqual(assetCounts);
      expect(component['_assetCountsLoaded']()).toBe(true);
    });
  });

  describe('addAssociatedVulnerabilitiesToExport', () => {
    it('should create duplicate entries for associated vulnerabilities', () => {
      const poams = [
        {
          poamId: '1',
          vulnerabilityId: 'V-12345',
          status: 'approved',
          associatedVulnerabilities: ['V-67890', 'V-11111']
        }
      ];

      const expanded = component['addAssociatedVulnerabilitiesToExport'](poams);

      expect(expanded.length).toBe(3);
      expect(expanded[0].vulnerabilityId).toBe('V-12345');
      expect(expanded[1].vulnerabilityId).toBe('V-67890');
      expect(expanded[1].isAssociatedVulnerability).toBe(true);
      expect(expanded[1].parentVulnerabilityId).toBe('V-12345');
      expect(expanded[2].vulnerabilityId).toBe('V-11111');
    });

    it('should handle POAMs without associated vulnerabilities', () => {
      const poams = [
        {
          poamId: '1',
          vulnerabilityId: 'V-12345',
          status: 'approved',
          associatedVulnerabilities: []
        }
      ];

      const expanded = component['addAssociatedVulnerabilitiesToExport'](poams);

      expect(expanded.length).toBe(1);
      expect(expanded[0].vulnerabilityId).toBe('V-12345');
    });

    it('should preserve all parent POAM data in duplicates', () => {
      const parentPoam = {
        poamId: '1',
        vulnerabilityId: 'V-12345',
        status: 'approved',
        milestones: [{ id: 1, comment: 'Test' }],
        mitigations: 'Test mitigation',
        scheduledCompletionDate: '2024-12-31',
        associatedVulnerabilities: ['V-67890']
      };

      const expanded = component['addAssociatedVulnerabilitiesToExport']([parentPoam]);

      expect(expanded.length).toBe(2);
      expect(expanded[1].status).toBe('approved');
      expect(expanded[1].milestones).toEqual(parentPoam.milestones);
      expect(expanded[1].mitigations).toBe('Test mitigation');
      expect(expanded[1].scheduledCompletionDate).toBe('2024-12-31');
    });
  });

  describe('exportCollection', () => {
    beforeEach(() => {
      mockDialogService.open.and.returnValue(mockDialogRef);
      component['selectedCollectionId'].set(1);
      component['selectedCollection'].set(mockCollection);
      component['poamsDataSignal'].set(mockPoamsData);
      component['user'].set({ fullName: 'Test User', email: 'test@test.com', phoneNumber: '555-1234' });
    });

    it('should open status selection dialog and handle selection', (done) => {
      const selectedStatuses = ['approved', 'submitted'];

      spyOn<any>(component, 'generateExcelFile');
      spyOn<any>(component, 'addAssociatedVulnerabilitiesToExport').and.callThrough();

      component.exportCollection();

      expect(mockDialogService.open).toHaveBeenCalled();

      setTimeout(() => {
        (mockDialogRef.onClose as any).next(selectedStatuses);

        setTimeout(() => {
          expect(mockMessageService.add).toHaveBeenCalledWith({
            severity: 'secondary',
            summary: 'Export Started',
            detail: 'Download will automatically start momentarily.'
          });
          expect(component['addAssociatedVulnerabilitiesToExport']).toHaveBeenCalled();
          done();
        }, 100);
      }, 0);
    });

    it('should handle dialog cancellation', fakeAsync(() => {
      component.exportCollection();

      (mockDialogRef.onClose as any).next(null);
      tick();

      expect(mockMessageService.add).not.toHaveBeenCalled();
    }));

    it('should show error when no POAMs match selected statuses', (done) => {
      const selectedStatuses = ['draft'];

      component.exportCollection();

      setTimeout(() => {
        (mockDialogRef.onClose as any).next(selectedStatuses);

        setTimeout(() => {
          expect(mockMessageService.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'No Data',
            detail: 'There are no POAMs with the selected statuses to export for this collection.'
          });
          done();
        }, 100);
      }, 0);
    });

    it('should process STIG Manager collections', fakeAsync(() => {
      const stigCollection = { ...mockCollection, collectionOrigin: 'STIG Manager', originCollectionId: 123 };

      component['selectedCollection'].set(stigCollection);
      spyOn(component, 'processPoamsWithStigFindings').and.returnValue(Promise.resolve([]));

      component.exportCollection();

      expect(mockDialogService.open).toHaveBeenCalled();

      (mockDialogRef.onClose as any).next(['approved']);
      tick();

      expect(component.processPoamsWithStigFindings).toHaveBeenCalled();
    }));

    it('should process Tenable collections', fakeAsync(() => {
      const tenableCollection = { ...mockCollection, collectionOrigin: 'Tenable' };

      component['selectedCollection'].set(tenableCollection);
      spyOn(component, 'processPoamsWithTenableFindings').and.returnValue(Promise.resolve([]));

      component.exportCollection();

      expect(mockDialogService.open).toHaveBeenCalled();

      (mockDialogRef.onClose as any).next(['approved']);
      tick();

      expect(component.processPoamsWithTenableFindings).toHaveBeenCalled();
    }));

    it('should expand POAMs with associated vulnerabilities before export', (done) => {
      spyOn<any>(component, 'addAssociatedVulnerabilitiesToExport').and.callThrough();
      spyOn<any>(component, 'processDefaultPoams');

      component.exportCollection();

      setTimeout(() => {
        (mockDialogRef.onClose as any).next(['approved']);

        setTimeout(() => {
          expect(component['addAssociatedVulnerabilitiesToExport']).toHaveBeenCalled();
          done();
        }, 100);
      }, 0);
    });
  });

  describe('processDefaultPoams', () => {
    it('should fetch assets and generate Excel file', fakeAsync(() => {
      const mockAssets = [
        { poamId: '1', assetName: 'Asset1' },
        { poamId: '1', assetName: 'Asset2' }
      ];

      mockPoamService.getPoamAssetsByCollectionId.and.returnValue(of(mockAssets));
      spyOn<any>(component, 'generateExcelFile');

      component['cpatAffectedAssets'].set(mockAssets);
      component['processDefaultPoams'](mockPoamsData, 1);
      tick();

      expect(mockPoamService.getPoamAssetsByCollectionId).toHaveBeenCalledWith(1);
      expect(component['generateExcelFile']).toHaveBeenCalled();
    }));
  });

  describe('processPoamsWithTenableFindings', () => {
    it('should process Tenable POAMs and add control mappings', async () => {
      const tenablePoams = [
        {
          ...mockPoamsData[1],
          vulnerabilityId: '123456'
        }
      ];

      const mockPlugin = {
        response: {
          patchPubDate: '2024-01-01'
        }
      };

      const mockAnalysis = {
        response: {
          results: [{ pluginID: '123456', dnsName: 'server1.domain.com', netbiosName: 'DOMAIN\\SERVER1' }]
        }
      };

      mockImportService.postTenableAnalysis.and.returnValue(of(mockAnalysis));
      mockImportService.getTenablePlugin.and.returnValue(of(mockPlugin));

      const result = await component.processPoamsWithTenableFindings(tenablePoams);

      expect(result[0].controlAPs).toBe('SI-2.9');
      expect(result[0].cci).toContain('002605');
      expect(result[0].devicesAffected).toContain('SERVER1');
    });

    it('should handle Tenable API errors', async () => {
      const tenablePoams = [
        {
          ...mockPoamsData[1],
          vulnerabilityId: '123456'
        }
      ];

      mockImportService.postTenableAnalysis.and.returnValue(throwError(() => new Error('API Error')));

      const result = await component.processPoamsWithTenableFindings(tenablePoams);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: jasmine.stringContaining('Error fetching Tenable analysis')
        })
      );
      expect(result).toEqual(tenablePoams);
    });
  });

  describe('processPoamsWithStigFindings', () => {
    it('should process STIG POAMs with findings', async () => {
      const stigPoams = [
        {
          ...mockPoamsData[0],
          stigBenchmarkId: 'RHEL_8_STIG'
        }
      ];

      const mockFindings = [
        {
          groupId: 'V-12345',
          assets: [{ name: 'SERVER1', assetId: 1 }],
          ccis: [{ apAcronym: 'AC-2', cci: '000001' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.and.returnValue(of(mockFindings));

      const result = await component.processPoamsWithStigFindings(stigPoams, 123);

      expect(result[0].controlAPs).toBe('AC-2');
      expect(result[0].cci).toBe('000001');
      expect(result[0].devicesAffected).toBe('SERVER1');
    });

    it('should use cache for repeated benchmark IDs', async () => {
      const stigPoams = [
        { ...mockPoamsData[0], stigBenchmarkId: 'RHEL_8_STIG' },
        { ...mockPoamsData[0], poamId: '3', vulnerabilityId: 'V-99999', stigBenchmarkId: 'RHEL_8_STIG' }
      ];

      const mockFindings = [
        {
          groupId: 'V-12345',
          assets: [{ name: 'SERVER1', assetId: 1 }],
          ccis: [{ apAcronym: 'AC-2', cci: '000001' }]
        }
      ];

      mockSharedService.getSTIGMANAffectedAssetsByPoam.and.returnValue(of(mockFindings));

      await component.processPoamsWithStigFindings(stigPoams, 123);

      expect(mockSharedService.getSTIGMANAffectedAssetsByPoam).toHaveBeenCalledTimes(1);
    });
  });

  describe('importEMASSter', () => {
    beforeEach(() => {
      mockDialogService.open.and.returnValue(mockDialogRef);
    });

    it('should handle file selection and open column selection dialog', () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const event = { files: [mockFile] };

      component.importEMASSter(event);

      expect(mockDialogService.open).toHaveBeenCalled();
    });

    it('should show error when no file is selected', () => {
      const event = { files: [] };

      component.importEMASSter(event);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'No File Selected',
        detail: 'Please select an eMASSter file to import.'
      });
    });

    it('should process file when columns are selected', (done) => {
      const mockFile = new File(['test'], 'test.xlsx');
      const event = { files: [mockFile] };
      const selectedColumns = ['C', 'E', 'G'];

      component['poamsDataSignal'].set(mockPoamsData);
      component['selectedCollectionId'].set(1);

      spyOn(PoamExportService, 'updateEMASSterPoams').and.returnValue(Promise.resolve(new Blob(['updated'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })));

      const mockLink = document.createElement('a');

      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(mockLink, 'click');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');

      component.importEMASSter(event);

      setTimeout(() => {
        (mockDialogRef.onClose as any).next(selectedColumns);

        setTimeout(() => {
          expect(PoamExportService.updateEMASSterPoams).toHaveBeenCalled();
          done();
        }, 100);
      }, 0);
    });

    it('should handle dialog cancellation', (done) => {
      const mockFile = new File(['test'], 'test.xlsx');
      const event = { files: [mockFile] };

      component.importEMASSter(event);

      setTimeout(() => {
        (mockDialogRef.onClose as any).next(null);

        setTimeout(() => {
          expect(mockFileUpload.clear).toHaveBeenCalled();
          done();
        }, 100);
      }, 0);
    });
  });

  describe('managePoam', () => {
    it('should navigate to POAM details page', () => {
      const row = { poamId: '123' };

      component.managePoam(row);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/poam-processing/poam-details/123');
    });
  });

  describe('clear', () => {
    it('should clear table filters and reset global filter', () => {
      component.globalFilterSignal.set('test search');

      component.clear();

      expect(mockTable.clear).toHaveBeenCalled();
      expect(mockTable.filters['status']).toEqual([{ value: 'closed', matchMode: 'notEquals' }]);
      expect(component.globalFilterSignal()).toBe('');
    });
  });

  describe('clearCache', () => {
    it('should clear findings cache', () => {
      component['findingsCache'].set('test', []);

      component.clearCache();

      expect(component['findingsCache'].size).toBe(0);
    });
  });

  describe('computed signals', () => {
    it('should filter data based on global filter', () => {
      component['poamsDataSignal'].set(mockPoamsData);
      component.globalFilterSignal.set('vulnerability 1');

      const filtered = component.displayedData();

      expect(filtered.length).toBe(1);
      expect(filtered[0].vulnerabilityTitle).toContain('Test Vulnerability 1');
    });

    it('should prepare data with asset counts', () => {
      component['poamsDataSignal'].set(mockPoamsData);
      component['affectedAssetCountsSignal'].set([
        { vulnerabilityId: 'V-12345', assetCount: 5 },
        { vulnerabilityId: 'V-67890', assetCount: 3 }
      ]);
      component['_assetCountsLoaded'].set(true);

      const prepared = component['preparedData']();

      expect(prepared[0].affectedAssets).toBe(5);
      expect(prepared[0].hasAssociatedVulnerabilities).toBe(true);
      expect(prepared[0].associatedVulnerabilitiesTooltip).toContain('V-67890: 3');
    });

    it('should handle missing asset counts', () => {
      component['poamsDataSignal'].set(mockPoamsData);
      component['_assetCountsLoaded'].set(true);

      const prepared = component['preparedData']();

      expect(prepared[0].isAffectedAssetsMissing).toBe(true);
      expect(prepared[0].affectedAssets).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions and dialog', () => {
      component.dialogRef = mockDialogRef;
      const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);

      component['subscriptions'] = subscription;
      component['payloadSubscription'] = [subscription];

      component.ngOnDestroy();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('generateExcelFile', () => {
    it('should handle Excel generation success', async () => {
      const processedPoams = [{ ...mockPoamsData[0], devicesAffected: 'SERVER1 SERVER2' }];
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      spyOn(PoamExportService, 'convertToExcel').and.returnValue(Promise.resolve(mockBlob));

      const link = document.createElement('a');

      spyOn(document, 'createElement').and.returnValue(link);
      spyOn(link, 'click');
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      component['user'].set({ fullName: 'Test User' });
      component['selectedCollection'].set(mockCollection);

      await component['generateExcelFile'](processedPoams);

      expect(PoamExportService.convertToExcel).toHaveBeenCalled();
      expect(link.click).toHaveBeenCalled();
    });

    it('should handle Excel generation errors', async () => {
      const processedPoams = [mockPoamsData[0]];
      const error = new Error('Excel generation failed');

      spyOn(PoamExportService, 'convertToExcel').and.returnValue(Promise.reject(error));

      component['user'].set({ fullName: 'Test User', email: 'test@test.com', phoneNumber: '555-1234' });
      component['selectedCollection'].set(mockCollection);

      await component['generateExcelFile'](processedPoams);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'error',
          summary: 'Export Failed'
        })
      );
    });
  });
});
