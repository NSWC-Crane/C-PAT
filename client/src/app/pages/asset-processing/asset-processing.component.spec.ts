/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AssetProcessingComponent } from './asset-processing.component';
import { AssetService } from './assets.service';
import { PayloadService } from '../../common/services/setPayload.service';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { createMockMessageService } from '../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockAssets = [
  { assetId: '2', assetName: 'Asset B', description: 'Desc B', ipAddress: '10.0.0.2', macAddress: 'BB:BB' },
  { assetId: '1', assetName: 'Asset A', description: 'Desc A', ipAddress: '10.0.0.1', macAddress: 'AA:AA' }
];

const mockAssetLabelResponse = {
  assetLabel: [
    { label: 'Critical', labelCount: 5 },
    { label: 'High', labelCount: 10 }
  ]
};

const mockCollections = [
  { collectionId: 1, collectionName: 'Col A', collectionType: 'Tenable', originCollectionId: 42 },
  { collectionId: 2, collectionName: 'Col B', collectionType: 'STIG', originCollectionId: null }
];

describe('AssetProcessingComponent', () => {
  let component: AssetProcessingComponent;
  let fixture: ComponentFixture<AssetProcessingComponent>;
  let mockAssetService: any;
  let mockPayloadService: any;
  let mockSharedService: any;
  let mockCollectionsService: any;
  let mockMessageService: any;
  let userSubject: BehaviorSubject<any>;
  let payloadSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;
  let selectedCollectionSubject: BehaviorSubject<any>;

  const setupTableMock = () => {
    const mockTable = { clear: vi.fn(), filterGlobal: vi.fn() };

    Object.defineProperty(component, 'assetTable', { get: () => () => mockTable, configurable: true });

    return mockTable;
  };

  beforeEach(async () => {
    userSubject = new BehaviorSubject<any>({ lastCollectionAccessedId: 1 });
    payloadSubject = new BehaviorSubject<any>({ lastCollectionAccessedId: 1 });
    accessLevelSubject = new BehaviorSubject<number>(0);
    selectedCollectionSubject = new BehaviorSubject<any>(1);

    mockAssetService = {
      getAssetsByCollection: vi.fn().mockReturnValue(of(mockAssets)),
      getCollectionAssetLabel: vi.fn().mockReturnValue(of(mockAssetLabelResponse))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: userSubject.asObservable(),
      payload$: payloadSubject.asObservable(),
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn().mockReturnValue(of(mockCollections))
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AssetProcessingComponent],
      providers: [
        { provide: AssetService, useValue: mockAssetService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetProcessingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize chartOptions', () => {
      expect(component.chartOptions).toBeDefined();
    });

    it('should set chartOptions.responsive to true', () => {
      expect(component.chartOptions.responsive).toBe(true);
    });

    it('should set chartOptions.maintainAspectRatio to false', () => {
      expect(component.chartOptions.maintainAspectRatio).toBe(false);
    });

    it('should configure legend plugin', () => {
      expect(component.chartOptions.plugins.legend.display).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should initialize assets as empty array', () => {
      expect(component.assets).toEqual([]);
    });

    it('should initialize data as empty array', () => {
      expect(component.data).toEqual([]);
    });

    it('should initialize assetLabel as empty array', () => {
      expect(component.assetLabel).toEqual([]);
    });

    it('should initialize filterValue as empty string', () => {
      expect(component.filterValue).toBe('');
    });

    it('should initialize assetDialogVisible as false', () => {
      expect(component.assetDialogVisible).toBe(false);
    });

    it('should initialize asset with empty fields', () => {
      expect(component.asset.assetId).toBe('');
      expect(component.asset.assetName).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedCollection', async () => {
      await component.ngOnInit();
      expect(component.selectedCollection).toBe(1);
    });

    it('should update selectedCollection when it changes', async () => {
      await component.ngOnInit();
      selectedCollectionSubject.next(2);
      expect(component.selectedCollection).toBe(2);
    });

    it('should call getCollectionBasicList', async () => {
      await component.ngOnInit();
      expect(mockCollectionsService.getCollectionBasicList).toHaveBeenCalled();
    });

    it('should set collectionType from matched collection', async () => {
      component.selectedCollection = 1;
      await component.ngOnInit();
      expect(component.collectionType).toBe('Tenable');
    });

    it('should set originCollectionId from matched collection', async () => {
      component.selectedCollection = 1;
      await component.ngOnInit();
      expect(component.originCollectionId).toBe(42);
    });

    it('should call messageService.add and set collectionType empty on getCollectionBasicList error', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('Network error')));
      await component.ngOnInit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(component.collectionType).toBe('');
    });

    it('should call initializeColumns on init', async () => {
      await component.ngOnInit();
      expect(component.cols).toBeDefined();
      expect(component.cols.length).toBe(5);
    });

    it('should call setPayloadService.setPayload', async () => {
      await component.ngOnInit();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });
  });

  describe('initializeColumns', () => {
    it('should set 5 columns', () => {
      component.initializeColumns();
      expect(component.cols).toHaveLength(5);
    });

    it('should include assetId column', () => {
      component.initializeColumns();
      expect(component.cols.find((c) => c.field === 'assetId')).toBeDefined();
    });

    it('should include assetName column', () => {
      component.initializeColumns();
      expect(component.cols.find((c) => c.field === 'assetName')).toBeDefined();
    });

    it('should include description column', () => {
      component.initializeColumns();
      expect(component.cols.find((c) => c.field === 'description')).toBeDefined();
    });

    it('should include ipAddress column', () => {
      component.initializeColumns();
      expect(component.cols.find((c) => c.field === 'ipAddress')).toBeDefined();
    });

    it('should include macAddress column', () => {
      component.initializeColumns();
      expect(component.cols.find((c) => c.field === 'macAddress')).toBeDefined();
    });

    it('should set customExportHeader on assetId column', () => {
      component.initializeColumns();
      const col = component.cols.find((c) => c.field === 'assetId');

      expect(col?.customExportHeader).toBe('Asset Identifier');
    });
  });

  describe('setPayload', () => {
    it('should subscribe to user$ and set user', async () => {
      await component.setPayload();
      expect(component.user).toEqual({ lastCollectionAccessedId: 1 });
    });

    it('should subscribe to payload$ and set payload', async () => {
      await component.setPayload();
      expect(component.payload).toEqual({ lastCollectionAccessedId: 1 });
    });

    it('should call getAssetData when accessLevel > 0', async () => {
      component.user = { lastCollectionAccessedId: 1 };
      component.payload = { lastCollectionAccessedId: 1 };
      await component.setPayload();
      accessLevelSubject.next(2);
      expect(mockAssetService.getAssetsByCollection).toHaveBeenCalled();
    });

    it('should not call getAssetData when accessLevel is 0', async () => {
      await component.setPayload();
      accessLevelSubject.next(0);
      expect(mockAssetService.getAssetsByCollection).not.toHaveBeenCalled();
    });
  });

  describe('getAssetData', () => {
    beforeEach(() => {
      component.user = { lastCollectionAccessedId: 1 };
      component.payload = { lastCollectionAccessedId: 1 };
    });

    it('should not run when payload is falsy', () => {
      component.payload = null;
      component.getAssetData();
      expect(mockAssetService.getAssetsByCollection).not.toHaveBeenCalled();
    });

    it('should call getAssetsByCollection with user.lastCollectionAccessedId', () => {
      component.getAssetData();
      expect(mockAssetService.getAssetsByCollection).toHaveBeenCalledWith(1);
    });

    it('should call getCollectionAssetLabel with payload.lastCollectionAccessedId', () => {
      component.getAssetData();
      expect(mockAssetService.getCollectionAssetLabel).toHaveBeenCalledWith(1);
    });

    it('should set assetLabel from response', () => {
      component.getAssetData();
      expect(component.assetLabel).toEqual(mockAssetLabelResponse.assetLabel);
    });

    it('should convert assetId to number and sort data by assetId', () => {
      component.getAssetData();
      expect(component.data[0].assetId).toBe(1);
      expect(component.data[1].assetId).toBe(2);
    });

    it('should set assets equal to sorted data', () => {
      component.getAssetData();
      expect(component.assets).toEqual(component.data);
    });

    it('should build chartData from assetLabel', () => {
      component.getAssetData();
      expect(component.chartData).toBeDefined();
      expect(component.chartData.datasets).toHaveLength(2);
    });

    it('should show error message when getAssetsByCollection returns non-array', () => {
      mockAssetService.getAssetsByCollection.mockReturnValue(of({ error: 'bad' }));
      component.getAssetData();

      expect(component.data).toEqual([]);
    });

    it('should show error message when assetLabelResponse.assetLabel is not array', () => {
      mockAssetService.getCollectionAssetLabel.mockReturnValue(of({ assetLabel: 'bad' }));
      component.getAssetData();
      expect(component.assetLabel).toEqual([]);
    });

    it('should call messageService.add on forkJoin error', () => {
      mockAssetService.getAssetsByCollection.mockReturnValue(throwError(() => new Error('fetch error')));
      component.getAssetData();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('setLabelChartData', () => {
    it('should set chartData.labels to [Assets]', () => {
      component.setLabelChartData([{ label: 'Low', labelCount: 3 }]);
      expect(component.chartData.labels).toEqual(['Assets']);
    });

    it('should build datasets from assetLabel array', () => {
      component.setLabelChartData(mockAssetLabelResponse.assetLabel);
      expect(component.chartData.datasets).toHaveLength(2);
    });

    it('should map dataset label from item.label', () => {
      component.setLabelChartData([{ label: 'Critical', labelCount: 7 }]);
      expect(component.chartData.datasets[0].label).toBe('Critical');
    });

    it('should map dataset data from item.labelCount', () => {
      component.setLabelChartData([{ label: 'Critical', labelCount: 7 }]);
      expect(component.chartData.datasets[0].data).toEqual([7]);
    });

    it('should produce empty datasets for empty array', () => {
      component.setLabelChartData([]);
      expect(component.chartData.datasets).toEqual([]);
    });
  });

  describe('setAsset', () => {
    beforeEach(() => {
      component.data = [
        { assetId: 1, assetName: 'Asset A', description: 'D', ipAddress: '1.1.1.1', macAddress: 'AA' },
        { assetId: 2, assetName: 'Asset B', description: 'D', ipAddress: '2.2.2.2', macAddress: 'BB' }
      ];
    });

    it('should set asset to the found entry', () => {
      component.setAsset(1);
      expect(component.asset.assetName).toBe('Asset A');
    });

    it('should set assetDialogVisible to true when asset found', () => {
      component.setAsset(1);
      expect(component.assetDialogVisible).toBe(true);
    });

    it('should reset asset to empty when assetId not found', () => {
      component.setAsset(999);
      expect(component.asset.assetId).toBe('');
      expect(component.asset.assetName).toBe('');
    });

    it('should not set assetDialogVisible when asset not found', () => {
      component.assetDialogVisible = false;
      component.setAsset(999);
      expect(component.assetDialogVisible).toBe(false);
    });

    it('should clone the asset (not reference)', () => {
      component.setAsset(1);
      const ref = component.data.find((a) => a.assetId === 1);

      expect(component.asset).not.toBe(ref);
    });
  });

  describe('addAsset', () => {
    it('should set asset.assetId to ADDASSET', () => {
      component.addAsset();
      expect(component.asset.assetId).toBe('ADDASSET');
    });

    it('should clear asset name', () => {
      component.addAsset();
      expect(component.asset.assetName).toBe('');
    });

    it('should set assetDialogVisible to true', () => {
      component.addAsset();
      expect(component.assetDialogVisible).toBe(true);
    });
  });

  describe('resetData', () => {
    it('should reset asset to empty fields', () => {
      component.asset = { assetId: 5, assetName: 'X', description: '', ipAddress: '', macAddress: '' };
      component.user = { lastCollectionAccessedId: 1 };
      component.payload = { lastCollectionAccessedId: 1 };
      component.resetData();
      expect(component.asset.assetId).toBe('');
      expect(component.asset.assetName).toBe('');
    });

    it('should call getAssetData after reset', () => {
      component.user = { lastCollectionAccessedId: 1 };
      component.payload = { lastCollectionAccessedId: 1 };
      component.resetData();
      expect(mockAssetService.getAssetsByCollection).toHaveBeenCalled();
    });
  });

  describe('closeAssetDialog', () => {
    it('should set assetDialogVisible to false', () => {
      component.assetDialogVisible = true;
      component.closeAssetDialog();
      expect(component.assetDialogVisible).toBe(false);
    });
  });

  describe('applyFilter', () => {
    it('should call assetTable().filterGlobal with trimmed lowercase value', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: '  Host1  ' } } as unknown as Event;

      component.applyFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('host1', 'contains');
    });

    it('should pass empty string when cleared', () => {
      const mockTable = setupTableMock();
      const event = { target: { value: '' } } as unknown as Event;

      component.applyFilter(event);
      expect(mockTable.filterGlobal).toHaveBeenCalledWith('', 'contains');
    });
  });

  describe('clear', () => {
    it('should call assetTable().clear()', () => {
      const mockTable = setupTableMock();

      component.clear();
      expect(mockTable.clear).toHaveBeenCalled();
    });

    it('should reset filterValue to empty string', () => {
      setupTableMock();

      component.filterValue = 'some filter';
      component.clear();
      expect(component.filterValue).toBe('');
    });

    it('should restore data from assets', () => {
      setupTableMock();
      const saved = [{ assetId: 1, assetName: 'A', description: '', ipAddress: '', macAddress: '' }];

      component.assets = saved;
      component.data = [];
      component.clear();
      expect(component.data).toEqual(saved);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', async () => {
      await component.ngOnInit();
      const spy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptions', async () => {
      await component.ngOnInit();
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without prior init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
