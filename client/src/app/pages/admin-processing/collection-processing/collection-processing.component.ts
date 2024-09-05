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
import { Subscription } from 'rxjs';
import { SubSink } from "subsink";
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CollectionsService } from './collections.service';
import { MessageService } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../../poam-processing/poams.service';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface CollectionData {
  collectionId?: string;
  collectionName?: string;
  description?: string;
}

interface StigFinding {
  groupId: string;
  assets: { name: string; assetId: string }[];
}

function processPoamsWithStigFindings(poams: any[], stigFindings: StigFinding[]): any[] {
  return poams.map(poam => {
    if (poam.vulnerabilityId) {
      const matchingFinding = stigFindings.find(finding => finding.groupId === poam.vulnerabilityId);

      if (matchingFinding) {
        const affectedDevices = matchingFinding.assets.map(asset => asset.name);
        return {
          ...poam,
          devicesAffected: affectedDevices.join(' ')
        };
      }
    }
    return poam;
  });
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
    'Collection Origin',
    'Origin Collection ID'
  ];
  allColumns = [this.customColumn, ...this.defaultColumns];
  collectionTreeData: TreeNode<CollectionData>[] = [];
  public isLoggedIn = false;
  exportCollectionId: any;
  poams: any[] = [];
  collections: any;
  collection: any = { collectionId: '', collectionName: '', description: '' };
  collectionToExport: string = 'Select Collection to Export...';
  data: any = [];
  displayCollectionDialog: boolean = false;
  dialogMode: 'add' | 'modify' = 'add';
  editingCollection: any = {};
  protected accessLevel: any;
  user: any;
  payload: any;
  cpatAffectedAssets: any;
  stigmanAffectedAssets: any;
  tenableAffectedAssets: any;
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private setPayloadService: PayloadService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private importService: ImportService,
    private poamService: PoamService
  ) { }


  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.getCollectionData();
        }
      })
    );
  }

  async getCollectionData() {
    this.collections = null;
    (await this.collectionService
      .getAllCollections())
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
        collectionOrigin: any;
        originCollectionId: any;
      }) => {
        const myChildren: never[] = [];

        return {
          data: {
            'Collection ID': collection.collectionId,
            Name: collection.collectionName,
            Description: collection.description,
            'Collection Origin': collection.collectionOrigin || '',
            'Origin Collection ID': collection.originCollectionId || ''
          },
          children: myChildren,
        };
      }
    );
    this.collectionTreeData = treeViewData;
  }

  async exportCollection(rowData: any) {
    const collectionId = rowData['Collection ID'];
    const name = rowData['Name'];
    const collectionOrigin = rowData['Collection Origin'];
    const originCollectionId = rowData['Origin Collection ID'];

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

      let processedPoams = poams;

      if (collectionOrigin === "STIG Manager") {
        this.stigmanAffectedAssets = await (await this.sharedService.getAffectedAssetsFromSTIGMAN(originCollectionId)).toPromise();
        processedPoams = processPoamsWithStigFindings(poams, this.stigmanAffectedAssets);
      } else if (collectionOrigin === "Tenable") {
        const vulnerabilityIds = [...new Set(poams.map(poam => poam.vulnerabilityId))];
        const analysisParams = {
          query: {
            description: "",
            context: "",
            status: -1,
            createdTime: 0,
            modifiedTime: 0,
            groups: [],
            type: "vuln",
            tool: "listvuln",
            sourceType: "cumulative",
            startOffset: 0,
            endOffset: 10000,
            filters: [
              {
                id: "pluginID",
                filterName: "pluginID",
                operator: "=",
                type: "vuln",
                isPredefined: true,
                value: vulnerabilityIds.join(',')
              }
            ],
            vulnTool: "listvuln"
          },
          sourceType: "cumulative",
          columns: [],
          type: "vuln"
        };
        
        const data = await (await this.importService.postTenableAnalysis(analysisParams)).toPromise();
        this.tenableAffectedAssets = data.response.results.map((asset: any) => ({
          pluginId: asset.pluginID,
          dnsName: asset.dnsName ?? '',
          netbiosName: asset.netbiosName ?? ''
        }));

        processedPoams = poams.map(poam => {
          const affectedDevices = this.tenableAffectedAssets
            .filter((asset: any) => asset.pluginId === poam.vulnerabilityId)
            .map((asset: any) => {
              if (asset.netbiosName) {
                const parts = asset.netbiosName.split('\\');
                if (parts.length > 1) {
                  return parts[parts.length - 1];
                }
              }
              if (asset.dnsName) {
                const parts = asset.dnsName.split('.');
                if (parts.length > 0) {
                  return parts[0].toUpperCase();
                }
              }
              return null;
            })
            .filter(Boolean);          
          return {
            ...poam,
            devicesAffected: affectedDevices.join(' ')
          };
        });
      } else {
        this.cpatAffectedAssets = await (await this.poamService.getPoamAssetsByCollectionId(collectionId)).toPromise();

        processedPoams = poams.map(poam => {
          const affectedDevices = this.cpatAffectedAssets
            .filter((asset: any) => asset.poamId === poam.poamId)          
            .map((asset: any) => asset.assetName.toUpperCase())
            .filter(Boolean);
          return {
            ...poam,
            devicesAffected: affectedDevices.join(' ')
          };
        });
      }
      const excelData = await PoamExportService.convertToExcel(processedPoams, this.user);
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
      description: ''
    };
    this.displayCollectionDialog = true;
  }

  showModifyCollectionDialog(rowData: any) {
    this.dialogMode = 'modify';
    this.editingCollection = {
      collectionId: rowData['Collection ID'].toString(),
      collectionName: rowData['Name'],
      description: rowData['Description']
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
        collectionId: parseInt(this.editingCollection.collectionId || '0', 10)
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
