/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { AutoCompleteCompleteEvent, AutoCompleteModule } from "primeng/autocomplete";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from "primeng/tooltip";
import { SharedService } from "../../../../../common/services/shared.service";
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { ImportService } from "../../../../import-processing/import.service";
import { PoamService } from "../../../poams.service";

@Component({
  selector: 'cpat-poam-associated-vulnerabilities',
  templateUrl: './poam-associated-vulnerabilities.component.html',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    AutoCompleteModule
]
})
export class PoamAssociatedVulnerabilitiesComponent implements OnInit, OnChanges {
  @Input() poamId: any;
  @Input() accessLevel: number;
  @Input() currentCollection: any;
  @Input() poamAssociatedVulnerabilities: any[] = [];
  @Output() vulnerabilitiesChanged = new EventEmitter<string[]>();

  displayVulnerabilities: any[] = [];
  newVulnerability: string = '';
  selectedVulnerabilities: string[] = [];
  vulnTitles: any;

  constructor(
    private importService: ImportService,
    private messageService: MessageService,
    public poamService: PoamService,
    public sharedService: SharedService
  ) { }

  ngOnInit() {
    this.initializeDisplayVulnerabilities();
    this.getVulnTitles();
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

  getVulnTitles() {
    if (this.currentCollection.collectionType === 'STIG Manager' && this.currentCollection.originCollectionId) {
      this.sharedService.getFindingsMetricsAndRulesFromSTIGMAN(this.currentCollection.originCollectionId)
        .subscribe({
          next: (response: any) => {
            this.vulnTitles = response.reduce((map, group) => {
              const titles = group.rules.map(rule => rule.title);
              map[group.groupId] = titles;
              return map;
            }, {});
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to retrieve vulnerability titles: ${getErrorMessage(error)}`
            });
          }
        });
    } else if (this.currentCollection.collectionType === 'Tenable' && this.currentCollection.originCollectionId) {
      const collectionId = this.currentCollection.originCollectionId;

      this.importService.postTenableAnalysis({
        query: {
          description: '',
          context: '',
          status: -1,
          createdTime: 0,
          modifiedTime: 0,
          groups: [],
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
              value: [{ id: collectionId.toString() }]
            }
          ],
          vulnTool: 'sumid',
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln',
      }).subscribe({
        next: (data: any) => {
          if (data.error_msg) {
            console.error('Error in Tenable response:', data.error_msg);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error in Tenable response: ${data.error_msg}`
            });
            return;
          }

          this.vulnTitles = (data.response?.results || []).reduce((map, vuln) => {
            map[vuln.pluginID] = [vuln.name];
            return map;
          }, {});
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error processing Tenable findings data: ${getErrorMessage(error)}`
          });
        }
      });
    }
  }

  matchVulnerabilityTitle(vulnerabilityId: string): string {
    return vulnerabilityId;
  }

  getVulnerabilityTitleText(vulnerabilityId: string): string {
    if (this.vulnTitles && this.vulnTitles[vulnerabilityId] && this.vulnTitles[vulnerabilityId].length > 0) {
      return this.vulnTitles[vulnerabilityId][0];
    }
    return '';
  }

  search(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.selectedVulnerabilities = [];

    if (this.vulnTitles) {
      Object.keys(this.vulnTitles).forEach(vulnId => {
        const title = this.getVulnerabilityTitleText(vulnId);
        if (vulnId.toLowerCase().includes(query) ||
          (title && title.toLowerCase().includes(query))) {
          this.selectedVulnerabilities.push(vulnId);
        }
      });
    }
  }

  handleKeydown(event: KeyboardEvent, rowData: any): void {
    if (event.key === ' ' || event.code === 'Space' || event.key === 'Enter' || event.code === 'Enter') {
      const inputElement = event.target as HTMLInputElement;
      let value = inputElement.value.trim();
      value = value.toUpperCase();
      if (value && !rowData.selectedVulnerabilities.includes(value)) {
        rowData.selectedVulnerabilities.push(value);
        inputElement.value = '';
        event.preventDefault();
      }
    }
  }

  handlePaste(event: ClipboardEvent, rowData: any): void {
    const pastedText = event.clipboardData?.getData('text');

    if (pastedText) {
      const vulnerabilityIds = pastedText
        .split(/[,\s]+/)
        .filter(id => id.length > 0)
        .map(id => id.toUpperCase());

      vulnerabilityIds.forEach(id => {
        if (id && !rowData.selectedVulnerabilities.includes(id)) {
          rowData.selectedVulnerabilities.push(id);
        }
      });

      event.preventDefault();
    }
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

    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.currentCollection.collectionId)
      .subscribe({
        next: async (response: any) => {
          const existingPoams = response;
          const newVulnerabilities = rowData.selectedVulnerabilities.map(vulnId =>
            typeof vulnId === 'string' ? vulnId.toUpperCase() : vulnId
          );

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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add associated vulnerability: ${getErrorMessage(error)}`
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
