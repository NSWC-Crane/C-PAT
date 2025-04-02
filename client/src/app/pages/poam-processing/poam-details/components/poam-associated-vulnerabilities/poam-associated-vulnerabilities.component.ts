/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { MessageService } from "primeng/api";
import { PoamService } from "../../../poams.service";
import { TooltipModule } from "primeng/tooltip";
import { AutoCompleteCompleteEvent, AutoCompleteModule } from "primeng/autocomplete";

@Component({
  selector: 'cpat-poam-associated-vulnerabilities',
  templateUrl: './poam-associated-vulnerabilities.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    AutoCompleteModule
  ]
})
export class PoamAssociatedVulnerabilitiesComponent implements OnInit {
  @Input() poamId: any;
  @Input() accessLevel: number;
  @Input() currentCollection: any;
  @Input() poamAssociatedVulnerabilities: any[] = [];
  @Output() vulnerabilitiesChanged = new EventEmitter<string[]>();

  displayVulnerabilities: any[] = [];
  newVulnerability: string = '';
  selectedVulnerabilities: string[] = [];

  constructor(
    public poamService: PoamService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.initializeDisplayVulnerabilities();
  }

  ngOnChanges() {
    this.initializeDisplayVulnerabilities();
  }

  initializeDisplayVulnerabilities() {
    this.displayVulnerabilities = (this.poamAssociatedVulnerabilities || [])
      .filter(vuln => vuln)
      .map(vuln => {
        if (typeof vuln === 'string') {
          return {
            associatedVulnerability: vuln,
            isNew: false
          };
        } else if (typeof vuln === 'object' && vuln.associatedVulnerability) {
          return {
            associatedVulnerability: vuln.associatedVulnerability,
            isNew: false
          };
        }
        return vuln;
      })
      .filter(v => v !== null && v.associatedVulnerability);
  }

  search(_event: AutoCompleteCompleteEvent) {
  }

  async addAssociatedVulnerability() {
    const newAssociatedVulnerability = {
      associatedVulnerability: '',
      isNew: true,
      selectedVulnerabilities: []
    };

    this.displayVulnerabilities = [
      newAssociatedVulnerability,
      ...this.displayVulnerabilities,
    ];
  }

  async onAssociatedVulnerabilityChange(rowData: any, rowIndex: number) {
    if (!rowData.selectedVulnerabilities || rowData.selectedVulnerabilities.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter at least one vulnerability ID'
      });
      return;
    }

    this.poamService.getPluginIDsWithPoamByCollection(this.currentCollection)
      .subscribe({
        next: async (response: any) => {
          const existingPoams = response;
          const newVulnerabilities = [...rowData.selectedVulnerabilities];

          for (const vulnId of newVulnerabilities) {
            const duplicatePoam = existingPoams.find(poam => poam.vulnerabilityId === vulnId);

            if (duplicatePoam) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Vulnerability',
                detail: `A POAM (ID: ${duplicatePoam.poamId}) already exists for vulnerability ID: ${vulnId}`
              });
              continue;
            }

            if (rowIndex === 0) {
              this.displayVulnerabilities.push({
                associatedVulnerability: vulnId,
                isNew: false
              });
            }
          }

          if (rowData.isNew) {
            this.displayVulnerabilities.splice(rowIndex, 1);
          }

          if (rowIndex === 0 && rowData.isNew) {
            this.addAssociatedVulnerability();
          }

          const updatedVulnerabilities = this.displayVulnerabilities
            .filter(item => !item.isNew)
            .map(item => item.associatedVulnerability)
            .filter(vuln => vuln);

          this.poamAssociatedVulnerabilities = updatedVulnerabilities;
          this.vulnerabilitiesChanged.emit(updatedVulnerabilities);
        },
        error: (error) => {
          console.error('Error retrieving existing POAMs:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add associated vulnerability: ${error.message}`
          });
        }
      });
  }

  async deleteAssociatedVulnerability(_associatedVulnerability: any, rowIndex: number) {
    this.displayVulnerabilities.splice(rowIndex, 1);

    const updatedVulnerabilities = this.displayVulnerabilities
      .map(item => item.associatedVulnerability)
      .filter(vuln => vuln);

    this.poamAssociatedVulnerabilities = updatedVulnerabilities;
    this.vulnerabilitiesChanged.emit(updatedVulnerabilities);
  }
}
