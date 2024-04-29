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
import { Router } from '@angular/router';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Chart, ChartData, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { Observable, Subscription, catchError, forkJoin, of } from 'rxjs';
import { SubSink } from "subsink";
import { ImportService } from '../../import-processing/import.service';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../../Shared/shared.service';
import { CollectionsService } from '../../collection-processing/collections.service';
import { UsersService } from '../../admin-processing/user-processing/users.service';
import { PoamAssetUpdateService } from '../../import-processing/stigmanager-import/stigmanager-update/stigmanager-update.service';


interface Asset {
  assetId: any;
  name: string;
}

interface AssetEntry {
  groupId: string;
  title: string;
  severity: string;
  assetCount: number;
  assets?: AssetEntry[];
}

@Component({
  selector: 'cpat-stigmanager-import',
  templateUrl: './stigmanager-import.component.html',
  styleUrls: ['./stigmanager-import.component.scss']
})
export class STIGManagerImportComponent implements OnInit, AfterViewInit, OnDestroy {
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
  selectedFindings: string = '';
  collectionBasicList: any[] = [];
  treeData: any[] = [];
  originalTreeData: any[] = [];
  selectedCollection: any;
  stigmanCollection: { name: string; description: string;  collectionId: string; } | undefined;
  user: any;
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
    private poamAssetUpdateService: PoamAssetUpdateService,
    private userService: UsersService,
    private dialogService: NbDialogService,
    private importService: ImportService,
    private keycloak: KeycloakService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<AssetEntry>
  ) {
    this.dataSource = this.dataSourceBuilder.create(this.treeData);
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.isLoggedIn = this.keycloak.isLoggedIn();

    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response && response.userId) {
          this.user = response;
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
    this.validateStigManagerCollection();
  }

  ngAfterViewInit() {
    this.initializeChart();
    this.cdr.detectChanges();
  }

  async stigManagerAssetSync() {
    try {
      await this.poamAssetUpdateService.updateOpenPoamAssets(this.selectedCollection, this.stigmanCollection!.collectionId, this.user.userId);
      this.showPopup("POAM Asset Lists have been updated.");
    } catch (error) {
      console.error('Failed to update POAM assets:', error);
      this.showPopup("Failed to update POAM Asset Lists. Please try again.");
    }
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

  fetchAssetsFromAPI(collectionId: string) {
    this.keycloak.getToken().then(token => {
      this.sharedService.getAssetsFromSTIGMAN(collectionId, token).subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.showPopup('No assets found for the selected collection.');
          } else {
            this.availableAssets = data;
          }
        },
        error: () => {
          this.showPopup('You are not connected to STIG Manager or the connection is not properly configured.');
        }
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

  importAssets(assetDetails: any[]) {
    const assets = assetDetails.map(asset => {
      const { assetId, ...rest } = asset;
      return rest;
    });
    const requestBody = { assets: assets };
    this.importService.postStigManagerAssets(requestBody).subscribe({
      next: () => {
        this.showPopup('Import successful');
      },
      error: (error) => {
        console.error('Error during import', error);
        this.showPopup('Error during import: ' + error.message);
      }
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

        const selectedCollection = basicListCollectionsMap.get(this.user.lastCollectionAccessedId);
        const selectedCollectionName = selectedCollection?.collectionName;
        this.stigmanCollection = selectedCollectionName ? stigmanCollectionsMap.get(selectedCollectionName) : undefined;
        if (!this.stigmanCollection || !selectedCollectionName) {
          this.showPopup('Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are viewing a STIG Manager collection.');
          return;
        }
        this.fetchAssetsFromAPI(this.stigmanCollection.collectionId);
        this.getAffectedAssetGrid(token, this.stigmanCollection.collectionId);
      });
    });
  }

  getAffectedAssetGrid(token: string, stigmanCollection: string) {
    this.sharedService.getAffectedAssetsFromSTIGMAN(token, stigmanCollection).subscribe({
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
