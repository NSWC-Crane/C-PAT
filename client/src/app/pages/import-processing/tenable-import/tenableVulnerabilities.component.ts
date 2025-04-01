/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ImportService } from '../import.service';
import { PoamService } from '../../poam-processing/poams.service';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Popover } from 'primeng/popover';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { EMPTY, Observable, Subscription, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TenableSolutionsComponent } from './components/solutions/tenableSolutions.component';
import { TenableIAVVulnerabilitiesComponent } from './components/iavVulnerabilities/tenableIAVVulnerabilities.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { TenableFiltersComponent } from './components/tenableFilters/tenableFilters.component';
import { TagModule } from 'primeng/tag';
import {
  AssetsFilter,
  FilterConfig,
  TenableFilter,
  Reference,
  IdAndName,
  CustomFilter,
  AccordionItem,
  IAVInfo,
  TempFilters,
  ExportColumn,
  PoamAssociation,
  PremadeFilterOption,
  FilterValue,
  FilterHandler
} from '../../../common/models/tenable.model';
import { parseISO } from 'date-fns/fp';

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
    Select,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
    TableModule,
    TabsModule,
    SkeletonModule,
    TenableSolutionsComponent,
    TenableIAVVulnerabilitiesComponent,
    ToastModule,
    TooltipModule,
    TenableFiltersComponent,
    TagModule
  ],
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
  rows: number = 20;
  cols: any[];
  filterSearch: string = '';
  filteredAccordionItems: AccordionItem[] = [];
  selectedColumns: any[];
  exportColumns!: ExportColumn[];
  sidebarVisible: boolean = false;
  activeFilters: CustomFilter[] = [];
  tempFilters: TempFilters = this.initializeTempFilters();
  selectedPremadeFilter: any = null;
  overlayVisible: boolean = false;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  tenableTool: string = 'sumid';
  savedType: string = 'vuln';
  savedSourceType: string = 'cumulative';
  savedTool: string = 'sumid';
  existingPoamPluginIDs: { [key: string]: PoamAssociation } = {};
  private subscriptions = new Subscription();
  @ViewChild('ms') multiSelect!: MultiSelect;
  @ViewChild('op') overlayPanel!: Popover;
  @ViewChild('dt') table!: Table;

  acceptRiskStatusOptions = [
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
    { label: 'More than One Year', value: '365:all' },
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

  webAppScanningOptions = [
    { label: 'Exclude Web App Results', value: 'excludeWas' },
    { label: 'Include Web App Results', value: 'includeWas' },
    { label: 'Only Web App Results', value: 'onlyWas' }
  ];

  exploitAvailableOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ];

  mitigatedStatusOptions = [
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
  pluginTextOptions = this.containsAndRegexOptions;

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

  xrefOptions = [
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

  defaultPremadeFilterOptions: PremadeFilterOption[] = [
    { label: 'Vulnerability Published 30+ Days', value: 'vulnpublished30' },
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
      value: 0,
    },
    {
      header: 'AES',
      content: 'rangeFilter',
      identifier: 'assetExposureScore',
      options: this.assetExposureScoreOptions,
      value: 1,
    },
    {
      header: 'AES Severity',
      content: 'multiSelect',
      identifier: 'aesSeverity',
      options: this.aesSeverityOptions,
      value: 2,
    },
    {
      header: 'Accept Risk',
      content: 'dropdown',
      identifier: 'acceptRiskStatus',
      options: this.acceptRiskStatusOptions,
      value: 3,
    },
    {
      header: 'Address',
      content: 'input',
      identifier: 'ip',
      placeholder: 'IP Address...',
      validator: this.validateIP.bind(this),
      value: 4,
    },
    {
      header: 'Agent ID',
      content: 'input',
      identifier: 'uuid',
      placeholder: 'UUID...',
      validator: this.validateUUID.bind(this),
      value: 5,
    },
    {
      header: 'Application CPE',
      content: 'dropdownAndTextarea',
      identifier: 'cpe',
      options: this.cpeOptions,
      value: 6,
    },
    {
      header: 'Assets',
      content: 'multiSelect',
      identifier: 'asset',
      options: this.assetOptions,
      value: 7,
    },
    {
      header: 'Audit File',
      content: 'dropdown',
      identifier: 'auditFile',
      options: this.auditFileOptions,
      value: 8,
    },
    {
      header: 'CCE ID',
      content: 'input',
      identifier: 'cceId',
      placeholder: 'CCE ID...',
      value: 9,
    },
    {
      header: 'Cross References',
      content: 'dropdownAndTextarea',
      identifier: 'xref',
      options: this.xrefOptions,
      value: 10,
    },
    {
      header: 'CVE ID',
      content: 'input',
      identifier: 'cveId',
      placeholder: 'CVE ID...',
      value: 11,
    },
    {
      header: 'CVSS v2 Score',
      content: 'rangeFilter',
      identifier: 'baseCVSSScore',
      options: this.baseCVSSScoreOptions,
      value: 12,
    },
    {
      header: 'CVSS v2 Vector',
      content: 'input',
      identifier: 'cvssVector',
      placeholder: 'Enter CVSS v2 Vector...',
      validator: this.validateCVSSv2Vector.bind(this),
      value: 13,
    },
    {
      header: 'CVSS v3 Score',
      content: 'rangeFilter',
      identifier: 'cvssV3BaseScore',
      options: this.cvssV3BaseScoreOptions,
      value: 14,
    },
    {
      header: 'CVSS v3 Vector',
      content: 'input',
      identifier: 'cvssV3Vector',
      placeholder: 'Enter CVSS v3 Vector...',
      validator: this.validateCVSSv3Vector.bind(this),
      value: 15,
    },
    {
      header: 'Data Format',
      content: 'multiSelect',
      identifier: 'dataFormat',
      options: this.dataFormatOptions,
      value: 16,
    },
    {
      header: 'DNS Name',
      content: 'input',
      identifier: 'dnsName',
      placeholder: 'Enter DNS Name...',
      value: 17,
    },
    {
      header: 'Exploit Available',
      content: 'dropdown',
      identifier: 'exploitAvailable',
      options: this.exploitAvailableOptions,
      value: 18,
    },
    {
      header: 'Exploit Frameworks',
      content: 'dropdownAndTextarea',
      identifier: 'exploitFrameworks',
      options: this.exploitFrameworkOptions,
      value: 19,
    },
    {
      header: 'Host ID',
      content: 'input',
      identifier: 'hostUUID',
      placeholder: 'Enter Host UUID...',
      validator: this.validateUUID.bind(this),
      value: 20,
    },
    {
      header: 'IAVM ID',
      content: 'input',
      identifier: 'iavmID',
      placeholder: 'Enter IAVM ID...',
      validator: this.validateIAVM.bind(this),
      value: 21,
    },
    {
      header: 'Input Name',
      content: 'input',
      identifier: 'wasInputName',
      placeholder: 'Enter input name...',
      value: 22,
    },
    {
      header: 'Input Type',
      content: 'input',
      identifier: 'wasInputType',
      placeholder: 'Enter input type...',
      value: 23,
    },
    {
      header: 'MS Bulletin ID',
      content: 'input',
      identifier: 'msbulletinID',
      placeholder: 'Enter MS Bulletin ID...',
      value: 24,
    },
    {
      header: 'Mitigated Status',
      content: 'dropdown',
      identifier: 'mitigatedStatus',
      options: this.mitigatedStatusOptions,
      value: 25,
    },
    {
      header: 'NetBIOS Name',
      content: 'dropdownAndTextarea',
      identifier: 'netbiosName',
      options: this.netbiosNameOptions,
      value: 26,
    },
    {
      header: 'Patch Published',
      content: 'dropdown',
      identifier: 'patchPublished',
      options: this.patchPublishedOptions,
      value: 27,
    },
    {
      header: 'Plugin Family',
      content: 'multiSelect',
      identifier: 'family',
      options: this.familyOptions,
      value: 28,
    },
    {
      header: 'Plugin ID',
      content: 'dropdownAndTextarea',
      identifier: 'pluginID',
      options: this.pluginIDOptions,
      value: 29,
    },
    {
      header: 'Plugin Modified',
      content: 'dropdown',
      identifier: 'pluginModified',
      options: this.pluginModifiedOptions,
      value: 30,
    },
    {
      header: 'Plugin Name',
      content: 'dropdownAndTextarea',
      identifier: 'pluginName',
      options: this.pluginNameOptions,
      value: 31,
    },
    {
      header: 'Plugin Published',
      content: 'dropdown',
      identifier: 'pluginPublished',
      options: this.pluginPublishedOptions,
      value: 32,
    },
    {
      header: 'Plugin Type',
      content: 'dropdown',
      identifier: 'pluginType',
      options: this.pluginTypeOptions,
      value: 33,
    },
    {
      header: 'Port',
      content: 'dropdownAndTextarea',
      identifier: 'port',
      options: this.portOptions,
      value: 34,
    },
    {
      header: 'Protocol',
      content: 'multiSelect',
      identifier: 'protocol',
      options: this.protocolOptions,
      value: 35,
    },
    {
      header: 'Recast Risk',
      content: 'dropdown',
      identifier: 'recastRiskStatus',
      options: this.recastRiskStatusOptions,
      value: 36,
    },
    {
      header: 'STIG Severity',
      content: 'dropdownAndInput',
      identifier: 'stigSeverity',
      options: this.stigSeverityOptions,
      validator: this.validateStigSeverity.bind(this),
      value: 37,
    },
    {
      header: 'Scan Policy Plugins',
      content: 'dropdown',
      identifier: 'policy',
      options: this.scanPolicyPluginOptions,
      value: 38,
    },
    {
      header: 'Severity',
      content: 'multiSelect',
      identifier: 'severity',
      options: this.severityOptions,
      value: 39,
    },
    {
      header: 'Security End of Life Date',
      content: 'dropdown',
      identifier: 'seolDate',
      options: this.seolDateOptions,
      value: 40,
    },
    {
      header: 'Users',
      content: 'multiSelect',
      identifier: 'responsibleUser',
      options: this.userOptions,
      value: 41,
    },
    {
      header: 'Vulnerability Discovered',
      content: 'dropdown',
      identifier: 'firstSeen',
      options: this.firstSeenOptions,
      value: 42,
    },
    {
      header: 'Vulnerability UUID',
      content: 'input',
      identifier: 'vulnUUID',
      placeholder: 'Enter Vuln UUID...',
      value: 43,
    },
    {
      header: 'Vulnerability Last Observed',
      content: 'dropdown',
      identifier: 'lastSeen',
      options: this.lastSeenOptions,
      value: 44,
    },
    {
      header: 'Vulnerability Priority Rating',
      content: 'rangeFilter',
      identifier: 'vprScore',
      options: this.vprScoreOptions,
      value: 45,
    },
    {
      header: 'Vulnerability Published',
      content: 'dropdown',
      identifier: 'vulnPublished',
      options: this.vulnPublishedOptions,
      value: 46,
    },
    {
      header: 'Vulnerability Text',
      content: 'dropdownAndTextarea',
      identifier: 'pluginText',
      options: this.pluginTextOptions,
      value: 47,
    },
    {
      header: 'Vulnerability Type',
      content: 'dropdown',
      identifier: 'vulnerabilityType',
      options: this.vulnerabilityTypeOptions,
      value: 48,
    },
    {
      header: 'Web App HTTP Method',
      content: 'input',
      identifier: 'wasHttpMethod',
      placeholder: 'Web app HTTP method...',
      value: 49,
    },
    {
      header: 'Web App Scanning',
      content: 'dropdown',
      identifier: 'wasVuln',
      options: this.webAppScanningOptions,
      value: 50,
    },
    {
      header: 'Web App URL',
      content: 'input',
      identifier: 'wasURL',
      placeholder: 'Web app URL...',
      value: 51,
    },
  ];

  private filterNameMappings: { [key: string]: FilterConfig } = {
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
    dnsName: { uiName: 'dnsName', handler: 'operatorValue' },
    hostUUID: { uiName: 'hostUUID', handler: 'operatorValue' },
    iavmID: { uiName: 'iavmID', handler: 'operatorValue' },
    wasInputName: { uiName: 'wasInputName', handler: 'operatorValue' },
    wasInputType: { uiName: 'wasInputType', handler: 'operatorValue' },
    msbulletinID: { uiName: 'msbulletinID', handler: 'operatorValue' },
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
    vulnPublished: { uiName: 'vulnPublished', handler: 'simpleValue' },
    wasVuln: { uiName: 'wasVuln', handler: 'simpleValue' },

    vprScore: { uiName: 'vprScore', handler: 'range' },
    assetCriticalityRating: { uiName: 'assetCriticalityRating', handler: 'range' },
    assetExposureScore: { uiName: 'assetExposureScore', handler: 'range' },
    baseCVSSScore: { uiName: 'baseCVSSScore', handler: 'range' },
    cvssV3BaseScore: { uiName: 'cvssV3BaseScore', handler: 'range' }
  };

  private filterHandlers: { [key: string]: FilterHandler } = {
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
          value: filter.value.map((v: any) => typeof v === 'string' ? { id: v } : v)
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
        return { value: filter.value.map(v => ({ id: v })) };
      }
      return {
        value: [{ id: filter.value }]
      };
    },

    severity: (filter: any): FilterValue => {
      return {
        value: Array.isArray(filter.value) ? filter.value.join(',') : filter.value
      }
    },

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

  constructor(
    private importService: ImportService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private collectionsService: CollectionsService,
    private messageService: MessageService,
    private poamService: PoamService,
    private sharedService: SharedService,
    private router: Router
  ) { }

  ngOnInit() {
    this.filteredAccordionItems = [...this.accordionItems];
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
        this.loadSavedFilters();
        this.collectionsService.getCollectionBasicList().pipe(
          tap(data => {
            const selectedCollectionData = data.find(
              (collection: any) => collection.collectionId === this.selectedCollection
            );
            if (selectedCollectionData) {
              this.tenableRepoId = selectedCollectionData.originCollectionId?.toString();
            } else {
              this.tenableRepoId = '';
            }
          }),
          switchMap(() => forkJoin([
            this.loadAssetOptions(),
            this.loadAuditFileOptions(),
            this.loadFamilyOptions(),
            this.loadScanPolicyPluginOptions(),
            this.loadUserOptions(),
            this.loadPoamAssociations()
          ])),
          catchError(error => {
            console.error('Error loading filter list data:', error);
            return EMPTY;
          })
        ).subscribe({
          next: () => {
            this.updateAccordionItems();
            this.initializeColumnsAndFilters();
            this.filteredAccordionItems = [...this.accordionItems];
          }
        });
      })
    );
  }

  private initializeColumnsAndFilters() {
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
          { label: 'Submitted', value: 'Submitted' },
        ],
      },
      {
        field: 'pluginID',
        header: 'Plugin ID',
        filterable: true,
      },
      { field: 'pluginName', header: 'Name', filterable: true },
      { field: 'family', header: 'Family', filterable: true },
      {
        field: 'severity',
        header: 'Severity',
        filterable: true,
      },
      { field: 'vprScore', header: 'VPR', filterable: true },
      { field: 'iav', header: 'IAV', filterType: 'text' },
      {
        field: 'navyComplyDate',
        header: 'Navy Comply Date',
        filterType: 'date',
      },
      { field: 'ips', header: 'IP Address' },
      { field: 'acrScore', header: 'ACR', filterable: false },
      {
        field: 'assetExposureScore',
        header: 'AES',
        filterable: false,
      },
      {
        field: 'netbiosName',
        header: 'NetBIOS',
        filterable: false,
      },
      { field: 'dnsName', header: 'DNS', filterable: false },
      {
        field: 'macAddress',
        header: 'MAC Address',
        filterable: false,
      },
      { field: 'port', header: 'Port', filterable: false },
      {
        field: 'protocol',
        header: 'Protocol',
        filterable: false,
      },
      { field: 'uuid', header: 'Agent ID', filterable: false },
      {
        field: 'hostUUID',
        header: 'Host ID',
        filterable: false,
      },
      {
        field: 'total',
        header: 'Total',
        filterType: 'numeric',
      },
      {
        field: 'hostTotal',
        header: 'Host Total',
        filterType: 'numeric',
      },
    ];
    this.resetColumnSelections();
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.tempFilters['severity'] = ['1', '2', '3', '4'];
    this.tempFilters['lastSeen'] = '0:30';
    this.applyFilters();
    this.filterAccordionItems();
  }


  private initializeTempFilters(): TempFilters {
    return {
      assetCriticalityRating: { value: 'all', min: 0, max: 10 },
      acceptRiskStatus: null,
      ip: { value: null, operator: null, isValid: true, isDirty: false },
      assetExposureScore: { value: 'all', min: 0, max: 1000 },
      aesSeverity: [],
      uuid: { value: null, operator: null, isValid: true, isDirty: false },
      asset: [],
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
        isDirty: false,
      },
      responsibleUser: [],
      vprScore: { value: 'all', min: 0, max: 10 },
      vulnerabilityType: null,
      lastSeen: null,
      firstSeen: null,
      vulnPublished: null,
      seolDate: null,
      pluginText: { operator: null, value: null },
      vulnUUID: { value: null, operator: null, isValid: true, isDirty: false },
      wasHttpMethod: { value: null, operator: null, isValid: true, isDirty: false },
      wasVuln: null,
      wasURL: { value: null, operator: null, isValid: true, isDirty: false }
    };
  }

  updateAccordionItems() {
    this.accordionItems = this.accordionItems.map(item => {
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
    this.cdr.detectChanges();
  }

  filterAccordionItems() {
    let items = [...this.accordionItems];

    if (this.filterSearch?.trim()) {
      const searchTerm = this.filterSearch.toLowerCase().trim();
      items = items.filter(item =>
        item.header.toLowerCase().includes(searchTerm)
      );
    }

    items.sort((a, b) => {
      const aIsDefault = a.identifier === 'severity' || a.identifier === 'lastSeen';
      const bIsDefault = b.identifier === 'severity' || b.identifier === 'lastSeen';

      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;

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
      map(assetsData => {
        this.assetOptions = assetsData.response.usable.map((assets: any) => ({
          value: assets.id,
          label: assets.name,
        }));
        return this.assetOptions;
      }),
      catchError(error => {
        console.error('Error fetching tenable asset filter data:', error);
        this.showErrorMessage('Error fetching tenable asset filter data. Please try again.');
        return EMPTY;
      })
    );
  }

  loadAuditFileOptions(): Observable<any> {
    return this.importService.getTenableAuditFileFilter().pipe(
      map(auditFileData => {
        this.auditFileOptions = auditFileData.response.usable.map((auditFile: any) => ({
          value: auditFile.id,
          label: auditFile.name,
        }));
        return this.auditFileOptions;
      }),
      catchError(error => {
        console.error('Error fetching audit file data:', error);
        this.showErrorMessage('Error fetching audit file data. Please try again.');
        return EMPTY;
      })
    );
  }

  loadFamilyOptions(): Observable<any> {
    return this.importService.getTenablePluginFamily().pipe(
      map(familyData => {
        this.familyOptions = familyData.response.map((family: any) => ({
          value: family.id,
          label: family.name,
        }));
        return this.familyOptions;
      }),
      catchError(error => {
        console.error('Error fetching plugin family data:', error);
        this.showErrorMessage('Error fetching plugin family data. Please try again.');
        return EMPTY;
      })
    );
  }

  loadScanPolicyPluginOptions(): Observable<any> {
    return this.importService.getTenableScanPolicyPluginsFilter().pipe(
      map(scanPolicyPluginData => {
        this.scanPolicyPluginOptions = scanPolicyPluginData.response.usable.map((plugins: any) => ({
          value: plugins.id,
          label: plugins.name,
        }));
        return this.scanPolicyPluginOptions;
      }),
      catchError(error => {
        console.error('Error fetching scan policy plugin data:', error);
        this.showErrorMessage('Error fetching scan policy plugin data. Please try again.');
        return EMPTY;
      })
    );
  }

  loadUserOptions(): Observable<any> {
    return this.importService.getTenableUsersFilter().pipe(
      map(userData => {
        this.userOptions = userData.response.map((user: any) => ({
          value: user.id,
          label: `${user.firstname} ${user.lastname} [${user.username}]`,
        }));
        return this.userOptions;
      }),
      catchError(error => {
        console.error('Error fetching tenable user data:', error);
        this.showErrorMessage('Error fetching tenable user data. Please try again.');
        return EMPTY;
      })
    );
  }

  loadVulnerabilitiesLazy(event: TableLazyLoadEvent) {
    if (!this.tenableRepoId) return;

    this.isLoading = true;

    const startOffset = this.tenableTool === 'sumid' ? 0 : event.first ?? 0;
    const endOffset = this.tenableTool === 'sumid' ? 5000 : startOffset + (event.rows ?? 20);
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
        vulnTool: this.tenableTool,
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln',
    };

    this.importService.postTenableAnalysis(analysisParams).pipe(
      catchError(error => {
        console.error('Error fetching vulnerabilities:', error);
        this.showErrorMessage('Error fetching all Vulnerabilities. Please try again.');
        return EMPTY;
      }),
      switchMap(data => {
        if (data.error_msg) {
          this.showErrorMessage(data.error_msg);
          return EMPTY;
        }

        const pluginIDs = data.response.results.map((vuln: any) => Number(vuln.pluginID));

        if (pluginIDs.length > 0) {
          return this.importService.getIAVInfoForPlugins(pluginIDs).pipe(
            catchError(error => {
              console.error('Error fetching IAV info:', error);
              return of([]);
            }),
            map(iavData => ({
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
    ).subscribe({
      next: ({ vulnData, iavInfoMap }) => {
        this.allVulnerabilities = vulnData.results.map((vuln: any) => {
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
          const iavInfo = iavInfoMap[Number(vuln.pluginID)] || { iav: null, navyComplyDate: null };

          return {
            ...defaultVuln,
            ...vuln,
            poam: !!poamAssociation,
            poamId: poamAssociation?.poamId || null,
            poamStatus: poamAssociation?.status ? poamAssociation.status : 'No Existing POAM',
            iav: iavInfo.iav,
            navyComplyDate: iavInfo?.navyComplyDate ? parseISO(iavInfo.navyComplyDate) : null,
            pluginName: vuln.name || '',
            family: vuln.family?.name || '',
            severity: { name: vuln.severity?.name || '' },
          };
        });

        this.totalRecords = vulnData.totalRecords;
      }
    });
  }

  private createIAVInfoMap(iavData: any[]): { [key: number]: IAVInfo } {
    return iavData.reduce((acc: any, item: any) => {
      acc[item.pluginID] = {
        iav: item.iav || null,
        navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : null,
      };
      return acc;
    }, {});
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
    isOperator: boolean = false
  ) {
    if (identifier === 'severity') {
      this.tempFilters['severity'] = event.value;
      return;
    }
    if (identifier === 'lastSeen') {
      this.tempFilters['lastSeen'] = event.value;
      return;
    }

    if (identifier === 'family') {
      this.tempFilters['family'] = Array.isArray(event.value) ?
        event.value :
        event.value ? [event.value] : [];
      return;
    }
    if (identifier === 'policy' || identifier === 'auditFile') {
      this.tempFilters[identifier] = event.value ? [event.value] : [];
      return;
    }

    if (identifier) {
      const accordionItem = this.accordionItems.find(item => item.identifier === identifier);
      const value = isInput ? event.target.value : event.value;

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

  private mapSingleFilter(filter: any): void {
    if (filter.filterName === 'xref' && filter.value.includes('IAVA|20*,IAVB|20*')) {
      const value = filter.operator === '=' ? 'iav' : 'non-iav';
      this.tempFilters['vulnerabilityType'] = value;
      this.onFilterChange({ value }, 'vulnerabilityType');
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

    const config = this.filterNameMappings[filter.filterName];
    if (!config) return;

    const handler = this.filterHandlers[config.handler];
    if (!handler) return;

    const filterValue = handler(filter);
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

  createAssetsFilter(value: any): AssetsFilter | null {
    if (!value || value.length === 0) {
      return null;
    }
    if (value.length === 1) {
      return {
        filterName: 'asset',
        operator: '=',
        value: { id: value[0] },
      };
    }
    let formattedValue: any = { id: value[0] };
    for (let i = 1; i < value.length; i++) {
      formattedValue = {
        operator: 'union',
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
        const apiConfig = Object.entries(this.filterNameMappings)
          .find(([_, config]) => config.uiName === uiName);

        if (!apiConfig) return null;

        const [apiName, config] = apiConfig;

        switch (config.handler) {
          case 'idArray':
            if (apiName === 'asset') {
              if (Array.isArray(value)) {
                const assetFilter = this.createAssetsFilter(value);
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
                value: value.map(v => ({ id: v }))
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
              value: value.map(v => ({ id: v }))
            };

          case 'severity':
            const severityValue = Array.isArray(value) ? value.join(',') : value;
            return severityValue ? {
              id: 'severity',
              filterName: 'severity',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: severityValue
            } : null;

          case 'array':
            const hasValue = Array.isArray(value)
              ? value.length > 0
              : value !== null && value !== undefined;
            return hasValue ? {
              id: apiName,
              filterName: apiName,
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: Array.isArray(value) ? value.join(',') : value
            } : null;

          case 'operatorValue':
            return value.value ? {
              id: apiName,
              filterName: apiName,
              operator: value.operator || '=',
              type: 'vuln',
              isPredefined: true,
              value: value.value
            } : null;

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
            return value ? {
              id: apiName,
              filterName: apiName,
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: value
            } : null;

          default:
            return null;
        }
      })
      .filter((filter): filter is CustomFilter => filter !== null);

    let activeFilters: CustomFilter[] = [];

    if (!tempActiveFilters.some(f => f.filterName === 'severity')) {
      activeFilters.push({
        id: 'severity',
        filterName: 'severity',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '1,2,3,4'
      });
    }

    if (!tempActiveFilters.some(f => f.filterName === 'lastSeen')) {
      activeFilters.push({
        id: 'lastSeen',
        filterName: 'lastSeen',
        operator: '=',
        type: 'vuln',
        isPredefined: true,
        value: '0:30'
      });
    }

    return [...activeFilters, ...tempActiveFilters];
  }

  applyFilters(loadVuln: boolean = true) {
    this.activeFilters = this.convertTempFiltersToAPI();
    this.filterAccordionItems();

    if (loadVuln) {
      this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    }
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
      case 'asset':
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
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'wasInputName':
      case 'wasInputType':
      case 'msbulletinID':
      case 'stigSeverity':
      case 'vulnUUID':
      case 'wasHttpMethod':
      case 'wasURL':
        this.tempFilters[identifier] = {
          value: null,
          operator: null,
          isValid: true,
          isDirty: false,
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
      case 'vprScore':
        return filter.value !== 'all';
      case 'aesSeverity':
      case 'asset':
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
      case 'dnsName':
      case 'hostUUID':
      case 'iavmID':
      case 'wasInputName':
      case 'wasInputType':
      case 'msbulletinID':
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
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  validateUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }

  validateCVSSv2Vector(vector: string): boolean {
    const cvssV2Regex =
      /^(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])(\/(?!.*\1)(AV:[LAN]|AC:[LMH]|Au:[MSN]|C:[NPC]|I:[NPC]|A:[NPC])){5}$/;
    return cvssV2Regex.test(vector);
  }

  validateCVSSv3Vector(vector: string): boolean {
    const cvssV3Regex =
      /^CVSS:3\.[01]\/((AV:[NALP]|AC:[LH]|PR:[NLH]|UI:[NR]|S:[UC]|C:[NLH]|I:[NLH]|A:[NLH]|E:[XUPFH]|RL:[XOTWU]|RC:[XURC]|CR:[XLH]|IR:[XLH]|AR:[XLH]|MAV:[XNALP]|MAC:[XLH]|MPR:[XNLH]|MUI:[XNR]|MS:[XUC]|MC:[XNLH]|MI:[XNLH]|MA:[XNLH])\/){8,11}$/;
    return cvssV3Regex.test(vector);
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

  clearFilters(loadVuln: boolean = true) {
    this.table.clear();
    this.tenableTool = 'sumid';
    this.tempFilters = this.initializeTempFilters();
    this.tempFilters['severity'] = ['1', '2', '3', '4'];
    this.tempFilters['lastSeen'] = '0:30';
    this.activeFilters = [];
    this.filterSearch = '';
    this.applyFilters(false);
    this.filterAccordionItems();
    this.resetColumnSelections();
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
    ];
  }

  applyPremadeFilter(event: any) {
    if (!event.value) return;

    const selectedFilter = this.findFilterByValue(event.value);
    if (!selectedFilter) return;

    if (event.value.startsWith('saved_')) {
      const savedFilter = typeof selectedFilter.filter === 'string'
        ? JSON.parse(selectedFilter.filter)
        : selectedFilter.filter;

      if (savedFilter) {
        this.clearFilters(false);
        this.tenableTool = savedFilter.tenableTool;
        this.tempFilters = this.initializeTempFilters();

        if (Array.isArray(savedFilter.filters)) {
          savedFilter.filters.forEach(filter => {
            if (filter.filterName && filter.value !== undefined) {
              this.mapSingleFilter(filter);
            }
          });
        }

        this.activeFilters = this.convertTempFiltersToAPI();
        this.filteredAccordionItems = [...this.accordionItems];
        this.filterAccordionItems();
        this.isLoading = true;
        this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
        return;
      }
    }

    this.clearFilters(false);
    switch (event.value) {
      case 'vulnpublished30':
        this.tempFilters['vulnPublished'] = '30:all';
        break;
      case 'exploitable7':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['vulnPublished'] = '7:all';
        break;
      case 'exploitable30':
        this.tempFilters['exploitAvailable'] = 'true';
        this.tempFilters['vulnPublished'] = '30:all';
        break;
      case 'criticalHigh7':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['vulnPublished'] = '7:all';
        break;
      case 'criticalHigh14':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['vulnPublished'] = '14:all';
        break;
      case 'criticalHigh30':
        this.tempFilters['severity'] = ['3', '4'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['vulnPublished'] = '30:all';
        break;
      case 'medium180':
        this.tempFilters['severity'] = ['2'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['vulnPublished'] = '180:all';
        break;
      case 'low365':
        this.tempFilters['severity'] = ['1'];
        this.tempFilters['lastSeen'] = '0:30';
        this.tempFilters['vulnPublished'] = '365:all';
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

    this.activeFilters = this.convertTempFiltersToAPI();
    this.filteredAccordionItems = [...this.accordionItems];
    this.filterAccordionItems();
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
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
          const found = group.items.find(item => item.value === value);
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
          const savedFilterOptions: PremadeFilterOption[] = filters.map(filter => ({
            label: String(filter.filterName),
            value: `saved_${filter.filterId}`,
            filter: filter.filter,
            subLabel: `Created by ${filter.createdBy || 'Unknown'}`
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
          console.error('Error loading saved filters:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading saved filters. Please try again.'
          });
        }
      });
    }
  }

  onFilterSaved() {
    this.loadSavedFilters();
  }

  loadVulnList() {
    this.tenableTool = 'listvuln';
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    this.expandColumnSelections();
  }

  loadVulnSummary() {
    this.tenableTool = 'sumid';
    this.loadVulnerabilitiesLazy({ first: 0, rows: this.rows });
    this.resetColumnSelections();
  }

  async onRowClick(vulnerability: any, event: any) {
    event.stopPropagation();
    await this.clearFilters(false);
    this.tenableTool = 'listvuln';
    this.tempFilters['pluginID'] = {
      operator: '=',
      value: vulnerability.pluginID,
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
          iavComplyByDate: formattedIavComplyByDate,
        },
      });
    } catch (error) {
      console.error('Error in onPoamIconClick:', error);
      this.showErrorMessage('Error processing vulnerability data. Please try again.');
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

  showDetails(vulnerability: any, createPoam: boolean = false): Promise<void> {
    if (!vulnerability || !vulnerability.pluginID) {
      this.showErrorMessage('Invalid vulnerability data');
      return Promise.reject('Invalid vulnerability data');
    }

    return new Promise((resolve, reject) => {
      this.importService.getTenablePlugin(vulnerability.pluginID).pipe(
        tap(data => {
          if (!data || !data.response) {
            throw new Error('Invalid response from getTenablePlugin');
          }
        }),
        map(data => data.response)
      ).subscribe({
        next: (pluginData) => {
          this.pluginData = pluginData;
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
          if (!createPoam) {
            this.displayDialog = true;
          }
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

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter(col =>
      [
        'poam',
        'pluginID',
        'pluginName',
        'family',
        'severity',
        'vprScore',
        'iav',
        'navyComplyDate',
        'total',
        'hostTotal',
      ].includes(col.field)
    );
  }

  expandColumnSelections() {
    this.selectedColumns = this.cols.filter(col =>
      [
        'poam',
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
      ].includes(col.field)
    );
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
    }
  }

  loadPoamAssociations(): Observable<any> {
    return this.poamService.getPluginIDsWithPoamByCollection(this.selectedCollection).pipe(
      map(poamData => {
        if (poamData && Array.isArray(poamData)) {
          this.existingPoamPluginIDs = poamData.reduce(
            (
              acc: { [key: string]: PoamAssociation },
              item: { vulnerabilityId: string; poamId: number; status: string }
            ) => {
              acc[item.vulnerabilityId] = {
                poamId: item.poamId,
                status: item.status,
              };
              return acc;
            },
            {}
          );
          return this.existingPoamPluginIDs;
        } else {
          throw new Error('Unexpected POAM data format');
        }
      }),
      catchError(error => {
        console.error('Error loading POAM associations:', error);
        this.showErrorMessage('Error loading POAM data. Please try again.');
        return EMPTY;
      })
    );
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

  onTableFilter(event: any) {
    this.totalRecords = event.filteredValue ? event.filteredValue.length : 0;
  }

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Alert',
      detail: message,
      sticky: true,
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
