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
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbTooltipModule, NbTreeGridModule } from '@nebular/theme';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { PoamGridComponent } from './poam-grid.component';

@NgModule({
  declarations: [PoamGridComponent],
  imports: [
    CommonModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbTooltipModule,
    NbCardModule,
    InfiniteScrollModule,
  ],
  exports: [PoamGridComponent]
})
export class PoamGridModule { }
