/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND 
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ImportService } from '../../../import.service';
import { Table, TableModule } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { PoamService } from '../../../../poam-processing/poams.service';
import { Router } from '@angular/router';
import { format, parseISO, startOfDay } from 'date-fns';
import { SharedService } from '../../../../../common/services/shared.service';
import { Subscription } from 'rxjs';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { FilterMetadata } from "primeng/api";
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

interface Reference {
  type: string;
  value: string;
}
interface ExportColumn {
  title: string;
  dataKey: string;
}
interface IAVInfo {
  iav: string;
  navyComplyDate: string;
  supersededBy: string;
}
interface NavyComplyDateFilter {
  label: string;
  value: string;
}

@Component({
  selector: 'tenable-iav-vulnerabilities',
  templateUrl: './tenableIAVVulnerabilities.component.html',
  styleUrls: ['./tenableIAVVulnerabilities.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    DropdownModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
})
export class TenableIAVVulnerabilitiesComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table!: Table;
  @ViewChild('dd') dropDown!: Dropdown;
  @ViewChild('ms') multiSelect!: MultiSelect;
  readonly filters: { [key: string]: FilterMetadata[] } = {
    supersededBy: [{ value: 'N/A', matchMode: "contains", operator: "and" }],
    severity: [{ value: 'Info', matchMode: "notContains", operator: "and" }],
  };
  cols: any[];
  exportColumns!: ExportColumn[];
  existingPoamPluginIDs: any;
  selectedColumns: any[];
  cveReferences: Reference[] = [];
  iavReferences: Reference[] = [];
  otherReferences: Reference[] = [];
  IAVVulnerabilities: any[] = [];
  iavPluginIDs: string = '';
  selectedVulnerability: any;
  displayDialog: boolean = false;
  parsedVprContext: any[] = [];
  isLoading: boolean = true;
  formattedDescription: SafeHtml = '';
  pluginData: any;
  totalRecords: number = 0;
  filterValue: string = '';
  iavInfo: { [key: number]: IAVInfo | undefined } = {};
  navyComplyDateFilters: NavyComplyDateFilter[];
  tenableTool: string = 'sumid';
  selectedNavyComplyDateFilter: NavyComplyDateFilter | null = null;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  private subscriptions = new Subscription();
  poamStatusOptions = [
    { label: 'Any', value: null },
    { label: 'Approved', value: 'approved' },
    { label: 'Associated', value: 'associated' },
    { label: 'Closed', value: 'closed' },
    { label: 'Draft', value: 'draft' },
    { label: 'Expired', value: 'expired' },
    { label: 'Extension Requested', value: 'extension requested' },
    { label: 'False-Positive', value: 'false-positive' },
    { label: 'Pending CAT-I Approval', value: 'pending cat-i approval' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Submitted', value: 'submitted' }
  ];
  constructor(
    private importService: ImportService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private poamService: PoamService,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.subscriptions.add(
      await this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      }),
    );
    await (
      await this.collectionService.getCollectionBasicList()
    ).subscribe({
      next: (data) => {
        const selectedCollectionData = data.find(
          (collection: any) =>
            collection.collectionId === this.selectedCollection,
        );
        if (selectedCollectionData) {
          this.tenableRepoId =
            selectedCollectionData.originCollectionId?.toString();
        } else {
          this.tenableRepoId = '';
        }
      },
      error: (error) => {
        this.tenableRepoId = '';
      },
    });
    this.initColumnsAndFilters();
    await this.loadPoamAssociations();
    await this.getIAVPluginIDs();
    if (this.table) {
      this.table.filters = { ...this.filters };
    }
  }

  initColumnsAndFilters() {
    this.cols = [
      {
        field: 'poam',
        header: 'POAM',
        filterField: 'poamStatus',
        filterType: 'text',
        filterOptions: this.poamStatusOptions,
      },
      {
        field: 'pluginID',
        header: 'Plugin ID',
        filterType: 'text'
      },
      {
        field: 'pluginName',
        header: 'Name',
        filterType: 'text'
      },
      {
        field: 'family',
        header: 'Family',
        filterType: 'text'
      },
      {
        field: 'severity',
        header: 'Severity',
        filterType: 'text'
      },
      {
        field: 'vprScore',
        header: 'VPR',
        filterType: 'numeric'
      },
      {
        field: 'iav',
        header: 'IAV',
        filterType: 'text'
      },
      {
        field: 'navyComplyDate',
        header: 'Navy Comply Date',
        filterType: 'date',
        dataType: 'date',
        filterValue: ''
      },
      {
        field: 'supersededBy',
        header: 'Superseded By',
        filterType: 'text'
      },
      { field: 'ips', header: 'IP Address', filterType: 'text' },
      { field: 'acrScore', header: 'ACR', filterType: 'numeric' },
      { field: 'assetExposureScore', header: 'AES', filterType: 'numeric' },
      { field: 'netbiosName', header: 'NetBIOS', filterType: 'text' },
      { field: 'dnsName', header: 'DNS', filterType: 'text' },
      { field: 'macAddress', header: 'MAC Address', filterType: 'text' },
      { field: 'port', header: 'Port', filterType: 'numeric' },
      { field: 'protocol', header: 'Protocol', filterType: 'text' },
      { field: 'uuid', header: 'Agent ID', filterType: 'text' },
      { field: 'hostUUID', header: 'Host ID', filterType: 'numeric' },
      { field: 'total', header: 'Total', filterType: 'numeric' },
      { field: 'hostTotal', header: 'Host Total', filterType: 'numeric' },
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.navyComplyDateFilters = [
      { label: 'All Overdue', value: 'alloverdue' },
      { label: '90+ Days Overdue', value: 'overdue90Plus' },
      { label: '30-90 Days Overdue', value: 'overdue30To90' },
      { label: '0-30 Days Overdue', value: 'overdue0To30' },
      { label: '0-14 Days Overdue', value: 'overdue0To14' },
      { label: '0-7 Days Overdue', value: 'overdue0To7' },
      { label: 'Due Within 7 Days', value: 'dueWithin7' },
      { label: 'Due Within 14 Days', value: 'dueWithin14' },
      { label: 'Due Within 30 Days', value: 'dueWithin30' },
      { label: 'Due Within 90 Days', value: 'dueWithin90' },
    ];
    this.resetColumnSelections();
  }

  async getIAVPluginIDs() {
    try {
      const data = await (
        await this.importService.getIAVPluginIds()
      ).toPromise();
      this.iavPluginIDs = data;
      await this.getIAVFindings(this.iavPluginIDs);
    } catch (error) {
      console.error('Error fetching IAV mapped pluginIDs:', error);
      this.showErrorMessage(
        'Error fetching IAV mapped pluginIDs. Please try again.',
      );
    }
  }

  async getIAVFindings(pluginIDs: string) {
    const analysisParams = {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: this.tenableTool,
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 5000,
        filters: [
          {
            id: 'repository',
            filterName: 'repository',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: [
              {
                id: this.tenableRepoId,
              },
            ],
          },
          {
            id: 'pluginID',
            filterName: 'pluginID',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: pluginIDs,
          },
        ],
        vulnTool: this.tenableTool,
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln',
    };

    try {
      this.isLoading = true;

      const data = await (
        await this.importService.postTenableAnalysis(analysisParams)
      ).toPromise();

      const pluginIDList = pluginIDs.split(',').map(Number);
      const iavData: any[] = await (
        await this.importService.getIAVInfoForPlugins(pluginIDList)
      ).toPromise();

      const iavInfoMap = iavData.reduce((acc: { [key: number]: IAVInfo }, item: any) => {
        acc[item.pluginID] = {
          iav: item.iav || null,
          navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : null,
          supersededBy: item.supersededBy || 'N/A'
        };
        return acc;
      }, {});

      this.IAVVulnerabilities = data.response.results.map((vuln: any) => {
        const defaultVuln = {
          pluginID: '',
          pluginName: '',
          family: { name: '' },
          severity: { name: '' },
          vprScore: '',
          ips: [],
          acrScore: '',
          assetExposureScore: '',
          netbiosName: '',
          dnsName: '',
          macAddress: '',
          port: '',
          protocol: '',
          uuid: '',
          hostUUID: '',
          total: '',
          hostTotal: '',
        };

        const poamAssociation = this.existingPoamPluginIDs[vuln.pluginID];
        const iavInfo = iavInfoMap[Number(vuln.pluginID)];

        return {
          ...defaultVuln,
          ...vuln,
          poam: !!poamAssociation,
          poamId: poamAssociation?.poamId || null,
          poamStatus: poamAssociation?.status || null,
          iav: iavInfo?.iav || '',
          navyComplyDate: iavInfo?.navyComplyDate ? parseISO(iavInfo.navyComplyDate) : null,
          supersededBy: iavInfo?.supersededBy || 'N/A',
          pluginName: vuln.name || '',
          family: vuln.family?.name || '',
          severity: vuln.severity?.name || '',
          pluginID: vuln.pluginID ? parseInt(vuln.pluginID) : '',
          vprScore: vuln.vprScore ? parseFloat(vuln.vprScore) : '',
          total: vuln.total ? parseInt(vuln.total) : '',
          hostTotal: vuln.hostTotal ? parseInt(vuln.hostTotal) : '',
          acrScore: vuln.acrScore ? parseFloat(vuln.acrScore) : '',
          assetExposureScore: vuln.assetExposureScore ? parseInt(vuln.assetExposureScore) : '',
          port: vuln.port ? parseInt(vuln.port) : '',
        };
      });

      this.totalRecords = this.IAVVulnerabilities.length;

      if (this.table) {
        this.table.filters = { ...this.filters };
      }

    } catch (error) {
      console.error('Error fetching IAV Vulnerabilities:', error);
      this.showErrorMessage(
        'Error fetching IAV Vulnerabilities. Please try again.',
      );
    } finally {
      this.isLoading = false;
    }
  }

  async loadPoamAssociations() {
    try {
      const poamData = await (
        await this.poamService.getPluginIDsWithPoam()
      ).toPromise();
      if (poamData && Array.isArray(poamData)) {
        this.existingPoamPluginIDs = poamData.reduce(
          (
            acc: { [key: string]: { poamId: string; status: string } },
            item: { vulnerabilityId: string; status: string; poamId: string },
          ) => {
            acc[item.vulnerabilityId] = {
              poamId: item.poamId,
              status: item.status
            };
            return acc;
          },
          {},
        );
      } else {
        console.error('Unexpected POAM data format:', poamData);
        this.showErrorMessage(
          'Error loading POAM data. Unexpected data format.',
        );
      }
    } catch (error) {
      console.error('Error loading POAM associations:', error);
      this.showErrorMessage('Error loading POAM data. Please try again.');
    }
  }

  getPoamStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'expired':
      case 'rejected':
      case 'draft':
        return 'maroon';
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
        return 'gold';
      case 'false-positive':
      case 'closed':
        return 'black';
      case 'approved':
        return 'green';
      case 'associated':
        return 'dimgray';
      default:
        return 'maroon';
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

  onRowClick(vulnerability: any, event: any) {
    this.IAVVulnerabilities = [];
    this.filters['pluginID'] = [{
      value: vulnerability.pluginID,
      matchMode: "equals",
      operator: "and"
    }];
    if (this.table) {
      this.table.filters = { ...this.filters };
    }
    this.loadVulnList();
    this.expandColumnSelections();
  }

  loadVulnList() {
    this.tenableTool = 'listvuln';
    this.getIAVFindings(this.iavPluginIDs);
    this.expandColumnSelections();
  }

  loadVulnSummary() {
    this.tenableTool = 'sumid';
    this.getIAVFindings(this.iavPluginIDs);
    this.resetColumnSelections();
  }

  onPluginIDClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    this.showDetails(vulnerability);
  }

  async showDetails(vulnerability: any, createPoam: boolean = false) {
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
          this.pluginData.description.replace(/\n\n/g, '<br>'),
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
      if (!createPoam) {
        this.displayDialog = true;
      }
    } catch (error) {
      console.error('Error fetching plugin data:', error);
      this.showErrorMessage('Error fetching plugin data. Please try again.');
    }
  }

  async onPoamIconClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    if (vulnerability.poam && vulnerability.poamId) {
      this.router.navigateByUrl(
        `/poam-processing/poam-details/${vulnerability.poamId}`,
      );
    } else {
      await this.showDetails(vulnerability, true);
      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource:
            'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData,
          iavNumber: vulnerability.iav,
          iavComplyByDate: vulnerability.navyComplyDate,
        },
      });
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
    const refs = xrefs.split(/\s+/);
    this.cveReferences = [];
    this.iavReferences = [];
    this.otherReferences = [];
    refs.forEach((ref: string) => {
      let [type, value] = ref.split(':');
      value = value.replace(/,\s*$/, '');
      if (type === 'CVE') {
        this.cveReferences.push({ type, value });
      } else if (['IAVA', 'IAVB', 'IAVT'].includes(type)) {
        this.iavReferences.push({ type, value });
      } else {
        this.otherReferences.push({ type, value });
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

  onNavyComplyDateFilterChange(event: any) {
    if (!event || !event.value) {
      delete this.filters['navyComplyDate'];
      if (this.table) {
        this.table.filters['navyComplyDate'] = [];
      }
    } else {
      const today = startOfDay(new Date());
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (event.value) {
        case 'alloverdue':
          endDate = today;
          break;
        case 'overdue90Plus':
          endDate = startOfDay(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
          break;
        case 'overdue30To90':
          startDate = startOfDay(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
          endDate = startOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
          break;
        case 'overdue0To30':
          startDate = startOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
          endDate = today;
          break;
        case 'overdue0To14':
          startDate = startOfDay(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000));
          endDate = today;
          break;
        case 'overdue0To7':
          startDate = startOfDay(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
          endDate = today;
          break;
        case 'dueWithin7':
          startDate = today;
          endDate = startOfDay(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
          break;
        case 'dueWithin14':
          startDate = today;
          endDate = startOfDay(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
          break;
        case 'dueWithin30':
          startDate = today;
          endDate = startOfDay(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
          break;
        case 'dueWithin90':
          startDate = today;
          endDate = startOfDay(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000));
          break;
      }

      const filterConstraints: FilterMetadata[] = [];

      if (startDate) {
        filterConstraints.push({
          value: startDate,
          matchMode: "dateAfter",
          operator: "and"
        });
      }

      if (endDate) {
        filterConstraints.push({
          value: endDate,
          matchMode: "dateBefore",
          operator: "and"
        });
      }

      if (this.table && filterConstraints.length > 0) {
        const col = this.cols.find(c => c.field === 'navyComplyDate');
        if (col) {
          col.filterValue = startDate && endDate ?
            `${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}` :
            startDate ?
              `After ${format(startDate, 'MM/dd/yyyy')}` :
              `Before ${format(endDate!, 'MM/dd/yyyy')}`;
        }

        this.table.filters['navyComplyDate'] = filterConstraints;
        this.table._filter();
      }
    }
  }

  clear() {
    this.table.clear();
    this.filters['supersededBy'] = [{ value: 'N/A', matchMode: "contains", operator: "and" }];
    this.filters['severity'] = [{ value: 'Info', matchMode: "notContains", operator: "and" }];

    if (this.table) {
      this.table.filters['navyComplyDate'] = [];
      this.table.filters = { ...this.filters };
      this.table.filterGlobal(null, 'contains');
    }
    this.filterValue = '';
    this.selectedNavyComplyDateFilter = null;
    this.loadVulnSummary();
  }

  onGlobalFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.table) {
      this.table.filterGlobal(filterValue, 'contains');
    }
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter((col) =>
      [
        'poam',
        'pluginID',
        'pluginName',
        'family',
        'severity',
        'vprScore',
        'iav',
        'navyComplyDate',
        'supersededBy',
        'total',
        'hostTotal'
      ].includes(col.field),
    );
  }

  expandColumnSelections() {
    this.selectedColumns = this.cols.filter((col) =>
      [
        'poam',
        'pluginID',
        'pluginName',
        'family',
        'severity',
        'vprScore',
        'iav',
        'navyComplyDate',
        'supersededBy',
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
      ].includes(col.field),
    );
  }

  toggleNavyComplyFilter() {
    if (this.dropDown.overlayVisible) {
      this.dropDown.hide();
    } else {
      this.dropDown.show();
    }
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
