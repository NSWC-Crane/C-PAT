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
import { NbCardModule, NbIconModule, NbInputModule, NbFormFieldModule, NbButtonModule, NbThemeModule, NbSelectModule, NbRadioModule, NbDatepickerModule, NbAutocompleteModule, NbTabsetModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AppComponent } from '../../app.component';

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
      NbDatepickerModule,
      NbFormFieldModule,
      NbIconModule,
      NbInputModule,
      FormsModule,
      PoamsRoutingModule,
      NbCardModule,
      NbThemeModule,
      NbTabsetModule,
      NbButtonModule,
      Angular2SmartTableModule,
      NbRadioModule,
      NbSelectModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
})
export class PoamsModule { }
