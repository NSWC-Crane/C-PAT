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
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { STIGManagerImportComponent } from './stigmanager-import.component';
import { SharedModule } from '../../../Shared/shared.module';
import { NbButtonModule, NbInputModule, NbCardModule, NbLayoutModule, NbSpinnerModule, NbSelectModule, NbIconModule, NbTooltipModule } from '@nebular/theme';
import { STIGManagerImportRoutingModule } from './stigmanager-import.routing';

@NgModule({
  declarations: [
    STIGManagerImportComponent,
  ],
  imports: [
    CommonModule,
    STIGManagerImportRoutingModule,
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbIconModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTooltipModule,
    SharedModule,
   
  ],
  providers: [
  ],
})
export class STIGManagerImportModule { }
