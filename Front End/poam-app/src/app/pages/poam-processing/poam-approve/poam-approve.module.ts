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
import { CommonModule } from '@angular/common';
import { PoamApproveComponent } from './poam-approve.component';
import { PoamApproveRoutingModule } from './poam-approve.routing';
import { NbButtonModule, NbCardModule, NbInputModule, NbThemeModule, NbSelectModule, NbAutocompleteModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        PoamApproveComponent,
    ],
    exports: [
        PoamApproveComponent,
    ],
    imports: [
      CommonModule,
      NbAutocompleteModule,
        NbButtonModule,
        NbInputModule,
        FormsModule,
        PoamApproveRoutingModule,
        NbCardModule,
        NbThemeModule,
        Angular2SmartTableModule,
        NbSelectModule,
    ]
})
export class PoamApproveModule { }
