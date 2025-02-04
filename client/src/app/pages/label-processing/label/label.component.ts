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
import { MessageService } from 'primeng/api';
import { PayloadService } from '../../../common/services/setPayload.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'cpat-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, ToastModule],
  providers: [MessageService, DialogService],
})
export class LabelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label: any;
  @Input() labels: any;
  @Input() payload: any;
  @Output() labelchange = new EventEmitter();

  errorMessage: string = '';
  data: any = [];
  showLaborCategorySelect: boolean = false;
  selectedCollection: any;
  private subscriptions = new Subscription();
  private subs = new SubSink();
  protected accessLevel: any;

  constructor(
    private labelService: LabelService,
    private dialogService: DialogService,
    private sharedService: SharedService,
    private messageService: MessageService,
    private setPayloadService: PayloadService,
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );

    this.setPayloadService.accessLevel$.subscribe(level => {
      this.accessLevel = level;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['label'] && changes['label'].currentValue) {
      this.label = { ...changes['label'].currentValue };
    }
  }

  onSubmit() {
    if (!this.validData()) return;

    const label = {
      labelId: this.label.labelId == 'ADDLABEL' || !this.label.labelId ? 0 : this.label.labelId,
      collectionId: this.selectedCollection,
      labelName: this.label.labelName,
      description: this.label.description,
    };

    if (label.labelId === 0) {
      this.subs.sink = this.labelService.addLabel(this.selectedCollection, label)
        .subscribe(
          (data: any) => {
            this.labelchange.emit(data.labelId);
          },
          (err: any) => {
            this.invalidData('Unexpected error adding label');
            console.error(err);
          }
        );
    } else {
      this.subs.sink = this.labelService.updateLabel(this.selectedCollection, label.labelId, label)
        .subscribe(
          data => {
            this.label = data;
            this.labelchange.emit();
          }
        );
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

  deleteLabel(label: any) {
    this.labelService.deleteLabel(label.collectionId, label.labelId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Label has been successfully deleted.`,
          });
          this.labelchange.emit();
        },
        error: (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to delete label: ${error.message}`,
          });
        },
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
