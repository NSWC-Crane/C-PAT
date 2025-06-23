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







export const poamProcessingRoutes: Routes = [
  { path: '', loadComponent: () => import('./poams.component').then(m => m.PoamsComponent) },
  {
    path: 'poam-approve/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    loadComponent: () => import('./poam-approve/poam-approve.component').then(m => m.PoamApproveComponent)
  },
  {
    path: 'poam-details/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    loadComponent: () => import('./poam-details/poam-details.component').then(m => m.PoamDetailsComponent)
  },

  {
    path: 'poam-extend/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    loadComponent: () => import('./poam-extend/poam-extend.component').then(m => m.PoamExtendComponent)
  },
  {
    path: 'poam-log/:poamId',
    canActivate: [AuthGuard],
    data: { guardType: 'poam' },
    loadComponent: () => import('./poam-log/poam-log.component').then(m => m.PoamLogComponent)
  },
  {
    path: 'poam-manage',
    canActivate: [AuthGuard],
    loadComponent: () => import('./poam-manage/poam-manage.component').then(m => m.PoamManageComponent)
  },
  { path: '**', redirectTo: '' }
];
