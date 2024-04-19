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
import { PoamMainchartComponent } from './poam-mainchart.component';
import { NbTabsetModule, NbFormFieldModule, NbIconModule, NbSelectModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  declarations: [PoamMainchartComponent],
  imports: [
    CommonModule,
    NbTabsetModule,
    NbTabsetModule,
    NbFormFieldModule,
    NbIconModule,
    NbSelectModule,
    NbButtonModule,
    NbCardModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
  ],
  exports: [PoamMainchartComponent]
})
export class PoamMainchartModule { }
