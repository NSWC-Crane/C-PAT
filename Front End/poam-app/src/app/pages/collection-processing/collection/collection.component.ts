/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, Input, EventEmitter, Output, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CollectionsService } from '../collections.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { SubSink } from 'subsink';
//import { LocalDataSource } from 'ng2-smart-table';
import { CsvDataService } from '../../../Shared/utils/cvs-data.service'

@Component({
  selector: 'ngx-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit, OnChanges {
  @Input() collection: any;
  @Input() collections: any;
  @Input() collectionApprovers: any;
  @Input() possibleCollectionApprovers: any;
  @Input() payload: any;
  @Input() poams: any;
  @Output() collectionchange = new EventEmitter();

  modalWindow: NbWindowRef | undefined
  errorMessage: string = '';

  data: any = [];
  collectionUsers: any;

  deleteEvent: any;
  showLaborCategorySelect: boolean = false;

  collectionApproverSettings = {
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
      edit: true,
      delete: true,
      create: true,
    },
    columns: {
      userId: {
        title: '*Approver',
        type: 'html',
        editable: false,
        addable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          //console.log("row: ", row);
          var user = (row.userId != undefined && row.userId != null) ? this.collectionApprovers.find((tl: any) => tl.userId === row.userId) : null;
          return (user)
            ? user.fullName
            : +row.userId;
        }
        ,
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [{ Title: "T1", value: 1 }],
          },
        },
        filter: false
      },
      status: {
        title: 'Status',
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return row.status
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [
              { value: 'Active', title: 'Active' },
              { value: 'Inactive', title: 'Inactive' }
            ],
          },
        },
        filter: false,
      },
    },
    hideSubHeader: false,
  };

  private subs = new SubSink()

  constructor(private collectionService: CollectionsService,
    private dialogService: NbDialogService,
  ) {
  }

  attemptingDelete(dialog: TemplateRef<any>, event: any) {
    this.deleteEvent = event
    this.dialogService.open(dialog)
  }

  onSubmit() {
    //console.log("Attempting to onSubmit()...");

    if (!this.validData()) return;

    let collection = {
      collectionId: this.collection.collectionId,
      collectionName: this.collection.collectionName,
      description: this.collection.description,
      grantCount: this.collection.grantCount,
      assetCount: this.collection.assetCount,
      poamCount: this.collection.poamCount,
    }

    if (this.collection.collectionId == "ADDCOLLECTION") {
      this.collection.collectionId = "";

      //console.log("data before: ", this.data)
      this.subs.sink = this.collectionService.addCollection(collection).subscribe(
        data => {
          // this.data = data.data[0];
          //this.data = data
          this.collectionchange.emit(data.collectionId);
        }, () => {

          this.invalidData("unexpected error adding billet");
        }
      );
      // this.collectionchange.emit(this.data._id);

    } else {

      this.collectionService.updateCollection(collection).subscribe(data => {
        //console.log("returned data: ", data)
        this.collection = data;
      });
      this.collectionchange.emit();                       //this will hide the billet and assign-task components
    }
  }

  deleteCollection() {
    //console.log("Attempting to deleteCollection()...");
    this.resetData();
  }

  ngOnInit() {
    this.setApprovers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setApprovers();
  }

  setCollectionData() {

  }

  setApprovers() {

    let settings = this.collectionApproverSettings;
    let approverList: any[] = [];

    if (this.collectionApprovers) {
      this.collectionApprovers.forEach((approver: any) => {
        let listValue = {
          title: approver.fullName,
          value: approver.userId
        }
        //console.log("approver2: ", approver)
        approverList.push(listValue);

        //   console.log("approver: ",approver)
      });
    }

    settings.columns.userId.editor.config.list = approverList;

    this.collectionApproverSettings = Object.assign({}, settings);

    // console.log("SetApprovers aprovers: ", this.collectionApprovers)
  }


  resetData() {
    this.collection.collectionId = "COLLECTION";
    this.collectionchange.emit();
  }

  addCollection() {
    this.collection = [];
    this.collection.collectionId = "COLLECTION";
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;

  async confirmCreate(event: any) {
    console.log("collection confirmCreate data: ", event)

    if (this.collection.collectionId === "COLLECTION") {
      // 
      event.confirm.resolve();
      return;
    }


    if (this.collection.collectionId &&
      event.newData.userId &&
      event.newData.status
    ) {

      let approver = {
        collectionId: +this.collection.collectionId,
        userId: +event.newData.userId,
        status: event.newData.status
      }

      await this.collectionService.addCollectionAprover(approver).subscribe((res: any) => {
        console.log("Collection confirmCreate res: ", res)
        if (res.null) {
          this.invalidData("Unable to insert row, potentially a duplicate.");
          event.confirm.reject();
          return;
        } else {
          event.confirm.resolve();
        }
      })

    } else {
      console.log("Failed to create entry. Invalid input.");
      this.invalidData("missing data, unable to insert");
      event.confirm.reject();
    }
  }

  confirmEdit(event: any) {
    console.log("confirmEdit event: ", event)
    if (this.collection.colectiondId === "COLLECTION") {
      // nothing to do, when the colection is added, we'll the approvers is automatically loaded, the first time it is borughtup in edit mode after the id hasbeen assigned.
      event.confirm.resolve();
      return;
    }

    if (
      event.newData.userId &&
      event.newData.collectionId &&
      event.newData.status
    ) {

      let approver = {
        collectionId: +event.newData.collectionId,
        userId: +event.newData.userId,
        status: event.newData.status
      }

      this.collectionService.putCollectionApprover(approver).subscribe(res => {
        event.confirm.resolve();
      })

    } else {
      console.log("Failed to create entry. Invalid input.");
      this.invalidData("missing data, unable to update");
      event.confirm.reject();
    }
  }

  async confirmDelete(event: any) {
    console.log("confirmDelete event: ", event)
    //First, let's see if this user on this collection is assigned to any poams.  If they are, we can not delete
    await this.collectionService.getPoamApproversByCollectionUser(event.data.collectionId, event.data.userId).subscribe(async (res: any) => {
      if (res.poamApprovers && res.poamApprovers.length >= 1) {
        // console.log("confirmDelete res to query: ",res)
        this.invalidData("Unable to remove approver: " + event.data.fullName + ", they are an approver on an existing POAM");
        event.confirm.reject();
        return;
      } else {
        await this.collectionService.deleteCollectionApprover(event.data.collectionId, event.data.userId).subscribe((res: any) => {
          //console.log("confirmDelete res to delete: ", res)
          const index = this.collectionApprovers.findIndex(((e: any) => { e.collectionId == event.data.colectiondId && e.userId == event.data.userId }));
          if (index > -1) {
            this.collectionApprovers.splice(index, 1);
          }
          event.confirm.resolve();
        })
      }
    })
  }

  exportAll() {
    console.log("collection this.poams: ", this.poams)
    // CsvDataService.exportToCsv('test.csv', this.poams);

    var csv: string = CsvDataService.ConvertToCSV(this.poams);

    // console.log("csv: ", csv)
    // Once we are done looping, download the .csv by creating a link
    let link = document.createElement('a')
    link.id = 'download-csv'
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    link.setAttribute('download', 'POAMS-Export.csv');
    document.body.appendChild(link)
    let myDoc = document.querySelector!('#download-csv') as HTMLElement;
    if (myDoc) myDoc.click()
  }

  validData(): boolean {
    if (!this.collection.collectionName || this.collection.collectionName == undefined) {
      this.invalidData("Collection name required");
      return false;
    }

    if (this.collection.collectionId == "ADDCOLLECTION") {  // need to make sure this is not a duplicate
      let exists = this.collections.find((e: { collectionName: any; }) => e.collectionName === this.collection.collectionName);
      if (exists) {
        this.invalidData("Duplicate collection number");
        return false;
      }
    }

    if (this.collection.grantCount < 0 || this.collection.grantCount == undefined) {
      this.invalidData("Grant Count must be defined and >= 0");
      return false;
    }

    return true;
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

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
