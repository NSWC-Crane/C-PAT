/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { PoamAssetsComponent } from './poam-assets.component';

describe('PoamAssetsComponent', () => {
    let component: PoamAssetsComponent;
    let fixture: ComponentFixture<PoamAssetsComponent>;
    let mockPoamService: any;
    let mockMessageService: jasmine.SpyObj<MessageService>;

    beforeEach(async () => {
        mockPoamService = {
            postPoamAsset: jasmine.createSpy('postPoamAsset').and.returnValue(of({})),
            deletePoamAsset: jasmine.createSpy('deletePoamAsset').and.returnValue(of({})),
            getPoamAssets: jasmine.createSpy('getPoamAssets').and.returnValue(of([]))
        };

        mockMessageService = {
            add: jasmine.createSpy('add'),
            addAll: jasmine.createSpy('addAll'),
            clear: jasmine.createSpy('clear'),
            messageObserver: new Subject().asObservable(),
            clearObserver: new Subject().asObservable()
        } as jasmine.SpyObj<MessageService>;

        await TestBed.configureTestingModule({
            imports: [NoopAnimationsModule, PoamAssetsComponent, FormsModule],
            providers: [{ provide: MessageService, useValue: mockMessageService }]
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
        component.poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
        component.poamAssociatedVulnerabilities = [];
        component.originCollectionId = null;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('addAsset', () => {
        it('should add a new asset to the beginning of the array', async () => {
            const assetsSpy = spyOn(component.assetsChanged, 'emit');
            component.poamAssets = [{ poamId: '12345', assetId: 1 }];

            await component.addAsset();

            expect(component.poamAssets.length).toBe(2);
            expect(component.poamAssets[0].isNew).toBeTruthy();
            expect(component.poamAssets[0].assetId).toBeNull();
            expect(assetsSpy).toHaveBeenCalledWith(component.poamAssets);
        });
    });

    describe('getAssetName', () => {
        it('should return asset name when asset exists', () => {
            const assetName = component.getAssetName(1);
            expect(assetName).toBe('Asset A');
        });

        it('should return fallback text when asset does not exist', () => {
            const assetName = component.getAssetName(999);
            expect(assetName).toBe('Asset ID: 999');
        });
    });

    describe('onAssetChange', () => {
        it('should create asset when valid asset is selected', async () => {
            const asset = { assetId: 1, isNew: true };
            const createSpy = spyOn(component, 'confirmCreateAsset').and.resolveTo();
            const assetsSpy = spyOn(component.assetsChanged, 'emit');

            await component.onAssetChange(asset, 0);

            expect(createSpy).toHaveBeenCalledWith(asset);
            expect(asset.isNew).toBeFalsy();
            expect(assetsSpy).toHaveBeenCalled();
        });

        it('should remove asset when no asset is selected', async () => {
            const asset = { assetId: null, isNew: true };
            component.poamAssets = [asset, { assetId: 2 }];
            const assetsSpy = spyOn(component.assetsChanged, 'emit');

            await component.onAssetChange(asset, 0);

            expect(component.poamAssets.length).toBe(1);
            expect(component.poamAssets[0].assetId).toBe(2);
            expect(assetsSpy).toHaveBeenCalled();
        });
    });

    describe('deleteAsset', () => {
        it('should call confirmDeleteAsset when asset has ID', async () => {
            const asset = { poamId: '12345', assetId: 1 };
            const deleteSpy = spyOn(component, 'confirmDeleteAsset').and.resolveTo();

            await component.deleteAsset(asset, 0);

            expect(deleteSpy).toHaveBeenCalledWith(asset);
        });

        it('should directly remove asset when asset has no ID', async () => {
            const asset = { assetId: null, isNew: true };
            component.poamAssets = [asset, { assetId: 2 }];
            const assetsSpy = spyOn(component.assetsChanged, 'emit');

            await component.deleteAsset(asset, 1);

            expect(component.poamAssets.length).toBe(1);
            expect(component.poamAssets[0].assetId).toBe(null);
            expect(assetsSpy).toHaveBeenCalledWith(component.poamAssets);
        });
    });

    describe('confirmCreateAsset', () => {
        it('should successfully create asset', async () => {
            const asset = { assetId: 1 };
            const fetchSpy = spyOn<any>(component, 'fetchAssets');

            await component.confirmCreateAsset(asset);

            expect(mockPoamService.postPoamAsset).toHaveBeenCalledWith({
                poamId: +component.poam.poamId,
                assetId: 1
            });
            expect(mockMessageService.add).toHaveBeenCalledWith({
                severity: 'success',
                summary: 'Success',
                detail: 'Asset added successfully.'
            });
            expect(fetchSpy).toHaveBeenCalled();
        });

        it('should handle error when creating asset fails', async () => {
            const asset = { assetId: 1 };
            mockPoamService.postPoamAsset.and.returnValue(throwError(() => new Error('Test error')));

            await component.confirmCreateAsset(asset);

            expect(mockMessageService.add).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to add asset: Test error'
            });
        });

        it('should not create asset when assetId is not provided', async () => {
            const asset = { assetId: null };

            await component.confirmCreateAsset(asset);

            expect(mockPoamService.postPoamAsset).not.toHaveBeenCalled();
        });
    });

    describe('confirmDeleteAsset', () => {
        it('should remove asset from array and emit change', async () => {
            const asset = { poamId: '12345', assetId: 1 };
            component.poamAssets = [asset, { poamId: '12345', assetId: 2 }, { poamId: '12345', assetId: 3 }];
            const assetsSpy = spyOn(component.assetsChanged, 'emit');

            await component.confirmDeleteAsset(asset);

            expect(component.poamAssets.length).toBe(2);
            expect(component.poamAssets.find((a) => a.assetId === 1)).toBeUndefined();
            expect(assetsSpy).toHaveBeenCalledWith(component.poamAssets);
            expect(mockPoamService.deletePoamAsset).not.toHaveBeenCalled();
        });
    });

    describe('fetchAssets', () => {
        it('should fetch assets when poamId is valid', () => {
            const mockAssets = [
                { poamId: '12345', assetId: 1 },
                { poamId: '12345', assetId: 2 }
            ];
            mockPoamService.getPoamAssets.and.returnValue(of(mockAssets));
            const assetsSpy = spyOn(component.assetsChanged, 'emit');

            component.fetchAssets();

            expect(mockPoamService.getPoamAssets).toHaveBeenCalledWith('12345');
            expect(component.poamAssets).toEqual(mockAssets);
            expect(assetsSpy).toHaveBeenCalledWith(mockAssets);
        });

        it('should not fetch assets when poamId is ADDPOAM', () => {
            component.poam.poamId = 'ADDPOAM';

            component.fetchAssets();

            expect(mockPoamService.getPoamAssets).not.toHaveBeenCalled();
        });

        it('should not fetch assets when poamId is not set', () => {
            component.poam.poamId = null;

            component.fetchAssets();

            expect(mockPoamService.getPoamAssets).not.toHaveBeenCalled();
        });

        it('should handle error when fetching assets fails', () => {
            mockPoamService.getPoamAssets.and.returnValue(throwError(() => new Error('Test error')));

            component.fetchAssets();

            expect(mockMessageService.add).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch assets: Test error'
            });
        });
    });

    describe('refreshAssets', () => {
        it('should fetch assets for C-PAT collection type', () => {
            component.collectionType = 'C-PAT';
            const fetchSpy = spyOn<any>(component, 'fetchAssets');

            component.refreshAssets();

            expect(fetchSpy).toHaveBeenCalled();
        });

        it('should emit current assets for STIG Manager collection type', () => {
            component.collectionType = 'STIG Manager';
            component.poamAssets = [{ assetId: 1 }, { assetId: 2 }];
            const emitSpy = spyOn(component.assetsChanged, 'emit');

            component.refreshAssets();

            expect(emitSpy).toHaveBeenCalledWith([{ assetId: 1 }, { assetId: 2 }]);
        });

        it('should emit current assets for Tenable collection type', () => {
            component.collectionType = 'Tenable';
            component.poamAssets = [{ assetId: 3 }];
            const emitSpy = spyOn(component.assetsChanged, 'emit');

            component.refreshAssets();

            expect(emitSpy).toHaveBeenCalledWith([{ assetId: 3 }]);
        });
    });

    describe('ngOnChanges', () => {
        it('should refresh assets when teams are removed', () => {
            component.poamAssignedTeams = [
                { assignedTeamId: 1, assignedTeamName: 'Team A' },
                { assignedTeamId: 2, assignedTeamName: 'Team B' }
            ];
            component.ngOnChanges({
                poamAssignedTeams: new SimpleChange(null, component.poamAssignedTeams, true)
            });

            const refreshSpy = spyOn(component, 'refreshAssets');

            component.poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
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

        it('should refresh assets when team count decreases', () => {
            component.poamAssignedTeams = [
                { assignedTeamId: 1, assignedTeamName: 'Team A' },
                { assignedTeamId: 2, assignedTeamName: 'Team B' }
            ];
            component.ngOnChanges({
                poamAssignedTeams: new SimpleChange(null, component.poamAssignedTeams, true)
            });

            const refreshSpy = spyOn(component, 'refreshAssets');

            component.poamAssignedTeams = [{ assignedTeamId: 3, assignedTeamName: 'Team C' }];
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

        it('should not refresh assets when teams are only added', () => {
            component.poamAssignedTeams = [{ assignedTeamId: 1, assignedTeamName: 'Team A' }];
            component.ngOnChanges({
                poamAssignedTeams: new SimpleChange(null, component.poamAssignedTeams, true)
            });

            const refreshSpy = spyOn(component, 'refreshAssets');

            component.poamAssignedTeams = [
                { assignedTeamId: 1, assignedTeamName: 'Team A' },
                { assignedTeamId: 2, assignedTeamName: 'Team B' }
            ];
            component.ngOnChanges({
                poamAssignedTeams: new SimpleChange([{ assignedTeamId: 1, assignedTeamName: 'Team A' }], component.poamAssignedTeams, false)
            });

            expect(refreshSpy).not.toHaveBeenCalled();
        });

        it('should handle changes when poamAssignedTeams is null', () => {
            component.poamAssignedTeams = null as any;

            expect(() => {
                component.ngOnChanges({
                    poamAssignedTeams: new SimpleChange([], null, false)
                });
            }).not.toThrow();
        });

        it('should not process when poamAssignedTeams change is not present', () => {
            const refreshSpy = spyOn(component, 'refreshAssets');

            component.ngOnChanges({
                someOtherProperty: new SimpleChange(null, 'value', false)
            });

            expect(refreshSpy).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty assetList', () => {
            component.assetList = [];
            const assetName = component.getAssetName(1);
            expect(assetName).toBe('Asset ID: 1');
        });

        it('should handle concurrent operations gracefully', async () => {
            const asset1 = { assetId: 1 };
            const asset2 = { assetId: 2 };

            const promise1 = component.confirmCreateAsset(asset1);
            const promise2 = component.confirmCreateAsset(asset2);

            await Promise.all([promise1, promise2]);

            expect(mockPoamService.postPoamAsset).toHaveBeenCalledTimes(2);
        });

        it('should maintain data integrity when operations fail', async () => {
            const initialAssets = [{ assetId: 1 }, { assetId: 2 }];
            component.poamAssets = [...initialAssets];

            mockPoamService.postPoamAsset.and.returnValue(throwError(() => new Error('Network error')));

            const newAsset = { assetId: 3 };
            await component.confirmCreateAsset(newAsset);

            expect(component.poamAssets).toEqual(initialAssets);
        });
    });
});
