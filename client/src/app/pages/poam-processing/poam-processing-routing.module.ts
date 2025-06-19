/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/guards/auth.guard';
import { PoamApproveComponent } from './poam-approve/poam-approve.component';
import { PoamDetailsComponent } from './poam-details/poam-details.component';
import { PoamExtendComponent } from './poam-extend/poam-extend.component';
import { PoamLogComponent } from './poam-log/poam-log.component';
import { PoamManageComponent } from './poam-manage/poam-manage.component';
import { PoamsComponent } from './poams.component';

export const poamProcessingRoutes: Routes = [
  { path: '', component: PoamsComponent },
  {
    path: 'poam-approve/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    component: PoamApproveComponent,
  },
  {
    path: 'poam-details/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    component: PoamDetailsComponent,
  },

  {
    path: 'poam-extend/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    component: PoamExtendComponent,
  },
  {
    path: 'poam-log/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    component: PoamLogComponent,
  },
  {
    path: 'poam-manage',
    canActivate: [AuthGuard],
    component: PoamManageComponent,
  },
  { path: '**', redirectTo: '' },
];
