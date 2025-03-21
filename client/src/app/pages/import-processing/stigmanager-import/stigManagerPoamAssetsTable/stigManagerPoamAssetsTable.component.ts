/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AfterViewInit, Component, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AssetDeltaService } from '../../../admin-processing/asset-delta/asset-delta.service';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { SharedService } from 'src/app/common/services/shared.service';
import { Subscription, forkJoin } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
interface ExportColumn {
  title: string;
  dataKey: string;
}

interface Label {
  color: string;
  description: string;
  labelId: number;
  name: string;
  uses: number;
}

@Component({
  selector: 'cpat-stigmanager-poam-assets-table',
  templateUrl: './stigManagerPoamAssetsTable.component.html',
  styleUrls: ['./stigManagerPoamAssetsTable.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    FormsModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    MultiSelectModule,
    TabsModule,
    TableModule,
    ToastModule,
    TagModule,
  ],
})
export class STIGManagerPoamAssetsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() stigmanCollectionId!: number;
  @Input() groupId!: string;
  @Input() benchmarkId: string;

  @ViewChildren(Table) tables: QueryList<Table>;
  @ViewChild('ms') multiSelect!: MultiSelect;

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  affectedAssets: any[] = [];
  labels: Label[] = [];
  totalRecords: number = 0;
  filterValue: string = '';
  assetDeltaList: any;
  assetsByTeam: { [teamId: string]: any[] } = {};
  teamTabs: { teamId: string, teamName: string, assets: any[] }[] = [];
  activeTab: string = 'all';
  loading: boolean = true;
  private tableMap = new Map<string, Table>();
  selectedCollection: any;
  private subscriptions = new Subscription();

  constructor(
    private assetDeltaService: AssetDeltaService,
    private messageService: MessageService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.initColumnsAndFilters();
    this.loadAssetDeltaList();

    this.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];

    if (this.stigmanCollectionId && this.groupId) {
      this.loadData();
    } else {
      this.showErrorMessage(
        'No vulnerability ID provided. Please enter a vulnerability ID and re-open the assets tab.'
      );
    }
  }

  ngAfterViewInit() {
    this.updateTableReferences();

    this.tables.changes.subscribe(() => {
      this.updateTableReferences();
    });
  }

  updateTableReferences() {
    this.tableMap.clear();
    const tablesArray = this.tables.toArray();

    this.teamTabs.forEach((tab, index) => {
      if (index < tablesArray.length) {
        this.tableMap.set(tab.teamId, tablesArray[index]);
      }
    });
  }

  loadAssetDeltaList() {
    this.assetDeltaService.getAssetDeltaListByCollection(this.selectedCollection).subscribe({
      next: (response) => {
        this.assetDeltaList = response || [];
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load Asset Delta List'
      })
    });
  }


  loadData() {
    this.loading = true;
    forkJoin({
      poamAssets: this.sharedService.getPOAMAssetsFromSTIGMAN(
        this.stigmanCollectionId,
        this.benchmarkId
      ),
      labels: this.sharedService.getLabelsByCollectionSTIGMAN(this.stigmanCollectionId)
    }).subscribe({
      next: ({ poamAssets, labels }) => {
        this.labels = labels || [];

        if (!poamAssets || poamAssets.length === 0) {
          this.showErrorMessage('No affected assets found.');
          this.loading = false;
          return;
        }

        const matchingItem = poamAssets.find(item => item.groupId === this.groupId);
        if (!matchingItem) {
          this.showErrorMessage(`No assets found with vulnerabilityId: ${this.groupId}`);
          this.loading = false;
          return;
        }

        const mappedAssets = matchingItem.assets.map((asset: { name: string; assetId: number }) => ({
          assetName: asset.name,
          assetId: asset.assetId,
        }));

        this.loadAssetDetails(mappedAssets);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.showErrorMessage('Failed to fetch data. Please try again later.');
        this.loading = false;
      }
    });
  }

  loadAssetDetails(mappedAssets: any[]) {
    this.sharedService.getAssetDetailsFromSTIGMAN(this.stigmanCollectionId)
      .subscribe({
        next: (assetDetails) => {
          if (!assetDetails || assetDetails.length === 0) {
            console.error('No asset details found.');
            this.affectedAssets = mappedAssets;
            return;
          }

          this.affectedAssets = mappedAssets.map(asset => {
            const details = assetDetails.find(detail => detail.assetId === asset.assetId);
            if (!details) return asset;

            return {
              ...asset,
              ...(details.description && { description: details.description }),
              ...(details.fqdn && { fqdn: details.fqdn }),
              ...(details.ip && { ip: details.ip }),
              ...(details.labelIds && { labelIds: details.labelIds }),
              ...(details.mac && { mac: details.mac }),
              ...(details.metadata && { metadata: details.metadata }),
              ...(details.statusStats && { statusStats: details.statusStats }),
              ...(details.stigGrants && { stigGrants: details.stigGrants }),
              ...(details.stigs && { stigs: details.stigs }),
              ...(details.collection && {
                collectionId: details.collection.collectionId,
              }),
            };
          });
          this.totalRecords = this.affectedAssets.length;

          this.matchAssetsWithTeams();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to fetch asset details from STIGMAN:', error);
          this.showErrorMessage('Failed to fetch asset details. Please try again later.');
          this.affectedAssets = mappedAssets;
          this.loading = false;
        }
      });
  }

  matchAssetsWithTeams() {
    if (!this.assetDeltaList?.assets || !this.affectedAssets) return;

    this.assetsByTeam = {};

    this.affectedAssets.forEach(asset => {
      const assetName = asset.assetName?.toLowerCase() || '';
      const fqdn = asset.fqdn?.toLowerCase() || '';

      this.assetDeltaList.assets.forEach(deltaAsset => {
        const deltaKey = deltaAsset.key.toLowerCase();

        if (assetName === deltaKey || fqdn === deltaKey) {
          if (deltaAsset.assignedTeams && Array.isArray(deltaAsset.assignedTeams)) {
            deltaAsset.assignedTeams.forEach(team => {
              const teamId = team.assignedTeamId;
              const teamName = team.assignedTeamName;

              if (!this.assetsByTeam[teamId]) {
                this.assetsByTeam[teamId] = [];
              }

              if (!this.assetsByTeam[teamId].some(a => a.assetId === asset.assetId)) {
                this.assetsByTeam[teamId].push({
                  ...asset,
                  assignedTeamId: teamId,
                  assignedTeamName: teamName
                });
              }
            });
          }
          else if (deltaAsset.assignedTeam) {
            const teamId = deltaAsset.assignedTeam.assignedTeamId;
            const teamName = deltaAsset.assignedTeam.assignedTeamName;

            if (!this.assetsByTeam[teamId]) {
              this.assetsByTeam[teamId] = [];
            }

            if (!this.assetsByTeam[teamId].some(a => a.assetId === asset.assetId)) {
              this.assetsByTeam[teamId].push({
                ...asset,
                assignedTeamId: teamId,
                assignedTeamName: teamName
              });
            }
          }
        }
      });
    });

    this.createTeamTabs();
  }

  createTeamTabs() {
    this.teamTabs = [
      { teamId: 'all', teamName: 'All Assets', assets: this.affectedAssets }
    ];

    Object.keys(this.assetsByTeam).forEach(teamId => {
      if (this.assetsByTeam[teamId].length > 0) {
        const teamName = this.assetsByTeam[teamId][0].assignedTeamName || `Team ${teamId}`;
        this.teamTabs.push({
          teamId: teamId,
          teamName: teamName,
          assets: this.assetsByTeam[teamId]
        });
      }
    });
  }

  getAssetLabels(asset: any): Label[] {
    return (
      asset.labelIds
        ?.map((labelId: number) => this.labels.find(label => label.labelId === labelId))
        .filter((label: Label | undefined): label is Label => label !== undefined) || []
    );
  }

  initColumnsAndFilters() {
    this.cols = [
      {
        field: 'assetName',
        header: 'Asset Name',
        width: '200px',
        filterable: true,
      },
      { field: 'fqdn', header: 'FQDN', width: '200px', filterable: true },
      { field: 'ip', header: 'IP Address', width: '150px', filterable: true },
      { field: 'mac', header: 'MAC Address', width: '150px', filterable: true },
      { field: 'labels', header: 'Labels', width: '200px', filterable: true },
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.resetColumnSelections();
  }

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: true,
    });
  }

  clear() {
    const activeTable = this.getActiveTable();
    if (activeTable) {
      activeTable.clear();
    }
    this.filterValue = '';
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const activeTable = this.getActiveTable();
    if (activeTable) {
      activeTable.filterGlobal(value, 'contains');
    }
  }

  private getActiveTable(): Table | null {
    const table = this.tableMap.get(this.activeTab);
    if (!table) {
      console.warn(`No table found for tab ${this.activeTab}`);

      if (this.tables && this.tables.length > 0) {
        return this.tables.first;
      }
    }
    return table || null;
  }

  exportCSV() {
    const activeTable = this.getActiveTable();
    if (activeTable) {
      activeTable.exportCSV();
    }
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols;
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
