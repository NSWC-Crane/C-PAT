/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../../import.service';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-tenable-solutions',
  templateUrl: './tenableSolutions.component.html',
  styleUrls: ['./tenableSolutions.component.scss'],
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, SkeletonModule, TableModule, InputTextModule, InputIconModule, IconFieldModule, TooltipModule, ToastModule],
  providers: [MessageService]
})
export class TenableSolutionsComponent implements OnInit, OnDestroy {
  private importService = inject(ImportService);
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private messageService = inject(MessageService);

  solutions: any[] = [];
  cols: any[];
  exportColumns!: ExportColumn[];
  affectedHosts: any[] = [];
  solutionVulnDetails: any[] = [];
  displayDialog: boolean = false;
  loadingSolutions: boolean = false;
  loadingAffectedHosts: boolean = true;
  loadingVulnDetails: boolean = true;
  filterValue: string = '';
  dialogFilterValue: string = '';
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  readonly table = viewChild.required<Table>('dt');
  readonly dialogTable = viewChild.required<Table>('dialogTable');
  readonly vulnDetailsTable = viewChild.required<Table>('vulnDetailsTable');
  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadingSolutions = true;
    this.cols = [
      { field: 'solution', header: 'Solution' },
      { field: 'scorePctg', header: 'Risk Reduction' },
      { field: 'hostTotal', header: 'Hosts Affected' },
      { field: 'total', header: 'Vulnerabilities' },
      { field: 'vprScore', header: 'VPR' },
      { field: 'cvssV3BaseScore', header: 'CVSS v3 Base Score' }
    ];
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));

    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      })
    );

    this.collectionsService.getCollectionBasicList().subscribe({
      next: (data) => {
        const selectedCollectionData = data.find((collection: any) => collection.collectionId === this.selectedCollection);

        if (selectedCollectionData) {
          this.tenableRepoId = selectedCollectionData.originCollectionId?.toString();
          this.getSolutions();
        } else {
          this.tenableRepoId = '';
        }
      },
      error: () => {
        this.tenableRepoId = '';
      }
    });
  }

  getSolutions() {
    const solutionParams = {
      query: {
        type: 'vuln',
        tool: 'sumremediation',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 1000,
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
          }
        ],
        sortColumn: 'scorePctg',
        sortDirection: 'desc'
      },
      sourceType: 'cumulative',
      sortField: 'scorePctg',
      sortDir: 'desc',
      type: 'vuln',
      pagination: 'false'
    };

    this.loadingSolutions = true;
    this.importService.postTenableSolutions(solutionParams).subscribe({
      next: (data: any) => {
        this.solutions = data.response.results.map((solution: any) => ({
          solution: solution.solution,
          scorePctg: solution.scorePctg,
          hostTotal: solution.hostTotal,
          total: solution.total,
          vprScore: solution.vprScore,
          cvssV3BaseScore: solution.cvssV3BaseScore,
          ...solution
        }));
        this.loadingSolutions = false;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching solution data: ${getErrorMessage(error)}`
        });
        this.loadingSolutions = false;
      }
    });
  }

  getAffectedHosts(solution: any) {
    this.displayDialog = true;
    const solutionId = parseInt(solution.solutionID.split('-')[1], 10);

    this.getVulnDetails(solutionId);

    const solutionParams = {
      query: {
        type: 'vuln',
        tool: 'sumip',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 3000,
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
          }
        ],
        sortColumn: 'scorePctg',
        sortDirection: 'desc'
      },
      sourceType: 'cumulative',
      sortField: 'scorePctg',
      sortDir: 'desc',
      type: 'vuln',
      pagination: 'true'
    };

    this.loadingAffectedHosts = true;
    this.importService.postTenableSolutionAssets(solutionParams, solutionId).subscribe({
      next: (data: any) => {
        this.affectedHosts = data.response.results.map((affectedHost: any) => ({
          ip: affectedHost.ip,
          netbiosName: affectedHost.netbiosName,
          dnsName: affectedHost.dnsName,
          osCPE: affectedHost.osCPE,
          vprScore: affectedHost.vprScore,
          repository: affectedHost.repository.name,
          ...affectedHost
        }));
        this.loadingAffectedHosts = false;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching affected hosts: ${getErrorMessage(error)}`
        });
        this.loadingAffectedHosts = false;
      }
    });
  }

  getVulnDetails(solutionId: any) {
    const solutionVulnParams = {
      query: {
        type: 'vuln',
        tool: 'sumid',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 3000,
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
          }
        ],
        sortColumn: 'scorePctg',
        sortDirection: 'desc'
      },
      sourceType: 'cumulative',
      sortField: 'scorePctg',
      sortDir: 'desc',
      type: 'vuln',
      pagination: 'false'
    };

    this.loadingVulnDetails = true;
    this.importService.postTenableSolutionVuln(solutionVulnParams, solutionId).subscribe({
      next: (data: any) => {
        this.solutionVulnDetails = data.response.map((vuln: any) => ({
          pluginID: vuln.pluginID,
          vprScore: vuln.vprScore,
          cvssV3BaseScore: vuln.cvssV3BaseScore,
          hostTotal: vuln.hostTotal,
          ...vuln
        }));
        this.loadingVulnDetails = false;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching solution data: ${getErrorMessage(error)}`
        });
        this.loadingVulnDetails = false;
      }
    });
  }

  resetData() {
    this.loadingAffectedHosts = true;
    this.loadingVulnDetails = true;
    this.affectedHosts = [];
    this.solutionVulnDetails = [];
  }

  clear() {
    this.table().clear();
    this.filterValue = '';
  }

  clearDialog() {
    this.dialogTable().clear();
    this.dialogFilterValue = '';
  }

  onGlobalFilter(event: Event) {
    this.table().filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onDialogFilter(event: Event) {
    this.dialogTable().filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
