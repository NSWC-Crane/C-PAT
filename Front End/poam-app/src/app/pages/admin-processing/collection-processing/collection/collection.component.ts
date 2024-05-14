/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, EventEmitter, Input, OnDestroy, Output, TemplateRef } from '@angular/core';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { CollectionsService } from '../collections.service';

@Component({
  selector: 'cpat-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnDestroy {
  @Input() collection: any;
  @Input() collections: any;
  @Input() payload: any;
  @Input() poams: any;
  @Output() collectionchange = new EventEmitter();
  isLoading: boolean = false;
  modalWindow: NbWindowRef | undefined
  errorMessage: string = '';
  data: any = [];
  collectionUsers: any;
  deleteEvent: any;
  showLaborCategorySelect: boolean = false;
  user: any;
  private subs = new SubSink()

  constructor(private collectionService: CollectionsService,
    private dialogService: NbDialogService,
  ) { }

  attemptingDelete(dialog: TemplateRef<any>, event: any) {
    this.deleteEvent = event
    this.dialogService.open(dialog)
  }

  async onSubmit() {
    if (!this.validData()) return;

    const collection = {
      collectionId: this.collection.collectionId,
      collectionName: this.collection.collectionName,
      description: this.collection.description,
      assetCount: this.collection.assetCount,
      poamCount: this.collection.poamCount,
    };

    if (collection.collectionId == "ADDCOLLECTION") {
      delete collection.collectionId;

      this.subs.sink = (await this.collectionService.addCollection(collection)).subscribe(
        data => {
          this.collectionchange.emit('submit');
        }, () => {
          this.invalidData("Unexpected error while adding Collection.");
        }
      );
    } else {
      (await this.collectionService.updateCollection(collection)).subscribe(data => {
        this.collection = data;
        this.collectionchange.emit('submit');
      });
    }
  }

  deleteCollection() {
    this.resetData();
  }

  resetData() {
    this.collection.collectionId = "ADDCOLLECTION";
    this.collectionchange.emit('submit');
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


  validData(): boolean {
    if (!this.collection.collectionName || this.collection.collectionName == undefined) {
      this.invalidData("Collection name required");
      return false;
    }

    if (this.collection.collectionId == "ADDCOLLECTION") {
      const exists = this.collections.find((e: { collectionName: any; }) => e.collectionName === this.collection.collectionName);
      if (exists) {
        this.invalidData("Duplicate collection");
        return false;
      }
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
