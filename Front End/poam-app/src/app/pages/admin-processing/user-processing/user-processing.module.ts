/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbAutocompleteModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule, NbSelectModule, NbSpinnerModule, NbTableModule, NbToggleModule, NbTreeGridModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { SharedModule } from '../../../Shared/shared.module';
import { UserProcessingComponent } from './user-processing.component';
import { UserProcessingRoutingModule } from './user-processing.routing';
import { UserComponent } from './user/user.component';

@NgModule({
  declarations: [
    UserProcessingComponent,
    UserComponent,
  ],
  imports: [
    CommonModule,
    UserProcessingRoutingModule,
    FormsModule,
    NbAutocompleteModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbIconModule,
    NbInputModule,
    NbFormFieldModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTableModule,
    NbToggleModule,
    NbTreeGridModule,
    Angular2SmartTableModule,
    SharedModule,
   
  ],
  exports: [
  ]
})
export class UserProcessingModule { }
