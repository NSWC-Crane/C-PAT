/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { LabelService } from '../label.service';
import { Observable, Subscription } from 'rxjs';
import { NbDialogService,  NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { SubSink } from 'subsink';
import { SharedService } from '../../../Shared/shared.service';


@Component({
  selector: 'cpat-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent implements OnInit, OnDestroy {
  @Input() label: any;
  @Input() labels: any;
  @Input() payload: any;
  @Output() labelchange = new EventEmitter();

  modalWindow: NbWindowRef | undefined
  errorMessage: string = '';
  data: any= [];
  deleteEvent: any;
  showLaborCategorySelect: boolean = false;
  selectedCollection: any;
  private subscriptions = new Subscription();
  private subs = new SubSink()

  constructor(private labelService: LabelService,
    private dialogService: NbDialogService,
    private sharedService: SharedService,
    ) {
     }

  attemptingDelete(dialog: TemplateRef<any>, event: any) {
    this.deleteEvent = event
    this.dialogService.open(dialog)
  }

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
  }

  async onSubmit() {
    if (!this.validData()) return;
    const label = {
      labelId: (this.label.labelId == "ADDLABEL" || !this.label.labelId) ? 0 : this.label.labelId,
      collectionId: this.selectedCollection,
      labelName: this.label.labelName,
      description: this.label.description,
    }
    if (label.labelId === 0) {
      this.subs.sink = (await this.labelService.addLabel(this.selectedCollection, label)).subscribe(
        (data: any) => {
          this.labelchange.emit(data.labelId);
        },
        (err: any) => {
          this.invalidData("Unexpected error adding label");
          console.error(err);
        }
      );
    } else {
      this.subs.sink = (await this.labelService.updateLabel(this.selectedCollection, label)).subscribe(data => {
        this.label = data;
        this.labelchange.emit();
      });
    }
  }

  //async deleteLabel() {
  //  this.subs.sink = (await this.labelService.deleteLabel(this.selectedCollection, this.label.labelId)).subscribe((data: any) => {
  //  });
  //  this.labelchange.emit();
  //}

  resetData() {
    this.label.labelId= "";
    this.labelchange.emit();
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
    if (!this.label.labelName || this.label.labelName == undefined) {
      this.invalidData("Label name required");
      return false;
    }

    if (this.label.labelId == "ADDLABEL") {
      const exists = this.labels.find((e: { labelName: any; }) => e.labelName === this.label.labelName);
      if (exists) {
        this.invalidData("Label Already Exists");
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
    this.subscriptions.unsubscribe();
  }
}
