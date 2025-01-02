import { Component, Input, OnInit, ViewChild } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

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
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
    DialogModule,
    ToastModule,
    TooltipModule,
  ],
})
export class TenableAssetsTableComponent implements OnInit {
  @Input() pluginID!: string;
  @Input() assetProcessing: boolean = false;
  @Input() tenableRepoId: number;
  @ViewChild('dt') table!: Table;
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

  constructor(
    private importService: ImportService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.initColumnsAndFilters();
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

  async getAffectedAssetsByPluginId(pluginID: string, tenableRepoId: number) {
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
            value: [
              {
                id: tenableRepoId.toString(),
              },
            ],
          },
        ],
        vulnTool: 'listvuln',
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln',
    };

    try {
      const data = await (await this.importService.postTenableAnalysis(analysisParams)).toPromise();
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
    } catch (error) {
      console.error('Error fetching affected assets:', error);
      this.showErrorMessage('Error fetching affected assets. Please try again.');
    }
  }

  async lazyOrNot(event: TableLazyLoadEvent) {
    if (this.pluginID && !this.assetProcessing) {
      await this.getAffectedAssetsByPluginId(this.pluginID, this.tenableRepoId);
    } else if (this.assetProcessing) {
      await this.getAffectedAssets(event);
    }
  }

  async getAffectedAssets(event: TableLazyLoadEvent) {
    if (!this.tenableRepoId) return;
    const startOffset = event.first ?? 0;
    const endOffset = startOffset + (event.rows ?? 20);
    const repoFilter = {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [
        {
          id: this.tenableRepoId.toString(),
        },
      ],
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

    try {
      const data = await (await this.importService.postTenableAnalysis(analysisParams)).toPromise();
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
    } catch (error) {
      console.error('Error fetching affected assets:', error);
      this.showErrorMessage('Error fetching affected assets. Please try again.');
    }
  }

  async showDetails(vulnerability: any) {
    try {
      if (!vulnerability || !vulnerability.pluginID) {
        throw new Error('Invalid vulnerability data');
      }

      const data = await (
        await this.importService.getTenablePlugin(vulnerability.pluginID)
      ).toPromise();

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
    } catch (error) {
      console.error('Error fetching plugin data:', error);
      this.showErrorMessage('Error fetching plugin data. Please try again.');
    }
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

  clear() {
    this.table.clear();
    this.filterValue = '';
  }

  onGlobalFilter(event: Event) {
    this.table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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
}
