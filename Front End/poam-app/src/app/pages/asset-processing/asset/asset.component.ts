/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { Observable, Subscription } from 'rxjs';
import { AssetService } from '../assets.service'
import { AuthService } from '../../../auth';
import { Settings } from 'angular2-smart-table';
import { SmartTableSelectComponent } from '../../../Shared/components/smart-table/smart-table-select.component';
import { SharedService } from '../../../Shared/shared.service';

interface Label {
  labelId?: number;
  labelName?: string;
  description?: string;
}

interface LabelsResponse {
  labels: Label[];
}

interface Collection {
  data: any;
  collectionId?: number;
  collectionName?: string;
  description?: string;
  created?: string;
  grantCount?: number;
  assetCount?: number;
}

interface CollectionsResponse {
  collections: Collection[];
}

@Component({
  selector: 'ngx-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss']
})
export class AssetComponent implements OnInit {

  @Input() asset: any;
  @Input() assets: any;
  @Input() payload: any;
  @Output() assetchange = new EventEmitter();

  isLoading: boolean = true;
  labelList: any;
  collectionList: any;
  collection: any;
  assetLabels: any[] = [];
  data: any = [];
  tcollectionName: string = "";
  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;
  selectedCollection: any;
  private subscriptions = new Subscription();

  assetLabelsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      labelId: {
        title: 'Label',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (labelId: any, row: any) => {
          const label = this.labelList.find((label: Label) => label.labelId === labelId);
          return label ? label.labelName : 'Label not found';
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };


  private subs = new SubSink()


  constructor(private dialogService: NbDialogService,
    private assetService: AssetService,
    private router: Router,
    private sharedService: SharedService,
  ) { }

  ngOnInit(): void {
    if (this.payload === undefined) return;
    else {
      this.data = [];
      this.data = this.asset;
    }
    this.getData();
  }

  onSubmit() {
    let asset = {
      assetId: (this.asset.assetId == "ADDASSET") ? 0 : this.asset.assetId,
      assetName: this.asset.assetName,
      description: this.asset.description,
      collectionId: this.asset.collectionId,
      fullyQualifiedDomainName: this.asset.fullyQualifiedDomainName,
      ipAddress: this.asset.ipAddress,
      macAddress: this.asset.macAddress
    }

    if (this.asset.assetId == "ADDASSET") {
      this.asset.assetId = "";

      let labels: any[] = [];
      if (this.assetLabels) {
        this.assetLabels.forEach((label) => {
          labels.push({ labelId: +label.labelId })
        });
      }
      this.asset.labels = labels

      this.subs.sink = this.assetService.postAsset(asset).subscribe(
        data => {
          this.assetchange.emit(data.assetId);
      }, err => {

          this.invalidData("unexpected error adding asset");
        }
        );

    } else {
    
      this.subs.sink = this.assetService.updateAsset(asset).subscribe(data => {
        this.asset = data;        
        this.assetchange.emit();
      });
      
    }
  }
  ngOnChanges() {
    this.getData();
  }

  getData() {
    this.getCollectionData();
    if (!this.selectedCollection) {
      this.subscriptions.add(
        this.sharedService.selectedCollection.subscribe(collectionId => {
          this.selectedCollection = collectionId;
        })
      );
    }
    this.getLabelData();
    this.isLoading = false;
  
    if (this.asset.assetId !== "ADDASSET") {
      this.getAssetLabels();
    }
  }
  
  getLabelData() {
    this.subs.sink = this.assetService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels;
      this.updateLabelEditorConfig();
    });
  }
  
  getCollectionData() {
    let userName = this.payload.userName;
    this.subs.sink = this.assetService.getCollections(userName).subscribe((collections: any) => {
      this.collectionList = collections;
      if (this.asset.collectionId) {
        this.setCollection(this.asset.collectionId);
      }
    });
  }
  
  getAssetLabels() {
    this.subs.sink = this.assetService.getAssetLabels(this.asset.assetId).subscribe(
      (assetLabels: any) => {
        this.assetLabels = assetLabels;
      },
      (error) => {
        console.error('Error fetching asset labels:', error);
      }
    );
  }
  
  updateLabelEditorConfig() {
    let labelSettings = this.assetLabelsSettings;

    const labelOptionsList = [
      ...this.labelList.map((label: any) => ({
        title: label.labelName,
        value: label.labelId
      }))
    ];

    labelSettings.columns['labelId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: labelOptionsList,
      },
    };
this.assetLabelsSettings = Object.assign({}, labelSettings);
 }



  setCollection(collectionId: any) {
    this.collection = null;
    this.tcollectionName = '';

    let selectedData = this.collectionList ? this.collectionList.find((collection: { collectionId: any; }) => collection.collectionId === collectionId) : null;
  
    if (selectedData) {
      this.collection = selectedData;
      this.tcollectionName = this.collection.collectionName;
    } else {
      console.error(`Collection with ID ${collectionId} not found.`);
    }
  }
  

  confirmCreate(event: any) {

    if (this.asset.assetId === "ADDASSET") {
      event.confirm.resolve();
      return;
    }

    if (this.asset.assetId &&
      event.newData.labelId 
    ) {

      var label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);

      if (!label_index && label_index != 0) {
        this.invalidData("Unable to resolve label");
        event.confirm.reject();
        return;
      }

      let assetLabel = {
        assetId: +this.asset.assetId,
        collectionId: this.selectedCollection,
        labelId: +event.newData.labelId,
      }

      this.isLoading = true;
      this.assetService.postAssetLabel(assetLabel).subscribe(assetLabelData => {
        this.isLoading = false;
        event.confirm.resolve();
        this.getData();
      })

    } else {
      this.invalidData("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmDelete(event: any) {
    if (this.asset.assetId === "ADDASSET") {
      event.confirm.resolve();
      return;
    }

    var label_index = this.assetLabels.findIndex((data: any) => {
      if (event.data.assetId === data.assetId && event.data.labelId === data.labelId) return true;
      else return false;
    })

    if (!label_index && label_index != 0) {
      this.invalidData("Unable to resolve label assinged")
      event.confirm.reject();
    } else {;


      this.isLoading = true;
      this.assetService.deleteAssetLabel(+event.data.assetId, +event.data.labelId).subscribe(assetLabelData => {       
        event.confirm.resolve();
        this.getData();
      });

    }
  }

  resetData() {
    this.assetchange.emit();
  }

  invalidData(errMsg: string) {
    this.confirm(
      new ConfirmationDialogOptions({
        header: "Invalid Data",
        body: errMsg,
        button: {
          text: "ok",
          status: "warning",
        },
        cancelbutton: "false",
      }));
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
    this.router.navigateByUrl("/asset-processing");
  }
}

