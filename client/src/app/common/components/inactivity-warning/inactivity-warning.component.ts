/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { InactivityService } from '../../../core/auth/services/inactivity.service';

@Component({
  selector: 'cpat-inactivity-warning',
  standalone: true,
  imports: [FormsModule, DialogModule, ButtonModule],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [closable]="false" [draggable]="false" [resizable]="false">
      <div class="custom-confirm-popup">
        <div class="icon-container">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h3>Inactivity Detected</h3>
        <p>
          Inactivity detected, you will be logged out in
          <strong class="text-primary">{{ countdown }}</strong> seconds.
        </p>
        <p class="!mb-0">Would you like to keep working?</p>
      </div>
      <ng-template #footer>
        <div class="flex justify-between items-center w-full m-2">
          <button pButton variant="outlined" (click)="keepWorking()"><span pButtonLabel>Keep Working</span></button>
          <button pButton variant="outlined" severity="secondary" (click)="logoutNow()"><i class="pi pi-sign-out" pButtonIcon></i><span pButtonLabel>Log Out</span></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep {
        .p-dialog-header {
          padding: 1rem !important;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class InactivityWarningComponent implements OnInit, OnDestroy {
  private readonly inactivityService = inject(InactivityService);

  visible = false;
  countdown = 60;

  private warningSubscription?: Subscription;

  ngOnInit(): void {
    this.warningSubscription = this.inactivityService.warningState$.subscribe((state) => {
      this.visible = state.show;

      if (state.countdown !== undefined) {
        this.countdown = state.countdown;
      }
    });
  }

  ngOnDestroy(): void {
    this.warningSubscription?.unsubscribe();
  }

  keepWorking(): void {
    this.inactivityService.dismissWarning();
  }

  logoutNow(): void {
    this.inactivityService.stopMonitoring();
    globalThis.location.href = '/';
  }
}
