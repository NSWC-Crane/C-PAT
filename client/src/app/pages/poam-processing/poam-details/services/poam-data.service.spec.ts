/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PoamDataService } from './poam-data.service';
import { SharedService } from '../../../../common/services/shared.service';
import { AAPackageService } from '../../../admin-processing/aaPackage-processing/aaPackage-processing.service';
import { AssetDeltaService } from '../../../admin-processing/asset-delta/asset-delta.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssetService } from '../../../asset-processing/assets.service';
import { ImportService } from '../../../import-processing/import.service';
import { PoamService } from '../../poams.service';

describe('PoamDataService', () => {
  let service: PoamDataService;
  let mockAssetDeltaService: any;
  let mockPoamService: any;
  let mockCollectionsService: any;
  let mockAssetService: any;
  let mockAAPackageService: any;
  let mockMessageService: any;
  let mockImportService: any;
  let mockSharedService: any;

  beforeEach(() => {
    mockAssetDeltaService = {
      getAssetDeltaListByCollection: vi.fn()
    };

    mockPoamService = {
      getPoamAssets: vi.fn(),
      getLabels: vi.fn()
    };

    mockCollectionsService = {
      getCollectionBasicList: vi.fn()
    };

    mockAssetService = {
      getAssetsByCollection: vi.fn()
    };

    mockAAPackageService = {
      getAAPackages: vi.fn()
    };

    mockMessageService = {
      add: vi.fn()
    };

    mockImportService = {
      postTenableAnalysis: vi.fn()
    };

    mockSharedService = {
      getPOAMAssetsFromSTIGMAN: vi.fn(),
      getAssetDetailsFromSTIGMAN: vi.fn(),
      getSTIGsFromSTIGMAN: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PoamDataService,
        { provide: AssetDeltaService, useValue: mockAssetDeltaService },
        { provide: PoamService, useValue: mockPoamService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: AssetService, useValue: mockAssetService },
        { provide: AAPackageService, useValue: mockAAPackageService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ImportService, useValue: mockImportService },
        { provide: SharedService, useValue: mockSharedService }
      ]
    });

    service = TestBed.inject(PoamDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAssets', () => {
    describe('when poam or collectionId is missing', () => {
      it('should return empty arrays when poam is null', async () => {
        const result = await firstValueFrom(service.loadAssets('C-PAT', 1, null, 100));

        expect(result).toEqual({ externalAssets: [], assetList: [], poamAssets: [] });
      });

      it('should return empty arrays when collectionId is 0', async () => {
        const poam = { poamId: 1 };
        const result = await firstValueFrom(service.loadAssets('C-PAT', 1, poam, 0));

        expect(result).toEqual({ externalAssets: [], assetList: [], poamAssets: [] });
      });
    });

    describe('C-PAT collection type', () => {
      it('should fetch assets using fetchAssets method', async () => {
        const mockAssetList = [{ assetId: 1, assetName: 'Asset 1' }];
        const mockPoamAssets = [{ poamAssetId: 1 }];
        const poam = { poamId: 123 };

        mockAssetService.getAssetsByCollection.mockReturnValue(of(mockAssetList));
        mockPoamService.getPoamAssets.mockReturnValue(of(mockPoamAssets));

        const result = await firstValueFrom(service.loadAssets('C-PAT', 0, poam, 100));

        expect(result.assetList).toEqual(mockAssetList);
        expect(result.poamAssets).toEqual(mockPoamAssets);
        expect(mockAssetService.getAssetsByCollection).toHaveBeenCalledWith(100);
        expect(mockPoamService.getPoamAssets).toHaveBeenCalledWith(123);
      });
    });

    describe('STIG Manager collection type', () => {
      it('should load assets from STIG Manager when originCollectionId and vulnerabilityId exist', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-12345' };
        const mockPoamAssets = [{ groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] }];
        const mockAssetDetails = [{ assetId: 101, fqdn: 'asset1.example.com' }];

        mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
        mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of(mockAssetDetails));

        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result.externalAssets).toBeDefined();
        expect(result.externalAssets!.length).toBe(1);
        expect(result.externalAssets![0].assetId).toBe(101);
        expect(result.externalAssets![0].assetName).toBe('Asset 1');
        expect(result.externalAssets![0].fqdn).toBe('asset1.example.com');
        expect(result.externalAssets![0].source).toBe('STIG Manager');
      });

      it('should include associated vulnerabilities when loading STIG Manager assets', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: [{ associatedVulnerability: 'V-67890' }] };
        const mockPoamAssets = [
          { groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] },
          { groupId: 'V-67890', assets: [{ assetId: 102, name: 'Asset 2' }] }
        ];
        const mockAssetDetails = [
          { assetId: 101, fqdn: 'asset1.example.com' },
          { assetId: 102, fqdn: 'asset2.example.com' }
        ];

        mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
        mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of(mockAssetDetails));

        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result.externalAssets!.length).toBe(2);
      });

      it('should merge duplicate assets and combine sourceVulnIds', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: ['V-67890'] };
        const mockPoamAssets = [
          { groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] },
          { groupId: 'V-67890', assets: [{ assetId: 101, name: 'Asset 1' }] }
        ];
        const mockAssetDetails = [{ assetId: 101, fqdn: 'asset1.example.com' }];

        mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
        mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of(mockAssetDetails));

        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result.externalAssets!.length).toBe(1);
        expect(result.externalAssets![0].sourceVulnIds).toContain('V-12345');
        expect(result.externalAssets![0].sourceVulnIds).toContain('V-67890');
      });

      it('should show warning when no assets match vulnerabilityId', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-99999' };
        const mockPoamAssets = [{ groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] }];

        mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
        mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));

        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result.externalAssets).toEqual([]);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warning', summary: 'Warning' }));
      });

      it('should handle STIG Manager API errors', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-12345' };

        mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(throwError(() => new Error('API Error')));
        mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));

        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result.externalAssets).toEqual([]);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
      });

      it('should return empty externalAssets when originCollectionId is missing', async () => {
        const poam = { poamId: 1, vulnerabilityId: 'V-12345' };
        const result = await firstValueFrom(service.loadAssets('STIG Manager', 0, poam, 100));

        expect(result).toEqual({ externalAssets: [] });
      });

      it('should return empty externalAssets when vulnerabilityId is missing', async () => {
        const poam = { poamId: 1 };
        const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

        expect(result).toEqual({ externalAssets: [] });
      });
    });

    describe('Tenable collection type', () => {
      it('should load assets from Tenable when originCollectionId and vulnerabilityId exist', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345' };
        const mockTenableResponse = {
          response: {
            results: [{ netbiosName: 'WORKSTATION1', dnsName: 'workstation1.example.com', hostUUID: 'uuid-1', macAddress: 'AA:BB:CC:DD:EE:FF', pluginID: '12345', name: 'Test Plugin', family: { name: 'Windows' }, severity: { name: 'High' } }]
          }
        };

        mockImportService.postTenableAnalysis.mockReturnValue(of(mockTenableResponse));

        const result = await firstValueFrom(service.loadAssets('Tenable', 50, poam, 100));

        expect(result.externalAssets).toBeDefined();
        expect(result.externalAssets!.length).toBe(1);
        expect(result.externalAssets![0].assetName).toBe('WORKSTATION1');
        expect(result.externalAssets![0].dnsName).toBe('workstation1.example.com');
        expect(result.externalAssets![0].source).toBe('Tenable');
      });

      it('should include associated vulnerabilities in Tenable query', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345', associatedVulnerabilities: ['67890', '11111'] };
        const mockTenableResponse = {
          response: {
            results: [
              { netbiosName: 'WS1', dnsName: 'ws1.test.com', hostUUID: 'uuid-1', pluginID: '12345' },
              { netbiosName: 'WS2', dnsName: 'ws2.test.com', hostUUID: 'uuid-2', pluginID: '67890' }
            ]
          }
        };

        mockImportService.postTenableAnalysis.mockReturnValue(of(mockTenableResponse));

        const result = await firstValueFrom(service.loadAssets('Tenable', 50, poam, 100));

        expect(result.externalAssets!.length).toBe(2);
        const analysisCall = mockImportService.postTenableAnalysis.mock.calls[0][0];
        const pluginFilter = analysisCall.query.filters.find((f: any) => f.id === 'pluginID');

        expect(pluginFilter.value).toBe('12345,67890,11111');
      });

      it('should merge duplicate Tenable assets and combine sourcePluginIDs', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345' };
        const mockTenableResponse = {
          response: {
            results: [
              { netbiosName: 'WS1', dnsName: 'ws1.test.com', hostUUID: 'uuid-1', macAddress: 'AA:BB', pluginID: '12345' },
              { netbiosName: 'WS1', dnsName: 'ws1.test.com', hostUUID: 'uuid-1', macAddress: 'AA:BB', pluginID: '67890' }
            ]
          }
        };

        mockImportService.postTenableAnalysis.mockReturnValue(of(mockTenableResponse));

        const result = await firstValueFrom(service.loadAssets('Tenable', 50, poam, 100));

        expect(result.externalAssets!.length).toBe(1);
        expect(result.externalAssets![0].sourcePluginIDs).toContain('12345');
        expect(result.externalAssets![0].sourcePluginIDs).toContain('67890');
      });

      it('should show error when Tenable returns no results', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345' };

        mockImportService.postTenableAnalysis.mockReturnValue(of({ response: {} }));

        const result = await firstValueFrom(service.loadAssets('Tenable', 50, poam, 100));

        expect(result.externalAssets).toEqual([]);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'No assets found for these vulnerabilities' }));
      });

      it('should handle Tenable API errors', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345' };

        mockImportService.postTenableAnalysis.mockReturnValue(throwError(() => new Error('Tenable API Error')));

        const result = await firstValueFrom(service.loadAssets('Tenable', 50, poam, 100));

        expect(result.externalAssets).toEqual([]);
        expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
      });

      it('should return empty externalAssets when Tenable originCollectionId is missing', async () => {
        const poam = { poamId: 1, vulnerabilityId: '12345' };
        const result = await firstValueFrom(service.loadAssets('Tenable', 0, poam, 100));

        expect(result).toEqual({ externalAssets: [] });
      });
    });

    describe('Unknown collection type', () => {
      it('should return empty externalAssets for unknown collection types', async () => {
        const poam = { poamId: 1 };
        const result = await firstValueFrom(service.loadAssets('Unknown', 50, poam, 100));

        expect(result).toEqual({ externalAssets: [] });
      });
    });
  });

  describe('fetchAssets', () => {
    it('should call assetService and poamService and return combined result', async () => {
      const mockAssetList = [{ assetId: 1 }, { assetId: 2 }];
      const mockPoamAssets = [{ poamAssetId: 1 }];

      mockAssetService.getAssetsByCollection.mockReturnValue(of(mockAssetList));
      mockPoamService.getPoamAssets.mockReturnValue(of(mockPoamAssets));

      const result = await firstValueFrom(service.fetchAssets(100, 200));

      expect(result.assetList).toEqual(mockAssetList);
      expect(result.poamAssets).toEqual(mockPoamAssets);
      expect(mockAssetService.getAssetsByCollection).toHaveBeenCalledWith(100);
      expect(mockPoamService.getPoamAssets).toHaveBeenCalledWith(200);
    });

    it('should return empty array when assetService fails', async () => {
      mockAssetService.getAssetsByCollection.mockReturnValue(throwError(() => new Error('Asset error')));
      mockPoamService.getPoamAssets.mockReturnValue(of([{ poamAssetId: 1 }]));

      const result = await firstValueFrom(service.fetchAssets(100, 200));

      expect(result.assetList).toEqual([]);
      expect(result.poamAssets).toEqual([{ poamAssetId: 1 }]);
    });

    it('should return empty array when poamService fails', async () => {
      mockAssetService.getAssetsByCollection.mockReturnValue(of([{ assetId: 1 }]));
      mockPoamService.getPoamAssets.mockReturnValue(throwError(() => new Error('POAM error')));

      const result = await firstValueFrom(service.fetchAssets(100, 200));

      expect(result.assetList).toEqual([{ assetId: 1 }]);
      expect(result.poamAssets).toEqual([]);
    });
  });

  describe('getLabelData', () => {
    it('should return labels from poamService', async () => {
      const mockLabels = [
        { labelId: 1, labelName: 'Label 1' },
        { labelId: 2, labelName: 'Label 2' }
      ];

      mockPoamService.getLabels.mockReturnValue(of(mockLabels));

      const result = await firstValueFrom(service.getLabelData(100));

      expect(result).toEqual(mockLabels);
      expect(mockPoamService.getLabels).toHaveBeenCalledWith(100);
    });

    it('should handle errors and show message', async () => {
      mockPoamService.getLabels.mockReturnValue(throwError(() => new Error('Labels error')));

      const result = await firstValueFrom(service.getLabelData(100));

      expect(result).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error' }));
    });
  });

  describe('loadAssetDeltaList', () => {
    it('should return asset delta list from service', async () => {
      const mockDeltaList = [{ assetId: 1, delta: 'added' }];

      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(of(mockDeltaList));

      const result = await firstValueFrom(service.loadAssetDeltaList(100));

      expect(result).toEqual(mockDeltaList);
      expect(mockAssetDeltaService.getAssetDeltaListByCollection).toHaveBeenCalledWith(100);
    });

    it('should handle errors and show message', async () => {
      mockAssetDeltaService.getAssetDeltaListByCollection.mockReturnValue(throwError(() => new Error('Delta error')));

      const result = await firstValueFrom(service.loadAssetDeltaList(100));

      expect(result).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to load Asset Delta List') }));
    });
  });

  describe('loadAAPackages', () => {
    it('should return AA packages from service', async () => {
      const mockPackages = [
        { aaPackageId: 1, aaPackage: 'Package 1' },
        { aaPackageId: 2, aaPackage: 'Package 2' }
      ];

      mockAAPackageService.getAAPackages.mockReturnValue(of(mockPackages));

      const result = await firstValueFrom(service.loadAAPackages());

      expect(result).toEqual(mockPackages);
      expect(mockAAPackageService.getAAPackages).toHaveBeenCalled();
    });

    it('should handle errors and show message', async () => {
      mockAAPackageService.getAAPackages.mockReturnValue(throwError(() => new Error('AA Package error')));

      const result = await firstValueFrom(service.loadAAPackages());

      expect(result).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to load A&A Packages') }));
    });
  });

  describe('loadSTIGsFromSTIGMAN', () => {
    it('should return formatted STIGs from STIG Manager', async () => {
      const mockSTIGs = [{ title: 'Windows Server 2019 STIG', benchmarkId: 'Windows_Server_2019_STIG', lastRevisionStr: 'V2R5', lastRevisionDate: '2024-01-15' }];

      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(of(mockSTIGs));

      const result = await firstValueFrom(service.loadSTIGsFromSTIGMAN());

      expect(result.length).toBe(1);
      expect(result[0].benchmarkId).toBe('Windows_Server_2019_STIG');
      expect(result[0].title).toContain('Windows Server 2019 STIG');
      expect(result[0].title).toContain('Version 2, Release: 5');
      expect(result[0].title).toContain('Benchmark Date: 2024-01-15');
    });

    it('should handle STIGs with non-standard revision format', async () => {
      const mockSTIGs = [{ title: 'Custom STIG', benchmarkId: 'Custom_STIG', lastRevisionStr: 'Custom Format', lastRevisionDate: '2024-01-15' }];

      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(of(mockSTIGs));

      const result = await firstValueFrom(service.loadSTIGsFromSTIGMAN());

      expect(result[0].title).toContain('Custom Format');
    });

    it('should handle errors and show message', async () => {
      mockSharedService.getSTIGsFromSTIGMAN.mockReturnValue(throwError(() => new Error('STIG error')));

      const result = await firstValueFrom(service.loadSTIGsFromSTIGMAN());

      expect(result).toEqual([]);
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to load STIG data') }));
    });
  });

  describe('obtainCollectionData', () => {
    it('should return collection info for C-PAT collection', async () => {
      const mockCollections = [{ collectionId: 100, aaPackage: 'AA Package 1', predisposingConditions: 'Conditions', collectionOrigin: null }];

      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      const result = await firstValueFrom(service.obtainCollectionData(100));

      expect(result.collectionType).toBe('C-PAT');
      expect(result.collectionAAPackage).toBe('AA Package 1');
      expect(result.collectionPredisposingConditions).toBe('Conditions');
    });

    it('should return collection info for STIG Manager collection', async () => {
      const mockCollections = [{ collectionId: 100, aaPackage: 'AA Package 1', predisposingConditions: 'Conditions', collectionOrigin: 'STIG Manager', originCollectionId: 50 }];

      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      const result = await firstValueFrom(service.obtainCollectionData(100));

      expect(result.collectionType).toBe('STIG Manager');
      expect(result.originCollectionId).toBe(50);
    });

    it('should return collection info for Tenable collection', async () => {
      const mockCollections = [{ collectionId: 100, collectionOrigin: 'Tenable', originCollectionId: 75 }];

      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      const result = await firstValueFrom(service.obtainCollectionData(100));

      expect(result.collectionType).toBe('Tenable');
      expect(result.originCollectionId).toBe(75);
    });

    it('should show warning when collection not found (non-background)', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      const result = await firstValueFrom(service.obtainCollectionData(999, false));

      expect(result.collectionType).toBe('C-PAT');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', summary: 'Information' }));
    });

    it('should not show warning when collection not found (background mode)', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(of([]));

      const result = await firstValueFrom(service.obtainCollectionData(999, true));

      expect(result.collectionType).toBe('C-PAT');
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should show warning when STIG Manager collection has no originCollectionId', async () => {
      const mockCollections = [{ collectionId: 100, collectionOrigin: 'STIG Manager', originCollectionId: null }];

      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      await firstValueFrom(service.obtainCollectionData(100, false));

      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn', detail: expect.stringContaining('not associated with a STIG Manager collection') }));
    });

    it('should handle API errors and show message (non-background)', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await firstValueFrom(service.obtainCollectionData(100, false));

      expect(result.collectionType).toBe('C-PAT');
      expect(mockMessageService.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Error', detail: expect.stringContaining('Failed to fetch collection data') }));
    });

    it('should handle API errors silently in background mode', async () => {
      mockCollectionsService.getCollectionBasicList.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await firstValueFrom(service.obtainCollectionData(100, true));

      expect(result.collectionType).toBe('C-PAT');
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });

    it('should handle collectionId as string in comparison', async () => {
      const mockCollections = [{ collectionId: '100', collectionOrigin: 'C-PAT' }];

      mockCollectionsService.getCollectionBasicList.mockReturnValue(of(mockCollections));

      const result = await firstValueFrom(service.obtainCollectionData(100));

      expect(result.collectionType).toBe('C-PAT');
    });
  });

  describe('getAllVulnerabilityIds (private method via loadAssets)', () => {
    it('should handle associatedVulnerabilities as array of strings', async () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: ['V-67890', 'V-11111'] };
      const mockPoamAssets = [
        { groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] },
        { groupId: 'V-67890', assets: [{ assetId: 102, name: 'Asset 2' }] },
        { groupId: 'V-11111', assets: [{ assetId: 103, name: 'Asset 3' }] }
      ];

      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));

      const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

      expect(result.externalAssets!.length).toBe(3);
    });

    it('should handle associatedVulnerabilities as array of objects', async () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: [{ associatedVulnerability: 'V-67890' }, { associatedVulnerability: 'V-11111' }] };
      const mockPoamAssets = [
        { groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] },
        { groupId: 'V-67890', assets: [{ assetId: 102, name: 'Asset 2' }] },
        { groupId: 'V-11111', assets: [{ assetId: 103, name: 'Asset 3' }] }
      ];

      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));

      const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

      expect(result.externalAssets!.length).toBe(3);
    });

    it('should filter out empty string associatedVulnerabilities', async () => {
      const poam = { poamId: 1, vulnerabilityId: 'V-12345', associatedVulnerabilities: ['V-67890', '', { associatedVulnerability: '' }] };
      const mockPoamAssets = [
        { groupId: 'V-12345', assets: [{ assetId: 101, name: 'Asset 1' }] },
        { groupId: 'V-67890', assets: [{ assetId: 102, name: 'Asset 2' }] }
      ];

      mockSharedService.getPOAMAssetsFromSTIGMAN.mockReturnValue(of(mockPoamAssets));
      mockSharedService.getAssetDetailsFromSTIGMAN.mockReturnValue(of([]));

      const result = await firstValueFrom(service.loadAssets('STIG Manager', 50, poam, 100));

      expect(result.externalAssets!.length).toBe(2);
    });
  });
});
