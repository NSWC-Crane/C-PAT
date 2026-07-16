/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnChanges, SimpleChanges, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, map, of } from 'rxjs';
import { CsvExportService } from '../../../../../common/utils/csv-export.service';
import { ImportService } from '../../../import.service';
import { TenableHostDialogComponent } from '../tenableHostDialog/tenableHostDialog.component';

export interface HighRiskAsset {
  ip: string;
  dnsName: string;
  score: number;
  total: number;
  severityInfo: number;
  severityLow: number;
  severityMedium: number;
  severityHigh: number;
  severityCritical: number;
  catI: number;
  catII: number;
  catIII: number;
  lowPercent: number;
  mediumPercent: number;
  highPercent: number;
  criticalPercent: number;
}

@Component({
  selector: 'cpat-tenable-high-risk-assets-table',
  templateUrl: './tenableHighRiskAssetsTable.component.html',
  styleUrls: ['./tenableHighRiskAssetsTable.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, ProgressSpinnerModule, TableModule, TooltipModule, TenableHostDialogComponent, DecimalPipe]
})
export class TenableHighRiskAssetsTableComponent implements OnChanges {
  private readonly csvExportService = inject(CsvExportService);
  private readonly importService = inject(ImportService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tenableRepoId = input.required<number>();
  private readonly highRiskAssetTable = viewChild.required<Table>('highRiskAssetTable');
  highRiskAssets = signal<HighRiskAsset[]>([]);
  highRiskAssetsTotalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  selectedHost = signal<any>(null);
  displayDialog = signal<boolean>(false);
  filterValue: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenableRepoId'] && this.tenableRepoId()) {
      this.loadHighRiskAssets();
    }
  }

  loadHighRiskAssets(): void {
    this.isLoading.set(true);

    const analysisParams = {
      query: {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'sumip',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 10000,
        filters: [
          this.createRepositoryFilter(this.tenableRepoId()),
          {
            id: 'patchPublished',
            filterName: 'patchPublished',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: '30:all'
          },
          {
            id: 'pluginType',
            filterName: 'pluginType',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: 'active'
          },
          {
            id: 'severity',
            filterName: 'severity',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: '1,2,3,4'
          },
          {
            id: 'lastSeen',
            filterName: 'lastSeen',
            operator: '=',
            type: 'vuln',
            isPredefined: true,
            value: '0:30'
          }
        ],
        sortColumn: 'score',
        sortDirection: 'desc',
        vulnTool: 'sumip'
      },
      sourceType: 'cumulative',
      sortField: 'score',
      sortDir: 'desc',
      columns: [],
      type: 'vuln'
    };

    this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(
        map((response: any) => {
          const results = response?.response?.results || [];
          const totalRecords = Number.parseInt(response?.response?.totalRecords) || 0;

          this.highRiskAssetsTotalRecords.set(totalRecords);

          return results.map((item: any) => {
            const low = Number.parseInt(item.severityLow) || 0;
            const medium = Number.parseInt(item.severityMedium) || 0;
            const high = Number.parseInt(item.severityHigh) || 0;
            const critical = Number.parseInt(item.severityCritical) || 0;
            const totalSeverity = medium + high + critical;

            return {
              ...item,
              ip: item.ip,
              dnsName: item.dnsName || item.netbiosName?.split('\\').pop() || item.dns || item.ip,
              score: Number.parseInt(item.score) || 0,
              total: Number.parseInt(item.total) || 0,
              severityInfo: Number.parseInt(item.severityInfo) || 0,
              severityLow: low,
              severityMedium: medium,
              severityHigh: high,
              severityCritical: critical,
              catIII: low,
              catII: medium,
              catI: critical + high,
              lowPercent: totalSeverity > 0 ? (low / totalSeverity) * 100 : 0,
              mediumPercent: totalSeverity > 0 ? (medium / totalSeverity) * 100 : 0,
              highPercent: totalSeverity > 0 ? (high / totalSeverity) * 100 : 0,
              criticalPercent: totalSeverity > 0 ? (critical / totalSeverity) * 100 : 0
            };
          });
        }),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (assets) => {
          this.highRiskAssets.set(assets);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  onHostNameClick(host: any, event: Event): void {
    event.stopPropagation();
    this.selectedHost.set(host);
    this.displayDialog.set(true);
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.highRiskAssetTable().filterGlobal(value, 'contains');
  }

  clear() {
    this.highRiskAssetTable().clear();
    this.filterValue = '';
  }

  exportCSV() {
    const table = this.highRiskAssetTable();
    const rows = (table.filteredValue ?? this.highRiskAssets()) as HighRiskAsset[];

    this.csvExportService.exportToCsv(rows, {
      filename: 'tenable_high_risk_assets',
      columns: [
        { field: 'dnsName', header: 'DNS' },
        { field: 'ip', header: 'IP Address' },
        { field: 'score', header: 'Score' },
        { field: 'severityCritical', header: 'Critical' },
        { field: 'severityHigh', header: 'High' },
        { field: 'severityMedium', header: 'Medium' },
        { field: 'severityLow', header: 'Low' }
      ]
    });
  }

  private createRepositoryFilter(repoId: number) {
    return {
      id: 'repository',
      filterName: 'repository',
      operator: '=',
      type: 'vuln',
      isPredefined: true,
      value: [{ id: String(repoId) }]
    };
  }
}
