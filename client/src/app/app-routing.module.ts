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
import { NotificationsComponent } from './Shared/notifications/notifications.component';
import { AuthGuard } from './auth/auth.guard'
import { UnauthorizedComponent } from './Shared/components/unauthorized/unauthorized.component';

const routes: Routes = [
  { path: 'admin-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/admin-processing/admin-processing.module').then(m => m.AdminProcessingModule) },
  { path: 'asset-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/asset-processing/asset-processing.module').then(m => m.AssetProcessingModule) },
  { path: 'consent', canActivate: [AuthGuard], loadChildren: () => import('./pages/dod-consent/dod-consent.module').then(m => m.DoDConsentModule) },
  { path: 'import-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/import-processing/import-processing.module').then(m => m.ImportProcessingModule) },
  { path: 'label-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/label-processing/label-processing.module').then(m => m.LabelProcessingModule) },
  { path: 'notifications', canActivate: [AuthGuard], component: NotificationsComponent },
  { path: 'poam-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/poam-processing/poam-processing.module').then(m => m.PoamProcessingModule) },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**' || '', redirectTo: 'consent' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
