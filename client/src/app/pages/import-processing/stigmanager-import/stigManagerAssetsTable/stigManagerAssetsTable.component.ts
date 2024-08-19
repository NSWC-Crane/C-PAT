import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { MultiSelect } from 'primeng/multiselect';
import { SharedService } from 'src/app/common/services/shared.service';
import { firstValueFrom } from 'rxjs';

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
  selector: 'stigmanager-assets-table',
  templateUrl: './stigManagerAssetsTable.component.html',
  styleUrls: ['./stigManagerAssetsTable.component.scss']
})
export class STIGManagerAssetsTableComponent implements OnInit {
  @Input() stigmanCollectionId!: string;
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
    private sharedService: SharedService,
  ) { }

  async ngOnInit() {
    this.initColumnsAndFilters();
    if (this.stigmanCollectionId) {
      await Promise.all([this.getAssets(), this.getLabels()]);
    } else {
      this.showErrorMessage('Unable to fetch STIG Manager Assets, please try again later..');
    }
  }

  initColumnsAndFilters() {
    this.cols = [
      { field: 'name', header: 'Asset Name', width: '200px', filterable: true },
      { field: 'assetId', header: 'Asset ID', width: '150px', filterable: true },
      { field: 'description', header: 'Description', width: '200px', filterable: true },
      { field: 'fqdn', header: 'FQDN', width: '200px', filterable: true },
      { field: 'ip', header: 'IP Address', width: '150px', filterable: true },
      { field: 'mac', header: 'MAC Address', width: '150px', filterable: true },
      { field: 'collectionName', header: 'Collection Name', width: '200px', filterable: true },
      { field: 'labels', header: 'Labels', width: '200px', filterable: true }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    this.resetColumnSelections();
  }

  async getAssets() {
    this.isLoading = true;
    try {
      const data = await (await this.sharedService.getAssetsFromSTIGMAN(this.stigmanCollectionId)).toPromise();
      if (!data || data.length === 0) {
        this.showErrorMessage('No assets found.');
        return;
      }
      this.assets = data.map(asset => ({
        ...asset,
        collectionName: asset.collection.name
      }));
      this.totalRecords = this.assets.length;
    } catch (err) {
      this.showErrorMessage('Failed to fetch assets. Please try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  async getLabels() {
    try {
      const labels = await firstValueFrom(await this.sharedService.getLabelsByCollectionSTIGMAN(this.stigmanCollectionId));
      this.labels = labels || [];
    } catch (err) {
      console.error('Failed to fetch labels:', err);
      this.showErrorMessage('Failed to fetch labels. Please try again later.');
      this.labels = [];
    }
  }

  getAssetLabels(asset: any): Label[] {
    return asset.labelIds?.map((labelId: string) => 
      this.labels.find(label => label.labelId === labelId)
    ).filter(Boolean) || [];
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
