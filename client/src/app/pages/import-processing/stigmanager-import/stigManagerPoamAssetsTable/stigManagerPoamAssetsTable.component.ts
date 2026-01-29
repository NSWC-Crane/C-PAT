/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, inject, viewChildren, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Table, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/common/services/shared.service';
import { CsvExportService } from '../../../../common/utils/csv-export.service';
import { getErrorMessage } from '../../../../common/utils/error-utils';
import { AssetDeltaService } from '../../../admin-processing/asset-delta/asset-delta.service';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-stigmanager-poam-assets-table',
  templateUrl: './stigManagerPoamAssetsTable.component.html',
  styleUrls: ['./stigManagerPoamAssetsTable.component.scss'],
  standalone: true,
  imports: [ButtonModule, CardModule, CommonModule, FormsModule, InputIconModule, IconFieldModule, InputTextModule, MultiSelectModule, TabsModule, TableModule, ToastModule, TagModule, TooltipModule]
})
export class STIGManagerPoamAssetsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private assetDeltaService = inject(AssetDeltaService);
  private csvExportService = inject(CsvExportService);
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);

  @Input() stigmanCollectionId!: number;
  @Input() groupId!: string;
  @Input() associatedVulnerabilities: any[] = [];

  readonly tables = viewChildren(Table);
  readonly multiSelect = viewChild<MultiSelect>('ms');

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  affectedAssets: any[] = [];
  combinedAssets: any[] = [];
  totalRecords: number = 0;
  filterValue: string = '';
  assetDeltaList: any;
  assetsByTeam: { [teamId: string]: any[] } = {};
  teamTabs: { teamId: string; teamName: string; assets: any[] }[] = [];
  activeTab: string = 'all';
  loading: boolean = true;
  private tableMap = new Map<string, Table>();
  selectedCollection: any;
  private subscriptions = new Subscription();

  constructor() {
    effect(() => {
      const tablesArray = this.tables();

      if (tablesArray.length > 0) {
        this.updateTableReferences();
      }
    });
  }

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      })
    );
    this.initColumnsAndFilters();
    this.loadAssetDeltaList();

    this.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];

    if (this.stigmanCollectionId) {
      if (this.groupId) {
        this.loadData();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No vulnerability ID provided. Please enter a vulnerability ID and re-open the assets tab.'
        });
      }
    }
  }

  ngAfterViewInit() {
    this.updateTableReferences();
  }

  updateTableReferences() {
    this.tableMap.clear();
    const tablesArray = this.tables();

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
      error: (error) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load Asset Delta List: ${getErrorMessage(error)}`
        })
    });
  }

  loadData() {
    this.loading = true;
    const associatedVulnIds = this.associatedVulnerabilities.map((vuln) => (typeof vuln === 'string' ? vuln : typeof vuln === 'object' && vuln.associatedVulnerability ? vuln.associatedVulnerability : null)).filter((id) => id !== null);

    const allVulnIds = [this.groupId, ...associatedVulnIds];

    this.sharedService.getPOAMAssetsFromSTIGMAN(this.stigmanCollectionId).subscribe({
      next: (poamAssets) => {
        let allAssets: any[] = [];

        allVulnIds.forEach((vulnId) => {
          const matchingItem = poamAssets.find((item) => item.groupId === vulnId);

          if (matchingItem?.assets) {
            const assetsForVuln = matchingItem.assets.map((asset: any) => ({
              assetName: asset.name,
              assetId: asset.assetId,
              sourceVulnIds: [vulnId]
            }));

            allAssets = [...allAssets, ...assetsForVuln];
          }
        });

        const assetMap = new Map<number, any>();

        allAssets.forEach((asset) => {
          if (!assetMap.has(asset.assetId)) {
            assetMap.set(asset.assetId, asset);
          } else {
            const existing = assetMap.get(asset.assetId)!;

            existing.sourceVulnIds = [...new Set([...existing.sourceVulnIds, ...asset.sourceVulnIds])];
          }
        });

        this.loadAssetDetails(Array.from(assetMap.values()));
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch POAM assets: ${getErrorMessage(error)}`
        });
        this.loading = false;
      }
    });
  }

  loadAssetDetails(mappedAssets: any[]) {
    this.sharedService.getAssetDetailsFromSTIGMAN(this.stigmanCollectionId).subscribe({
      next: (assetDetails) => {
        if (!assetDetails || assetDetails.length === 0) {
          console.error('No asset details found.');
          this.affectedAssets = mappedAssets;

          return;
        }

        this.affectedAssets = mappedAssets.map((asset) => {
          const details = assetDetails.find((detail) => detail.assetId === asset.assetId);

          if (!details) return asset;

          return {
            ...asset,
            ...(details.description && { description: details.description }),
            ...(details.fqdn && { fqdn: details.fqdn }),
            ...(details.ip && { ip: details.ip }),
            ...(details.labels && { labels: details.labels }),
            ...(details.mac && { mac: details.mac }),
            ...(details.metadata && { metadata: details.metadata }),
            ...(details.statusStats && { statusStats: details.statusStats }),
            ...(details.stigGrants && { stigGrants: details.stigGrants }),
            ...(details.stigs && { stigs: details.stigs }),
            ...(details.collection && {
              collectionId: details.collection.collectionId
            })
          };
        });
        this.totalRecords = this.affectedAssets.length;

        this.matchAssetsWithTeams();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch asset details: ${getErrorMessage(error)}`
        });
        this.affectedAssets = mappedAssets;
        this.loading = false;
      }
    });
  }

  matchAssetsWithTeams() {
    if (!this.assetDeltaList?.assets || !this.affectedAssets) return;
    this.assetsByTeam = {};
    this.affectedAssets = this.affectedAssets.map((asset) => {
      const assetName = asset.assetName?.toLowerCase() || '';
      const fqdn = asset.fqdn?.toLowerCase() || '';
      const teams: Array<{ assignedTeamId: string; assignedTeamName: string }> = [];

      this.assetDeltaList.assets.forEach((deltaAsset) => {
        const deltaKey = deltaAsset.key.toLowerCase();

        if (assetName.includes(deltaKey) || fqdn.includes(deltaKey)) {
          if (Array.isArray(deltaAsset?.assignedTeams)) {
            deltaAsset.assignedTeams.forEach((team) => {
              if (!teams.some((t) => t.assignedTeamId === team.assignedTeamId)) {
                teams.push({
                  assignedTeamId: team.assignedTeamId,
                  assignedTeamName: team.assignedTeamName
                });
              }
            });
          } else if (deltaAsset.assignedTeam) {
            if (!teams.some((t) => t.assignedTeamId === deltaAsset.assignedTeam.assignedTeamId)) {
              teams.push({
                assignedTeamId: deltaAsset.assignedTeam.assignedTeamId,
                assignedTeamName: deltaAsset.assignedTeam.assignedTeamName
              });
            }
          }
        }
      });

      if (teams.length > 0) {
        return {
          ...asset,
          assignedTeams: teams
        };
      }

      return asset;
    });

    this.affectedAssets.forEach((asset) => {
      if (asset.assignedTeams && asset.assignedTeams.length > 0) {
        asset.assignedTeams.forEach((team) => {
          const teamId = team.assignedTeamId;
          const teamName = team.assignedTeamName;

          if (!this.assetsByTeam[teamId]) {
            this.assetsByTeam[teamId] = [];
          }

          if (!this.assetsByTeam[teamId].some((a) => a.assetId === asset.assetId)) {
            this.assetsByTeam[teamId].push({
              ...asset,
              assignedTeamId: teamId,
              assignedTeamName: teamName
            });
          }
        });
      }
    });

    this.createTeamTabs();
  }

  createTeamTabs() {
    this.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: this.affectedAssets }];

    Object.keys(this.assetsByTeam).forEach((teamId) => {
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

  initColumnsAndFilters() {
    this.cols = [
      {
        field: 'assetName',
        header: 'Asset Name',
        width: '200px',
        filterable: true
      },
      { field: 'sourceVulnIds', header: 'Source', width: '200px', filterable: true },
      { field: 'fqdn', header: 'FQDN', width: '200px', filterable: true },
      { field: 'ip', header: 'IP Address', width: '150px', filterable: true },
      { field: 'mac', header: 'MAC Address', width: '150px', filterable: true },
      { field: 'labels', header: 'Labels', width: '200px', filterable: true },
      { field: 'teamAssigned', header: 'Team', width: '120px', filterable: false }
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
    this.resetColumnSelections();
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

      const tablesArray = this.tables();

      if (tablesArray && tablesArray.length > 0) {
        return tablesArray[0];
      }
    }

    return table || null;
  }

  exportCSV() {
    const activeTab = this.teamTabs.find((tab) => tab.teamId === this.activeTab);
    const assetsToExport = activeTab?.assets || this.affectedAssets;

    if (!assetsToExport || assetsToExport.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export'
      });

      return;
    }

    const processedData = assetsToExport.map((asset) => {
      const processedAsset = { ...asset };

      if (asset.labels && Array.isArray(asset.labels)) {
        processedAsset.labels = asset.labels.map((label: any) => label.name).join(', ');
      }

      if (asset.assignedTeams && Array.isArray(asset.assignedTeams)) {
        processedAsset.teamAssigned = asset.assignedTeams.map((team: any) => team.assignedTeamName).join(', ');
      }

      if (asset.sourceVulnIds && Array.isArray(asset.sourceVulnIds)) {
        processedAsset.sourceVulnIds = asset.sourceVulnIds.join(', ');
      }

      return processedAsset;
    });

    this.csvExportService.exportToCsv(processedData, {
      filename: `CPAT_${this.groupId}-affected-assets-${new Date().toISOString().split('T')[0]}`,
      columns: this.selectedColumns,
      includeTimestamp: false
    });
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols;
  }

  toggleAddColumnOverlay() {
    const multiSelect = this.multiSelect();

    if (multiSelect) {
      if (multiSelect.overlayVisible) {
        multiSelect.hide();
      } else {
        multiSelect.show();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
