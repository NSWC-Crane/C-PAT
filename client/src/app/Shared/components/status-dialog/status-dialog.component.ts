import { Component, Input, OnInit, OnDestroy } from '@angular/core';


@Component({
  selector: 'status-dialog',
  template: `
    <nb-card>
      <nb-card-header>
        <h3>File Upload Status</h3>
      </nb-card-header>
      <nb-card-body>
        <nb-progress-bar [value]="progress" status="info" [displayValue]="true"></nb-progress-bar>
      </nb-card-body>
      <nb-card-footer>
        <p *ngIf="message">{{ message + " " + countdownMessage}}</p>
      </nb-card-footer>
    </nb-card>
  `,
})
export class StatusDialogComponent implements OnInit, OnDestroy {
  @Input() progress: number = 0;
  @Input() message: string = '';
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
    const intervalId = setInterval(() => {
      this.countdown -= 1;
      this.countdownMessage = `The page will refresh in ${this.countdown} seconds.`;
      if (this.countdown <= 0) {
        clearInterval(intervalId);
      }
    }, 1000);
  }


  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
