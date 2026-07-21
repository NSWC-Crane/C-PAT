/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnChanges, OnInit, SimpleChanges, inject, output, signal, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TableModule, ButtonModule, TagModule, ToastModule, TooltipModule, AutoCompleteModule]
})
export class PoamAssociatedVulnerabilitiesComponent implements OnInit, OnChanges {
  private readonly importService = inject(ImportService);
  private readonly messageService = inject(MessageService);
  poamService = inject(PoamService);
  sharedService = inject(SharedService);
  private readonly destroyRef = inject(DestroyRef);

  readonly poamId = input<any>(undefined);
  readonly accessLevel = input<number>(undefined);
  readonly currentCollection = input<any>(undefined);
  readonly poamAssociatedVulnerabilities = input<any[]>([]);
  readonly vulnerabilitiesChanged = output<string[]>();
  private readonly vulnTitleMap = new Map<string, string>();
  private readonly vulnSeverityMap = new Map<string, string>();

  private readonly severityToCategoryMap: Record<string, string> = {
    critical: 'CAT I - Critical',
    high: 'CAT I - High',
    medium: 'CAT II - Medium',
    low: 'CAT III - Low',
    informational: 'CAT III - Informational'
  };

  readonly displayVulnerabilities = signal<DisplayVulnerability[]>([]);
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
    this.displayVulnerabilities.set(
      (this.poamAssociatedVulnerabilities() || [])
        .filter(Boolean)
        .map((vuln) => {
          const vulnId = typeof vuln === 'string' ? vuln : vuln.associatedVulnerability;

          if (!vulnId) return null;

          return this.createDisplayVulnerability(vulnId, false);
        })
        .filter((v): v is DisplayVulnerability => v !== null)
    );
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
    for (const vuln of this.displayVulnerabilities()) {
      if (!vuln.isNew) {
        const severity = this.vulnSeverityMap.get(vuln.associatedVulnerability) || 'unknown';
        const severityLower = severity.toLowerCase();

        vuln.severity = severity;
        vuln.severityCategory = this.severityToCategoryMap[severityLower] || 'Unknown';
        vuln.titleText = this.vulnTitleMap.get(vuln.associatedVulnerability) || '';
        vuln.tagSeverity = this.computeTagSeverity(severityLower);
      }
    }

    this.displayVulnerabilities.set([...this.displayVulnerabilities()]);
  }

  getVulnTitles(): void {
    const currentCollection = this.currentCollection();

    if (currentCollection?.collectionType === 'STIG Manager' && currentCollection.originCollectionId) {
      this.loadSTIGManagerData();
    } else if (currentCollection?.collectionType === 'Tenable' && currentCollection.originCollectionId) {
      this.loadTenableData();
    }
  }

  private loadSTIGManagerData(): void {
    this.sharedService
      .getFindingsMetricsAndRulesFromSTIGMAN(this.currentCollection().originCollectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    const collectionId = this.currentCollection().originCollectionId;

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
      .pipe(takeUntilDestroyed(this.destroyRef))
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

    this.displayVulnerabilities.set([newVuln, ...this.displayVulnerabilities()]);
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

    this.poamService
      .getVulnerabilityIdsWithPoamByCollection(this.currentCollection().collectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const existingPoams = response;
          const newVulnerabilities = rowData.selectedVulnerabilities!.map((vulnId) => (typeof vulnId === 'string' ? vulnId.toUpperCase() : vulnId));
          const updated = [...this.displayVulnerabilities()];

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
              updated.push(this.createDisplayVulnerability(vulnId, false));
            }
          }

          if (rowData.isNew) {
            updated.splice(rowIndex, 1);
          }

          this.displayVulnerabilities.set(updated);

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
    this.displayVulnerabilities.set(this.displayVulnerabilities().filter((_v, i) => i !== rowIndex));
    this.emitVulnerabilityChanges();
  }

  private emitVulnerabilityChanges(): void {
    const updatedVulnerabilities = this.displayVulnerabilities()
      .filter((item) => !item.isNew && item.associatedVulnerability)
      .map((item) => item.associatedVulnerability);

    this.vulnerabilitiesChanged.emit(updatedVulnerabilities);
  }
}
