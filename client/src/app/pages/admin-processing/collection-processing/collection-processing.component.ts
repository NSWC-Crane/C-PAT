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
import { ListboxModule } from 'primeng/listbox';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { EMPTY, Observable, Subscription, catchError, forkJoin, from, map, of, switchMap, tap, throwError } from 'rxjs';
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
  imports: [AutoCompleteModule, ButtonModule, DialogModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, ListboxModule, SelectModule, TextareaModule, ToastModule, TooltipModule, TreeTableModule]
})
export class CollectionProcessingComponent implements OnInit, OnDestroy {
  private readonly aaPackageService = inject(AAPackageService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly messageService = inject(MessageService);
  private readonly sharedService = inject(SharedService);
  private readonly importService = inject(ImportService);
  private readonly poamService = inject(PoamService);

  public readonly table = viewChild.required<TreeTable>('dt');
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
  collectionTypeOptions = [
    { label: 'C-PAT', value: 'C-PAT' },
    { label: 'STIG Manager', value: 'STIG Manager' },
    { label: 'Tenable', value: 'Tenable' }
  ];
  originCollectionOptions: { label: string; value: number }[] = [];
  loadingOriginCollections: boolean = false;
  previousCollectionType: string | null = null;
  pendingCollectionType: string | null = null;
  displayCollectionTypeConfirmDialog: boolean = false;
  previousOriginCollectionId: number | null = null;
  pendingOriginCollectionId: number | null = null;
  displayOriginIdConfirmDialog: boolean = false;
  protected accessLevel: any;
  user: any;
  payload: any;
  cpatAffectedAssets: any;
  stigmanAffectedAssets: any;
  tenableAffectedAssets: any;
  displayDeleteDialog: boolean = false;
  collectionToDelete: any = null;
  displayExportDialog: boolean = false;
  selectableCollections: any[] = [];
  selectedExportCollections: any[] = [];
  exporting: boolean = false;
  private readonly findingsCache: Map<string, any[]> = new Map();
  private readonly payloadSubscription: Subscription[] = [];
  private readonly subs = new SubSink();

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
      { field: 'Collection Type', header: 'Collection Type' },
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
        collectionType: any;
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
            'Collection Type': collection.collectionType || 'C-PAT',
            'Origin Collection ID': collection.originCollectionId ?? 0,
            'Manual Creation Allowed': collection.manualCreationAllowed ?? true,
            _collectionType: collection.collectionType || 'C-PAT',
            _originCollectionId: collection.originCollectionId ?? 0
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
      collectionType: rowData['Collection Type'],
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
    if (exportCollection.collectionType === 'STIG Manager') {
      return this.processPoamsWithStigFindings(poams, exportCollection.originCollectionId);
    }

    if (exportCollection.collectionType === 'Tenable') {
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
        map((findings) => this.processSinglePoamWithFindings(poam, findings)),
        catchError((error) => {
          if (error?.message?.includes('403')) {
            console.warn(`STIG Manager access denied for benchmark ${poam.stigBenchmarkId}, exporting POAM without enriched asset data.`);

            return of(poam);
          }

          return throwError(() => error);
        })
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
    const excelURL = URL.createObjectURL(excelData);
    const exportName = collectionName.replace(' ', '_');
    const link = document.createElement('a');

    link.id = 'download-excel';
    link.href = excelURL;
    link.download = `${exportName}_CPAT_Export.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(excelURL);
  }

  saveCollection() {
    if (!this.editingCollection.collectionName?.trim()) return;

    const collectionType = this.editingCollection.collectionType || 'C-PAT';

    if (collectionType !== 'C-PAT' && (this.editingCollection.originCollectionId === null || this.editingCollection.originCollectionId === undefined)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Origin Collection Required',
        detail: `Please select a ${collectionType} collection.`
      });

      return;
    }

    const collectionToSave = {
      ...this.editingCollection,
      collectionType: collectionType,
      originCollectionId: collectionType === 'C-PAT' ? 0 : this.editingCollection.originCollectionId,
      collectionId: Number.parseInt(this.dialogMode === 'add' ? '0' : this.editingCollection.collectionId || '0', 10)
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
      manualCreationAllowed: true,
      collectionType: 'C-PAT',
      originCollectionId: 0
    };
    this.previousCollectionType = 'C-PAT';
    this.previousOriginCollectionId = 0;
    this.originCollectionOptions = [];
    this.displayCollectionDialog = true;
  }

  showModifyCollectionDialog(rowData: any) {
    this.dialogMode = 'modify';
    const collectionType = rowData._collectionType || rowData['Collection Type'] || 'C-PAT';
    const originId = rowData._originCollectionId ?? rowData['Origin Collection ID'] ?? 0;

    this.editingCollection = {
      collectionId: rowData['Collection ID'].toString(),
      collectionName: rowData['Name'],
      description: rowData['Description'],
      systemType: rowData['System Type'],
      systemName: rowData['System Name'],
      ccsafa: rowData['CC/S/A/FA'],
      aaPackage: rowData['A&A Package'],
      predisposingConditions: rowData['Predisposing Conditions'],
      manualCreationAllowed: rowData['Manual Creation Allowed'] ?? true,
      collectionType: collectionType,
      originCollectionId: collectionType === 'C-PAT' ? 0 : originId
    };
    this.previousCollectionType = collectionType;
    this.previousOriginCollectionId = collectionType === 'C-PAT' ? 0 : originId;
    this.originCollectionOptions = [];

    if (collectionType !== 'C-PAT') {
      this.loadOriginCollections(collectionType);
    }

    this.displayCollectionDialog = true;
  }

  onCollectionTypeChange(newCollectionType: string) {
    if (newCollectionType === this.previousCollectionType) return;

    if (this.dialogMode === 'add') {
      this.applyCollectionTypeChange(newCollectionType);

      return;
    }

    this.pendingCollectionType = newCollectionType;
    this.editingCollection.collectionType = this.previousCollectionType;
    this.displayCollectionTypeConfirmDialog = true;
  }

  confirmCollectionTypeChange() {
    if (this.pendingCollectionType) {
      this.applyCollectionTypeChange(this.pendingCollectionType);
    }

    this.pendingCollectionType = null;
    this.displayCollectionTypeConfirmDialog = false;
  }

  cancelCollectionTypeChange() {
    this.pendingCollectionType = null;
    this.displayCollectionTypeConfirmDialog = false;
  }

  private applyCollectionTypeChange(newCollectionType: string) {
    this.editingCollection.collectionType = newCollectionType;
    this.previousCollectionType = newCollectionType;

    if (newCollectionType === 'C-PAT') {
      this.editingCollection.originCollectionId = 0;
      this.previousOriginCollectionId = 0;
      this.originCollectionOptions = [];

      return;
    }

    this.editingCollection.originCollectionId = null;
    this.previousOriginCollectionId = null;
    this.originCollectionOptions = [];
    this.editingCollection.manualCreationAllowed = false;
    this.loadOriginCollections(newCollectionType);
  }

  private loadOriginCollections(collectionType: string) {
    this.loadingOriginCollections = true;

    const source$ =
      collectionType === 'STIG Manager'
        ? this.sharedService.getCollectionsFromSTIGMAN().pipe(map((list: any[]) => (list ?? []).map((c: any) => ({ label: c.name, value: +c.collectionId }))))
        : this.importService.getTenableRepositories().pipe(map((res: any) => (res?.response ?? []).map((r: any) => ({ label: r.name, value: +r.id }))));

    source$
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load ${collectionType} collections: ${getErrorMessage(error)}`
          });

          return of([] as { label: string; value: number }[]);
        })
      )
      .subscribe((options) => {
        this.originCollectionOptions = options;
        this.loadingOriginCollections = false;
      });
  }

  onOriginCollectionIdChange(newValue: number) {
    if (newValue === this.previousOriginCollectionId) return;

    if (this.dialogMode === 'add') {
      this.editingCollection.originCollectionId = newValue;
      this.previousOriginCollectionId = newValue;

      return;
    }

    this.pendingOriginCollectionId = newValue;
    this.editingCollection.originCollectionId = this.previousOriginCollectionId;
    this.displayOriginIdConfirmDialog = true;
  }

  confirmOriginCollectionIdChange() {
    this.editingCollection.originCollectionId = this.pendingOriginCollectionId;
    this.previousOriginCollectionId = this.pendingOriginCollectionId;
    this.pendingOriginCollectionId = null;
    this.displayOriginIdConfirmDialog = false;
  }

  cancelOriginCollectionIdChange() {
    this.pendingOriginCollectionId = null;
    this.displayOriginIdConfirmDialog = false;
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

  showExportDialog() {
    this.selectableCollections = this.data.map((collection: any) => ({
      label: collection.collectionName,
      value: {
        collectionId: collection.collectionId,
        name: collection.collectionName,
        collectionType: collection.collectionType || '',
        originCollectionId: collection.originCollectionId ?? 0,
        systemType: collection.systemType || '',
        systemName: collection.systemName || '',
        ccsafa: collection.ccsafa || '',
        aaPackage: collection.aaPackage || '',
        predisposingConditions: collection.predisposingConditions || ''
      }
    }));
    this.selectedExportCollections = [];
    this.displayExportDialog = true;
  }

  hideExportDialog() {
    this.displayExportDialog = false;
    this.selectedExportCollections = [];
  }

  exportMultipleCollections() {
    if (!this.selectedExportCollections?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select at least one collection to export.'
      });

      return;
    }

    this.exporting = true;
    const skippedCollections: string[] = [];
    const emptyCollections: string[] = [];

    const collectionExports = this.selectedExportCollections.map((exportCollection) =>
      this.collectionsService.getPoamsByCollection(exportCollection.collectionId).pipe(
        switchMap((poams) => {
          if (!poams?.length) {
            emptyCollections.push(exportCollection.name);

            return of([]);
          }

          return this.processPoamsData(poams, exportCollection);
        }),
        catchError((error) => {
          if (error?.message?.includes('403')) {
            skippedCollections.push(exportCollection.name);
          } else {
            skippedCollections.push(`${exportCollection.name} (${getErrorMessage(error)})`);
          }

          return of([]);
        })
      )
    );

    forkJoin(collectionExports)
      .pipe(
        switchMap((results: any[][]) => {
          const allPoams = results.flat();

          if (!allPoams.length) {
            throw new Error('No POAMs were available to export from the selected collections.');
          }

          const primaryCollection = this.selectedExportCollections[0];
          const syntheticExportCollection = {
            ...primaryCollection,
            name: this.selectedExportCollections.length > 1 ? 'Multi_Collection' : primaryCollection.name
          };

          return from(PoamExportService.convertToExcel(allPoams, this.user, syntheticExportCollection));
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: getErrorMessage(error)
          });

          return EMPTY;
        })
      )
      .subscribe({
        next: (excelData) => {
          const exportName = this.selectedExportCollections.length > 1 ? 'Multi_Collection' : this.selectedExportCollections[0].name;

          this.downloadExcel(excelData, exportName);

          if (skippedCollections.length) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Partial Export',
              detail: `The following collections were skipped due to permission or processing errors: ${skippedCollections.join(', ')}`,
              life: 10000
            });
          }

          if (emptyCollections.length) {
            this.messageService.add({
              severity: 'info',
              summary: 'Empty Collections',
              detail: `The following collections had no POAMs to export: ${emptyCollections.join(', ')}`,
              life: 10000
            });
          }

          this.displayExportDialog = false;
        },
        complete: () => {
          this.exporting = false;
        }
      });
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
