/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SharedService } from '../../../../../common/services/shared.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { ImportService } from '../../../../import-processing/import.service';
import { PoamService } from '../../../poams.service';

interface DisplayVulnerability {
  associatedVulnerability: string;
  severity: string;
  severityCategory: string;
  titleText: string;
  tagSeverity: 'danger' | 'warn' | 'info' | 'secondary';
  isNew: boolean;
  selectedVulnerabilities?: string[];
}

interface AutocompleteSuggestion {
  vulnId: string;
  titleText: string;
}

@Component({
  selector: 'cpat-poam-associated-vulnerabilities',
  templateUrl: './poam-associated-vulnerabilities.component.html',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, TagModule, ToastModule, TooltipModule, AutoCompleteModule],
  styles: [
    `
      :host ::ng-deep .p-datatable {
        overflow: visible;
      }

      :host ::ng-deep .p-datatable-table-container {
        overflow: visible !important;
      }

      :host ::ng-deep .p-datatable-table {
        overflow: visible;
      }
    `
  ]
})
export class PoamAssociatedVulnerabilitiesComponent implements OnInit, OnChanges {
  private importService = inject(ImportService);
  private messageService = inject(MessageService);
  poamService = inject(PoamService);
  sharedService = inject(SharedService);

  @Input() poamId: any;
  @Input() accessLevel: number;
  @Input() currentCollection: any;
  @Input() poamAssociatedVulnerabilities: any[] = [];
  readonly vulnerabilitiesChanged = output<string[]>();
  private vulnTitleMap = new Map<string, string>();
  private vulnSeverityMap = new Map<string, string>();

  private readonly severityToCategoryMap: Record<string, string> = {
    critical: 'CAT I - Critical',
    high: 'CAT I - High',
    medium: 'CAT II - Medium',
    low: 'CAT III - Low',
    informational: 'CAT III - Informational'
  };

  displayVulnerabilities: DisplayVulnerability[] = [];
  filteredSuggestions: AutocompleteSuggestion[] = [];

  ngOnInit() {
    this.getVulnTitles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poamAssociatedVulnerabilities']) {
      this.initializeDisplayVulnerabilities();
    }
  }

  private initializeDisplayVulnerabilities(): void {
    this.displayVulnerabilities = (this.poamAssociatedVulnerabilities || [])
      .filter((vuln) => vuln)
      .map((vuln) => {
        const vulnId = typeof vuln === 'string' ? vuln : vuln.associatedVulnerability;

        if (!vulnId) return null;

        return this.createDisplayVulnerability(vulnId, false);
      })
      .filter((v): v is DisplayVulnerability => v !== null);
  }

  private createDisplayVulnerability(vulnId: string, isNew: boolean): DisplayVulnerability {
    const severity = this.vulnSeverityMap.get(vulnId) || 'unknown';
    const severityLower = severity.toLowerCase();

    return {
      associatedVulnerability: vulnId,
      severity: severity,
      severityCategory: this.severityToCategoryMap[severityLower] || 'Unknown',
      titleText: this.vulnTitleMap.get(vulnId) || '',
      tagSeverity: this.computeTagSeverity(severityLower),
      isNew: isNew,
      selectedVulnerabilities: isNew ? [] : undefined
    };
  }

  private computeTagSeverity(severity: string): 'danger' | 'warn' | 'info' | 'secondary' {
    if (severity === 'critical' || severity === 'high') return 'danger';
    if (severity === 'medium') return 'warn';
    if (severity === 'low' || severity === 'informational') return 'info';
    return 'secondary';
  }

  private refreshDisplayVulnerabilities(): void {
    for (const vuln of this.displayVulnerabilities) {
      if (!vuln.isNew) {
        const severity = this.vulnSeverityMap.get(vuln.associatedVulnerability) || 'unknown';
        const severityLower = severity.toLowerCase();

        vuln.severity = severity;
        vuln.severityCategory = this.severityToCategoryMap[severityLower] || 'Unknown';
        vuln.titleText = this.vulnTitleMap.get(vuln.associatedVulnerability) || '';
        vuln.tagSeverity = this.computeTagSeverity(severityLower);
      }
    }
  }

  getVulnTitles(): void {
    if (this.currentCollection?.collectionType === 'STIG Manager' && this.currentCollection.originCollectionId) {
      this.loadSTIGManagerData();
    } else if (this.currentCollection?.collectionType === 'Tenable' && this.currentCollection.originCollectionId) {
      this.loadTenableData();
    }
  }

  private loadSTIGManagerData(): void {
    this.sharedService.getFindingsMetricsAndRulesFromSTIGMAN(this.currentCollection.originCollectionId).subscribe({
      next: (response: any) => {
        this.vulnTitleMap.clear();
        this.vulnSeverityMap.clear();

        for (const group of response) {
          if (group.rules?.length > 0) {
            this.vulnTitleMap.set(group.groupId, group.rules[0].title);
          }
          this.vulnSeverityMap.set(group.groupId, group.severity);
        }

        this.refreshDisplayVulnerabilities();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to retrieve vulnerability titles: ${getErrorMessage(error)}`
        });
      }
    });
  }

  private loadTenableData(): void {
    const collectionId = this.currentCollection.originCollectionId;

    this.importService
      .postTenableAnalysis({
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
          vulnTool: 'sumid'
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      })
      .subscribe({
        next: (data: any) => {
          if (data.error_msg) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error in Tenable response: ${data.error_msg}`
            });
            return;
          }

          this.vulnTitleMap.clear();
          this.vulnSeverityMap.clear();

          const results = data.response?.results || [];
          for (const vuln of results) {
            this.vulnTitleMap.set(vuln.pluginID, vuln.name);
            this.vulnSeverityMap.set(vuln.pluginID, vuln.severity?.name?.toLowerCase() || 'unknown');
          }

          this.refreshDisplayVulnerabilities();
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

  search(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredSuggestions = [];

    for (const [vulnId, title] of this.vulnTitleMap) {
      if (vulnId.toLowerCase().includes(query) || title.toLowerCase().includes(query)) {
        this.filteredSuggestions.push({
          vulnId: vulnId,
          titleText: title
        });
      }
    }
  }

  handleKeydown(event: KeyboardEvent, rowData: DisplayVulnerability): void {
    if (event.key === ' ' || event.code === 'Space' || event.key === 'Enter' || event.code === 'Enter') {
      const inputElement = event.target as HTMLInputElement;
      let value = inputElement.value.trim().toUpperCase();

      if (value && rowData.selectedVulnerabilities && !rowData.selectedVulnerabilities.includes(value)) {
        rowData.selectedVulnerabilities.push(value);
        inputElement.value = '';
        event.preventDefault();
      }
    }
  }

  handlePaste(event: ClipboardEvent, rowData: DisplayVulnerability): void {
    const pastedText = event.clipboardData?.getData('text');

    if (pastedText && rowData.selectedVulnerabilities) {
      const vulnerabilityIds = pastedText
        .split(/[,\s]+/)
        .filter((id) => id.length > 0)
        .map((id) => id.toUpperCase());

      for (const id of vulnerabilityIds) {
        if (id && !rowData.selectedVulnerabilities.includes(id)) {
          rowData.selectedVulnerabilities.push(id);
        }
      }

      event.preventDefault();
    }
  }

  addAssociatedVulnerability(): void {
    const newVuln: DisplayVulnerability = {
      associatedVulnerability: '',
      severity: '',
      severityCategory: '',
      titleText: '',
      tagSeverity: 'secondary',
      isNew: true,
      selectedVulnerabilities: []
    };

    this.displayVulnerabilities = [newVuln, ...this.displayVulnerabilities];
  }

  onAssociatedVulnerabilityChange(rowData: DisplayVulnerability, rowIndex: number): void {
    if (!rowData.selectedVulnerabilities || rowData.selectedVulnerabilities.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter at least one vulnerability ID'
      });
      return;
    }

    this.poamService.getVulnerabilityIdsWithPoamByCollection(this.currentCollection.collectionId).subscribe({
      next: (response: any) => {
        const existingPoams = response;
        const newVulnerabilities = rowData.selectedVulnerabilities!.map((vulnId) => (typeof vulnId === 'string' ? vulnId.toUpperCase() : vulnId));

        for (const vulnId of newVulnerabilities) {
          const duplicatePoam = existingPoams.find((poam: any) => poam.vulnerabilityId === vulnId);

          if (duplicatePoam) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Duplicate Vulnerability',
              detail: `A POAM (ID: ${duplicatePoam.poamId}) already exists for vulnerability ID: ${vulnId}`
            });
            continue;
          }

          if (rowIndex === 0) {
            this.displayVulnerabilities.push(this.createDisplayVulnerability(vulnId, false));
          }
        }

        if (rowData.isNew) {
          this.displayVulnerabilities.splice(rowIndex, 1);
        }

        if (rowIndex === 0 && rowData.isNew) {
          this.addAssociatedVulnerability();
        }

        this.emitVulnerabilityChanges();
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

  deleteAssociatedVulnerability(_associatedVulnerability: DisplayVulnerability, rowIndex: number): void {
    this.displayVulnerabilities.splice(rowIndex, 1);
    this.emitVulnerabilityChanges();
  }

  private emitVulnerabilityChanges(): void {
    const updatedVulnerabilities = this.displayVulnerabilities.filter((item) => !item.isNew && item.associatedVulnerability).map((item) => item.associatedVulnerability);

    this.poamAssociatedVulnerabilities = updatedVulnerabilities;
    this.vulnerabilitiesChanged.emit(updatedVulnerabilities);
  }
}
