/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, catchError, map, of } from 'rxjs';
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
  imports: [CommonModule, FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, ProgressSpinnerModule, TableModule, TooltipModule, TenableHostDialogComponent]
})
export class TenableHighRiskAssetsTableComponent implements OnChanges, OnDestroy {
  private importService = inject(ImportService);

  @Input({ required: true }) tenableRepoId!: number;
  readonly highRiskAssetTable = viewChild.required<Table>('highRiskAssetTable');
  highRiskAssets = signal<HighRiskAsset[]>([]);
  highRiskAssetsTotalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  selectedHost = signal<any>(null);
  displayDialog = signal<boolean>(false);
  filterValue: string = '';

  private subscriptions = new Subscription();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenableRepoId'] && this.tenableRepoId) {
      this.loadHighRiskAssets();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
          this.createRepositoryFilter(this.tenableRepoId),
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

    const subscription = this.importService
      .postTenableAnalysis(analysisParams)
      .pipe(
        map((response: any) => {
          const results = response?.response?.results || [];
          const totalRecords = parseInt(response?.response?.totalRecords) || 0;

          this.highRiskAssetsTotalRecords.set(totalRecords);

          return results.map((item: any) => {
            const low = parseInt(item.severityLow) || 0;
            const medium = parseInt(item.severityMedium) || 0;
            const high = parseInt(item.severityHigh) || 0;
            const critical = parseInt(item.severityCritical) || 0;
            const totalSeverity = medium + high + critical;

            return {
              ...item,
              ip: item.ip,
              dnsName: item.dnsName || item.netbiosName?.split('\\').pop() || item.dns || item.ip,
              score: parseInt(item.score) || 0,
              total: parseInt(item.total) || 0,
              severityInfo: parseInt(item.severityInfo) || 0,
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
        catchError(() => of([]))
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

    this.subscriptions.add(subscription);
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
