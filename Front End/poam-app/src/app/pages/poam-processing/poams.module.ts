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
import { NbCardModule, NbIconModule, NbInputModule, NbFormFieldModule, NbButtonModule, NbThemeModule, NbSelectModule, NbRadioModule, NbDatepickerModule, NbAutocompleteModule, NbTabsetModule, NbTooltipModule, NbCheckboxModule, NbToggleModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables, BaseChartDirective } from 'ng2-charts';
import { AppComponent } from '../../app.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';

@NgModule({
    declarations: [
        PoamsComponent,
    ],
    exports: [
        PoamsComponent,
    ],
  imports: [
      BaseChartDirective,
      CommonModule,
      NbAutocompleteModule,
      NbToggleModule,
      NbDatepickerModule,
      NbFormFieldModule,
      NbIconModule,
      NbEvaIconsModule,
      NbInputModule,
      NbTooltipModule,
      FormsModule,
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
    provideCharts(withDefaultRegisterables()),
  ],
})
export class PoamsModule { }
