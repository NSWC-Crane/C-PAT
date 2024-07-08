/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SubSink } from "subsink";
import { ExcelDataService } from '../../../Shared/utils/excel-data.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { CollectionsService } from './collections.service';
import { MessageService } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';

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

interface CollectionData {
  collectionId?: string;
  collectionName?: string;
  description?: string;
  assetCount?: string;
  poamCount?: string;
}

@Component({
  selector: 'cpat-collection-processing',
  templateUrl: './collection-processing.component.html',
  styleUrls: ['./collection-processing.component.scss'],
})
export class CollectionProcessingComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table!: TreeTable;
  customColumn = 'Collection ID';
  defaultColumns = [
    'Name',
    'Description',
    'Asset Count',
    'POAM Count',
  ];
  allColumns = [this.customColumn, ...this.defaultColumns];
  collectionTreeData: TreeNode<CollectionData>[] = [];
  public isLoggedIn = false;
  user: any;
  userCollections: any[] = [];
  availableAssets: any[] = [];
  exportCollectionId: any;
  poams: any[] = [];
  collections: any;
  collection: any = { collectionId: '', collectionName: '', description: '', assetCount: 0, poamCount: 0 };
  collectionToExport: string = 'Select Collection to Export...';
  data: any = [];
  showCollectionSelect: boolean = true;
  canModifyCollection = false;
  selected: any;
  payload: any;
  displayDialog = false;
  selectedCollection: any;
  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private userService: UsersService,
    private messageService: MessageService
  ) { }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.setPayload();
  }

  showPopup(message: string) {
    this.messageService.add({ severity: 'info', summary: 'Alert', detail: message });
  }

  async setPayload() {
    this.user = null;
    this.payload = null;
    this.showCollectionSelect = true;
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
        this.getCollectionsTreeData();
        this.checkModifyPermission(this.data);
      });
  }

  getCollectionsTreeData() {
    const collectionData = this.data;
    const treeViewData: TreeNode<CollectionData>[] = collectionData.map(
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
            'Collection ID': collection.collectionId,
            Name: collection.collectionName,
            Description: collection.description,
            'Asset Count': collection.assetCount,
            'POAM Count': collection.poamCount,
          },
          children: myChildren,
        };
      }
    );
    this.collectionTreeData = treeViewData;
  }

  setCollection() {
    if (this.selectedCollection) {
      const collectionId = this.selectedCollection.collectionId;
      this.collection = null;
      this.poams = [];
      const selectedData = this.data.filter(
        (collection: { collectionId: any }) =>
          collection.collectionId === collectionId
      );
      if (selectedData.length > 0) {
        this.collection = selectedData[0];
      } else {
        this.collection = {};
      }
      this.subs.sink = forkJoin(
        this.collectionService.getPoamsByCollection(this.collection.collectionId)
      ).subscribe(([poams]: any) => {
        this.poams = poams;
      });
      this.showCollectionSelect = false;
    }
  }

  async setExportCollection(collection: any) {
    this.collectionToExport = collection.collectionName || 'Select Collection to Export...';
    this.exportCollectionId = collection.collectionId || collection;
    if (!this.exportCollectionId) {
      console.error('Export collection ID is undefined');
      return;
    }
    (await this.collectionService
      .getPoamsByCollection(this.exportCollectionId))
      .subscribe((response: any) => {
        this.poams = response;
      });
  }

  async exportAll() {
    if (!this.poams || !Array.isArray(this.poams) || !this.poams.length) {
      this.messageService.add({ severity: 'error', summary: 'No Data', detail: 'There are no POAMs to export.' });
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
      this.messageService.add({ severity: 'error', summary: 'No Data', detail: 'Failed to export POAMs, pelase try again at a later time.' });
    }
  }

  onCollectionChange(event: any) {
    if (event === 'submit') {
      this.resetData();
    }
  }

  resetData() {
    this.collection = { collectionId: 'COLLECTION', collectionName: '', description: '', assetCount: 0, poamCount: 0 };
    this.getCollectionData();
    this.showCollectionSelect = true;
  }

  addCollection() {
    this.collection = {
      collectionId: 'ADDCOLLECTION',
      collectionName: '',
      description: '',
      created: new Date().toISOString(),
      assetCount: 0,
      poamCount: 0,
    };
    this.showCollectionSelect = false;
  }

  closeDialog() {
    this.displayDialog = false;
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
