/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { AssetDeltaService } from "../../../admin-processing/asset-delta/asset-delta.service";
import { PoamService } from "../../poams.service";
import { CollectionsService } from "../../../admin-processing/collection-processing/collections.service";
import { AssetService } from "../../../asset-processing/assets.service";
import { AAPackageService } from "../../../admin-processing/aaPackage-processing/aaPackage-processing.service";
import { Observable, catchError, forkJoin, map, of } from "rxjs";
import { SharedService } from "../../../../common/services/shared.service";
import { ImportService } from "../../../import-processing/import.service";

export interface AssetData {
  assetName: string;
  dnsName?: string;
  fqdn?: string;
  source: 'CPAT' | 'Tenable' | 'STIG Manager';
}

export interface CollectionInfo {
  collectionAAPackage?: string;
  collectionPredisposingConditions?: string;
  collectionType: string;
  originCollectionId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PoamDataService {
  constructor(
    private assetDeltaService: AssetDeltaService,
    private poamService: PoamService,
    private collectionsService: CollectionsService,
    private assetService: AssetService,
    private aaPackageService: AAPackageService,
    private messageService: MessageService,
    private importService: ImportService,
    private sharedService: SharedService
  ) { }

  loadAssets(collectionType: string, originCollectionId: number, poam: any, collectionId: number): Observable<{
    externalAssets?: AssetData[],
    assetList?: any[],
    poamAssets?: any[]
  }> {
    if (collectionType === 'C-PAT') {
      return this.fetchAssets(collectionId, poam.poamId).pipe(
        map(result => result)
      );
    }
    else if (collectionType === 'STIG Manager' && originCollectionId && poam.vulnerabilityId && poam.stigBenchmarkId) {
      return forkJoin({
        poamAssets: this.sharedService.getPOAMAssetsFromSTIGMAN(
          originCollectionId,
          poam.stigBenchmarkId
        ),
        assetDetails: this.sharedService.getAssetDetailsFromSTIGMAN(originCollectionId)
      }).pipe(
        map(({ poamAssets, assetDetails }) => {
          const matchingItem = poamAssets.find(item => item.groupId === poam.vulnerabilityId);
          if (!matchingItem) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `No assets found with vulnerabilityId: ${poam.vulnerabilityId}`
            });
            return { externalAssets: [] };
          }

          const standardizedAssets: AssetData[] = matchingItem.assets.map((asset: any) => {
            const details = assetDetails.find(detail => detail.assetId === asset.assetId);
            return {
              assetName: asset.name,
              fqdn: details?.fqdn || undefined,
              source: 'STIG Manager' as const
            };
          });

          return { externalAssets: standardizedAssets };
        })
      );
    }
    else if (collectionType === 'Tenable' && originCollectionId && poam.vulnerabilityId) {
      const analysisParams = {
        query: {
          description: '',
          context: '',
          status: -1,
          createdTime: 0,
          modifiedTime: 0,
          groups: [],
          type: 'vuln',
          tool: 'listvuln',
          sourceType: 'cumulative',
          startOffset: 0,
          endOffset: 5000,
          filters: [
            {
              id: 'pluginID',
              filterName: 'pluginID',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: poam.vulnerabilityId,
            },
            {
              id: 'repository',
              filterName: 'repository',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: [{ id: originCollectionId.toString() }],
            },
          ],
          vulnTool: 'listvuln',
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln',
      };

      return this.importService.postTenableAnalysis(analysisParams).pipe(
        map(data => {
          if (!data?.response?.results) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No assets found for this vulnerability'
            });
            return { externalAssets: [] };
          }

          const standardizedAssets: AssetData[] = data.response.results.map((asset: any) => ({
            assetName: asset.netbiosName || '',
            dnsName: asset.dnsName || '',
            source: 'Tenable' as const
          }));

          return { externalAssets: standardizedAssets };
        }),
        catchError(error => {
          console.error('Error loading Tenable assets:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load Tenable assets'
          });
          return of({ externalAssets: [] });
        })
      );
    }

    return of({ externalAssets: [] });
  }

  fetchAssets(collectionId: number, poamId: number): Observable<any> {
    return forkJoin({
      assetList: this.assetService.getAssetsByCollection(collectionId).pipe(
        catchError(error => {
          console.error('Error fetching assets:', error);
          return of([]);
        })
      ),
      poamAssets: this.poamService.getPoamAssets(poamId).pipe(
        catchError(error => {
          console.error('Error fetching POAM assets:', error);
          return of([]);
        })
      )
    });
  }

  getLabelData(collectionId: number): Observable<any[]> {
    return this.poamService.getLabels(collectionId).pipe(
      catchError(error => {
        console.error('Error fetching labels:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load label options'
        });
        return of([]);
      })
    );
  }

  loadAssetDeltaList(): Observable<any> {
    return this.assetDeltaService.getAssetDeltaList().pipe(
      catchError(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load Asset Delta List'
        });
        return of([]);
      })
    );
  }

  loadAAPackages(): Observable<any[]> {
    return this.aaPackageService.getAAPackages().pipe(
      catchError(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load A&A Packages'
        });
        return of([]);
      })
    );
  }

  obtainCollectionData(selectedCollectionId: number, background: boolean = false): Observable<CollectionInfo> {
    return this.collectionsService.getCollectionBasicList().pipe(
      map(basicListData => {
        const currentCollection = basicListData.find(
          collection => +collection.collectionId === selectedCollectionId
        );

        if (!currentCollection) {
          if (!background) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Information',
              detail: 'Unable to find the selected collection. Please ensure that you are creating the POAM in the correct collection.'
            });
          }
          return {
            collectionType: 'C-PAT'
          };
        }

        const collectionInfo: CollectionInfo = {
          collectionAAPackage: currentCollection.aaPackage,
          collectionPredisposingConditions: currentCollection.predisposingConditions,
          collectionType: currentCollection.collectionOrigin
            ? currentCollection.collectionOrigin
            : 'C-PAT',
        };

        if (
          currentCollection.collectionOrigin === 'STIG Manager' ||
          currentCollection.collectionOrigin === 'Tenable'
        ) {
          collectionInfo.originCollectionId = currentCollection.originCollectionId;
        }

        if (!collectionInfo.originCollectionId && !background) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Information',
            detail: 'This collection is not associated with a STIG Manager collection. Asset association may not be available.'
          });
        }

        return collectionInfo;
      }),
      catchError(error => {
        console.error('Error fetching collection data:', error);
        if (!background) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch collection data'
          });
        }
        return of({
          collectionType: 'C-PAT'
        });
      })
    );
  }
}
