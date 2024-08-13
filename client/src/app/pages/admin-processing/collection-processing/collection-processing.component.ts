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
import { ExcelDataService } from '../../../common/utils/excel-data.service';
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
  exportCollectionId: any;
  poams: any[] = [];
  collections: any;
  collection: any = { collectionId: '', collectionName: '', description: '', assetCount: 0, poamCount: 0 };
  collectionToExport: string = 'Select Collection to Export...';
  data: any = [];
  payload: any;
  displayCollectionDialog: boolean = false;
  dialogMode: 'add' | 'modify' = 'add';
  editingCollection: any = {};
  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private userService: UsersService,
    private messageService: MessageService
  ) { }


  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    this.user = null;
    this.payload = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe(
      (response: any) => {
        if (response?.userId) {
          this.user = response;
          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
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

  async getCollectionData() {
    this.collections = null;
    (await this.collectionService
      .getCollections(this.payload.userName))
      .subscribe((result: any) => {
        this.data = result;
        this.collections = this.data;
        this.getCollectionsTreeData();
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

  async exportCollection(collectionId: number, name: string) {
    if (!collectionId) {
      console.error('Export collection ID is undefined');
      return;
    }

    try {
      const poams = await (await this.collectionService.getPoamsByCollection(collectionId)).toPromise();

      if (!poams || !Array.isArray(poams) || !poams.length) {
        this.messageService.add({ severity: 'error', summary: 'No Data', detail: 'There are no POAMs to export for this collection.' });
        return;
      }

      const excelData = await ExcelDataService.convertToExcel(poams);
      const excelURL = window.URL.createObjectURL(excelData);
      const exportName = name.replace(' ', '_');

      const link = document.createElement('a');
      link.id = 'download-excel';
      link.setAttribute('href', excelURL);
      link.setAttribute('download', `${exportName}_CPAT_Export.xlsx`);
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(excelURL);
    } catch (error) {
      console.error('Error exporting POAMs:', error);
      this.messageService.add({ severity: 'error', summary: 'Export Failed', detail: 'Failed to export POAMs, please try again later.' });
    }
  }

  showAddCollectionDialog() {
    this.dialogMode = 'add';
    this.editingCollection = {
      collectionId: '',
      collectionName: '',
      description: '',
      assetCount: '0',
      poamCount: '0'
    };
    this.displayCollectionDialog = true;
  }

  showModifyCollectionDialog(rowData: any) {
    this.dialogMode = 'modify';
    this.editingCollection = {
      collectionId: rowData['Collection ID'].toString(),
      collectionName: rowData['Name'],
      description: rowData['Description'],
      assetCount: rowData['Asset Count'].toString(),
      poamCount: rowData['POAM Count'].toString()
    };
    this.displayCollectionDialog = true;
  }

  hideCollectionDialog() {
    this.displayCollectionDialog = false;
  }

  async saveCollection() {
    if (this.editingCollection.collectionName?.trim()) {
      if (this.dialogMode === 'add') {
        delete this.editingCollection.collectionId;
      } else {
        this.editingCollection.collectionId = parseInt(this.editingCollection.collectionId || '', 10).toString();
      }

      const collectionToSave = {
        ...this.editingCollection,
        collectionId: parseInt(this.editingCollection.collectionId || '0', 10),
        assetCount: parseInt(this.editingCollection.assetCount || '0', 10),
        poamCount: parseInt(this.editingCollection.poamCount || '0', 10)
      };

      if (this.dialogMode === 'add') {
        (await this.collectionService.addCollection(collectionToSave)).subscribe(
          (response) => {
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Collection Added', life: 3000 });
            this.getCollectionData();
          },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add collection: ' + error.message, life: 3000 });
          }
        );
      } else {
        (await this.collectionService.updateCollection(collectionToSave)).subscribe(
          (response) => {
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Collection Updated', life: 3000 });
            this.getCollectionData();
          },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update collection: ' + error.message, life: 3000 });
          }
        );
      }
      this.displayCollectionDialog = false;
    }
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    this.table.filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
