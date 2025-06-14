/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { SharedService } from 'src/app/common/services/shared.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { getErrorMessage } from '../../../../common/utils/error-utils';
interface ExportColumn {
  title: string;
  dataKey: string;
}
interface Label {
  color: string;
  description: string;
  labelId: number;
  name: string;
  uses: number;
}

@Component({
  selector: 'cpat-stigmanager-assets-table',
  templateUrl: './stigManagerAssetsTable.component.html',
  styleUrls: ['./stigManagerAssetsTable.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TextareaModule,
    MultiSelectModule,
    TableModule,
    ToastModule,
    TagModule,
  ],
})
export class STIGManagerAssetsTableComponent implements OnInit {
  @Input() stigmanCollectionId!: number;
  @ViewChild('dt') table!: Table;
  @ViewChild('ms') multiSelect!: MultiSelect;

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  assets: any[] = [];
  labels: Label[] = [];
  isLoading: boolean = true;
  totalRecords: number = 0;
  filterValue: string = '';

  constructor(
    private messageService: MessageService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.initColumnsAndFilters();
    if (this.stigmanCollectionId) {
      this.loadData();
    } else {
      this.showErrorMessage('Unable to fetch STIG Manager Assets, please try again later..');
    }
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      assets: this.sharedService.getAssetsFromSTIGMAN(this.stigmanCollectionId),
      labels: this.sharedService.getLabelsByCollectionSTIGMAN(this.stigmanCollectionId)
    }).subscribe({
      next: ({ assets, labels }) => {
        if (!assets || assets.length === 0) {
          this.showErrorMessage('No assets found.');
          return;
        }

        this.assets = assets.map(asset => ({
          ...asset,
          collectionName: asset.collection.name,
        }));
        this.totalRecords = this.assets.length;

        this.labels = labels || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch data: ${getErrorMessage(error)}`
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'name', header: 'Asset Name', width: '200px', filterable: true },
      { field: 'fqdn', header: 'FQDN', width: '200px', filterable: true },
      { field: 'ip', header: 'IP Address', width: '150px', filterable: true },
      { field: 'mac', header: 'MAC Address', width: '150px', filterable: true },
      {
        field: 'collectionName',
        header: 'Collection Name',
        width: '200px',
        filterable: true,
      },
      { field: 'labels', header: 'Labels', width: '200px', filterable: true },
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.resetColumnSelections();
  }

  getAssetLabels(asset: any): Label[] {
    return (
      asset.labelIds
        ?.map((labelId: number) => this.labels.find(label => label.labelId === labelId))
        .filter(Boolean) || []
    );
  }

  showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: true,
    });
  }

  clear() {
    this.table.clear();
    this.filterValue = '';
  }

  onGlobalFilter(event: Event) {
    this.table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  resetColumnSelections() {
    this.selectedColumns = this.cols;
  }

  toggleAddColumnOverlay() {
    if (this.multiSelect.overlayVisible) {
      this.multiSelect.hide();
    } else {
      this.multiSelect.show();
    }
  }

  exportCSV() {
    this.table.exportCSV();
  }
}
