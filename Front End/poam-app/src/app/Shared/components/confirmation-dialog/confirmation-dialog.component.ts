import { Component, OnInit, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'confirmation-dialog',
  styleUrls: ['./confirmation-dialog.component.scss'],
  template: `
    <nb-card>
      <nb-card-header>
        <h3> {{ options.header }} </h3>
      </nb-card-header>
      <nb-card-body>
        <p> {{ options.body }} </p>
      </nb-card-body>
      <nb-card-footer>
        <div style="text-align:center; margin-right: 0.75rem; margin-left: 0.75rem; margin-bottom: 0rem;">
        <button nbButton style="margin-left: 10%;" outline  status='warning' (click)="cancel()" *ngIf="(options.cancelbutton == 'true');">cancel</button>
        <button nbButton style="margin-left: 5%;"outline status="options.button.status" (click)="confirm()"> {{ options.button.text }} </button>
        </div>

      </nb-card-footer>
    </nb-card>
  `,
})
export class ConfirmationDialogComponent {

  @Input()
  options!: ConfirmationDialogOptions;

  constructor(protected dialogRef: NbDialogRef<ConfirmationDialogComponent>) { }

  cancel() {
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }

}

export class ConfirmationDialogOptions {
  header: string;
  body: string;
  button: { text: string, status: string };
  cancelbutton: string;

  constructor({
    header,
    body,
    button,
    cancelbutton,
  }: {
    header?: string,
    body?: string,
    button?: { text: string, status: string },
    cancelbutton?: string
  }) {
    this.header = header || 'Confirmation';
    this.body = body || 'Are you sure you wish to continue?';
    this.button = button || { text: 'confirm', status: 'primary' };
    this.cancelbutton = cancelbutton || 'true';
  }
}
