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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, Subscription, catchError, map, of } from 'rxjs';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { AssetDeltaService } from '../../../../admin-processing/asset-delta/asset-delta.service';
import { ImportService } from '../../../import.service';

interface Reference {
  type: string;
  value: string;
}
interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-tenable-assets-table',
  templateUrl: './tenableAssetsTable.component.html',
  styleUrls: ['./tenableAssetsTable.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TabsModule, ButtonModule, InputTextModule, InputIconModule, IconFieldModule, TextareaModule, MultiSelectModule, DialogModule, ToastModule, TooltipModule, TagModule]
})
export class TenableAssetsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private assetDeltaService = inject(AssetDeltaService);
  private importService = inject(ImportService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private sharedService = inject(SharedService);

  @Input() pluginID!: string;
  @Input() assetProcessing: boolean = false;
  @Input() tenableRepoId: number;
  @Input() associatedVulnerabilities: any[] = [];
  readonly tables = viewChildren(Table);
  readonly multiSelect = viewChild.required<MultiSelect>('ms');

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  cveReferences: Reference[] = [];
  iavReferences: Reference[] = [];
  otherReferences: Reference[] = [];
  affectedAssets: any[] = [];
  selectedVulnerability: any;
  displayDialog: boolean = false;
  parsedVprContext: any[] = [];
  isLoading: boolean = true;
  is30DayFilterActive: boolean = false;
  formattedDescription: SafeHtml = '';
  pluginData: any;
  totalRecords: number = 0;
  filterValue: string = '';
  selectedCollection: any;
  assetDeltaList: any;
  assetsByTeam: { [teamId: string]: any[] } = {};
  teamTabs: { teamId: string; teamName: string; assets: any[] }[] = [];
  activeTab: string = 'all';
  private tableMap = new Map<string, Table>();
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
    this.activeTab = 'all';

    if (this.pluginID && this.tenableRepoId) {
      this.getAffectedAssetsForAllPlugins();
    } else if (this.assetProcessing && this.tenableRepoId) {
      this.getAffectedAssets({ first: 0, rows: 25 } as TableLazyLoadEvent);
    }
  }

  ngAfterViewInit() {
    this.updateTableReferences();
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'pluginName', header: 'Name', width: '200px', filterable: true },
      { field: 'family', header: 'Family', width: '150px', filterable: true },
      {
        field: 'sourcePluginIDs',
        header: 'Source',
        width: '150px',
        filterable: true
      },
      {
        field: 'severity',
        header: 'Severity',
        width: '100px',
        filterable: true
      },
      { field: 'vprScore', header: 'VPR', width: '100px', filterable: true },
      { field: 'ips', header: 'IP Address', width: '150px' },
      { field: 'acrScore', header: 'ACR', width: '100px', filterable: false },
      {
        field: 'assetExposureScore',
        header: 'AES',
        width: '100px',
        filterable: false
      },
      {
        field: 'netbiosName',
        header: 'NetBIOS',
        width: '150px',
        filterable: false
      },
      { field: 'dnsName', header: 'DNS', width: '200px', filterable: false },
      {
        field: 'macAddress',
        header: 'MAC Address',
        width: '150px',
        filterable: false
      },
      { field: 'port', header: 'Port', width: '100px', filterable: false },
      {
        field: 'protocol',
        header: 'Protocol',
        width: '100px',
        filterable: false
      },
      { field: 'uuid', header: 'Agent ID', width: '200px', filterable: false },
      {
        field: 'hostUUID',
        header: 'Host ID',
        width: '200px',
        filterable: false
      },
      { field: 'teamAssigned', header: 'Team', width: '120px', filterable: false }
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
    this.selectedColumns = this.cols.filter((col) => ['sourcePluginIDs', 'pluginName', 'family', 'severity', 'ips', 'netbiosName', 'dnsName', 'port', 'protocol', 'teamAssigned'].includes(col.field));
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

  getAffectedAssetsForAllPlugins() {
    this.isLoading = true;

    const associatedPluginIds = this.associatedVulnerabilities.map((vuln) => (typeof vuln === 'string' ? vuln : typeof vuln === 'object' && vuln.associatedVulnerability ? vuln.associatedVulnerability : null)).filter((id) => id !== null);

    const allPluginIds = [this.pluginID, ...associatedPluginIds];

    const filters = [
      {
        id: 'pluginID',
        filterName: 'pluginID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: allPluginIds.join(',')
      },
      {
        id: 'repository',
        filterName: 'repository',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: [{ id: this.tenableRepoId.toString() }]
      }
    ];

    if (this.is30DayFilterActive) {
      filters.push({
        id: 'lastSeen',
        filterName: 'lastSeen',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '0:30'
      });
    }

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
        endOffset: 5000,
        filters: filters,
        vulnTool: 'listvuln'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.importService.postTenableAnalysis(analysisParams).subscribe({
      next: (data) => {
        if (!data?.response?.results) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No assets found for these vulnerabilities'
          });
          this.isLoading = false;

          return;
        }

        const processedAssets = data.response.results.map((asset: any) => {
          const sourcePluginID = asset.pluginID || '';

          return {
            ...asset,
            pluginName: asset.name || '',
            family: asset.family?.name || '',
            severity: asset.severity?.name || '',
            sourcePluginIDs: [sourcePluginID]
          };
        });

        const assetMap = new Map();

        processedAssets.forEach((asset) => {
          const key = `${asset.hostUUID || ''}-${asset.netbiosName || ''}-${asset.dnsName || ''}-${asset.macAddress || ''}`;

          if (!assetMap.has(key)) {
            assetMap.set(key, asset);
          } else {
            const existing = assetMap.get(key);

            existing.sourcePluginIDs = [...new Set([...existing.sourcePluginIDs, ...asset.sourcePluginIDs])];
          }
        });

        this.affectedAssets = Array.from(assetMap.values());
        this.totalRecords = this.affectedAssets.length;
        this.isLoading = false;

        this.matchAssetsWithTeams();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching affected assets: ${getErrorMessage(error)}`
        });
        this.isLoading = false;
      }
    });
  }

  getAffectedAssetsByPluginId(pluginID: string, tenableRepoId: number): Observable<any[]> {
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
        endOffset: 5000,
        filters: [
          {
            id: 'pluginID',
            filterName: 'pluginID',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: pluginID
          },
          {
            id: 'repository',
            filterName: 'repository',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: [{ id: tenableRepoId.toString() }]
          }
        ],
        vulnTool: 'listvuln'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    return this.importService.postTenableAnalysis(analysisParams).pipe(
      map((data) =>
        data.response.results.map((asset: any) => {
          const defaultAsset = {
            pluginID: '',
            pluginName: '',
            family: { name: '' },
            severity: { name: '' },
            vprScore: ''
          };

          return {
            ...defaultAsset,
            ...asset,
            pluginName: asset.name || '',
            family: asset.family?.name || '',
            severity: asset.severity?.name || '',
            sourcePluginID: pluginID
          };
        })
      ),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching assets for plugin ${pluginID}: ${getErrorMessage(error)}`
        });

        return of([]);
      })
    );
  }

  matchAssetsWithTeams() {
    if (!this.assetDeltaList?.assets || !this.affectedAssets) return;
    this.assetsByTeam = {};
    this.affectedAssets = this.affectedAssets.map((asset) => {
      const netbiosName = asset.netbiosName?.toLowerCase() || '';
      const dnsName = asset.dnsName?.toLowerCase() || '';
      const teams: Array<{ assignedTeamId: string; assignedTeamName: string }> = [];

      this.assetDeltaList.assets.forEach((deltaAsset) => {
        const deltaKey = deltaAsset.key.toLowerCase();

        if (netbiosName.includes(deltaKey) || dnsName.includes(deltaKey)) {
          if (deltaAsset.assignedTeams && Array.isArray(deltaAsset.assignedTeams)) {
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

          if (!this.assetsByTeam[teamId].some((a) => a.hostUUID === asset.hostUUID && a.netbiosName === asset.netbiosName && a.dnsName === asset.dnsName && a.macAddress === asset.macAddress)) {
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

  lazyOrNot(event: TableLazyLoadEvent) {
    if (this.pluginID && !this.assetProcessing) {
      this.getAffectedAssetsByPluginId(this.pluginID, this.tenableRepoId);
    } else if (this.assetProcessing) {
      this.getAffectedAssets(event);
    }
  }

  getAffectedAssets(event: TableLazyLoadEvent) {
    if (!this.tenableRepoId) return;

    this.isLoading = true;

    const startOffset = event.first ?? 0;
    const endOffset = startOffset + (event.rows ?? 25);
    const repoFilter = {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: this.tenableRepoId.toString() }]
    };

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
        startOffset: startOffset,
        endOffset: endOffset,
        filters: [repoFilter],
        vulnTool: 'listvuln'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.importService.postTenableAnalysis(analysisParams).subscribe({
      next: (data) => {
        this.affectedAssets = data.response.results.map((asset: any) => {
          const defaultAsset = {
            pluginID: '',
            pluginName: '',
            family: { name: '' },
            severity: { name: '' },
            vprScore: ''
          };

          return {
            ...defaultAsset,
            ...asset,
            pluginName: asset.name || '',
            family: asset.family?.name || '',
            severity: asset.severity?.name || ''
          };
        });

        this.totalRecords = data.response.totalRecords;

        if (this.assetProcessing) {
          this.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: this.affectedAssets }];
        } else {
          this.matchAssetsWithTeams();
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching affected assets: ${getErrorMessage(error)}`
        });
        this.isLoading = false;
      }
    });
  }

  showDetails(vulnerability: any) {
    if (!vulnerability || !vulnerability.pluginID) {
      throw new Error('Invalid vulnerability data');
    }

    this.importService.getTenablePlugin(vulnerability.pluginID).subscribe({
      next: (data) => {
        if (!data || !data.response) {
          throw new Error('Invalid response from getTenablePlugin');
        }

        this.pluginData = data.response;
        this.formattedDescription = this.pluginData.description ? this.sanitizer.bypassSecurityTrustHtml(this.pluginData.description.replace(/\n\n/g, '<br>')) : '';

        if (this.pluginData.xrefs && this.pluginData.xrefs.length > 0) {
          this.parseReferences(this.pluginData.xrefs);
        } else {
          this.cveReferences = [];
          this.iavReferences = [];
          this.otherReferences = [];
        }

        if (Array.isArray(this.pluginData.vprContext)) {
          this.parseVprContext(this.pluginData.vprContext);
        } else {
          this.parsedVprContext = [];
        }

        this.selectedVulnerability = vulnerability;
        this.displayDialog = true;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching plugin data: ${getErrorMessage(error)}`
        });
      }
    });
  }

  parseVprContext(vprContext: string) {
    try {
      this.parsedVprContext = JSON.parse(vprContext);
    } catch (error) {
      console.error('Failed to parse VPR context:', error);
      this.parsedVprContext = [];
    }
  }

  parseReferences(xrefs: string) {
    const refs = xrefs.split(/\s+/).filter(Boolean);

    this.cveReferences = [];
    this.iavReferences = [];
    this.otherReferences = [];

    refs.forEach((ref: string) => {
      const [refType, ...valueParts] = ref.split(':');
      const value = valueParts.join(':').replace(/,\s*$/, '').trim();

      if (refType && value) {
        if (refType === 'CVE') {
          this.cveReferences.push({ type: refType, value });
        } else if (['IAVA', 'IAVB', 'IAVT'].includes(refType)) {
          this.iavReferences.push({ type: refType, value });
        } else {
          this.otherReferences.push({ type: refType, value });
        }
      } else {
        console.warn(`Invalid reference: ${ref}`);
      }
    });
  }

  getCveUrl(cve: string): string {
    return `https://web.nvd.nist.gov/view/vuln/detail?vulnId=${cve}`;
  }

  getIavUrl(iavNumber: string): string {
    return `https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavNumber}`;
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

  filter30Days() {
    this.is30DayFilterActive = !this.is30DayFilterActive;

    if (this.pluginID && this.tenableRepoId) {
      this.getAffectedAssetsForAllPlugins();
    } else if (this.assetProcessing && this.tenableRepoId) {
      this.getAffectedAssets({ first: 0, rows: 25 } as TableLazyLoadEvent);
    }
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

  exportCSV() {
    const activeTable = this.getActiveTable();

    if (activeTable) {
      activeTable.exportCSV();
    }
  }

  private getActiveTable(): Table | null {
    const table = this.tableMap.get(this.activeTab);

    if (!table) {
      console.warn(`No table found for tab ${this.activeTab}`);

      const tables = this.tables();

      if (tables && tables.length > 0) {
        return tables.at(0)!;
      }
    }

    return table || null;
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter((col) => ['sourcePluginIDs', 'pluginName', 'family', 'severity', 'ips', 'netbiosName', 'dnsName', 'port', 'protocol', 'teamAssigned'].includes(col.field));
  }

  toggleAddColumnOverlay() {
    const multiSelect = this.multiSelect();

    if (multiSelect.overlayVisible) {
      multiSelect.hide();
    } else {
      multiSelect.show();
    }
  }

  getSeverityStyling(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (severity) {
      case 'Critical':
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warn';
      case 'Low':
      case 'Info':
        return 'info';
      default:
        return 'info';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
