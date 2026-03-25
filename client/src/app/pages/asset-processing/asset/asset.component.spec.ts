/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NO_ERRORS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AssetComponent } from './asset.component';
import { AssetService } from '../assets.service';
import { SharedService } from '../../../common/services/shared.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';

beforeAll(() => {
  (globalThis as any).CPAT = { Env: { apiBase: '/api' } };
});

const mockLabels = [
  { labelId: 10, labelName: 'Critical' },
  { labelId: 20, labelName: 'High' },
  { labelId: 30, labelName: 'Low' }
];

const mockAssetLabels = [
  { assetId: 5, labelId: 10, labelName: 'Critical' },
  { assetId: 5, labelId: 20, labelName: 'High' }
];

const mockAsset = {
  assetId: 5,
  assetName: 'Test Asset',
  description: 'Test Description',
  fullyQualifiedDomainName: 'test.example.com',
  ipAddress: '192.168.1.1',
  macAddress: 'AA:BB:CC:DD:EE:FF'
};

const mockPayload = { lastCollectionAccessedId: 1 };

describe('AssetComponent', () => {
  let component: AssetComponent;
  let fixture: ComponentFixture<AssetComponent>;
  let mockAssetService: any;
  let mockSharedService: any;
  let mockPayloadService: any;
  let mockMessageService: any;
  let selectedCollectionSubject: BehaviorSubject<any>;
  let accessLevelSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    selectedCollectionSubject = new BehaviorSubject<any>(1);
    accessLevelSubject = new BehaviorSubject<number>(2);

    mockAssetService = {
      getLabels: vi.fn().mockReturnValue(of(mockLabels)),
      getAssetLabels: vi.fn().mockReturnValue(of(mockAssetLabels)),
      postAssetLabel: vi.fn().mockReturnValue(of({})),
      postAsset: vi.fn().mockReturnValue(of({ assetId: 99 })),
      updateAsset: vi.fn().mockReturnValue(of({ ...mockAsset })),
      deleteAssetLabel: vi.fn().mockReturnValue(of({})),
      deleteAssetsByAssetId: vi.fn().mockReturnValue(of({}))
    };

    mockSharedService = {
      selectedCollection: selectedCollectionSubject.asObservable()
    };

    mockPayloadService = {
      accessLevel$: accessLevelSubject.asObservable()
    };

    mockMessageService = createMockMessageService();

    await TestBed.configureTestingModule({
      imports: [AssetComponent],
      providers: [
        { provide: AssetService, useValue: mockAssetService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetComponent);
    component = fixture.componentInstance;
    component.asset = { ...mockAsset };
    component.assets = [mockAsset];
    component.payload = mockPayload;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize assetLabels as empty array', () => {
      expect(component.assetLabels).toEqual([]);
    });

    it('should initialize labelOptions as empty array', () => {
      expect(component.labelOptions).toEqual([]);
    });

    it('should initialize invalidDataMessage as empty string', () => {
      expect(component.invalidDataMessage).toBe('');
    });

    it('should initialize clonedLabels as empty object', () => {
      expect(component.clonedLabels).toEqual({});
    });
  });

  describe('ngOnInit', () => {
    it('should return early when payload is falsy', () => {
      component.payload = null;
      component.ngOnInit();
      expect(mockAssetService.getLabels).not.toHaveBeenCalled();
    });

    it('should subscribe to accessLevel$ and set accessLevel', () => {
      component.ngOnInit();
      expect((component as any).accessLevel).toBe(2);
    });

    it('should call getData when payload is present', () => {
      component.ngOnInit();
      expect(mockAssetService.getLabels).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should update asset when asset input changes', () => {
      const newAsset = { ...mockAsset, assetName: 'Updated Asset' };
      const changes: SimpleChanges = {
        asset: new SimpleChange(mockAsset, newAsset, false)
      };

      component.ngOnChanges(changes);
      expect(component.asset.assetName).toBe('Updated Asset');
    });

    it('should clone the asset (not reference)', () => {
      const newAsset = { ...mockAsset, assetName: 'Clone Test' };
      const changes: SimpleChanges = {
        asset: new SimpleChange(mockAsset, newAsset, false)
      };

      component.ngOnChanges(changes);
      expect(component.asset).not.toBe(newAsset);
    });

    it('should not update asset when asset change has no currentValue', () => {
      const originalName = component.asset.assetName;
      const changes: SimpleChanges = {
        asset: new SimpleChange(mockAsset, null, false)
      };

      component.ngOnChanges(changes);
      expect(component.asset.assetName).toBe(originalName);
    });

    it('should not modify asset when asset key is absent from changes', () => {
      const originalName = component.asset.assetName;

      component.ngOnChanges({});
      expect(component.asset.assetName).toBe(originalName);
    });
  });

  describe('getData', () => {
    it('should subscribe to selectedCollection when not already set', () => {
      component.selectedCollection = null;
      component.getData();
      expect(component.selectedCollection).toBe(1);
    });

    it('should not re-subscribe to selectedCollection when already set', () => {
      component.selectedCollection = 5;
      component.getData();
      expect(component.selectedCollection).toBe(5);
    });

    it('should call getLabelData', () => {
      component.getData();
      expect(mockAssetService.getLabels).toHaveBeenCalled();
    });

    it('should call getAssetLabels when asset is not ADDASSET', () => {
      component.asset = { ...mockAsset, assetId: 5 };
      component.getData();
      expect(mockAssetService.getAssetLabels).toHaveBeenCalledWith(5);
    });

    it('should not call getAssetLabels when asset.assetId is ADDASSET', () => {
      component.asset = { ...mockAsset, assetId: 'ADDASSET' };
      component.getData();
      expect(mockAssetService.getAssetLabels).not.toHaveBeenCalled();
    });

    it('should not call getAssetLabels when asset is null', () => {
      component.asset = null;
      component.getData();
      expect(mockAssetService.getAssetLabels).not.toHaveBeenCalled();
    });
  });

  describe('getLabelData', () => {
    it('should call assetService.getLabels with selectedCollection', () => {
      component.selectedCollection = 1;
      component.getLabelData();
      expect(mockAssetService.getLabels).toHaveBeenCalledWith(1);
    });

    it('should set labelList from response', () => {
      component.getLabelData();
      expect(component.labelList).toEqual(mockLabels);
    });

    it('should set labelList to empty array when response is null', () => {
      mockAssetService.getLabels.mockReturnValue(of(null));
      component.getLabelData();
      expect(component.labelList).toEqual([]);
    });
  });

  describe('getAssetLabels', () => {
    it('should show error when asset has no assetId', () => {
      component.asset = { ...mockAsset, assetId: null };
      component.getAssetLabels();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should not call service when asset has no assetId', () => {
      component.asset = { ...mockAsset, assetId: null };
      component.getAssetLabels();
      expect(mockAssetService.getAssetLabels).not.toHaveBeenCalled();
    });

    it('should call assetService.getAssetLabels with asset.assetId', () => {
      component.getAssetLabels();
      expect(mockAssetService.getAssetLabels).toHaveBeenCalledWith(5);
    });

    it('should set assetLabels from response', () => {
      component.getAssetLabels();
      expect(component.assetLabels).toEqual(mockAssetLabels);
    });

    it('should set assetLabels to empty array when response is null', () => {
      mockAssetService.getAssetLabels.mockReturnValue(of(null));
      component.getAssetLabels();
      expect(component.assetLabels).toEqual([]);
    });

    it('should show error message on service failure', () => {
      mockAssetService.getAssetLabels.mockReturnValue(throwError(() => new Error('fetch error')));
      component.getAssetLabels();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('transformToDropdownOptions', () => {
    it('should map items to labelName and labelId shape', () => {
      const result = component.transformToDropdownOptions(mockLabels, 'labelName', 'labelId');

      expect(result[0]).toEqual({ labelName: 'Critical', labelId: 10 });
    });

    it('should return empty array for empty input', () => {
      expect(component.transformToDropdownOptions([], 'labelName', 'labelId')).toEqual([]);
    });

    it('should return empty array for null input', () => {
      expect(component.transformToDropdownOptions(null as any, 'labelName', 'labelId')).toEqual([]);
    });
  });

  describe('addNewRow', () => {
    it('should prepend a new label row to assetLabels', () => {
      component.assetLabels = [...mockAssetLabels];
      component.addNewRow();
      expect(component.assetLabels.length).toBe(3);
      expect(component.assetLabels[0].isNew).toBe(true);
    });

    it('should set assetId on new row from asset.assetId', () => {
      component.assetLabels = [];
      component.addNewRow();
      expect(component.assetLabels[0].assetId).toBe(5);
    });

    it('should set labelId and labelName as null on new row', () => {
      component.assetLabels = [];
      component.addNewRow();
      expect(component.assetLabels[0].labelId).toBeNull();
      expect(component.assetLabels[0].labelName).toBeNull();
    });
  });

  describe('onLabelChange', () => {
    beforeEach(() => {
      component.labelList = mockLabels;
    });

    it('should set labelName and call confirmLabelCreate when label is found', () => {
      const label = { labelId: 10, labelName: null, isNew: true };

      component.assetLabels = [label];
      component.onLabelChange(label, 0);
      expect(label.labelName).toBe('Critical');
      expect(label.isNew).toBe(false);
    });

    it('should call postAssetLabel when real asset and label is selected', () => {
      const label = { assetId: 5, labelId: 10, labelName: null, isNew: true };

      component.assetLabels = [label];
      component.onLabelChange(label, 0);
      expect(mockAssetService.postAssetLabel).toHaveBeenCalled();
    });

    it('should splice row when label.labelId is falsy', () => {
      const label = { labelId: null, labelName: null, isNew: true };

      component.assetLabels = [label];
      component.onLabelChange(label, 0);
      expect(component.assetLabels.length).toBe(0);
    });
  });

  describe('deleteAssetLabel', () => {
    beforeEach(() => {
      component.assetLabels = [...mockAssetLabels];
    });

    it('should splice and show success message for ADDASSET', () => {
      component.asset = { ...mockAsset, assetId: 'ADDASSET' };
      component.deleteAssetLabel(mockAssetLabels[0], 0);
      expect(component.assetLabels.length).toBe(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should call deleteAssetLabel service for real asset with labelId', () => {
      component.deleteAssetLabel(mockAssetLabels[0], 0);
      expect(mockAssetService.deleteAssetLabel).toHaveBeenCalledWith(5, 10);
    });

    it('should splice label and show success on successful delete', () => {
      component.deleteAssetLabel(mockAssetLabels[0], 0);
      expect(component.assetLabels.length).toBe(1);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show error message on delete failure', () => {
      mockAssetService.deleteAssetLabel.mockReturnValue(throwError(() => new Error('delete error')));
      component.deleteAssetLabel(mockAssetLabels[0], 0);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('confirmLabelCreate', () => {
    beforeEach(() => {
      component.labelList = mockLabels;
    });

    it('should call postAssetLabel for real asset with valid labelId', () => {
      const newLabel = { assetId: 5, labelId: 10, labelName: 'Critical' };

      component.confirmLabelCreate(newLabel);
      expect(mockAssetService.postAssetLabel).toHaveBeenCalledWith(expect.objectContaining({ assetId: 5, labelId: 10 }));
    });

    it('should show success message on successful postAssetLabel', () => {
      const newLabel = { assetId: 5, labelId: 10, labelName: 'Critical' };

      component.confirmLabelCreate(newLabel);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should show error on postAssetLabel failure', () => {
      mockAssetService.postAssetLabel.mockReturnValue(throwError(() => new Error('post error')));
      const newLabel = { assetId: 5, labelId: 10, labelName: 'Critical' };

      component.confirmLabelCreate(newLabel);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show success for ADDASSET with valid labelId', () => {
      component.asset = { ...mockAsset, assetId: 'ADDASSET' };
      const newLabel = { labelId: 10 };

      component.confirmLabelCreate(newLabel);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should not call postAssetLabel for ADDASSET', () => {
      component.asset = { ...mockAsset, assetId: 'ADDASSET' };
      const newLabel = { labelId: 10 };

      component.confirmLabelCreate(newLabel);
      expect(mockAssetService.postAssetLabel).not.toHaveBeenCalled();
    });

    it('should show error when labelId is falsy', () => {
      const newLabel = { labelId: null };

      component.confirmLabelCreate(newLabel);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Failed to create entry. Invalid input.' }));
    });
  });

  describe('getLabelName', () => {
    beforeEach(() => {
      component.labelList = mockLabels;
    });

    it('should return labelName for matching labelId', () => {
      expect(component.getLabelName(10)).toBe('Critical');
    });

    it('should return empty string when labelId not found', () => {
      expect(component.getLabelName(999)).toBe('');
    });
  });

  describe('validData', () => {
    beforeEach(() => {
      component.asset = {
        assetId: 5,
        assetName: 'Test Asset',
        fullyQualifiedDomainName: 'test.example.com',
        ipAddress: '192.168.1.1',
        macAddress: ''
      };
      component.assets = [];
    });

    it('should return true when all required fields are present', () => {
      expect(component.validData()).toBe(true);
    });

    it('should return false and show error when assetName is missing', () => {
      component.asset.assetName = '';
      expect(component.validData()).toBe(false);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should return false when FQDN is missing', () => {
      component.asset.fullyQualifiedDomainName = '';
      expect(component.validData()).toBe(false);
    });

    it('should return false when ipAddress is missing', () => {
      component.asset.ipAddress = '';
      expect(component.validData()).toBe(false);
    });

    it('should return false when ADDASSET and asset name already exists', () => {
      component.asset.assetId = 'ADDASSET';
      component.asset.assetName = 'Existing Asset';
      component.assets = [{ assetName: 'Existing Asset' }];
      expect(component.validData()).toBe(false);
    });

    it('should return true for ADDASSET when name does not already exist', () => {
      component.asset.assetId = 'ADDASSET';
      component.asset.assetName = 'Brand New Asset';
      component.assets = [{ assetName: 'Other Asset' }];
      expect(component.validData()).toBe(true);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.asset = {
        assetId: 'ADDASSET',
        assetName: 'New Asset',
        fullyQualifiedDomainName: 'new.example.com',
        ipAddress: '10.0.0.1',
        macAddress: ''
      };
      component.assets = [];
      component.selectedCollection = 1;
    });

    it('should return early when validData returns false', () => {
      component.asset.assetName = '';
      component.onSubmit();
      expect(mockAssetService.postAsset).not.toHaveBeenCalled();
    });

    it('should call postAsset when assetId is ADDASSET', () => {
      component.onSubmit();
      expect(mockAssetService.postAsset).toHaveBeenCalledWith(expect.objectContaining({ assetId: 0, assetName: 'New Asset' }));
    });

    it('should emit assetchange with new assetId on successful post', () => {
      const emitSpy = vi.spyOn(component.assetchange, 'emit');

      component.onSubmit();
      expect(emitSpy).toHaveBeenCalledWith(99);
    });

    it('should show error message when postAsset fails', () => {
      mockAssetService.postAsset.mockReturnValue(throwError(() => new Error('post error')));
      component.onSubmit();
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should call updateAsset when assetId is numeric', () => {
      component.asset = { ...mockAsset };
      component.onSubmit();
      expect(mockAssetService.updateAsset).toHaveBeenCalled();
    });

    it('should emit assetchange on successful update', () => {
      const emitSpy = vi.spyOn(component.assetchange, 'emit');

      component.asset = { ...mockAsset };
      component.onSubmit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should reset asset to empty fields', () => {
      component.resetData();
      expect(component.asset.assetId).toBe('');
      expect(component.asset.assetName).toBe('');
      expect(component.asset.ipAddress).toBe('');
    });

    it('should emit assetchange', () => {
      const emitSpy = vi.spyOn(component.assetchange, 'emit');

      component.resetData();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('deleteAsset', () => {
    it('should call deleteAssetsByAssetId with asset.assetId', () => {
      component.deleteAsset(mockAsset);
      expect(mockAssetService.deleteAssetsByAssetId).toHaveBeenCalledWith(5);
    });

    it('should show success message on successful delete', () => {
      component.deleteAsset(mockAsset);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('should emit assetchange on successful delete', () => {
      const emitSpy = vi.spyOn(component.assetchange, 'emit');

      component.deleteAsset(mockAsset);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should show error message on delete failure', () => {
      mockAssetService.deleteAssetsByAssetId.mockReturnValue(throwError(() => new Error('delete error')));
      component.deleteAsset(mockAsset);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('invalidData', () => {
    it('should call messageService.add with error severity', () => {
      component.invalidData('test error');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });

    it('should include the error message in detail', () => {
      component.invalidData('Asset name required');
      const call = mockMessageService.add.mock.calls[0][0];

      expect(call.detail).toContain('Invalid Data:');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subs', () => {
      const spy = vi.spyOn((component as any).subs, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptions', () => {
      const spy = vi.spyOn((component as any).subscriptions, 'unsubscribe');

      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without prior init', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
