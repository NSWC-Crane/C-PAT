/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { StepperModule } from 'primeng/stepper';

@Component({
  selector: 'cpat-vram-popup',
  template: `
    <p-button styleClass="w-full" severity="secondary" [outlined]="true" label="VRAM IAV TABLE" (click)="openVRAM()" />

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
                  <p-button [outlined]="true" [rounded]="true" [text]="true" [raised]="true" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(2)" />
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
                  <p-button [outlined]="true" [rounded]="true" [text]="true" [raised]="true" severity="secondary" icon="pi pi-arrow-left" (onClick)="activateCallback(1)" />
                  <p-button [outlined]="true" [rounded]="true" [text]="true" [raised]="true" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(3)" />
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
                  <p-button [outlined]="true" [rounded]="true" [text]="true" [raised]="true" severity="secondary" icon="pi pi-arrow-left" (onClick)="activateCallback(2)" />
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
  imports: [ButtonModule, CommonModule, ImageModule, FormsModule, StepperModule]
})
export class VramPopupComponent implements OnDestroy {
  private ngZone = inject(NgZone);

  authWindow: Window | null = null;
  isPopupOpen = false;
  checkInterval: any;

  openVRAM() {
    this.authWindow = window.open('https://vram.navy.mil/iav', 'Auth Window', 'width=600,height=600');

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
