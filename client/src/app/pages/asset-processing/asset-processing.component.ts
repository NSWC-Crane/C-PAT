/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AssetService } from './assets.service';
import { forkJoin, Observable } from 'rxjs';
import { SubSink } from "subsink";
import { ConfirmationDialogOptions } from '../../common/components/confirmation-dialog/confirmation-dialog.component'
import { UsersService } from '../admin-processing/user-processing/users.service';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DialogService } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
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
  providers: [DialogService]
})
export class AssetProcessingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('assetLabelsChart') assetLabelsChart!: ElementRef<HTMLCanvasElement>;
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
          display: false
        },
        ticks: {
          font: {
            weight: 600,
          },
        }
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
          }
        }
      },
    },
  };
  customColumn = 'Asset';
  defaultColumns = ['Asset Name', 'Description', 'Collection', 'IP Address', 'MAC Address'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  data: AssetEntry[] = [];
  filterValue: string = '';

  public isLoggedIn = false;
  users: any;
  user: any;
  assets: AssetEntry[] = [];
  asset: AssetEntry = { assetId: '', assetName: '', description: '', ipAddress: '', macAddress: '' };
  collectionList: any;
  allowSelectAssets = true;
  payload: any;
  selectedCollection: any;
  assetDialogVisible: boolean = false;
  selectedAssets: AssetEntry[] = [];
  private subs = new SubSink();

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private userService: UsersService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.setPayload();
  }

  ngAfterViewInit() {
    this.initializeChart();
    this.cdr.detectChanges();
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
      cancelbutton: 'false'
    };
    this.dialogService.open(ConfirmationDialogOptions, {
      closeOnEscape: true,
      data: {
        options: dialogOptions,
      }
    });
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
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
              }))
            };
            this.getAssetData();
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

  async getAssetData() {
    if (this.payload == undefined) return;
    this.subs.sink = forkJoin(
      await this.assetService.getAssetsByCollection(this.user.lastCollectionAccessedId),
      await this.assetService.getCollectionAssetLabel(this.payload.lastCollectionAccessedId)
    ).subscribe(([assetData, assetLabelResponse]: any) => {
      if (!Array.isArray(assetData)) {
        console.error('Unexpected response format:', assetData);
      } else if (!Array.isArray(assetLabelResponse.assetLabel)) {
        console.error('assetLabelResponse.assetLabel is not an array', assetLabelResponse.assetLabel);
        return;
      }

      this.assetLabel = assetLabelResponse.assetLabel;
      this.setLabelChartData(this.assetLabel);

      this.data = (assetData as AssetEntry[]).map(asset => ({
        ...asset,
        assetId: String(asset.assetId)
      })).sort((a, b) => a.assetId.localeCompare(b.assetId));
      this.assets = this.data;
    }, error => {
      console.error('Failed to fetch assets by collection', error);
    });
  }

  setLabelChartData(assetLabel: any[]) {
    this.updateLabelChartData(assetLabel);
  }

  updateLabelChartData(assetLabel: any[]): void {
    if (!this.assetLabelChart) {
      console.warn("Asset Label chart is not initialized.");
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
        const datasetBackgroundColor = context.chart.data.datasets[context.datasetIndex].backgroundColor;
        return Array.isArray(datasetBackgroundColor)
          ? datasetBackgroundColor[context.dataIndex]
          : datasetBackgroundColor;
      },
      borderRadius: 4,
      color: 'white',
      display: true,
      font: {
        weight: 'bold'
      },
      align: 'end',
      anchor: 'end',
      padding: 6
    };

    chartInstance.data.datasets.forEach((dataset: any) => {
      if (dataset.datalabels) {
        Object.assign(dataset.datalabels, exportDatalabelsOptions);
      }
    });
    chartInstance.options.plugins!.title = {
      display: true,
      text: `${chartName}`,
      position: 'bottom'
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
          display: false
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
      this.asset = { assetId: '', assetName: '', description: '', ipAddress: '', macAddress: '' };
    }
  }
  addAsset() {
    this.asset = { assetId: 'ADDASSET', assetName: '', description: '', ipAddress: '', macAddress: '' };
    this.assetDialogVisible = true;
  }
  resetData() {
    this.asset = { assetId: '', assetName: '', description: '', ipAddress: '', macAddress: '' };
    this.getAssetData();
    this.allowSelectAssets = true;
  }
  closeAssetDialog() {
    this.assetDialogVisible = false;
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogOptions, {
      closeOnEscape: true,
      data: {
        options: dialogOptions,
      },
    }).onClose;
}
