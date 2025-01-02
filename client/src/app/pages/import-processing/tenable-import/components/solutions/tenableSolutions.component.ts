import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CollectionsService } from '../../../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../../import.service';
import { Table, TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../../../common/services/shared.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ToastModule } from 'primeng/toast';
interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-tenable-solutions',
  templateUrl: './tenableSolutions.component.html',
  styleUrls: ['./tenableSolutions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TableModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class TenableSolutionsComponent implements OnInit, OnDestroy {
  solutions: any[] = [];
  cols: any[];
  exportColumns!: ExportColumn[];
  affectedHosts: any[] = [];
  solutionVulnDetails: any[] = [];
  displayDialog: boolean = false;
  loadingSolutions: boolean = true;
  loadingAffectedHosts: boolean = true;
  loadingVulnDetails: boolean = true;
  filterValue: string = '';
  dialogFilterValue: string = '';
  selectedCollection: any;
  tenableRepoId: string | undefined = '';
  @ViewChild('dt') table!: Table;
  @ViewChild('dialogTable') dialogTable!: Table;
  @ViewChild('vulnDetailsTable') vulnDetailsTable!: Table;
  private subscriptions = new Subscription();

  constructor(
    private importService: ImportService,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.cols = [
      { field: 'solution', header: 'Solution' },
      { field: 'scorePctg', header: 'Risk Reduction' },
      { field: 'hostTotal', header: 'Hosts Affected' },
      { field: 'total', header: 'Vulnerabilities' },
      { field: 'vprScore', header: 'VPR' },
      { field: 'cvssV3BaseScore', header: 'CVSS v3 Base Score' },
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.subscriptions.add(
      await this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    await (
      await this.collectionService.getCollectionBasicList()
    ).subscribe({
      next: async data => {
        const selectedCollectionData = data.find(
          (collection: any) => collection.collectionId === this.selectedCollection
        );
        if (selectedCollectionData) {
          this.tenableRepoId = selectedCollectionData.originCollectionId?.toString();
          await this.getSolutions();
        } else {
          this.tenableRepoId = '';
        }
      },
      error: () => {
        this.tenableRepoId = '';
      },
    });
  }

  async getSolutions() {
    try {
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
                  id: this.tenableRepoId,
                },
              ],
            },
          ],
          sortColumn: 'scorePctg',
          sortDirection: 'desc',
        },
        sourceType: 'cumulative',
        sortField: 'scorePctg',
        sortDir: 'desc',
        type: 'vuln',
        pagination: 'false',
      };
      const solutionsObservable = await this.importService.postTenableSolutions(solutionParams);
      solutionsObservable.subscribe({
        next: (data: any) => {
          this.solutions = data.response.results.map((solution: any) => ({
            solution: solution.solution,
            scorePctg: solution.scorePctg,
            hostTotal: solution.hostTotal,
            total: solution.total,
            vprScore: solution.vprScore,
            cvssV3BaseScore: solution.cvssV3BaseScore,
            ...solution,
          }));
          this.loadingSolutions = false;
        },
        error: (error: any) => {
          console.error('Error fetching solutions:', error);
          this.showPopup('Error fetching solutions. Please try again.');
        },
      });
    } catch (error) {
      console.error('Error calling Tenable solutions service:', error);
      this.showPopup('Error calling Tenable solutions service. Please try again.');
    }
  }

  async getAffectedHosts(solution: any) {
    this.displayDialog = true;
    try {
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
                  id: this.tenableRepoId,
                },
              ],
            },
          ],
          sortColumn: 'scorePctg',
          sortDirection: 'desc',
        },
        sourceType: 'cumulative',
        sortField: 'scorePctg',
        sortDir: 'desc',
        type: 'vuln',
        pagination: 'true',
      };
      const affectedHostsObservable = await this.importService.postTenableSolutionAssets(
        solutionParams,
        solutionId
      );
      affectedHostsObservable.subscribe({
        next: (data: any) => {
          this.affectedHosts = data.response.results.map((affectedHost: any) => ({
            ip: affectedHost.ip,
            netbiosName: affectedHost.netbiosName,
            dnsName: affectedHost.dnsName,
            osCPE: affectedHost.osCPE,
            vprScore: affectedHost.vprScore,
            repository: affectedHost.repository.name,
            ...affectedHost,
          }));
          this.loadingAffectedHosts = false;
        },
        error: (error: any) => {
          console.error('Error fetching affected hosts:', error);
          this.showPopup('Error fetching affected hosts. Please try again.');
        },
      });
    } catch (error) {
      console.error('Error calling Tenable affected host service:', error);
      this.showPopup('Error calling Tenable affected host service. Please try again.');
    }
  }

  async getVulnDetails(solutionId: any) {
    try {
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
                  id: this.tenableRepoId,
                },
              ],
            },
          ],
          sortColumn: 'scorePctg',
          sortDirection: 'desc',
        },
        sourceType: 'cumulative',
        sortField: 'scorePctg',
        sortDir: 'desc',
        type: 'vuln',
        pagination: 'false',
      };
      const solutionVulnObservable = await this.importService.postTenableSolutionVuln(
        solutionVulnParams,
        solutionId
      );
      solutionVulnObservable.subscribe({
        next: (data: any) => {
          this.solutionVulnDetails = data.response.map((vuln: any) => ({
            pluginID: vuln.pluginID,
            vprScore: vuln.vprScore,
            cvssV3BaseScore: vuln.cvssV3BaseScore,
            hostTotal: vuln.hostTotal,
            ...vuln,
          }));
          this.loadingVulnDetails = false;
        },
        error: (error: any) => {
          console.error('Error fetching solution vulnerability details:', error);
          this.showPopup('Error fetching solution vulnerability details. Please try again.');
        },
      });
    } catch (error) {
      console.error('Error calling Tenable solution vulnerability details service:', error);
      this.showPopup(
        'Error calling Tenable solution vulnerability details service. Please try again.'
      );
    }
  }

  showPopup(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Alert',
      detail: message,
      sticky: true,
    });
  }

  resetData() {
    this.loadingAffectedHosts = true;
    this.loadingVulnDetails = true;
    this.affectedHosts = [];
    this.solutionVulnDetails = [];
  }

  clear() {
    this.table.clear();
    this.filterValue = '';
  }

  clearDialog() {
    this.dialogTable.clear();
    this.dialogFilterValue = '';
  }

  onGlobalFilter(event: Event) {
    this.table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onDialogFilter(event: Event) {
    this.dialogTable.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
