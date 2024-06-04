/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Observable, forkJoin } from 'rxjs';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { ExcelDataService } from '../../../Shared/utils/excel-data.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { CollectionsService } from './collections.service';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
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
  selector: 'cpat-collection-processing',
  templateUrl: './collection-processing.component.html',
  styleUrls: ['./collection-processing.component.scss'],
})
export class CollectionProcessingComponent implements OnInit, OnDestroy {
  customColumn = 'collection';
  defaultColumns = [
    'Name',
    'Description',
    'Asset Count',
    'POAM Count',
  ];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;
  public isLoggedIn = false;
  user: any;
  userCollections: any[] = [];
  availableAssets: any[] = [];
  exportCollectionId: any;
  poams: any[] = [];
  collections: any;
  collection: any = {};
  data: any = [];
  showSelect: boolean = true;
  canModifyCollection = false;
  selected: any;
  payload: any;
  private subs = new SubSink();
  get hideCollectionEntry() {
    return this.collection.collectionId &&
      this.collection.collectionId != 'COLLECTION'
      ? { display: 'block' }
      : { display: 'none' };
  }

  constructor(
    private collectionService: CollectionsService,
    private dialogService: NbDialogService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>
  ) { }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
      this.setPayload();
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

  async setPayload() {
    this.user = null;
    this.payload = null;
    this.showSelect = true;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map(
                (permission: Permission) => ({
                  collectionId: permission.collectionId,
                  accessLevel: permission.accessLevel,
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
      permission.accessLevel >= 2
    );

    if (this.user.isAdmin) {
      this.userCollections = allowedCollections;
    } else {
      this.userCollections = allowedCollections.filter((collection: any) =>
        this.user.permissions.some((permission: any) =>
          (permission.accessLevel >= 2) &&
          permission.collectionId === collection.collectionId
        )
      );
    }
  }

  async getCollectionData() {
    this.collections = null;
    (await this.collectionService
          .getCollections(this.payload.userName))
      .subscribe((result: any) => {
        this.data = result;
        this.collections = this.data;
        this.getCollectionsGrid();
        this.checkModifyPermission(this.data);
      });
  }

  getCollectionsGrid() {
    const collectionData = this.data;
    const treeViewData: TreeNode<FSEntry>[] = collectionData.map(
      (collection: {
        collectionId: number | any[];
        collectionName: any;
        description: any;
        assetCount: any;
        poamCount: any;
      }) => {
        const myChildren: never[] = [];

        return {
          data: {
            collection: collection.collectionId,
            Name: collection.collectionName,
            Description: collection.description,
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
    this.showSelect = false;
    this.collection = null;
    this.poams = [];
    const selectedData = this.data.filter(
      (collection: { collectionId: any }) =>
        collection.collectionId === collectionId
    );
    this.collection = selectedData[0];
    this.subs.sink = forkJoin(
      this.collectionService.getPoamsByCollection(this.collection.collectionId)
    ).subscribe(([poams]: any) => {
      this.poams = poams;
    });
  }

  async setExportCollection(collectionId: any) {
    this.exportCollectionId = collectionId;
    (await this.collectionService
          .getPoamsByCollection(collectionId))
      .subscribe((response: any) => {
        this.poams = response;
      });
  }

  async exportAll() {
    if (!this.poams || !Array.isArray(this.poams) || !this.poams.length) {
      this.showPopup('There are no POAMs available to export in the selected collection.');
      return;
    }

    try {
      const excelData = await ExcelDataService.convertToExcel(this.poams);
      const excelURL = window.URL.createObjectURL(excelData);

      const link = document.createElement('a');
      link.id = 'download-excel';
      link.setAttribute('href', excelURL);
      link.setAttribute('download', 'Collection_' + this.exportCollectionId + '_POAMS_Export.xlsx');
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(excelURL);
    } catch (error) {
      console.error('Error exporting POAMs:', error);
      this.showPopup('Failed to export POAMs. Please try again.');
    }
  }

  onCollectionChange(event: any) {
    if (event === 'submit') {
      this.resetData();
    }
  }

  resetData() {
    this.collection = {};
    this.collection.collectionId = 'COLLECTION';
    this.getCollectionData();
    this.showSelect = true;
  }

  addCollection() {
    this.collection.collectionId = 'ADDCOLLECTION';
    this.collection.collectionName = '';
    this.collection.description = '';
    this.collection.created = new Date().toISOString();
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
