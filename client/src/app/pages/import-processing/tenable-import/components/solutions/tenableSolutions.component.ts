import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ConfirmationDialogOptions } from '../../../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { ImportService } from '../../../import.service';
import { Table } from 'primeng/table';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'tenable-solutions',
  templateUrl: './tenableSolutions.component.html',
  styleUrls: ['./tenableSolutions.component.scss']
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
  @ViewChild('dt') table!: Table;
  @ViewChild('dialogTable') dialogTable!: Table;
  @ViewChild('vulnDetailsTable') vulnDetailsTable!: Table;

  constructor(
    private importService: ImportService
  ) { }

  async ngOnInit() {
    this.cols = [
      { field: 'solution', header: 'Solution' },
      { field: 'scorePctg', header: 'Risk Reduction' },
      { field: 'hostTotal', header: 'Hosts Affected' },
      { field: 'total', header: 'Vulnerabilities' },
      { field: 'vprScore', header: 'VPR' },
      { field: 'cvssV3BaseScore', header: 'CVSS v3 Base Score' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    await this.getSolutions();
  }

  async getSolutions() {
    try {
      const solutionParams = {
        "query":
        {
          "type": "vuln",
          "tool": "sumremediation",
          "sourceType": "cumulative",
          "startOffset": 0,
          "endOffset": 1000,
          "filters": [],
          "sortColumn": "scorePctg",
          "sortDirection": "desc"
        },
        "sourceType": "cumulative",
        "sortField": "scorePctg",
        "sortDir": "desc",
        "type": "vuln",
        "pagination": "false"
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
            ...solution
          }));
          this.loadingSolutions = false;
        },
        error: (error: any) => {
          console.error('Error fetching solutions:', error);
          this.showPopup('Error fetching solutions. Please try again.');
        }
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
        "query": {
          "type": "vuln",
          "tool": "sumip",
          "sourceType": "cumulative",
          "startOffset": 0,
          "endOffset": 3000,
          "filters": [],
          "sortColumn": "scorePctg",
          "sortDirection": "desc"
        },
        "sourceType": "cumulative",
        "sortField": "scorePctg",
        "sortDir": "desc",
        "type": "vuln",
        "pagination": "true"
      };
      const affectedHostsObservable = await this.importService.postTenableSolutionAssets(solutionParams, solutionId);
      affectedHostsObservable.subscribe({
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
          console.error('Error fetching affected hosts:', error);
          this.showPopup('Error fetching affected hosts. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error calling Tenable affected host service:', error);
      this.showPopup('Error calling Tenable affected host service. Please try again.');
    }
  }

  async getVulnDetails(solutionId: any) {
    try {
      const solutionVulnParams = {
        "query": {
          "type": "vuln",
          "tool": "sumid",
          "sourceType": "cumulative",
          "startOffset": 0,
          "endOffset": 3000,
          "filters": [],
          "sortColumn": "scorePctg",
          "sortDirection": "desc"
        },
        "sourceType": "cumulative",
        "sortField": "scorePctg",
        "sortDir": "desc",
        "type": "vuln",
        "pagination": "false"
      };
      const solutionVulnObservable = await this.importService.postTenableSolutionVuln(solutionVulnParams, solutionId);
      solutionVulnObservable.subscribe({
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
          console.error('Error fetching solution vulnerability details:', error);
          this.showPopup('Error fetching solution vulnerability details. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error calling Tenable solution vulnerability details service:', error);
      this.showPopup('Error calling Tenable solution vulnerability details service. Please try again.');
    }
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false'
    };
  }

  ngOnDestroy() {
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
}
