/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NgModule } from '@angular/core';
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserProcessingComponent } from './user-processing.component';
import { UserProcessingRoutingModule } from './user-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { UserComponent } from './user/user.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbButtonModule, NbInputModule, NbToggleModule, NbCardModule,NbLayoutModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule, NbIconModule, NbCheckboxModule } from '@nebular/theme';
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
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbToggleModule,
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
