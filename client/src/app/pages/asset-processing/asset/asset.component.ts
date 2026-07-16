/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, output, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, DialogModule, Select, FormsModule, InputTextModule, TableModule, ToastModule]
})
export class AssetComponent implements OnInit, OnChanges, OnDestroy {
  private readonly assetService = inject(AssetService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly destroyRef = inject(DestroyRef);

  readonly asset = model<any>(undefined);
  readonly assets = input<any>(undefined);
  readonly payload = input<any>(undefined);
  readonly assetchange = output();

  readonly labelList = signal<any[]>([]);
  readonly assetLabels = signal<any[]>([]);
  readonly selectedCollection = signal<any>(undefined);
  private readonly subs = new SubSink();
  protected readonly accessLevel = signal<any>(undefined);

  ngOnInit(): void {
    if (!this.payload()) return;

    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((level) => {
      this.accessLevel.set(level);
    });

    this.getData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['asset']?.currentValue) {
      this.asset.set({ ...changes['asset'].currentValue });
    }
  }

  getData() {
    if (!this.selectedCollection()) {
      this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
        this.selectedCollection.set(collectionId);
      });
    }

    this.getLabelData();

    const asset = this.asset();

    if (asset && asset.assetId !== 'ADDASSET') {
      this.getAssetLabels();
    }
  }

  getLabelData() {
    this.subs.sink = this.assetService.getLabels(this.selectedCollection()).subscribe((labels: any) => {
      this.labelList.set(labels || []);
    });
  }

  getAssetLabels() {
    const asset = this.asset();

    if (!asset?.assetId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Asset or assetId is not available, please try again.'
      });

      return;
    }

    this.subs.sink = this.assetService.getAssetLabels(asset.assetId).subscribe(
      (assetLabels: any) => {
        this.assetLabels.set(assetLabels || []);
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
      assetId: +this.asset().assetId,
      labelId: null,
      labelName: null,
      isNew: true
    };

    this.assetLabels.update((current) => [newLabel, ...current]);
  }

  onLabelChange(label: any, rowIndex: number) {
    if (label.labelId) {
      const selectedLabel = this.labelList().find((l: any) => l.labelId === label.labelId);

      if (selectedLabel) {
        label.labelName = selectedLabel.labelName;
        label.isNew = false;
        this.confirmLabelCreate(label);
      }
    } else {
      this.assetLabels.update((current) => current.filter((_, index) => index !== rowIndex));
    }
  }

  deleteAssetLabel(label: any, index: number) {
    const asset = this.asset();

    if (asset.assetId === 'ADDASSET') {
      this.assetLabels.update((current) => current.filter((_, i) => i !== index));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Label removed'
      });
    } else if (label.labelId) {
      this.assetService.deleteAssetLabel(asset.assetId, label.labelId).subscribe(
        () => {
          this.assetLabels.update((current) => current.filter((_, i) => i !== index));
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

    const asset = this.asset();

    if (asset.assetId !== 'ADDASSET' && newLabel.labelId) {
      const assetLabel = {
        assetId: +asset.assetId,
        labelId: +newLabel.labelId,
        collectionId: this.selectedCollection()
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
    } else if (asset.assetId === 'ADDASSET' && newLabel.labelId) {
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
    const label = this.labelList().find((label: any) => label.labelId === labelId);

    return label ? label.labelName : '';
  }

  onSubmit() {
    if (!this.validData()) return;

    const assetValue = this.asset();
    const asset = {
      assetId: assetValue.assetId == 'ADDASSET' || !assetValue.assetId ? 0 : +assetValue.assetId,
      assetName: this.asset().assetName,
      description: this.asset().description,
      collectionId: this.selectedCollection(),
      fullyQualifiedDomainName: this.asset().fullyQualifiedDomainName,
      ipAddress: this.asset().ipAddress,
      macAddress: this.asset().macAddress
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
        this.asset.set(data);
        this.assetchange.emit();
      });
    }
  }

  resetData() {
    this.asset.set({
      assetId: '',
      assetName: '',
      description: '',
      fullyQualifiedDomainName: '',
      collectionId: 0,
      ipAddress: '',
      macAddress: ''
    });
    this.assetchange.emit();
  }

  validData(): boolean {
    const asset = this.asset();

    if (!asset.assetName || asset.assetName == undefined) {
      this.invalidData('Asset name required');

      return false;
    } else if (!asset.fullyQualifiedDomainName || asset.fullyQualifiedDomainName == undefined) {
      this.invalidData('FQDN required');

      return false;
    } else if (!asset.ipAddress || asset.ipAddress == undefined) {
      this.invalidData('IP Address is required');

      return false;
    }

    if (asset.assetId == 'ADDASSET') {
      const exists = this.assets().find((e: { assetName: any }) => e.assetName === this.asset().assetName);

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
  }
}
