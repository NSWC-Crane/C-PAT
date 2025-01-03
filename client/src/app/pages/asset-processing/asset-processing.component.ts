/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AssetService } from './assets.service';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfirmationDialogOptions } from '../../common/components/confirmation-dialog/confirmation-dialog.component';
import { PayloadService } from '../../common/services/setPayload.service';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DialogService } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { STIGManagerAssetsTableComponent } from '../import-processing/stigmanager-import/stigManagerAssetsTable/stigManagerAssetsTable.component';
import { TenableAssetsTableComponent } from '../import-processing/tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { AssetComponent } from './asset/asset.component';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}
interface AssetEntry {
  assetId: string;
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
  imports: [
    AssetComponent,
    ButtonModule,
    CardModule,
    CommonModule,
    DialogModule,
    Select,
    FormsModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    STIGManagerAssetsTableComponent,
    TableModule,
    TabsModule,
    TenableAssetsTableComponent,
    TooltipModule,
  ],
  providers: [DialogService, MessageService],
})
export class AssetProcessingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('assetLabelsChart')
  assetLabelsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assetTable') assetTable!: Table;
  searchValue: string = '';
  public assetLabel: any[] = [];
  assetLabelChart!: Chart;
  assetLabelChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: true } },
      y: {
        beginAtZero: true,
        grace: '5%',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            weight: 600,
          },
        },
      },
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 13,
            family: 'sans-serif',
            weight: 600,
          },
        },
      },
    },
  };
  customColumn = 'Asset';
  defaultColumns = ['Asset Name', 'Description', 'Collection', 'IP Address', 'MAC Address'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  cols!: Column[];
  exportColumns!: Column[];
  data: AssetEntry[] = [];
  filterValue: string = '';
  users: any;
  assets: AssetEntry[] = [];
  asset: AssetEntry = {
    assetId: '',
    assetName: '',
    description: '',
    ipAddress: '',
    macAddress: '',
  };
  collectionList: any;
  allowSelectAssets = true;
  selectedCollection: any;
  assetDialogVisible: boolean = false;
  selectedAssets: AssetEntry[] = [];
  collectionOrigin: any;
  originCollectionId: any;
  protected accessLevel: any;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();
  private subscriptions = new Subscription();

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private setPayloadService: PayloadService,
    private sharedService: SharedService,
    private collectionService: CollectionsService
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.subscriptions.add(
      await this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    await (
      await this.collectionService.getCollectionBasicList()
    ).subscribe({
      next: data => {
        const selectedCollectionData = data.find(
          (collection: any) => collection.collectionId === this.selectedCollection
        );
        if (selectedCollectionData) {
          this.collectionOrigin = selectedCollectionData.collectionOrigin;
          this.originCollectionId = selectedCollectionData.originCollectionId;
        }
      },
      error: () => {
        this.collectionOrigin = '';
      },
    });
    this.setPayload();
    this.initializeColumns();
  }

  ngAfterViewInit() {
    this.initializeChart();
    this.cdr.detectChanges();
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
          this.getAssetData();
        }
      })
    );
  }

  async getAssetData() {
    if (this.payload == undefined) return;
    this.subs.sink = forkJoin(
      await this.assetService.getAssetsByCollection(this.user.lastCollectionAccessedId),
      await this.assetService.getCollectionAssetLabel(this.payload.lastCollectionAccessedId)
    ).subscribe(
      ([assetData, assetLabelResponse]: any) => {
        if (!Array.isArray(assetData)) {
          console.error('Unexpected response format:', assetData);
        } else if (!Array.isArray(assetLabelResponse.assetLabel)) {
          console.error(
            'assetLabelResponse.assetLabel is not an array',
            assetLabelResponse.assetLabel
          );
          return;
        }

        this.assetLabel = assetLabelResponse.assetLabel;
        this.setLabelChartData(this.assetLabel);

        this.data = (assetData as AssetEntry[])
          .map(asset => ({
            ...asset,
            assetId: String(asset.assetId),
          }))
          .sort((a, b) => a.assetId.localeCompare(b.assetId));
        this.assets = this.data;
      },
      error => {
        console.error('Failed to fetch assets by collection', error);
      }
    );
  }

  initializeColumns() {
    this.cols = [
      {
        field: 'assetId',
        header: 'Asset ID',
        customExportHeader: 'Asset Identifier',
      },
      { field: 'assetName', header: 'Asset Name' },
      { field: 'description', header: 'Description' },
      { field: 'ipAddress', header: 'IP Address' },
      { field: 'macAddress', header: 'MAC Address' },
    ];
    this.exportColumns = this.cols;
  }

  private initializeChart(): void {
    if (!this.assetLabelsChart?.nativeElement) {
      console.error('Unable to initialize chart: Element not available.');
      return;
    }

    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();

    this.assetLabelChart = new Chart(this.assetLabelsChart.nativeElement, {
      type: 'bar',
      data: this.assetLabelChartData,
      plugins: [ChartDataLabels],
      options: this.barChartOptions,
    });

    if (this.assetLabel) {
      this.updateLabelChartData(this.assetLabel);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.assetTable) {
      this.assetTable.filterGlobal(filterValue, 'contains');
    }
  }

  onGlobalFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.assetTable) {
      this.assetTable.filterGlobal(filterValue, 'contains');
    }
  }

  clear() {
    this.searchValue = '';
    if (this.assetTable) {
      this.assetTable.clear();
    }
    this.filterValue = '';
    this.data = [...this.assets];
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false',
    };
    this.dialogService.open(ConfirmationDialogOptions, {
      closeOnEscape: true,
      data: {
        options: dialogOptions,
      },
    });
  }

  setLabelChartData(assetLabel: any[]) {
    this.updateLabelChartData(assetLabel);
  }

  updateLabelChartData(assetLabel: any[]): void {
    if (!this.assetLabelChart) {
      console.warn('Asset Label chart is not initialized.');
      return;
    }
    const datasets = assetLabel.map((item: any) => ({
      label: item.label,
      data: [item.labelCount],
      datalabels: {},
    }));
    this.assetLabelChart.data.datasets = datasets;
    this.assetLabelChart.update();
  }

  exportChart(chartInstance: Chart, chartName: string) {
    const exportDatalabelsOptions = {
      backgroundColor: function (context: any) {
        const datasetBackgroundColor =
          context.chart.data.datasets[context.datasetIndex].backgroundColor;
        return Array.isArray(datasetBackgroundColor)
          ? datasetBackgroundColor[context.dataIndex]
          : datasetBackgroundColor;
      },
      borderRadius: 4,
      color: 'white',
      display: true,
      font: {
        weight: 'bold',
      },
      align: 'end',
      anchor: 'end',
      padding: 6,
    };

    chartInstance.data.datasets.forEach((dataset: any) => {
      if (dataset.datalabels) {
        Object.assign(dataset.datalabels, exportDatalabelsOptions);
      }
    });
    chartInstance.options.plugins!.title = {
      display: true,
      text: `${chartName}`,
      position: 'bottom',
    };
    chartInstance.update();

    setTimeout(() => {
      const canvas = chartInstance.canvas;
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${chartName}_Export.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        const disappearDatalabelsOptions = {
          display: false,
        };

        chartInstance.data.datasets.forEach((dataset: any) => {
          if (dataset.datalabels) {
            Object.assign(dataset.datalabels, disappearDatalabelsOptions);
          }
        });
        chartInstance.options.plugins!.title = {
          display: false,
        };
        chartInstance.update();
      }, 500);
    }, 150);
  }

  setAsset(assetId: string) {
    const selectedData = this.data.find(asset => asset.assetId === assetId);
    if (selectedData) {
      this.asset = { ...selectedData };
      this.assetDialogVisible = true;
    } else {
      this.asset = {
        assetId: '',
        assetName: '',
        description: '',
        ipAddress: '',
        macAddress: '',
      };
    }
  }

  addAsset() {
    this.asset = {
      assetId: 'ADDASSET',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: '',
    };
    this.assetDialogVisible = true;
  }

  resetData() {
    this.asset = {
      assetId: '',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: '',
    };
    this.getAssetData();
    this.allowSelectAssets = true;
  }

  closeAssetDialog() {
    this.assetDialogVisible = false;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogOptions, {
      closeOnEscape: true,
      data: {
        options: dialogOptions,
      },
    }).onClose;
}
