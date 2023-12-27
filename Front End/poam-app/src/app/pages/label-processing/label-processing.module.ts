import { NgModule } from '@angular/core';
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LabelProcessingComponent } from './label-processing.component';
import { LabelProcessingRoutingModule } from './label-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { LabelComponent } from './label/label.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbCardModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    LabelProcessingComponent,
    LabelComponent,
  ],
  imports: [
    CommonModule,
    LabelProcessingRoutingModule,
    FormsModule,
    NbCardModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTreeGridModule,
    Ng2SmartTableModule,
    SharedModule, 
  ],
  exports: [
    // BilletTaskProcessComponent,
  ],
  entryComponents: [
    ConfirmationDialogComponent,

  ]
})
export class LabelProcessingModule { }
