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
import { SimpleChange, SimpleChanges } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamAssetsComponent } from './poam-assets.component';

describe('PoamAssetsComponent', () => {
  let component: PoamAssetsComponent;
  let fixture: ComponentFixture<PoamAssetsComponent>;
  let mockMessageService: any;
  let mockPoamService: any;

  const mockAssetList = [
    { assetId: 1, assetName: 'Server-Alpha' },
    { assetId: 2, assetName: 'Workstation-Beta' },
    { assetId: 3, assetName: 'Router-Gamma' }
  ];

  function createAsset(overrides: any = {}): any {
    return {
      poamId: 100,
      assetId: 1,
      isNew: false,
      ...overrides
    };
  }

  function makeChanges(changesMap: Record<string, { currentValue: any; previousValue?: any; firstChange?: boolean }>): SimpleChanges {
    const changes: SimpleChanges = {};

    for (const [key, val] of Object.entries(changesMap)) {
      changes[key] = new SimpleChange(val.previousValue ?? undefined, val.currentValue, val.firstChange ?? true);
    }

    return changes;
  }

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamService = {
      getPoamAssets: vi.fn().mockReturnValue(of([])),
      postPoamAsset: vi.fn().mockReturnValue(of({})),
      deletePoamAsset: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [PoamAssetsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MessageService, useValue: mockMessageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssetsComponent);
    component = fixture.componentInstance;
    component.poam = { poamId: 100, status: 'Draft' };
    component.accessLevel = 2;
    component.collectionType = 'C-PAT';
    component.poamAssets = [];
    component.assetList = mockAssetList;
    component.originCollectionId = null;
    component.poamService = mockPoamService as any;
    component.poamAssignedTeams = [];
    component.poamAssociatedVulnerabilities = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default property values', () => {
      expect(component.poamAssets).toEqual([]);
      expect(component.assetList).toBe(mockAssetList);
    });
  });

  describe('ngOnChanges', () => {
    it('should update signal when poamAssets changes', () => {
      const assets = [createAsset()];

      component.poamAssets = assets;

      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: assets }
        })
      );

      expect(component.displayAssets().length).toBe(1);
    });

    it('should set signal to empty array when poamAssets is null', () => {
      component.poamAssets = null as any;

      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: null }
        })
      );

      expect(component.displayAssets()).toEqual([]);
    });

    it('should trigger re-computation when assetList changes', () => {
      component.poamAssets = [createAsset({ assetId: 1 })];
      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: component.poamAssets }
        })
      );

      expect(component.displayAssets()[0].displayName).toBe('Server-Alpha');

      component.assetList = [{ assetId: 1, assetName: 'Renamed-Server' }];
      component.ngOnChanges(
        makeChanges({
          assetList: { currentValue: component.assetList }
        })
      );

      expect(component.displayAssets()[0].displayName).toBe('Renamed-Server');
    });

    it('should call refreshAssets when teams are removed', () => {
      const refreshSpy = vi.spyOn(component, 'refreshAssets');

      component.poamAssignedTeams = [{ assignedTeamId: 1 }, { assignedTeamId: 2 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: { currentValue: component.poamAssignedTeams }
        })
      );

      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: {
            currentValue: component.poamAssignedTeams,
            previousValue: [{ assignedTeamId: 1 }, { assignedTeamId: 2 }],
            firstChange: false
          }
        })
      );

      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should not call refreshAssets when teams are added', () => {
      const refreshSpy = vi.spyOn(component, 'refreshAssets');

      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: { currentValue: component.poamAssignedTeams }
        })
      );

      component.poamAssignedTeams = [{ assignedTeamId: 1 }, { assignedTeamId: 2 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: {
            currentValue: component.poamAssignedTeams,
            previousValue: [{ assignedTeamId: 1 }],
            firstChange: false
          }
        })
      );

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should not call refreshAssets when poamAssignedTeams is null', () => {
      const refreshSpy = vi.spyOn(component, 'refreshAssets');

      component.poamAssignedTeams = null as any;
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: { currentValue: null }
        })
      );

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should track previousTeamCount correctly across changes', () => {
      component.poamAssignedTeams = [{ assignedTeamId: 1 }, { assignedTeamId: 2 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: { currentValue: component.poamAssignedTeams }
        })
      );

      const refreshSpy = vi.spyOn(component, 'refreshAssets');

      component.poamAssignedTeams = [{ assignedTeamId: 1 }];
      component.ngOnChanges(
        makeChanges({
          poamAssignedTeams: {
            currentValue: component.poamAssignedTeams,
            previousValue: [{ assignedTeamId: 1 }, { assignedTeamId: 2 }],
            firstChange: false
          }
        })
      );

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('displayAssets computed', () => {
    it('should map asset names from assetList', () => {
      component.poamAssets = [createAsset({ assetId: 1 }), createAsset({ assetId: 2 })];
      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: component.poamAssets }
        })
      );

      const displayed = component.displayAssets();

      expect(displayed[0].displayName).toBe('Server-Alpha');
      expect(displayed[1].displayName).toBe('Workstation-Beta');
    });

    it('should show fallback name for unknown asset IDs', () => {
      component.poamAssets = [createAsset({ assetId: 999 })];
      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: component.poamAssets }
        })
      );

      expect(component.displayAssets()[0].displayName).toBe('Asset ID: 999');
    });

    it('should return empty array when no assets', () => {
      component.poamAssets = [];
      component.ngOnChanges(
        makeChanges({
          poamAssets: { currentValue: [] }
        })
      );

      expect(component.displayAssets()).toEqual([]);
    });
  });

  describe('addAsset', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.assetsChanged, 'emit');
    });

    it('should add a new asset to the beginning of the array', async () => {
      const existing = createAsset({ assetId: 2 });

      component.poamAssets = [existing];

      await component.addAsset();

      expect(component.poamAssets.length).toBe(2);
      expect(component.poamAssets[0].isNew).toBe(true);
      expect(component.poamAssets[0].assetId).toBeNull();
      expect(component.poamAssets[1].assetId).toBe(2);
    });

    it('should set the poamId from the current poam', async () => {
      component.poam = { poamId: 42 };
      await component.addAsset();

      expect(component.poamAssets[0].poamId).toBe(42);
    });

    it('should emit assetsChanged', async () => {
      await component.addAsset();
      expect(emitSpy).toHaveBeenCalledWith(component.poamAssets);
    });

    it('should add to an empty array', async () => {
      component.poamAssets = [];
      await component.addAsset();
      expect(component.poamAssets.length).toBe(1);
    });
  });

  describe('onAssetChange', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.assetsChanged, 'emit');
    });

    it('should call confirmCreateAsset and mark not new when assetId is set', async () => {
      const createSpy = vi.spyOn(component, 'confirmCreateAsset').mockResolvedValue(undefined);
      const asset = createAsset({ assetId: 1, isNew: true });

      component.poamAssets = [asset];

      await component.onAssetChange(asset, 0);

      expect(createSpy).toHaveBeenCalledWith(asset);
      expect(asset.isNew).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should remove asset from array when assetId is null', async () => {
      const nullAsset = createAsset({ assetId: null, isNew: true });
      const existing = createAsset({ assetId: 2 });

      component.poamAssets = [nullAsset, existing];

      await component.onAssetChange(nullAsset, 0);

      expect(component.poamAssets.length).toBe(1);
      expect(component.poamAssets[0].assetId).toBe(2);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should remove asset when assetId is 0 (falsy)', async () => {
      const asset = createAsset({ assetId: 0 });

      component.poamAssets = [asset];

      await component.onAssetChange(asset, 0);

      expect(component.poamAssets.length).toBe(0);
    });
  });

  describe('deleteAsset', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.assetsChanged, 'emit');
    });

    it('should call confirmDeleteAsset when asset has assetId', async () => {
      const deleteSpy = vi.spyOn(component, 'confirmDeleteAsset').mockResolvedValue(undefined);
      const asset = createAsset({ assetId: 1 });

      component.poamAssets = [asset];

      await component.deleteAsset(asset, 0);

      expect(deleteSpy).toHaveBeenCalledWith(asset);
    });

    it('should splice and emit when asset has no assetId', async () => {
      const asset = createAsset({ assetId: null, isNew: true });
      const existing = createAsset({ assetId: 2 });

      component.poamAssets = [asset, existing];

      await component.deleteAsset(asset, 0);

      expect(component.poamAssets.length).toBe(1);
      expect(component.poamAssets[0].assetId).toBe(2);
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('getAssetName', () => {
    it('should return asset name for known assetId', () => {
      expect(component.getAssetName(1)).toBe('Server-Alpha');
    });

    it('should return asset name for another known assetId', () => {
      expect(component.getAssetName(3)).toBe('Router-Gamma');
    });

    it('should return fallback string for unknown assetId', () => {
      expect(component.getAssetName(999)).toBe('Asset ID: 999');
    });

    it('should return fallback when assetList is empty', () => {
      component.assetList = [];
      expect(component.getAssetName(1)).toBe('Asset ID: 1');
    });
  });

  describe('confirmCreateAsset', () => {
    it('should post asset and show success message', async () => {
      mockPoamService.postPoamAsset.mockReturnValue(of({ success: true }));
      mockPoamService.getPoamAssets.mockReturnValue(of([createAsset({ assetId: 1 })]));

      const asset = { assetId: 5 };

      await component.confirmCreateAsset(asset);

      expect(mockPoamService.postPoamAsset).toHaveBeenCalledWith({
        poamId: 100,
        assetId: 5
      });
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Asset added successfully.'
        })
      );
    });

    it('should convert poamId and assetId to numbers', async () => {
      component.poam = { poamId: '42' };
      mockPoamService.postPoamAsset.mockReturnValue(of({}));
      mockPoamService.getPoamAssets.mockReturnValue(of([]));

      await component.confirmCreateAsset({ assetId: '7' });

      expect(mockPoamService.postPoamAsset).toHaveBeenCalledWith({
        poamId: 42,
        assetId: 7
      });
    });

    it('should call fetchAssets on success', async () => {
      const fetchSpy = vi.spyOn(component, 'fetchAssets');

      mockPoamService.postPoamAsset.mockReturnValue(of({}));

      await component.confirmCreateAsset({ assetId: 1 });

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should show error message on pipe catchError', async () => {
      mockPoamService.postPoamAsset.mockReturnValue(throwError(() => ({ error: { detail: 'Duplicate asset' } })));

      await component.confirmCreateAsset({ assetId: 1 });

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Duplicate asset')
        })
      );
    });

    it('should do nothing if assetId is falsy', async () => {
      await component.confirmCreateAsset({ assetId: null });
      expect(mockPoamService.postPoamAsset).not.toHaveBeenCalled();
    });

    it('should do nothing if assetId is 0', async () => {
      await component.confirmCreateAsset({ assetId: 0 });
      expect(mockPoamService.postPoamAsset).not.toHaveBeenCalled();
    });
  });

  describe('confirmDeleteAsset', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.assetsChanged, 'emit');
    });

    it('should filter out the asset by assetId', async () => {
      component.poamAssets = [createAsset({ assetId: 1 }), createAsset({ assetId: 2 }), createAsset({ assetId: 3 })];

      await component.confirmDeleteAsset({ assetId: 2 });

      expect(component.poamAssets.length).toBe(2);
      expect(component.poamAssets.map((a: any) => a.assetId)).toEqual([1, 3]);
    });

    it('should emit assetsChanged after filtering', async () => {
      component.poamAssets = [createAsset({ assetId: 1 })];
      await component.confirmDeleteAsset({ assetId: 1 });

      expect(emitSpy).toHaveBeenCalledWith(component.poamAssets);
    });

    it('should result in empty array when deleting only asset', async () => {
      component.poamAssets = [createAsset({ assetId: 1 })];
      await component.confirmDeleteAsset({ assetId: 1 });

      expect(component.poamAssets).toEqual([]);
    });

    it('should not remove anything if assetId does not match', async () => {
      component.poamAssets = [createAsset({ assetId: 1 })];
      await component.confirmDeleteAsset({ assetId: 999 });

      expect(component.poamAssets.length).toBe(1);
    });
  });

  describe('fetchAssets', () => {
    let emitSpy: any;

    beforeEach(() => {
      emitSpy = vi.spyOn(component.assetsChanged, 'emit');
    });

    it('should not call service if poamId is falsy', () => {
      component.poam = { poamId: null };
      component.fetchAssets();
      expect(mockPoamService.getPoamAssets).not.toHaveBeenCalled();
    });

    it('should not call service if poamId is ADDPOAM', () => {
      component.poam = { poamId: 'ADDPOAM' };
      component.fetchAssets();
      expect(mockPoamService.getPoamAssets).not.toHaveBeenCalled();
    });

    it('should fetch and update poamAssets on success', () => {
      const returnedAssets = [createAsset({ assetId: 1 }), createAsset({ assetId: 2 })];

      mockPoamService.getPoamAssets.mockReturnValue(of(returnedAssets));

      component.fetchAssets();

      expect(mockPoamService.getPoamAssets).toHaveBeenCalledWith(100);
      expect(component.poamAssets).toBe(returnedAssets);
      expect(emitSpy).toHaveBeenCalledWith(returnedAssets);
    });

    it('should show error message on failure', () => {
      mockPoamService.getPoamAssets.mockReturnValue(throwError(() => ({ message: 'Network error' })));

      component.fetchAssets();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to fetch assets: Network error'
        })
      );
    });

    it('should show generic error message when no detail or message', () => {
      mockPoamService.getPoamAssets.mockReturnValue(throwError(() => ({})));

      component.fetchAssets();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Failed to fetch assets: An unexpected error occurred'
        })
      );
    });
  });

  describe('refreshAssets', () => {
    it('should call fetchAssets for C-PAT collection type', () => {
      const fetchSpy = vi.spyOn(component, 'fetchAssets');

      component.collectionType = 'C-PAT';

      component.refreshAssets();

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should emit assetsChanged for STIG Manager collection type', () => {
      const emitSpy = vi.spyOn(component.assetsChanged, 'emit');

      component.collectionType = 'STIG Manager';
      component.poamAssets = [createAsset({ assetId: 1 })];

      component.refreshAssets();

      expect(emitSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ assetId: 1 })]));
    });

    it('should emit assetsChanged for Tenable collection type', () => {
      const emitSpy = vi.spyOn(component.assetsChanged, 'emit');

      component.collectionType = 'Tenable';
      component.poamAssets = [createAsset({ assetId: 2 })];

      component.refreshAssets();

      expect(emitSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ assetId: 2 })]));
    });

    it('should do nothing for unknown collection type', () => {
      const fetchSpy = vi.spyOn(component, 'fetchAssets');
      const emitSpy = vi.spyOn(component.assetsChanged, 'emit');

      component.collectionType = 'Unknown';

      component.refreshAssets();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit a new array reference for STIG Manager (spread)', () => {
      const emitSpy = vi.spyOn(component.assetsChanged, 'emit');

      component.collectionType = 'STIG Manager';
      const original = [createAsset({ assetId: 1 })];

      component.poamAssets = original;

      component.refreshAssets();

      const emittedArray = emitSpy.mock.calls[0][0];

      expect(emittedArray).not.toBe(original);
      expect(emittedArray).toEqual(original);
    });
  });
});
