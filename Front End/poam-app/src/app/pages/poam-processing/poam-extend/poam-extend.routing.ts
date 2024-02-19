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
import { Routes, RouterModule } from '@angular/router';
import { PoamExtendComponent } from './poam-extend.component';

const routes: Routes = [{
  path: '',
  component: PoamExtendComponent},
  {
  path: 'poam-extend/:poamId',
  component: PoamExtendComponent},
  {
    path: 'extend',
    component: PoamExtendComponent},
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoamExtendRoutingModule { }
