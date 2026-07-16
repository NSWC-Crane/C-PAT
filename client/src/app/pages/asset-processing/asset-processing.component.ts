/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CpatChartComponent } from '../../common/components/chart/chart.component';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { PayloadService } from '../../common/services/setPayload.service';
import { SharedService } from '../../common/services/shared.service';
import { getErrorMessage } from '../../common/utils/error-utils';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { STIGManagerAssetsTableComponent } from '../import-processing/stigmanager-import/stigManagerAssetsTable/stigManagerAssetsTable.component';
import { TenableHighRiskAssetsTableComponent } from '../import-processing/tenable-import/components/tenableHighRiskAssetsTable/tenableHighRiskAssetsTable.component';
import { TenableHostAssetsTableComponent } from '../import-processing/tenable-import/components/tenableHostAssetsTable/tenableHostAssetsTable.component';
import { AssetComponent } from './asset/asset.component';
import { AssetService } from './assets.service';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}
interface AssetEntry {
  assetId: any;
  assetName: string;
  description: string;
  ipAddress: string;
  macAddress: string;
}

@Component({
  selector: 'cpat-asset-processing',
  templateUrl: './asset-processing.component.html',
  styleUrls: ['./asset-processing.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AssetComponent,
    ButtonModule,
    CardModule,
    CpatChartComponent,
    DialogModule,
    SelectModule,
    FormsModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    STIGManagerAssetsTableComponent,
    TableModule,
    TabsModule,
    ToastModule,
    TenableHighRiskAssetsTableComponent,
    TenableHostAssetsTableComponent,
    TooltipModule
  ]
})
export class AssetProcessingComponent implements OnInit, OnDestroy {
  private assetService = inject(AssetService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly sharedService = inject(SharedService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly messageService = inject(MessageService);

  private readonly assetTable = viewChild.required<Table>('assetTable');
  public assetLabel: any[] = [];
  readonly chartData = signal<any>(undefined);
  chartOptions: any;
  cols!: Column[];
  exportColumns!: Column[];
  readonly data = signal<AssetEntry[]>([]);
  readonly filterValue = signal('');
  readonly assets = signal<AssetEntry[]>([]);
  readonly asset = signal<AssetEntry>({
    assetId: '',
    assetName: '',
    description: '',
    ipAddress: '',
    macAddress: ''
  });
  readonly selectedCollection = signal<any>(undefined);
  readonly assetDialogVisible = signal(false);
  readonly selectedAssets = signal<AssetEntry[]>([]);
  readonly collectionType = signal<string>('');
  readonly originCollectionId = signal<number | undefined>(undefined);
  protected readonly accessLevel = signal<number>(0);
  readonly user = this.setPayloadService.user;
  readonly payload = this.setPayloadService.payload;
  private readonly destroyRef = inject(DestroyRef);
  private readonly subs = new SubSink();

  constructor() {
    this.initializeChartOptions();
  }

  ngOnInit() {
    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection.set(collectionId);
    });

    this.collectionsService.getCollectionBasicList().subscribe({
      next: (data) => {
        const selectedCollectionData = data.find((collection: any) => collection.collectionId === this.selectedCollection());

        if (selectedCollectionData) {
          this.collectionType.set(selectedCollectionData.collectionType);
          this.originCollectionId.set(selectedCollectionData.originCollectionId);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `An error occurred: ${getErrorMessage(error)}`
        });
        this.collectionType.set('');
      }
    });

    this.setPayload();
    this.initializeColumns();
  }

  private initializeChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: true } },
        y: {
          beginAtZero: true,
          grace: '5%',
          grid: { display: false },
          ticks: {
            font: { weight: 600 }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 13,
              family: 'sans-serif',
              weight: 600
            }
          }
        }
      }
    };
  }

  setPayload() {
    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((level) => {
      this.accessLevel.set(level);

      if (level > 0) {
        this.getAssetData();
      }
    });
  }

  getAssetData() {
    const payload = this.payload();

    if (!payload) return;

    this.subs.sink = forkJoin([this.assetService.getAssetsByCollection(this.user().lastCollectionAccessedId), this.assetService.getCollectionAssetLabel(payload.lastCollectionAccessedId)]).subscribe(
      ([assetData, assetLabelResponse]: any) => {
        if (!Array.isArray(assetData)) {
          console.error('Unexpected response format:', assetData);

          return;
        }

        if (!Array.isArray(assetLabelResponse.assetLabel)) {
          console.error('assetLabelResponse.assetLabel is not an array', assetLabelResponse.assetLabel);

          return;
        }

        this.assetLabel = assetLabelResponse.assetLabel;
        this.setLabelChartData(this.assetLabel);

        const sorted = (assetData as AssetEntry[])
          .map((asset) => ({
            ...asset,
            assetId: Number(asset.assetId)
          }))
          .sort((a, b) => a.assetId - b.assetId);

        this.data.set(sorted);
        this.assets.set(sorted);
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch assets by collection: ${getErrorMessage(error)}`
        });
      }
    );
  }

  initializeColumns() {
    this.cols = [
      {
        field: 'assetId',
        header: 'Asset ID',
        customExportHeader: 'Asset Identifier'
      },
      { field: 'assetName', header: 'Asset Name' },
      { field: 'description', header: 'Description' },
      { field: 'ipAddress', header: 'IP Address' },
      { field: 'macAddress', header: 'MAC Address' }
    ];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();

    const assetTable = this.assetTable();

    if (assetTable) {
      assetTable.filterGlobal(filterValue, 'contains');
    }
  }

  clear() {
    const assetTable = this.assetTable();

    if (assetTable) {
      assetTable.clear();
    }

    this.filterValue.set('');
    this.data.set([...this.assets()]);
  }

  setLabelChartData(assetLabel: any[]) {
    this.chartData.set({
      labels: ['Assets'],
      datasets: assetLabel.map((item) => ({
        label: item.label,
        data: [item.labelCount]
      }))
    });
  }

  exportChart() {
    const canvas = document.getElementsByTagName('canvas')[0];

    if (canvas) {
      const link = document.createElement('a');

      link.download = 'C-PAT_Asset_Label_Chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }

  setAsset(assetId: number) {
    const selectedData = this.data().find((asset) => asset.assetId === assetId);

    if (selectedData) {
      this.asset.set({ ...selectedData });
      this.assetDialogVisible.set(true);
    } else {
      this.asset.set({
        assetId: '',
        assetName: '',
        description: '',
        ipAddress: '',
        macAddress: ''
      });
    }
  }

  addAsset() {
    this.asset.set({
      assetId: 'ADDASSET',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: ''
    });
    this.assetDialogVisible.set(true);
  }

  resetData() {
    this.asset.set({
      assetId: '',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: ''
    });
    this.getAssetData();
  }

  closeAssetDialog() {
    this.assetDialogVisible.set(false);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
