import { Component, NgZone } from '@angular/core';

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

    <div *ngIf="isPopupOpen" class="card mt-4">
      <p-stepper orientation="vertical">
        <p-stepperPanel header="VRAM IAV Export">
          <ng-template
            pTemplate="content"
            let-nextCallback="nextCallback"
            let-index="index"
          >
            <p>The VRAM IAV Table is currently open in a separate window.</p>
            <p class="text-sm">
              You can close the window at any point to hide this message.
            </p>
            <div class="flex py-4">
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-primary"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="nextCallback.emit()"
              ></p-button>
            </div>
          </ng-template>
        </p-stepperPanel>

        <p-stepperPanel header="Set Default Column Options">
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
              styleClass="mt-4"
              src="../../../assets/vram/columnOptions.png"
              alt="Image"
              width="600"
              [preview]="true"
            ></p-image>
            <div class="flex py-4 gap-2">
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
        </p-stepperPanel>

        <p-stepperPanel header="Export">
          <ng-template
            pTemplate="content"
            let-prevCallback="prevCallback"
            let-nextCallback="nextCallback"
            let-index="index"
          >
            <p>
              Click to export. The exported file can be imported to C-PAT
              directly below.
            </p>
            <p-image
              src="../../../assets/vram/step2.png"
              alt="Image"
              width="600"
              [preview]="true"
            ></p-image>
            <div class="flex py-4 gap-2">
              <p-button
                styleClass="p-button-outlined p-button-rounded p-button-text p-button-raised p-button-secondary"
                icon="pi pi-arrow-left"
                (onClick)="prevCallback.emit()"
              ></p-button>
            </div>
          </ng-template>
        </p-stepperPanel>
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
})
export class VramPopupComponent {
  authWindow: Window | null = null;
  isPopupOpen = false;
  checkInterval: any;

  constructor(private ngZone: NgZone) {}

  openVRAM() {
    this.authWindow = window.open(
      'https://vram.navy.mil/iav',
      'Auth Window',
      'width=600,height=600',
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
