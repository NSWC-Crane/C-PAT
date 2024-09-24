import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { ImportService } from '../import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OverlayPanel } from 'primeng/overlaypanel';
import { MultiSelect } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
interface Reference {
  type: string;
  value: string;
}
interface IdAndName {
  id: string;
  name: string;
}
interface CustomFilter {
  id: string;
  filterName: string;
  operator: string;
  type: string;
  isPredefined: boolean;
  value: string | string[] | { id: string }[];
}
interface AssetsFilter {
  filterName: string;
  operator: string;
  value: string | string[] | { id: string }[];
}
interface AccordionItem {
  header: string;
  content: string;
  identifier: string;
  options?: any[];
  disabled?: boolean;
  placeholder?: string;
  validator?: (value: string) => boolean;
}
interface IAVInfo {
  iav: string;
  navyComplyDate: string;
}
interface TempFilters {
  [key: string]: any;
}
interface ExportColumn {
  title: string;
  dataKey: string;
}
interface PoamAssociation {
  poamId: string;
  status: string;
}

@Component({
  selector: 'tenable-vulnerabilities',
  templateUrl: './tenableVulnerabilities.component.html',
  styleUrls: ['./tenableVulnerabilities.component.scss'],
  providers: [MessageService],
})
export class TenableVulnerabilitiesComponent implements OnInit, OnDestroy {
  cveReferences: Reference[] = [];
  iavReferences: Reference[] = [];
  otherReferences: Reference[] = [];
  allVulnerabilities: any[] = [];
  iavInfo: { [key: number]: IAVInfo | undefined } = {};
  loadingIavInfo: boolean = false;
  pluginData: any;
  assetOptions: IdAndName[] = [];
  pluginFamilyOptions: IdAndName[] = [];
  auditFileOptions: IdAndName[] = [];
  scanPolicyPluginOptions: IdAndName[] = [];
  userOptions: IdAndName[] = [];
  selectedVulnerability: any;
  displayDialog: boolean = false;
  parsedVprContext: any[] = [];
  isLoading: boolean = false;
  formattedDescription: SafeHtml = '';
  totalRecords: number = 0;
  rows: number = 20;
  cols: any[];
  selectedColumns: any[];
  exportColumns!: ExportColumn[];
  sidebarVisible: boolean = false;
  activeFilters: CustomFilter[] = [];
  tempFilters: TempFilters = this.initializeTempFilters();
  selectedPremadeFilter: any = null;
  overlayVisible: boolean = false;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  existingPoamPluginIDs: { [key: string]: PoamAssociation } = {};
  private subscriptions = new Subscription();
  @ViewChild('ms') multiSelect!: MultiSelect;
  @ViewChild('op') overlayPanel!: OverlayPanel;
  @ViewChild('dt') table!: Table;

  acceptRiskOptions = [
    { label: 'All', value: 'all' },
    { label: 'Accepted Risk', value: 'accepted' },
    { label: 'Non-Accepted Risk', value: 'nonAcceptedRisk' },
  ];

  severityOptions = [
    { label: 'Info', value: '0' },
    { label: 'Low', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'High', value: '3' },
    { label: 'Critical', value: '4' },
  ];

  tenableDateOptions = [
    { label: 'All', value: 'All' },
    { label: 'Within the last day', value: '0:1' },
    { label: 'Within the last 7 days', value: '0:7' },
    { label: 'Within the last 30 days', value: '0:30' },
    { label: 'Within the last 90 days', value: '0:90' },
    { label: 'More than 7 days ago', value: '7:all' },
    { label: 'More than 30 days ago', value: '30:all' },
    { label: 'More than 90 days ago', value: '90:all' },
    { label: 'Current Month', value: 'currentMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Current Quarter', value: 'currentQuarter' },
    { label: 'Last Quarter', value: 'lastQuarter' },
    { label: 'Current Year', value: 'currentYear' },
    { label: 'Last Year', value: 'lastYear' },
    { label: 'More than One Year', value: '365:all' },
  ];
  vulnerabilityLastObservedOptions = this.tenableDateOptions;
  vulnerabilityDiscoveredOptions = this.tenableDateOptions;
  vulnerabilityPublishedOptions = this.tenableDateOptions;
  patchPublishedOptions = this.tenableDateOptions;
  pluginPublishedOptions = this.tenableDateOptions;
  pluginModifiedOptions = this.tenableDateOptions;

  dataFormatOptions = [
    { label: 'Agent', value: 'agent' },
    { label: 'IPv4', value: 'IPv4' },
    { label: 'IPv6', value: 'IPv6' },
    { label: 'Universal', value: 'universal' },
  ];

  aesSeverityOptions = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
    { label: 'Unclassified', value: 'unclassified' },
  ];

  protocolOptions = [
    { label: 'ICMP', value: '1' },
    { label: 'TCP', value: '6' },
    { label: 'UDP', value: '17' },
    { label: 'Unknown', value: '0' },
  ];

  vulnerabilityTypeOptions = [
    { label: 'All', value: 'All' },
    { label: 'IAV Vulnerabilities', value: 'iav' },
    { label: 'Non IAV Vulnerabilities', value: 'non-iav' },
  ];

  exploitAvailableOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ];

  mitigatedOptions = [
    { label: 'Never Mitigated', value: 'never' },
    { label: 'Previously Mitigated', value: 'previously' },
  ];

  recastRiskStatusOptions = [
    { label: 'Non-Recast Risk', value: 'notRecast' },
    { label: 'Recast Risk', value: 'recast' },
  ];

  exploitFrameworkOptions = [
    { label: 'Contains', value: '~=' },
    { label: 'Exact Match', value: '=' },
  ];

  containsAndRegexOptions = [
    { label: 'Contains', value: '=' },
    { label: 'Regex', value: 'pcre' },
  ];
  pluginNameOptions = this.containsAndRegexOptions;
  vulnerabilityTextOptions = this.containsAndRegexOptions;

  pluginTypeOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Compliance', value: 'compliance' },
    { label: 'Event', value: 'lce' },
    { label: 'Passive', value: 'passive' },
  ];

  containsExactMatchAndRegexOptions = [
    { label: 'Contains', value: '~=' },
    { label: 'Exact Match', value: '=' },
    { label: 'Regex', value: 'pcre' },
  ];
  cpeOptions = this.containsExactMatchAndRegexOptions;
  netbiosNameOptions = this.containsExactMatchAndRegexOptions;

  numericOptions = [
    { label: '=', value: '=' },
    { label: '≠', value: '!=' },
    { label: '≥', value: '>=' },
    { label: '≤', value: '<=' },
  ];
  pluginIDOptions = this.numericOptions;
  portOptions = this.numericOptions;
  stigSeverityOptions = this.numericOptions;

  crossReferenceOptions = [
    { label: '=', value: '=' },
    { label: '≠', value: '!=' },
  ];

  customRangeOptions = [
    { label: 'All', value: 'all' },
    { label: 'None', value: 'none' },
    { label: 'Custom Range', value: 'customRange' },
  ];
  assetCriticalityRatingOptions = this.customRangeOptions;
  assetExposureScoreOptions = this.customRangeOptions;
  baseCVSSScoreOptions = this.customRangeOptions;
  cvssV3BaseScoreOptions = this.customRangeOptions;
  vprScoreOptions = this.customRangeOptions;

  premadeFilterOptions = [
    { label: 'Exploitable Findings 7+ Days', value: 'exploitable7' },
    { label: 'Exploitable Findings 30+ Days', value: 'exploitable30' },
    { label: 'Cisco Findings 30+ Days', value: 'cisco30' },
    { label: 'Database Findings 30+ Days', value: 'database30' },
    { label: 'F5 Findings 30+ Days', value: 'f530' },
    { label: 'Linux/Ubuntu Findings 30+ Days', value: 'linuxUbuntu30' },
    {
      label: 'Windows - Monthly Security Patches 30+ Days',
      value: 'windowsPatches30',
    },
    { label: 'Security End of Life', value: 'seol' },
    { label: 'Critical/ High 7+ Days', value: 'criticalHigh7' },
    { label: 'Medium 180+ Days', value: 'medium180' },
    { label: 'Low 365+ Days', value: 'low365' },
    { label: 'Non-Credentialed (Bad Scan)', value: 'nonCredentialedBad' },
    { label: 'Non-Credentialed (Good Scan)', value: 'nonCredentialedGood' },
    { label: 'Exploitable Findings', value: 'exploitable' },
  ];

  accordionItems: AccordionItem[] = [
    {
      header: 'ACR',
      content: 'rangeFilter',
      identifier: 'assetCriticalityRating',
      options: this.assetCriticalityRatingOptions,
    },
    {
      header: 'AES',
      content: 'rangeFilter',
      identifier: 'assetExposureScore',
      options: this.assetExposureScoreOptions,
    },
    {
      header: 'AES Severity',
      content: 'multiSelect',
      identifier: 'aesSeverity',
      options: this.aesSeverityOptions,
    },
    {
      header: 'Accept Risk',
      content: 'dropdown',
      identifier: 'acceptRisk',
      options: this.acceptRiskOptions,
    },
    {
      header: 'Address',
      content: 'input',
      identifier: 'address',
      placeholder: 'IP Address...',
      validator: this.validateAddress.bind(this),
    },
    {
      header: 'Agent ID',
      content: 'input',
      identifier: 'agentId',
      placeholder: 'UUID...',
      validator: this.validateUUID.bind(this),
    },
    {
      header: 'Application CPE',
      content: 'dropdownAndTextarea',
      identifier: 'cpe',
      options: this.cpeOptions,
    },
    {
      header: 'Assets',
      content: 'multiSelect',
      identifier: 'assets',
      options: this.assetOptions,
    },
    {
      header: 'Audit File',
      content: 'dropdown',
      identifier: 'auditFile',
      options: this.auditFileOptions,
    },
    {
      header: 'CCE ID',
      content: 'input',
      identifier: 'cceId',
      placeholder: 'CCE ID...',
    },
    {
      header: 'Cross References',
      content: 'dropdownAndTextarea',
      identifier: 'crossReference',
      options: this.crossReferenceOptions,
    },
    {
      header: 'CVE ID',
      content: 'input',
      identifier: 'cveId',
      placeholder: 'CVE ID...',
    },
    {
      header: 'CVSS v2 Score',
      content: 'rangeFilter',
      identifier: 'baseCVSSScore',
      options: this.baseCVSSScoreOptions,
    },
    {
      header: 'CVSS v2 Vector',
      content: 'input',
      identifier: 'cvssVector',
      placeholder: 'Enter CVSS v2 Vector...',
      validator: this.validateCVSSv2Vector.bind(this),
    },
    {
      header: 'CVSS v3 Score',
      content: 'rangeFilter',
      identifier: 'cvssV3BaseScore',
      options: this.cvssV3BaseScoreOptions,
    },
    {
      header: 'CVSS v3 Vector',
      content: 'input',
      identifier: 'cvssV3Vector',
      placeholder: 'Enter CVSS v3 Vector...',
      validator: this.validateCVSSv3Vector.bind(this),
    },
    {
      header: 'Data Format',
      content: 'multiSelect',
      identifier: 'dataFormat',
      options: this.dataFormatOptions,
    },
    {
      header: 'DNS Name',
      content: 'input',
      identifier: 'dnsName',
      placeholder: 'Enter DNS Name...',
    },
    {
      header: 'Exploit Available',
      content: 'dropdown',
      identifier: 'exploitAvailable',
      options: this.exploitAvailableOptions,
    },
    {
      header: 'Exploit Frameworks',
      content: 'dropdownAndTextarea',
      identifier: 'exploitFrameworks',
      options: this.exploitFrameworkOptions,
    },
    {
      header: 'Host ID',
      content: 'input',
      identifier: 'hostUUID',
      placeholder: 'Enter Host UUID...',
      validator: this.validateUUID.bind(this),
    },
    {
      header: 'IAVM ID',
      content: 'input',
      identifier: 'iavmID',
      placeholder: 'Enter IAVM ID...',
      validator: this.validateIAVM.bind(this),
    },
    {
      header: 'MS Bulletin ID',
      content: 'input',
      identifier: 'msbulletinID',
      placeholder: 'Enter MS Bulletin ID...',
    },
    {
      header: 'Mitigated',
      content: 'dropdown',
      identifier: 'mitigated',
      options: this.mitigatedOptions,
    },
    {
      header: 'NetBIOS Name',
      content: 'dropdownAndTextarea',
      identifier: 'netbiosName',
      options: this.netbiosNameOptions,
    },
    {
      header: 'Patch Published',
      content: 'dropdown',
      identifier: 'patchPublished',
      options: this.patchPublishedOptions,
    },
    {
      header: 'Plugin Family',
      content: 'multiSelect',
      identifier: 'pluginFamily',
      options: this.pluginFamilyOptions,
    },
    {
      header: 'Plugin ID',
      content: 'dropdownAndTextarea',
      identifier: 'pluginID',
      options: this.pluginIDOptions,
    },
    {
      header: 'Plugin Modified',
      content: 'dropdown',
      identifier: 'pluginModified',
      options: this.pluginModifiedOptions,
    },
    {
      header: 'Plugin Name',
      content: 'dropdownAndTextarea',
      identifier: 'pluginName',
      options: this.pluginNameOptions,
    },
    {
      header: 'Plugin Published',
      content: 'dropdown',
      identifier: 'pluginPublished',
      options: this.pluginPublishedOptions,
    },
    {
      header: 'Plugin Type',
      content: 'dropdownAndTextarea',
      identifier: 'pluginType',
      options: this.pluginTypeOptions,
    },
    {
      header: 'Port',
      content: 'dropdownAndTextarea',
      identifier: 'port',
      options: this.portOptions,
    },
    {
      header: 'Protocol',
      content: 'multiSelect',
      identifier: 'protocol',
      options: this.protocolOptions,
    },
    {
      header: 'Recast Risk',
      content: 'dropdown',
      identifier: 'recastRiskStatus',
      options: this.recastRiskStatusOptions,
    },
    {
      header: 'STIG Severity',
      content: 'dropdownAndInput',
      identifier: 'stigSeverity',
      options: this.stigSeverityOptions,
      validator: this.validateStigSeverity.bind(this),
    },
    {
      header: 'Scan Policy Plugins',
      content: 'dropdown',
      identifier: 'scanPolicyPlugins',
      options: this.scanPolicyPluginOptions,
    },
    {
      header: 'Severity',
      content: 'multiSelect',
      identifier: 'severity',
      options: this.severityOptions,
    },
    {
      header: 'Users',
      content: 'multiSelect',
      identifier: 'users',
      options: this.userOptions,
    },
    {
      header: 'Vulnerability Discovered',
      content: 'dropdown',
      identifier: 'vulnerabilityDiscovered',
      options: this.vulnerabilityDiscoveredOptions,
    },
    {
      header: 'Vulnerability Last Observed',
      content: 'dropdown',
      identifier: 'vulnerabilityLastObserved',
      options: this.vulnerabilityLastObservedOptions,
    },
    {
      header: 'Vulnerability Priority Rating',
      content: 'rangeFilter',
      identifier: 'vprScore',
      options: this.vprScoreOptions,
    },
    {
      header: 'Vulnerability Published',
      content: 'dropdown',
      identifier: 'vulnerabilityPublished',
      options: this.vulnerabilityPublishedOptions,
    },
    {
      header: 'Vulnerability Text',
      content: 'dropdownAndTextarea',
      identifier: 'vulnerabilityText',
      options: this.vulnerabilityTextOptions,
    },
    {
      header: 'Vulnerability Type',
      content: 'dropdown',
      identifier: 'vulnerabilityType',
      options: this.vulnerabilityTypeOptions,
    },
  ];

  constructor(
    private importService: ImportService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private collectionService: CollectionsService,
    private messageService: MessageService,
    private poamService: PoamService,
    private sharedService: SharedService,
    private router: Router,
  ) {}

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
    try {
      await Promise.all([
        this.loadAssetOptions(),
        this.loadAuditFileOptions(),
        this.loadPluginFamilyOptions(),
        this.loadScanPolicyPluginOptions(),
        this.loadUserOptions(),
        this.loadPoamAssociations(),
      ]);
      this.updateAccordionItems();
    } catch (error) {
      console.error('Error loading filter list data:', error);
    }
    this.cols = [
      { field: 'poam', header: 'POAM' },
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
      { field: 'iav', header: 'IAV', filterable: false },
      {
        field: 'navyComplyDate',
        header: 'Navy Comply Date',
        filterable: false,
      },
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
    this.resetColumnSelections();
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.tempFilters['severity'] = ['1', '2', '3', '4'];
    this.tempFilters['vulnerabilityLastObserved'] = '0:30';
    this.tempFilters['vulnerabilityPublished'] = '30:all';
    this.applyFilters();
  }

  private initializeTempFilters(): TempFilters {
    return {
      assetCriticalityRating: { value: 'all', min: 0, max: 10 },
      acceptRisk: null,
      address: { value: null, operator: null, isValid: true, isDirty: false },
      assetExposureScore: { value: 'all', min: 0, max: 1000 },
      aesSeverity: [],
      agentId: { value: null, operator: null, isValid: true, isDirty: false },
      assets: [],
      cpe: { operator: null, value: null },
      auditFile: [],
      cceId: { value: null, operator: null, isValid: true, isDirty: false },
      cveId: { value: null, operator: null, isValid: true, isDirty: false },
      baseCVSSScore: { value: 'all', min: 0, max: 10 },
      cvssVector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false,
      },
      cvssV3BaseScore: { value: 'all', min: 0, max: 10 },
      cvssV3Vector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false,
      },
      crossReference: { operator: null, value: null },
      dataFormat: [],
      dnsName: { value: null, operator: null, isValid: true, isDirty: false },
      exploitFrameworks: { operator: null, value: null },
      hostUUID: { value: null, operator: null, isValid: true, isDirty: false },
      iavmID: { value: null, operator: null, isValid: true, isDirty: false },
      msbulletinID: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false,
      },
      netbiosName: { operator: null, value: null },
      patchPublished: null,
      pluginID: { operator: null, value: null },
      pluginPublished: null,
      pluginModified: null,
      port: { operator: null, value: null },
      protocol: [],
      exploitAvailable: null,
      mitigated: null,
      pluginFamily: [],
      pluginName: { operator: null, value: null },
      pluginType: { operator: null, value: null },
      recastRiskStatus: null,
      scanPolicyPlugins: [],
      severity: [],
      stigSeverity: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false,
      },
      users: [],
      vprScore: { value: 'all', min: 0, max: 10 },
      vulnerabilityType: null,
      vulnerabilityLastObserved: null,
      vulnerabilityDiscovered: null,
      vulnerabilityPublished: null,
      vulnerabilityText: { operator: null, value: null },
      policy: [],
      scanPolicyPlugin: [],
      user: [],
    };
  }

  updateAccordionItems() {
    this.accordionItems = this.accordionItems.map((item) => {
      switch (item.identifier) {
        case 'assets':
          return { ...item, options: this.assetOptions };
        case 'auditFile':
          return { ...item, options: this.auditFileOptions };
        case 'pluginFamily':
          return { ...item, options: this.pluginFamilyOptions };
        case 'scanPolicyPlugins':
          return { ...item, options: this.scanPolicyPluginOptions };
        case 'users':
          return { ...item, options: this.userOptions };
        default:
          return item;
      }
    });
    this.cdr.detectChanges();
  }

  async loadAssetOptions() {
    try {
      const assetsData = await (
        await this.importService.getTenableAssetsFilter()
      ).toPromise();
      this.assetOptions = assetsData.response.usable.map((assets: any) => ({
        value: assets.id,
        label: assets.name,
      }));
    } catch (error) {
      console.error('Error fetching tenable asset filter data:', error);
      this.showPopup(
        'Error fetching tenable asset filter data. Please try again.',
      );
    }
  }

  async loadAuditFileOptions() {
    try {
      const auditFileData = await (
        await this.importService.getTenableAuditFileFilter()
      ).toPromise();
      this.auditFileOptions = auditFileData.response.usable.map(
        (auditFile: any) => ({
          value: auditFile.id,
          label: auditFile.name,
        }),
      );
    } catch (error) {
      console.error('Error fetching audit file data:', error);
      this.showPopup('Error fetching audit file data. Please try again.');
    }
  }

  async loadPluginFamilyOptions() {
    try {
      const pluginFamilyData = await (
        await this.importService.getTenablePluginFamily()
      ).toPromise();
      this.pluginFamilyOptions = pluginFamilyData.response.map(
        (family: any) => ({
          value: family.id,
          label: family.name,
        }),
      );
    } catch (error) {
      console.error('Error fetching plugin family data:', error);
      this.showPopup('Error fetching plugin family data. Please try again.');
    }
  }

  async loadScanPolicyPluginOptions() {
    try {
      const scanPolicyPluginData = await (
        await this.importService.getTenableScanPolicyPluginsFilter()
      ).toPromise();
      this.scanPolicyPluginOptions = scanPolicyPluginData.response.usable.map(
        (plugins: any) => ({
          value: plugins.id,
          label: plugins.name,
        }),
      );
    } catch (error) {
      console.error('Error fetching scan policy plugin data:', error);
      this.showPopup(
        'Error fetching scan policy plugin data. Please try again.',
      );
    }
  }

  async loadUserOptions() {
    try {
      const userData = await (
        await this.importService.getTenableUsersFilter()
      ).toPromise();
      this.userOptions = userData.response.map((user: any) => ({
        value: user.id,
        label: `${user.firstname} ${user.lastname} [${user.username}]`,
      }));
    } catch (error) {
      console.error('Error fetching tenable user data:', error);
      this.showPopup('Error fetching tenable user data. Please try again.');
    }
  }

  async loadVulnerabilitiesLazy(event: TableLazyLoadEvent) {
    if (!this.tenableRepoId) return;
    this.isLoading = true;
    const startOffset = event.first ?? 0;
    const endOffset = startOffset + (event.rows ?? 20);

    let filters: CustomFilter[] = this.activeFilters;
    const repoFilter = {
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
        filters: [repoFilter, ...filters],
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
      if (data.error_msg) {
        this.showErrorMessage(data.error_msg);
      } else {
        this.allVulnerabilities = data.response.results.map((vuln: any) => {
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
          };

          return {
            ...defaultVuln,
            ...vuln,
            poam: this.existingPoamPluginIDs.hasOwnProperty(vuln.pluginID),
            poamId: this.existingPoamPluginIDs[vuln.pluginID] || null,
            pluginName: vuln.name || '',
            family: vuln.family?.name || '',
            severity: { name: vuln.severity?.name || '' },
          };
        });
        this.totalRecords = data.response.totalRecords;
      }
    } catch (error) {
      console.error('Error fetching all Vulnerabilities:', error);
      this.showErrorMessage(
        'Error fetching all Vulnerabilities. Please try again.',
      );
    } finally {
      this.isLoading = false;
      this.loadCPATMergerInfo();
    }
  }

  showFilterMenu(event: Event) {
    this.overlayPanel.toggle(event);
  }

  applyFamilyFilter(value: any, filterCallback: Function) {
    filterCallback(value);
  }

  clearFamilyFilter(filterCallback: Function) {
    filterCallback(null);
  }

  applySeverityFilter(value: any, filterCallback: Function) {
    filterCallback(value);
  }

  clearSeverityFilter(filterCallback: Function) {
    filterCallback(null);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  onFilterChange(
    event: any,
    identifier: string,
    isInput: boolean = false,
    isOperator: boolean = false,
  ) {
    if (identifier === 'severity') {
      this.tempFilters['severity'] = event.value;
    } else if (identifier === 'vulnerabilityLastObserved') {
      this.tempFilters['vulnerabilityLastObserved'] = event.value;
    }
    if (identifier) {
      const accordionItem = this.accordionItems.find(
        (item) => item.identifier === identifier,
      );
      let value = isInput ? event.target.value : event.value;

      if (!this.tempFilters[identifier]) {
        this.tempFilters[identifier] = { operator: null, value: null };
      }

      if (isInput) {
        this.tempFilters[identifier].value = value;
        this.tempFilters[identifier].isValid =
          !accordionItem?.validator || accordionItem.validator(value);
        this.tempFilters[identifier].isDirty = true;
      } else if (isOperator) {
        this.tempFilters[identifier].operator = value;
      }
    }
  }

  applyFilters() {
    this.activeFilters = Object.entries(this.tempFilters)
      .map(([key, value]) => {
        switch (key) {
          case 'assetCriticalityRating':
            return this.createAssetCriticalityRatingFilter(value);
          case 'acceptRisk':
            return this.createAcceptRiskFilter(value);
          case 'address':
            return this.createAddressFilter(value);
          case 'aesSeverity':
            return this.createAESSeverityFilter(value);
          case 'assets':
            return this.createAssetsFilter(value);
          case 'assetExposureScore':
            return this.createAssetExposureScoreFilter(value);
          case 'auditFile':
            return this.createAuditFileFilter(value);
          case 'agentId':
            return this.createAgentIdFilter(value);
          case 'cceId':
            return this.createCCEIDFilter(value);
          case 'cpe':
            return this.createCPEFilter(value.value, value.operator);
          case 'crossReference':
            return this.createCrossReferenceFilter(value.value, value.operator);
          case 'cveId':
            return this.createCVEIDFilter(value);
          case 'baseCVSSScore':
            return this.createBaseCVSSScoreFilter(value);
          case 'cvssVector':
            return this.createCVSSVectorFilter(value);
          case 'cvssV3BaseScore':
            return this.createCVSSV3BaseScoreFilter(value);
          case 'cvssV3Vector':
            return this.createCVSSV3VectorFilter(value);
          case 'dataFormat':
            return this.createDataFormatFilter(value);
          case 'dnsName':
            return this.createDNSNameFilter(value);
          case 'exploitFrameworks':
            return this.createExploitFrameworksFilter(
              value.value,
              value.operator,
            );
          case 'hostUUID':
            return this.createHostUUIDFilter(value);
          case 'iavmID':
            return this.createIAVMIDFilter(value);
          case 'msbulletinID':
            return this.createMSBulletinIDFilter(value);
          case 'netbiosName':
            return this.createNetbiosNameFilter(value.value, value.operator);
          case 'vulnerabilityType':
            return this.createVulnerabilityTypeFilter(value);
          case 'vulnerabilityLastObserved':
            return this.createVulnerabilityLastObservedFilter(value);
          case 'vulnerabilityDiscovered':
            return this.createVulnerabilityDiscoveredFilter(value);
          case 'vulnerabilityPublished':
            return this.createVulnerabilityPublishedFilter(value);
          case 'patchPublished':
            return this.createPatchPublishedFilter(value);
          case 'pluginPublished':
            return this.createPluginPublishedFilter(value);
          case 'pluginModified':
            return this.createPluginModifiedFilter(value);
          case 'exploitAvailable':
            return this.createExploitAvailableFilter(value);
          case 'mitigated':
            return this.createMitigatedFilter(value);
          case 'pluginID':
            return this.createPluginIDFilter(value.value, value.operator);
          case 'pluginFamily':
            return this.createPluginFamilyFilter(value);
          case 'pluginName':
            return this.createPluginNameFilter(value.value, value.operator);
          case 'pluginType':
            return this.createPluginTypeFilter(value.value, value.operator);
          case 'port':
            return this.createPortFilter(value.value, value.operator);
          case 'protocol':
            return this.createProtocolFilter(value);
          case 'recastRiskStatus':
            return this.createRecastRiskStatusFilter(value);
          case 'scanPolicyPlugins':
            return this.createScanPolicyPluginsFilter(value);
          case 'severity':
            return this.createSeverityFilter(value);
          case 'stigSeverity':
            return this.createStigSeverityFilter(value.value, value.operator);
          case 'users':
            return this.createUsersFilter(value);
          case 'vprScore':
            return this.createVPRScoreFilter(value);
          case 'vulnerabilityText':
            return this.createVulnerabilityTextFilter(
              value.value,
              value.operator,
            );
          default:
            return null;
        }
      })
      .filter((filter): filter is CustomFilter => filter !== null);
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    this.sidebarVisible = false;
  }

  clearIndividualFilter(identifier: string, event: Event) {
    event.stopPropagation();
    switch (identifier) {
      case 'assetCriticalityRating':
      case 'assetExposureScore':
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'vprScore':
        this.tempFilters[identifier] = {
          value: 'all',
          min: 0,
          max: this.getMaxValue(identifier),
        };
        break;
      case 'aesSeverity':
      case 'assets':
      case 'auditFile':
      case 'dataFormat':
      case 'pluginFamily':
      case 'protocol':
      case 'scanPolicyPlugins':
      case 'severity':
      case 'users':
        this.tempFilters[identifier] = [];
        break;
      case 'address':
      case 'agentId':
      case 'cceId':
      case 'cveId':
      case 'cvssVector':
      case 'cvssV3Vector':
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'msbulletinID':
      case 'stigSeverity':
        this.tempFilters[identifier] = {
          value: null,
          operator: null,
          isValid: true,
          isDirty: false,
        };
        break;
      case 'cpe':
      case 'crossReference':
      case 'exploitFrameworks':
      case 'netbiosName':
      case 'pluginID':
      case 'pluginName':
      case 'pluginType':
      case 'port':
      case 'vulnerabilityText':
        this.tempFilters[identifier] = { operator: null, value: null };
        break;
      default:
        this.tempFilters[identifier] = null;
    }
    this.applyFilters();
  }

  isFilterActive(identifier: string): boolean {
    const filter = this.tempFilters[identifier];
    if (!filter) return false;

    switch (identifier) {
      case 'assetCriticalityRating':
      case 'assetExposureScore':
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'vprScore':
        return filter.value !== 'all';
      case 'aesSeverity':
      case 'assets':
      case 'auditFile':
      case 'dataFormat':
      case 'pluginFamily':
      case 'protocol':
      case 'scanPolicyPlugins':
      case 'severity':
      case 'users':
        return filter.length > 0;
      case 'address':
      case 'agentId':
      case 'cceId':
      case 'cveId':
      case 'cvssVector':
      case 'cvssV3Vector':
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'msbulletinID':
        return !!filter.value;
      case 'cpe':
      case 'crossReference':
      case 'exploitFrameworks':
      case 'netbiosName':
      case 'pluginID':
      case 'pluginName':
      case 'pluginType':
      case 'port':
      case 'stigSeverity':
      case 'vulnerabilityText':
        return !!filter.value || !!filter.operator;
      default:
        return !!filter;
    }
  }

  createAssetCriticalityRatingFilter(value: any): CustomFilter | null {
    if (value.value === 'none') {
      return {
        id: 'assetCriticalityRating',
        filterName: 'assetCriticalityRating',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'none',
      };
    } else if (value.value === 'all') {
      return null;
    } else if (value.value === 'customRange') {
      return {
        id: 'assetCriticalityRating',
        filterName: 'assetCriticalityRating',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: `${value.min}-${value.max}`,
      };
    }
    return null;
  }

  createAcceptRiskFilter(value: string): CustomFilter | null {
    if (value && value != 'nonAcceptedRisk') {
      return {
        id: 'acceptRiskStatus',
        filterName: 'acceptRiskStatus',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createAddressFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'ip',
        filterName: 'ip',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  validateAddress(ip: string): boolean {
    const addressRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return addressRegex.test(ip);
  }

  createAssetsFilter(value: any): AssetsFilter | null {
    if (value && value.length > 0) {
      let formattedValue: any = { id: value[0] };
      for (let i = 1; i < value.length; i++) {
        formattedValue = {
          operator: 'intersection',
          operand1: formattedValue,
          operand2: {
            id: value[i],
          },
        };
      }

      return {
        filterName: 'asset',
        operator: '~',
        value: formattedValue,
      };
    }
    return null;
  }

  createAssetExposureScoreFilter(value: any): CustomFilter | null {
    if (value.value === 'none') {
      return {
        id: 'assetExposureScore',
        filterName: 'assetExposureScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'none',
      };
    } else if (value.value === 'all') {
      return null;
    } else if (value.value === 'customRange') {
      return {
        id: 'assetExposureScore',
        filterName: 'assetExposureScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: `${value.min}-${value.max}`,
      };
    }
    return null;
  }

  createAESSeverityFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'aesSeverity',
        filterName: 'aesSeverity',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.join(','),
      };
    }
    return null;
  }

  createAgentIdFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'uuid',
        filterName: 'uuid',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  validateUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }

  createAuditFileFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'auditFile',
        filterName: 'auditFile',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: Array.isArray(value)
          ? value.map((id: string) => ({ id }))
          : [{ id: value }],
      };
    }
    return null;
  }

  createCCEIDFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'cceID',
        filterName: 'cceID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  createCPEFilter(value: string, operator: string): CustomFilter | null {
    if (value) {
      return {
        id: 'cpe',
        filterName: 'cpe',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createCrossReferenceFilter(
    value: string,
    operator: string,
  ): CustomFilter | null {
    if (value) {
      return {
        id: 'xref',
        filterName: 'xref',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createCVEIDFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'cveID',
        filterName: 'cveID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  createBaseCVSSScoreFilter(value: any): CustomFilter | null {
    if (value.value === 'none') {
      return {
        id: 'baseCVSSScore',
        filterName: 'baseCVSSScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'none',
      };
    } else if (value.value === 'all') {
      return null;
    } else if (value.value === 'customRange') {
      return {
        id: 'baseCVSSScore',
        filterName: 'baseCVSSScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: `${value.min}-${value.max}`,
      };
    }
    return null;
  }

  createCVSSVectorFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'cvssVector',
        filterName: 'cvssVector',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  validateCVSSv2Vector(vector: string): boolean {
    const cvssV2Regex =
      /^(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])(\/(?!.*\1)(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])){5}$/;
    return cvssV2Regex.test(vector);
  }

  createCVSSV3BaseScoreFilter(value: any): CustomFilter | null {
    if (value.value === 'none') {
      return {
        id: 'cvssV3BaseScore',
        filterName: 'cvssV3BaseScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'none',
      };
    } else if (value.value === 'all') {
      return null;
    } else if (value.value === 'customRange') {
      return {
        id: 'cvssV3BaseScore',
        filterName: 'cvssV3BaseScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: `${value.min}-${value.max}`,
      };
    }
    return null;
  }

  createCVSSV3VectorFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'cvssV3Vector',
        filterName: 'cvssV3Vector',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  validateCVSSv3Vector(vector: string): boolean {
    const cvssV3Regex =
      /^CVSS:3\.[01]\/((AV:[NALP]|AC:[LH]|PR:[NLH]|UI:[NR]|S:[UC]|C:[NLH]|I:[NLH]|A:[NLH]|E:[XUPFH]|RL:[XOTWU]|RC:[XURC]|CR:[XLH]|IR:[XLH]|AR:[XLH]|MAV:[XNALP]|MAC:[XLH]|MPR:[XNLH]|MUI:[XNR]|MS:[XUC]|MC:[XNLH]|MI:[XNLH]|MA:[XNLH])\/){8,11}$/;
    return cvssV3Regex.test(vector);
  }

  createDNSNameFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'dnsName',
        filterName: 'dnsName',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  createDataFormatFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'dataFormat',
        filterName: 'dataFormat',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.join(','),
      };
    }
    return null;
  }

  createExploitFrameworksFilter(
    value: string,
    operator: string,
  ): CustomFilter | null {
    if (value) {
      return {
        id: 'exploitFrameworks',
        filterName: 'exploitFrameworks',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createHostUUIDFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'hostUUID',
        filterName: 'hostUUID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  createIAVMIDFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'iavmID',
        filterName: 'iavmID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  validateIAVM(iavmNumber: string): boolean {
    const iavmRegex = /^\d{4}-[A-Za-z]-\d{4}$/;
    return iavmRegex.test(iavmNumber);
  }

  createMSBulletinIDFilter(value: any): CustomFilter | null {
    if (value.value) {
      return {
        id: 'msbulletinID',
        filterName: 'msbulletinID',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.value,
      };
    }
    return null;
  }

  createNetbiosNameFilter(
    value: string,
    operator: string,
  ): CustomFilter | null {
    if (value) {
      return {
        id: 'netbiosName',
        filterName: 'netbiosName',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createScanPolicyPluginsFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'policy',
        filterName: 'policy',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: Array.isArray(value)
          ? value.map((id: string) => ({ id }))
          : [{ id: value }],
      };
    }
    return null;
  }

  createUsersFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'responsibleUser',
        filterName: 'responsibleUser',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: Array.isArray(value)
          ? value.map((id: string) => ({ id }))
          : [{ id: value }],
      };
    }
    return null;
  }

  createVulnerabilityTypeFilter(value: string): CustomFilter | null {
    if (value === 'iav') {
      return {
        id: 'xref',
        filterName: 'xref',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'IAVA|20*,IAVB|20*',
      };
    } else if (value === 'non-iav') {
      return {
        id: 'xref',
        filterName: 'xref',
        operator: '!=',
        type: 'vuln',
        isPredefined: true,
        value: 'IAVA|20*,IAVB|20*',
      };
    } else if (value === 'All') {
      return null;
    }
    return null;
  }

  createVulnerabilityLastObservedFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'lastSeen',
        filterName: 'lastSeen',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createVulnerabilityDiscoveredFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'firstSeen',
        filterName: 'firstSeen',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createVulnerabilityPublishedFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'vulnPublished',
        filterName: 'vulnPublished',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPatchPublishedFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'patchPublished',
        filterName: 'patchPublished',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPluginFamilyFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'family',
        filterName: 'family',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: Array.isArray(value)
          ? value.map((id: string) => ({ id }))
          : [{ id: value }],
      };
    }
    return null;
  }

  createPluginPublishedFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'pluginPublished',
        filterName: 'pluginPublished',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPluginModifiedFilter(value: string): CustomFilter | null {
    if (value && value != 'All') {
      return {
        id: 'pluginModified',
        filterName: 'pluginModified',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createProtocolFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'protocol',
        filterName: 'protocol',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.join(','),
      };
    }
    return null;
  }

  createExploitAvailableFilter(value: string): CustomFilter | null {
    if (value) {
      return {
        id: 'exploitAvailable',
        filterName: 'exploitAvailable',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createMitigatedFilter(value: string): CustomFilter | null {
    if (value) {
      return {
        id: 'mitigatedStatus',
        filterName: 'mitigatedStatus',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPluginIDFilter(value: string, operator: string): CustomFilter | null {
    if (value) {
      return {
        id: 'pluginID',
        filterName: 'pluginID',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPluginNameFilter(value: string, operator: string): CustomFilter | null {
    if (value) {
      return {
        id: 'pluginName',
        filterName: 'pluginName',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPluginTypeFilter(value: string, operator: string): CustomFilter | null {
    if (value) {
      return {
        id: 'pluginType',
        filterName: 'pluginType',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createPortFilter(value: string, operator: string): CustomFilter | null {
    if (value) {
      return {
        id: 'port',
        filterName: 'port',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createRecastRiskStatusFilter(value: string): CustomFilter | null {
    if (value) {
      return {
        id: 'recastRiskStatus',
        filterName: 'recastRiskStatus',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  createSeverityFilter(value: string[]): CustomFilter | null {
    if (value && value.length > 0) {
      return {
        id: 'severity',
        filterName: 'severity',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: value.join(','),
      };
    }
    return null;
  }

  createStigSeverityFilter(
    value: string,
    operator: string,
  ): CustomFilter | null {
    if (value) {
      return {
        id: 'stigSeverity',
        filterName: 'stigSeverity',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  validateStigSeverity(severity: string): boolean {
    const stigSeverityRegex = /^(I{1,3})$/;
    return stigSeverityRegex.test(severity);
  }

  createVPRScoreFilter(value: any): CustomFilter | null {
    if (value.value === 'none') {
      return {
        id: 'vprScore',
        filterName: 'vprScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: 'none',
      };
    } else if (value.value === 'all') {
      return null;
    } else if (value.value === 'customRange') {
      return {
        id: 'vprScore',
        filterName: 'vprScore',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: `${value.min}-${value.max}`,
      };
    }
    return null;
  }

  onRangeChange(event: any, identifier: string) {
    this.tempFilters[identifier].value = event.value;
    if (event.value === 'customRange') {
      switch (identifier) {
        case 'assetCriticalityRating':
          this.tempFilters[identifier].min = 1;
          this.tempFilters[identifier].max = 10;
          break;
        case 'assetExposureScore':
          this.tempFilters[identifier].min = 0;
          this.tempFilters[identifier].max = 1000;
          break;
        case 'baseCVSSScore':
        case 'cvssV3BaseScore':
        case 'vprScore':
          this.tempFilters[identifier].min = 0;
          this.tempFilters[identifier].max = 10;
          break;
      }
    }
  }

  onRangeValueChange(identifier: string) {
    const filter = this.tempFilters[identifier];
    switch (identifier) {
      case 'assetCriticalityRating':
        filter.min = Math.max(1, Math.min(filter.min, 10));
        filter.max = Math.max(filter.min, Math.min(filter.max, 10));
        break;
      case 'assetExposureScore':
        filter.min = Math.max(0, Math.min(filter.min, 1000));
        filter.max = Math.max(filter.min, Math.min(filter.max, 1000));
        break;
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'vprScore':
        filter.min = Math.max(0, Math.min(filter.min, 10));
        filter.max = Math.max(filter.min, Math.min(filter.max, 10));
        break;
    }
  }

  createVulnerabilityTextFilter(
    value: string,
    operator: string,
  ): CustomFilter | null {
    if (value) {
      return {
        id: 'pluginText',
        filterName: 'pluginText',
        operator: operator,
        type: 'vuln',
        isPredefined: true,
        value: value,
      };
    }
    return null;
  }

  clearFilters(loadVuln: boolean = true) {
    this.tempFilters = this.initializeTempFilters();
    this.activeFilters = [];
    if (loadVuln) {
      this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
      this.selectedPremadeFilter = null;
    }
  }

  getMinValue(identifier: string): number {
    switch (identifier) {
      case 'assetCriticalityRating':
        return 1;
      default:
        return 0;
    }
  }

  getMaxValue(identifier: string): number {
    switch (identifier) {
      case 'assetExposureScore':
        return 1000;
      case 'assetCriticalityRating':
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'vprScore':
        return 10;
      default:
        return 10000;
    }
  }

  getDefaultFilters(): CustomFilter[] {
    return [
      {
        id: 'severity',
        filterName: 'severity',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '1,2,3,4',
      },
      {
        id: 'lastSeen',
        filterName: 'lastSeen',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '0:30',
      },
      {
        id: 'vulnPublished',
        filterName: 'vulnPublished',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '30:all',
      },
    ];
  }

  applyPremadeFilter(event: any) {
    this.clearFilters(false);
    switch (event.value) {
      case 'exploitable7':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['vulnerabilityLastObserved'] = '7:all';
        break;
      case 'exploitable30':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        break;
      case 'cisco30':
        this.tempFilters['pluginFamily'] = ['33'];
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        break;
      case 'database30':
        this.tempFilters['pluginFamily'] = ['31'];
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        break;
      case 'f530':
        this.tempFilters['pluginFamily'] = ['57'];
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        break;
      case 'linuxUbuntu30':
        this.tempFilters['pluginFamily'] = ['1', '14'];
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        break;
      case 'windowsPatches30':
        this.tempFilters['pluginFamily'] = ['10'];
        this.tempFilters['pluginName'] = {
          operator: '=',
          value: 'Security Update',
        };
        this.tempFilters['vulnerabilityLastObserved'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        break;
      case 'seol':
        this.tempFilters['pluginName'] = { operator: '=', value: 'SEoL' };
        this.tempFilters['vulnerabilityLastObserved'] = '0:30';
        break;
      case 'criticalHigh7':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['vulnerabilityLastObserved'] = '7:all';
        break;
      case 'medium180':
        this.tempFilters['severity'] = ['2'];
        this.tempFilters['vulnerabilityLastObserved'] = '180:all';
        break;
      case 'low365':
        this.tempFilters['severity'] = ['1'];
        this.tempFilters['vulnerabilityLastObserved'] = '365:all';
        break;
      case 'nonCredentialedBad':
        this.tempFilters['pluginID'] = { operator: '=', value: '19506' };
        this.tempFilters['vulnerabilityText'] = {
          operator: '=',
          value: 'Credentialed checks : no',
        };
        this.tempFilters['vulnerabilityLastObserved'] = '3:all';
        break;
      case 'nonCredentialedGood':
        this.tempFilters['pluginID'] = { operator: '=', value: '19506' };
        this.tempFilters['vulnerabilityText'] = {
          operator: '=',
          value: 'Credentialed checks : yes',
        };
        this.tempFilters['vulnerabilityLastObserved'] = '3:all';
        break;
      case 'exploitable':
        this.tempFilters['exploitAvailable'] = 'true';
        break;
    }
    this.applyFilters();
  }

  onRowClick(vulnerability: any, event: any) {
    this.clearFilters(false);
    this.tempFilters['pluginID'] = {
      operator: '=',
      value: vulnerability.pluginID,
    };
    this.applyFilters();
    this.selectedColumns = this.cols.filter((col) =>
      [
        'pluginID',
        'pluginName',
        'family',
        'severity',
        'vprScore',
        'iav',
        'navyComplyDate',
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

  async onPoamIconClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    const poamAssociation = this.existingPoamPluginIDs[vulnerability.id];
    if (poamAssociation) {
      this.router.navigateByUrl(
        `/poam-processing/poam-details/${poamAssociation.poamId}`,
      );
    } else {
      await this.showDetails(vulnerability, true);
      const pluginIAVData = this.iavInfo[this.pluginData.id];
      let formattedIavComplyByDate = null;
      if (pluginIAVData?.navyComplyDate) {
        const complyDate = new Date(pluginIAVData.navyComplyDate);
        formattedIavComplyByDate = format(complyDate, 'yyyy-MM-dd');
      }
      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource:
            'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData,
          iavNumber: pluginIAVData?.iav,
          iavComplyByDate: formattedIavComplyByDate,
        },
      });
    }
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
      this.showPopup('Error fetching plugin data. Please try again.');
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
      } else if (type === 'IAVA' || type === 'IAVB' || type === 'IAVT') {
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
      ].includes(col.field),
    );
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
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
            acc: { [key: string]: PoamAssociation },
            item: { vulnerabilityId: string; poamId: string; status: string },
          ) => {
            acc[item.vulnerabilityId] = {
              poamId: item.poamId,
              status: item.status,
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
    if (
      this.selectedColumns.some(
        (col) => col.field === 'iav' || col.field === 'navyComplyDate',
      )
    ) {
      this.loadingIavInfo = true;
      const pluginIDs = this.allVulnerabilities.map((v) => v.pluginID);
      if (pluginIDs.length > 0) {
        (await this.importService.getIAVInfoForPlugins(pluginIDs)).subscribe(
          (data: any[]) => {
            this.iavInfo = data.reduce(
              (acc, item) => {
                acc[item.pluginID] = {
                  iav: item.iav,
                  navyComplyDate: item.navyComplyDate,
                };
                return acc;
              },
              {} as { [key: number]: IAVInfo },
            );
            this.loadingIavInfo = false;
          },
          (error) => {
            console.error('Error fetching IAV info:', error);
            this.loadingIavInfo = false;
          },
        );
      }
    }
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false',
    };
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
    this.activeFilters = [];
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
