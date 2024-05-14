/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { SharedService } from '../../../Shared/shared.service';
import { ImportService } from '../../import-processing/import.service';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';

interface Collection {
  collectionId: any;
  name: string;
}

@Component({
  selector: 'cpat-stigmanager-admin',
  templateUrl: './stigmanager-admin.component.html',
  styleUrls: ['./stigmanager-admin.component.scss']
})
export class STIGManagerAdminComponent implements OnInit {
  stigmanCollections: Collection[] = [];
  selectedStigmanCollection: string = '';

  constructor(
    private importService: ImportService,
    private sharedService: SharedService,
    private dialogService: NbDialogService
  ) { }

  ngOnInit() {
    this.fetchCollections();
  }

  async fetchCollections() {
    (await this.sharedService.getCollectionsFromSTIGMAN()).subscribe({
      next: (data) => {
        this.stigmanCollections = data;
        if (!data || data.length === 0) {
          this.showPopup(
            'No collections available to import. Please ensure you have access to view collections in STIG Manager.'
          );
        }
      },
      error: () => {
        this.showPopup('You are not connected to STIG Manager or the connection is not properly configured.');
      },
    });
  }

  onSTIGManagerCollectionSelect(collectionId: string) {
    this.selectedStigmanCollection = collectionId;
  }

  async importSTIGManagerCollection() {
    if (this.selectedStigmanCollection) {
      forkJoin({
        collectionData: (await this.sharedService.selectedCollectionFromSTIGMAN(this.selectedStigmanCollection)).pipe(
          catchError(error => {
            console.error('Error fetching collection data:', error);
            return of(null);
          })
        ),
        assetsData: (await this.sharedService.getAssetsFromSTIGMAN(this.selectedStigmanCollection)).pipe(
          catchError(error => {
            console.error('Error fetching assets data:', error);
            return of([]);
          })
        )
      }).pipe(
        map(results => {
          const payload = {
            collection: results.collectionData,
            assets: results.assetsData.map((asset: any) => {
              const { assetId, ...rest } = asset;
              return rest;
            })
          };
          return payload;
        })
      ).subscribe({
        next: (payload) => {
          this.sendSTIGManagerCollectionImportRequest(payload);
        },
        error: (error) => {
          console.error('Error processing collection or assets data:', error);
        }
      });
    } else {
      console.error('No collection selected');
    }
  }

  private async sendSTIGManagerCollectionImportRequest(data: any) {
    (await this.importService.postStigManagerCollection(data)).subscribe({
      next: () => {
        this.showPopup('Import successful');
      },
      error: (error) => {
        console.error('Error during import', error);
        this.showPopup('Error during import: ' + error.message);
      }
    });
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false'
    };

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        options: dialogOptions
      }
    });
  }
}
