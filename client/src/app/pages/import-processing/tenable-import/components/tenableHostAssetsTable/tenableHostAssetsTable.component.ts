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
import { Component, Input, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { ImportService } from '../../../import.service';
import { TenableHostDialogComponent } from '../tenableHostDialog/tenableHostDialog.component';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'cpat-tenable-host-assets-table',
  templateUrl: './tenableHostAssetsTable.component.html',
  styleUrls: ['./tenableHostAssetsTable.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputIconModule, IconFieldModule, MultiSelectModule, ToastModule, TooltipModule, TagModule, TenableHostDialogComponent]
})
export class TenableHostAssetsTableComponent implements OnInit, OnDestroy {
  private importService = inject(ImportService);
  private messageService = inject(MessageService);

  @Input() tenableRepoId: number;
  readonly hostAssetTable = viewChild.required<Table>('hostAssetTable');
  readonly multiSelect = viewChild.required<MultiSelect>('ms');

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  affectedAssets: any[] = [];
  isLoading: boolean = true;
  totalRecords: number = 0;
  filterValue: string = '';
  selectedHost: any;
  displayDialog: boolean = false;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.initColumnsAndFilters();
    this.getAffectedAssets();
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'name', header: 'Name', filterType: 'text' },
      { field: 'aes', header: 'AES', filterType: 'numeric' },
      { field: 'acr', header: 'ACR', filterType: 'numeric' },
      { field: 'acrLastEvaluatedTime', header: 'ACR Last Eval', filterType: 'date' },
      { field: 'ipAddress', header: 'IP Address', filterType: 'text' },
      { field: 'os', header: 'OS', filterType: 'text' },
      { field: 'systemType', header: 'System Type', filterType: 'text' },
      { field: 'netBios', header: 'Net BIOS', filterType: 'text' },
      { field: 'dns', header: 'DNS', filterType: 'text' },
      { field: 'firstSeen', header: 'First Seen', filterType: 'date' },
      { field: 'lastSeen', header: 'Last Seen', filterType: 'date' },
      { field: 'uuid', header: 'Host ID', filterType: 'text' },
      { field: 'source', header: 'Source', filterType: 'text' }
    ];

    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
    this.selectedColumns = this.cols.filter((col) => ['name', 'os', 'macAddress', 'firstSeen', 'lastSeen', 'netBios', 'dns', 'ipAddress', 'systemType', 'uuid', 'source', 'acr', 'acrLastEvaluatedTime', 'aes'].includes(col.field));
  }

  getAffectedAssets() {
    if (!this.tenableRepoId) return;

    this.isLoading = true;
    const hostParams = {
      filters: {
        and: [
          {
            property: 'repositoryHost',
            operator: 'eq',
            value: this.tenableRepoId.toString()
          },
          {
            property: 'assetCriticalityRating',
            operator: 'eq',
            value: 'all'
          },
          {
            property: 'assetExposureScore',
            operator: 'eq',
            value: 'all'
          }
        ]
      }
    };

    this.importService.postTenableHostSearch(hostParams).subscribe({
      next: (data) => {
        this.affectedAssets = data.response.map((asset: any) => {
          const formattedSystemType = asset.systemType
            ? asset.systemType
                .split(',')
                .map((type: string) =>
                  type
                    .trim()
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char: string) => char.toUpperCase())
                )
                .join(', ')
            : '';

          return {
            ...asset,
            id: asset.id || '',
            name: asset.name || '',
            os: asset.os || '',
            macAddress: asset.macAddress || '',
            netBios: asset.netBios || '',
            dns: asset.dns || '',
            ipAddress: asset.ipAddress || '',
            uuid: asset.uuid || '',
            source: asset.source?.[0]?.type || '',
            acr: asset.acr?.score || '',
            acrLastEvaluatedTime: this.formatTimestamp(asset.acr?.lastEvaluatedTime),
            aes: asset.aes?.score || '',
            lastSeen: this.formatTimestamp(asset.lastSeen),
            firstSeen: this.formatTimestamp(asset.firstSeen),
            systemType: formattedSystemType || ''
          };
        });

        this.totalRecords = data.response.totalRecords;
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching host assets: ${getErrorMessage(error)}`
        });
        this.isLoading = false;
      }
    });
  }

  formatTimestamp(timestamp: number | string | undefined): string {
    if (!timestamp || timestamp === '-1') return undefined;

    try {
      if (typeof timestamp === 'string' && timestamp.includes('/')) {
        return timestamp;
      }

      const date = new Date(Number(timestamp) * 1000);

      if (Number.isNaN(date.getTime())) {
        const dateMs = new Date(Number(timestamp));

        if (!Number.isNaN(dateMs.getTime())) {
          return format(dateMs, 'MM/dd/yyyy');
        }

        return '';
      }

      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error formatting timestamp: ${getErrorMessage(error)}`
      });

      return '';
    }
  }

  onHostNameClick(host: any, event: Event) {
    event.stopPropagation();
    this.selectedHost = host;
    this.displayDialog = true;
  }

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: true
    });
  }

  clear() {
    this.hostAssetTable().clear();
    this.filterValue = '';
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.hostAssetTable().filterGlobal(value, 'contains');
  }

  exportCSV() {
    this.hostAssetTable().exportCSV();
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols.filter((col) => ['name', 'os', 'macAddress', 'firstSeen', 'lastSeen', 'netBios', 'dns', 'ipAddress', 'systemType', 'uuid', 'source', 'acr', 'acrLastEvaluatedTime', 'aes'].includes(col.field));
  }

  toggleAddColumnOverlay() {
    const multiSelect = this.multiSelect();

    if (multiSelect.overlayVisible) {
      multiSelect.hide();
    } else {
      multiSelect.show();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
