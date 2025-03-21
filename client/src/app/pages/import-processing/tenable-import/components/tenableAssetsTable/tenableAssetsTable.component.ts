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
import { AssetDeltaService } from '../../../../admin-processing/asset-delta/asset-delta.service';
import { MessageService } from 'primeng/api';
import { ImportService } from '../../../import.service';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { SharedService } from '../../../../../common/services/shared.service';
import { Subscription } from 'rxjs';

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
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TextareaModule,
    MultiSelectModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    TagModule
  ],
})
export class TenableAssetsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() pluginID!: string;
  @Input() assetProcessing: boolean = false;
  @Input() tenableRepoId: number;
  @ViewChildren(Table) tables: QueryList<Table>;
  @ViewChild('ms') multiSelect!: MultiSelect;

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
  formattedDescription: SafeHtml = '';
  pluginData: any;
  totalRecords: number = 0;
  filterValue: string = '';
  selectedCollection: any;
  assetDeltaList: any;
  assetsByTeam: { [teamId: string]: any[] } = {};
  teamTabs: { teamId: string, teamName: string, assets: any[] }[] = [];
  activeTab: string = 'all';
  private tableMap = new Map<string, Table>();
  private subscriptions = new Subscription();

  constructor(
    private assetDeltaService: AssetDeltaService,
    private importService: ImportService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private sharedService: SharedService
  ) {}

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.initColumnsAndFilters();
    this.loadAssetDeltaList();

    this.teamTabs = [{ teamId: 'all', teamName: 'All Assets', assets: [] }];

    if (this.pluginID && this.tenableRepoId) {
      await this.getAffectedAssetsByPluginId(this.pluginID, this.tenableRepoId);
    } else if (this.assetProcessing && this.tenableRepoId) {
      await this.getAffectedAssets({ first: 0, rows: 20 } as TableLazyLoadEvent);
    }
  }

  ngAfterViewInit() {
    this.updateTableReferences();

    this.tables.changes.subscribe(() => {
      this.updateTableReferences();
    });
  }

  initColumnsAndFilters() {
    this.cols = [
      {
        field: 'pluginID',
        header: 'Plugin ID',
        width: '100px',
        filterable: true,
      },
      { field: 'pluginName', header: 'Name', width: '200px', filterable: true },
      { field: 'family', header: 'Family', width: '150px', filterable: true },
      {
        field: 'severity',
        header: 'Severity',
        width: '100px',
        filterable: true,
      },
      { field: 'vprScore', header: 'VPR', width: '100px', filterable: true },
      { field: 'ips', header: 'IP Address', width: '150px' },
      { field: 'acrScore', header: 'ACR', width: '100px', filterable: false },
      {
        field: 'assetExposureScore',
        header: 'AES',
        width: '100px',
        filterable: false,
      },
      {
        field: 'netbiosName',
        header: 'NetBIOS',
        width: '150px',
        filterable: false,
      },
      { field: 'dnsName', header: 'DNS', width: '200px', filterable: false },
      {
        field: 'macAddress',
        header: 'MAC Address',
        width: '150px',
        filterable: false,
      },
      { field: 'port', header: 'Port', width: '100px', filterable: false },
      {
        field: 'protocol',
        header: 'Protocol',
        width: '100px',
        filterable: false,
      },
      { field: 'uuid', header: 'Agent ID', width: '200px', filterable: false },
      {
        field: 'hostUUID',
        header: 'Host ID',
        width: '200px',
        filterable: false,
      },
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.selectedColumns = this.cols.filter(col =>
      [
        'pluginID',
        'pluginName',
        'family',
        'severity',
        'vprScore',
        'ips',
        'acrScore',
        'assetExposureScore',
        'netbiosName',
        'dnsName',
        'macAddress',
        'port',
        'protocol',
        'uuid',
        'hostUUID',
      ].includes(col.field)
    );
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

  getAffectedAssetsByPluginId(pluginID: string, tenableRepoId: number) {
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
                        value: pluginID,
                    },
                    {
                        id: 'repository',
                        filterName: 'repository',
                        operator: '=',
                        type: 'vuln',
                        isPredefined: true,
                        value: [{ id: tenableRepoId.toString() }],
                    },
                ],
                vulnTool: 'listvuln',
            },
            sourceType: 'cumulative',
            columns: [],
            type: 'vuln',
        };

    this.importService.postTenableAnalysis(analysisParams).subscribe({
      next: (data) => {
        this.affectedAssets = data.response.results.map((asset: any) => {
          const defaultAsset = {
            pluginID: '',
            pluginName: '',
            family: { name: '' },
            severity: { name: '' },
            vprScore: '',
          };
          return {
            ...defaultAsset,
            ...asset,
            pluginName: asset.name || '',
            family: asset.family?.name || '',
            severity: asset.severity?.name || '',
          };
        });
        this.totalRecords = this.affectedAssets.length;
        this.isLoading = false;

        this.matchAssetsWithTeams();
      },
      error: (error) => {
        console.error('Error fetching affected assets:', error);
        this.showErrorMessage('Error fetching affected assets. Please try again.');
      }
    });
  }

  matchAssetsWithTeams() {
    if (!this.assetDeltaList?.assets || !this.affectedAssets) return;

    this.assetsByTeam = {};

    this.affectedAssets.forEach(asset => {
      const netbiosName = asset.netbiosName?.toLowerCase() || '';
      const dnsName = asset.dnsName?.toLowerCase() || '';

      this.assetDeltaList.assets.forEach(deltaAsset => {
        const deltaKey = deltaAsset.key.toLowerCase();

        if (netbiosName.includes(deltaKey) || dnsName.includes(deltaKey)) {
          if (deltaAsset.assignedTeams && Array.isArray(deltaAsset.assignedTeams)) {
            deltaAsset.assignedTeams.forEach(team => {
              const teamId = team.assignedTeamId;
              const teamName = team.assignedTeamName;

              if (!this.assetsByTeam[teamId]) {
                this.assetsByTeam[teamId] = [];
              }

              const assetKey = asset.netbiosName + asset.dnsName;
              if (!this.assetsByTeam[teamId].some(a => (a.netbiosName + a.dnsName) === assetKey)) {
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

            const assetKey = asset.netbiosName + asset.dnsName;
            if (!this.assetsByTeam[teamId].some(a => (a.netbiosName + a.dnsName) === assetKey)) {
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


  async lazyOrNot(event: TableLazyLoadEvent) {
    if (this.pluginID && !this.assetProcessing) {
      await this.getAffectedAssetsByPluginId(this.pluginID, this.tenableRepoId);
    } else if (this.assetProcessing) {
      await this.getAffectedAssets(event);
    }
  }

    getAffectedAssets(event: TableLazyLoadEvent) {
        if (!this.tenableRepoId) return;

        const startOffset = event.first ?? 0;
        const endOffset = startOffset + (event.rows ?? 20);
        const repoFilter = {
            id: 'repository',
            filterName: 'repository',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: [{ id: this.tenableRepoId.toString() }],
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
                vulnTool: 'listvuln',
            },
            sourceType: 'cumulative',
            columns: [],
            type: 'vuln',
        };

        this.importService.postTenableAnalysis(analysisParams).subscribe({
            next: (data) => {
                this.affectedAssets = data.response.results.map((asset: any) => {
                    const defaultAsset = {
                        pluginID: '',
                        pluginName: '',
                        family: { name: '' },
                        severity: { name: '' },
                        vprScore: '',
                    };
                    return {
                        ...defaultAsset,
                        ...asset,
                        pluginName: asset.name || '',
                        family: asset.family?.name || '',
                        severity: asset.severity?.name || '',
                    };
                });
                this.totalRecords = data.response.totalRecords;
            this.isLoading = false;
            this.matchAssetsWithTeams();
            },
            error: (error) => {
                console.error('Error fetching affected assets:', error);
                this.showErrorMessage('Error fetching affected assets. Please try again.');
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
                this.formattedDescription = this.pluginData.description
                    ? this.sanitizer.bypassSecurityTrustHtml(
                        this.pluginData.description.replace(/\n\n/g, '<br>')
                    )
                    : '';

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
                console.error('Error fetching plugin data:', error);
                this.showErrorMessage('Error fetching plugin data. Please try again.');
            }
        });
    }

  parseVprContext(vprContext: string) {
    try {
      this.parsedVprContext = JSON.parse(vprContext);
    } catch (error) {
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

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: true,
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

      if (this.tables && this.tables.length > 0) {
        return this.tables.first;
      }
    }
    return table || null;
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter(col =>
      ['netbiosName', 'dnsName', 'macAddress', 'port', 'protocol', 'uuid', 'hostUUID'].includes(
        col.field
      )
    );
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
    }
  }

  getSeverityStyling(severity: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (severity) {
      case 'Critical':
      case 'High':
        return "danger";
      case 'Medium':
        return "warn";
      case 'Low':
      case 'Info':
        return "info";
      default:
        return "info";
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
