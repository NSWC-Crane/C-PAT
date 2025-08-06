/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { EMPTY, Observable, Subscription, catchError, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { SubSink } from 'subsink';
import { AAPackage } from '../../../common/models/aaPackage.model';
import { Collections } from '../../../common/models/collections.model';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { PoamExportService } from '../../../common/utils/poam-export.service';
import { ImportService } from '../../import-processing/import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { AAPackageService } from '../aaPackage-processing/aaPackage-processing.service';
import { CollectionsService } from './collections.service';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

@Component({
  selector: 'cpat-collection-processing',
  templateUrl: './collection-processing.component.html',
  styleUrls: ['./collection-processing.component.scss'],
  standalone: true,
  imports: [AutoCompleteModule, ButtonModule, DialogModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule, TextareaModule, ToastModule, TreeTableModule]
})
export class CollectionProcessingComponent implements OnInit, OnDestroy {
  private aaPackageService = inject(AAPackageService);
  private collectionsService = inject(CollectionsService);
  private setPayloadService = inject(PayloadService);
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);
  private importService = inject(ImportService);
  private poamService = inject(PoamService);

  readonly table = viewChild.required<TreeTable>('dt');
  cols: any = [];
  aaPackages: AAPackage[] = [];
  filteredAAPackages: string[] = [];
  collectionTreeData: TreeNode<Collections>[] = [];
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
    manualCreationAllowed: true
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
  displayDeleteDialog: boolean = false;
  collectionToDelete: any = null;
  private findingsCache: Map<string, any[]> = new Map();
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();

  async ngOnInit() {
    this.initColumnsAndFilters();
    this.setPayload();
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'Collection ID', header: 'Collection ID' },
      { field: 'Name', header: 'Name' },
      { field: 'Description', header: 'Description' },
      { field: 'System Type', header: 'System Type' },
      { field: 'System Name', header: 'System Name' },
      { field: 'CC/S/A/FA', header: 'CC/S/A/FA' },
      { field: 'A&A Package', header: 'A&A Package' },
      { field: 'Collection Origin', header: 'Collection Origin' },
      { field: 'Origin Collection ID', header: 'Origin Collection ID' }
    ];
  }

  setPayload() {
    this.setPayloadService.setPayload();
    this.subs.sink = this.setPayloadService.user$.subscribe((user) => {
      this.user = user;
    });
    this.subs.sink = this.setPayloadService.payload$.subscribe((payload) => {
      this.payload = payload;
    });
    this.subs.sink = this.setPayloadService.accessLevel$.subscribe((level) => {
      this.accessLevel = level;
    });
    this.getCollectionData();
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
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load A&A Packages: ${getErrorMessage(error)}`
        });
      }
    });
  }

  filterAAPackages(event: { query: string }) {
    const query = event.query.toLowerCase();

    this.filteredAAPackages = this.aaPackages.filter((aaPackage) => aaPackage.aaPackage.toLowerCase().includes(query)).map((aaPackage) => aaPackage.aaPackage);
  }

  getCollectionsTreeData() {
    const collectionData = this.data;
    const treeViewData: TreeNode<Collections>[] = collectionData.map(
      (collection: {
        collectionId: number;
        collectionName: any;
        description: any;
        systemType: any;
        systemName: any;
        ccsafa: any;
        aaPackage: any;
        predisposingConditions: any;
        collectionOrigin: any;
        originCollectionId: number;
        manualCreationAllowed: boolean;
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
            'Predisposing Conditions': collection.predisposingConditions || '',
            'Collection Origin': collection.collectionOrigin || '',
            'Origin Collection ID': collection.originCollectionId ?? 0,
            'Manual Creation Allowed': collection.manualCreationAllowed ?? true
          },
          children: myChildren
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
      predisposingConditions: rowData['Predisposing Conditions']
    };

    if (!exportCollection.collectionId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Unable to determine export collection, please try again.`
      });

      return;
    }

    this.collectionsService
      .getPoamsByCollection(exportCollection.collectionId)
      .pipe(
        switchMap((poams) => {
          if (!poams?.length) {
            throw new Error('No POAMs to export for this collection.');
          }

          return this.processPoamsData(poams, exportCollection);
        }),
        switchMap((processedPoams) => from(PoamExportService.convertToExcel(processedPoams, this.user, exportCollection))),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: `Failed to process POAMs: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
      .subscribe((excelData) => {
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
    const vulnerabilityIds = [...new Set(poams.map((poam) => poam.vulnerabilityId))];
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
            value: vulnerabilityIds.join(',')
          }
        ],
        vulnTool: 'listvuln'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      map((data) => {
        this.tenableAffectedAssets = data.response.results.map((asset: any) => ({
          pluginId: asset.pluginID,
          dnsName: asset.dnsName ?? '',
          netbiosName: asset.netbiosName ?? ''
        }));

        return poams.map((poam) => {
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
            devicesAffected: affectedDevices.join(' ')
          };
        });
      })
    );
  }

  private processPoamsWithCpatData(poams: any[], collectionId: number): Observable<any[]> {
    return this.poamService.getPoamAssetsByCollectionId(collectionId).pipe(
      map((assets) => {
        this.cpatAffectedAssets = assets;

        return poams.map((poam) => {
          const affectedDevices = this.cpatAffectedAssets
            .filter((asset: any) => asset.poamId === poam.poamId)
            .map((asset: any) => asset.assetName.toUpperCase())
            .filter(Boolean);

          return {
            ...poam,
            devicesAffected: affectedDevices.join(' ')
          };
        });
      })
    );
  }

  private processPoamsWithStigFindings(poams: any[], originCollectionId: number): Observable<any[]> {
    const poamProcessingOperations = poams.map((poam) => {
      if (!poam.vulnerabilityId || !poam.stigBenchmarkId) {
        return of(poam);
      }

      if (this.findingsCache.has(poam.stigBenchmarkId)) {
        return this.processPoamWithCachedFindings(poam, this.findingsCache.get(poam.stigBenchmarkId)!);
      }

      return this.sharedService.getSTIGMANAffectedAssetsByPoam(originCollectionId, poam.stigBenchmarkId).pipe(
        tap((findings) => this.findingsCache.set(poam.stigBenchmarkId, findings)),
        map((findings) => this.processSinglePoamWithFindings(poam, findings))
      );
    });

    return forkJoin(poamProcessingOperations);
  }
  private processPoamWithCachedFindings(poam: any, findings: any[]): Observable<any> {
    return of(this.processSinglePoamWithFindings(poam, findings));
  }

  private processSinglePoamWithFindings(poam: any, findings: any[]): any {
    const matchingFinding = findings.find((finding) => finding.groupId === poam.vulnerabilityId);

    if (!matchingFinding) {
      return poam;
    }

    const affectedDevices = matchingFinding.assets.map((asset: { name: any; assetId: any }) => asset.name);
    const controlAPs = matchingFinding.ccis[0]?.apAcronym;
    const cci = matchingFinding.ccis[0]?.cci;

    return {
      ...poam,
      controlAPs,
      cci,
      devicesAffected: affectedDevices.join(' ')
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

    (this.dialogMode === 'add' ? this.collectionsService.addCollection(collectionToSave) : this.collectionsService.updateCollection(collectionToSave))
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to ${this.dialogMode === 'add' ? 'add' : 'update'} collection: ${getErrorMessage(error)}`,
            life: 3000
          });

          return EMPTY;
        })
      )
      .subscribe(() => {
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
      predisposingConditions: '',
      manualCreationAllowed: true
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
      predisposingConditions: rowData['Predisposing Conditions'],
      manualCreationAllowed: rowData['Manual Creation Allowed'] ?? true
    };
    this.displayCollectionDialog = true;
  }

  confirmDeleteCollection(rowData: any) {
    this.collectionToDelete = rowData;
    this.displayDeleteDialog = true;
  }

  deleteCollection() {
    if (!this.collectionToDelete) return;

    const collectionId = this.collectionToDelete['Collection ID'];

    this.collectionsService
      .deleteCollection(collectionId)
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to delete collection: ${error.message}`,
            life: 3000
          });

          return EMPTY;
        })
      )
      .subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Collection Deleted',
          life: 3000
        });
        this.getCollectionData();
        this.hideDeleteDialog();
      });
  }

  hideDeleteDialog() {
    this.displayDeleteDialog = false;
    this.collectionToDelete = null;
  }

  hideCollectionDialog() {
    this.displayCollectionDialog = false;
  }

  filterGlobal(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;

    this.table().filterGlobal(inputValue, 'contains');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
