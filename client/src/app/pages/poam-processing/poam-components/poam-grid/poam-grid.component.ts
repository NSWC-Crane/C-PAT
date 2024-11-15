/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { PoamExportService } from '../../../../common/utils/poam-export.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { Subscription } from 'rxjs';
import { CollectionsService } from '../../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../../import-processing/import.service';
import { SharedService } from '../../../../common/services/shared.service';
import { PoamService } from '../../poams.service';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

@Component({
  selector: 'cpat-poam-grid',
  templateUrl: './poam-grid.component.html',
  styleUrls: ['./poam-grid.component.scss'],
})
export class PoamGridComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('dt') table!: Table;
  @Input() poamsData!: any[];
  @Input() allColumns!: string[];
  globalFilter: string = '';
  filteredData: any[] = [];
  displayedData: any[] = [];
  batchSize = 20;
  user: any;
  cpatAffectedAssets: any;
  stigmanAffectedAssets: any;
  tenableAffectedAssets: any;
  selectedCollectionId: any;
  selectedCollection: any;
  private findingsCache: Map<string, any[]> = new Map();
  private payloadSubscription: Subscription[] = [];
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
    private router: Router,
    private setPayloadService: PayloadService,
    private collectionService: CollectionsService,
    private importService: ImportService,
    private sharedService: SharedService,
    private poamService: PoamService,
    private messageService: MessageService,
  ) {}

  async ngOnInit() {
    this.setPayload();
    setTimeout(() => {
      if (this.table) {
        this.table.filters['status'] = [{ value: 'closed', matchMode: 'notEquals'}];
      }
    });
  }

  async setPayload() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollectionId = collectionId;
      }),
    );
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poamsData']) {
      this.resetData();
      this.updateFilteredData();
      this.loadMoreData();
    }
  }

  async exportCollection() {
    this.messageService.add({
      severity: 'secondary',
      summary: 'Export Started',
      detail: 'Download will automatically start momentarily.',
    });
    const basicListData = await (
      await this.collectionService.getCollectionBasicList()
    ).toPromise();

    this.selectedCollection = basicListData?.find(
      (collection: any) =>
        collection.collectionId === this.selectedCollectionId,
    );

    const collectionId = this.selectedCollectionId;

    if (!collectionId) {
      console.error('Export collection ID is undefined');
      return;
    }

    try {
      const poams = this.poamsData;
      if (!poams || !Array.isArray(poams) || !poams.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'No Data',
          detail: 'There are no POAMs to export for this collection.',
        });
        return;
      }

      let processedPoams;

      if (this.selectedCollection.collectionOrigin === 'STIG Manager') {
        processedPoams = await this.processPoamsWithStigFindings(
          poams,
          this.selectedCollection.originCollectionId,
        );
      } else if (this.selectedCollection.collectionOrigin === 'Tenable') {
        processedPoams = await this.processPoamsWithTenableFindings(poams);
      } else {
        this.cpatAffectedAssets = await (
          await this.poamService.getPoamAssetsByCollectionId(collectionId)
        ).toPromise();

        processedPoams = poams.map((poam) => {
          const affectedDevices = this.cpatAffectedAssets
            .filter((asset: any) => asset.poamId === poam.poamId)
            .map((asset: any) => asset.assetName.toUpperCase())
            .filter(Boolean);
          return {
            ...poam,
            devicesAffected: affectedDevices.join(' '),
          };
        });
      }

      const excelData = await PoamExportService.convertToExcel(
        processedPoams,
        this.user,
        this.selectedCollection,
      );
      const excelURL = window.URL.createObjectURL(excelData);
      const exportName = this.selectedCollection.collectionName.replace(
        ' ',
        '_',
      );

      const link = document.createElement('a');
      link.id = 'download-excel';
      link.setAttribute('href', excelURL);
      link.setAttribute('download', `${exportName}_CPAT_Export.xlsx`);
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(excelURL);
    } catch (error) {
      console.error('Error exporting POAMs:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Failed to export POAMs, please try again later.',
      });
    }
  }

  async processPoamsWithTenableFindings(poams: any[]): Promise<any[]> {
    const processedPoams = [];
    const vulnerabilityIds = [...new Set(poams.map((poam) => poam.vulnerabilityId))];

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
            value: vulnerabilityIds.join(','),
          },
        ],
        vulnTool: 'listvuln',
      },
      sourceType: 'cumulative',
      columns: [],
      type: 'vuln',
    };

    const data = await (await this.importService.postTenableAnalysis(analysisParams)).toPromise();
    this.tenableAffectedAssets = data.response.results.map((asset: any) => ({
      pluginId: asset.pluginID,
      dnsName: asset.dnsName ?? '',
      netbiosName: asset.netbiosName ?? '',
    }));

    for (const poam of poams) {
      try {
        const plugin = await (await this.importService.getTenablePlugin(poam.vulnerabilityId)).toPromise();

        let controlAPs = poam.controlAPs ?? '';
        let cci = poam.cci ?? '';
        if (plugin.response?.patchPubDate && plugin.response?.patchPubDate != '') {
          controlAPs = 'SI-2.9';
          cci = '002605\n\nControl mapping is unavailable for this vulnerability so it is being mapped to SI-2.9 CCI-002605 by default.';
        } else {
          controlAPs = 'CM-6.5';
          cci = '000366\n\nControl mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default.';
        }

        const affectedDevices = this.tenableAffectedAssets
          .filter((asset: any) => asset.pluginId === poam.vulnerabilityId)
          .map((asset: any) => {
            if (asset.netbiosName) {
              const parts = asset.netbiosName.split('\\');
              if (parts.length > 1) {
                return parts[parts.length - 1];
              }
            }
            if (asset.dnsName) {
              const parts = asset.dnsName.split('.');
              if (parts.length > 0) {
                return parts[0].toUpperCase();
              }
            }
            return null;
          })
          .filter(Boolean);

        processedPoams.push({
          ...poam,
          controlAPs,
          cci,
          devicesAffected: affectedDevices.join(' '),
        });
      } catch (error) {
        console.error(`Error processing Tenable POAM ${poam.poamId}:`, error);
        processedPoams.push(poam);
      }
    }

    return processedPoams;
  }

  async processPoamsWithStigFindings(
    poams: any[],
    originCollectionId: string,
  ): Promise<any[]> {
    const processedPoams = [];

    for (const poam of poams) {
      if (poam.vulnerabilityId && poam.stigBenchmarkId) {
        try {
          let findings: any[];
          if (this.findingsCache.has(poam.stigBenchmarkId)) {
            findings = this.findingsCache.get(poam.stigBenchmarkId)!;
          } else {
            findings = await (
              await this.sharedService.getSTIGMANAffectedAssetsByPoam(
                originCollectionId,
                poam.stigBenchmarkId,
              )
            ).toPromise();
            this.findingsCache.set(poam.stigBenchmarkId, findings);
          }

          const matchingFinding = findings.find(
            (finding) => finding.groupId === poam.vulnerabilityId,
          );

          if (matchingFinding) {
            const affectedDevices = matchingFinding.assets.map(
              (asset: { name: any; assetId: any }) => asset.name,
            );
            const controlAPs = matchingFinding.ccis[0]?.apAcronym;
            const cci = matchingFinding.ccis[0]?.cci;

            processedPoams.push({
              ...poam,
              controlAPs,
              cci,
              devicesAffected: affectedDevices.join(' '),
            });
          } else {
            processedPoams.push(poam);
          }
        } catch (error) {
          console.error(
            `Error fetching affected assets for POAM ${poam.poamId}:`,
            error,
          );
          processedPoams.push(poam);
        }
      } else {
        processedPoams.push(poam);
      }
    }

    return processedPoams;
  }

  clearCache() {
    this.findingsCache.clear();
  }

  resetData() {
    this.filteredData = [];
    this.displayedData = [];
  }

  updateFilteredData() {
    this.filteredData = this.poamsData.map((poam) => ({
      lastUpdated: poam.lastUpdated
        ? new Date(poam.lastUpdated).toISOString().split('T')[0]
        : '',
      poamId: poam.poamId,
      status: poam.status,
      vulnerabilityId: poam.vulnerabilityId,
      iavmNumber: poam.iavmNumber,
      taskOrderNumber: poam.taskOrderNumber,
      source: poam.vulnerabilitySource,
      vulnerabilityTitle: poam.vulnerabilityTitle ?? '',
      adjSeverity: poam.adjSeverity,
      submitter: poam.submitterName,
      submittedDate: poam.submittedDate?.split('T')[0],
      scheduledCompletionDate: poam.scheduledCompletionDate?.split('T')[0],
      assignedTeams: poam.assignedTeams
        ? poam.assignedTeams
          .map((team: any) => team.assignedTeamName)
          .join(', ')
        : '',
      associatedVulnerabilities: poam.associatedVulnerabilities
    }));
    this.applyFilter();
  }

  loadMoreData() {
    const startIndex = this.displayedData.length;
    const endIndex = startIndex + this.batchSize;
    const newData = this.filteredData.slice(startIndex, endIndex);
    this.displayedData = [...this.displayedData, ...newData];
  }

  onScroll(event: Event) {
    const tableViewHeight = (event.target as HTMLElement).offsetHeight;
    const tableScrollHeight = (event.target as HTMLElement).scrollHeight;
    const scrollPosition =
      (event.target as HTMLElement).scrollTop + tableViewHeight;

    if (
      scrollPosition >= tableScrollHeight &&
      this.displayedData.length < this.filteredData.length
    ) {
      this.loadMoreData();
    }
  }

  managePoam(row: any) {
    const poamId = row.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  applyFilter() {
    if (!this.globalFilter) {
      this.displayedData = [...this.filteredData];
      return;
    }

    const filterValue = this.globalFilter.toLowerCase();
    this.displayedData = this.filteredData.filter((poam) =>
      Object.values(poam).some(
        (value) =>
          value && value.toString().toLowerCase().includes(filterValue),
      ),
    );
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.globalFilter = target.value;
    this.applyFilter();
  }

  clear(table: any) {
    this.table.clear();
    this.table.filters['status'] = [{ value: 'closed', matchMode: 'notEquals'}];
    this.globalFilter = '';
    this.applyFilter();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
