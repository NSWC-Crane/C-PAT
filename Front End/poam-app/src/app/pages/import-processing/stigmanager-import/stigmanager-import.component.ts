/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../../Shared/shared.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { environment } from '../../../../environments/environment';

interface Collection {
  collectionId: any;
  name: string;
}

interface Asset {
  assetId: any;
  name: string;
}
interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

@Component({
  selector: 'ngx-stigmanager-import',
  templateUrl: './stigmanager-import.component.html',
  styleUrls: ['./stigmanager-import.component.scss']
})
export class STIGManagerImportComponent implements OnInit {
  isLoggedIn = false;
  userProfile: KeycloakProfile | null = null;

  availableAssets: Asset[] = [];
  selectedAssets: string[] = [];
  collections: Collection[] = [];
  selectedCollection: string = '';
  stigmanCollections: Collection[] = [];
  selectedStigmanCollection: string = '';
  private subs = new SubSink()
  constructor(
    private sharedService: SharedService,
    private dialogService: NbDialogService,
    private http: HttpClient,
    private keycloak: KeycloakService
  ) { }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }
    this.fetchCollections();
  }

  fetchCollections() {
    this.keycloak.getToken().then((token) => {
      this.sharedService.getCollectionsFromSTIGMAN(token).subscribe({
        next: (data) => {
          this.stigmanCollections = data;
          if (!data || data.length === 0) {
            this.showPopup(
              'No collections available to import. Please ensure you have access to view collections in STIG Manager.'
            );
          } else {
            this.collections = data;
          }
        },
        error: (error) => {
          this.showPopup(
            'You are not connected to STIG Manager or the connection is not properly configured.'
          );
        },
      });
    });
  }

  fetchAssetsFromAPI() {
    if (!this.selectedCollection || this.selectedCollection === '') {
      return;
    }

    this.keycloak.getToken().then(token => {
      this.sharedService.getAssetsFromSTIGMAN(this.selectedCollection, token).subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.showPopup('No assets found for the selected collection.');
          } else {
            this.availableAssets = data;
          }
        },
        error: (error) => {
          this.showPopup('You are not connected to STIG Manager or the connection is not properly configured.');
        }
      });
    });
  }

  onCollectionSelect(collectionId: string) {
    this.selectedCollection = collectionId;
    this.fetchAssetsFromAPI();
  }

  onSTIGManagerCollectionSelect(collectionId: string) {
    this.selectedStigmanCollection = collectionId;
  }

  importSTIGManagerCollection() {
    if (this.selectedStigmanCollection) {
      this.keycloak.getToken().then((token) => {
        forkJoin({
          collectionData: this.sharedService.selectedCollectionFromSTIGMAN(
            this.selectedStigmanCollection,
            token
          ),
          assetsData: this.sharedService.getAssetsFromSTIGMAN(
            this.selectedStigmanCollection,
            token
          ),
        }).subscribe({
          next: (results) => {
            const payload = {
              collection: results.collectionData,
              assets: results.assetsData,
            };
            this.sendSTIGManagerCollectionImportRequest(payload);
          },
          error: (error) => {
            console.error('Error fetching collection or assets data:', error);
          },
        });
      });
    } else {
      console.error('No collection selected');
    }
  }

  private sendSTIGManagerCollectionImportRequest(data: any) {
    this.keycloak.getToken().then((token) => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http
        .post(environment.stigmanCollectionImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => {
            this.showPopup('Import successful');
          },
          error: (error) => {
            console.error('Error during import', error);
            this.showPopup('Error during import: ' + error.message);
          },
        });
    });
  }

  fetchAssetDetails() {
    this.keycloak.getToken().then(token => {
      const assetDetailsObservables = this.selectedAssets.map(assetId =>
        this.sharedService.selectedAssetsFromSTIGMAN(assetId, token)
      );
      forkJoin(assetDetailsObservables).subscribe(results => {
        this.importAssets(results);
      });
    });
  }

  onImportAssetsButtonClick() {
    if (this.selectedAssets.length > 0) {
      this.fetchAssetDetails();
    } else {
      console.error('No assets selected');
    }
  }


  importAssets(assetDetails: any[]) {
    const payload = {
      assets: assetDetails
    };
    this.sendSTIGManagerAssetImportRequest(payload);
  }

  private sendSTIGManagerAssetImportRequest(data: any) {
    this.keycloak.getToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http.post(environment.stigmanAssetImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => {
            this.showPopup('Import successful');
          },
          error: (error) => {
            console.error('Error during import', error);
            this.showPopup('Error during import: ' + error.message);
          }
        });
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

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;
}
