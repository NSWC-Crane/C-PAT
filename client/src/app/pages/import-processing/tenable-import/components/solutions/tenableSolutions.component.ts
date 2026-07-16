/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, DialogModule, SkeletonModule, TableModule, InputTextModule, InputIconModule, IconFieldModule, TooltipModule, ToastModule]
})
export class TenableSolutionsComponent implements OnInit {
  private readonly importService = inject(ImportService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly solutions = signal<any[]>([]);
  cols: any[];
  exportColumns!: ExportColumn[];
  readonly affectedHosts = signal<any[]>([]);
  readonly solutionVulnDetails = signal<any[]>([]);
  displayDialog: boolean = false;
  readonly loadingSolutions = signal<boolean>(false);
  readonly loadingAffectedHosts = signal<boolean>(true);
  readonly loadingVulnDetails = signal<boolean>(true);
  filterValue: string = '';
  dialogFilterValue: string = '';
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  private readonly table = viewChild.required<Table>('dt');
  private readonly dialogTable = viewChild.required<Table>('dialogTable');
  readonly vulnDetailsTable = viewChild.required<Table>('vulnDetailsTable');

  ngOnInit() {
    this.loadingSolutions.set(true);
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

    this.loadingSolutions.set(true);
    this.importService
      .postTenableSolutions(solutionParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.solutions.set(
            data.response.results.map((solution: any) => ({
              solution: solution.solution,
              scorePctg: solution.scorePctg,
              hostTotal: solution.hostTotal,
              total: solution.total,
              vprScore: solution.vprScore,
              cvssV3BaseScore: solution.cvssV3BaseScore,
              ...solution
            }))
          );
          this.loadingSolutions.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching solution data: ${getErrorMessage(error)}`
          });
          this.loadingSolutions.set(false);
        }
      });
  }

  getAffectedHosts(solution: any) {
    this.displayDialog = true;
    const solutionId = Number.parseInt(solution.solutionID.split('-')[1], 10);

    this.getVulnDetails(solutionId);

    const solutionParams = {
      query: {
        type: 'vuln',
        tool: 'sumip',
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

    this.loadingAffectedHosts.set(true);
    this.importService
      .postTenableSolutionAssets(solutionParams, solutionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.affectedHosts.set(
            data.response.results.map((affectedHost: any) => ({
              ip: affectedHost.ip,
              netbiosName: affectedHost.netbiosName,
              dnsName: affectedHost.dnsName,
              osCPE: affectedHost.osCPE,
              vprScore: affectedHost.vprScore,
              repository: affectedHost.repository.name,
              ...affectedHost
            }))
          );
          this.loadingAffectedHosts.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching affected hosts: ${getErrorMessage(error)}`
          });
          this.loadingAffectedHosts.set(false);
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

    this.loadingVulnDetails.set(true);
    this.importService
      .postTenableSolutionVuln(solutionVulnParams, solutionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.solutionVulnDetails.set(
            data.response.map((vuln: any) => ({
              pluginID: vuln.pluginID,
              vprScore: vuln.vprScore,
              cvssV3BaseScore: vuln.cvssV3BaseScore,
              hostTotal: vuln.hostTotal,
              ...vuln
            }))
          );
          this.loadingVulnDetails.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching solution data: ${getErrorMessage(error)}`
          });
          this.loadingVulnDetails.set(false);
        }
      });
  }

  resetData() {
    this.loadingAffectedHosts.set(true);
    this.loadingVulnDetails.set(true);
    this.affectedHosts.set([]);
    this.solutionVulnDetails.set([]);
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
}
