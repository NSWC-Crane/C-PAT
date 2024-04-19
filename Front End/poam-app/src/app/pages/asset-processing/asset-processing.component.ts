/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AssetService } from './assets.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service';
import { ChangeDetectorRef } from '@angular/core';
import { Assets } from './asset.model';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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

interface AssetTreeNode {
  data: Assets;
  children: AssetTreeNode[];
  expanded: boolean;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;

}

@Component({
  selector: 'cpat-asset-processing',
  templateUrl: './asset-processing.component.html',
  styleUrls: ['./asset-processing.component.scss']
})
export class AssetProcessingComponent implements OnInit, AfterViewInit {
  @ViewChild('assetLabelsChart') assetLabelsChart!: ElementRef<HTMLCanvasElement>;

  public assetLabel: any[] = [];
  public selectedLabel: any = 'All';
  assetLabelChart!: Chart;
  assetLabelChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [],
  };
  public selectedPosition: any = 'bottom';
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
        position: this.selectedPosition,
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
  customColumn = 'asset';
  defaultColumns = ['Asset Name', 'Description', 'Collection', 'IP Address', 'Domain', 'MAC Address'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;
  sortColumn: string | undefined;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  users: any;
  user: any;

  availableAssets: any[] = [];
  selectedAssets: string[] = [];
  collections: any[] = [];
  selectedCollection: string = '';
  assets: any;
  asset: any = {};
  data: any = [];
  collectionList: any;

  allowSelectAssets = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.asset.assetId && this.asset.assetId != "ASSET")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
    Chart.register(...registerables);
  }

  onSubmit() {
    this.resetData();
  }

  async ngOnInit() {
    this.getAssetData();
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  ngAfterViewInit() {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();
    if (this.assetLabelsChart?.nativeElement) {
      this.assetLabelChart = new Chart(this.assetLabelsChart.nativeElement, {
        type: 'bar',
        data: this.assetLabelChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
      if (this.assetLabel) {
        this.updateLabelChartData(this.assetLabel);
      }
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false'
    };

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        options: dialogOptions
      }
    });
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
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

  getAssetData() {
    this.isLoading = true;

    if (this.payload == undefined) return;

    this.subs.sink = forkJoin(
      this.assetService.getAssetsByCollection(this.user.lastCollectionAccessedId),
      this.assetService.getCollectionAssetLabel(this.payload.lastCollectionAccessedId)
    ).subscribe(([assetData, assetLabelResponse]: any) => {
      if (!Array.isArray(assetData)) {
        console.error('Unexpected response format:', assetData);
        this.isLoading = false;
      } else if (!Array.isArray(assetLabelResponse.assetLabel)) {
        console.error('assetLabelResponse.assetLabel is not an array', assetLabelResponse.assetLabel);
        return;
      }

      this.assets = assetData;
      this.assetLabel = assetLabelResponse.assetLabel;
      this.setLabelChartData(this.assetLabel);

      this.data = this.assets.map((asset: any) => ({
        assetId: asset.assetId,
        assetName: asset.assetName,
        description: asset.description,
        collectionId: asset.collectionId,
        ipAddress: asset.ipAddress,
        macAddress: asset.macAddress,
      }));

      this.updateDataSource();
      this.isLoading = false;
    }, error => {
      console.error('Failed to fetch assets by collection', error);
      this.isLoading = false;
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
    const datasets = assetLabel.map((item) => ({
      label: item.label,
      data: [item.labelCount],
      datalabels: {},
    }));
    this.assetLabelChart.data.datasets = datasets;
    this.assetLabelChart.update();
  }

  updateDataSource() {
    let treeNodes: AssetTreeNode[] = this.assets.map((asset: Assets) => {
      return {
        data: {
          'asset': asset.assetId,
          'Asset Name': asset.assetName,
          'Description': asset.description,
          'Collection': asset.collectionId,
          'IP Address': asset.ipAddress,
          'Domain': asset.fullyQualifiedDomainName,
          'MAC Address': asset.macAddress,
        },
        children: [],
        expanded: true
      };
    });

    this.dataSource = this.dataSourceBuilder.create(treeNodes);
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

    chartInstance.data.datasets.forEach(dataset => {
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

        chartInstance.data.datasets.forEach(dataset => {
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

  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  setAsset(assetId: any) {
    this.asset = null;
    let selectedData = this.data.filter((asset: { assetId: any; }) => asset.assetId === assetId)
    this.asset = selectedData[0];
    this.allowSelectAssets = false;
  }

  addAsset() {
    this.asset.assetId = "ADDASSET";
    this.asset.assetName = "";
    this.asset.description = ""
    this.asset.fullyQualifiedDomainName = "";
    this.asset.collectionId = 0;
    this.asset.ipAddress = "";
    this.asset.macAddress = "";
    this.allowSelectAssets = false;
  }

  resetData() {
    this.asset = [];
    this.getAssetData();
    this.asset.assetId = "ASSET";
    this.allowSelectAssets = true;
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;
}
