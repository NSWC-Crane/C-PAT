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
import { NbAutocompleteModule, NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule, NbSelectModule, NbTabsetModule, NbThemeModule, NbTreeGridModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { PoamAdvancedPieModule } from '../poam-components/poam-advanced-pie/poam-advanced-pie.module';
import { PoamsAssignedGridModule } from '../poam-components/poam-assigned-grid/poam-assigned-grid.module';
import { PoamGridModule } from '../poam-components/poam-grid/poam-grid.module';
import { PoamMainchartModule } from '../poam-components/poam-mainchart/poam-mainchart.module';
import { PoamManageComponent } from './poam-manage.component';
import { PoamManageRoutingModule } from './poam-manage.routing';

@NgModule({
    declarations: [
        PoamManageComponent,
    ],
    exports: [
        PoamManageComponent,
    ],
  imports: [
      Angular2SmartTableModule,
      CommonModule,
      FormsModule,
      NbAutocompleteModule,
      NbButtonModule,
      NbCardModule,
      NbFormFieldModule,
      NbInputModule,
      NbIconModule,
      NbSelectModule,
      NbTabsetModule,
      NbTreeGridModule,
      NbThemeModule,
      PoamsAssignedGridModule,
      PoamGridModule,
      PoamMainchartModule,
      PoamManageRoutingModule,
      PoamAdvancedPieModule,
    ]
})
export class PoamManageModule { }
