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
import { NbAutocompleteModule, NbButtonModule, NbCardModule, NbInputModule, NbSelectModule, NbThemeModule, NbTreeGridModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { PoamLogComponent } from './poam-log.component';
import { PoamLogRoutingModule } from './poam-log.routing';

@NgModule({
  declarations: [
    PoamLogComponent,
    ],
    exports: [
      PoamLogComponent,
    ],
    imports: [
        CommonModule,
        NbButtonModule,
        NbInputModule,
        FormsModule,
        PoamLogRoutingModule,
        NbCardModule,
      NbThemeModule,
        NbTreeGridModule,
        NbAutocompleteModule,
        Angular2SmartTableModule,
        NbSelectModule,
    ]
})
export class PoamLogModule { }
