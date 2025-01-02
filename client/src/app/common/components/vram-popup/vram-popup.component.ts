import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { StepperModule } from 'primeng/stepper';

@Component({
  selector: 'cpat-vram-popup',
  template: `
    <p-button
      styleClass="w-full"
      severity="secondary"
      [outlined]="true"
      label="VRAM IAV TABLE"
      (click)="openVRAM()"
    >
    </p-button>

    <div *ngIf="isPopupOpen" class="card mt-6">
      <p-stepper orientation="vertical">
        <p-step-panel header="VRAM IAV Export">
          <ng-template pTemplate="content" let-nextCallback="nextCallback" let-index="index">
            <p>The VRAM IAV Table is currently open in a separate window.</p>
            <p class="text-sm">You can close the window at any point to hide this message.</p>
            <div class="flex py-6">
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-primary"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="nextCallback.emit()"
              ></p-button>
            </div>
          </ng-template>
        </p-step-panel>

        <p-step-panel header="Set Default Column Options">
          <ng-template
            pTemplate="content"
            let-prevCallback="prevCallback"
            let-nextCallback="nextCallback"
            let-index="index"
          >
            <p>Ensure column options are set to default values</p>
            <p-image
              src="../../../assets/vram/step1.png"
              alt="Image"
              width="600"
              [preview]="true"
            ></p-image>
            <br />
            <p-image
              styleClass="mt-6"
              src="../../../assets/vram/columnOptions.png"
              alt="Image"
              width="600"
              [preview]="true"
            ></p-image>
            <div class="flex py-6 gap-2">
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-secondary"
                icon="pi pi-arrow-left"
                (onClick)="prevCallback.emit()"
              ></p-button>
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-primary"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="nextCallback.emit()"
              ></p-button>
            </div>
          </ng-template>
        </p-step-panel>

        <p-step-panel header="Export">
          <ng-template
            pTemplate="content"
            let-prevCallback="prevCallback"
            let-nextCallback="nextCallback"
            let-index="index"
          >
            <p>Click to export. The exported file can be imported to C-PAT directly below.</p>
            <p-image
              src="../../../assets/vram/step2.png"
              alt="Image"
              width="600"
              [preview]="true"
            ></p-image>
            <div class="flex py-6 gap-2">
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-secondary"
                icon="pi pi-arrow-left"
                (onClick)="prevCallback.emit()"
              ></p-button>
            </div>
          </ng-template>
        </p-step-panel>
      </p-stepper>
    </div>
  `,
  styles: [
    `
      .status-display {
        margin-top: 1rem;
        transition: opacity 0.3s ease-in-out;
      }
    `,
  ],
  standalone: true,
  imports: [ButtonModule, CommonModule, ImageModule, FormsModule, StepperModule],
})
export class VramPopupComponent implements OnDestroy {
  authWindow: Window | null = null;
  isPopupOpen = false;
  checkInterval: any;

  constructor(private ngZone: NgZone) {}

  openVRAM() {
    this.authWindow = window.open(
      'https://vram.navy.mil/iav',
      'Auth Window',
      'width=600,height=600'
    );

    if (this.authWindow) {
      this.isPopupOpen = true;
      this.startCheckingWindow();
    }
  }

  startCheckingWindow() {
    this.checkInterval = setInterval(() => {
      if (this.authWindow && this.authWindow.closed) {
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
