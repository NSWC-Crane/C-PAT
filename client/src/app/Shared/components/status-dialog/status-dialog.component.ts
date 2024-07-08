/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'status-dialog',
  template: `
    <p-dialog header="File Upload Status" [(visible)]="display" [modal]="true" [closable]="false" [style]="{width: '50vw'}">
      <p-progressBar [value]="progress" [showValue]="true" [style]="{ height: '20px' }"></p-progressBar>
      <p *ngIf="message">{{ message + ' ' + countdownMessage }}</p>
    </p-dialog>
  `,
})
export class StatusDialogComponent implements OnInit, OnDestroy {
  @Input() progress: number = 0;
  @Input() message: string = '';
  @Input() display: boolean = false;
  @Input() set uploadComplete(isComplete: boolean) {
    if (isComplete) {
      this.message = 'Upload complete!';
      this.startCountdown();
    }
  }

  countdown: number = 3;
  countdownMessage: string = '';
  private intervalId: any;

  ngOnInit() {
    if (this.message) {
      this.startCountdown();
    }
  }

  startCountdown() {
    this.countdownMessage = `The page will refresh in ${this.countdown} seconds.`;
    this.intervalId = setInterval(() => {
      this.countdown -= 1;
      this.countdownMessage = `The page will refresh in ${this.countdown} seconds.`;
      if (this.countdown <= 0) {
        clearInterval(this.intervalId);
        this.display = false;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
