/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, effect, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpResponse } from '@angular/common/http';
import { AssetDeltaService } from './asset-delta.service';
import { CollectionsService } from '../collection-processing/collections.service';
import { CollectionsBasicList } from '../../../common/models/collections-basic.model';
import { UsersService } from '../user-processing/users.service';
import { EMPTY, Observable, Subject, catchError, finalize, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { FloatLabel } from "primeng/floatlabel"
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { ImportService } from '../../import-processing/import.service';
import { SharedService } from '../../../common/services/shared.service';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { AppConfigService } from '../../../layout/services/appconfigservice';
import { SelectModule } from 'primeng/select';

interface AssetDeltaResponse {
  assets: AssetData[];
  assetDeltaUpdated?: string | null;
  emassHardwareListUpdated?: string | null;
}

interface AssetData {
  key: string;
  value: string;
  eMASS?: boolean;
  existsInTenable?: boolean;
  existsInStigManager?: boolean;
  loading?: boolean;
  assignedTeam?: {
    assignedTeamId: number;
    assignedTeamName: string;
  };
}

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'cpat-asset-delta',
  templateUrl: './asset-delta.component.html',
  styleUrls: ['./asset-delta.component.scss'],
  standalone: true,
  imports: [
    BadgeModule,
    ButtonModule,
    CardModule,
    ChartModule,
    CommonModule,
    DialogModule,
    FileUploadModule,
    FloatLabel,
    FormsModule,
    InputTextModule,
    IconField,
    InputIcon,
    ProgressBarModule,
    SelectModule,
    TableModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDeltaComponent implements OnInit, AfterViewInit {
  @ViewChild('assetDeltaTable', { static: false }) assetDeltaTable: any;
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  @Output() navigateToPluginMapping = new EventEmitter<void>();
  cols!: Column[];
  exportColumns!: Column[];
  availableCollections: CollectionsBasicList[] = [];
  selectedCollection = signal<number | null>(null);
  assetDeltaUpdated = signal<string | null>(null);
  emassHardwareListUpdated = signal<string | null>(null);
  user: any;
  showUploadDialog = signal<boolean>(false);
  loading = signal<boolean>(false);
  totalSize = signal<string>('0');
  totalSizePercent = signal<number>(0);
  tableScrollHeight: string = '50vh';
  private isVisible = false;

  stackedBarData = signal<ChartData>({ labels: [], datasets: [] });
  doughnutData = signal<ChartData>({ labels: [], datasets: [] });
  barData = signal<ChartData>({ labels: [], datasets: [] });

  chartOptions = signal<any>(null);
  doughnutOptions = signal<any>(null);
  stackedBarOptions = signal<any>(null);
  barOptions = signal<any>(null);

  assets = signal<AssetData[]>([]);
  filteredAssets = signal<AssetData[]>([]);
  filteredTotal = signal<number>(0);
  themeInitialized = signal<boolean>(false);
  chartInitialized = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  @Input()
  set activated(isActive: boolean) {
    if (isActive && !this.isVisible) {
      this.isVisible = true;
      setTimeout(() => this.calculateTableHeight(), 100);
    }
    this.isVisible = isActive;
  }

  constructor(
    private importService: ImportService,
    private messageService: MessageService,
    private assetDeltaService: AssetDeltaService,
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private userService: UsersService,
    private configService: AppConfigService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {
    effect(() => {
      if (!this.themeInitialized()) {
        setTimeout(() => {
          const baseOptions = this.setChartOptions('bar');
          const stackedOptions = this.setChartOptions('stacked');
          this.chartOptions.set(baseOptions);
          this.stackedBarOptions.set(stackedOptions);
          this.doughnutOptions.set({
            ...baseOptions,
            scales: undefined,
            cutout: '60%',
            plugins: {
              ...baseOptions.plugins,
              legend: {
                display: true
              }
            }
          });
          this.themeInitialized.set(true);
          this.chartInitialized.set(true);

          if (this.assets().length > 0) {
            this.updateChartData();
          }
        });
      }
    });
  }

  themeEffect = effect(() => {
    if (this.configService.transitionComplete()) {
      const currentStackedData = this.stackedBarData();
      const currentDoughnutData = this.doughnutData();
      const currentBarData = this.barData();

      this.chartInitialized.set(false);

      requestAnimationFrame(() => {
        const baseOptions = this.setChartOptions('bar');
        const stackedOptions = this.setChartOptions('stacked');
        this.chartOptions.set(baseOptions);
        this.stackedBarOptions.set(stackedOptions);
        this.doughnutOptions.set({
          ...baseOptions,
          scales: undefined,
          cutout: '65%',
          plugins: {
            ...baseOptions.plugins,
            legend: {
              display: true
            }
          }
        });

        if (currentStackedData) this.stackedBarData.set(currentStackedData);
        if (currentDoughnutData) this.doughnutData.set(currentDoughnutData);
        if (currentBarData) this.barData.set(currentBarData);

        this.themeInitialized.set(true);
        this.chartInitialized.set(true);

        if (this.assets().length > 0) {
          this.updateChartData();
        }
      });
    }
  });

  ngOnInit() {
    this.initializeColumns();
    this.themeInitialized.set(false);

    this.userService.getCurrentUser().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error fetching user data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user data'
        });
        return EMPTY;
      })
    ).subscribe(user => {
      this.user = user;

      this.collectionsService.getCollectionBasicList().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.availableCollections = response || [];
          if (this.availableCollections.length > 0) {
            let collectionToUse = null;
            if (this.user?.lastCollectionAccessedId) {
              const userCollection = this.availableCollections.find(
                c => c.collectionId === this.user.lastCollectionAccessedId
              );

              if (userCollection) {
                collectionToUse = userCollection.collectionId;
              }
            }

            if (collectionToUse === null) {
              collectionToUse = this.availableCollections[0].collectionId;
            }
            this.selectedCollection.set(collectionToUse);
            this.loadAssetDeltaList(collectionToUse);
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'No Collections',
              detail: 'No collections available. Please create a collection first.'
            });
          }
        },
        error: () => this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load available collections'
        })
      });
    });
  }

  ngAfterViewInit() {
    if (this.assetDeltaTable) {
      this.assetDeltaTable.onFilter.subscribe(() => {
        setTimeout(() => {
          this.updateFilteredTotal();
        });
      });
    }

    setTimeout(() => this.calculateTableHeight(), 100);

    const observer = new MutationObserver(() => {
      if (this.isVisible) {
        this.calculateTableHeight();
      }
    });

    const componentElement = this.elementRef.nativeElement;
    if (componentElement) {
      observer.observe(componentElement, {
        childList: true,
        subtree: true
      });

      const tabPanel = componentElement.closest('.p-tabpanel');
      if (tabPanel) {
        observer.observe(tabPanel, {
          attributes: true,
          childList: true,
          subtree: false
        });
      }
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateTableHeight();
  }

  calculateTableHeight() {
    try {
      setTimeout(() => {
        const componentElement = this.elementRef.nativeElement;
        const tabPanel = componentElement.closest('.p-tabpanel');
        if (!tabPanel) {
          this.tableScrollHeight = '50vh';
          return;
        }

        const cardContainer = tabPanel.closest('.card');
        if (!cardContainer) {
          this.tableScrollHeight = '50vh';
          return;
        }

        const chartsContainer = componentElement.querySelector('.charts-container');
        const tableHeader = componentElement.querySelector('.p-datatable-header');
        const tabPanelTop = tabPanel.getBoundingClientRect().top;
        const cardBottom = cardContainer.getBoundingClientRect().bottom;
        const chartsHeight = chartsContainer ? chartsContainer.offsetHeight : 0;
        const headerHeight = tableHeader ? tableHeader.offsetHeight : 0;
        const bottomPadding = 32;
        const availableHeight = cardBottom - tabPanelTop - chartsHeight - headerHeight - bottomPadding;
        const finalHeight = Math.max(availableHeight, 200);
        this.tableScrollHeight = `${finalHeight}px`;

        this.cdr.detectChanges();
      }, 0);
    } catch (error) {
      console.error('Error calculating table height:', error);
      this.tableScrollHeight = '50vh';
    }
  }

  private initializeColumns() {
    this.cols = [
      { field: 'key', header: 'Asset', customExportHeader: 'Asset' },
      { field: 'value', header: 'Team', customExportHeader: 'Team' },
      { field: 'eMASS', header: 'eMASS', customExportHeader: 'eMASS' },
      { field: 'existsInTenable', header: 'Tenable', customExportHeader: 'Tenable' },
      { field: 'existsInStigManager', header: 'STIG Manager', customExportHeader: 'STIG Manager' }
    ];

    this.exportColumns = this.cols.map(col => ({
      field: col.field,
      header: col.customExportHeader || col.header
    }));
  }

  loadCollections() {
    this.collectionsService.getCollectionBasicList().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.availableCollections = response || [];
        console.log(this.availableCollections);
        console.log(this.user?.lastCollectionAccessedId);
        if (this.availableCollections.length > 0) {
          const lastCollection = this.user;
          const initialCollection = lastCollection &&
            this.availableCollections.some(c => c.collectionId === lastCollection)
            ? lastCollection
            : this.availableCollections[0].collectionId;

          this.onCollectionChange(initialCollection);
        }
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load available collections'
      })
    });
  }

  onUpload() {
    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: ''
    });
  }

  onSelect(_event: any) {
    this.updateTotalSize();
  }

  customUploadHandler(event: any) {
    const file = event.files[0];
    const collectionId = this.selectedCollection();

    if (!file) {
      console.error('No file selected');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No file selected'
      });
      return;
    }

    if (!collectionId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a collection first'
      });
      return;
    }

    this.assetDeltaService.upload(file, collectionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (event: any) => {
        if (event instanceof HttpResponse) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File uploaded successfully'
          });
          this.loadAssetDeltaList(collectionId);
          this.fileUpload.clear();
          this.showUploadDialog.set(false);
          this.checkAllStatuses();
        }
      },
      error: error => {
        console.error('Error during file upload:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'File upload failed: ' + (error.error?.message || 'Unknown error')
        });
      }
    });
  }

  onCollectionChange(collectionId: number) {
    if (!collectionId || collectionId === this.selectedCollection()) return;

    this.selectedCollection.set(collectionId);
    this.loadAssetDeltaList(collectionId);
  }

  loadAssetDeltaList(collectionId: number = this.selectedCollection()) {
    if (!collectionId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a collection first'
      });
      return;
    }

    this.loading.set(true);
    this.assetDeltaService.getAssetDeltaListByCollection(collectionId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response: AssetDeltaResponse) => {
        if (!response) {
          console.error('Invalid response from getAssetDeltaListByCollection');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid response received from server'
          });
          return;
        }

        const assets = (response.assets || []).map((asset: AssetData) => ({
          key: asset.key,
          value: asset.value,
          eMASS: asset.eMASS || false,
          loading: false,
          existsInTenable: undefined,
          existsInStigManager: undefined,
          assignedTeam: asset.assignedTeam
        }));

        this.assets.set(assets);
        this.filteredAssets.set(assets);

        if (response.assetDeltaUpdated) {
          this.assetDeltaUpdated.set(response.assetDeltaUpdated);
        }

        if (response.emassHardwareListUpdated) {
          this.emassHardwareListUpdated.set(response.emassHardwareListUpdated);
        }

        this.filteredTotal.set(response.assets?.length || 0);

        if (this.assets().length > 0) {
          this.updateChartData();
        }
      },
      error: (error) => {
        console.error('Error loading asset list:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load asset list'
        });
        this.assets.set([]);
        this.assetDeltaUpdated.set(null);
        this.emassHardwareListUpdated.set(null);
      }
    });
  }

  checkStigManagerStatus(): Observable<Set<string>> {
    this.assets.update(assets => assets.map(asset => ({
      ...asset,
      loading: true,
      existsInStigManager: undefined
    })));

    return this.sharedService.getCollectionsFromSTIGMAN().pipe(
      catchError(error => {
        console.error('Error fetching STIG Manager collections:', error);
        return EMPTY;
      }),
      switchMap(collections => {
        if (!collections?.length) {
          return of(new Set<string>());
        }

        const assetRequests = collections.map(collection =>
          this.sharedService.getAssetsFromSTIGMAN(collection.collectionId).pipe(
            catchError(error => {
              console.error(`Error fetching assets for collection ${collection.collectionId}:`, error);
              return of([]);
            })
          )
        );

        return forkJoin(assetRequests).pipe(
          map(assetArrays => {
            const allAssets = new Set(
              assetArrays
                .flat()
                .map(asset => asset.name.toLowerCase())
            );
            return allAssets;
          })
        );
      })
    );
  }

  checkAllStatuses() {
    this.loading.set(true);
    this.messageService.add({
      severity: 'secondary',
      summary: 'Initiated',
      detail: 'Status check initiated'
    });

    const tenableCheck = this.checkTenableStatus(this.assets().map(a => a.key)).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error checking Tenable status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Tenable status check failed'
        });
        return of(null);
      })
    );

    const stigManagerCheck = this.checkStigManagerStatus().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error checking STIG Manager status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'STIG Manager status check failed'
        });
        return of(null);
      })
    );

    forkJoin([tenableCheck, stigManagerCheck]).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: ([tenableResponse, stigManagerAssets]) => {
        let tenableResults: string[] = [];
        if (tenableResponse) {
          tenableResults = tenableResponse.response.results.map((r: any) => r.dnsName.toLowerCase());
        }

        this.assets.update(assets => assets.map(asset => {
          const updatedAsset = { ...asset, loading: false };

          if (tenableResponse) {
            updatedAsset.existsInTenable = tenableResults.some((dnsName: string) =>
              dnsName.includes(asset.key.toLowerCase())
            );
          }

          if (stigManagerAssets) {
            updatedAsset.existsInStigManager = stigManagerAssets.has(asset.key.toLowerCase());
          }

          return updatedAsset;
        }));

        this.filteredAssets.set(this.assets());
        this.updateChartData();
        this.cdr.detectChanges();

        if (tenableResponse && stigManagerAssets) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'All status checks completed'
          });
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Partial Success',
            detail: 'Some status checks completed' +
              (tenableResponse ? '' : ' - Tenable check failed') +
              (stigManagerAssets ? '' : ' - STIG Manager check failed')
          });
        }
      },
      error: error => {
        console.error('Error during status checks:', error);
        this.assets.update(assets => assets.map(asset => ({
          ...asset,
          loading: false
        })));

        this.filteredAssets.set(this.assets());

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'All status checks failed'
        });
        this.cdr.detectChanges();
      }
    });
  }

  isTenableCheckDisabled(): boolean {
    return !this.assets().length || this.assets().some(a => a.loading);
  }

  choose(event: Event, chooseCallback: Function) {
    event.stopPropagation();
    chooseCallback();
  }

  uploadEvent(uploadCallback: Function) {
    uploadCallback();
  }

  onRemoveFile(event: Event, file: File, removeCallback: Function) {
    event.stopPropagation();
    removeCallback(file);
    this.updateTotalSize();
  }

  updateTotalSize() {
    let totalSize = 0;
    if (this.fileUpload.files) {
      for (const file of this.fileUpload.files) {
        totalSize += file.size;
      }
    }
    this.totalSize.set(this.formatSize(totalSize));
    this.totalSizePercent.set((totalSize / 10485760) * 100);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  checkTenableStatus(hostnames: string[]): Observable<any> {
    const analysisParams = {
      columns: [],
      query: {
        context: '',
        createdTime: 0,
        description: '',
        endOffset: 100000,
        filters: [{
          filterName: 'dnsName',
          id: 'dnsName',
          isPredefined: true,
          operator: '=',
          type: 'vuln',
          value: hostnames.join(',')
        }],
        groups: [],
        modifiedTime: 0,
        name: '',
        sortColumn: 'total',
        sortDirection: 'desc',
        sourceType: 'cumulative',
        startOffset: 0,
        status: -1,
        tool: 'sumdnsname',
        type: 'vuln',
        vulnTool: 'sumdnsname'
      },
      sortDir: 'desc',
      sortField: 'total',
      sourceType: 'cumulative',
      type: 'vuln',
    };

    return this.importService.postTenableAnalysis(analysisParams);
  }

  private updateChartData() {
    if (!this.assets()) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const colors = {
      p100: documentStyle.getPropertyValue('--p-primary-100'),
      p200: documentStyle.getPropertyValue('--p-primary-200'),
      p300: documentStyle.getPropertyValue('--p-primary-300'),
      p400: documentStyle.getPropertyValue('--p-primary-400'),
      p500: documentStyle.getPropertyValue('--p-primary-500'),
      p600: documentStyle.getPropertyValue('--p-primary-600'),
      p700: documentStyle.getPropertyValue('--p-primary-700'),
      p800: documentStyle.getPropertyValue('--p-primary-800')
    };

    const assets = this.assets();

    const counts = {
      inAllSystems: assets.filter(a => a.existsInTenable && a.existsInStigManager && a.eMASS).length,
      inTenableAndStigManager: assets.filter(a => a.existsInTenable && a.existsInStigManager && !a.eMASS).length,
      inTenableAndEMass: assets.filter(a => a.existsInTenable && !a.existsInStigManager && a.eMASS).length,
      inStigManagerAndEMass: assets.filter(a => !a.existsInTenable && a.existsInStigManager && a.eMASS).length,
      onlyInTenable: assets.filter(a => a.existsInTenable && !a.existsInStigManager && !a.eMASS).length,
      onlyInStigManager: assets.filter(a => !a.existsInTenable && a.existsInStigManager && !a.eMASS).length,
      onlyInEMass: assets.filter(a => !a.existsInTenable && !a.existsInStigManager && a.eMASS).length,
      notInAnySystem: assets.filter(a => (!a.existsInTenable && !a.existsInStigManager && !a.eMASS) ||
        a.existsInTenable === undefined ||
        a.existsInStigManager === undefined).length
    };

    const teams = Array.from(new Set(assets.map(asset => asset.value)));
    const teamData = teams.map(team => {
      const teamAssets = assets.filter(asset => asset.value === team);
      return {
        team,
        missingTenable: teamAssets.filter(asset => !asset.existsInTenable && (asset.existsInStigManager || asset.eMASS)).length,
        missingStigManager: teamAssets.filter(asset => !asset.existsInStigManager && (asset.existsInTenable || asset.eMASS)).length,
        missingEMass: teamAssets.filter(asset => !asset.eMASS && (asset.existsInTenable || asset.existsInStigManager)).length,
        missingAll: teamAssets.filter(asset => (!asset.existsInTenable && !asset.existsInStigManager && !asset.eMASS) ||
          asset.existsInTenable === undefined ||
          asset.existsInStigManager === undefined).length
      };
    }).filter(team => team.missingTenable > 0 || team.missingStigManager > 0 || team.missingEMass > 0 || team.missingAll > 0);

    const stackedDatasets: any[] = [
      {
        label: 'Missing from Tenable',
        data: teamData.map(team => team.missingTenable),
        backgroundColor: colors.p600,
        borderRadius: 0,
        borderSkipped: false
      },
      {
        label: 'Missing from STIG Manager',
        data: teamData.map(team => team.missingStigManager),
        backgroundColor: colors.p500,
        borderRadius: 0,
        borderSkipped: false
      },
      {
        label: 'Missing from eMASS',
        data: teamData.map(team => team.missingEMass),
        backgroundColor: colors.p400,
        borderRadius: 0,
        borderSkipped: false
      },
      {
        label: 'Missing from All',
        data: teamData.map(team => team.missingAll),
        backgroundColor: colors.p300,
        borderRadius: 0,
        borderSkipped: false
      }
    ];

    const nonEmptyDatasets = stackedDatasets.filter(dataset =>
      dataset.data.some(value => value > 0)
    );

    nonEmptyDatasets.forEach(dataset => {
      dataset.borderRadius = dataset.data.map(() => 0);
    });

    teamData.forEach((_, teamIndex) => {
      const datasetStackOrder = [...nonEmptyDatasets].reverse();
      const topVisibleDataset = datasetStackOrder.find(dataset => dataset.data[teamIndex] > 0);

      if (topVisibleDataset) {
        topVisibleDataset.borderRadius[teamIndex] = { topLeft: 5, topRight: 5 };
      }
    });

    this.stackedBarData.set({
      labels: teamData.map(team => team.team),
      datasets: nonEmptyDatasets
    });

    const doughnutItems = [
      { label: 'In All Systems', value: counts.inAllSystems, color: colors.p800 },
      { label: 'In Tenable & STIG Manager', value: counts.inTenableAndStigManager, color: colors.p700 },
      { label: 'In Tenable & eMASS', value: counts.inTenableAndEMass, color: colors.p600 },
      { label: 'In STIG Manager & eMASS', value: counts.inStigManagerAndEMass, color: colors.p500 },
      { label: 'Only in Tenable', value: counts.onlyInTenable, color: colors.p400 },
      { label: 'Only in STIG Manager', value: counts.onlyInStigManager, color: colors.p300 },
      { label: 'Only in eMASS', value: counts.onlyInEMass, color: colors.p200 },
      { label: 'Not In Any System', value: counts.notInAnySystem, color: colors.p100 }
    ].filter(item => item.value > 0);

    this.doughnutData.set({
      labels: doughnutItems.map(item => item.label),
      datasets: [{
        data: doughnutItems.map(item => item.value),
        backgroundColor: doughnutItems.map(item => item.color),
        borderWidth: 0
      }]
    });

    const teamColors = [colors.p700, colors.p600, colors.p500, colors.p400, colors.p300, colors.p200, colors.p100];

    this.barData.set({
      labels: teams,
      datasets: [{
        data: teams.map(team => assets.filter(asset => asset.value === team).length),
        backgroundColor: teamColors,
        borderRadius: { topLeft: 5, topRight: 5 },
        borderSkipped: false
      }]
    });
  }

  exportCSV(_event: Event) {
    if (!this.assetDeltaTable) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Table component not initialized'
      });
      return;
    }

    if (this.assets().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'There is no data to export'
      });
      return;
    }

    this.assetDeltaTable.exportCSV();
  }

  private setChartOptions(chartType: 'stacked' | 'bar' | 'doughnut' = 'bar') {
    const { darkTheme } = this.configService.appState();
    const documentStyle = getComputedStyle(document.documentElement);
    const surface100 = documentStyle.getPropertyValue('--p-surface-100');
    const surface900 = documentStyle.getPropertyValue('--p-surface-900');
    const surface400 = documentStyle.getPropertyValue('--p-surface-400');
    const surface500 = documentStyle.getPropertyValue('--p-surface-500');

    const baseOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.7,
      plugins: {
        tooltip: {
          enabled: true
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: darkTheme ? surface500 : surface400
          },
          grid: {
            display: false,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: darkTheme ? surface500 : surface400
          },
          grid: {
            display: true,
            color: darkTheme ? surface900 : surface100,
            borderColor: 'transparent'
          },
          border: {
            display: false
          }
        }
      }
    };

    if (chartType === 'stacked') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            enabled: false,
            position: 'nearest',
            external: function (context) {
              const { chart, tooltip } = context;
              let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');

              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.classList.add(
                  'chartjs-tooltip',
                  'dark:bg-surface-950',
                  'bg-surface-0',
                  'p-3',
                  'rounded-[8px]',
                  'overflow-hidden',
                  'opacity-100',
                  'absolute',
                  'transition-all',
                  'duration-[0.1s]',
                  'pointer-events-none',
                  'shadow-[0px_25px_20px_-5px_rgba(0,0,0,0.10),0px_10px_8px_-6px_rgba(0,0,0,0.10)]'
                );
                chart.canvas.parentNode.appendChild(tooltipEl);
              }

              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
              }

              if (tooltip.body) {
                tooltipEl.innerHTML = '';
                const tooltipBody = document.createElement('div');
                tooltipBody.classList.add('flex', 'flex-col', 'gap-4', 'px-3', 'py-3', 'min-w-[18rem]');

                const teamHeader = document.createElement('div');
                teamHeader.classList.add('text-base', 'font-medium', 'text-color', 'border-bottom-1', 'surface-border', 'pb-2');
                teamHeader.appendChild(document.createTextNode(tooltip.title[0]));
                tooltipBody.appendChild(teamHeader);

                const values = tooltip.dataPoints.map(dp => ({
                  value: dp.formattedValue,
                  label: dp.dataset.label,
                  color: dp.dataset.backgroundColor
                })).filter(item => parseInt(item.value) > 0);

                values.forEach((item) => {
                  const row = document.createElement('div');
                  row.classList.add('flex', 'items-center', 'gap-2', 'w-full');

                  const point = document.createElement('div');
                  point.classList.add('w-2.5', 'h-2.5', 'rounded-full');
                  point.style.backgroundColor = item.color;
                  row.appendChild(point);

                  const label = document.createElement('span');
                  label.appendChild(document.createTextNode(item.label));
                  label.classList.add('text-base', 'font-medium', 'text-color', 'flex-1', 'text-left');
                  row.appendChild(label);

                  const value = document.createElement('span');
                  value.appendChild(document.createTextNode(item.value));
                  value.classList.add('text-base', 'font-medium', 'text-color', 'text-right');
                  row.appendChild(value);

                  tooltipBody.appendChild(row);
                });

                tooltipEl.appendChild(tooltipBody);
              }

              const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
              const tooltipWidth = tooltipEl.offsetWidth;
              const tooltipHeight = tooltipEl.offsetHeight;
              const elementY = tooltip.dataPoints[0].element.y;

              tooltipEl.style.opacity = 1;
              tooltipEl.style.left = positionX + tooltip.caretX + 'px';
              tooltipEl.style.top = positionY + elementY - (tooltipHeight / 2) + 'px';
              tooltipEl.style.font = tooltip.options.bodyFont.string;
              tooltipEl.style.padding = '0px';

              const chartWidth = chart.width;
              if (parseFloat(tooltipEl.style.left) + tooltipWidth > chartWidth) {
                tooltipEl.style.left = positionX + tooltip.caretX - tooltipWidth - 8 + 'px';
              }
            }
          },
          legend: {
            display: true
          }
        },
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            stacked: true
          },
          y: {
            ...baseOptions.scales.y,
            stacked: true
          }
        }
      };
    }

    return baseOptions;
  }

  updateFilteredTotal() {
    const filteredValue = this.assetDeltaTable?.filteredValue;
    this.filteredTotal.set(filteredValue?.length ?? this.assets().length);
  }

  filterGlobal(event: any) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.assetDeltaTable.filterGlobal(filterValue, 'contains');
    setTimeout(() => {
      this.updateFilteredTotal();
    });
  }

  clearAllFilters() {
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      this.filterGlobal({ target: searchInput });
    }

    if (this.assetDeltaTable) {
      this.assetDeltaTable.clear();
    }

    this.filteredAssets.set(this.assets());
    this.filteredTotal.set(this.assets().length);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
