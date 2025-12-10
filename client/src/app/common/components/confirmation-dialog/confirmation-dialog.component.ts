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
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'cpat-confirmation-dialog',
  styleUrls: ['./confirmation-dialog.component.scss'],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [closable]="false" styleClass="w-auto h-auto max-h-[20vh] overflow-hidden">
      <p-header>
        <h3>{{ options.header }}</h3>
      </p-header>
      <div style="text-align: center;">
        <p>{{ options.body }}</p>
      </div>
      <p-footer>
        <div style="text-align:center; margin: 0 0.75rem;">
          @if (options.cancelbutton === 'true') {
            <p-button label="Cancel" icon="pi pi-times" variant="outlined" severity="warn" styleClass="ml-[10%]" (onClick)="cancel()" />
          }
          <p-button [label]="options.button.text" icon="pi pi-check" variant="outlined" [severity]="options.button.status" styleClass="ml-[5%]" (onClick)="confirm()" />
          @if (options.convertButton) {
            <p-button [label]="options.convertButton.text" icon="pi pi-refresh" variant="outlined" severity="warn" styleClass="ml-[5%]" (onClick)="convert()" />
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
  button: { text: string; status: ButtonSeverity };
  cancelbutton: string;
  convertButton?: { text: string };

  constructor({ header, body, button, cancelbutton, convertButton }: { header?: string; body?: string; button?: { text: string; status: ButtonSeverity }; cancelbutton?: string; convertButton?: { text: string } }) {
    this.header = header ?? 'Confirmation';
    this.body = body ?? 'Are you sure you wish to continue?';
    this.button = button || { text: 'confirm', status: 'primary' };
    this.cancelbutton = cancelbutton ?? 'true';
    this.convertButton = convertButton;
  }
}
