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
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, signal, inject, viewChild, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/fp';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Popover } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, Observable, Subscription, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import {
  AccordionItem,
  AssetsFilter,
  CustomFilter,
  ExportColumn,
  FilterConfig,
  FilterHandler,
  FilterValue,
  IAVInfo,
  IdAndName,
  ParsedReferences,
  PoamAssociation,
  PremadeFilterOption,
  Reference,
  SeverityStyle,
  TempFilters,
  TenableFilter
} from '../../../../../common/models/tenable.model';
import { PayloadService } from '../../../../../common/services/setPayload.service';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { createIAVInfoMap, createPoamAssociationsMap, getCveUrl, getIavUrl, getPoamStatusColor, getPoamStatusIcon, getPoamStatusTooltip, getSeverityStyling, parseReferences, parseVprContext } from '../../utils/tenable-vulnerability.utils';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../../../../poam-processing/poams.service';
import { ImportService } from '../../../import.service';
import { TenableFiltersComponent } from '../../components/tenableFilters/tenableFilters.component';

@Component({
  selector: 'cpat-tenable-vulnerabilities',
  templateUrl: './tenableVulnerabilities.component.html',
  styleUrls: ['./tenableVulnerabilities.component.scss'],
  standalone: true,
  imports: [
    AccordionModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
    TableModule,
    TabsModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    TenableFiltersComponent,
    TagModule
  ]
})
export class TenableVulnerabilitiesComponent implements OnInit, OnDestroy {
  private importService = inject(ImportService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private collectionsService = inject(CollectionsService);
  protected messageService = inject(MessageService);
  private poamService = inject(PoamService);
  private setPayloadService = inject(PayloadService);
  private sharedService = inject(SharedService);
  private router = inject(Router);

  aaPackage: string = '';
  cveReferences: Reference[] = [];
  iavReferences: Reference[] = [];
  otherReferences: Reference[] = [];
  allVulnerabilities: any[] = [];
  iavInfo: { [key: number]: IAVInfo | undefined } = {};
  loadingIavInfo: boolean = false;
  pluginData: any;
  assetOptions: IdAndName[] = [];
  familyOptions: IdAndName[] = [];
  auditFileOptions: IdAndName[] = [];
  scanPolicyPluginOptions: IdAndName[] = [];
  userOptions: IdAndName[] = [];
  selectedVulnerability: any;
  displayDialog: boolean = false;
  parsedVprContext: any[] = [];
  isLoading: boolean = false;
  formattedDescription: SafeHtml = '';
  totalRecords: number = 0;
  iavVulnerabilitiesCount: number = 0;
  rows: number = 25;
  cols: any[];
  filterSearch: string = '';
  filteredAccordionItems: AccordionItem[] = [];
  selectedColumns: any[];
  exportColumns!: ExportColumn[];
  sidebarVisible: boolean = false;
  activeFilters: CustomFilter[] = [];
  tempFilters: TempFilters = this.initializeTempFilters();
  filterHistory: { filters: TempFilters; tool: string }[] = [];
  currentFilterHistoryIndex: number = -1;
  selectedPremadeFilter: any = null;
  overlayVisible: boolean = false;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  tenableTool: string = 'sumid';
  savedType: string = 'vuln';
  savedSourceType: string = 'cumulative';
  savedTool: string = 'sumid';
  existingPoamPluginIDs: { [key: string]: PoamAssociation } = {};
  accessLevel = signal<number>(0);
  user: any;
  payload: any;
  private subscriptions = new Subscription();
  @Input() parentSidebarVisible: boolean = false;
  @Input() currentPreset: string = 'main';
  readonly sidebarToggle = output<boolean>();
  readonly totalRecordsChange = output<number>();

  readonly multiSelect = viewChild.required<MultiSelect>('ms');
  readonly overlayPanel = viewChild.required<Popover>('op');
  readonly table = viewChild.required<Table>('dt');

  acceptRiskStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Accepted Risk', value: 'accepted' },
    { label: 'Non-Accepted Risk', value: 'nonAcceptedRisk' }
  ];

  testStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Enabled', value: 'true' },
    { label: 'Disabled', value: 'false' }
  ];

  paranoidScanOptions = [
    { label: 'All', value: 'all' },
    { label: 'Paranoid', value: 'true' },
    { label: 'Not Paranoid', value: 'false' }
  ];

  assetsOperatorOptions = [
    { label: 'Contains', value: 'contains' },
    { label: 'Does Not Contain', value: 'notContains' }
  ];

  severityOptions = [
    { label: 'Info', value: '0' },
    { label: 'Low', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'High', value: '3' },
    { label: 'Critical', value: '4' }
  ];

  tenableDateOptions = [
    { label: 'All', value: 'All' },
    { label: 'Within the last day', value: '0:1' },
    { label: 'Within the last 3 days', value: '0:3' },
    { label: 'Within the last 7 days', value: '0:7' },
    { label: 'Within the last 14 days', value: '0:14' },
    { label: 'Within the last 30 days', value: '0:30' },
    { label: 'Within the last 90 days', value: '0:90' },
    { label: 'Within the last 180 days', value: '0:180' },
    { label: 'More than 3 days ago', value: '3:all' },
    { label: 'More than 7 days ago', value: '7:all' },
    { label: 'More than 14 days ago', value: '14:all' },
    { label: 'More than 30 days ago', value: '30:all' },
    { label: 'More than 90 days ago', value: '90:all' },
    { label: 'More than 180 days ago', value: '180:all' },
    { label: 'Current Month', value: 'currentMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Current Quarter', value: 'currentQuarter' },
    { label: 'Last Quarter', value: 'lastQuarter' },
    { label: 'Current Year', value: 'currentYear' },
    { label: 'Last Year', value: 'lastYear' },
    { label: 'More than One Year', value: '365:all' }
  ];
  seolDateOptions = this.tenableDateOptions;
  lastSeenOptions = this.tenableDateOptions;
  firstSeenOptions = this.tenableDateOptions;
  vulnPublishedOptions = this.tenableDateOptions;
  patchPublishedOptions = this.tenableDateOptions;
  pluginPublishedOptions = this.tenableDateOptions;
  pluginModifiedOptions = this.tenableDateOptions;

  dataFormatOptions = [
    { label: 'Agent', value: 'agent' },
    { label: 'IPv4', value: 'IPv4' },
    { label: 'IPv6', value: 'IPv6' },
    { label: 'Universal', value: 'universal' }
  ];

  aesSeverityOptions = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
    { label: 'Unclassified', value: 'unclassified' }
  ];

  protocolOptions = [
    { label: 'ICMP', value: '1' },
    { label: 'TCP', value: '6' },
    { label: 'UDP', value: '17' },
    { label: 'Unknown', value: '0' }
  ];

  vulnerabilityTypeOptions = [
    { label: 'All', value: 'All' },
    { label: 'IAV Vulnerabilities', value: 'iav' },
    { label: 'Non IAV Vulnerabilities', value: 'non-iav' }
  ];

  webAppScanningOptions = [
    { label: 'Exclude Web App Results', value: 'excludeWas' },
    { label: 'Include Web App Results', value: 'includeWas' },
    { label: 'Only Web App Results', value: 'onlyWas' }
  ];

  exploitAvailableOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  mitigatedStatusOptions = [
    { label: 'Never Mitigated', value: 'never' },
    { label: 'Previously Mitigated', value: 'previously' }
  ];

  recastRiskStatusOptions = [
    { label: 'Non-Recast Risk', value: 'notRecast' },
    { label: 'Recast Risk', value: 'recast' }
  ];

  exploitFrameworkOptions = [
    { label: 'Contains', value: '~=' },
    { label: 'Exact Match', value: '=' }
  ];

  containsAndRegexOptions = [
    { label: 'Contains', value: '=' },
    { label: 'Regex', value: 'pcre' }
  ];
  pluginNameOptions = this.containsAndRegexOptions;
  pluginTextOptions = this.containsAndRegexOptions;

  pluginTypeOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Compliance', value: 'compliance' },
    { label: 'Event', value: 'lce' },
    { label: 'Passive', value: 'passive' }
  ];

  containsExactMatchAndRegexOptions = [
    { label: 'Contains', value: '~=' },
    { label: 'Exact Match', value: '=' },
    { label: 'Regex', value: 'pcre' }
  ];
  cpeOptions = this.containsExactMatchAndRegexOptions;
  netbiosNameOptions = this.containsExactMatchAndRegexOptions;

  numericOptions = [
    { label: '=', value: '=' },
    { label: '≠', value: '!=' },
    { label: '≥', value: '>=' },
    { label: '≤', value: '<=' }
  ];
  pluginIDOptions = this.numericOptions;
  portOptions = this.numericOptions;
  stigSeverityOptions = this.numericOptions;

  xrefOptions = [
    { label: '=', value: '=' },
    { label: '≠', value: '!=' }
  ];

  customRangeOptions = [
    { label: 'All', value: 'all' },
    { label: 'None', value: 'none' },
    { label: 'Custom Range', value: 'customRange' }
  ];
  assetCriticalityRatingOptions = this.customRangeOptions;
  assetExposureScoreOptions = this.customRangeOptions;
  baseCVSSScoreOptions = this.customRangeOptions;
  cvssV3BaseScoreOptions = this.customRangeOptions;
  cvssV4BaseScoreOptions = this.customRangeOptions;
  cvssV4ThreatScoreOptions = this.customRangeOptions;
  vprScoreOptions = this.customRangeOptions;

  defaultPremadeFilterOptions: PremadeFilterOption[] = [
    { label: 'Vulnerability Published 30+ Days', value: 'vulnpublished30' },
    { label: 'Plugin Published 30+ Days', value: 'pluginpublished30' },
    { label: 'Exploitable Findings 7+ Days', value: 'exploitable7' },
    { label: 'Exploitable Findings 30+ Days', value: 'exploitable30' },
    { label: 'Critical/ High 7+ Days', value: 'criticalHigh7' },
    { label: 'Critical/ High 14+ Days', value: 'criticalHigh14' },
    { label: 'Critical/ High 30+ Days', value: 'criticalHigh30' },
    { label: 'Medium 180+ Days', value: 'medium180' },
    { label: 'Low 365+ Days', value: 'low365' },
    { label: 'Security End of Life', value: 'seol' },
    { label: 'Non-Credentialed (Bad Scan)', value: 'nonCredentialedBad' },
    { label: 'Non-Credentialed (Good Scan)', value: 'nonCredentialedGood' },
    { label: 'Exploitable Findings', value: 'exploitable' }
  ];

  premadeFilterOptions: PremadeFilterOption[] = [...this.defaultPremadeFilterOptions];

  accordionItems: AccordionItem[] = [
    {
      header: 'ACR',
      content: 'rangeFilter',
      identifier: 'assetCriticalityRating',
      options: this.assetCriticalityRatingOptions,
      value: 0
    },
    {
      header: 'AES',
      content: 'rangeFilter',
      identifier: 'assetExposureScore',
      options: this.assetExposureScoreOptions,
      value: 1
    },
    {
      header: 'AES Severity',
      content: 'multiSelect',
      identifier: 'aesSeverity',
      options: this.aesSeverityOptions,
      value: 2
    },
    {
      header: 'Accept Risk',
      content: 'dropdown',
      identifier: 'acceptRiskStatus',
      options: this.acceptRiskStatusOptions,
      value: 3
    },
    {
      header: 'Address',
      content: 'input',
      identifier: 'ip',
      placeholder: 'IP Address...',
      validator: this.validateIP.bind(this),
      value: 4
    },
    {
      header: 'Agent ID',
      content: 'input',
      identifier: 'uuid',
      placeholder: 'UUID...',
      validator: this.validateUUID.bind(this),
      value: 5
    },
    {
      header: 'Application CPE',
      content: 'dropdownAndTextarea',
      identifier: 'cpe',
      options: this.cpeOptions,
      value: 6
    },
    {
      header: 'Assets',
      content: 'multiSelect',
      identifier: 'asset',
      options: this.assetOptions,
      value: 7
    },
    {
      header: 'Audit File',
      content: 'dropdown',
      identifier: 'auditFile',
      options: this.auditFileOptions,
      value: 8
    },
    {
      header: 'CCE ID',
      content: 'input',
      identifier: 'cceId',
      placeholder: 'CCE ID...',
      value: 9
    },
    {
      header: 'Cross References',
      content: 'dropdownAndTextarea',
      identifier: 'xref',
      options: this.xrefOptions,
      value: 10
    },
    {
      header: 'CVE ID',
      content: 'input',
      identifier: 'cveId',
      placeholder: 'CVE ID...',
      value: 11
    },
    {
      header: 'CVSS v2 Score',
      content: 'rangeFilter',
      identifier: 'baseCVSSScore',
      options: this.baseCVSSScoreOptions,
      value: 12
    },
    {
      header: 'CVSS v2 Vector',
      content: 'input',
      identifier: 'cvssVector',
      placeholder: 'Enter CVSS v2 Vector...',
      validator: this.validateCVSSv2Vector.bind(this),
      value: 13
    },
    {
      header: 'CVSS v3 Score',
      content: 'rangeFilter',
      identifier: 'cvssV3BaseScore',
      options: this.cvssV3BaseScoreOptions,
      value: 14
    },
    {
      header: 'CVSS v3 Vector',
      content: 'input',
      identifier: 'cvssV3Vector',
      placeholder: 'Enter CVSS v3 Vector...',
      validator: this.validateCVSSv3Vector.bind(this),
      value: 15
    },
    {
      header: 'CVSS v4 Score',
      content: 'rangeFilter',
      identifier: 'cvssV4BaseScore',
      options: this.cvssV4BaseScoreOptions,
      value: 16
    },
    {
      header: 'CVSS v4 Threat Score',
      content: 'rangeFilter',
      identifier: 'cvssV4ThreatScore',
      options: this.cvssV4ThreatScoreOptions,
      value: 17
    },
    {
      header: 'CVSS v4 Supplemental',
      content: 'input',
      identifier: 'cvssV4Supplemental',
      placeholder: 'Enter CVSS v4 Supplemental...',
      value: 18
    },
    {
      header: 'CVSS v4 Threat Vector',
      content: 'input',
      identifier: 'cvssV4ThreatVector',
      placeholder: 'Enter CVSS v4 Threat Vector...',
      value: 19
    },
    {
      header: 'CVSS v4 Vector',
      content: 'input',
      identifier: 'cvssV4Vector',
      placeholder: 'Enter CVSS v4 Vector...',
      validator: this.validateCVSSv4Vector.bind(this),
      value: 20
    },
    {
      header: 'Data Format',
      content: 'multiSelect',
      identifier: 'dataFormat',
      options: this.dataFormatOptions,
      value: 21
    },
    {
      header: 'DNS Name',
      content: 'input',
      identifier: 'dnsName',
      placeholder: 'Enter DNS Name...',
      value: 22
    },
    {
      header: 'Exploit Available',
      content: 'dropdown',
      identifier: 'exploitAvailable',
      options: this.exploitAvailableOptions,
      value: 23
    },
    {
      header: 'Exploit Frameworks',
      content: 'dropdownAndTextarea',
      identifier: 'exploitFrameworks',
      options: this.exploitFrameworkOptions,
      value: 24
    },
    {
      header: 'Host ID',
      content: 'input',
      identifier: 'hostUUID',
      placeholder: 'Enter Host UUID...',
      validator: this.validateUUID.bind(this),
      value: 25
    },
    {
      header: 'IAVM ID',
      content: 'input',
      identifier: 'iavmID',
      placeholder: 'Enter IAVM ID...',
      validator: this.validateIAVM.bind(this),
      value: 26
    },
    {
      header: 'Input Name',
      content: 'input',
      identifier: 'wasInputName',
      placeholder: 'Enter input name...',
      value: 27
    },
    {
      header: 'Input Type',
      content: 'input',
      identifier: 'wasInputType',
      placeholder: 'Enter input type...',
      value: 28
    },
    {
      header: 'MS Bulletin ID',
      content: 'input',
      identifier: 'msbulletinID',
      placeholder: 'Enter MS Bulletin ID...',
      value: 29
    },
    {
      header: 'Mitigated',
      content: 'dropdown',
      identifier: 'mitigatedStatus',
      options: this.mitigatedStatusOptions,
      value: 30
    },
    {
      header: 'Nessus Web Tests',
      content: 'dropdown',
      identifier: 'cgiScanEnabled',
      options: this.testStatusOptions,
      value: 31
    },
    {
      header: 'NetBIOS Name',
      content: 'dropdownAndTextarea',
      identifier: 'netbiosName',
      options: this.netbiosNameOptions,
      value: 32
    },
    {
      header: 'Operating System',
      content: 'input',
      identifier: 'operatingSystem',
      placeholder: 'Enter Operating System...',
      value: 33
    },
    {
      header: 'Patch Published',
      content: 'dropdown',
      identifier: 'patchPublished',
      options: this.patchPublishedOptions,
      value: 34
    },
    {
      header: 'Plugin Family',
      content: 'multiSelect',
      identifier: 'family',
      options: this.familyOptions,
      value: 35
    },
    {
      header: 'Plugin ID',
      content: 'dropdownAndTextarea',
      identifier: 'pluginID',
      options: this.pluginIDOptions,
      value: 36
    },
    {
      header: 'Plugin Modified',
      content: 'dropdown',
      identifier: 'pluginModified',
      options: this.pluginModifiedOptions,
      value: 37
    },
    {
      header: 'Plugin Name',
      content: 'dropdownAndTextarea',
      identifier: 'pluginName',
      options: this.pluginNameOptions,
      value: 38
    },
    {
      header: 'Plugin Published',
      content: 'dropdown',
      identifier: 'pluginPublished',
      options: this.pluginPublishedOptions,
      value: 39
    },
    {
      header: 'Plugin Type',
      content: 'dropdown',
      identifier: 'pluginType',
      options: this.pluginTypeOptions,
      value: 40
    },
    {
      header: 'Port',
      content: 'dropdownAndTextarea',
      identifier: 'port',
      options: this.portOptions,
      value: 41
    },
    {
      header: 'Protocol',
      content: 'multiSelect',
      identifier: 'protocol',
      options: this.protocolOptions,
      value: 42
    },
    {
      header: 'Recast Risk',
      content: 'dropdown',
      identifier: 'recastRiskStatus',
      options: this.recastRiskStatusOptions,
      value: 43
    },
    {
      header: 'STIG Severity',
      content: 'dropdownAndInput',
      identifier: 'stigSeverity',
      options: this.stigSeverityOptions,
      validator: this.validateStigSeverity.bind(this),
      value: 44
    },
    {
      header: 'Scan Accuracy',
      content: 'dropdown',
      identifier: 'paranoidScanEnabled',
      options: this.paranoidScanOptions,
      value: 45
    },
    {
      header: 'Scan Policy Plugins',
      content: 'dropdown',
      identifier: 'policy',
      options: this.scanPolicyPluginOptions,
      value: 46
    },
    {
      header: 'Security End of Life Date',
      content: 'dropdown',
      identifier: 'seolDate',
      options: this.seolDateOptions,
      value: 47
    },
    {
      header: 'Severity',
      content: 'multiSelect',
      identifier: 'severity',
      options: this.severityOptions,
      value: 48
    },
    {
      header: 'Thorough Tests',
      content: 'dropdown',
      identifier: 'thoroughScanEnabled',
      options: this.testStatusOptions,
      value: 49
    },
    {
      header: 'Users',
      content: 'multiSelect',
      identifier: 'responsibleUser',
      options: this.userOptions,
      value: 50
    },
    {
      header: 'Vulnerability Discovered',
      content: 'dropdown',
      identifier: 'firstSeen',
      options: this.firstSeenOptions,
      value: 51
    },
    {
      header: 'Vulnerability ID',
      content: 'input',
      identifier: 'vulnUUID',
      placeholder: 'Enter Vuln UUID...',
      value: 52
    },
    {
      header: 'Vulnerability Last Observed',
      content: 'dropdown',
      identifier: 'lastSeen',
      options: this.lastSeenOptions,
      value: 53
    },
    {
      header: 'Vulnerability Priority Rating',
      content: 'rangeFilter',
      identifier: 'vprScore',
      options: this.vprScoreOptions,
      value: 54
    },
    {
      header: 'Vulnerability Published',
      content: 'dropdown',
      identifier: 'vulnPublished',
      options: this.vulnPublishedOptions,
      value: 55
    },
    {
      header: 'Vulnerability Text',
      content: 'dropdownAndTextarea',
      identifier: 'pluginText',
      options: this.pluginTextOptions,
      value: 56
    },
    {
      header: 'Vulnerability Type',
      content: 'dropdown',
      identifier: 'vulnerabilityType',
      options: this.vulnerabilityTypeOptions,
      value: 57
    },
    {
      header: 'Web App HTTP Method',
      content: 'input',
      identifier: 'wasHttpMethod',
      placeholder: 'Web app HTTP method...',
      value: 58
    },
    {
      header: 'Web App Scanning',
      content: 'dropdown',
      identifier: 'wasVuln',
      options: this.webAppScanningOptions,
      value: 59
    },
    {
      header: 'Web App URL',
      content: 'input',
      identifier: 'wasURL',
      placeholder: 'Web app URL...',
      value: 60
    }
  ];

  private readonly filterNameMappings: { [key: string]: FilterConfig } = {
    family: { uiName: 'family', handler: 'family' },
    severity: { uiName: 'severity', handler: 'severity' },

    auditFile: { uiName: 'auditFile', handler: 'idArray' },
    responsibleUser: { uiName: 'responsibleUser', handler: 'idArray' },
    asset: { uiName: 'asset', handler: 'idArray' },
    policy: { uiName: 'policy', handler: 'idArray' },

    aesSeverity: { uiName: 'aesSeverity', handler: 'array' },
    dataFormat: { uiName: 'dataFormat', handler: 'array' },
    protocol: { uiName: 'protocol', handler: 'array' },

    ip: { uiName: 'ip', handler: 'operatorValue' },
    uuid: { uiName: 'uuid', handler: 'operatorValue' },
    pluginText: { uiName: 'pluginText', handler: 'operatorValue' },
    pluginID: { uiName: 'pluginID', handler: 'operatorValue' },
    pluginName: { uiName: 'pluginName', handler: 'operatorValue' },
    port: { uiName: 'port', handler: 'operatorValue' },
    netbiosName: { uiName: 'netbiosName', handler: 'operatorValue' },
    cpe: { uiName: 'cpe', handler: 'operatorValue' },
    exploitFrameworks: { uiName: 'exploitFrameworks', handler: 'operatorValue' },
    cceID: { uiName: 'cceId', handler: 'operatorValue' },
    cveID: { uiName: 'cveId', handler: 'operatorValue' },
    cvssVector: { uiName: 'cvssVector', handler: 'operatorValue' },
    cvssV3Vector: { uiName: 'cvssV3Vector', handler: 'operatorValue' },
    cvssV4Vector: { uiName: 'cvssV4Vector', handler: 'operatorValue' },
    cvssV4Supplemental: { uiName: 'cvssV4Supplemental', handler: 'operatorValue' },
    cvssV4ThreatVector: { uiName: 'cvssV4ThreatVector', handler: 'operatorValue' },
    dnsName: { uiName: 'dnsName', handler: 'operatorValue' },
    hostUUID: { uiName: 'hostUUID', handler: 'operatorValue' },
    iavmID: { uiName: 'iavmID', handler: 'operatorValue' },
    wasInputName: { uiName: 'wasInputName', handler: 'operatorValue' },
    wasInputType: { uiName: 'wasInputType', handler: 'operatorValue' },
    msbulletinID: { uiName: 'msbulletinID', handler: 'operatorValue' },
    operatingSystem: { uiName: 'operatingSystem', handler: 'operatorValue' },
    stigSeverity: { uiName: 'stigSeverity', handler: 'operatorValue' },
    xref: { uiName: 'xref', handler: 'operatorValue' },
    vulnUUID: { uiName: 'vulnUUID', handler: 'operatorValue' },
    wasHttpMethod: { uiName: 'wasHttpMethod', handler: 'operatorValue' },
    wasURL: { uiName: 'wasURL', handler: 'operatorValue' },

    patchPublished: { uiName: 'patchPublished', handler: 'simpleValue' },
    pluginPublished: { uiName: 'pluginPublished', handler: 'simpleValue' },
    pluginType: { uiName: 'pluginType', handler: 'simpleValue' },
    pluginModified: { uiName: 'pluginModified', handler: 'simpleValue' },
    exploitAvailable: { uiName: 'exploitAvailable', handler: 'simpleValue' },
    mitigatedStatus: { uiName: 'mitigatedStatus', handler: 'simpleValue' },
    recastRiskStatus: { uiName: 'recastRiskStatus', handler: 'simpleValue' },
    acceptRiskStatus: { uiName: 'acceptRiskStatus', handler: 'simpleValue' },
    lastSeen: { uiName: 'lastSeen', handler: 'simpleValue' },
    firstSeen: { uiName: 'firstSeen', handler: 'simpleValue' },
    seolDate: { uiName: 'seolDate', handler: 'simpleValue' },
    cgiScanEnabled: { uiName: 'cgiScanEnabled', handler: 'simpleValue' },
    paranoidScanEnabled: { uiName: 'paranoidScanEnabled', handler: 'simpleValue' },
    thoroughScanEnabled: { uiName: 'thoroughScanEnabled', handler: 'simpleValue' },
    vulnPublished: { uiName: 'vulnPublished', handler: 'simpleValue' },
    wasVuln: { uiName: 'wasVuln', handler: 'simpleValue' },

    vprScore: { uiName: 'vprScore', handler: 'range' },
    assetCriticalityRating: { uiName: 'assetCriticalityRating', handler: 'range' },
    assetExposureScore: { uiName: 'assetExposureScore', handler: 'range' },
    baseCVSSScore: { uiName: 'baseCVSSScore', handler: 'range' },
    cvssV3BaseScore: { uiName: 'cvssV3BaseScore', handler: 'range' },
    cvssV4BaseScore: { uiName: 'cvssV4BaseScore', handler: 'range' },
    cvssV4ThreatScore: { uiName: 'cvssV4ThreatScore', handler: 'range' }
  };

  private readonly filterHandlers: { [key: string]: FilterHandler } = {
    array: (filter: any): FilterValue => {
      if (Array.isArray(filter.value)) {
        return filter.value;
      }

      if (typeof filter.value === 'string') {
        return filter.value.split(',');
      }

      return { value: [] };
    },

    simpleValue: (filter: any): FilterValue => ({
      value: filter.value
    }),

    operatorValue: (filter: any): FilterValue => ({
      value: filter.value,
      operator: filter.operator,
      isDirty: true,
      isValid: true
    }),

    idArray: (filter: any): FilterValue => {
      if (Array.isArray(filter.value)) {
        return {
          value: filter.value.map((v: any) => (typeof v === 'string' ? { id: v } : v))
        };
      }

      return {
        value: [{ id: filter.value }]
      };
    },

    family: (filter: any): FilterValue => {
      if (!filter.value) {
        return { value: [] };
      }

      if (Array.isArray(filter.value) && filter.value[0]?.id) {
        return { value: filter.value };
      }

      if (Array.isArray(filter.value)) {
        return { value: filter.value.map((v) => ({ id: v })) };
      }

      return {
        value: [{ id: filter.value }]
      };
    },

    severity: (filter: any): FilterValue => ({
      value: Array.isArray(filter.value) ? filter.value.join(',') : filter.value
    }),

    range: (filter: any): FilterValue => {
      if (filter.value === 'none' || filter.value === 'all') {
        return { value: filter.value };
      }

      if (filter.value.includes('-')) {
        const [min, max] = filter.value.split('-').map(Number);

        return {
          value: 'customRange',
          min,
          max
        };
      }

      return { value: filter.value };
    }
  };

  ngOnInit() {
    this.isLoading = true;
    this.filteredAccordionItems = [...this.accordionItems];

    let returnState;
    const stored = sessionStorage.getItem('tenableFilterState');

    if (stored) {
      returnState = JSON.parse(stored);

      if (returnState.currentPreset === this.currentPreset) {
        sessionStorage.removeItem('tenableFilterState');

        this.filterHistory = returnState.filterHistory || [];
        this.currentFilterHistoryIndex = returnState.currentFilterHistoryIndex ?? -1;
        this.tempFilters = returnState.tempFilters || this.initializeTempFilters();
        this.activeFilters = returnState.activeFilters || [];
        this.tenableTool = returnState.tenableTool || 'sumid';
      } else {
        returnState = null;
      }
    }

    if (!returnState) {
      this.filterHistory = [];
      this.currentFilterHistoryIndex = -1;
      this.tempFilters = this.initializeTempFilters();
    }

    this.setPayloadService.setPayload();

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
        this.loadSavedFilters();
        this.collectionsService
          .getCollectionBasicList()
          .pipe(
            tap((data) => {
              const selectedCollectionData = data.find((collection: any) => collection.collectionId === this.selectedCollection);

              if (selectedCollectionData) {
                this.tenableRepoId = selectedCollectionData.originCollectionId?.toString();
                this.aaPackage = selectedCollectionData.aaPackage;
              } else {
                this.tenableRepoId = '';
              }
            }),
            switchMap(() => forkJoin([this.loadAssetOptions(), this.loadAuditFileOptions(), this.loadFamilyOptions(), this.loadScanPolicyPluginOptions(), this.loadUserOptions(), this.loadPoamAssociations()])),
            catchError((error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error loading filter list data: ${getErrorMessage(error)}`
              });
              this.isLoading = false;

              return EMPTY;
            })
          )
          .subscribe({
            next: () => {
              this.updateAccordionItems();

              if (returnState) {
                this.setupColumns();
                this.filteredAccordionItems = [...this.accordionItems];
                this.filterAccordionItems();
                this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
              } else {
                this.initializeColumnsAndFilters();
              }
            }
          });
      })
    );

    this.subscriptions.add(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      })
    );

    this.subscriptions.add(
      this.setPayloadService.accessLevel$.subscribe(async (level) => {
        this.accessLevel.set(level);
      })
    );
  }

  private setupColumns() {
    this.cols = [
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
          { label: 'Submitted', value: 'Submitted' }
        ]
      },
      {
        field: 'pluginID',
        header: 'Plugin ID',
        filterable: true
      },
      { field: 'pluginName', header: 'Name', filterable: true },
      { field: 'family', header: 'Family', filterable: true },
      {
        field: 'severity',
        header: 'Severity',
        filterable: true
      },
      { field: 'vprScore', header: 'VPR', filterable: true },
      { field: 'iav', header: 'IAV', filterType: 'text' },
      {
        field: 'navyComplyDate',
        header: 'Navy Comply Date',
        filterType: 'date'
      },
      { field: 'ips', header: 'IP Address' },
      { field: 'acrScore', header: 'ACR', filterable: false },
      {
        field: 'assetExposureScore',
        header: 'AES',
        filterable: false
      },
      {
        field: 'netbiosName',
        header: 'NetBIOS',
        filterable: false
      },
      { field: 'dnsName', header: 'DNS', filterable: false },
      {
        field: 'macAddress',
        header: 'MAC Address',
        filterable: false
      },
      { field: 'port', header: 'Port', filterable: false },
      {
        field: 'protocol',
        header: 'Protocol',
        filterable: false
      },
      { field: 'uuid', header: 'Agent ID', filterable: false },
      {
        field: 'hostUUID',
        header: 'Host ID',
        filterable: false
      },
      {
        field: 'total',
        header: 'Total',
        filterType: 'numeric'
      },
      {
        field: 'hostTotal',
        header: 'Host Total',
        filterType: 'numeric'
      }
    ];
    this.resetColumnSelections();
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
  }

  private initializeColumnsAndFilters() {
    this.setupColumns();

    if (this.currentPreset === 'exploitAvailable') {
      this.tempFilters['exploitAvailable'] = 'true';
    } else if (this.currentPreset === 'thirtyPlus') {
      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = '0:30';
      this.tempFilters['pluginPublished'] = '30:all';
    } else if (this.currentPreset === 'failedCredential') {
      this.tempFilters['pluginID'] = { operator: '=', value: '117886,10428,21745,24786,26917,102094,104410,110385,110723' };
    } else if (this.currentPreset === 'seol') {
      this.tempFilters['pluginName'] = { operator: '=', value: 'SEoL' };
      this.tempFilters['seolDate'] = '30:all';
      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = '0:30';
    } else {
      const zoneCorD = /Zone:?\s*[CD](?![A-Z])/i.test(this.aaPackage || '');

      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = zoneCorD ? '0:90' : '0:30';
    }

    this.applyFilters();
    this.filterAccordionItems();
    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = 0;
  }

  private initializeTempFilters(): TempFilters {
    return {
      assetCriticalityRating: { value: 'all', min: 0, max: 10 },
      acceptRiskStatus: null,
      ip: { value: null, operator: null, isValid: true, isDirty: false },
      assetExposureScore: { value: 'all', min: 0, max: 1000 },
      aesSeverity: [],
      uuid: { value: null, operator: null, isValid: true, isDirty: false },
      asset: { value: [], operator: 'contains' },
      cpe: { operator: null, value: null },
      auditFile: [],
      cceId: { value: null, operator: null, isValid: true, isDirty: false },
      cveId: { value: null, operator: null, isValid: true, isDirty: false },
      baseCVSSScore: { value: 'all', min: 0, max: 10 },
      cvssVector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      cvssV3BaseScore: { value: 'all', min: 0, max: 10 },
      cvssV4BaseScore: { value: 'all', min: 0, max: 10 },
      cvssV4ThreatScore: { value: 'all', min: 0, max: 10 },
      cvssV3Vector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      cvssV4Vector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      cvssV4Supplemental: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      cvssV4ThreatVector: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      xref: { operator: null, value: null },
      dataFormat: [],
      dnsName: { value: null, operator: null, isValid: true, isDirty: false },
      exploitFrameworks: { operator: null, value: null },
      hostUUID: { value: null, operator: null, isValid: true, isDirty: false },
      iavmID: { value: null, operator: null, isValid: true, isDirty: false },
      wasInputName: { value: null, operator: null, isValid: true, isDirty: false },
      wasInputType: { value: null, operator: null, isValid: true, isDirty: false },
      msbulletinID: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      operatingSystem: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      netbiosName: { operator: null, value: null },
      patchPublished: null,
      pluginID: { operator: null, value: null },
      pluginPublished: null,
      pluginModified: null,
      port: { operator: null, value: null },
      protocol: [],
      exploitAvailable: null,
      mitigatedStatus: null,
      pluginName: { operator: null, value: null },
      pluginType: { operator: null, value: null },
      recastRiskStatus: null,
      policy: [],
      severity: [],
      stigSeverity: {
        value: null,
        operator: null,
        isValid: true,
        isDirty: false
      },
      responsibleUser: [],
      vprScore: { value: 'all', min: 0, max: 10 },
      vulnerabilityType: null,
      lastSeen: null,
      firstSeen: null,
      vulnPublished: null,
      seolDate: null,
      cgiScanEnabled: null,
      paranoidScanEnabled: null,
      thoroughScanEnabled: null,
      pluginText: { operator: null, value: null },
      vulnUUID: { value: null, operator: null, isValid: true, isDirty: false },
      wasHttpMethod: { value: null, operator: null, isValid: true, isDirty: false },
      wasVuln: null,
      wasURL: { value: null, operator: null, isValid: true, isDirty: false }
    };
  }

  updateAccordionItems() {
    this.accordionItems = this.accordionItems.map((item) => {
      switch (item.identifier) {
        case 'asset':
          return { ...item, options: this.assetOptions };
        case 'auditFile':
          return { ...item, options: this.auditFileOptions };
        case 'family':
          return { ...item, options: this.familyOptions };
        case 'policy':
          return { ...item, options: this.scanPolicyPluginOptions };
        case 'responsibleUser':
          return { ...item, options: this.userOptions };
        default:
          return item;
      }
    });
    this.filteredAccordionItems = [...this.accordionItems];
  }

  filterAccordionItems() {
    let items = [...this.accordionItems];

    if (this.filterSearch?.trim()) {
      const searchTerm = this.filterSearch.toLowerCase().trim();

      items = items.filter((item) => item.header.toLowerCase().includes(searchTerm));
    }

    items.sort((a, b) => {
      const aActive = this.isFilterActive(a.identifier);
      const bActive = this.isFilterActive(b.identifier);

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      return a.value - b.value;
    });

    this.filteredAccordionItems = items;
  }

  loadAssetOptions(): Observable<any> {
    return this.importService.getTenableAssetsFilter().pipe(
      map((assetsData) => {
        this.assetOptions = assetsData.response.usable.map((assets: any) => ({
          value: assets.id,
          label: assets.name
        }));

        return this.assetOptions;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching tenable asset filter data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  loadAuditFileOptions(): Observable<any> {
    return this.importService.getTenableAuditFileFilter().pipe(
      map((auditFileData) => {
        this.auditFileOptions = auditFileData.response.usable.map((auditFile: any) => ({
          label: auditFile.name,
          value: auditFile.id
        }));

        return this.auditFileOptions;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching audit file data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  loadFamilyOptions(): Observable<any> {
    return this.importService.getTenablePluginFamily().pipe(
      map((familyData) => {
        this.familyOptions = familyData.response.map((family: any) => ({
          value: family.id,
          label: family.name
        }));

        return this.familyOptions;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching plugin family data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  loadScanPolicyPluginOptions(): Observable<any> {
    return this.importService.getTenableScanPolicyPluginsFilter().pipe(
      map((scanPolicyPluginData) => {
        this.scanPolicyPluginOptions = scanPolicyPluginData.response.usable.map((plugins: any) => ({
          value: plugins.id,
          label: plugins.name
        }));

        return this.scanPolicyPluginOptions;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching scan policy plugin data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  loadUserOptions(): Observable<any> {
    return this.importService.getTenableUsersFilter().pipe(
      map((userData) => {
        this.userOptions = userData.response.map((user: any) => ({
          value: user.id,
          label: `${user.firstname} ${user.lastname} [${user.username}]`
        }));

        return this.userOptions;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching tenable user data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  loadVulnerabilitiesLazy(event: TableLazyLoadEvent) {
    if (!this.tenableRepoId) return;

    this.isLoading = true;

    const startOffset = this.tenableTool === 'sumid' ? 0 : (event.first ?? 0);
    const endOffset = this.tenableTool === 'sumid' ? 5000 : startOffset + (event.rows ?? 25);
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
        startOffset,
        endOffset,
        filters: [this.createRepositoryFilter(), ...this.activeFilters],
        vulnTool: this.tenableTool
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching all Vulnerabilities: ${getErrorMessage(error)}`
          });

          return EMPTY;
        }),
        switchMap((data) => {
          if (data.error_msg) {
            this.showErrorMessage(data.error_msg);

            return EMPTY;
          }

          const pluginIDs = data.response.results.map((vuln: any) => Number(vuln.pluginID));

          if (pluginIDs.length > 0) {
            return this.importService.getIAVInfoForPlugins(pluginIDs).pipe(
              catchError((error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Error fetching IAV info: ${getErrorMessage(error)}`
                });

                return of([]);
              }),
              map((iavData) => ({
                vulnData: data.response,
                iavInfoMap: this.createIAVInfoMap(iavData)
              }))
            );
          }

          return of({
            vulnData: data.response,
            iavInfoMap: {}
          });
        }),
        finalize(() => {
          this.isLoading = false;
          this.filterAccordionItems();
        })
      )
      .subscribe({
        next: ({ vulnData, iavInfoMap }) => {
          this.allVulnerabilities = vulnData.results.map((vuln: any) => {
            const defaultVuln = {
              pluginID: '',
              pluginName: '',
              family: '',
              severity: '',
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
              hostTotal: ''
            };

            const poamAssociation = this.existingPoamPluginIDs[vuln.pluginID];
            const iavInfo = iavInfoMap[Number(vuln.pluginID)] || { iav: null, navyComplyDate: null };

            return {
              ...defaultVuln,
              ...vuln,
              poam: !!poamAssociation,
              poamId: poamAssociation?.poamId || null,
              poamStatus: poamAssociation?.status ? poamAssociation.status : 'No Existing POAM',
              isAssociated: poamAssociation?.isAssociated || false,
              parentStatus: poamAssociation?.parentStatus,
              parentPoamId: poamAssociation?.parentPoamId,
              iav: iavInfo.iav,
              navyComplyDate: iavInfo?.navyComplyDate ? parseISO(iavInfo.navyComplyDate) : null,
              pluginName: vuln.name || '',
              family: vuln.family?.name || '',
              severity: vuln.severity?.name || ''
            };
          });

          this.totalRecords = vulnData.totalRecords ? Number(vulnData.totalRecords) : this.allVulnerabilities.length;
          const table = this.table();

          if (table && table.first >= this.totalRecords) {
            table.first = 0;
          }

          this.totalRecordsChange.emit(this.totalRecords);
        }
      });
  }

  exportAllData() {
    if (this.tenableTool !== 'listvuln') {
      this.table().exportCSV();

      return;
    }

    this.isLoading = true;
    this.messageService.add({
      severity: 'secondary',
      summary: 'Export Started',
      detail: 'Download will automatically start momentarily.'
    });

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
        endOffset: 10000,
        filters: [this.createRepositoryFilter(), ...this.activeFilters],
        vulnTool: this.tenableTool
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching data for export: ${getErrorMessage(error)}`
          });
          this.isLoading = false;

          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          if (data.error_msg) {
            this.showErrorMessage(data.error_msg);

            return;
          }

          const currentData = this.allVulnerabilities;

          const exportData = data.response.results.map((vuln: any) => {
            const defaultVuln = {
              pluginID: '',
              pluginName: '',
              family: '',
              severity: '',
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
              hostTotal: ''
            };

            const poamAssociation = this.existingPoamPluginIDs[vuln.pluginID];

            return {
              ...defaultVuln,
              ...vuln,
              poamStatus: poamAssociation?.status ? poamAssociation.status : 'No Existing POAM',
              pluginName: vuln.name || '',
              family: vuln.family?.name || '',
              severity: vuln.severity?.name || ''
            };
          });

          this.allVulnerabilities = exportData;

          setTimeout(() => {
            this.table().exportCSV();

            setTimeout(() => {
              this.allVulnerabilities = currentData;
              this.cdr.detectChanges();
            }, 100);
          }, 0);
        }
      });
  }

  private createIAVInfoMap(iavData: any[]): { [key: number]: IAVInfo } {
    return createIAVInfoMap(iavData);
  }

  showFilterMenu(event: Event) {
    this.overlayPanel().toggle(event);
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
    this.sidebarToggle.emit(this.sidebarVisible);
  }

  onFilterChange(event: any, identifier: string, isInput: boolean = false, isOperator: boolean = false) {
    if (!identifier) {
      console.warn('Missing identifier in onFilterChange', { event, isInput, isOperator });

      return;
    }

    if (!event) {
      console.warn('Missing event in onFilterChange', { identifier, isInput, isOperator });

      return;
    }

    if (identifier === 'asset') {
      if (!this.tempFilters[identifier]) {
        this.tempFilters[identifier] = { value: [], operator: 'contains' };
      }

      if (isOperator) {
        this.tempFilters[identifier].operator = event.value;
      } else {
        this.tempFilters[identifier].value = event.value;
      }

      return;
    }

    if (identifier === 'severity') {
      this.tempFilters['severity'] = event.value;

      return;
    }

    if (identifier === 'lastSeen') {
      this.tempFilters['lastSeen'] = event.value;

      return;
    }

    if (identifier === 'family') {
      this.tempFilters['family'] = Array.isArray(event.value) ? event.value : event.value ? [event.value] : [];

      return;
    }

    if (identifier === 'policy' || identifier === 'auditFile') {
      this.tempFilters[identifier] = event.value;

      return;
    }

    if (identifier === 'responsibleUser') {
      this.tempFilters[identifier] = event.value || [];

      return;
    }

    if (identifier) {
      const accordionItem = this.accordionItems.find((item) => item.identifier === identifier);
      const value = isInput ? (event.target?.value ?? event.value) : event.value;

      if (!this.tempFilters[identifier]) {
        this.tempFilters[identifier] = { operator: null, value: null };
      }

      if (isInput) {
        this.tempFilters[identifier].value = value;
        this.tempFilters[identifier].isValid = !accordionItem?.validator || accordionItem.validator(value);
        this.tempFilters[identifier].isDirty = true;
      } else if (isOperator) {
        this.tempFilters[identifier].operator = value;
      }
    }
  }

  private mapSingleFilter(filter: any): void {
    if (!filter) {
      console.warn('Invalid filter object:', filter);

      return;
    }

    if (!filter.filterName) {
      console.warn('Filter missing filterName:', filter);

      return;
    }

    if (filter.filterName === 'xref' && filter.value.includes('IAVA|20*,IAVB|20*')) {
      const value = filter.operator === '=' ? 'iav' : 'non-iav';

      this.tempFilters['vulnerabilityType'] = value;
      this.onFilterChange({ value }, 'vulnerabilityType');

      return;
    }

    if (filter.filterName === 'asset') {
      let operator = 'contains';
      let assetIds: string[] = [];

      if (filter.value && typeof filter.value === 'object' && filter.value.operator === 'complement') {
        operator = 'notContains';
        filter.value = filter.value.operand1;
      }

      if (filter.value && typeof filter.value === 'object') {
        const flattenUnion = (obj: any): void => {
          if (obj.id) {
            assetIds.push(obj.id);
          }

          if (obj.operand1) flattenUnion(obj.operand1);
          if (obj.operand2) flattenUnion(obj.operand2);
        };

        flattenUnion(filter.value);
      } else if (Array.isArray(filter.value)) {
        assetIds = filter.value.map((v: any) => v.id || v);
      }

      this.tempFilters['asset'] = {
        value: assetIds,
        operator: operator
      };

      return;
    }

    if (filter.filterName === 'family' && Array.isArray(filter.value)) {
      this.tempFilters['family'] = filter.value.map((v: any) => v.id || v);

      return;
    }

    if (filter.filterName === 'severity') {
      this.tempFilters['severity'] = filter.value.split(',');

      return;
    }

    if (filter.filterName === 'policy' || filter.filterName === 'auditFile') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        this.tempFilters[filter.filterName] = filter.value[0].id || filter.value[0];
      } else if (filter?.value?.id) {
        this.tempFilters[filter.filterName] = filter.value.id;
      }

      return;
    }

    if (filter.filterName === 'responsibleUser') {
      if (Array.isArray(filter.value)) {
        this.tempFilters['responsibleUser'] = filter.value.map((v: any) => v.id || v);
      }

      return;
    }

    const config = this.filterNameMappings[filter.filterName];

    if (!config) return;

    const handler = this.filterHandlers[config.handler];

    if (!handler) return;

    const filterValue = handler(filter);

    if (config.handler === 'simpleValue') {
      this.tempFilters[config.uiName] = filterValue.value;
      this.onFilterChange({ value: filterValue.value }, config.uiName);
    } else {
      this.tempFilters[config.uiName] = filterValue;

      if (filterValue.operator) {
        this.onFilterChange({ value: filterValue.value }, config.uiName, true);
        this.onFilterChange({ value: filterValue.operator }, config.uiName, false, true);
      } else if (config.handler === 'range' && filterValue.value === 'customRange') {
        this.onFilterChange({ value: 'customRange' }, config.uiName);
        this.tempFilters[config.uiName] = {
          value: 'customRange',
          min: filterValue.min,
          max: filterValue.max
        };
        this.onRangeValueChange(config.uiName);
      } else {
        this.onFilterChange({ value: filterValue.value }, config.uiName);
      }
    }
  }

  createAssetsFilter(value: any, operator: string = 'contains'): AssetsFilter | null {
    if (!value || value.length === 0) {
      return null;
    }

    if (value.length === 1) {
      return {
        filterName: 'asset',
        operator: operator === 'notContains' ? '~' : '=',
        value: { id: value[0] }
      };
    }

    let formattedValue: any = { id: value[0] };

    for (let i = 1; i < value.length; i++) {
      formattedValue = {
        operator: 'union',
        operand1: formattedValue,
        operand2: {
          id: value[i]
        }
      };
    }

    if (operator === 'notContains') {
      formattedValue = {
        operator: 'complement',
        operand1: formattedValue
      };
    }

    return {
      filterName: 'asset',
      operator: '~',
      value: formattedValue
    };
  }

  private convertTempFiltersToAPI(): CustomFilter[] {
    const tempActiveFilters = Object.entries(this.tempFilters)
      .filter(([_, value]) => {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value) && value.length === 0) return false;

        if (typeof value === 'object') {
          if ('value' in value && (value.value === null || value.value === undefined)) return false;
          if ('value' in value && value.value === 'all') return false;
          if (Object.keys(value).length === 0) return false;
        }

        return true;
      })
      .map(([uiName, value]) => {
        const apiConfig = Object.entries(this.filterNameMappings).find(([_, config]) => config.uiName === uiName);

        if (!apiConfig) return null;

        const [apiName, config] = apiConfig;

        switch (config.handler) {
          case 'idArray':
            if (apiName === 'asset') {
              if (typeof value === 'object' && 'value' in value && 'operator' in value) {
                const assetFilter = this.createAssetsFilter(value.value, value.operator);

                if (assetFilter) {
                  return {
                    id: apiName,
                    ...assetFilter,
                    type: 'vuln',
                    isPredefined: true
                  };
                }
              }

              return null;
            }

            if (typeof value === 'string') {
              return {
                id: apiName,
                filterName: apiName,
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: [{ id: value }]
              };
            }

            if (Array.isArray(value) && value.length > 0) {
              return {
                id: apiName,
                filterName: apiName,
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: value.map((v) => ({ id: v }))
              };
            }

            return null;

          case 'family':
            if (!Array.isArray(value) || value.length === 0) return null;

            return {
              id: 'family',
              filterName: 'family',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: value.map((v) => ({ id: v }))
            };

          case 'severity': {
            const severityValue = Array.isArray(value) ? value.join(',') : value;

            return severityValue
              ? {
                  id: 'severity',
                  filterName: 'severity',
                  operator: '=',
                  type: 'vuln',
                  isPredefined: true,
                  value: severityValue
                }
              : null;
          }

          case 'array': {
            const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;

            return hasValue
              ? {
                  id: apiName,
                  filterName: apiName,
                  operator: '=',
                  type: 'vuln',
                  isPredefined: true,
                  value: Array.isArray(value) ? value.join(',') : value
                }
              : null;
          }

          case 'operatorValue':
            return value.value
              ? {
                  id: apiName,
                  filterName: apiName,
                  operator: value.operator || '=',
                  type: 'vuln',
                  isPredefined: true,
                  value: value.value
                }
              : null;

          case 'range':
            if (value.value === 'none') {
              return {
                id: apiName,
                filterName: apiName,
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: 'none'
              };
            }

            if (value.value === 'all' || !value.value) return null;

            if (value.value === 'customRange') {
              return {
                id: apiName,
                filterName: apiName,
                operator: '=',
                type: 'vuln',
                isPredefined: true,
                value: `${value.min}-${value.max}`
              };
            }

            return null;

          case 'simpleValue':
            return value
              ? {
                  id: apiName,
                  filterName: apiName,
                  operator: '=',
                  type: 'vuln',
                  isPredefined: true,
                  value: value?.value ?? value
                }
              : null;

          default:
            return null;
        }
      })
      .filter((filter): filter is CustomFilter => filter !== null);

    let activeFilters: CustomFilter[] = [];

    return [...activeFilters, ...tempActiveFilters];
  }

  applyFilters(loadVuln: boolean = true) {
    if (this.currentFilterHistoryIndex < this.filterHistory.length - 1) {
      this.filterHistory = this.filterHistory.slice(0, this.currentFilterHistoryIndex + 1);
    }

    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    this.activeFilters = this.convertTempFiltersToAPI();
    this.filterAccordionItems();

    if (loadVuln) {
      this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
      this.selectedPremadeFilter = null;
    }

    this.sidebarVisible = false;
    this.sidebarToggle.emit(this.sidebarVisible);
  }

  revertFilters() {
    if (this.currentFilterHistoryIndex > 0) {
      this.currentFilterHistoryIndex--;
      this.selectedPremadeFilter = null;
      const historyItem = this.filterHistory[this.currentFilterHistoryIndex];

      this.tempFilters = structuredClone(historyItem.filters);
      this.tenableTool = historyItem.tool;
      this.activeFilters = this.convertTempFiltersToAPI();
      this.filteredAccordionItems = [...this.accordionItems];
      this.filterAccordionItems();
      this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });

      if (this.tenableTool === 'listvuln') {
        this.expandColumnSelections();
      } else {
        this.resetColumnSelections();
      }
    }
  }

  clearIndividualFilter(identifier: string, event: Event) {
    event.stopPropagation();

    switch (identifier) {
      case 'assetCriticalityRating':
      case 'assetExposureScore':
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'cvssV4BaseScore':
      case 'cvssV4ThreatScore':
      case 'vprScore':
        this.tempFilters[identifier] = {
          value: 'all',
          min: 0,
          max: this.getMaxValue(identifier)
        };
        break;
      case 'asset':
        this.tempFilters[identifier] = { value: [], operator: 'contains' };
        break;
      case 'aesSeverity':
      case 'auditFile':
      case 'dataFormat':
      case 'family':
      case 'protocol':
      case 'policy':
      case 'severity':
      case 'responsibleUser':
        this.tempFilters[identifier] = [];
        break;
      case 'ip':
      case 'uuid':
      case 'cceId':
      case 'cveId':
      case 'cvssVector':
      case 'cvssV3Vector':
      case 'cvssV4Vector':
      case 'cvssV4ThreatVector':
      case 'cvssV4Supplemental':
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'wasInputName':
      case 'wasInputType':
      case 'msbulletinID':
      case 'operatingSystem':
      case 'stigSeverity':
      case 'vulnUUID':
      case 'wasHttpMethod':
      case 'wasURL':
        this.tempFilters[identifier] = {
          value: null,
          operator: null,
          isValid: true,
          isDirty: false
        };
        break;
      case 'cpe':
      case 'xref':
      case 'exploitFrameworks':
      case 'netbiosName':
      case 'pluginID':
      case 'pluginName':
      case 'pluginType':
      case 'port':
      case 'pluginText':
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
      case 'cvssV4BaseScore':
      case 'cvssV4ThreatScore':
      case 'vprScore':
        return filter.value !== 'all';
      case 'asset':
        return filter.value && filter.value.length > 0;
      case 'aesSeverity':
      case 'auditFile':
      case 'dataFormat':
      case 'family':
      case 'protocol':
      case 'policy':
      case 'severity':
      case 'responsibleUser':
        return filter.length > 0;
      case 'ip':
      case 'uuid':
      case 'cceId':
      case 'cveId':
      case 'cvssVector':
      case 'cvssV3Vector':
      case 'cvssV4Vector':
      case 'cvssV4ThreatVector':
      case 'cvssV4Supplemental':
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'wasInputName':
      case 'wasInputType':
      case 'msbulletinID':
      case 'operatingSystem':
      case 'vulnUUID':
      case 'wasHttpMethod':
      case 'wasURL':
        return !!filter.value;
      case 'cpe':
      case 'xref':
      case 'exploitFrameworks':
      case 'netbiosName':
      case 'pluginID':
      case 'pluginName':
      case 'pluginType':
      case 'port':
      case 'stigSeverity':
      case 'pluginText':
        return !!filter.value || !!filter.operator;
      default:
        return !!filter;
    }
  }

  validateIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    return ipRegex.test(ip);
  }

  validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    return uuidRegex.test(uuid);
  }

  validateCVSSv2Vector(vector: string): boolean {
    const cvssV2Regex = /^(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])(\/(?!.*\1)(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])){5}$/;

    return cvssV2Regex.test(vector);
  }

  validateCVSSv3Vector(vector: string): boolean {
    const cvssV3Regex =
      /^CVSS:3\.[01]\/((AV:[NALP]|AC:[LH]|PR:[NLH]|UI:[NR]|S:[UC]|C:[NLH]|I:[NLH]|A:[NLH]|E:[XUPFH]|RL:[XOTWU]|RC:[XURC]|CR:[XLH]|IR:[XLH]|AR:[XLH]|MAV:[XNALP]|MAC:[XLH]|MPR:[XNLH]|MUI:[XNR]|MS:[XUC]|MC:[XNLH]|MI:[XNLH]|MA:[XNLH])\/){8,11}$/;

    return cvssV3Regex.test(vector);
  }

  validateCVSSv4Vector(vector: string): boolean {
    const cvssV4Regex =
      /^CVSS:4[.]0\/AV:[NALP]\/AC:[LH]\/AT:[NP]\/PR:[NLH]\/UI:[NPA]\/VC:[HLN]\/VI:[HLN]\/VA:[HLN]\/SC:[HLN]\/SI:[HLN]\/SA:[HLN](\/E:[XAPU])?(\/CR:[XHML])?(\/IR:[XHML])?(\/AR:[XHML])?(\/MAV:[XNALP])?(\/MAC:[XLH])?(\/MAT:[XNP])?(\/MPR:[XNLH])?(\/MUI:[XNPA])?(\/MVC:[XNLH])?(\/MVI:[XNLH])?(\/MVA:[XNLH])?(\/MSC:[XNLH])?(\/MSI:[XNLHS])?(\/MSA:[XNLHS])?(\/S:[XNP])?(\/AU:[XNY])?(\/R:[XAUI])?(\/V:[XDC])?(\/RE:[XLMH])?(\/U:(X|Clear|Green|Amber|Red))?$/;

    return cvssV4Regex.test(vector);
  }

  validateIAVM(iavmNumber: string): boolean {
    const iavmRegex = /^\d{4}-[A-Za-z]-\d{4}$/;

    return iavmRegex.test(iavmNumber);
  }

  validateStigSeverity(severity: string): boolean {
    const stigSeverityRegex = /^(I{1,3})$/;

    return stigSeverityRegex.test(severity);
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
        case 'cvssV4BaseScore':
        case 'cvssV4ThreatScore':
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
      case 'cvssV4BaseScore':
      case 'cvssV4ThreatScore':
      case 'vprScore':
        filter.min = Math.max(0, Math.min(filter.min, 10));
        filter.max = Math.max(filter.min, Math.min(filter.max, 10));
        break;
    }
  }

  clearFilters(loadVuln: boolean = true) {
    this.table().clear();
    this.tenableTool = 'sumid';
    this.tempFilters = this.initializeTempFilters();

    if (this.currentPreset === 'exploitAvailable') {
      this.tempFilters['exploitAvailable'] = 'true';
    } else if (this.currentPreset === 'thirtyPlus') {
      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = '0:30';
      this.tempFilters['pluginPublished'] = '30:all';
    } else if (this.currentPreset === 'failedCredential') {
      this.tempFilters['pluginID'] = { operator: '=', value: '117886,10428,21745,24786,26917,102094,104410,110385,110723' };
    } else if (this.currentPreset === 'seol') {
      this.tempFilters['pluginName'] = { operator: '=', value: 'SEoL' };
      this.tempFilters['seolDate'] = '30:all';
      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = '0:30';
    } else {
      const zoneCorD = /Zone:?\s*[CD](?![A-Z])/i.test(this.aaPackage || '');

      this.tempFilters['severity'] = ['1', '2', '3', '4'];
      this.tempFilters['lastSeen'] = zoneCorD ? '0:90' : '0:30';
    }

    this.activeFilters = [];
    this.filterSearch = '';
    this.filterHistory = [];
    this.currentFilterHistoryIndex = -1;
    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = 0;

    this.applyFilters(false);
    this.filterAccordionItems();
    this.resetColumnSelections();

    if (loadVuln) {
      this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
      this.selectedPremadeFilter = null;
    }
  }

  getMinValue(identifier: string): number {
    return identifier === 'assetCriticalityRating' ? 1 : 0;
  }

  getMaxValue(identifier: string): number {
    switch (identifier) {
      case 'assetExposureScore':
        return 1000;
      case 'assetCriticalityRating':
      case 'baseCVSSScore':
      case 'cvssV3BaseScore':
      case 'cvssV4BaseScore':
      case 'cvssV4ThreatScore':
      case 'vprScore':
        return 10;
      default:
        return 10000;
    }
  }

  applyPremadeFilter(event: any) {
    if (!event?.value) return;

    const selectedFilter = this.findFilterByValue(event.value);

    if (!selectedFilter) return;

    if (this.tempFilters) {
      this.filterHistory.push({
        filters: structuredClone(this.tempFilters),
        tool: this.tenableTool
      });
      this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    }

    if (event.value.startsWith('saved_')) {
      const savedFilter = typeof selectedFilter.filter === 'string' ? JSON.parse(selectedFilter.filter) : selectedFilter.filter;

      if (savedFilter) {
        this.table().clear();
        this.tenableTool = savedFilter.tenableTool || 'sumid';
        this.tempFilters = this.initializeTempFilters();
        this.activeFilters = [];
        this.filterSearch = '';

        if (Array.isArray(savedFilter.filters)) {
          savedFilter.filters.forEach((filter) => {
            if (filter && typeof filter === 'object' && filter.filterName && filter.value !== undefined) {
              try {
                this.mapSingleFilter(filter);
              } catch (error) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Error applying saved filter: ${getErrorMessage(error)}`
                });
              }
            }
          });
        }

        this.filterHistory.push({
          filters: structuredClone(this.tempFilters),
          tool: this.tenableTool
        });
        this.currentFilterHistoryIndex = this.filterHistory.length - 1;
        this.activeFilters = this.convertTempFiltersToAPI();
        this.filteredAccordionItems = [...this.accordionItems];
        this.filterAccordionItems();
        this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });

        return;
      }
    }

    this.clearFilters(false);

    switch (event.value) {
      case 'vulnpublished30':
        this.tempFilters['vulnPublished'] = '30:all';
        break;
      case 'pluginpublished30':
        this.tempFilters['pluginPublished'] = '30:all';
        break;
      case 'exploitable7':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['pluginPublished'] = '7:all';
        break;
      case 'exploitable30':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['pluginPublished'] = '30:all';
        break;
      case 'criticalHigh7':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['pluginPublished'] = '7:all';
        break;
      case 'criticalHigh14':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['pluginPublished'] = '14:all';
        break;
      case 'criticalHigh30':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['pluginPublished'] = '30:all';
        break;
      case 'medium180':
        this.tempFilters['severity'] = ['2'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['pluginPublished'] = '180:all';
        break;
      case 'low365':
        this.tempFilters['severity'] = ['1'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['pluginPublished'] = '365:all';
        break;
      case 'seol':
        this.tempFilters['pluginName'] = { operator: '=', value: 'SEoL' };
        this.tempFilters['seolDate'] = '30:all';
        this.tempFilters['severity'] = ['1', '2', '3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        break;
      case 'nonCredentialedBad':
        this.tempFilters['pluginID'] = { operator: '=', value: '19506' };
        this.tempFilters['pluginText'] = { operator: '=', value: 'Credentialed checks : no' };
        this.tempFilters['lastSeen'] = '3:all';
        break;
      case 'nonCredentialedGood':
        this.tempFilters['pluginID'] = { operator: '=', value: '19506' };
        this.tempFilters['pluginText'] = { operator: '=', value: 'Credentialed checks : yes' };
        this.tempFilters['lastSeen'] = '3:all';
        break;
      case 'exploitable':
        this.tempFilters['exploitAvailable'] = 'true';
        break;
    }

    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    this.activeFilters = this.convertTempFiltersToAPI();
    this.filteredAccordionItems = [...this.accordionItems];
    this.filterAccordionItems();
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
  }

  deleteFilter(event: Event, filterId: string) {
    event.stopPropagation();
    const numericId = Number.parseInt(filterId.replace('saved_', ''));

    if (Number.isNaN(numericId)) {
      this.showErrorMessage('Invalid filter ID');

      return;
    }

    this.messageService.clear();
    this.messageService.add({
      key: 'deleteConfirmation',
      sticky: true,
      severity: 'warn',
      summary: 'Confirm Deletion',
      detail: 'Are you sure you want to delete this saved filter?',
      closable: false,
      data: numericId
    });
  }

  confirmDeleteFilter(filterId: number) {
    this.importService.deleteTenableFilter(this.selectedCollection, filterId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Filter deleted successfully'
        });

        if (this.selectedPremadeFilter === `saved_${filterId}`) {
          this.selectedPremadeFilter = null;
        }

        this.loadSavedFilters();
        this.messageService.clear();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error deleting filter: ${getErrorMessage(error)}`
        });
      }
    });
  }

  private createRepositoryFilter(): CustomFilter {
    return {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: this.tenableRepoId }]
    };
  }

  private findFilterByValue(value: string): PremadeFilterOption | null {
    if (this.premadeFilterOptions) {
      for (const group of this.premadeFilterOptions) {
        if (group.items) {
          const found = group.items.find((item) => item.value === value);

          if (found) return found;
        } else if (group.value === value) {
          return group;
        }
      }
    }

    return null;
  }

  loadSavedFilters() {
    if (this.selectedCollection) {
      this.importService.getTenableFilters(this.selectedCollection).subscribe({
        next: (filters: TenableFilter[]) => {
          const savedFilterOptions: PremadeFilterOption[] = filters.map((filter) => ({
            label: String(filter.filterName),
            value: `saved_${filter.filterId}`,
            filter: filter.filter,
            subLabel: `Created by ${filter.createdBy || 'Unknown'}`,
            createdBy: filter.createdBy || 'Unknown'
          }));

          this.premadeFilterOptions = [
            {
              label: 'Premade Filters',
              value: 'premade',
              items: this.defaultPremadeFilterOptions
            },
            {
              label: 'Saved Filters',
              value: 'saved',
              items: savedFilterOptions
            }
          ];
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading saved filters: ${getErrorMessage(error)}`
          });
        }
      });
    }
  }

  onFilterSaved() {
    this.loadSavedFilters();
  }

  loadVulnList() {
    if (this.currentFilterHistoryIndex < this.filterHistory.length - 1) {
      this.filterHistory = this.filterHistory.slice(0, this.currentFilterHistoryIndex + 1);
    }

    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    this.tenableTool = 'listvuln';
    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;

    this.table().clear();
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    this.expandColumnSelections();
  }

  loadVulnSummary() {
    if (this.currentFilterHistoryIndex < this.filterHistory.length - 1) {
      this.filterHistory = this.filterHistory.slice(0, this.currentFilterHistoryIndex + 1);
    }

    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    this.tenableTool = 'sumid';
    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });
    this.currentFilterHistoryIndex = this.filterHistory.length - 1;

    this.table().clear();
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    this.resetColumnSelections();
  }

  async onRowClick(vulnerability: any, event: any) {
    event.stopPropagation();

    if (this.currentFilterHistoryIndex < this.filterHistory.length - 1) {
      this.filterHistory = this.filterHistory.slice(0, this.currentFilterHistoryIndex + 1);
    }

    this.filterHistory.push({
      filters: structuredClone(this.tempFilters),
      tool: this.tenableTool
    });

    this.currentFilterHistoryIndex = this.filterHistory.length - 1;
    this.tempFilters = this.initializeTempFilters();
    this.tenableTool = 'listvuln';

    this.tempFilters['pluginID'] = {
      operator: '=',
      value: vulnerability.pluginID
    };

    this.applyFilters(true);
    this.expandColumnSelections();
  }

  onPluginIDClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    this.showDetails(vulnerability);
  }

  async onPoamIconClick(vulnerability: any, event: Event) {
    event.stopPropagation();

    try {
      const poamAssociation = this.existingPoamPluginIDs[vulnerability.pluginID];

      const returnState = {
        filterHistory: structuredClone(this.filterHistory),
        currentFilterHistoryIndex: this.currentFilterHistoryIndex,
        tempFilters: structuredClone(this.tempFilters),
        activeFilters: structuredClone(this.activeFilters),
        tenableTool: this.tenableTool,
        currentPreset: this.currentPreset,
        parentTabIndex: this.getParentTabIndex()
      };

      sessionStorage.setItem('tenableFilterState', JSON.stringify(returnState));

      if (poamAssociation?.poamId) {
        this.router.navigateByUrl(`/poam-processing/poam-details/${poamAssociation.poamId}`);

        return;
      }

      await this.showDetails(vulnerability, true);

      if (!this.pluginData) {
        throw new Error('Plugin data not available');
      }

      const pluginIAVData = this.iavInfo[this.pluginData.id];
      let formattedIavComplyByDate = null;

      if (pluginIAVData?.navyComplyDate) {
        const complyDate = new Date(pluginIAVData.navyComplyDate);

        formattedIavComplyByDate = format(complyDate, 'yyyy-MM-dd');
      }

      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData,
          iavNumber: pluginIAVData?.iav,
          iavComplyByDate: formattedIavComplyByDate
        }
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error processing vulnerability data: ${getErrorMessage(error)}`
      });
    }
  }

  private getParentTabIndex(): number {
    switch (this.currentPreset) {
      case 'main':
        return 0;
      case 'thirtyPlus':
        return 1;
      case 'exploitAvailable':
        return 4;
      case 'failedCredential':
        return 5;
      case 'seol':
        return 6;
      default:
        return 0;
    }
  }

  getPoamStatusColor(status: string, parentStatus?: string): string {
    return getPoamStatusColor(status, parentStatus);
  }

  getPoamStatusIcon(status: string, isAssociated?: boolean): string {
    return getPoamStatusIcon(status, isAssociated);
  }

  getPoamStatusTooltip(status: string | null, hasExistingPoam?: boolean, parentStatus?: string): string {
    return getPoamStatusTooltip(status, hasExistingPoam, parentStatus);
  }

  showDetails(vulnerability: any, createPoam: boolean = false): Promise<void> {
    if (!vulnerability?.pluginID) {
      this.showErrorMessage('Invalid vulnerability data');

      return Promise.reject('Invalid vulnerability data');
    }

    return new Promise((resolve, reject) => {
      this.importService
        .getTenablePlugin(vulnerability.pluginID)
        .pipe(
          tap((data) => {
            if (!data?.response) {
              throw new Error('Invalid response from getTenablePlugin');
            }
          }),
          map((data) => data.response)
        )
        .subscribe({
          next: (pluginData) => {
            this.pluginData = pluginData;
            this.formattedDescription = this.pluginData.description ? this.sanitizer.bypassSecurityTrustHtml(this.pluginData.description.replaceAll('\n\n', '<br>')) : '';

            if (this.pluginData.xrefs && this.pluginData.xrefs.length > 0) {
              this.parseReferences(this.pluginData.xrefs);
            } else {
              this.cveReferences = [];
              this.iavReferences = [];
              this.otherReferences = [];
            }

            if (Array.isArray(this.pluginData?.vprContext?.length > 0)) {
              this.parseVprContext(this.pluginData.vprContext);
            } else {
              this.parsedVprContext = [];
            }

            this.selectedVulnerability = vulnerability;

            if (!createPoam) {
              this.displayDialog = true;
            }

            resolve();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error fetching plugin data.: ${getErrorMessage(error)}`
            });
            reject(error);
          }
        });
    });
  }

  parseVprContext(vprContext: string): void {
    this.parsedVprContext = parseVprContext(vprContext);
  }

  parseReferences(xrefs: string): void {
    const parsed: ParsedReferences = parseReferences(xrefs);

    this.cveReferences = parsed.cveReferences;
    this.iavReferences = parsed.iavReferences;
    this.otherReferences = parsed.otherReferences;
  }

  getCveUrl(cve: string): string {
    return getCveUrl(cve);
  }

  getIavUrl(iavNumber: string): string {
    return getIavUrl(iavNumber);
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter((col) => ['poam', 'pluginID', 'pluginName', 'family', 'severity', 'vprScore', 'iav', 'navyComplyDate', 'total', 'hostTotal'].includes(col.field));
  }

  expandColumnSelections() {
    this.selectedColumns = this.cols.filter((col) =>
      ['poam', 'pluginID', 'pluginName', 'family', 'severity', 'vprScore', 'iav', 'navyComplyDate', 'ips', 'acrScore', 'assetExposureScore', 'netbiosName', 'dnsName', 'macAddress', 'port', 'protocol', 'uuid', 'hostUUID'].includes(col.field)
    );
  }

  toggleAddColumnOverlay() {
    const multiSelect = this.multiSelect();

    if (multiSelect.overlayVisible) {
      multiSelect.hide();
    } else {
      multiSelect.show();
    }
  }

  loadPoamAssociations(): Observable<any> {
    return this.poamService.getVulnerabilityIdsWithPoamByCollection(this.selectedCollection).pipe(
      map((poamData) => {
        if (Array.isArray(poamData)) {
          this.existingPoamPluginIDs = createPoamAssociationsMap(poamData);

          return this.existingPoamPluginIDs;
        } else {
          throw new Error('Unexpected POAM data format');
        }
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error loading POAM data: ${getErrorMessage(error)}`
        });

        return EMPTY;
      })
    );
  }

  getSeverityStyling(severity: string): SeverityStyle {
    return getSeverityStyling(severity);
  }

  onTableFilter(event: any) {
    this.totalRecords = event.filteredValue ? event.filteredValue.length : 0;
    this.totalRecordsChange.emit(this.totalRecords);

    const table = this.table();

    if (table && table.first >= this.totalRecords) {
      table.first = 0;
    }
  }

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Alert',
      detail: message,
      sticky: true
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
