import { NgModule } from '@angular/core';
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssetProcessingComponent } from './asset-processing.component';
import { AssetProcessingRoutingModule } from './asset-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { AssetComponent } from './asset/asset.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbCardModule,NbLayoutModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule, NbIconModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    AssetProcessingComponent,
    AssetComponent,
  ],
  imports: [
    CommonModule,
    AssetProcessingRoutingModule,
    FormsModule,
    NbCardModule,
    NbIconModule,
    NbLayoutModule,
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
export class AssetProcessingModule { }
