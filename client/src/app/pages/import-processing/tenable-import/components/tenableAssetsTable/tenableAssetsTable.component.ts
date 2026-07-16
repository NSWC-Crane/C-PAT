/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, input, signal, viewChild, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Select, SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, catchError, map, of } from 'rxjs';
import { SharedService } from '../../../../../common/services/shared.service';
import { CsvExportService } from '../../../../../common/utils/csv-export.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { AssetDeltaService } from '../../../../admin-processing/asset-delta/asset-delta.service';
import { MultiSelectDirective } from '../../../../../common/directives/multi-select.directive';
import { ImportService } from '../../../import.service';
import { format } from 'date-fns';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TableModule, TabsModule, ButtonModule, InputTextModule, InputIconModule, IconFieldModule, TextareaModule, SelectModule, MultiSelectDirective, DialogModule, ToastModule, TooltipModule, TagModule, DatePipe]
})
export class TenableAssetsTableComponent implements OnInit, AfterViewInit {
  private readonly assetDeltaService = inject(AssetDeltaService);
  private readonly csvExportService = inject(CsvExportService);
  private readonly importService = inject(ImportService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly messageService = inject(MessageService);
  private readonly sharedService = inject(SharedService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pluginID = input.required<string>();
  readonly assetProcessing = input<boolean>(false);
  readonly tenableRepoId = input<number>(undefined);
  readonly associatedVulnerabilities = input<any[]>([]);
  private readonly tables = viewChildren(Table);
  private readonly columnSelect = viewChild.required<Select>('ms');

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  readonly cveReferences = signal<Reference[]>([]);
  readonly iavReferences = signal<Reference[]>([]);
  readonly otherReferences = signal<Reference[]>([]);
  affectedAssets: any[] = [];
  readonly selectedVulnerability = signal<any>(null);
  readonly displayDialog = signal(false);
  readonly parsedVprContext = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly is30DayFilterActive = signal(false);
  readonly formattedDescription = signal<SafeHtml>('');
  readonly pluginData = signal<any>(null);
  readonly totalRecords = signal<number>(0);
  filterValue: string = '';
  selectedCollection: any;
  assetDeltaList: any;
  assetsByTeam: { [teamId: string]: any[] } = {};
  readonly teamTabs = signal<{ teamId: string; teamName: string; assets: any[] }[]>([]);
  activeTab: string = 'all';
  private readonly tableMap = new Map<string, Table>();

  constructor() {
    effect(() => {
      const tablesArray = this.tables();

      if (tablesArray.length > 0) {
        this.updateTableReferences();
      }
    });
  }

  ngOnInit() {
    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection = collectionId;
    });
    this.initColumnsAndFilters();
    this.loadAssetDeltaList();

    this.teamTabs.set([{ teamId: 'all', teamName: 'All Assets', assets: [] }]);
    this.activeTab = 'all';

    const tenableRepoId = this.tenableRepoId();

    if (this.pluginID() && tenableRepoId) {
      this.getAffectedAssetsForAllPlugins();
    } else if (this.assetProcessing() && tenableRepoId) {
      this.getAffectedAssets({ first: 0, rows: 25 } as TableLazyLoadEvent);
    }
  }

  ngAfterViewInit() {
    this.updateTableReferences();
  }

  initColumnsAndFilters() {
    const cols = [
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

    const poamCols = [
      {
        field: 'firstSeen',
        header: 'First Discovered',
        width: '200px',
        filterable: false
      },
      {
        field: 'lastSeen',
        header: 'Last Observed',
        width: '200px',
        filterable: false
      },
      {
        field: 'hasBeenMitigated',
        header: 'Previously Mitigated',
        width: '200px',
        filterable: false
      }
    ];

    const pluginID = this.pluginID();
    const tenableRepoId = this.tenableRepoId();

    if (pluginID && tenableRepoId) {
      this.cols = [...cols, ...poamCols];
    } else {
      this.cols = cols;
    }

    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));

    let selectedFields = ['sourcePluginIDs', 'pluginName', 'family', 'severity', 'ips', 'netbiosName', 'dnsName', 'port', 'protocol', 'teamAssigned'];

    if (pluginID && tenableRepoId) {
      selectedFields.push('lastSeen');
    }

    this.selectedColumns = this.cols.filter((col) => selectedFields.includes(col.field));
  }

  loadAssetDeltaList() {
    this.assetDeltaService
      .getAssetDeltaListByCollection(this.selectedCollection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.isLoading.set(true);

    const associatedPluginIds = this.associatedVulnerabilities()
      .map((vuln) => (typeof vuln === 'string' ? vuln : typeof vuln === 'object' && vuln.associatedVulnerability ? vuln.associatedVulnerability : null))
      .filter((id) => id !== null);

    const allPluginIds = [this.pluginID(), ...associatedPluginIds];

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
        value: [{ id: this.tenableRepoId().toString() }]
      }
    ];

    if (this.is30DayFilterActive()) {
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
        tool: 'vulndetails',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 10000,
        filters: filters,
        vulnTool: 'vulndetails'
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (!data?.response?.results) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No assets found for these vulnerabilities'
            });
            this.isLoading.set(false);

            return;
          }

          const processedAssets = data.response.results.map((asset: any) => {
            const sourcePluginID = asset.pluginID || '';

            return {
              ...asset,
              pluginName: asset.pluginName || '',
              family: asset.family?.name || '',
              severity: asset.severity?.name || '',
              sourcePluginIDs: [sourcePluginID],
              lastSeen: this.formatTimestamp(asset.lastSeen),
              firstSeen: this.formatTimestamp(asset.firstSeen),
              hasBeenMitigated: asset.hasBeenMitigated === '1' ? 'Previously Mitigated' : 'False'
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
          this.totalRecords.set(this.affectedAssets.length);
          this.isLoading.set(false);

          this.matchAssetsWithTeams();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching affected assets: ${getErrorMessage(error)}`
          });
          this.isLoading.set(false);
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
        endOffset: 10000,
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
            family: '',
            severity: '',
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
    const tabs: { teamId: string; teamName: string; assets: any[] }[] = [{ teamId: 'all', teamName: 'All Assets', assets: this.affectedAssets }];

    Object.keys(this.assetsByTeam).forEach((teamId) => {
      if (this.assetsByTeam[teamId].length > 0) {
        const teamName = this.assetsByTeam[teamId][0].assignedTeamName || `Team ${teamId}`;

        tabs.push({
          teamId: teamId,
          teamName: teamName,
          assets: this.assetsByTeam[teamId]
        });
      }
    });

    this.teamTabs.set(tabs);
  }

  lazyOrNot(event: TableLazyLoadEvent) {
    const pluginID = this.pluginID();
    const assetProcessing = this.assetProcessing();

    if (pluginID && !assetProcessing) {
      this.getAffectedAssetsByPluginId(pluginID, this.tenableRepoId());
    } else if (assetProcessing) {
      this.getAffectedAssets(event);
    }
  }

  getAffectedAssets(event: TableLazyLoadEvent) {
    const tenableRepoId = this.tenableRepoId();

    if (!tenableRepoId) return;

    this.isLoading.set(true);

    const startOffset = event.first ?? 0;
    const endOffset = startOffset + (event.rows ?? 25);
    const repoFilter = {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: tenableRepoId.toString() }]
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

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.affectedAssets = data.response.results.map((asset: any) => {
            const defaultAsset = {
              pluginID: '',
              pluginName: '',
              family: '',
              severity: '',
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

          this.totalRecords.set(data.response.totalRecords);

          if (this.assetProcessing()) {
            this.teamTabs.set([{ teamId: 'all', teamName: 'All Assets', assets: this.affectedAssets }]);
          } else {
            this.matchAssetsWithTeams();
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching affected assets: ${getErrorMessage(error)}`
          });
          this.isLoading.set(false);
        }
      });
  }

  showDetails(vulnerability: any) {
    if (!vulnerability?.pluginID) {
      throw new Error('Invalid vulnerability data');
    }

    this.importService
      .getTenablePlugin(vulnerability.pluginID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (!data?.response) {
            throw new Error('Invalid response from getTenablePlugin');
          }

          const pluginData = data.response;

          this.pluginData.set(pluginData);
          this.formattedDescription.set(pluginData.description ? this.sanitizer.bypassSecurityTrustHtml(pluginData.description.replaceAll('\n\n', '<br>')) : '');

          if (pluginData.xrefs && pluginData.xrefs.length > 0) {
            this.parseReferences(pluginData.xrefs);
          } else {
            this.cveReferences.set([]);
            this.iavReferences.set([]);
            this.otherReferences.set([]);
          }

          if (Array.isArray(pluginData.vprContext)) {
            this.parseVprContext(pluginData.vprContext);
          } else {
            this.parsedVprContext.set([]);
          }

          this.selectedVulnerability.set(vulnerability);
          this.displayDialog.set(true);
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

  formatTimestamp(timestamp: number | string | undefined): string {
    if (!timestamp || timestamp === '-1') return undefined;

    try {
      if (typeof timestamp === 'string' && timestamp.includes('/')) {
        return timestamp;
      }

      const date = new Date(Number(timestamp) * 1000);

      if (Number.isNaN(date.getTime())) {
        const dateMs = new Date(Number(timestamp));

        if (!Number.isNaN(dateMs.getTime())) {
          return format(dateMs, 'MM/dd/yyyy');
        }

        return '';
      }

      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error formatting timestamp: ${getErrorMessage(error)}`
      });

      return '';
    }
  }

  parseVprContext(vprContext: string) {
    try {
      this.parsedVprContext.set(JSON.parse(vprContext));
    } catch (error) {
      console.error('Failed to parse VPR context:', error);
      this.parsedVprContext.set([]);
    }
  }

  parseReferences(xrefs: string) {
    const refs = xrefs.split(/\s+/).filter(Boolean);
    const cve: Reference[] = [];
    const iav: Reference[] = [];
    const other: Reference[] = [];

    refs.forEach((ref: string) => {
      const [refType, ...valueParts] = ref.split(':');
      const value = valueParts.join(':').replace(/,\s*$/, '').trim();

      if (refType && value) {
        if (refType === 'CVE') {
          cve.push({ type: refType, value });
        } else if (['IAVA', 'IAVB', 'IAVT'].includes(refType)) {
          iav.push({ type: refType, value });
        } else {
          other.push({ type: refType, value });
        }
      } else {
        console.warn(`Invalid reference: ${ref}`);
      }
    });

    this.cveReferences.set(cve);
    this.iavReferences.set(iav);
    this.otherReferences.set(other);
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

    this.teamTabs().forEach((tab, index) => {
      if (index < tablesArray.length) {
        this.tableMap.set(tab.teamId, tablesArray[index]);
      }
    });
  }

  filter30Days() {
    this.is30DayFilterActive.update((value) => !value);

    const tenableRepoId = this.tenableRepoId();

    if (this.pluginID() && tenableRepoId) {
      this.getAffectedAssetsForAllPlugins();
    } else if (this.assetProcessing() && tenableRepoId) {
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
    const activeTab = this.teamTabs().find((tab) => tab.teamId === this.activeTab);
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

      if (asset.assignedTeams && Array.isArray(asset.assignedTeams)) {
        processedAsset.teamAssigned = asset.assignedTeams.map((team: any) => team.assignedTeamName).join(', ');
      }

      if (asset.sourcePluginIDs && Array.isArray(asset.sourcePluginIDs)) {
        processedAsset.sourcePluginIDs = asset.sourcePluginIDs.join(', ');
      }

      return processedAsset;
    });

    this.csvExportService.exportToCsv(processedData, {
      filename: `CPAT_${this.pluginID()}-affected-assets-${new Date().toISOString().split('T')[0]}`,
      columns: this.selectedColumns,
      includeTimestamp: false
    });
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
    let selectedFields = ['sourcePluginIDs', 'pluginName', 'family', 'severity', 'ips', 'netbiosName', 'dnsName', 'port', 'protocol', 'teamAssigned'];

    if (this.pluginID() && this.tenableRepoId()) {
      selectedFields.push('lastSeen');
    }

    this.selectedColumns = this.cols.filter((col) => selectedFields.includes(col.field));
  }

  toggleAddColumnOverlay() {
    const columnSelect = this.columnSelect();

    if (columnSelect.overlayVisible()) {
      columnSelect.hide();
    } else {
      columnSelect.show();
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
}
