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
import { Table } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
import { PoamService } from '../../../../poam-processing/poams.service';
import { Router } from '@angular/router';
import { format, parseISO, startOfDay } from 'date-fns';
import { SharedService } from '../../../../../common/services/shared.service';
import { Subscription } from 'rxjs';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { FilterMetadata } from "primeng/api";

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
  selectedNavyComplyDateFilter: NavyComplyDateFilter | null = null;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  private subscriptions = new Subscription();

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
        filterable: false
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
        dataType: 'date'
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
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.navyComplyDateFilters = [
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
        tool: 'listvuln',
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
        vulnTool: 'listvuln',
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln',
    };

    try {
      const data = await (
        await this.importService.postTenableAnalysis(analysisParams)
      ).toPromise();
      this.IAVVulnerabilities = data.response.results.map((vuln: any) => {
        const defaultVuln = {
          pluginID: '',
          pluginName: '',
          family: { name: '' },
          severity: { name: '' },
          vprScore: '',
        };

        const poamInfo = this.existingPoamPluginIDs[vuln.pluginID] || null;

        return {
          ...defaultVuln,
          ...vuln,
          poam: poamInfo !== null,
          poamId: poamInfo?.poamId || null,
          poamStatus: poamInfo?.status || null,
          pluginName: vuln.name || '',
          family: vuln.family?.name || '',
          severity: vuln.severity?.name || '',
        };
      });
      this.totalRecords = this.IAVVulnerabilities.length;
      this.isLoading = false;
      await this.loadCPATMergerInfo();
    } catch (error) {
      console.error('Error fetching IAV Vulnerabilities:', error);
      this.showErrorMessage(
        'Error fetching IAV Vulnerabilities. Please try again.',
      );
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

  async loadCPATMergerInfo() {
    try {
      const pluginIDs = this.iavPluginIDs.split(',').map(Number);
      const data: any[] = await (
        await this.importService.getIAVInfoForPlugins(pluginIDs)
      ).toPromise();

      this.iavInfo = data.reduce(
        (acc, item) => {
          acc[item.pluginID] = {
            iav: item.iav,
            navyComplyDate: item.navyComplyDate.split('T')[0],
            supersededBy: item.supersededBy,
          };
          return acc;
        },
        {} as { [key: number]: IAVInfo },
      );

      this.IAVVulnerabilities = this.IAVVulnerabilities.map((vuln) => {
        return {
          ...vuln,
          iav: this.iavInfo[vuln.pluginID]?.iav || '',
          navyComplyDate: this.iavInfo[vuln.pluginID]?.navyComplyDate || '',
          supersededBy: this.iavInfo[vuln.pluginID]?.supersededBy || 'N/A',
        };
      });

      if (this.table) {
        this.table.filters = { ...this.filters };
      }
    } catch (error) {
      console.error('Error fetching IAV info:', error);
      this.showErrorMessage('Error fetching IAV info. Please try again.');
    }
  }

  getPoamStatusInfo(vulnerability: any): { color: string; tooltip: string; icon: string } {
    if (!vulnerability.poam) {
      return {
        color: 'maroon',
        tooltip: 'No Existing POAM. Click icon to create draft POAM.',
        icon: 'pi-times-circle'
      };
    }

    switch (vulnerability.poamStatus?.toLowerCase()) {
      case 'expired':
      case 'rejected':
      case 'draft':
        return {
          color: 'maroon',
          tooltip: `POAM Status: ${vulnerability.poamStatus}. Click icon to view POAM.`,
          icon: 'pi-check-circle'
        };
      case 'submitted':
      case 'pending cat-i approval':
      case 'extension requested':
        return {
          color: 'gold',
          tooltip: `POAM Status: ${vulnerability.poamStatus}. Click icon to view POAM.`,
          icon: 'pi-check-circle'
        };
      case 'false-positive':
      case 'closed':
        return {
          color: 'black',
          tooltip: `POAM Status: ${vulnerability.poamStatus}. Click icon to view POAM.`,
          icon: 'pi-check-circle'
        };
      case 'approved':
        return {
          color: 'green',
          tooltip: 'POAM Status: Approved. Click icon to view POAM.',
          icon: 'pi-check-circle'
        };
      default:
        return {
          color: 'gray',
          tooltip: 'POAM status unknown. Click icon to view POAM.',
          icon: 'pi-check-circle'
        };
    }
  }

  onRowClick(vulnerability: any, event: any) {
    this.filters['pluginID'] = [{
      value: vulnerability.pluginID,
      matchMode: "equals",
      operator: "and"
    }];
    if (this.table) {
      this.table.filters = { ...this.filters };
    }
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
      const pluginIAVData = this.iavInfo[this.pluginData.id];
      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource:
            'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData,
          iavNumber: pluginIAVData?.iav,
          iavComplyByDate: pluginIAVData?.navyComplyDate,
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
      const today = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (event.value) {
        case 'overdue90Plus':
          endDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'overdue30To90':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'overdue0To30':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = today;
          break;
        case 'overdue0To14':
          startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
          endDate = today;
          break;
        case 'overdue0To7':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = today;
          break;
        case 'dueWithin7':
          startDate = today;
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'dueWithin14':
          startDate = today;
          endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'dueWithin30':
          startDate = today;
          endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'dueWithin90':
          startDate = today;
          endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
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
        this.table.filters['navyComplyDate'] = filterConstraints;
        this.table._filter();
      }
    }
  }

  clear() {
    this.filters['supersededBy'] = [{ value: 'N/A', matchMode: "contains", operator: "and" }];
    this.filters['severity'] = [{ value: 'Info', matchMode: "notContains", operator: "and" }];

    if (this.table) {
      this.table.filters['navyComplyDate'] = [];
      this.table.filters = { ...this.filters };
      this.table.filterGlobal(null, 'contains');
    }

    this.filterValue = '';
    this.selectedNavyComplyDateFilter = null;
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
