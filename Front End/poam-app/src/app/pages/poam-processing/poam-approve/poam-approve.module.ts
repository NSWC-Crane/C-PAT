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
import { NbCardModule, NbThemeModule, NbSelectModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { TreeviewModule } from '@soy-andrey-semyonov/ngx-treeview';

@NgModule({
    declarations: [
        PoamApproveComponent,
    ],
    exports: [
        PoamApproveComponent,
    ],
    imports: [
        CommonModule,
        NgChartsModule,
        FormsModule,
        PoamApproveRoutingModule,
        NbCardModule,
        NbThemeModule,
        Angular2SmartTableModule,
        NbSelectModule,
        TreeviewModule,
    ]
})
export class PoamApproveModule { }
