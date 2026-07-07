/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, effect, input, model, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'cpat-status-dialog',
  template: `
    <p-dialog header="File Upload Status" [(visible)]="display" [modal]="true" [closable]="false" styleClass="w-[50vw] overflow-hidden">
      <p-progressbar [value]="progress()" [showValue]="true" [style]="{ height: '20px' }" />
      @if (message()) {
        <p>{{ message() + ' ' + countdownMessage() }}</p>
      }
    </p-dialog>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, DialogModule, FormsModule, ProgressBarModule]
})
export class StatusDialogComponent implements OnInit, OnDestroy {
  readonly progress = input<number>(0);
  readonly message = model<string>('');
  readonly display = model<boolean>(false);
  readonly uploadComplete = input<boolean>(false);

  readonly countdown = signal(3);
  readonly countdownMessage = signal('');
  private intervalId: any;

  constructor() {
    effect(() => {
      if (this.uploadComplete()) {
        untracked(() => {
          this.message.set('Upload complete!');
          this.startCountdown();
        });
      }
    });
  }

  ngOnInit() {
    if (this.message()) {
      this.startCountdown();
    }
  }

  startCountdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.countdownMessage.set(`The page will refresh in ${this.countdown()} seconds.`);
    this.intervalId = setInterval(() => {
      this.countdown.update((value) => value - 1);
      this.countdownMessage.set(`The page will refresh in ${this.countdown()} seconds.`);

      if (this.countdown() <= 0) {
        clearInterval(this.intervalId);
        this.display.set(false);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
