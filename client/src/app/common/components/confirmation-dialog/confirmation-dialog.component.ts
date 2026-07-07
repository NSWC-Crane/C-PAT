/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'cpat-confirmation-dialog',
  styleUrls: ['./confirmation-dialog.component.scss'],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [closable]="false" styleClass="w-auto h-auto max-h-[20vh] overflow-hidden">
      <ng-template #header>
        <h3>{{ options().header }}</h3>
      </ng-template>
      <div style="text-align: center;">
        <p>{{ options().body }}</p>
      </div>
      <ng-template #footer>
        <div style="text-align:center; margin: 0 0.75rem;">
          @if (options().cancelbutton === 'true') {
            <button pButton variant="outlined" severity="warn" class="ml-[10%]" (click)="cancel()"><i class="pi pi-times" pButtonIcon></i><span pButtonLabel>Cancel</span></button>
          }
          <button pButton variant="outlined" [severity]="options().button.status" class="ml-[5%]" (click)="confirm()">
            <i class="pi pi-check" pButtonIcon></i><span pButtonLabel>{{ options().button.text }}</span>
          </button>
          @if (options().convertButton) {
            <button pButton variant="outlined" severity="warn" class="ml-[5%]" (click)="convert()">
              <i class="pi pi-refresh" pButtonIcon></i><span pButtonLabel>{{ options().convertButton.text }}</span>
            </button>
          }
        </div>
      </ng-template>
    </p-dialog>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, DialogModule, FormsModule]
})
export class ConfirmationDialogComponent {
  protected dialogRef = inject(DynamicDialogRef);

  readonly options = input.required<ConfirmationDialogOptions>();
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
