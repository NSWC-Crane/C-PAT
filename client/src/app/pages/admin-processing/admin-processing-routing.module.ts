/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND 
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { AdminProcessingComponent } from './admin-processing.component';
import { AuthGuard } from '../../core/auth/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: AdminProcessingComponent,
    data: { guardType: 'admin' },
  },
  {
    path: 'stigmanager-admin',
    canActivate: [AuthGuard],
    component: STIGManagerAdminComponent,
    data: { guardType: 'admin' },
  },
  {
    path: 'user-processing',
    canActivate: [AuthGuard],
    component: UserProcessingComponent,
    data: { guardType: 'admin' },
  },
  {
    path: 'collection-processing',
    canActivate: [AuthGuard],
    component: CollectionProcessingComponent,
    data: { guardType: 'admin' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminProcessingRoutingModule {}
