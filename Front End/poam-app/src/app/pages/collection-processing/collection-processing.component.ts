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
import { CollectionsService } from './collections.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service'
import { ExcelDataService } from '../../Shared/utils/excel-data.service'

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

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;
}

@Component({
  selector: 'ngx-collection-processing',
  templateUrl: './collection-processing.component.html',
  styleUrls: ['./collection-processing.component.scss'],
})
export class CollectionProcessingComponent implements OnInit {
  customColumn = 'collection';
  defaultColumns = [
    'Name',
    'Description',
    'Grant Count',
    'Asset Count',
    'POAM Count',
  ];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  users: any;
  user: any;
  userCollections: any[] = [];

  availableAssets: any[] = [];
  exportCollectionId: any;
  poams: any[] = [];

  collections: any;
  collection: any = {};
  data: any = [];
  canModifyCollection = false;
  isLoading = true;

  selected: any;
  payload: any;

  get hideCollectionEntry() {
    return this.collection.collectionId &&
      this.collection.collectionId != 'COLLECTION'
      ? { display: 'block' }
      : { display: 'none' };
  }

  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>
  ) { }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'primary' },
      cancelbutton: 'false',
    };

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        options: dialogOptions,
      },
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
              collections: this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId,
                  canOwn: permission.canOwn,
                  canMaintain: permission.canMaintain,
                  canApprove: permission.canApprove,
                  canView: permission.canView
                })
              ),
            };
            this.getCollectionData();
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

  checkModifyPermission(allowedCollections: any) {
    this.canModifyCollection = this.user.isAdmin || this.user.permissions.some((permission: any) =>
      permission.canOwn === 1 || permission.canApprove === 1
    );

    if (this.user.isAdmin) {
      this.userCollections = allowedCollections;
    } else {
      this.userCollections = allowedCollections.filter((collection: any) =>
        this.user.permissions.some((permission: any) =>
          (permission.canOwn === 1 || permission.canApprove === 1) &&
          permission.collectionId === collection.collectionId
        )
      );
    }
  }

  getCollectionData() {
    this.isLoading = true;
    this.collections = null;
    this.collectionService
      .getCollections(this.payload.userName)
      .subscribe((result: any) => {
        this.data = result.collections;
        this.collections = this.data;
        this.getCollectionsGrid('');
        this.isLoading = false;
        this.checkModifyPermission(this.data);
      });
  }

  getCollectionsGrid(filter: string) {
    let collectionData = this.data;
    var treeViewData: TreeNode<FSEntry>[] = collectionData.map(
      (collection: {
        collectionId: number | any[];
        collectionName: any;
        description: any;
        grantCount: any;
        assetCount: any;
        poamCount: any;
      }) => {
        let myChildren: never[] = [];

        return {
          data: {
            collection: collection.collectionId,
            Name: collection.collectionName,
            Description: collection.description,
            'Grant Count': collection.grantCount,
            'Asset Count': collection.assetCount,
            'POAM Count': collection.poamCount,
          },
          children: myChildren,
        };
      }
    );
    this.dataSource = this.dataSourceBuilder.create(treeViewData);
  }

  setCollection(collectionId: any) {
    this.collection = null;
    this.poams = [];
    let selectedData = this.data.filter(
      (collection: { collectionId: any }) =>
        collection.collectionId === collectionId
    );
    this.collection = selectedData[0];
    this.subs.sink = forkJoin(
      this.collectionService.getUsersForCollection(this.collection.collectionId),
      this.collectionService.getPoamsByCollection(this.collection.collectionId)
    ).subscribe(([users, poams]: any) => {
      this.poams = poams.poams;
    });
  }

  setExportCollection(collectionId: any) {
    this.exportCollectionId = collectionId;
    this.collectionService
      .getPoamsByCollection(collectionId)
      .subscribe((response: any) => {
        this.poams = response.poams;
      });
  }

  exportAll() {
    if (!this.poams || !Array.isArray(this.poams) || !this.poams.length) {
      this.showPopup('There are no POAMs available to export in the selected collection.');
      return;
    }
    console.log('collection this.poams: ', this.poams);

    let excelData = ExcelDataService.ConvertToExcel(this.poams);
    let excelURL = window.URL.createObjectURL(excelData);

    let link = document.createElement('a');
    link.id = 'download-excel';
    link.setAttribute('href', excelURL);
    link.setAttribute('download', ('Collection_' + this.exportCollectionId + '_POAMS_Export.xlsx'));
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  }

  resetData() {
    this.collection = [];
    this.getCollectionData();
    this.collection.collectionId = 'COLLECTION';
  }

  addCollection() {
    this.collection.collectionId = 'ADDCOLLECTION';
    this.collection.collectionName = '';
    this.collection.description = '';
    this.collection.created = new Date().toISOString();
    this.collection.grantCount = 0;
    this.collection.assetCount = 0;
    this.collection.poamCount = 0;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
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
