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
import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabel } from 'primeng/floatlabel';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AssetDeltaComponent } from './asset-delta.component';
import { AssetDeltaService } from './asset-delta.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { AppConfigService } from '../../../layout/services/appconfigservice';
import { ImportService } from '../../import-processing/import.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

const mockUser = { userId: 1, lastCollectionAccessedId: 10, username: 'testuser' };
const mockCollections = [
  { collectionId: 10, collectionName: 'Test Collection' },
  { collectionId: 20, collectionName: 'Other Collection' }
];
const buildMockDeltaResponse = () => ({
  assets: [
    { key: 'ASSET-001', value: 'Team Alpha', eMASS: true },
    { key: 'ASSET-002', value: 'Team Beta', eMASS: false }
  ],
  assetDeltaUpdated: '2024-01-15T10:00:00Z',
  emassHardwareListUpdated: '2024-01-10T00:00:00Z'
});

describe('AssetDeltaComponent', () => {
  let component: AssetDeltaComponent;
  let fixture: ComponentFixture<AssetDeltaComponent>;
  let mockAssetDeltaService: any;
  let mockCollectionsService: any;
  let mockSharedService: any;
  let mockAppConfigService: any;
  let mockImportService: any;
  let mockPayloadService: any;
  let mockMessageService: any;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        apiBase: 'http://localhost:8080/api',
        features: { marketplaceDisabled: false },
        oauth: { claims: { username: 'preferred_username' } }
      }
    };

    vi.stubGlobal(
      'MutationObserver',
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn()
      }))
    );
  });

  beforeEach(async () => {
    mockAssetDeltaService = {
      getAssetDeltaListByCollection: vi.fn().mockReturnValue(of(buildMockDeltaResponse())),
      uploadToMultipleCollections: vi.fn().mockReturnValue(of(new HttpResponse({ body: { results: [{ collectionId: 10, success: true }] } })))
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of([...mockCollections]))
    };

    mockSharedService = {
      getCollectionsFromSTIGMAN: vi.fn().mockReturnValue(of([{ collectionId: 1 }])),
      getAssetsFromSTIGMAN: vi.fn().mockReturnValue(of([{ name: 'ASSET-001' }]))
    };

    mockAppConfigService = {
      transitionComplete: signal(false),
      appState: signal({ darkTheme: false })
    };

    mockImportService = {
      postTenableAnalysis: vi.fn().mockReturnValue(of({ response: { results: [{ dnsName: 'asset-001.domain.com' }] } }))
    };

    mockPayloadService = {
      user$: of(mockUser),
      setPayload: vi.fn()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AssetDeltaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: AppConfigService, useValue: mockAppConfigService },
        { provide: ImportService, useValue: mockImportService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    })
      .overrideComponent(AssetDeltaComponent, {
        set: {
          imports: [
            BadgeModule,
            ButtonModule,
            CardModule,
            ChartModule,
            CommonModule,
            DialogModule,
            FileUploadModule,
            FloatLabel,
            FormsModule,
            InputTextModule,
            MultiSelectModule,
            IconField,
            InputIcon,
            ProgressBarModule,
            SelectModule,
            TableModule,
            ToastModule,
            TooltipModule
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AssetDeltaComponent);
    component = fixture.componentInstance;
  });

  describe('Creation and Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default selectedCollection to null', () => {
      expect(component.selectedCollection()).toBeNull();
    });

    it('should default assets to empty array', () => {
      expect(component.assets()).toEqual([]);
    });

    it('should default loading to false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should default showUploadDialog to false', () => {
      expect(component.showUploadDialog()).toBe(false);
    });

    it('should default filteredTotal to 0', () => {
      expect(component.filteredTotal()).toBe(0);
    });

    it('should initialize cols array in ngOnInit', () => {
      component.ngOnInit();
      expect(component.cols).toBeDefined();
      expect(component.cols.length).toBe(5);
    });
  });

  describe('ngOnInit', () => {
    it('should call getCollectionBasicList after user resolves', () => {
      component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set selectedCollection from user lastCollectionAccessedId when match exists', () => {
      component.ngOnInit();
      expect(component.selectedCollection()).toBe(10);
    });

    it('should use first collection when user lastCollectionAccessedId has no match', () => {
      mockPayloadService.user$ = of({ ...mockUser, lastCollectionAccessedId: 999 });
      component.ngOnInit();
      expect(component.selectedCollection()).toBe(10);
    });

    it('should use first collection when user has no lastCollectionAccessedId', () => {
      mockPayloadService.user$ = of({ userId: 2, username: 'other' });
      component.ngOnInit();
      expect(component.selectedCollection()).toBe(10);
    });

    it('should call loadAssetDeltaList after setting collection', () => {
      component.ngOnInit();
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalledWith(10);
    });

    it('should warn when no collections are available', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'No Collections' }));
    });

    it('should show error when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('Network error')));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error when user$ fails', () => {
      mockPayloadService.user$ = throwError(() => new Error('Auth error'));
      component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should warn when no collectionId and no selectedCollection', () => {
      component.loadAssetDeltaList();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Warning' }));
    });

    it('should use selectedCollection when no collectionId argument provided', () => {
      component.selectedCollection.set(20);
      component.loadAssetDeltaList();
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalledWith(20);
    });

    it('should set assets on success', () => {
      component.loadAssetDeltaList(10);
      expect(component.assets().length).toBe(2);
      expect(component.assets()[0].key).toBe('ASSET-001');
    });

    it('should set filteredAssets on success', () => {
      component.loadAssetDeltaList(10);
      expect(component.filteredAssets().length).toBe(2);
    });

    it('should set assetDeltaUpdated from response', () => {
      component.loadAssetDeltaList(10);
      expect(component.assetDeltaUpdated()).toBe('2024-01-15T10:00:00Z');
    });

    it('should set emassHardwareListUpdated from response', () => {
      component.loadAssetDeltaList(10);
      expect(component.emassHardwareListUpdated()).toBe('2024-01-10T00:00:00Z');
    });

    it('should normalize asset fields (loading false, existsInTenable undefined)', () => {
      component.loadAssetDeltaList(10);
      const asset = component.assets()[0];

      expect(asset.loading).toBe(false);
      expect(asset.existsInTenable).toBeUndefined();
      expect(asset.existsInStigManager).toBeUndefined();
    });

    it('should set filteredTotal from response assets length', () => {
      component.loadAssetDeltaList(10);
      expect(component.filteredTotal()).toBe(2);
    });

    it('should show error when response is null', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of(null));
      component.loadAssetDeltaList(10);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error and clear assets on failure', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(throwError(() => new Error('Network error')));
      component.assets.set([{ key: 'OLD', value: 'team', eMASS: false, loading: false }]);
      component.loadAssetDeltaList(10);
      expect(component.assets()).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should clear assetDeltaUpdated and emassHardwareListUpdated on failure', () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(throwError(() => new Error('fail')));
      component.assetDeltaUpdated.set('old-date');
      component.loadAssetDeltaList(10);
      expect(component.assetDeltaUpdated()).toBeNull();
      expect(component.emassHardwareListUpdated()).toBeNull();
    });
  });

  describe('onCollectionChange', () => {
    it('should not call loadAssetDeltaList when same collectionId', () => {
      component.selectedCollection.set(10);
      component.onCollectionChange(10);
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).not.toHaveBeenCalled();
    });

    it('should set selectedCollection and load list when different collectionId', () => {
      component.selectedCollection.set(10);
      component.onCollectionChange(20);
      expect(component.selectedCollection()).toBe(20);
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalledWith(20);
    });

    it('should not call loadAssetDeltaList when collectionId is falsy', () => {
      component.onCollectionChange(0 as any);
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).not.toHaveBeenCalled();
    });
  });

  describe('checkStigManagerStatus', () => {
    it('should return an observable', () => {
      const result = component.checkStigManagerStatus();

      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('should return a Set of lowercase asset names when collections are found', () => {
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      let result: Set<string> | undefined;

      component.checkStigManagerStatus().subscribe((names) => {
        result = names;
      });
      expect(result).toBeDefined();
      expect(result!.has('asset-001')).toBe(true);
    });

    it('should return empty Set when no collections from STIG Manager', () => {
      mockSharedService.getCollectionsFromSTIGMAN.mockReturnValue(of([]));
      let result: Set<string> | undefined;

      component.checkStigManagerStatus().subscribe((names) => {
        result = names;
      });
      expect(result).toBeDefined();
      expect(result!.size).toBe(0);
    });

    it('should show error and return EMPTY when getCollectionsFromSTIGMAN fails', () => {
      mockSharedService.getCollectionsFromSTIGMAN.mockReturnValue(throwError(() => new Error('STIGMAN error')));
      let emitted = false;

      component.checkStigManagerStatus().subscribe({ next: () => (emitted = true), error: () => {} });
      expect(emitted).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should show error and return empty array when getAssetsFromSTIGMAN fails for a collection', () => {
      mockSharedService.getAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('asset error')));
      let result: Set<string> | undefined;

      component.checkStigManagerStatus().subscribe((names) => {
        result = names;
      });
      expect(result).toBeDefined();
      expect(result!.size).toBe(0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('checkAllStatuses', () => {
    it('should warn when no selectedCollection', () => {
      component.checkAllStatuses();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Warning' }));
    });

    it('should call postTenableAnalysis and getCollectionsFromSTIGMAN', () => {
      component.selectedCollection.set(10);
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      component.checkAllStatuses();
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalled();
      expect(mockSharedService.getCollectionsFromSTIGMAN).toHaveBeenCalled();
    });

    it('should show success message when both checks complete', () => {
      component.selectedCollection.set(10);
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      component.checkAllStatuses();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should update asset existsInTenable from tenable results', () => {
      component.selectedCollection.set(10);
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      component.checkAllStatuses();
      const updated = component.assets().find((a) => a.key === 'ASSET-001');

      expect(updated?.existsInTenable).toBe(true);
    });

    it('should update asset existsInStigManager from STIG Manager results', () => {
      component.selectedCollection.set(10);
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      component.checkAllStatuses();
      const updated = component.assets().find((a) => a.key === 'ASSET-001');

      expect(updated?.existsInStigManager).toBe(true);
    });
  });

  describe('isTenableCheckDisabled', () => {
    it('should return true when assets is empty', () => {
      expect(component.isTenableCheckDisabled()).toBe(true);
    });

    it('should return true when any asset is loading', () => {
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: true }]);
      expect(component.isTenableCheckDisabled()).toBe(true);
    });

    it('should return false when assets exist and none are loading', () => {
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      expect(component.isTenableCheckDisabled()).toBe(false);
    });
  });

  describe('onUpload', () => {
    it('should add info message on upload', () => {
      component.onUpload();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'File Uploaded' }));
    });
  });

  describe('customUploadHandler', () => {
    let mockFileUpload: any;

    beforeEach(() => {
      mockFileUpload = { clear: vi.fn(), files: [] };
      (component as any).fileUpload = vi.fn().mockReturnValue(mockFileUpload);
      component.selectedCollection.set(10);
      component.selectedUploadCollections.set([10]);
    });

    it('should show error when no file selected', () => {
      component.customUploadHandler({ files: [] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'No file selected' }));
    });

    it('should show error when no collections selected', () => {
      component.selectedUploadCollections.set([]);
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Please select at least one collection first' }));
    });

    it('should show success message when all collections succeed', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Success' }));
    });

    it('should show warn message on partial success', () => {
      mockAssetDeltaService.uploadToMultipleCollections.mockReturnValue(
        of(
          new HttpResponse({
            body: {
              results: [
                { collectionId: 10, success: true },
                { collectionId: 20, success: false, error: 'Failed' }
              ]
            }
          })
        )
      );
      component.selectedUploadCollections.set([10, 20]);
      component.availableCollections = [...mockCollections];
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Partial Success' }));
    });

    it('should show error message when all collections fail', () => {
      mockAssetDeltaService.uploadToMultipleCollections.mockReturnValue(of(new HttpResponse({ body: { results: [{ collectionId: 10, success: false, error: 'Failed' }] } })));
      component.availableCollections = [...mockCollections];
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: 'File upload failed for all collections' }));
    });

    it('should show error when upload fails with exception', () => {
      mockAssetDeltaService.uploadToMultipleCollections.mockReturnValue(throwError(() => new Error('Upload error')));
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      component.customUploadHandler({ files: [file] });
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should close dialog and reload list after successful upload for current collection', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      component.customUploadHandler({ files: [file] });
      expect(component.showUploadDialog()).toBe(false);
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalledWith(10);
    });
  });

  describe('showUploadDialogHandler', () => {
    it('should set selectedUploadCollections from current selectedCollection', () => {
      component.selectedCollection.set(20);
      component.showUploadDialogHandler();
      expect(component.selectedUploadCollections()).toEqual([20]);
    });

    it('should set showUploadDialog to true', () => {
      component.selectedCollection.set(10);
      component.showUploadDialogHandler();
      expect(component.showUploadDialog()).toBe(true);
    });
  });

  describe('formatSize', () => {
    it('should return 0 B for 0 bytes', () => {
      expect(component.formatSize(0)).toBe('0 B');
    });

    it('should format KB correctly', () => {
      expect(component.formatSize(1024)).toBe('1 KB');
    });

    it('should format MB correctly', () => {
      expect(component.formatSize(1048576)).toBe('1 MB');
    });

    it('should format with decimal places', () => {
      expect(component.formatSize(1536)).toBe('1.5 KB');
    });
  });

  describe('exportCSV', () => {
    it('should show error when table is not initialized', () => {
      (component as any).assetDeltaTable = vi.fn().mockReturnValue(null);
      component.exportCSV(new MouseEvent('click'));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should warn when no data to export', () => {
      const mockTable = { exportCSV: vi.fn() };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.exportCSV(new MouseEvent('click'));
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'No Data' }));
    });

    it('should call table exportCSV when assets exist', () => {
      const mockTable = { exportCSV: vi.fn() };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.assets.set([{ key: 'ASSET-001', value: 'Team A', eMASS: true, loading: false }]);
      component.exportCSV(new MouseEvent('click'));
      expect(mockTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('filterGlobal', () => {
    it('should call table filterGlobal with contains mode', () => {
      const mockTable = { filterGlobal: vi.fn() };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.filterGlobal({ target: { value: 'ASSET' } } as any);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('ASSET', 'contains');
    });
  });

  describe('updateFilteredTotal', () => {
    it('should use filteredValue length when table has filter active', () => {
      const mockTable = { filteredValue: [{ key: 'A' }, { key: 'B' }] };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.updateFilteredTotal();
      expect(component.filteredTotal()).toBe(2);
    });

    it('should fall back to assets length when no filteredValue', () => {
      const mockTable = { filteredValue: null };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.assets.set([
        { key: 'A', value: 'T', eMASS: true, loading: false },
        { key: 'B', value: 'T', eMASS: false, loading: false },
        { key: 'C', value: 'T', eMASS: true, loading: false }
      ]);
      component.updateFilteredTotal();
      expect(component.filteredTotal()).toBe(3);
    });
  });

  describe('clearAllFilters', () => {
    it('should reset filteredAssets to all assets', () => {
      const allAssets = [
        { key: 'A', value: 'T', eMASS: true, loading: false },
        { key: 'B', value: 'T', eMASS: false, loading: false }
      ];

      component.assets.set(allAssets);
      component.filteredAssets.set([allAssets[0]]);
      const mockTable = { clear: vi.fn(), filterGlobal: vi.fn() };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.clearAllFilters();
      expect(component.filteredAssets()).toEqual(allAssets);
      expect(component.filteredTotal()).toBe(2);
    });

    it('should call table clear when table is available', () => {
      const mockTable = { clear: vi.fn(), filterGlobal: vi.fn() };

      (component as any).assetDeltaTable = vi.fn().mockReturnValue(mockTable);
      component.clearAllFilters();
      expect(mockTable.clear).toHaveBeenCalled();
    });
  });

  describe('activated input setter', () => {
    it('should set isVisible and schedule table height calculation when activated', () => {
      vi.useFakeTimers();
      component.activated = true;
      vi.runAllTimers();
      expect(component.tableScrollHeight).toBeDefined();
      vi.useRealTimers();
    });

    it('should update isVisible when deactivated', () => {
      component.activated = true;
      component.activated = false;
      expect((component as any).isVisible).toBe(false);
    });
  });

  describe('checkTenableStatus', () => {
    it('should call postTenableAnalysis with correct structure', () => {
      component.checkTenableStatus(['ASSET-001', 'ASSET-002']).subscribe();
      expect(mockImportService.postTenableAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            tool: 'sumdnsname',
            type: 'vuln'
          })
        })
      );
    });

    it('should include hostnames in the filter value', () => {
      component.checkTenableStatus(['HOST-A', 'HOST-B']).subscribe();
      const call = mockImportService.postTenableAnalysis.mock.calls[0][0];

      expect(call.query.filters[0].value).toBe('HOST-A,HOST-B');
    });
  });

  describe('loadCollections', () => {
    it('should populate availableCollections on success', () => {
      component.loadCollections();
      expect(component.availableCollections.length).toBe(2);
    });

    it('should show error when getCollectionBasicList fails', () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('fail')));
      component.loadCollections();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
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
