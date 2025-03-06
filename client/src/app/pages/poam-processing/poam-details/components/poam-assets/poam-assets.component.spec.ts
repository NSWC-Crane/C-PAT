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
import { PoamAssetsComponent } from './poam-assets.component';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import * as jasmine from 'jasmine-core';

describe('PoamAssetsComponent', () => {
  let component: PoamAssetsComponent;
  let fixture: ComponentFixture<PoamAssetsComponent>;
  let mockPoamService: any;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    mockPoamService = {
      postPoamAsset: jasmine.createSpy('postPoamAsset').and.returnValue(of({})),
      deletePoamAsset: jasmine.createSpy('deletePoamAsset').and.returnValue(of({})),
      getPoamAssets: jasmine.createSpy('getPoamAssets').and.returnValue(of([]))
    };

    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PoamAssetsComponent,
        FormsModule
      ],
      providers: [
        { provide: MessageService, useValue: messageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamAssetsComponent);
    component = fixture.componentInstance;

    component.poam = {
      poamId: '12345',
      status: 'Draft'
    };
    component.poamService = mockPoamService;
    component.accessLevel = 2;
    component.collectionType = 'C-PAT';
    component.poamAssets = [];
    component.assetList = [
      { assetId: 1, assetName: 'Asset A' },
      { assetId: 2, assetName: 'Asset B' }
    ];
    component.poamAssignedTeams = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' }
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new asset', () => {
    const assetsSpy = spyOn(component.assetsChanged, 'emit');
    const savePoamSpy = spyOn(component.savePoamRequest, 'emit');

    component.addAsset();

    expect(component.poamAssets.length).toBe(1);
    expect(component.poamAssets[0].isNew).toBeTruthy();
    expect(assetsSpy).toHaveBeenCalled();
    expect(savePoamSpy).not.toHaveBeenCalled();
  });

  it('should request poam save when adding asset to new poam', async () => {
    component.poam.poamId = 'ADDPOAM';
    const savePoamSpy = spyOn(component.savePoamRequest, 'emit');

    await component.addAsset();

    expect(savePoamSpy).toHaveBeenCalledWith(true);
  });

  it('should get asset name correctly', () => {
    const assetName = component.getAssetName(1);
    expect(assetName).toBe('Asset A');

    const nonExistentAsset = component.getAssetName(999);
    expect(nonExistentAsset).toBe('Asset ID: 999');
  });

  it('should handle asset change when valid asset is selected', async () => {
    const asset = { assetId: 1, isNew: true };
    const createSpy = spyOn(component, 'confirmCreateAsset').and.resolveTo();
    const assetsSpy = spyOn(component.assetsChanged, 'emit');

    await component.onAssetChange(asset, 0);

    expect(createSpy).toHaveBeenCalledWith(asset);
    expect(asset.isNew).toBeFalsy();
    expect(assetsSpy).toHaveBeenCalled();
  });

  it('should handle asset change when invalid asset is selected', async () => {
    const asset = { assetId: null, isNew: true };
    component.poamAssets = [asset];
    const assetsSpy = spyOn(component.assetsChanged, 'emit');

    await component.onAssetChange(asset, 0);

    expect(component.poamAssets.length).toBe(0);
    expect(assetsSpy).toHaveBeenCalled();
  });

  it('should delete existing asset', async () => {
    const asset = { poamId: '12345', assetId: 1 };
    component.poamAssets = [asset];

    const deleteSpy = spyOn(component, 'confirmDeleteAsset').and.resolveTo();

    await component.deleteAsset(asset, 0);

    expect(deleteSpy).toHaveBeenCalledWith(asset);
  });

  it('should handle create asset success', async () => {
    const asset = { assetId: 1 };
    const fetchSpy = spyOn<any>(component, 'fetchAssets');

    await component.confirmCreateAsset(asset);

    expect(mockPoamService.postPoamAsset).toHaveBeenCalledWith({
      poamId: +component.poam.poamId,
      assetId: 1
    });
    expect(messageService.add).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should handle create asset failure', async () => {
    const asset = { assetId: 1 };
    mockPoamService.postPoamAsset.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    await component.confirmCreateAsset(asset);

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add asset.'
    });
  });

  it('should handle delete asset for new POAM', async () => {
    component.poam.poamId = 'ADDPOAM';
    component.poamAssets = [
      { assetId: 1 },
      { assetId: 2 }
    ];
    const assetsSpy = spyOn(component.assetsChanged, 'emit');

    await component.confirmDeleteAsset({ assetId: 1 });

    expect(component.poamAssets.length).toBe(1);
    expect(component.poamAssets[0].assetId).toBe(2);
    expect(assetsSpy).toHaveBeenCalled();
    expect(mockPoamService.deletePoamAsset).not.toHaveBeenCalled();
  });

  it('should handle delete asset success for existing POAM', async () => {
    const asset = { poamId: '12345', assetId: 1 };
    component.poamAssets = [asset, { poamId: '12345', assetId: 2 }];
    const assetsSpy = spyOn(component.assetsChanged, 'emit');

    await component.confirmDeleteAsset(asset);

    expect(mockPoamService.deletePoamAsset).toHaveBeenCalledWith('12345', 1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: 'Asset deleted successfully.'
    });
    expect(component.poamAssets.length).toBe(1);
    expect(component.poamAssets[0].assetId).toBe(2);
    expect(assetsSpy).toHaveBeenCalled();
  });

  it('should handle delete asset failure', async () => {
    const asset = { poamId: '12345', assetId: 1 };
    mockPoamService.deletePoamAsset.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    await component.confirmDeleteAsset(asset);

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete asset.'
    });
  });

  it('should detect when teams are removed', () => {
    component.poamAssignedTeams = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' },
      { assignedTeamId: 2, assignedTeamName: 'Team B' }
    ];

    component.ngOnChanges({
      poamAssignedTeams: new SimpleChange(null, component.poamAssignedTeams, true)
    });

    const refreshSpy = spyOn(component, 'refreshAssets');

    component.poamAssignedTeams = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' }
    ];

    component.ngOnChanges({
      poamAssignedTeams: new SimpleChange(
        [
          { assignedTeamId: 1, assignedTeamName: 'Team A' },
          { assignedTeamId: 2, assignedTeamName: 'Team B' }
        ],
        component.poamAssignedTeams,
        false
      )
    });

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should detect when teams are added', () => {
    component.poamAssignedTeams = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' }
    ];

    component.ngOnChanges({
      poamAssignedTeams: new SimpleChange(null, component.poamAssignedTeams, true)
    });

    const refreshSpy = spyOn(component, 'refreshAssets');

    component.poamAssignedTeams = [
      { assignedTeamId: 1, assignedTeamName: 'Team A' },
      { assignedTeamId: 2, assignedTeamName: 'Team B' }
    ];

    component.ngOnChanges({
      poamAssignedTeams: new SimpleChange(
        [{ assignedTeamId: 1, assignedTeamName: 'Team A' }],
        component.poamAssignedTeams,
        false
      )
    });

    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('should refresh assets for C-PAT collection type', () => {
    component.collectionType = 'C-PAT';
    const fetchSpy = spyOn<any>(component, 'fetchAssets');

    component.refreshAssets();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should emit change event for external asset collections', () => {
    component.collectionType = 'STIG Manager';
    component.poamAssets = [{ assetId: 1 }];
    const emitSpy = spyOn(component.assetsChanged, 'emit');

    component.refreshAssets();

    expect(emitSpy).toHaveBeenCalledWith([{ assetId: 1 }]);
  });
});
