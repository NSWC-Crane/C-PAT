/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ImportService } from '../../../import.service';
import { Table, TableModule } from 'primeng/table';
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
import { TagModule } from 'primeng/tag';
import { SharedService } from '../../../../../common/services/shared.service';
import { Subscription } from 'rxjs';
import { format } from 'date-fns';
import { PoamService } from '../../../../poam-processing/poams.service';
import { Router } from '@angular/router';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-tenable-host-assets-table',
  templateUrl: './tenableHostAssetsTable.component.html',
  styleUrls: ['./tenableHostAssetsTable.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
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
export class TenableHostAssetsTableComponent implements OnInit, OnDestroy {
  @Input() tenableRepoId: number;
  @ViewChild('hostAssetTable') hostAssetTable!: Table;
  @ViewChild('hostFindingsTable') hostFindingsTable!: Table;
  @ViewChild('ms') multiSelect!: MultiSelect;

  cols: any[];
  hostDialogCols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  affectedAssets: any[] = [];
  isLoading: boolean = true;
  totalRecords: number = 0;
  filterValue: string = '';
  dialogFilterValue: string = '';
  selectedCollection: any;
  selectedHost: any;
  hostData: any;
  displayDialog: boolean = false;
  existingPoamPluginIDs: any;
  pluginData: any;
  selectedPoamStatuses: string[] = [];
  selectedSeverities: string[] = [];
  selectedPlugin: any;
  pluginDetailData: any;
  displayPluginDialog: boolean = false;
  isLoadingPluginDetails: boolean = false;
  cveReferences: any[] = [];
  iavReferences: any[] = [];
  otherReferences: any[] = [];
  private subscriptions = new Subscription();


  constructor(
    private importService: ImportService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private poamService: PoamService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
        this.loadPoamAssociations();
      })
    );
    this.initColumnsAndFilters();
    this.getAffectedAssets();
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'name', header: 'Name', filterType: 'text' },
      { field: 'aes', header: 'AES', filterType: 'numeric' },
      { field: 'acr', header: 'ACR', filterType: 'numeric' },
      { field: 'acrLastEvaluatedTime', header: 'ACR Last Eval', filterType: 'date' },
      { field: 'ipAddress', header: 'IP Address', filterType: 'text' },
      { field: 'os', header: 'OS', filterType: 'text' },
      { field: 'systemType', header: 'System Type', filterType: 'text' },
      { field: 'netBios', header: 'Net BIOS', filterType: 'text' },
      { field: 'dns', header: 'DNS', filterType: 'text' },
      { field: 'firstSeen', header: 'First Seen', filterType: 'date' },
      { field: 'lastSeen', header: 'Last Seen', filterType: 'date' },
      { field: 'uuid', header: 'Host ID', filterType: 'text' },
      { field: 'source', header: 'Source', filterType: 'text' },
    ];

    this.hostDialogCols = [
      {
        field: 'poam',
        header: 'POAM',
        filterField: 'poamStatus',
        filterType: 'multi',
        filterOptions: [
          { label: 'No Existing POAM', value: 'No Existing POAM' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Associated', value: 'Associated' },
          { label: 'Closed', value: 'Closed' },
          { label: 'Draft', value: 'Draft' },
          { label: 'Expired', value: 'Expired' },
          { label: 'Extension Requested', value: 'Extension Requested' },
          { label: 'False-Positive', value: 'False-Positive' },
          { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval' },
          { label: 'Rejected', value: 'Rejected' },
          { label: 'Submitted', value: 'Submitted' },
        ],
      },
      { field: 'pluginID', header: 'Plugin ID', filterType: 'text' },
      { field: 'pluginName', header: 'Plugin Name', filterType: 'text' },
      {
        field: 'severity',
        header: 'Severity',
        filterType: 'multi',
        filterOptions: [
          { label: 'Info', value: 'Info' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' },
        ],
      },
      { field: 'port', header: 'Port', filterType: 'numeric' },
      { field: 'protocol', header: 'Protocol', filterType: 'text' },
      { field: 'vprScore', header: 'VPR', filterType: 'numeric' },
      { field: 'epssScore', header: 'EPSS (%)', filterType: 'numeric' },
      { field: 'lastSeen', header: 'Last Seen', filterType: 'date' }
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.selectedColumns = this.cols.filter(col =>
      [
        'name',
        'os',
        'macAddress',
        'firstSeen',
        'lastSeen',
        'netBios',
        'dns',
        'ipAddress',
        'systemType',
        'uuid',
        'source',
        'acr',
        'acrLastEvaluatedTime',
        'aes'
      ].includes(col.field)
    );
  }

  loadPoamAssociations() {
    if (!this.selectedCollection) return;

    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection)
      .subscribe({
        next: (poamData) => {
          if (poamData && Array.isArray(poamData)) {
            this.existingPoamPluginIDs = poamData.reduce(
              (acc: { [key: string]: { poamId: number; status: string } },
                item: { vulnerabilityId: string; status: string; poamId: number }) => {
                acc[item.vulnerabilityId] = {
                  poamId: item.poamId,
                  status: item.status,
                };
                return acc;
              },
              {}
            );
          } else {
            console.error('Unexpected POAM data format:', poamData);
            this.showErrorMessage('Error loading POAM data. Unexpected data format.');
          }
        },
        error: (error) => {
          console.error('Error loading POAM associations:', error);
          this.showErrorMessage('Error loading POAM data. Please try again.');
        }
      });
  }

  getAffectedAssets() {
    if (!this.tenableRepoId) return;

    this.isLoading = true;
    const hostParams = {
      "filters": {
        "and": [
          {
            "property": "repositoryHost",
            "operator": "eq",
            "value": this.tenableRepoId.toString()
          },
          {
            "property": "assetCriticalityRating",
            "operator": "eq",
            "value": "all"
          },
          {
            "property": "assetExposureScore",
            "operator": "eq",
            "value": "all"
          }
        ]
      }
    };

    this.importService.postTenableHostSearch(hostParams).subscribe({
      next: (data) => {
        this.affectedAssets = data.response.map((asset: any) => {
          const formattedSystemType = asset.systemType ?
            asset.systemType.split(',').map((type: string) => {
              return type.trim().replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
            }).join(', ') : '';

          return {
            ...asset,
            id: asset.id || '',
            name: asset.name || '',
            os: asset.os || '',
            macAddress: asset.macAddress || '',
            netBios: asset.netBios || '',
            dns: asset.dns || '',
            ipAddress: asset.ipAddress || '',
            uuid: asset.uuid || '',
            source: asset.source?.[0]?.type || '',
            acr: asset.acr?.score || '',
            acrLastEvaluatedTime: this.formatTimestamp(asset.acr?.lastEvaluatedTime),
            aes: asset.aes?.score || '',
            lastSeen: this.formatTimestamp(asset.lastSeen),
            firstSeen: this.formatTimestamp(asset.firstSeen),
            systemType: formattedSystemType || ''
          };
        });

        this.totalRecords = data.response.totalRecords;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching host assets:', error);
        this.showErrorMessage('Error fetching host assets. Please try again.');
        this.isLoading = false;
      }
    });
  }

  formatTimestamp(timestamp: number | string | undefined): string {
    if (!timestamp) return '';

    try {
      const date = new Date(Number(timestamp) * 1000);

      if (isNaN(date.getTime())) return '';

      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }

  onHostNameClick(host: any, event: Event) {
    event.stopPropagation();
    this.isLoading = true;
    this.showDetails(host);
  }

  showDetails(host: any): Promise<void> {
    if (!host || !host.name) {
      this.isLoading = false;
      this.showErrorMessage('Invalid host name');
      return Promise.reject('Invalid host name');
    }

    this.selectedPoamStatuses = [];
    this.selectedSeverities = [];
    this.dialogFilterValue = '';


    this.selectedHost = host;

    const analysisParams = {
      query: {
        type: 'vuln',
        tool: "tenable_internal_vulndetails",
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 5000,
        filters: [
          {
            filterName: 'repository',
            operator: '=',
            value: [
              {
                id: this.tenableRepoId.toString()
              },
            ],
          },
          {
            filterName: 'dnsName',
            operator: '=',
            value: host.dns
          },
          {
            filterName: 'ip',
            operator: '=',
            value: host.ipAddress ? host.ipAddress : ''
          }
        ],
      },
      sortDir: "desc",
      sortField: "severity",
      sourceType: 'cumulative',
      type: 'vuln'
    };

    return new Promise((resolve, reject) => {
      this.importService.postTenableAnalysis(analysisParams)
        .subscribe({
          next: (data) => {
            if (!data || !data.response) {
              reject(new Error('Invalid response from getTenablePlugin'));
              this.isLoading = false;
              return;
            }

            this.hostData = data.response.results.map((item: any) => {
              const poamAssociation = this.existingPoamPluginIDs?.[item.pluginID];
              return {
                pluginID: item.pluginID || '',
                pluginName: item.pluginName || '',
                severity: item.severity?.name || '',
                port: item.port || '',
                protocol: item.protocol || '',
                vprScore: item.vprScore || '',
                epssScore: item.epssScore || '',
                lastSeen: this.formatTimestamp(item.lastSeen),
                poam: !!poamAssociation,
                poamId: poamAssociation?.poamId || null,
                poamStatus: poamAssociation?.status ? poamAssociation.status : 'No Existing POAM',
              };
            });

            this.displayDialog = true;
            this.isLoading = false;
            resolve();
          },
          error: (error) => {
            console.error('Error fetching plugin data:', error);
            this.isLoading = false;
            this.showErrorMessage('Error fetching plugin data. Please try again.');
            reject(error);
          }
        });
    });
  }

  onPluginIDClick(plugin: any, event: Event) {
    event.stopPropagation();
    this.isLoadingPluginDetails = true;
    this.showPluginDetails(plugin);
  }

showPluginDetails(plugin: any): Promise<void> {
    if (!plugin || !plugin.pluginID) {
      this.isLoadingPluginDetails = false;
      this.showErrorMessage('Invalid plugin ID');
      return Promise.reject('Invalid plugin ID');
    }

    this.selectedPlugin = plugin;

    const filters = [
      {
        filterName: "pluginID",
        id: "pluginID",
        isPredefined: true,
        operator: "=",
        type: "vuln",
        value: plugin.pluginID
      },
      {
        filterName: "repository",
        id: "repository",
        isPredefined: true,
        operator: "=",
        type: "vuln",
        value: [
          {
            id: this.tenableRepoId.toString()
          }
        ]
      }
    ];

    if (this.selectedHost?.ipAddress) {
      filters.push({
        filterName: "ip",
        id: "ip",
        isPredefined: true,
        operator: "=",
        type: "vuln",
        value: this.selectedHost.ipAddress
      });
    }

    if (this.selectedHost?.dns) {
      filters.push({
        filterName: "dnsName",
        id: "dnsName",
        isPredefined: true,
        operator: "=",
        type: "vuln",
        value: this.selectedHost.dns
      });
    }

    if (plugin.port) {
      filters.push({
        filterName: "port",
        id: "port",
        isPredefined: true,
        operator: "=",
        type: "vuln",
        value: plugin.port
      });
    }

    const analysisParams = {
      columns: [],
      query: {
        context: "",
        createdTime: 0,
        description: "",
        endOffset: 50,
        filters: filters,
        groups: [],
        modifiedTime: 0,
        name: "",
        sourceType: "cumulative",
        startOffset: 0,
        status: -1,
        tool: "vulndetails",
        type: "vuln",
        vulnTool: "vulndetails"
      },
      sourceType: "cumulative",
      type: "vuln"
    };

    return new Promise((resolve, reject) => {
      this.importService.postTenableAnalysis(analysisParams)
        .subscribe({
          next: (data) => {
            if (!data || !data.response || !data.response.results || !data.response.results.length) {
              reject(new Error('Invalid response from postTenableAnalysis'));
              this.isLoadingPluginDetails = false;
              return;
            }

            this.pluginDetailData = data.response.results[0];

            if (this.pluginDetailData.xrefs) {
              this.parseReferences(this.pluginDetailData.xrefs);
            } else {
              this.cveReferences = [];
              this.iavReferences = [];
              this.otherReferences = [];
            }
            this.displayDialog = false;
            this.displayPluginDialog = true;
            this.isLoadingPluginDetails = false;
            resolve();
          },
          error: (error) => {
            console.error('Error fetching plugin details:', error);
            this.isLoadingPluginDetails = false;
            this.showErrorMessage('Error fetching plugin details. Please try again.');
            reject(error);
          }
        });
    });
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

  getPoamStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'darkorange';
      case 'expired':
      case 'rejected':
        return 'firebrick';
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
        return 'goldenrod';
      case 'false-positive':
      case 'closed':
        return 'black';
      case 'approved':
        return 'green';
      case 'associated':
        return 'dimgray';
      default:
        return 'gray';
    }
  }

  getPoamStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'no existing poam':
        return 'pi pi-plus-circle';
      case 'expired':
      case 'rejected':
        return 'pi pi-ban';
      case 'draft':
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
      case 'false-positive':
      case 'closed':
      case 'approved':
      case 'associated':
        return 'pi pi-check-circle';
      default:
        return 'pi pi-question-circle';
    }
  }

  getPoamStatusTooltip(status: string | null): string {
    if (!status && status !== '') {
      return 'No Existing POAM. Click icon to create draft POAM.';
    }

    switch (status?.toLowerCase()) {
      case 'expired':
      case 'rejected':
      case 'draft':
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
      case 'false-positive':
      case 'closed':
      case 'approved':
        return `POAM Status: ${status}. Click icon to view POAM.`;
      case 'associated':
        return 'This vulnerability is associated with an existing master POAM. Click icon to view POAM.';
      default:
        return 'POAM Status Unknown. Click icon to view POAM.';
    }
  }

  async onPoamIconClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    try {
      if (vulnerability.poam && vulnerability.poamId) {
        this.router.navigateByUrl(`/poam-processing/poam-details/${vulnerability.poamId}`);
        return;
      }

      await this.getPluginData(vulnerability.pluginID);

      if (!this.pluginData) {
        throw new Error('Plugin data not available');
      }

      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData,
          iavNumber: vulnerability.iav || '',
          iavComplyByDate: vulnerability.navyComplyDate || null,
        },
      });
    } catch (error) {
      console.error('Error in onPoamIconClick:', error);
      this.showErrorMessage('Error processing vulnerability data. Please try again.');
    }
  }

  getPluginData(pluginID: string): Promise<void> {
    if (!pluginID) {
      this.showErrorMessage('Invalid plugin ID');
      return Promise.reject('Invalid plugin ID');
    }

    return new Promise((resolve, reject) => {
      this.importService.getTenablePlugin(pluginID)
        .subscribe({
          next: (data) => {
            if (!data || !data.response) {
              reject(new Error('Invalid response from getTenablePlugin'));
              return;
            }

            this.pluginData = data.response;
            resolve();
          },
          error: (error) => {
            console.error('Error fetching plugin data:', error);
            this.showErrorMessage('Error fetching plugin data. Please try again.');
            reject(error);
          }
        });
    });
  }

  parseReferences(xrefs: string) {
    if (!xrefs) {
      this.cveReferences = [];
      this.iavReferences = [];
      this.otherReferences = [];
      return;
    }

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
      }
    });
  }

  parsePluginOutput(pluginText: string): string {
    if (!pluginText) return '';
    return pluginText.replace(/<plugin_output>/g, '').replace(/<\/plugin_output>/g, '');
  }

  getIavUrl(iavNumber: string): string {
    return `https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavNumber}`;
  }

  getCveUrl(cve: string): string {
    return `https://web.nvd.nist.gov/view/vuln/detail?vulnId=${cve}`;
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
    this.hostAssetTable.clear();
    this.filterValue = '';
  }

  clearHostFindingsTable() {
    if (this.hostFindingsTable) {
      this.hostFindingsTable.clear();
    }
    this.dialogFilterValue = '';
    this.selectedPoamStatuses = [];
    this.selectedSeverities = [];
  }


  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.hostAssetTable.filterGlobal(value, 'contains');
  }

  onHostFindingsTableFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.hostFindingsTable.filterGlobal(value, 'contains');
  }

  exportCSV() {
    this.hostAssetTable.exportCSV();
  }

  exportHostFindingsTableCSV() {
    this.hostFindingsTable.exportCSV();
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter(col =>
      ['name', 'os', 'macAddress', 'firstSeen', 'lastSeen', 'netBios', 'dns', 'ipAddress', 'systemType', 'uuid', 'source', 'acr', 'acrLastEvaluatedTime', 'aes'].includes(
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
