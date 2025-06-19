/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'cpat-confirmation-dialog',
  styleUrls: ['./confirmation-dialog.component.scss'],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="false"
      [style]="{
        width: 'auto',
        'max-width': '40vw',
        height: 'auto',
        'max-height': '20vh'
      }"
    >
      <p-header>
        <h3>{{ options.header }}</h3>
      </p-header>
      <div style="text-align: center;">
        <p>{{ options.body }}</p>
      </div>
      <p-footer>
        <div style="text-align:center; margin: 0 0.75rem;">
          @if (options.cancelbutton === 'true') {
            <button pButton type="button" label="Cancel" icon="pi pi-times" style="margin-left: 10%;" class="p-button-outlined p-button-warn" (click)="cancel()"></button>
          }
          <button pButton type="button" label="{{ options.button.text }}" [icon]="'pi pi-check'" style="margin-left: 5%;" [class]="'p-button-outlined p-button-' + options.button.status" (click)="confirm()"></button>
          @if (options.convertButton) {
            <button pButton type="button" label="{{ options.convertButton.text }}" icon="pi pi-refresh" style="margin-left: 5%;" class="p-button-outlined p-button-warn" (click)="convert()"></button>
          }
        </div>
      </p-footer>
    </p-dialog>
  `,
  standalone: true,
  imports: [ButtonModule, DialogModule, FormsModule]
})
export class ConfirmationDialogComponent {
  protected dialogRef = inject(DynamicDialogRef);

  @Input() options!: ConfirmationDialogOptions;
  visible: boolean = true;

  cancel() {
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }

  convert() {
    this.dialogRef.close({ convert: true });
  }
}

export class ConfirmationDialogOptions {
  header: string;
  body: string;
  button: { text: string; status: string };
  cancelbutton: string;
  convertButton?: { text: string };

  constructor({ header, body, button, cancelbutton, convertButton }: { header?: string; body?: string; button?: { text: string; status: string }; cancelbutton?: string; convertButton?: { text: string } }) {
    this.header = header ?? 'Confirmation';
    this.body = body ?? 'Are you sure you wish to continue?';
    this.button = button || { text: 'confirm', status: 'primary' };
    this.cancelbutton = cancelbutton ?? 'true';
    this.convertButton = convertButton;
  }
}
