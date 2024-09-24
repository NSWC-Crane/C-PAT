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
import { RouterModule, Routes } from '@angular/router';
import { PoamApproveComponent } from './poam-approve/poam-approve.component';
import { PoamDetailsComponent } from './poam-details/poam-details.component';
import { PoamExtendComponent } from './poam-extend/poam-extend.component';
import { PoamLogComponent } from './poam-log/poam-log.component';
import { PoamManageComponent } from './poam-manage/poam-manage.component';
import { PoamsComponent } from './poams.component';
import { AuthGuard } from '../../core/auth/guards/auth.guard';

const routes: Routes = [
  { path: '', component: PoamsComponent },
  {
    path: 'poam-approve/:poamId',
    canActivate: [AuthGuard],
    component: PoamApproveComponent,
  },
  {
    path: 'poam-details/:poamId',
    canActivate: [AuthGuard],
    component: PoamDetailsComponent,
  },
  {
    path: 'poam-extend/:poamId',
    canActivate: [AuthGuard],
    component: PoamExtendComponent,
  },
  {
    path: 'poam-log/:poamId',
    canActivate: [AuthGuard],
    component: PoamLogComponent,
  },
  {
    path: 'poam-manage',
    canActivate: [AuthGuard],
    component: PoamManageComponent,
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoamProcessingRoutingModule {}
