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
import { SubSink } from 'subsink';
import { forkJoin, Observable } from 'rxjs';
import { AssetService } from '../assets.service'
import { AuthService } from '../../../auth';
import { NbAuthJWTToken, NbAuthToken } from '@nebular/auth';

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

  assetLabelsSettings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >', //'<i class="nb-plus"></i>',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i icon="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >', //<i class="nb-close"></i>',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      add: true,
      edit: false,
      delete: true,
      create: true,
    },
    columns: {
      labelId: {
        title: '*Label',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          //console.log("row: ", row);
          var label = (row.labelId != undefined && row.labelId != null) ? this.labelList.find((tl: any) => tl.labelId === row.labelId) : null;
          return (label)
            ? label.labelName
            : row.labelId;
        }
        ,
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [],
          },
        },
        filter: false
      },
    },
    hideSubHeader: false,
  };


  private subs = new SubSink()


  constructor(private dialogService: NbDialogService,
    private assetService: AssetService,
    private authService: AuthService,
    // private iconLibraries: NbIconLibraries
  ) { }

  ngOnInit(): void {
    // this.subs.sink = this.authService.onTokenChange()
    // .subscribe((token: NbAuthJWTToken) => {
    //   //if (token.isValid() && this.router.url === '/pages/collection-processing') {
    //     if (token.isValid()) {
    //     this.isLoading = true;
    //     this.payload = token.getPayload();

    //     this.data = [];
    //     this.data = this.asset;
    //     this.getData();

    //   }
    // })
        this.data = [];
        this.data = this.asset;
        this.getData();
  }

  onSubmit() {

    // console.log("Attempting to onSubmit()...");

    let asset = {
      assetId: (this.asset.assetId == "ADDASSET") ? 0 : this.asset.assetId,
      assetName: this.asset.assetName,
      description: this.asset.description,
      collectionId: this.asset.collectionId,
      fullyQualifiedDomainName: this.asset.fullyQualifiedDomainName,
      ipAddress: this.asset.ipAddress,
      macAddress: this.asset.macAddress
    }
    // console.log("this.asset: ", this.asset)

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
        //console.log("returned data: ",data)
        this.asset = data;        
        this.assetchange.emit();                       //this will hide the billet and assign-task components
      });
      
    }
  }
  ngOnChanges() {
    this.getData();
  }

  getData() {
     // console.log("payload: ", this.payload)
    if (this.payload == undefined) return;
    //console.log("HIGH  within user.getData() user: ", this.user)
    // console.log("payload: ", this.payload)
    let userName = (this.payload.userName) ? this.payload.userName : "NONE";
    this.subs.sink = forkJoin(
      this.assetService.getLabels(),
      this.assetService.getCollections(userName),      
    )
      .subscribe(([labels, collections]: any) => {
        // console.log("collections: ", collections)
        this.labelList = labels.labels;
        this.collectionList = collections.collections;
        this.assetLabels = [];
        //console.log("labelList: ", this.labelList)
        // console.log("collectionList: ", this.collectionList)

        let settings = this.assetLabelsSettings;
        settings.columns.labelId.editor.config.list = this.labelList.map((label: any) => {
          // console.log("label: ",label)
          return {
            title: label.labelName,
            value: label.labelId
          }
        });

        this.assetLabelsSettings = Object.assign({}, settings);
        this.isLoading = false;

        if (this.asset.assetId != "ADDASSET") {
          this.subs.sink = this.assetService.getAssetLabels(this.asset.assetId).subscribe((assetLabels: any) => {
            // console.log("assetLabels: ",assetLabels)
            this.assetLabels = assetLabels.assetLabels;
            this.collection = this.setCollection(this.asset.collectionId);
          })
        }
      });

  }

  setCollection(collectionId: any) {
    this.collection = null;
    //console.log("setCollection collectionId: ", collectionId)
    // console.log("setCollection collectionList: ", this.collectionList)
    let selectedData = this.collectionList.find((collections: { collectionId: any; }) => collections.collectionId === collectionId)

    this.collection = selectedData;
    this.tcollectionName= this.collection.collectionName;
  }

  confirmCreate(event: any) {
    // console.log("Attempting to confirmCreate()...");

    if (this.asset.assetId === "ADDASSET") {
      // nothing to do, when the asset is submitted, we'll push the array of label id's to so they can be
      // associated properly to the asset

      event.confirm.resolve();
      return;
    }

    if (this.asset.assetId &&
      event.newData.labelId 
    ) {

      var label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);

      // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
      if (!label_index && label_index != 0) {
        this.invalidData("Unable to resolve label");
        event.confirm.reject();
        return;
      }

      let assetLabel = {
        assetId: +this.asset.assetId,
        labelId: +event.newData.labelId
      }

      this.isLoading = true;
      this.assetService.postAssetLabel(assetLabel).subscribe(assetLabelData => {
        this.isLoading = false;
        //console.log("after postPermission, permissionData: ",permissionData)
        event.confirm.resolve();
        this.getData();
      })

    } else {
      console.log("Failed to create entry. Invalid input.");
      this.invalidData("missing data, unable to insert");
      event.confirm.reject();
    }
  }

  // confirmEdit(event: any) {
  //   //console.log("Attempting to confirmEdit()...event.newData: ",event.newData);
  //   if (this.asset.assetId &&
  //     event.newData.labelId
  //   ) {
  //     let assetLabel = this.data;

  //     var label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);


  //     // can't continue without collection data.   NOTE** collection_index my be 0, if the 1st row is selected!
  //     if (!label_index && label_index != 0) {
  //       this.invalidData("Unable to resolve label")
  //       event.confirm.reject();
  //     }

  //     let assetLabel = {
  //       userId: this.user.userId,
  //       collectionId: event.newData.collectionId,
  //       canOwn: event.newData.canOwn,
  //       canMaintain: event.newData.canMaintain,
  //       canApprove: event.newData.canApprove,
  //     }

  //     this.isLoading = true;
  //     this.assetService.updatePermission(collectionPermission).subscribe(permissionData => {
  //       //this.data = permissionData;
  //       //console.log("after updatePermission, permissionData: ",permissionData)
  //       event.confirm.resolve();
  //       this.getData();
  //     });

  //   } else {
  //     console.log("Failed to update entry. Invalid input.");
  //     this.invalidData("missing data, unable to update");
  //     event.confirm.reject();
  //   }
  // }

  confirmDelete(event: any) {
    // console.log("Attempting to confirmDelete()...event.data: ",event.data);
    if (this.asset.assetId === "ADDASSET") {
      // nothing to do, when the asset is submitted, we'll push the array of label id's to so they can be
      // associated properly to the asset

      event.confirm.resolve();
      return;
    }


    //let asset = this.data;

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
        // console.log("after deletePermission, permissionData: ",permissionData);        
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
    this.subs.unsubscribe()
  }
}

