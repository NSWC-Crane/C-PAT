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
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  NbTooltipModule,
  NbTreeGridModule,
} from '@nebular/theme';
import { SharedModule } from '../../Shared/shared.module';
import { STIGManagerImportComponent } from './stigmanager-import/stigmanager-import.component';
import { TenableImportComponent } from './tenable-import/tenable-import.component';
import { ImportProcessingRoutingModule } from './import-processing-routing.module';

@NgModule({
  declarations: [
    STIGManagerImportComponent,
    TenableImportComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ImportProcessingRoutingModule,
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbIconModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbTooltipModule,
    NbTreeGridModule,
    SharedModule,
  ],
  providers: [],
})
export class ImportProcessingModule { }
