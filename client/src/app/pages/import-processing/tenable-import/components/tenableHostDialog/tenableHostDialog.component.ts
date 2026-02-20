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
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, first } from 'rxjs/operators';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { PoamService } from '../../../../poam-processing/poams.service';
import { ImportService } from '../../../import.service';

@Component({
  selector: 'cpat-tenable-host-dialog',
  templateUrl: './tenableHostDialog.component.html',
  styleUrls: ['./tenableHostDialog.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputIconModule, IconFieldModule, MultiSelectModule, DialogModule, ToastModule, TooltipModule, TagModule]
})
export class TenableHostDialogComponent implements OnChanges, OnDestroy {
  private importService = inject(ImportService);
  private messageService = inject(MessageService);
  private poamService = inject(PoamService);
  private sharedService = inject(SharedService);
  private router = inject(Router);

  @Input() host: any;
  @Input() tenableRepoId: number;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly hostFindingsTable = viewChild.required<Table>('hostFindingsTable');

  hostDialogCols: any[];
  hostData: any[] = [];
  isLoading = signal<boolean>(false);
  dialogFilterValue: string = '';
  selectedPoamStatuses: string[] = [];
  selectedSeverities: string[] = [];

  pluginData: any;
  selectedPlugin: any;
  pluginDetailData: any;
  displayPluginDialog = signal<boolean>(false);
  isLoadingPluginDetails = signal<boolean>(false);
  cveReferences: any[] = [];
  iavReferences: any[] = [];
  otherReferences: any[] = [];

  private existingPoamPluginIDs: any;
  private subscriptions = new Subscription();
  private dataLoaded: boolean = false;

  get hostDns(): string {
    return this.host?.dnsName || this.host?.dns || '';
  }

  get hostIp(): string {
    return this.host?.ipAddress || this.host?.ip || '';
  }

  get hostName(): string {
    return this.host?.name || this.host?.netbiosName?.split('\\').pop() || '';
  }

  constructor() {
    this.initColumns();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && !this.dataLoaded) {
      this.loadData();
    }

    if (changes['visible'] && !this.visible) {
      this.dataLoaded = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initColumns() {
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
          { label: 'Submitted', value: 'Submitted' }
        ]
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
          { label: 'Critical', value: 'Critical' }
        ]
      },
      { field: 'port', header: 'Port', filterType: 'numeric' },
      { field: 'protocol', header: 'Protocol', filterType: 'text' },
      { field: 'vprScore', header: 'VPR', filterType: 'numeric' },
      { field: 'epssScore', header: 'EPSS (%)', filterType: 'numeric' },
      { field: 'lastSeen', header: 'Last Seen', filterType: 'date' }
    ];
  }

  private loadData(): void {
    if (!this.hostDns && !this.hostIp) {
      this.showErrorMessage('DNS or IP Address is required');

      return;
    }

    this.isLoading.set(true);
    this.selectedPoamStatuses = [];
    this.selectedSeverities = [];
    this.dialogFilterValue = '';

    const analysisParams = {
      query: {
        type: 'vuln',
        tool: 'tenable_internal_vulndetails',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 10000,
        filters: [
          {
            filterName: 'repository',
            operator: '=',
            value: [{ id: this.tenableRepoId.toString() }]
          },
          {
            filterName: 'dnsName',
            operator: '=',
            value: this.hostDns
          },
          {
            filterName: 'ip',
            operator: '=',
            value: this.hostIp
          }
        ]
      },
      sortDir: 'desc',
      sortField: 'severity',
      sourceType: 'cumulative',
      type: 'vuln'
    };

    this.subscriptions.add(
      this.sharedService.selectedCollection.pipe(first()).subscribe((collectionId) => {
        const poamAssociations$ = collectionId
          ? this.poamService.getVulnerabilityIdsWithPoamByCollection(collectionId).pipe(
              catchError((error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Error loading POAM data: ${getErrorMessage(error)}`
                });

                return of([]);
              })
            )
          : of([]);

        const hostFindings$ = this.importService.postTenableAnalysis(analysisParams);

        this.subscriptions.add(
          forkJoin([poamAssociations$, hostFindings$]).subscribe({
            next: ([poamData, findingsData]) => {
              if (Array.isArray(poamData)) {
                this.existingPoamPluginIDs = poamData.reduce(
                  (
                    acc: { [key: string]: { poamId: number; status: string; isAssociated?: boolean; parentStatus?: string; parentPoamId?: number } },
                    item: { vulnerabilityId: string; status: string; poamId: number; parentPoamId?: number; parentStatus?: string }
                  ) => {
                    acc[item.vulnerabilityId] = {
                      poamId: item.poamId,
                      status: item.status,
                      isAssociated: item.status === 'Associated',
                      parentStatus: item.parentStatus,
                      parentPoamId: item.parentPoamId
                    };

                    return acc;
                  },
                  {}
                );
              }

              if (!findingsData?.response) {
                this.isLoading.set(false);
                this.showErrorMessage('Invalid response from Tenable');

                return;
              }

              this.hostData = findingsData.response.results.map((item: any) => {
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
                  isAssociated: poamAssociation?.isAssociated || false,
                  parentStatus: poamAssociation?.parentStatus,
                  parentPoamId: poamAssociation?.parentPoamId
                };
              });

              this.dataLoaded = true;
              this.isLoading.set(false);
            },
            error: (error) => {
              this.isLoading.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error fetching host findings: ${getErrorMessage(error)}`
              });
            }
          })
        );
      })
    );
  }

  onDialogHide() {
    this.visibleChange.emit(false);
  }

  onHostFindingsTableFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.hostFindingsTable().filterGlobal(value, 'contains');
  }

  clearHostFindingsTable() {
    const hostFindingsTable = this.hostFindingsTable();

    if (hostFindingsTable) {
      hostFindingsTable.clear();
    }

    this.dialogFilterValue = '';
    this.selectedPoamStatuses = [];
    this.selectedSeverities = [];
  }

  exportHostFindingsTableCSV() {
    this.hostFindingsTable().exportCSV();
  }

  onPluginIDClick(plugin: any, event: Event) {
    event.stopPropagation();
    this.isLoadingPluginDetails.set(true);
    this.showPluginDetails(plugin);
  }

  showPluginDetails(plugin: any): Promise<void> {
    if (!plugin?.pluginID) {
      this.isLoadingPluginDetails.set(false);
      this.showErrorMessage('Invalid plugin ID');

      return Promise.reject('Invalid plugin ID');
    }

    this.selectedPlugin = plugin;

    const filters = [
      {
        filterName: 'pluginID',
        id: 'pluginID',
        isPredefined: true,
        operator: '=',
        type: 'vuln',
        value: plugin.pluginID
      },
      {
        filterName: 'repository',
        id: 'repository',
        isPredefined: true,
        operator: '=',
        type: 'vuln',
        value: [{ id: this.tenableRepoId.toString() }]
      }
    ];

    if (this.hostIp) {
      filters.push({
        filterName: 'ip',
        id: 'ip',
        isPredefined: true,
        operator: '=',
        type: 'vuln',
        value: this.hostIp
      });
    }

    if (this.hostDns) {
      filters.push({
        filterName: 'dnsName',
        id: 'dnsName',
        isPredefined: true,
        operator: '=',
        type: 'vuln',
        value: this.hostDns
      });
    }

    if (plugin.port) {
      filters.push({
        filterName: 'port',
        id: 'port',
        isPredefined: true,
        operator: '=',
        type: 'vuln',
        value: plugin.port
      });
    }

    const analysisParams = {
      columns: [],
      query: {
        context: '',
        createdTime: 0,
        description: '',
        endOffset: 50,
        filters: filters,
        groups: [],
        modifiedTime: 0,
        name: '',
        sourceType: 'cumulative',
        startOffset: 0,
        status: -1,
        tool: 'vulndetails',
        type: 'vuln',
        vulnTool: 'vulndetails'
      },
      sourceType: 'cumulative',
      type: 'vuln'
    };

    return new Promise((resolve, reject) => {
      this.importService.postTenableAnalysis(analysisParams).subscribe({
        next: (data) => {
          if (!data?.response?.results?.length) {
            reject(new Error('Invalid response from postTenableAnalysis'));
            this.isLoadingPluginDetails.set(false);

            return;
          }

          const rawData = data.response.results[0];

          this.pluginDetailData = {
            ...rawData,
            firstSeen: this.formatTimestamp(rawData.firstSeen),
            lastSeen: this.formatTimestamp(rawData.lastSeen),
            pluginPubDate: this.formatTimestamp(rawData.pluginPubDate),
            pluginModDate: this.formatTimestamp(rawData.pluginModDate),
            vulnPubDate: this.formatTimestamp(rawData.vulnPubDate),
            patchPubDate: this.formatTimestamp(rawData.patchPubDate),
            seolDate: this.formatTimestamp(rawData.seolDate),
            acrLastEvaluatedTime: this.formatTimestamp(rawData.acrLastEvaluatedTime),
            family: rawData.family?.name || '',
            severity: rawData.severity?.name || ''
          };

          if (this.pluginDetailData.xref) {
            this.parseReferences(this.pluginDetailData.xref);
          } else {
            this.cveReferences = [];
            this.iavReferences = [];
            this.otherReferences = [];
          }

          this.displayPluginDialog.set(true);
          this.isLoadingPluginDetails.set(false);
          resolve();
        },
        error: (error) => {
          this.isLoadingPluginDetails.set(false);
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

  goBackToHostDialog() {
    this.displayPluginDialog.set(false);
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
          iavComplyByDate: vulnerability.navyComplyDate || null
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

  getPluginData(pluginID: string): Promise<void> {
    if (!pluginID) {
      this.showErrorMessage('Invalid plugin ID');

      return Promise.reject('Invalid plugin ID');
    }

    return new Promise((resolve, reject) => {
      this.importService.getTenablePlugin(pluginID).subscribe({
        next: (data) => {
          if (!data?.response) {
            reject(new Error('Invalid response from getTenablePlugin'));

            return;
          }

          this.pluginData = data.response;
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

  getPoamStatusColor(status: string, parentStatus?: string): string {
    const effectiveStatus = status === 'Associated' && parentStatus ? parentStatus : status;

    switch (effectiveStatus?.toLowerCase()) {
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
      default:
        return 'gray';
    }
  }

  getPoamStatusIcon(status: string, isAssociated?: boolean): string {
    if (isAssociated) {
      return 'pi pi-info-circle';
    }

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
        return 'pi pi-check-circle';
      default:
        return 'pi pi-question-circle';
    }
  }

  getPoamStatusTooltip(status: string | null, hasExistingPoam?: boolean, parentStatus?: string): string {
    if (!status && status !== '') {
      return 'No Existing POAM. Click icon to create draft POAM.';
    }

    if (hasExistingPoam && status === 'Associated') {
      const parentStatusText = parentStatus ? ` (Parent POAM Status: ${parentStatus})` : '';

      return `This vulnerability is associated with an existing POAM${parentStatusText}. Click icon to view POAM.`;
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
      default:
        return 'POAM Status Unknown. Click icon to view POAM.';
    }
  }

  parseReferences(xref: string) {
    if (!xref) {
      this.cveReferences = [];
      this.iavReferences = [];
      this.otherReferences = [];

      return;
    }

    const refs = xref.split(/,\s*/).filter(Boolean);

    this.cveReferences = [];
    this.iavReferences = [];
    this.otherReferences = [];

    refs.forEach((ref: string) => {
      const [refType, ...valueParts] = ref.split('#');
      const value = valueParts.join('#').replace(/,\s*$/, '').trim();

      if (refType && value) {
        if (refType.trim() === 'CVE') {
          this.cveReferences.push({ type: refType.trim(), value });
        } else if (['IAVA', 'IAVB', 'IAVT'].includes(refType.trim())) {
          this.iavReferences.push({ type: refType.trim(), value });
        } else {
          this.otherReferences.push({ type: refType.trim(), value });
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

  private showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
}
