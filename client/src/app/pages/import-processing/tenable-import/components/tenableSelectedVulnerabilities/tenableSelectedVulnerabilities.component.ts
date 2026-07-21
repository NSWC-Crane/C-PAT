/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, viewChild, output, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { format, parseISO, startOfDay } from 'date-fns';
import { FilterMetadata, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Select, SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';
import { ExportColumn, IAVInfo, ParsedReferences, Reference, SeverityStyle } from '../../../../../common/models/tenable.model';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { createPoamAssociationsMap, getCveUrl, getIavUrl, getPoamStatusColor, getPoamStatusIcon, getPoamStatusTooltip, getSeverityStyling, parseReferences, parseVprContext } from '../../utils/tenable-vulnerability.utils';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../../../../poam-processing/poams.service';
import { ImportService } from '../../../import.service';
import { MultiSelectDirective } from '../../../../../common/directives/multi-select.directive';

interface NavyComplyDateFilter {
  label: string;
  value: string;
}

const DEFAULT_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

@Component({
  selector: 'cpat-tenable-selected-vulnerabilities',
  templateUrl: './tenableSelectedVulnerabilities.component.html',
  styleUrls: ['./tenableSelectedVulnerabilities.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, DialogModule, SelectModule, FormsModule, InputTextModule, InputIconModule, IconFieldModule, MultiSelectDirective, SelectModule, SkeletonModule, TableModule, ToastModule, TooltipModule, TagModule, DatePipe, NgClass]
})
export class TenableSelectedVulnerabilitiesComponent implements OnInit {
  private readonly importService = inject(ImportService);
  private readonly messageService = inject(MessageService);
  private readonly poamService = inject(PoamService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly totalRecordsChange = output<number>();
  readonly currentPreset = input<string>('iav');
  private readonly table = viewChild.required<Table>('dt');
  private readonly select = viewChild.required<Select>('dd');
  private readonly columnSelect = viewChild.required<Select>('ms');
  filters: { [key: string]: FilterMetadata[] } = {
    supersededBy: [{ value: 'N/A', matchMode: 'contains', operator: 'and' }],
    severity: [{ value: [...DEFAULT_SEVERITIES], matchMode: 'in', operator: 'and' }]
  };
  readonly cols = signal<any[]>([]);
  exportColumns!: ExportColumn[];
  existingPoamPluginIDs: any;
  readonly selectedColumns = signal<any[]>([]);
  restoredSelectedColumns: any[];
  readonly cveReferences = signal<Reference[]>([]);
  readonly iavReferences = signal<Reference[]>([]);
  readonly otherReferences = signal<Reference[]>([]);
  readonly applicableVulnerabilities = signal<any[]>([]);
  applicablePluginIDs: string = '';
  taskOrderMap: { [pluginId: string]: string } = {};
  readonly selectedVulnerability = signal<any>(null);
  readonly displayDialog = signal<boolean>(false);
  readonly parsedVprContext = signal<any[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly formattedDescription = signal<string>('');
  readonly pluginData = signal<any>(null);
  readonly totalRecords = signal<number>(0);
  filterValue: string = '';
  readonly navyComplyDateFilters = signal<NavyComplyDateFilter[]>([]);
  tenableTool: string = 'sumid';
  selectedNavyComplyDateFilter: NavyComplyDateFilter | null = null;
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  readonly selectedSeverities = signal<string[]>([...DEFAULT_SEVERITIES]);

  ngOnInit() {
    this.isLoading.set(true);
    const stored = sessionStorage.getItem('tenableSelectedVulnState');
    let shouldRestoreState = false;

    if (stored) {
      const savedState = JSON.parse(stored);

      sessionStorage.removeItem('tenableSelectedVulnState');

      if (savedState.currentPreset === this.currentPreset()) {
        shouldRestoreState = true;
        this.filters = savedState.filters || this.filters;
        this.selectedSeverities.set(savedState.selectedSeverities || [...DEFAULT_SEVERITIES]);
        this.selectedNavyComplyDateFilter = savedState.selectedNavyComplyDateFilter || null;
        this.filterValue = savedState.filterValue || '';
        this.tenableTool = savedState.tenableTool || 'sumid';
        this.restoredSelectedColumns = savedState.selectedColumns;
      }
    }

    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection = collectionId;
    });
    this.collectionsService
      .getCollectionBasicList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const selectedCollectionData = data.find((collection: any) => collection.collectionId === this.selectedCollection);

          if (selectedCollectionData) {
            this.tenableRepoId = selectedCollectionData.originCollectionId?.toString();
            this.initColumnsAndFilters();
            this.loadPoamAssociations();

            if (this.currentPreset() === 'taskOrder') {
              this.getTaskOrderVulnerabilityIds();
            } else {
              this.getIAVPluginIDs();
            }

            setTimeout(() => {
              const table = this.table();

              if (table) {
                table.filters = { ...this.filters };
                table._filter();
              }
            });
          } else {
            this.handleMissingTenable();
          }

          if (shouldRestoreState && this.restoredSelectedColumns) {
            this.selectedColumns.set(this.restoredSelectedColumns);
            delete this.restoredSelectedColumns;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching collection list: ${getErrorMessage(error)}`
          });
          this.handleMissingTenable();
        }
      });
  }

  private handleMissingTenable(): void {
    this.tenableRepoId = '';

    if (!this.cols().length) {
      this.initColumnsAndFilters();
    }

    this.isLoading.set(false);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to load Tenable repository information. Some features may be unavailable.'
    });
  }

  initColumnsAndFilters() {
    this.cols.set([
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
        filterType: 'text'
      },
      ...(this.currentPreset() === 'taskOrder' ? [{ field: 'taskOrderNumber', header: 'Task Order #', filterType: 'text' }] : []),
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
        filterType: 'multi',
        filterOptions: [
          { label: 'Info', value: 'Info' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' }
        ]
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
      { field: 'hostTotal', header: 'Host Total', filterType: 'numeric' }
    ]);
    this.exportColumns = this.cols().map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
    this.navyComplyDateFilters.set([
      { label: 'All IAVs', value: null },
      { label: 'All Overdue', value: 'alloverdue' },
      { label: '90+ Days Overdue', value: 'overdue90Plus' },
      { label: '30-90 Days Overdue', value: 'overdue30To90' },
      { label: '0-30 Days Overdue', value: 'overdue0To30' },
      { label: '0-14 Days Overdue', value: 'overdue0To14' },
      { label: '0-7 Days Overdue', value: 'overdue0To7' },
      { label: 'Due Between 7-14 Days', value: 'dueBetween714' },
      { label: 'Due Between 14-30 Days', value: 'dueBetween1430' },
      { label: 'Due Between 30-90 Days', value: 'dueBetween3090' },
      { label: 'Due Within 7 Days', value: 'dueWithin7' },
      { label: 'Due Within 14 Days', value: 'dueWithin14' },
      { label: 'Due Within 30 Days', value: 'dueWithin30' },
      { label: 'Due Within 90 Days', value: 'dueWithin90' }
    ]);
    this.resetColumnSelections();
  }

  getIAVPluginIDs() {
    this.importService
      .getIAVPluginIds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.applicablePluginIDs = data;
          this.getApplicableFindings(this.applicablePluginIDs);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching IAV mapped pluginIDs: ${getErrorMessage(error)}`
          });
        }
      });
  }

  getTaskOrderVulnerabilityIds() {
    this.importService
      .getVulnerabilityIdsWithTaskOrderByCollection(this.selectedCollection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.applicableVulnerabilities.set([]);
            this.totalRecords.set(0);
            this.totalRecordsChange.emit(this.totalRecords());
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'info',
              summary: 'Notice',
              detail: 'There are no POAMs with Task Orders within the collection.',
              sticky: true
            });

            return;
          }

          const mappedPluginIDs = data.map((item: any) => item.vulnerabilityId).join(',');

          this.taskOrderMap = data.reduce((acc: { [key: string]: string }, item: any) => {
            acc[item.vulnerabilityId] = item.taskOrderNumber || '';

            return acc;
          }, {});

          this.applicablePluginIDs = mappedPluginIDs;
          this.getApplicableFindings(this.applicablePluginIDs);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching task order pluginIDs: ${getErrorMessage(error)}`
          });
        }
      });
  }

  getApplicableFindings(pluginIDs: string) {
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
        filters: [
          {
            id: 'repository',
            filterName: 'repository',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: [
              {
                id: this.tenableRepoId
              }
            ]
          },
          {
            id: 'pluginID',
            filterName: 'pluginID',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: pluginIDs
          }
        ],
        vulnTool: this.tenableTool
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln'
    };

    this.isLoading.set(true);

    const pluginIDList = pluginIDs.split(',').map(Number);

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(
        switchMap((data) => this.importService.getIAVInfoForPlugins(pluginIDList).pipe(map((iavData) => ({ vulnData: data, iavData })))),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching Vulnerabilities: ${getErrorMessage(error)}`
          });

          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ vulnData, iavData }) => {
          const iavInfoMap = iavData.reduce((acc: { [key: number]: IAVInfo }, item: any) => {
            acc[item.pluginID] = {
              iav: item.iav || null,
              navyComplyDate: item.navyComplyDate ? item.navyComplyDate.split('T')[0] : null,
              supersededBy: item.supersededBy || 'N/A'
            };

            return acc;
          }, {});

          this.applicableVulnerabilities.set(
            vulnData.response.results.map((vuln: any) => {
              const defaultVuln = {
                pluginID: null,
                pluginName: '',
                family: '',
                severity: '',
                vprScore: null,
                ips: [],
                acrScore: null,
                assetExposureScore: null,
                netbiosName: '',
                dnsName: '',
                macAddress: '',
                port: null,
                protocol: '',
                uuid: '',
                hostUUID: '',
                total: null,
                hostTotal: null
              };

              const poamAssociation = this.existingPoamPluginIDs[vuln.pluginID];
              const iavInfo = iavInfoMap[Number(vuln.pluginID)];

              return {
                ...defaultVuln,
                ...vuln,
                poam: !!poamAssociation,
                poamId: poamAssociation?.poamId || null,
                poamStatus: poamAssociation?.status ? poamAssociation.status : 'No Existing POAM',
                isAssociated: poamAssociation?.isAssociated || false,
                parentStatus: poamAssociation?.parentStatus,
                parentPoamId: poamAssociation?.parentPoamId,
                iav: iavInfo?.iav || '',
                navyComplyDate: iavInfo?.navyComplyDate ? parseISO(iavInfo.navyComplyDate) : null,
                supersededBy: iavInfo?.supersededBy || 'N/A',
                pluginName: vuln.name || '',
                family: vuln.family?.name || '',
                severity: vuln.severity?.name || '',
                pluginID: vuln.pluginID !== '' && vuln.pluginID != null ? Number(vuln.pluginID) : null,
                vprScore: vuln.vprScore !== '' && vuln.vprScore != null ? Number(vuln.vprScore) : null,
                total: vuln.total !== '' && vuln.total != null ? Number(vuln.total) : null,
                hostTotal: vuln.hostTotal !== '' && vuln.hostTotal != null ? Number(vuln.hostTotal) : null,
                acrScore: vuln.acrScore !== '' && vuln.acrScore != null ? Number(vuln.acrScore) : null,
                assetExposureScore: vuln.assetExposureScore !== '' && vuln.assetExposureScore != null ? Number(vuln.assetExposureScore) : null,
                port: vuln.port !== '' && vuln.port != null ? Number(vuln.port) : null,
                ...(this.currentPreset() === 'taskOrder' && { taskOrderNumber: this.taskOrderMap[vuln.pluginID] || '' })
              };
            })
          );

          this.totalRecords.set(this.applicableVulnerabilities().length);
          this.totalRecordsChange.emit(this.totalRecords());

          const table = this.table();

          if (table) {
            const currentFilters = table.filters || {};

            table.filters = { ...currentFilters, ...this.filters };
            table._filter();
          }
        }
      });
  }

  loadPoamAssociations() {
    this.poamService
      .getVulnerabilityIdsWithPoamByCollection(this.selectedCollection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (poamData) => {
          if (Array.isArray(poamData)) {
            this.existingPoamPluginIDs = createPoamAssociationsMap(poamData);
          } else {
            console.error('Unexpected POAM data format:', poamData);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error loading POAM data. Unexpected data format.',
              sticky: true
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading POAM data: ${getErrorMessage(error)}`
          });
        }
      });
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

  onRowClick(vulnerability: any, event: any) {
    event.stopPropagation();
    this.applicableVulnerabilities.set([]);
    this.filters['pluginID'] = [
      {
        value: vulnerability.pluginID,
        matchMode: 'equals',
        operator: 'and'
      }
    ];

    const table = this.table();

    if (table) {
      const currentFilters = table.filters || {};

      table.filters = { ...currentFilters, ...this.filters };
      table._filter();
    }

    this.loadVulnList();
  }

  loadVulnList() {
    this.tenableTool = 'listvuln';
    this.stashCurrentFilters();
    this.expandColumnSelections();
    this.getApplicableFindings(this.applicablePluginIDs);
  }

  loadVulnSummary() {
    this.tenableTool = 'sumid';
    this.stashCurrentFilters();
    this.resetColumnSelections();
    this.getApplicableFindings(this.applicablePluginIDs);
  }

  private stashCurrentFilters() {
    const table = this.table();

    if (table?.filters) {
      this.filters = { ...table.filters } as { [key: string]: FilterMetadata[] };
    }
  }

  onPluginIDClick(vulnerability: any, event: Event) {
    event.stopPropagation();
    this.showDetails(vulnerability);
  }

  showDetails(vulnerability: any, createPoam: boolean = false): Promise<void> {
    if (!vulnerability?.pluginID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid Plugin ID',
        sticky: true
      });

      return Promise.reject('Invalid Plugin ID');
    }

    return new Promise((resolve, reject) => {
      this.importService
        .getTenablePlugin(vulnerability.pluginID)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            if (!data?.response) {
              reject(new Error('Invalid response from getTenablePlugin'));

              return;
            }

            this.pluginData.set(data.response);
            this.processPluginData();
            this.selectedVulnerability.set(vulnerability);

            if (!createPoam) {
              this.displayDialog.set(true);
            }

            resolve();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error fetching plugin data: ${getErrorMessage(error)}`
            });
            reject(error);
          }
        });
    });
  }

  private processPluginData() {
    const pluginData = this.pluginData();

    this.formattedDescription.set(pluginData.description?.replaceAll('\n\n', '<br>') ?? '');

    if (pluginData?.xrefs?.length > 0) {
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
  }

  async onPoamIconClick(vulnerability: any, event: Event) {
    event.stopPropagation();

    try {
      const returnState = {
        filters: this.filters,
        selectedSeverities: this.selectedSeverities(),
        selectedNavyComplyDateFilter: this.selectedNavyComplyDateFilter,
        filterValue: this.filterValue,
        tenableTool: this.tenableTool,
        selectedColumns: this.selectedColumns(),
        currentPreset: this.currentPreset(),
        parentTabIndex: this.currentPreset() === 'iav' ? 2 : 3
      };

      sessionStorage.setItem('tenableFilterState', JSON.stringify(returnState));

      if (vulnerability.poam && vulnerability.poamId) {
        this.router.navigateByUrl(`/poam-processing/poam-details/${vulnerability.poamId}`);

        return;
      }

      await this.showDetails(vulnerability, true);

      if (!this.pluginData()) {
        throw new Error('Plugin data not available');
      }

      const formattedDate = vulnerability.navyComplyDate ? format(vulnerability.navyComplyDate, 'yyyy-MM-dd') : null;

      this.router.navigate(['/poam-processing/poam-details/ADDPOAM'], {
        state: {
          vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
          pluginData: this.pluginData(),
          iavNumber: vulnerability.iav,
          iavComplyByDate: formattedDate
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

  parseVprContext(vprContext: string): void {
    this.parsedVprContext.set(parseVprContext(vprContext));
  }

  parseReferences(xrefs: string): void {
    const parsed: ParsedReferences = parseReferences(xrefs);

    this.cveReferences.set(parsed.cveReferences);
    this.iavReferences.set(parsed.iavReferences);
    this.otherReferences.set(parsed.otherReferences);
  }

  getCveUrl(cve: string): string {
    return getCveUrl(cve);
  }

  getIavUrl(iavNumber: string): string {
    return getIavUrl(iavNumber);
  }

  getSeverityStyling(severity: string): SeverityStyle {
    return getSeverityStyling(severity);
  }

  onNavyComplyDateFilterChange(event: any) {
    if (event?.value) {
      const today = new Date();

      today.setHours(23, 59, 59, 999);
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (event.value) {
        case 'alloverdue':
          endDate = today;
          break;

        case 'overdue90Plus':
          endDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'overdue30To90':
          startDate = startOfDay(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
          endDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
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

        case 'dueBetween714':
          startDate = startOfDay(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
          endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueBetween1430':
          startDate = startOfDay(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
          endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueBetween3090':
          startDate = startOfDay(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
          endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueWithin7':
          startDate = new Date(today.getTime());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueWithin14':
          startDate = new Date(today.getTime());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueWithin30':
          startDate = new Date(today.getTime());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;

        case 'dueWithin90':
          startDate = new Date(today.getTime());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      const filterConstraints: FilterMetadata[] = [];

      if (startDate) {
        const adjustedStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

        adjustedStartDate.setHours(23, 59, 59, 999);
        filterConstraints.push({
          value: adjustedStartDate,
          matchMode: 'dateAfter',
          operator: 'and'
        });
      }

      if (endDate) {
        filterConstraints.push({
          value: endDate,
          matchMode: 'dateBefore',
          operator: 'and'
        });
      }

      const table = this.table();

      if (table && filterConstraints.length > 0) {
        const col = this.cols().find((c) => c.field === 'navyComplyDate');

        if (col) {
          col.filterValue = startDate && endDate ? `${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}` : startDate ? `After ${format(startDate, 'MM/dd/yyyy')}` : `Before ${format(endDate!, 'MM/dd/yyyy')}`;
        }

        table.filters['navyComplyDate'] = filterConstraints;
        table._filter();
      }
    } else {
      delete this.filters['navyComplyDate'];

      const col = this.cols().find((c) => c.field === 'navyComplyDate');

      if (col) {
        col.filterValue = '';
      }

      const table = this.table();

      if (table) {
        delete table.filters['navyComplyDate'];
        table._filter();
      }
    }
  }

  clear() {
    this.table().clear();
    this.selectedSeverities.set([...DEFAULT_SEVERITIES]);
    this.filters['supersededBy'] = [{ value: 'N/A', matchMode: 'contains', operator: 'and' }];
    this.filters['severity'] = [{ value: [...DEFAULT_SEVERITIES], matchMode: 'in', operator: 'and' }];

    const table = this.table();

    if (table) {
      table.filters = { ...this.filters };
      this.totalRecords.set(this.applicableVulnerabilities().length);
      this.totalRecordsChange.emit(this.totalRecords());
    }

    this.filterValue = '';
    this.selectedNavyComplyDateFilter = null;
    this.loadVulnSummary();
  }

  onGlobalFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    const table = this.table();

    if (table) {
      table.filterGlobal(filterValue, 'contains');
    }
  }

  resetColumnSelections() {
    const defaultFields = ['poam', 'pluginID', 'pluginName', 'family', 'severity', 'vprScore', 'iav', 'navyComplyDate', 'supersededBy', 'total', 'hostTotal'];

    if (this.currentPreset() === 'taskOrder') {
      defaultFields.push('taskOrderNumber');
    }

    this.selectedColumns.set(this.cols().filter((col) => defaultFields.includes(col.field)));
  }

  expandColumnSelections() {
    this.selectedColumns.set(
      this.cols().filter((col) =>
        ['poam', 'pluginID', 'pluginName', 'family', 'severity', 'vprScore', 'iav', 'navyComplyDate', 'supersededBy', 'ips', 'acrScore', 'assetExposureScore', 'netbiosName', 'dnsName', 'macAddress', 'port', 'protocol', 'uuid', 'hostUUID'].includes(
          col.field
        )
      )
    );
  }

  onFilter(_event: any) {
    const table = this.table();

    if (table) {
      const filteredValue = table.filteredValue ?? this.applicableVulnerabilities();

      this.totalRecords.set(filteredValue.length);
      this.totalRecordsChange.emit(this.totalRecords());

      const severityFilter: any = table.filters['severity']?.[0];

      if (severityFilter) {
        this.selectedSeverities.set(Array.isArray(severityFilter.value) ? severityFilter.value : []);
      }
    }
  }

  toggleNavyComplyFilter() {
    const select = this.select();

    if (select.overlayVisible()) {
      select.hide();
    } else {
      select.show();
    }
  }

  toggleAddColumnOverlay() {
    const columnSelect = this.columnSelect();

    if (columnSelect.overlayVisible()) {
      columnSelect.hide();
    } else {
      columnSelect.show();
    }
  }
}
