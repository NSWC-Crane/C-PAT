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
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { LabelService } from '../label.service';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { DialogService } from 'primeng/dynamicdialog';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogOptions,
} from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'cpat-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule],
  providers: [DialogService],
})
export class LabelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label: any;
  @Input() labels: any;
  @Input() payload: any;
  @Output() labelchange = new EventEmitter();

  errorMessage: string = '';
  data: any = [];
  deleteEvent: any;
  showLaborCategorySelect: boolean = false;
  selectedCollection: any;
  private subscriptions = new Subscription();
  private subs = new SubSink();

  constructor(
    private labelService: LabelService,
    private dialogService: DialogService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['label'] && changes['label'].currentValue) {
      this.label = { ...changes['label'].currentValue };
    }
  }

  async onSubmit() {
    if (!this.validData()) return;
    const label = {
      labelId: this.label.labelId == 'ADDLABEL' || !this.label.labelId ? 0 : this.label.labelId,
      collectionId: this.selectedCollection,
      labelName: this.label.labelName,
      description: this.label.description,
    };
    if (label.labelId === 0) {
      this.subs.sink = (await this.labelService.addLabel(this.selectedCollection, label)).subscribe(
        (data: any) => {
          this.labelchange.emit(data.labelId);
        },
        (err: any) => {
          this.invalidData('Unexpected error adding label');
          console.error(err);
        }
      );
    } else {
      this.subs.sink = (
        await this.labelService.updateLabel(this.selectedCollection, label)
      ).subscribe(data => {
        this.label = data;
        this.labelchange.emit();
      });
    }
  }

  resetData() {
    this.label = { labelId: '', labelName: '', description: '' };
    this.labelchange.emit();
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      data: {
        options: dialogOptions,
      },
    }).onClose;

  validData(): boolean {
    if (!this.label.labelName || this.label.labelName == undefined) {
      this.invalidData('Label name required');
      return false;
    }

    if (this.label.labelId == 'ADDLABEL') {
      const exists = this.labels.find(
        (e: { labelName: any }) => e.labelName === this.label.labelName
      );
      if (exists) {
        this.invalidData('Label Already Exists');
        return false;
      }
    }

    return true;
  }

  invalidData(errMsg: string) {
    this.confirm(
      new ConfirmationDialogOptions({
        header: 'Invalid Data',
        body: errMsg,
        button: {
          text: 'ok',
          status: 'warn',
        },
        cancelbutton: 'false',
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
