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
import { AfterViewInit, Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { SharedService } from '../../Shared/shared.service';
import { AssetService } from './assets.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbInputModule, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service';
import { environment } from '../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';
import { Assets } from './asset.model';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}
interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface AssetTreeNode {
  data: Assets;
  children: AssetTreeNode[];
  expanded: boolean;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;

}

@Component({
  selector: 'ngx-asset-processing',
  templateUrl: './asset-processing.component.html',
  styleUrls: ['./asset-processing.component.scss']
})
export class AssetProcessingComponent implements OnInit, AfterViewInit {
  @ViewChild('assetScrollListener', { read: ElementRef }) select!: ElementRef;
  offset = 0;
  limit = 50;
  isListFull = false;

  customColumn = 'asset';
  defaultColumns = ['Asset Name', 'Description', 'Collection', 'IP Address', 'Domain', 'MAC Address'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;
  sortColumn: string | undefined;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  users: any;
  user: any;

  availableAssets: any[] = [];
  selectedAssets: string[] = [];
  collections: any[] = []; // Array to hold collections
  selectedCollection: string = ''; // Selected collection ID
  assets: any;
  asset: any = {};
  data: any = [];
  collectionList: any;

  allowSelectAssets = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.asset.assetId && this.asset.assetId != "ASSET")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private dialogService: NbDialogService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
  }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.fetchCollections();
    this.getAssetData();
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  ngAfterViewInit() {
    this.select.nativeElement.addEventListener('click', () => {
      setTimeout(() => {
        const dropdownPanel = this.getSelectPanel();
        if (dropdownPanel) {
          dropdownPanel.addEventListener('scroll', (event) => this.onScroll(event));
        }
      }, 0);
    });
  }

  getSelectPanel(): HTMLElement | null {
    const dropdownPanel = document.querySelector('.option-list');
    return dropdownPanel as HTMLElement;
  }

  fetchCollections() {
    this.keycloak.getToken().then(token => {
      this.sharedService.getCollectionsFromSTIGMAN(token).subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.showPopup('No collections available to import. Please ensure you have access to view collections in STIG Manager.');
          } else {
            this.collections = data;
          }
        },
        error: (error) => {
          this.showPopup('You are not connected to STIG Manager or the connection is not properly configured.');
        }
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
    this.sendImportRequest(payload);
  }

  private sendImportRequest(data: any) {
    this.keycloak.getToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http.post(environment.stigmanAssetImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => {
            this.showPopup('Import successful');
          },
          error: (error) => {
            console.error('Error during import', error);
            // Optionally, handle errors with a popup as well
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

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove,
                canView: permission.canView
              }))
            };

            this.getAssetData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }

  getAssetData(loadMore = false) {
    
    // If the end of the list is reached, do not load more data
    if (this.isListFull) {
      return;
    }
    this.isLoading = true;

    // If loading more assets, we don't reset the assets array
    if (!loadMore) {
      this.assets = [];
      this.isListFull = false;
    }

    if (this.payload == undefined) return;

    this.subs.sink = this.assetService.getAssetsByCollection(this.user.lastCollectionAccessedId, this.offset, this.limit)
    .subscribe((assetData: any) => {
      console.log(assetData);
      if (!Array.isArray(assetData)) {
        console.error('Unexpected response format:', assetData);
        this.isLoading = false;
        return;
      }
      this.assets = loadMore ? [...this.assets, ...assetData] : assetData;
  
      this.data = this.assets.map((asset: any) => ({
        assetId: asset.assetId,
        assetName: asset.assetName,
        description: asset.description,
        collectionId: asset.collectionId,
        ipAddress: asset.ipAddress,
        macAddress: asset.macAddress,
      }));
  
      if (assetData.length < this.limit) {
        this.isListFull = true;
      }
      this.updateDataSource();
      this.offset += this.limit;
      this.isLoading = false;
    }, error => {
      console.error('Failed to fetch assets by collection', error);
      this.isLoading = false;
    });
  }

  updateDataSource() {
    let treeNodes: AssetTreeNode[] = this.assets.map((asset: Assets) => {
      return {
        data: {
          'asset': asset.assetId,
          'Asset Name': asset.assetName,
          'Description': asset.description,
          'Collection': asset.collectionId,
          'IP Address': asset.ipAddress,
          'Domain': asset.fullyQualifiedDomainName,
          'MAC Address': asset.macAddress,
        },
        children: [],
        expanded: true
      };
      console.log(this.data, this.asset.data, this.data.asset);
    });

    this.dataSource = this.dataSourceBuilder.create(treeNodes);
  }

  onScroll(event: any) {
    if (this.isListFull) {
      return;
    }
    const threshold = 100;
    const currentPosition = event.target.scrollTop + event.target.clientHeight;
    const maximumScrollPosition = event.target.scrollHeight;

    if (currentPosition + threshold >= maximumScrollPosition) {
      this.getAssetData(true);
    }
  }



  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  setAsset(assetId: any) {
    this.asset = null;

    let selectedData = this.data.filter((asset: { assetId: any; }) => asset.assetId === assetId)

    this.asset = selectedData[0];
    //console.log("asset: ", this.asset);
    //console.log("assets: ", this.assets);
    this.allowSelectAssets = false;
  }

  addAsset() {
    this.asset.assetId = "ADDASSET";
    this.asset.assetName = "";
    this.asset.description = ""
    this.asset.fullyQualifiedDomainName = "";
    this.asset.collectionId = 0;
    this.asset.ipAddress = "";
    this.asset.macAddress = "";
    this.allowSelectAssets = false;
  }

  resetData() {
    this.asset = [];
    this.getAssetData();
    this.asset.assetId = "ASSET";
    this.allowSelectAssets = true;
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
