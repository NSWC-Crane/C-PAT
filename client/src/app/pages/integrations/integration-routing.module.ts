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

export const integrationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'stig-manager',
    pathMatch: 'full'
  },
  {
    path: 'stig-manager',
    canActivate: [AuthGuard],
    loadComponent: () => import('./stig-manager/stig-manager.component').then((m) => m.STIGManagerComponent)
  },
  {
    path: 'tenable',
    canActivate: [AuthGuard],
    loadComponent: () => import('./tenable/tenable.component').then((m) => m.TenableComponent)
  }
];
