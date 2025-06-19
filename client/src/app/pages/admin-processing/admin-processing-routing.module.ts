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
import { AdminProcessingComponent } from './admin-processing.component';
import { AppInfoComponent } from './app-info/app-info.component';

export const adminProcessingRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: AdminProcessingComponent,
    data: { guardType: 'admin' }
  },
  {
    path: 'app-info',
    canActivate: [AuthGuard],
    component: AppInfoComponent,
    data: { guardType: 'admin' }
  }
];
