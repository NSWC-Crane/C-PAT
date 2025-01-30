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
import { EMPTY, Observable, Subscription, catchError, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { SubSink } from 'subsink';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { CollectionsService } from './collections.service';
import { MessageService } from 'primeng/api';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { AAPackageService } from '../aaPackage-processing/aaPackage-processing.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

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
  collectionId?: number;
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
  standalone: true,
  imports: [
    AutoCompleteModule,
    ButtonModule,
    CommonModule,
    DialogModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    TreeTableModule,
  ],
  providers: [MessageService],
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
    private collectionsService: CollectionsService,
    private setPayloadService: PayloadService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private importService: ImportService,
    private poamService: PoamService
  ) {}

  ngOnInit() {
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.setPayload();
    this.subs.sink = this.setPayloadService.user$.subscribe(user => {
      this.user = user;
    });
    this.subs.sink = this.setPayloadService.payload$.subscribe(payload => {
      this.payload = payload;
    });
    this.subs.sink = this.setPayloadService.accessLevel$.subscribe(level => {
      this.accessLevel = level;
      if (this.accessLevel > 0) {
        this.getCollectionData();
      }
    });
  }

  getCollectionData() {
    this.collections = null;
    this.loadAAPackages();
    this.collectionsService.getAllCollections().subscribe({
      next: (result) => {
        this.collections = this.data = result;
        this.getCollectionsTreeData();
      }
    });
  }

  loadAAPackages() {
    this.aaPackageService.getAAPackages().subscribe({
      next: (response) => {
        this.aaPackages = response || [];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load A&A Packages'
        });
      }
    });
  }

  filterAAPackages(event: { query: string }) {
    const query = event.query.toLowerCase();
    this.filteredAAPackages = this.aaPackages
      .filter(aaPackage => aaPackage.aaPackage.toLowerCase().includes(query))
      .map(aaPackage => aaPackage.aaPackage);
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
        originCollectionId: number;
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
            'Origin Collection ID': collection.originCollectionId ?? 0,
          },
          children: myChildren,
        };
      }
    );
    this.collectionTreeData = treeViewData;
  }

  exportCollection(rowData: any) {
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

    this.collectionsService.getPoamsByCollection(exportCollection.collectionId).pipe(
      switchMap(poams => {
        if (!poams?.length) {
          throw new Error('No POAMs to export for this collection.');
        }
        return this.processPoamsData(poams, exportCollection);
      }),
      switchMap(processedPoams => from(PoamExportService.convertToExcel(
        processedPoams,
        this.user,
        exportCollection
      ))),
      catchError(error => {
        console.error('Export error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Export Failed',
          detail: error.message || 'Failed to process POAMs, please try again later.'
        });
        return EMPTY;
      })
    ).subscribe(excelData => {
      this.downloadExcel(excelData, exportCollection.name);
    });
  }


  private processPoamsData(poams: any[], exportCollection: any): Observable<any[]> {
    if (exportCollection.collectionOrigin === 'STIG Manager') {
      return this.processPoamsWithStigFindings(poams, exportCollection.originCollectionId);
    }

    if (exportCollection.collectionOrigin === 'Tenable') {
      return this.processPoamsWithTenableData(poams);
    }

    return this.processPoamsWithCpatData(poams, exportCollection.collectionId);
  }

  private processPoamsWithTenableData(poams: any[]): Observable<any[]> {
    const vulnerabilityIds = [...new Set(poams.map(poam => poam.vulnerabilityId))];
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

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      map(data => {
        this.tenableAffectedAssets = data.response.results.map((asset: any) => ({
          pluginId: asset.pluginID,
          dnsName: asset.dnsName ?? '',
          netbiosName: asset.netbiosName ?? '',
        }));

        return poams.map(poam => {
          const affectedDevices = this.tenableAffectedAssets
            .filter((asset: any) => asset.pluginId === poam.vulnerabilityId)
            .map((asset: any) => {
              if (asset.netbiosName) {
                const parts = asset.netbiosName.split('\\');
                return parts.length > 1 ? parts[parts.length - 1] : null;
              }
              if (asset.dnsName) {
                const parts = asset.dnsName.split('.');
                return parts.length > 0 ? parts[0].toUpperCase() : null;
              }
              return null;
            })
            .filter(Boolean);

          return {
            ...poam,
            devicesAffected: affectedDevices.join(' '),
          };
        });
      })
    );
  }

  private processPoamsWithCpatData(poams: any[], collectionId: number): Observable<any[]> {
    return this.poamService.getPoamAssetsByCollectionId(collectionId).pipe(
      map(assets => {
        this.cpatAffectedAssets = assets;
        return poams.map(poam => {
          const affectedDevices = this.cpatAffectedAssets
            .filter((asset: any) => asset.poamId === poam.poamId)
            .map((asset: any) => asset.assetName.toUpperCase())
            .filter(Boolean);
          return {
            ...poam,
            devicesAffected: affectedDevices.join(' '),
          };
        });
      })
    );
  }

  private processPoamsWithStigFindings(poams: any[], originCollectionId: number): Observable<any[]> {
    const poamProcessingOperations = poams.map(poam => {
      if (!poam.vulnerabilityId || !poam.stigBenchmarkId) {
        return of(poam);
      }

      if (this.findingsCache.has(poam.stigBenchmarkId)) {
        return this.processPoamWithCachedFindings(poam, this.findingsCache.get(poam.stigBenchmarkId)!);
      }

      return this.sharedService.getSTIGMANAffectedAssetsByPoam(
        originCollectionId,
        poam.stigBenchmarkId
      ).pipe(
        tap(findings => this.findingsCache.set(poam.stigBenchmarkId, findings)),
        map(findings => this.processSinglePoamWithFindings(poam, findings))
      );
    });

    return forkJoin(poamProcessingOperations);
  }
  private processPoamWithCachedFindings(poam: any, findings: any[]): Observable<any> {
    return of(this.processSinglePoamWithFindings(poam, findings));
  }

  private processSinglePoamWithFindings(poam: any, findings: any[]): any {
    const matchingFinding = findings.find(finding => finding.groupId === poam.vulnerabilityId);

    if (!matchingFinding) {
      return poam;
    }

    const affectedDevices = matchingFinding.assets.map(
      (asset: { name: any; assetId: any }) => asset.name
    );
    const controlAPs = matchingFinding.ccis[0]?.apAcronym;
    const cci = matchingFinding.ccis[0]?.cci;

    return {
      ...poam,
      controlAPs,
      cci,
      devicesAffected: affectedDevices.join(' '),
    };
  }
  private downloadExcel(excelData: Blob, collectionName: string): void {
    const excelURL = window.URL.createObjectURL(excelData);
    const exportName = collectionName.replace(' ', '_');
    const link = document.createElement('a');
    link.id = 'download-excel';
    link.href = excelURL;
    link.download = `${exportName}_CPAT_Export.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(excelURL);
  }

  saveCollection() {
    if (!this.editingCollection.collectionName?.trim()) return;

    const collectionToSave = {
      ...this.editingCollection,
      collectionId: parseInt(this.dialogMode === 'add' ? '0' : this.editingCollection.collectionId || '0', 10)
    };

    (this.dialogMode === 'add'
      ? this.collectionsService.addCollection(collectionToSave)
      : this.collectionsService.updateCollection(collectionToSave)
    ).pipe(
      catchError(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${this.dialogMode === 'add' ? 'add' : 'update'} collection: ${error.message}`,
          life: 3000
        });
        return EMPTY;
      })
    ).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: `Collection ${this.dialogMode === 'add' ? 'Added' : 'Updated'}`,
        life: 3000
      });
      this.getCollectionData();
      this.displayCollectionDialog = false;
    });
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

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.table.filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
