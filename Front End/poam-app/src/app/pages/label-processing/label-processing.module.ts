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
