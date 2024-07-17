/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from '@angular/core';
import { PoamService } from '../../../poam-processing/poams.service';
import { SharedService } from '../../../../common/services/shared.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ImportService } from '../../import.service';

interface Poam {
  poamId: number;
  collectionId: number;
  vulnerabilitySource: string;
  vulnerabilityId: string;
  status: string;
  assets: Array<{ poamId: number, assetId: number }>;
}
@Injectable({
  providedIn: 'root'
})
export class PoamAssetUpdateService {
  constructor(
    private importService: ImportService,
    private poamService: PoamService,
    private sharedService: SharedService,
  ) { }

  async updateOpenPoamAssets(collectionId: string, stigManagerCollectionId: string, user: number) {
      forkJoin([
        await this.poamService.getPoamsByCollection(collectionId),
        await this.sharedService.getAffectedAssetsFromSTIGMAN(stigManagerCollectionId)
      ]).pipe(
        map(([poams, assets]) => {
          const poamAssetsData = (poams as Poam[])
            .filter(poam => poam.status !== 'Closed' && poam.vulnerabilitySource === 'STIG')
            .map(poam => {
              const filteredAssets = (assets as any[]).filter(entry => entry.groupId === poam.vulnerabilityId);
              if (filteredAssets.length > 0) {
                const assetList = filteredAssets[0].assets.map((asset: { name: any; assetId: string; }) => ({
                  assetName: asset.name,
                  assetId: parseInt(asset.assetId, 10),
                }));
                return {
                  poamId: poam.poamId,
                  collectionId: poam.collectionId,
                  assets: assetList,
                  poamLog: [{ userId: user }],
                };
              }
              return null;
            })
            .filter(data => data !== null);
          return poamAssetsData;
        }),
        switchMap(async (poamAssetsData) => {
          return (await this.importService.updatePoamAssetsWithStigManagerData(poamAssetsData)).subscribe();
        }),
        catchError((error) => {
          console.error('Failed to update POAM assets:', error);
          return of(null);
        })
      ).subscribe(
        () => {
        },
        (error) => {
          console.error('Error in POAM Asset update:', error);
        }
      );    
  }
}
