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
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService,  NbWindowRef, NbWindowModule, NbWindowService } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth';
import { NbAuthToken, NbAuthJWTToken } from '@nebular/auth';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { SubSink } from 'subsink';


@Component({
  selector: 'ngx-label',
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

  private subs = new SubSink()

  constructor(private labelService: LabelService,
    private dialogService: NbDialogService,
    private router: Router,
    private authService: AuthService,
    //private windowService: NbWindowService
    ) {
     }

  attemptingDelete(dialog: TemplateRef<any>, event: any) {
    this.deleteEvent = event
    this.dialogService.open(dialog)
  }

  onSubmit() {
    console.log("Attempting to onSubmit()...");

    if (!this.validData()) return;

    let label = {
      labelId: (this.label.labelId == "ADDLABEL") ? 0 : this.label.labelId,
      labelName:this.label.labelName,
      description: this.label.description,
      poamCount: this.label.poamCount
    }
    console.log("this.label: ", this.label)

    if (this.label.labelId == "ADDLABEL") {
      this.label.labelId = "";

      this.subs.sink = this.labelService.addLabel(label).subscribe(
        data => {
          this.labelchange.emit(data.labelId);
      }, err => {

          this.invalidData("unexpected error adding label");
        }
        );

    } else {
    
      this.subs.sink = this.labelService.updateLabel(label).subscribe(data => {
        //console.log("returned data: ",data)
        this.label = data;        
        this.labelchange.emit();                       //this will hide the billet and assign-task components
      });
      
    }
  }

  deleteLabel() {
    console.log("Attempting to deleteCollection()...");
    this.resetData();
  }

  ngOnInit() {

    // this.subs.sink = this.authService.getToken().subscribe((token: any) => {
    //   this.payload = token.getPayload();
    //   console.log("this.payload: ", this.payload)
    //   console.log("this.router.url: ", this.router.url)
    // });

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

    if (this.label.labelId == "ADDLABEL") {  // need to make sure this is not a duplicate
      let exists = this.labels.find((e: { labelName: any; }) => e.labelName === this.label.labelName);
      if (exists) {
        this.invalidData("Duplicate collection number");
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
