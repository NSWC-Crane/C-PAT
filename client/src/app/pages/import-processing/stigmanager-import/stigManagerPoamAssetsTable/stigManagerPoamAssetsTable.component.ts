import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { SharedService } from 'src/app/common/services/shared.service';
import { firstValueFrom } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';

interface ExportColumn {
  title: string;
  dataKey: string;
}

interface Label {
  color: string;
  description: string;
  labelId: string;
  name: string;
  uses: number;
}

@Component({
  selector: 'cpat-stigmanager-poam-assets-table',
  templateUrl: './stigManagerPoamAssetsTable.component.html',
  styleUrls: ['./stigManagerPoamAssetsTable.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    FormsModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    ToastModule,
    TagModule,
  ],
})
export class STIGManagerPoamAssetsTableComponent implements OnInit {
  @Input() stigmanCollectionId!: string;
  @Input() groupId!: string;
  @Input() benchmarkId: string;
  @ViewChild('dt') table!: Table;
  @ViewChild('ms') multiSelect!: MultiSelect;

  cols: any[];
  exportColumns!: ExportColumn[];
  selectedColumns: any[];
  affectedAssets: any[] = [];
  labels: Label[] = [];
  isLoading: boolean = true;
  totalRecords: number = 0;
  filterValue: string = '';

  constructor(
    private messageService: MessageService,
    private sharedService: SharedService
  ) {}

  async ngOnInit() {
    this.initColumnsAndFilters();
    if (this.stigmanCollectionId && this.groupId) {
      await Promise.all([this.getAffectedAssets(), this.getLabels()]);
    } else {
      this.showErrorMessage(
        'No vulnerability ID provided. Please enter a vulnerability ID and re-open the assets tab.'
      );
    }
  }

  initColumnsAndFilters() {
    this.cols = [
      {
        field: 'assetName',
        header: 'Asset Name',
        width: '200px',
        filterable: true,
      },
      { field: 'fqdn', header: 'FQDN', width: '200px', filterable: true },
      { field: 'ip', header: 'IP Address', width: '150px', filterable: true },
      { field: 'mac', header: 'MAC Address', width: '150px', filterable: true },
      { field: 'labels', header: 'Labels', width: '200px', filterable: true },
    ];
    this.exportColumns = this.cols.map(col => ({
      title: col.header,
      dataKey: col.field,
    }));
    this.resetColumnSelections();
  }

  async getAffectedAssets() {
    this.isLoading = true;
    try {
      const data = await firstValueFrom(
        await this.sharedService.getPOAMAssetsFromSTIGMAN(
          this.stigmanCollectionId,
          this.benchmarkId
        )
      );
      if (!data || data.length === 0) {
        this.showErrorMessage('No affected assets found.');
        return;
      }
      const matchingItem = data.find(item => item.groupId === this.groupId);
      if (!matchingItem) {
        this.showErrorMessage(`No assets found with vulnerabilityId: ${this.groupId}`);
        return;
      }
      const mappedAssets = matchingItem.assets.map((asset: { name: string; assetId: string }) => ({
        assetName: asset.name,
        assetId: asset.assetId,
      }));
      this.affectedAssets = await this.getAffectedAssetDetails(mappedAssets);
      this.totalRecords = this.affectedAssets.length;
    } catch (err) {
      this.showErrorMessage('Failed to fetch affected assets. Please try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  async getAffectedAssetDetails(mappedAssets: any[]) {
    try {
      const assetDetails = await firstValueFrom(
        await this.sharedService.getAssetDetailsFromSTIGMAN(this.stigmanCollectionId)
      );
      if (!assetDetails || assetDetails.length === 0) {
        console.error('No asset details found.');
        return mappedAssets;
      }

      return mappedAssets.map(asset => {
        const details = assetDetails.find(detail => detail.assetId === asset.assetId);
        if (!details) return asset;

        return {
          ...asset,
          ...(details.description && { description: details.description }),
          ...(details.fqdn && { fqdn: details.fqdn }),
          ...(details.ip && { ip: details.ip }),
          ...(details.labelIds && { labelIds: details.labelIds }),
          ...(details.mac && { mac: details.mac }),
          ...(details.metadata && { metadata: details.metadata }),
          ...(details.statusStats && { statusStats: details.statusStats }),
          ...(details.stigGrants && { stigGrants: details.stigGrants }),
          ...(details.stigs && { stigs: details.stigs }),
          ...(details.collection && {
            collectionId: details.collection.collectionId,
          }),
        };
      });
    } catch (err) {
      console.error('Failed to fetch asset details from STIGMAN:', err);
      this.showErrorMessage('Failed to fetch asset details. Please try again later.');
      return mappedAssets;
    }
  }

  async getLabels() {
    try {
      const labels = await firstValueFrom(
        await this.sharedService.getLabelsByCollectionSTIGMAN(this.stigmanCollectionId)
      );
      this.labels = labels || [];
    } catch (err) {
      console.error('Failed to fetch labels:', err);
      this.showErrorMessage('Failed to fetch labels. Please try again later.');
      this.labels = [];
    }
  }

  getAssetLabels(asset: any): Label[] {
    return (
      asset.labelIds
        ?.map((labelId: string) => this.labels.find(label => label.labelId === labelId))
        .filter((label: Label | undefined): label is Label => label !== undefined) || []
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
