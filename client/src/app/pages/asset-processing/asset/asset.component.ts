/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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
import { Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { AssetService } from '../assets.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';

@Component({
  selector: 'cpat-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
})
export class AssetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() asset: any;
  @Input() assets: any;
  @Input() payload: any;
  @Output() assetchange = new EventEmitter();

  labelList: any;
  clonedLabels: { [s: string]: any } = {};
  collectionList: any;
  collection: any;
  assetLabels: any[] = [];
  data: any = [];
  tcollectionName: string = '';
  selectedCollection: any;
  private subscriptions = new Subscription();
  collectionOptions: any[] = [];
  labelOptions: any[] = [];
  displayInvalidDataDialog: boolean = false;
  invalidDataMessage: string = '';
  private subs = new SubSink();

  constructor(
    private assetService: AssetService,
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    if (this.payload === undefined) return;
    this.getData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['asset'] && changes['asset'].currentValue) {
      this.asset = { ...changes['asset'].currentValue };
    }
  }

  async getData() {
    await this.getCollectionData();
    if (!this.selectedCollection) {
      this.subscriptions.add(
        this.sharedService.selectedCollection.subscribe((collectionId) => {
          this.selectedCollection = collectionId;
        }),
      );
    }
    await this.getLabelData();
    if (this.asset && this.asset.assetId !== 'ADDASSET') {
      this.getAssetLabels();
    }
  }

  async getLabelData() {
    this.subs.sink = (
      await this.assetService.getLabels(this.selectedCollection)
    ).subscribe((labels: any) => {
      this.labelList = labels || [];
      this.labelOptions = this.transformToDropdownOptions(
        labels,
        'labelName',
        'labelId',
      );
    });
  }

  async getCollectionData() {
    this.subs.sink = (await this.collectionService.getCollections()).subscribe(
      (collections: any) => {
        this.collectionList = collections || [];
        this.collectionOptions = this.transformToDropdownOptions(
          collections,
          'collectionName',
          'collectionId',
        );
        if (this.asset.collectionId) {
          this.setCollection(this.asset.collectionId);
        }
      },
    );
  }

  async getAssetLabels() {
    if (!this.asset?.assetId) {
      console.error('Asset or assetId is not available');
      return;
    }
    this.subs.sink = (
      await this.assetService.getAssetLabels(this.asset.assetId)
    ).subscribe(
      (assetLabels: any) => {
        this.assetLabels = assetLabels || [];
      },
      (error) => {
        console.error('Error fetching asset labels:', error);
      },
    );
  }

  transformToDropdownOptions(
    data: any[],
    labelField: string,
    valueField: string,
  ) {
    return (data || []).map((item) => ({
      labelName: item[labelField],
      labelId: item[valueField],
    }));
  }

  setCollection(collectionId: any) {
    this.collection = null;
    this.tcollectionName = '';

    const selectedData = this.collectionList
      ? this.collectionList.find(
          (collection: { collectionId: any }) =>
            collection.collectionId === collectionId,
        )
      : null;

    if (selectedData) {
      this.collection = selectedData;
      this.tcollectionName = this.collection.collectionName;
    } else {
      console.error(`Collection with ID ${collectionId} not found.`);
    }
  }

  addNewRow() {
    const newLabel = {
      assetId: +this.asset.assetId,
      labelId: null,
      labelName: null,
      isNew: true,
    };
    this.assetLabels = [...this.assetLabels, newLabel];
  }

  onLabelChange(label: any, rowIndex: number) {
    if (label.labelId) {
      const selectedLabel = this.labelList.find(
        (l: any) => l.labelId === label.labelId,
      );
      if (selectedLabel) {
        label.labelName = selectedLabel.labelName;
        label.isNew = false;
        this.confirmLabelCreate(label);
      }
    } else {
      this.assetLabels.splice(rowIndex, 1);
    }
  }

  async deleteAssetLabel(label: any, index: number) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this label?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        if (this.asset.assetId === 'ADDASSET') {
          this.assetLabels.splice(index, 1);
          this.assetLabels = [...this.assetLabels];
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Label removed',
          });
        } else if (label.labelId) {
          (
            await this.assetService.deleteAssetLabel(
              this.asset.assetId,
              label.labelId,
            )
          ).subscribe(
            () => {
              this.assetLabels.splice(index, 1);
              this.assetLabels = [...this.assetLabels];
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Label deleted successfully',
              });
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete label',
              });
            },
          );
        }
      },
    });
  }

  async confirmLabelCreate(newLabel: any) {
    let labelName = this.getLabelName(newLabel.labelId);

    if (this.asset.assetId !== 'ADDASSET' && newLabel.labelId) {
      const assetLabel = {
        assetId: +this.asset.assetId,
        labelId: +newLabel.labelId,
        collectionId: this.selectedCollection,
      };

      (await this.assetService.postAssetLabel(assetLabel)).subscribe(
        async () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Label "${labelName}" was added`,
          });
          await this.getAssetLabels();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add label',
          });
        },
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
    const label = this.labelList.find(
      (label: any) => label.labelId === labelId,
    );
    return label ? label.labelName : '';
  }

  async onSubmit() {
    if (!this.validData()) return;

    const asset = {
      assetId:
        this.asset.assetId == 'ADDASSET' || !this.asset.assetId
          ? 0
          : +this.asset.assetId,
      assetName: this.asset.assetName,
      description: this.asset.description,
      collectionId: this.selectedCollection,
      fullyQualifiedDomainName: this.asset.fullyQualifiedDomainName,
      ipAddress: this.asset.ipAddress,
      macAddress: this.asset.macAddress,
    };

    if (asset.assetId === 0) {
      this.subs.sink = (await this.assetService.postAsset(asset)).subscribe(
        (data) => {
          this.assetchange.emit(data.assetId);
        },
        (err) => {
          this.invalidData('unexpected error adding asset');
          console.error(err);
        },
      );
    } else {
      this.subs.sink = (await this.assetService.updateAsset(asset)).subscribe(
        (data) => {
          this.asset = data;
          this.assetchange.emit();
        },
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
        (e: { assetName: any }) => e.assetName === this.asset.assetName,
      );
      if (exists) {
        this.invalidData('Asset Already Exists');
        return false;
      }
    }
    return true;
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
