/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssetService } from '../assets.service';

@Component({
  selector: 'cpat-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
  standalone: true,
  imports: [ButtonModule, CardModule, DialogModule, Select, FormsModule, InputTextModule, TableModule, ToastModule]
})
export class AssetComponent implements OnInit, OnChanges, OnDestroy {
  private assetService = inject(AssetService);
  private sharedService = inject(SharedService);
  private messageService = inject(MessageService);
  private setPayloadService = inject(PayloadService);

  @Input() asset: any;
  @Input() assets: any;
  @Input() payload: any;
  readonly assetchange = output();

  labelList: any;
  clonedLabels: { [s: string]: any } = {};
  assetLabels: any[] = [];
  data: any = [];
  selectedCollection: any;
  private subscriptions = new Subscription();
  labelOptions: any[] = [];
  invalidDataMessage: string = '';
  private subs = new SubSink();
  protected accessLevel: any;

  ngOnInit(): void {
    if (!this.payload) return;

    this.setPayloadService.accessLevel$.subscribe((level) => {
      this.accessLevel = level;
    });

    this.getData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['asset'] && changes['asset'].currentValue) {
      this.asset = { ...changes['asset'].currentValue };
    }
  }

  getData() {
    if (!this.selectedCollection) {
      this.subscriptions.add(
        this.sharedService.selectedCollection.subscribe((collectionId) => {
          this.selectedCollection = collectionId;
        })
      );
    }

    this.getLabelData();

    if (this.asset && this.asset.assetId !== 'ADDASSET') {
      this.getAssetLabels();
    }
  }

  getLabelData() {
    this.subs.sink = this.assetService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels || [];
    });
  }

  getAssetLabels() {
    if (!this.asset?.assetId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Asset or assetId is not available, please try again.'
      });

      return;
    }

    this.subs.sink = this.assetService.getAssetLabels(this.asset.assetId).subscribe(
      (assetLabels: any) => {
        this.assetLabels = assetLabels || [];
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching asset labels: ${getErrorMessage(error)}`
        });
      }
    );
  }

  transformToDropdownOptions(data: any[], labelField: string, valueField: string) {
    return (data || []).map((item) => ({
      labelName: item[labelField],
      labelId: item[valueField]
    }));
  }

  addNewRow() {
    const newLabel = {
      assetId: +this.asset.assetId,
      labelId: null,
      labelName: null,
      isNew: true
    };

    this.assetLabels = [newLabel, ...this.assetLabels];
  }

  onLabelChange(label: any, rowIndex: number) {
    if (label.labelId) {
      const selectedLabel = this.labelList.find((l: any) => l.labelId === label.labelId);

      if (selectedLabel) {
        label.labelName = selectedLabel.labelName;
        label.isNew = false;
        this.confirmLabelCreate(label);
      }
    } else {
      this.assetLabels.splice(rowIndex, 1);
    }
  }

  deleteAssetLabel(label: any, index: number) {
    if (this.asset.assetId === 'ADDASSET') {
      this.assetLabels.splice(index, 1);
      this.assetLabels = [...this.assetLabels];
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Label removed'
      });
    } else if (label.labelId) {
      this.assetService.deleteAssetLabel(this.asset.assetId, label.labelId).subscribe(
        () => {
          this.assetLabels.splice(index, 1);
          this.assetLabels = [...this.assetLabels];
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Label deleted successfully'
          });
        },
        (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to delete label: ${getErrorMessage(error)}`
          });
        }
      );
    }
  }

  confirmLabelCreate(newLabel: any) {
    const labelName = this.getLabelName(newLabel.labelId);

    if (this.asset.assetId !== 'ADDASSET' && newLabel.labelId) {
      const assetLabel = {
        assetId: +this.asset.assetId,
        labelId: +newLabel.labelId,
        collectionId: this.selectedCollection
      };

      this.assetService.postAssetLabel(assetLabel).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Label "${labelName}" was added`
          });
          this.getAssetLabels();
        },
        (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add label: ${getErrorMessage(error)}`
          });
        }
      );
    } else if (this.asset.assetId === 'ADDASSET' && newLabel.labelId) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Label "${labelName}" was added`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create entry. Invalid input.'
      });
    }
  }

  getLabelName(labelId: number): string {
    const label = this.labelList.find((label: any) => label.labelId === labelId);

    return label ? label.labelName : '';
  }

  onSubmit() {
    if (!this.validData()) return;

    const asset = {
      assetId: this.asset.assetId == 'ADDASSET' || !this.asset.assetId ? 0 : +this.asset.assetId,
      assetName: this.asset.assetName,
      description: this.asset.description,
      collectionId: this.selectedCollection,
      fullyQualifiedDomainName: this.asset.fullyQualifiedDomainName,
      ipAddress: this.asset.ipAddress,
      macAddress: this.asset.macAddress
    };

    if (asset.assetId === 0) {
      this.subs.sink = this.assetService.postAsset(asset).subscribe(
        (data) => {
          this.assetchange.emit(data.assetId);
        },
        (error) => {
          this.invalidData('unexpected error adding asset');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error adding asset: ${getErrorMessage(error)}`
          });
        }
      );
    } else {
      this.subs.sink = this.assetService.updateAsset(asset).subscribe((data) => {
        this.asset = data;
        this.assetchange.emit();
      });
    }
  }

  resetData() {
    this.asset = {
      assetId: '',
      assetName: '',
      description: '',
      fullyQualifiedDomainName: '',
      collectionId: 0,
      ipAddress: '',
      macAddress: ''
    };
    this.assetchange.emit();
  }

  validData(): boolean {
    if (!this.asset.assetName || this.asset.assetName == undefined) {
      this.invalidData('Asset name required');

      return false;
    } else if (!this.asset.fullyQualifiedDomainName || this.asset.fullyQualifiedDomainName == undefined) {
      this.invalidData('FQDN required');

      return false;
    } else if (!this.asset.ipAddress || this.asset.ipAddress == undefined) {
      this.invalidData('IP Address is required');

      return false;
    }

    if (this.asset.assetId == 'ADDASSET') {
      const exists = this.assets.find((e: { assetName: any }) => e.assetName === this.asset.assetName);

      if (exists) {
        this.invalidData('Asset Already Exists');

        return false;
      }
    }

    return true;
  }

  deleteAsset(asset: any) {
    this.assetService.deleteAssetsByAssetId(asset.assetId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Asset has been successfully deleted.`
        });
        this.assetchange.emit();
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to delete asset: ${getErrorMessage(error)}`
        });
      }
    });
  }

  invalidData(errMsg: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Invalid Data: ${getErrorMessage(errMsg)}`
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
