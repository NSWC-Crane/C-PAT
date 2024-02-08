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
import { PoamsComponent } from './poams.component';
import { PoamsRoutingModule } from './poams.routing';
import { NbCardModule, NbIconModule, NbInputModule, NbFormFieldModule, NbButtonModule, NbThemeModule, NbSelectModule, NbRadioModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        PoamsComponent,
    ],
    exports: [
        PoamsComponent,
    ],
    imports: [
        CommonModule,
        NbFormFieldModule,
        NbIconModule,
        NbInputModule,
        NgChartsModule,
        FormsModule,
        PoamsRoutingModule,
        NbCardModule,
        NbThemeModule,
        NbButtonModule,
        Angular2SmartTableModule,
        NbRadioModule,
        NbSelectModule,
    ]
})
export class PoamsModule { }
