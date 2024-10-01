/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CollectionsService } from './collections.service';
import { MessageService } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { AAPackageService } from '../aaPackage-processing/aaPackage-processing.service';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}
interface AAPackage {
  aaPackageId: number;
  aaPackage: string;
}
interface CollectionData {
  collectionId?: string;
  collectionName?: string;
  description?: string;
  systemType?: string;
  systemName?: string;
  ccsafa?: string;
  aaPackage?: string;
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
    'System Type',
    'System Name',
    'CC/S/A/FA',
    'A&A Package',
    'Collection Origin',
    'Origin Collection ID',
  ];
  allColumns = [this.customColumn, ...this.defaultColumns];
  aaPackages: AAPackage[] = [];
  filteredAAPackages: string[] = [];
  collectionTreeData: TreeNode<CollectionData>[] = [];
  public isLoggedIn = false;
  exportCollectionId: any;
  poams: any[] = [];
  collections: any;
  collection: any = {
    collectionId: '',
    collectionName: '',
    description: '',
    systemType: '',
    systemName: '',
    ccsafa: '',
    aaPackage: '',
  };
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
  private findingsCache: Map<string, any[]> = new Map();
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();

  constructor(
    private aaPackageService: AAPackageService,
    private collectionService: CollectionsService,
    private setPayloadService: PayloadService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private importService: ImportService,
    private poamService: PoamService,
  ) {}

  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.getCollectionData();
        }
      }),
    );
  }

  async getCollectionData() {
    this.collections = null;
    this.loadAAPackages();
    (await this.collectionService.getAllCollections()).subscribe(
      (result: any) => {
        this.data = result;
        this.collections = this.data;
        this.getCollectionsTreeData();
      },
    );
  }

  async loadAAPackages() {
    try {
      const response = await (
        await this.aaPackageService.getAAPackages()
      ).toPromise();
      this.aaPackages = response || [];
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load A&A Packages',
      });
    }
  }

  filterAAPackages(event: { query: string }) {
    const query = event.query.toLowerCase();
    this.filteredAAPackages = this.aaPackages
      .filter((aaPackage) => aaPackage.aaPackage.toLowerCase().includes(query))
      .map((aaPackage) => aaPackage.aaPackage);
  }

  getCollectionsTreeData() {
    const collectionData = this.data;
    const treeViewData: TreeNode<CollectionData>[] = collectionData.map(
      (collection: {
        collectionId: number | any[];
        collectionName: any;
        description: any;
        systemType: any;
        systemName: any;
        ccsafa: any;
        aaPackage: any;
        collectionOrigin: any;
        originCollectionId: any;
      }) => {
        const myChildren: never[] = [];

        return {
          data: {
            'Collection ID': collection.collectionId,
            Name: collection.collectionName,
            Description: collection.description,
            'System Type': collection.systemType || '',
            'System Name': collection.systemName || '',
            'CC/S/A/FA': collection.ccsafa || '',
            'A&A Package': collection.aaPackage || '',
            'Collection Origin': collection.collectionOrigin || '',
            'Origin Collection ID': collection.originCollectionId || '',
          },
          children: myChildren,
        };
      },
    );
    this.collectionTreeData = treeViewData;
  }

  async exportCollection(rowData: any) {
    const exportCollection = {
      collectionId: rowData['Collection ID'],
      name: rowData['Name'],
      collectionOrigin: rowData['Collection Origin'],
      originCollectionId: rowData['Origin Collection ID'],
      systemType: rowData['System Type'],
      systemName: rowData['System Name'],
      ccsafa: rowData['CC/S/A/FA'],
      aaPackage: rowData['A&A Package'],
    };

    if (!exportCollection.collectionId) {
      console.error('Export collection ID is undefined');
      return;
    }

    try {
      const poams = await (
        await this.collectionService.getPoamsByCollection(
          exportCollection.collectionId,
        )
      ).toPromise();
      if (!poams || !Array.isArray(poams) || !poams.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'No Data',
          detail: 'There are no POAMs to export for this collection.',
        });
        return;
      }

      let processedPoams = poams;

      if (exportCollection.collectionOrigin === 'STIG Manager') {
        processedPoams = await this.processPoamsWithStigFindings(
          poams,
          exportCollection.originCollectionId,
        );
      } else if (exportCollection.collectionOrigin === 'Tenable') {
        const vulnerabilityIds = [
          ...new Set(poams.map((poam) => poam.vulnerabilityId)),
        ];
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
            endOffset: 10000,
            filters: [
              {
                id: 'pluginID',
                filterName: 'pluginID',
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: vulnerabilityIds.join(','),
              },
            ],
            vulnTool: 'listvuln',
          },
          sourceType: 'cumulative',
          columns: [],
          type: 'vuln',
        };

        const data = await (
          await this.importService.postTenableAnalysis(analysisParams)
        ).toPromise();
        this.tenableAffectedAssets = data.response.results.map(
          (asset: any) => ({
            pluginId: asset.pluginID,
            dnsName: asset.dnsName ?? '',
            netbiosName: asset.netbiosName ?? '',
          }),
        );

        processedPoams = poams.map((poam) => {
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
            devicesAffected: affectedDevices.join(' '),
          };
        });
      } else {
        this.cpatAffectedAssets = await (
          await this.poamService.getPoamAssetsByCollectionId(
            exportCollection.collectionId,
          )
        ).toPromise();

        processedPoams = poams.map((poam) => {
          const affectedDevices = this.cpatAffectedAssets
            .filter((asset: any) => asset.poamId === poam.poamId)
            .map((asset: any) => asset.assetName.toUpperCase())
            .filter(Boolean);
          return {
            ...poam,
            devicesAffected: affectedDevices.join(' '),
          };
        });
      }
      const excelData = await PoamExportService.convertToExcel(
        processedPoams,
        this.user,
        exportCollection,
      );
      const excelURL = window.URL.createObjectURL(excelData);
      const exportName = exportCollection.name.replace(' ', '_');

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
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Failed to export POAMs, please try again later.',
      });
    }
  }

  async processPoamsWithStigFindings(
    poams: any[],
    originCollectionId: string,
  ): Promise<any[]> {
    const processedPoams = [];

    for (const poam of poams) {
      if (poam.vulnerabilityId && poam.stigBenchmarkId) {
        try {
          let findings: any[];
          if (this.findingsCache.has(poam.stigBenchmarkId)) {
            findings = this.findingsCache.get(poam.stigBenchmarkId)!;
          } else {
            findings = await (
              await this.sharedService.getSTIGMANAffectedAssetsByPoam(
                originCollectionId,
                poam.stigBenchmarkId,
              )
            ).toPromise();
            this.findingsCache.set(poam.stigBenchmarkId, findings);
          }

          const matchingFinding = findings.find(
            (finding) => finding.groupId === poam.vulnerabilityId,
          );

          if (matchingFinding) {
            const affectedDevices = matchingFinding.assets.map(
              (asset: { name: any; assetId: any }) => asset.name,
            );
            const controlAPs = matchingFinding.ccis[0]?.apAcronym;
            const cci = matchingFinding.ccis[0]?.cci;

            processedPoams.push({
              ...poam,
              controlAPs,
              cci,
              devicesAffected: affectedDevices.join(' '),
            });
          } else {
            processedPoams.push(poam);
          }
        } catch (error) {
          console.error(`Error fetching data for POAM ${poam.poamId}:`, error);
          processedPoams.push(poam);
        }
      } else {
        processedPoams.push(poam);
      }
    }

    return processedPoams;
  }

  clearCache() {
    this.findingsCache.clear();
  }

  showAddCollectionDialog() {
    this.dialogMode = 'add';
    this.editingCollection = {
      collectionId: '',
      collectionName: '',
      description: '',
      systemType: '',
      systemName: '',
      ccsafa: '',
      aaPackage: '',
    };
    this.displayCollectionDialog = true;
  }

  showModifyCollectionDialog(rowData: any) {
    this.dialogMode = 'modify';
    this.editingCollection = {
      collectionId: rowData['Collection ID'].toString(),
      collectionName: rowData['Name'],
      description: rowData['Description'],
      systemType: rowData['System Type'],
      systemName: rowData['System Name'],
      ccsafa: rowData['CC/S/A/FA'],
      aaPackage: rowData['A&A Package'],
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
        this.editingCollection.collectionId = parseInt(
          this.editingCollection.collectionId || '',
          10,
        ).toString();
      }

      const collectionToSave = {
        ...this.editingCollection,
        collectionId: parseInt(this.editingCollection.collectionId || '0', 10),
      };

      if (this.dialogMode === 'add') {
        (
          await this.collectionService.addCollection(collectionToSave)
        ).subscribe(
          (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successful',
              detail: 'Collection Added',
              life: 3000,
            });
            this.getCollectionData();
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to add collection: ' + error.message,
              life: 3000,
            });
          },
        );
      } else {
        (
          await this.collectionService.updateCollection(collectionToSave)
        ).subscribe(
          (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successful',
              detail: 'Collection Updated',
              life: 3000,
            });
            this.getCollectionData();
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update collection: ' + error.message,
              life: 3000,
            });
          },
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
    this.payloadSubscription.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
