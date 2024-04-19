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
import { NbTreeGridModule, NbIconModule, NbInputModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { PoamGridComponent } from './poam-grid.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@NgModule({
  declarations: [PoamGridComponent],
  imports: [
    CommonModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbCardModule,
    InfiniteScrollModule,
  ],
  exports: [PoamGridComponent]
})
export class PoamGridModule { }
