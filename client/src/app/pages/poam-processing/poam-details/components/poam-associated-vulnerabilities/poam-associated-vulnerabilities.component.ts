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
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { MessageService } from "primeng/api";
import { PoamService } from "../../../poams.service";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: 'cpat-poam-associated-vulnerabilities',
  templateUrl: './poam-associated-vulnerabilities.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule
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

  async addAssociatedVulnerability() {
    const newAssociatedVulnerability = {
      associatedVulnerability: '',
      isNew: true,
    };

    this.displayVulnerabilities = [
      newAssociatedVulnerability,
      ...this.displayVulnerabilities,
    ];
  }

  async onAssociatedVulnerabilityChange(associatedVulnerability: any, rowIndex: number) {
    if (!associatedVulnerability.associatedVulnerability) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter a vulnerability ID'
      });
      return;
    }

    this.poamService.getPluginIDsWithPoamByCollection(this.currentCollection)
      .subscribe({
        next: async (response: any) => {
          const existingPoams = response;
          const duplicatePoam = existingPoams.find(poam => poam.vulnerabilityId === associatedVulnerability.associatedVulnerability);

          if (duplicatePoam) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Duplicate Vulnerability',
              detail: `A POAM (ID: ${duplicatePoam.poamId}) already exists for vulnerability ID: ${associatedVulnerability.associatedVulnerability}`
            });
            return;
          }

          associatedVulnerability.isNew = false;
          this.displayVulnerabilities[rowIndex] = associatedVulnerability;

          const updatedVulnerabilities = this.displayVulnerabilities
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
