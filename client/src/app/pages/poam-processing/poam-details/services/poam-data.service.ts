/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { SharedService } from '../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { AAPackageService } from '../../../admin-processing/aaPackage-processing/aaPackage-processing.service';
import { AssetDeltaService } from '../../../admin-processing/asset-delta/asset-delta.service';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { AssetService } from '../../../asset-processing/assets.service';
import { ImportService } from '../../../import-processing/import.service';
import { PoamService } from '../../poams.service';

export interface AssetData {
  assetId?: any;
  assetName: string;
  dnsName?: string;
  fqdn?: string;
  source: 'CPAT' | 'Tenable' | 'STIG Manager';
  sourceVulnIds?: any;
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
  private assetDeltaService = inject(AssetDeltaService);
  private poamService = inject(PoamService);
  private collectionsService = inject(CollectionsService);
  private assetService = inject(AssetService);
  private aaPackageService = inject(AAPackageService);
  private messageService = inject(MessageService);
  private importService = inject(ImportService);
  private sharedService = inject(SharedService);

  loadAssets(collectionType: string, originCollectionId: number, poam: any, collectionId: number): Observable<{ externalAssets?: AssetData[]; assetList?: any[]; poamAssets?: any[] }> {
    if (!poam || !collectionId) {
      return of({ externalAssets: [], assetList: [], poamAssets: [] });
    }

    if (collectionType === 'C-PAT') {
      return this.fetchAssets(collectionId, poam.poamId).pipe(map((result) => result));
    } else if (collectionType === 'STIG Manager' && originCollectionId && poam.vulnerabilityId) {
      const allVulnIds = this.getAllVulnerabilityIds(poam);

      return forkJoin({
        poamAssets: this.sharedService.getPOAMAssetsFromSTIGMAN(originCollectionId),
        assetDetails: this.sharedService.getAssetDetailsFromSTIGMAN(originCollectionId)
      }).pipe(
        map(({ poamAssets, assetDetails }) => {
          let allAssets: AssetData[] = [];

          allVulnIds.forEach((vulnId) => {
            const matchingItem = poamAssets.find((item) => item.groupId === vulnId);

            if (matchingItem?.assets) {
              const assetsForVuln = matchingItem.assets.map((asset: any) => {
                const details = assetDetails.find((detail) => detail.assetId === asset.assetId);

                return {
                  assetId: asset.assetId,
                  assetName: asset.name,
                  fqdn: details?.fqdn || undefined,
                  source: 'STIG Manager' as const,
                  sourceVulnIds: [vulnId]
                };
              });

              allAssets = [...allAssets, ...assetsForVuln];
            }
          });

          if (allAssets.length === 0 && poamAssets?.length > 0) {
            this.messageService.add({
              severity: 'warning',
              summary: 'Warning',
              detail: `No assets found with vulnerabilityId: ${poam.vulnerabilityId}`
            });

            return { externalAssets: [] };
          }

          const assetMap = new Map<number, AssetData>();

          allAssets.forEach((asset) => {
            if (assetMap.has(asset.assetId)) {
              const existing = assetMap.get(asset.assetId)!;
              existing.sourceVulnIds = [...new Set([...existing.sourceVulnIds!, ...asset.sourceVulnIds!])];
            } else {
              assetMap.set(asset.assetId, asset);
            }
          });

          return { externalAssets: Array.from(assetMap.values()) };
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load STIG Manager assets: ${getErrorMessage(error)}`
          });

          return of({ externalAssets: [] });
        })
      );
    } else if (collectionType === 'Tenable' && originCollectionId && poam.vulnerabilityId) {
      const allPluginIds = this.getAllVulnerabilityIds(poam);

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
              value: allPluginIds.join(',')
            },
            {
              id: 'repository',
              filterName: 'repository',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: [{ id: originCollectionId.toString() }]
            }
          ],
          vulnTool: 'listvuln'
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      };

      return this.importService.postTenableAnalysis(analysisParams).pipe(
        map((data) => {
          if (!data?.response?.results) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No assets found for these vulnerabilities'
            });

            return { externalAssets: [] };
          }

          const allAssets = data.response.results.map((asset: any) => {
            const sourcePluginID = asset.pluginID || '';

            return {
              assetName: asset.netbiosName || '',
              dnsName: asset.dnsName || '',
              hostUUID: asset.hostUUID,
              macAddress: asset.macAddress,
              source: 'Tenable' as const,
              sourcePluginIDs: [sourcePluginID],

              ...asset,
              pluginName: asset.name || '',
              family: asset.family?.name || '',
              severity: asset.severity?.name || ''
            };
          });

          const assetMap = new Map();

          allAssets.forEach((asset) => {
            const key = `${asset.hostUUID || ''}-${asset.netbiosName || ''}-${asset.dnsName || ''}-${asset.macAddress || ''}`;

            if (!assetMap.has(key)) {
              assetMap.set(key, asset);
            } else {
              const existing = assetMap.get(key);

              existing.sourcePluginIDs = [...new Set([...existing.sourcePluginIDs, ...asset.sourcePluginIDs])];

              if (asset.sourcePluginIDs.includes(poam.vulnerabilityId)) {
                const sourceIds = [...existing.sourcePluginIDs];

                Object.assign(existing, asset);
                existing.sourcePluginIDs = sourceIds;
              }
            }
          });

          return { externalAssets: Array.from(assetMap.values()) };
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load Tenable assets: ${getErrorMessage(error)}`
          });

          return of({ externalAssets: [] });
        })
      );
    }

    return of({ externalAssets: [] });
  }

  private getAllVulnerabilityIds(poam: any): string[] {
    if (!poam) return [];

    const primaryId = poam.vulnerabilityId;

    if (!primaryId) return [];

    const associatedIds = Array.isArray(poam.associatedVulnerabilities)
      ? poam.associatedVulnerabilities.map((vuln) => (typeof vuln === 'string' ? vuln : typeof vuln === 'object' && vuln.associatedVulnerability ? vuln.associatedVulnerability : null)).filter((id) => id !== null && id !== undefined && id !== '')
      : [];

    return [primaryId, ...associatedIds];
  }

  fetchAssets(collectionId: number, poamId: number): Observable<any> {
    return forkJoin({
      assetList: this.assetService.getAssetsByCollection(collectionId).pipe(
        catchError((error) => {
          console.error('Error fetching assets:', error);

          return of([]);
        })
      ),
      poamAssets: this.poamService.getPoamAssets(poamId).pipe(
        catchError((error) => {
          console.error('Error fetching POAM assets:', error);

          return of([]);
        })
      )
    });
  }

  getLabelData(collectionId: number): Observable<any[]> {
    return this.poamService.getLabels(collectionId).pipe(
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load label options: ${getErrorMessage(error)}`
        });

        return of([]);
      })
    );
  }

  loadAssetDeltaList(collectionId: number): Observable<any> {
    return this.assetDeltaService.getAssetDeltaListByCollection(collectionId).pipe(
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load Asset Delta List: ${getErrorMessage(error)}`
        });

        return of([]);
      })
    );
  }

  loadAAPackages(): Observable<any[]> {
    return this.aaPackageService.getAAPackages().pipe(
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load A&A Packages: ${getErrorMessage(error)}`
        });

        return of([]);
      })
    );
  }

  loadSTIGsFromSTIGMAN(): Observable<any[]> {
    return this.sharedService.getSTIGsFromSTIGMAN().pipe(
      map((data) =>
        data.map((stig: any) => {
          const [version, release] = stig.lastRevisionStr?.match(/\d+/g) || [];
          const formattedRevision = version && release ? `Version ${version}, Release: ${release}` : stig.lastRevisionStr;

          const formattedTitle = `${stig.title} :: ${formattedRevision} Benchmark Date: ${stig.lastRevisionDate}`;

          return {
            title: formattedTitle,
            benchmarkId: stig.benchmarkId,
            lastRevisionStr: stig.lastRevisionStr,
            lastRevisionDate: stig.lastRevisionDate
          };
        })
      ),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load STIG data: ${getErrorMessage(error)}`
        });

        return of([]);
      })
    );
  }

  obtainCollectionData(selectedCollectionId: number, background: boolean = false): Observable<CollectionInfo> {
    return this.collectionsService.getCollectionBasicList().pipe(
      map((basicListData) => {
        const currentCollection = basicListData.find((collection) => +collection.collectionId === selectedCollectionId);

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
          collectionType: currentCollection.collectionOrigin ? currentCollection.collectionOrigin : 'C-PAT'
        };

        if (currentCollection.collectionOrigin === 'STIG Manager' || currentCollection.collectionOrigin === 'Tenable') {
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
      catchError((error) => {
        if (!background) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch collection data: ${getErrorMessage(error)}`
          });
        }

        return of({
          collectionType: 'C-PAT'
        });
      })
    );
  }
}
