/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { AssetService } from '../assets.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { PayloadService } from '../../../common/services/setPayload.service';

@Component({
  selector: 'cpat-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    Select,
    CommonModule,
    FormsModule,
    InputTextModule,
    TableModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class AssetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() asset: any;
  @Input() assets: any;
  @Input() payload: any;
  @Output() assetchange = new EventEmitter();

  labelList: any;
  clonedLabels: { [s: string]: any } = {};
  assetLabels: any[] = [];
  data: any = [];
  selectedCollection: any;
  private subscriptions = new Subscription();
  labelOptions: any[] = [];
  displayInvalidDataDialog: boolean = false;
  invalidDataMessage: string = '';
  private subs = new SubSink();
  protected accessLevel: any;

  constructor(
    private assetService: AssetService,
    private sharedService: SharedService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private setPayloadService: PayloadService,
  ) {}

  ngOnInit(): void {
    if (!this.payload) return;

    this.setPayloadService.accessLevel$.subscribe(level => {
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
        this.sharedService.selectedCollection.subscribe(collectionId => {
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
    this.subs.sink = this.assetService.getLabels(this.selectedCollection)
      .subscribe(
        (labels: any) => {
          this.labelList = labels || [];
        }
      );
  }

  getAssetLabels() {
    if (!this.asset?.assetId) {
      console.error('Asset or assetId is not available');
      return;
    }

    this.subs.sink = this.assetService.getAssetLabels(this.asset.assetId)
      .subscribe(
        (assetLabels: any) => {
          this.assetLabels = assetLabels || [];
        },
        error => {
          console.error('Error fetching asset labels:', error);
        }
      );
  }


  transformToDropdownOptions(data: any[], labelField: string, valueField: string) {
    return (data || []).map(item => ({
      labelName: item[labelField],
      labelId: item[valueField],
    }));
  }

  addNewRow() {
    const newLabel = {
      assetId: +this.asset.assetId,
      labelId: null,
      labelName: null,
      isNew: true,
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this label?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.asset.assetId === 'ADDASSET') {
          this.assetLabels.splice(index, 1);
          this.assetLabels = [...this.assetLabels];
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Label removed',
          });
        } else if (label.labelId) {
          this.assetService.deleteAssetLabel(this.asset.assetId, label.labelId)
            .subscribe(
              () => {
                this.assetLabels.splice(index, 1);
                this.assetLabels = [...this.assetLabels];
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Label deleted successfully',
                });
              },
              (error: Error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Failed to delete label: ${error.message}`,
                });
              }
            );
        }
      },
    });
  }

  confirmLabelCreate(newLabel: any) {
    const labelName = this.getLabelName(newLabel.labelId);

    if (this.asset.assetId !== 'ADDASSET' && newLabel.labelId) {
      const assetLabel = {
        assetId: +this.asset.assetId,
        labelId: +newLabel.labelId,
        collectionId: this.selectedCollection,
      };

      this.assetService.postAssetLabel(assetLabel).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Label "${labelName}" was added`,
          });
          this.getAssetLabels();
        },
        (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to add label: ${error.message}`,
          });
        }
      );
    } else if (this.asset.assetId === 'ADDASSET' && newLabel.labelId) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Label "${labelName}" was added`,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create entry. Invalid input.',
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
      macAddress: this.asset.macAddress,
    };

    if (asset.assetId === 0) {
      this.subs.sink = this.assetService.postAsset(asset).subscribe(
        data => {
          this.assetchange.emit(data.assetId);
        },
        err => {
          this.invalidData('unexpected error adding asset');
          console.error(err);
        }
      );
    } else {
      this.subs.sink = this.assetService.updateAsset(asset).subscribe(
        data => {
          this.asset = data;
          this.assetchange.emit();
        }
      );
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
      macAddress: '',
    };
    this.assetchange.emit();
  }

  validData(): boolean {
    if (!this.asset.assetName || this.asset.assetName == undefined) {
      this.invalidData('Asset name required');
      return false;
    } else if (
      !this.asset.fullyQualifiedDomainName ||
      this.asset.fullyQualifiedDomainName == undefined
    ) {
      this.invalidData('FQDN required');
      return false;
    } else if (!this.asset.ipAddress || this.asset.ipAddress == undefined) {
      this.invalidData('IP Address is required');
      return false;
    }
    if (this.asset.assetId == 'ADDASSET') {
      const exists = this.assets.find(
        (e: { assetName: any }) => e.assetName === this.asset.assetName
      );
      if (exists) {
        this.invalidData('Asset Already Exists');
        return false;
      }
    }
    return true;
  }

  deleteAsset(asset: any) {
    this.assetService.deleteAssetsByAssetId(asset.assetId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Asset has been successfully deleted.`,
          });
          this.assetchange.emit();
        },
        error: (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to delete asset: ${error.message}`,
          });
        },
      });
  }

  invalidData(errMsg: string) {
    this.invalidDataMessage = errMsg;
    this.displayInvalidDataDialog = true;
  }

  confirm(options: { header: string; message: string; accept: () => void }) {
    this.confirmationService.confirm({
      header: options.header,
      message: options.message,
      accept: options.accept,
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
