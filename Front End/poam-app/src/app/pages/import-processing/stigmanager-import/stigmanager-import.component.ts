/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { SharedService } from '../../../Shared/shared.service';
import { PoamService } from '../../poam-processing/poams.service';
import { CollectionsService } from '../../collection-processing/collections.service';
import { catchError, forkJoin, Observable, of, Subscription } from 'rxjs';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { Chart, registerables, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface Collection {
  collectionId: any;
  name: string;
}

interface Asset {
  assetId: any;
  name: string;
}
interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
  canView: number;
}

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface AssetEntry {
  groupId: string;
  title: string;
  severity: string;
  assetCount: number;
  assets?: AssetEntry[];
}

@Component({
  selector: 'ngx-stigmanager-import',
  templateUrl: './stigmanager-import.component.html',
  styleUrls: ['./stigmanager-import.component.scss']
})
export class STIGManagerImportComponent implements OnInit, AfterViewInit {
  @ViewChild('findingChart') findingChart!: ElementRef<HTMLCanvasElement>;
  customColumn = 'Group ID';
  defaultColumns = ['Rule Title', 'Benchmark ID', 'Severity', 'Asset Count', 'Update POAM'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource: NbTreeGridDataSource<AssetEntry>;
  sortColumn: string = '';
  sortDirection: NbSortDirection = NbSortDirection.NONE;
  isLoggedIn = false;
  userProfile: KeycloakProfile | null = null;
  availableAssets: Asset[] = [];
  selectedAssets: string[] = [];
  collections: Collection[] = [];
  selectedSTIGMANCollection: string = '';
  stigmanCollections: Collection[] = [];
  selectedStigmanCollection: string = '';
  selectedFindings: string = '';
  collectionBasicList: any[] = [];
  treeData: any[] = [];
  originalTreeData: any[] = [];
  selectedCollection: any;
  private subs = new SubSink();
  private subscriptions = new Subscription();

  public findings: any[] = [];
  findingsCount: number = 0;
  findingsChart!: Chart;
  findingsChartData: ChartData<'bar'> = {
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

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private poamService: PoamService,
    private dialogService: NbDialogService,
    private http: HttpClient,
    private keycloak: KeycloakService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<AssetEntry>
  ) {
    this.dataSource = this.dataSourceBuilder.create(this.treeData);
    Chart.register(...registerables);
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

  async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.fetchCollections();
    this.validateStigManagerCollection();
  }

  ngAfterViewInit() {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  updateFindingsChartData(findings: any[]): void {
    if (!this.findingsChart) {
      console.warn("Findings chart is not initialized.");
      return;
    }
    const datasets = findings.map((item) => ({
      label: item.severity,
      data: [item.severityCount],
      datalabels: {},
    }));
    this.findingsChart.data.datasets = datasets;
    this.findingsChart.update();
  }

  private initializeChart(): void {
    Chart.defaults.set('plugins.datalabels', {
      display: false,
    });
    this.cdr.detectChanges();
    if (this.findingChart?.nativeElement) {
      this.findingsChart = new Chart(this.findingChart.nativeElement, {
        type: 'bar',
        data: this.findingsChartData,
        plugins: [ChartDataLabels],
        options: this.barChartOptions,
      });
    } else {
      console.error('Unable to initialize chart: Element not available.');
    }
  }

  fetchCollections() {
    this.keycloak.getToken().then((token) => {
      this.sharedService.getCollectionsFromSTIGMAN(token).subscribe({
        next: (data) => {
          this.stigmanCollections = data;
          if (!data || data.length === 0) {
            this.showPopup(
              'No collections available to import. Please ensure you have access to view collections in STIG Manager.'
            );
          } else {
            this.collections = data;
          }
        },
        error: (error) => {
          this.showPopup(
            'You are not connected to STIG Manager or the connection is not properly configured.'
          );
        },
      });
    });
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

  fetchAssetsFromAPI() {
    if (!this.selectedSTIGMANCollection || this.selectedSTIGMANCollection === '') {
      return;
    }

    this.keycloak.getToken().then(token => {
      this.sharedService.getAssetsFromSTIGMAN(this.selectedSTIGMANCollection, token).subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.showPopup('No assets found for the selected collection.');
          } else {
            this.availableAssets = data;
          }
        },
        error: (error) => {
          this.showPopup('You are not connected to STIG Manager or the connection is not properly configured.');
        }
      });
    });
  }

  onCollectionSelect(collectionId: string) {
    this.selectedSTIGMANCollection = collectionId;
    this.fetchAssetsFromAPI();
  }

  onSTIGManagerCollectionSelect(collectionId: string) {
    this.selectedStigmanCollection = collectionId;
  }

  importSTIGManagerCollection() {
    if (this.selectedStigmanCollection) {
      this.keycloak.getToken().then((token) => {
        forkJoin({
          collectionData: this.sharedService.selectedCollectionFromSTIGMAN(
            this.selectedStigmanCollection,
            token
          ),
          assetsData: this.sharedService.getAssetsFromSTIGMAN(
            this.selectedStigmanCollection,
            token
          ),
        }).subscribe({
          next: (results) => {
            const payload = {
              collection: results.collectionData,
              assets: results.assetsData,
            };
            this.sendSTIGManagerCollectionImportRequest(payload);
          },
          error: (error) => {
            console.error('Error fetching collection or assets data:', error);
          },
        });
      });
    } else {
      console.error('No collection selected');
    }
  }

  private sendSTIGManagerCollectionImportRequest(data: any) {
    this.keycloak.getToken().then((token) => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http
        .post(environment.stigmanCollectionImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => {
            this.showPopup('Import successful');
          },
          error: (error) => {
            console.error('Error during import', error);
            this.showPopup('Error during import: ' + error.message);
          },
        });
    });
  }

  fetchAssetDetails() {
    this.keycloak.getToken().then(token => {
      const assetDetailsObservables = this.selectedAssets.map(assetId =>
        this.sharedService.selectedAssetsFromSTIGMAN(assetId, token)
      );
      forkJoin(assetDetailsObservables).subscribe(results => {
        this.importAssets(results);
      });
    });
  }

  onImportAssetsButtonClick() {
    if (this.selectedAssets.length > 0) {
      this.fetchAssetDetails();
    } else {
      console.error('No assets selected');
    }
  }


  importAssets(assetDetails: any[]) {
    const payload = {
      assets: assetDetails
    };
    this.sendSTIGManagerAssetImportRequest(payload);
  }

  private sendSTIGManagerAssetImportRequest(data: any) {
    this.keycloak.getToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http.post(environment.stigmanAssetImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => {
            this.showPopup('Import successful');
          },
          error: (error) => {
            console.error('Error during import', error);
            this.showPopup('Error during import: ' + error.message);
          }
        });
    });
  }

  validateStigManagerCollection() {
    this.keycloak.getToken().then((token) => {
      forkJoin([
        this.sharedService.getCollectionsFromSTIGMAN(token).pipe(
          catchError(err => {
            console.error('Failed to fetch from STIGMAN:', err);
            return of([]);
          })
        ),
        this.collectionService.getCollectionBasicList().pipe(
          catchError(err => {
            console.error('Failed to fetch basic collection list:', err);
            return of([]);
          })
        )
      ]).subscribe(([stigmanData, basicListData]) => {
        const stigmanCollectionsMap = new Map(stigmanData.map(collection => [collection.name, collection]));
        const basicListCollectionsMap = new Map(basicListData.map(collection => [collection.collectionId, collection]));

        const selectedCollection = basicListCollectionsMap.get(this.selectedCollection);
        const selectedCollectionName = selectedCollection?.collectionName;
        const stigmanCollection = selectedCollectionName ? stigmanCollectionsMap.get(selectedCollectionName) : undefined;

        if (!stigmanCollection || !selectedCollectionName) {
          this.showPopup('Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are creating the POAM in the correct collection.');
          return;
        }

        this.getAffectedAssetGrid(token);
      });
    });
  }

  getAffectedAssetGrid(token: string) {
    this.sharedService.getAffectedAssetsFromSTIGMAN(token, this.selectedCollection).subscribe({
      next: (data) => {
        const mappedData = data.map(item => ({
          data: {
            'Group ID': item.groupId,
            'Rule Title': item.rules[0].title,
            'ruleId': item.rules[0].ruleId,
            'Benchmark ID': item.stigs[0].benchmarkId,
            'Severity': item.severity === 'high' ? 'CAT I - Critical/High' :
              item.severity === 'medium' ? 'CAT II - Medium' :
                item.severity === 'low' ? 'CAT III - Low' : item.severity,
            'Asset Count': item.assetCount
          },
          children: item.assets.map((asset: { name: any; assetId: any; }) => ({
            data: {
              'Rule Title': asset.name,
              'Benchmark ID': 'Asset ID: ' + asset.assetId,
            }
          }))
        }));
        this.originalTreeData = [...mappedData];
        this.treeData = [...mappedData];
        this.dataSource.setData(this.treeData);
        this.findingsCount = this.treeData.length;
        const severityGroups = data.reduce((groups: any, item: any) => {
          const severity = item.severity === 'high' ? 'CAT I - Critical/High' :
            item.severity === 'medium' ? 'CAT II - Medium' :
              item.severity === 'low' ? 'CAT III - Low' : item.severity;
          if (!groups[severity]) {
            groups[severity] = 0;
          }
          groups[severity]++;
          return groups;
        }, {});

        const findings = Object.entries(severityGroups).map(([severity, count]) => ({
          severity,
          severityCount: count
        }));

        const allSeverities = ['CAT I - Critical/High', 'CAT II - Medium', 'CAT III - Low'];
        allSeverities.forEach(severity => {
          if (!findings.find(finding => finding.severity === severity)) {
            findings.push({ severity, severityCount: 0 });
          }
        });

        findings.sort((a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity));

        this.updateFindingsChartData(findings);

        this.selectedFindings = 'No Existing POAM';
        this.filterFindings();
      },
      error: (err) => console.error('Failed to fetch affected assets from STIGMAN:', err),
    });
  }


  filterFindings() {
    this.sharedService.getExistingVulnerabilityPoams().subscribe({
        next: (response: any) => {
          const existingPoams = response;
          this.updateChartAndGrid(existingPoams);
        },
        error: (error) => {
          console.error('Error retrieving existing POAMs:', error);
          this.showPopup("Error retrieving existing POAMs. Please try again.");
      }
    });
  }

  updateChartAndGrid(existingPoams: any[]) {
    const filteredTreeData = this.treeData.map(item => {
      const hasExistingPoam = existingPoams.some(poam => poam.vulnerabilityId === item.data['Group ID']);
      if (this.selectedFindings === 'All' ||
        (this.selectedFindings === 'Has Existing POAM' && hasExistingPoam) ||
        (this.selectedFindings === 'No Existing POAM' && !hasExistingPoam)) {
        return item;
      }
      return null;
    }).filter(item => item !== null);

    this.dataSource.setData(filteredTreeData);
    this.findingsCount = filteredTreeData.length;
    const severityGroups = filteredTreeData.reduce((groups: any, item: any) => {
      const severity = item.data['Severity'];
      if (!groups[severity]) {
        groups[severity] = 0;
      }
      groups[severity]++;
      return groups;
    }, {});

    const findings = Object.entries(severityGroups).map(([severity, count]) => ({
      severity,
      severityCount: count
    }));

    const allSeverities = ['CAT I - Critical/High', 'CAT II - Medium', 'CAT III - Low'];
    allSeverities.forEach(severity => {
      if (!findings.find(finding => finding.severity === severity)) {
        findings.push({ severity, severityCount: 0 });
      }
    });

    findings.sort((a, b) => allSeverities.indexOf(a.severity) - allSeverities.indexOf(b.severity));

    this.updateFindingsChartData(findings);
  }

  addPoam(row: any) {
    const ruleId = row.data['ruleId'];

    this.keycloak.getToken().then((token) => {
      this.sharedService.getRuleDataFromSTIGMAN(token, ruleId).subscribe({
        next: (ruleData: any) => {
          const ruleDataString = `# Rule data from STIGMAN
## Discussion
${ruleData.detail.vulnDiscussion}
---

## Check
${ruleData.check.content}
---

## Fix
${ruleData.fix.text}
---`;

          this.sharedService.getPoamsByVulnerabilityId(row.data['Group ID']).subscribe({
            next: (response: any) => {
              if (response && response.length > 0) {
                const poam = response[0];
                this.router.navigate(['/poam-details/' + poam.poamId], {
                  state: {
                    vulnerabilitySource: 'STIG',
                    vulnerabilityId: row.data['Group ID'],
                    benchmarkId: row.data['Benchmark ID'],
                    severity: row.data['Severity'],
                    ruleData: ruleDataString
                  }
                });
              } else {
                this.router.navigate(['/poam-details/ADDPOAM'], {
                  state: {
                    vulnerabilitySource: 'STIG',
                    vulnerabilityId: row.data['Group ID'],
                    benchmarkId: row.data['Benchmark ID'],
                    severity: row.data['Severity'],
                    ruleData: ruleDataString
                  }
                });
              }
            },
            error: (error) => {
              console.error('Error retrieving POAM:', error);
              this.showPopup("Error creating POAM. Please try again.");
            }
          });
        },
        error: (error) => {
          console.error('Error retrieving rule data from STIGMAN:', error);
          this.showPopup("Error retrieving rule data. Please try again.");
        }
      });
    }).catch((error) => {
      console.error('Error fetching token:', error);
      this.showPopup("Error fetching token. Please try again.");
    });
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

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
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
