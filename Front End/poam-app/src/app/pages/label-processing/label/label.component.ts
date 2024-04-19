/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, Input, EventEmitter, Output } from '@angular/core';
import { LabelService } from '../label.service';
import { Observable, Subscription } from 'rxjs';
import { NbDialogService,  NbWindowRef } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { SubSink } from 'subsink';
import { SharedService } from '../../../Shared/shared.service';


@Component({
  selector: 'cpat-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent implements OnInit {
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
    private router: Router,
    private authService: AuthService,
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

  onSubmit() {

    if (!this.validData()) return;

    let label = {
      labelId: (this.label.labelId == "ADDLABEL") ? 0 : this.label.labelId,
      collectionId: this.selectedCollection,
      labelName: this.label.labelName,
      description: this.label.description,
    }

    if (this.label.labelId == "ADDLABEL") {
      this.label.labelId = "";

      this.subs.sink = this.labelService.addLabel(this.selectedCollection, label).subscribe(
        data => {
          this.labelchange.emit(data.labelId);
        }, err => {

          this.invalidData("unexpected error adding label");
        }
      );

    } else {

      this.subs.sink = this.labelService.updateLabel(this.selectedCollection, label).subscribe(data => {
        this.label = data;
        this.labelchange.emit();
      });

    }
  }

  deleteLabel() {
    //Temporarily removing this feature.
    //this.subs.sink = this.labelService.deleteLabel(this.selectedCollection, this.label.labelId).subscribe((data: any) => {
    //});
    //this.labelchange.emit();
  }

  setLabelData() {

  }

  resetData() {
    this.label.labelId= "LABEL";
    this.labelchange.emit();
  }

  addCollection() {
    this.label = [];
    this.label.labelId = "LABEL";
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
      let exists = this.labels.find((e: { labelName: any; }) => e.labelName === this.label.labelName);
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
