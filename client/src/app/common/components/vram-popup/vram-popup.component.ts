/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { StepperModule } from 'primeng/stepper';

@Component({
  selector: 'cpat-vram-popup',
  template: `
    <button pButton class="w-full" severity="secondary" [outlined]="true" (click)="openVRAM()"><span pButtonLabel>VRAM IAV TABLE</span></button>

    @if (isPopupOpen) {
      <div class="card mt-6">
        <p-stepper [value]="1" orientation="vertical">
          <p-step-item [value]="1">
            <p-step>VRAM IAV Export</p-step>
            <p-step-panel>
              <ng-template #content let-activateCallback="activateCallback">
                <p>The VRAM IAV Table is currently open in a separate window.</p>
                <p class="text-sm">You can close the window at any point to hide this message.</p>
                <div class="flex py-6">
                  <button pButton [outlined]="true" [rounded]="true" [text]="true" [raised]="true" (click)="activateCallback(2)"><i class="pi pi-arrow-right" pButtonIcon></i></button>
                </div>
              </ng-template>
            </p-step-panel>
          </p-step-item>

          <p-step-item [value]="2">
            <p-step>Set Default Column Options</p-step>
            <p-step-panel>
              <ng-template #content let-activateCallback="activateCallback">
                <p>Ensure column options are set to default values</p>
                <p-image src="assets/vram/step1.png" alt="Image" width="600" [preview]="true" />
                <br />
                <p-image class="mt-6" src="assets/vram/columnOptions.png" alt="Image" width="600" [preview]="true" />
                <div class="flex py-6 gap-2">
                  <button pButton [outlined]="true" [rounded]="true" [text]="true" [raised]="true" severity="secondary" (click)="activateCallback(1)"><i class="pi pi-arrow-left" pButtonIcon></i></button>
                  <button pButton [outlined]="true" [rounded]="true" [text]="true" [raised]="true" (click)="activateCallback(3)"><i class="pi pi-arrow-right" pButtonIcon></i></button>
                </div>
              </ng-template>
            </p-step-panel>
          </p-step-item>

          <p-step-item [value]="3">
            <p-step>Export</p-step>
            <p-step-panel>
              <ng-template #content let-activateCallback="activateCallback">
                <p>Click to export. The exported file can be imported to C-PAT directly below.</p>
                <p-image src="assets/vram/step2.png" alt="Image" width="600" [preview]="true" />
                <div class="flex py-6 gap-2">
                  <button pButton [outlined]="true" [rounded]="true" [text]="true" [raised]="true" severity="secondary" (click)="activateCallback(2)"><i class="pi pi-arrow-left" pButtonIcon></i></button>
                </div>
              </ng-template>
            </p-step-panel>
          </p-step-item>
        </p-stepper>
      </div>
    }
  `,
  styles: [
    `
      :host ::ng-deep .card {
        height: auto !important;
        display: block !important;
        flex-direction: unset !important;
        min-height: unset !important;
      }

      .status-display {
        margin-top: 1rem;
        transition: opacity 0.3s ease-in-out;
      }
    `
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ButtonModule, ImageModule, FormsModule, StepperModule]
})
export class VramPopupComponent implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  authWindow: Window | null = null;
  isPopupOpen = false;
  checkInterval: any;

  openVRAM() {
    this.authWindow = globalThis.open('https://vram.navy.mil/iav', 'Auth Window', 'width=600,height=600');

    if (this.authWindow) {
      this.isPopupOpen = true;
      this.startCheckingWindow();
    }
  }

  startCheckingWindow() {
    this.checkInterval = setInterval(() => {
      if (this.authWindow?.closed) {
        this.ngZone.run(() => {
          this.isPopupOpen = false;
          clearInterval(this.checkInterval);
        });
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
