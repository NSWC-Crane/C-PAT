import { NgModule } from '@angular/core';
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserProcessingComponent } from './user-processing.component';
import { UserProcessingRoutingModule } from './user-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { UserComponent } from './user/user.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbCardModule,NbLayoutModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule, NbIconModule, NbCheckboxModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    UserProcessingComponent,
    UserComponent,
  ],
  imports: [
    CommonModule,
    UserProcessingRoutingModule,
    FormsModule,
    NbCardModule,
    NbCheckboxModule,
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
export class UserProcessingModule { }
