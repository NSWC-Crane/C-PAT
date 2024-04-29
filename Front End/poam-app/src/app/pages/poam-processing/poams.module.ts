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
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbAutocompleteModule, NbButtonModule, NbCardModule, NbDatepickerModule, NbFormFieldModule, NbIconModule, NbInputModule, NbRadioModule, NbSelectModule, NbTabsetModule, NbThemeModule, NbToggleModule, NbTooltipModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { PoamGridModule } from './poam-components/poam-grid/poam-grid.module';
import { PoamMainchartModule } from './poam-components/poam-mainchart/poam-mainchart.module';
import { PoamsComponent } from './poams.component';
import { PoamsRoutingModule } from './poams.routing';

@NgModule({
    declarations: [
        PoamsComponent,
    ],
    exports: [
        PoamsComponent,
    ],
  imports: [
      CommonModule,
      NbAutocompleteModule,
      NbButtonModule,
      NbToggleModule,
      NbDatepickerModule,
      NbFormFieldModule,
      NbIconModule,
      NbEvaIconsModule,
      NbInputModule,
      NbTooltipModule,
      FormsModule,
      PoamGridModule,
      PoamMainchartModule,
      PoamsRoutingModule,
      NbCardModule,
      NbThemeModule,
      NbTabsetModule,
      NbTooltipModule,
      NbButtonModule,
      Angular2SmartTableModule,
      NbRadioModule,
      NbSelectModule,
  ],
  providers: [
  ],
})
export class PoamsModule { }
