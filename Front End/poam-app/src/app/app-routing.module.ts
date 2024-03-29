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
import { PoamDetailsComponent } from './pages/poam-processing/poam-details/poam-details.component';
import { PoamApproveComponent } from './pages/poam-processing/poam-approve/poam-approve.component';
import { PoamExtendComponent } from './pages/poam-processing/poam-extend/poam-extend.component';
import { AuthGuard } from './auth.guard'
import { AppComponent } from './app.component';


const routes: Routes = [
  { path: '', canActivate: [AuthGuard], component: AppComponent },
  { path: 'consent',  loadChildren: () => import('./pages/dod-consent/dod-consent.module').then(m => m.DoDConsentModule) },
  { path: 'approve', loadChildren: () => import('./pages/poam-processing/poam-approve/poam-approve.module').then(m => m.PoamApproveModule) },
  { path: 'extend', loadChildren: () => import('./pages/poam-processing/poam-extend/poam-extend.module').then(m => m.PoamExtendModule) },
  { path: 'asset-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/asset-processing/asset-processing.module').then(m => m.AssetProcessingModule) },
  { path: 'collection-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/collection-processing/collection-processing.module').then(m => m.CollectionProcessingModule) },
  { path: 'label-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/label-processing/label-processing.module').then(m => m.LabelProcessingModule) },
  { path: 'poam-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/poam-processing/poams.module').then(m => m.PoamsModule) },
  { path: 'poam-details/:poamId', canActivate: [AuthGuard], component: PoamDetailsComponent},
  { path: 'poam-approve/:poamId', canActivate: [AuthGuard], component: PoamApproveComponent },
  { path: 'poam-extend/:poamId', canActivate: [AuthGuard], component: PoamExtendComponent },
  { path: 'stigmanager-import', canActivate: [AuthGuard], loadChildren: () => import('./pages/import-processing/stigmanager-import/stigmanager-import.module').then(m => m.STIGManagerImportModule) },
  { path: 'tenable-import', canActivate: [AuthGuard], loadChildren: () => import('./pages/import-processing/tenable-import/tenable-import.module').then(m => m.TenableImportModule) },
  { path: 'user-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/user-processing/user-processing.module').then(m => m.UserProcessingModule) },
  {path: '**', redirectTo: 'poam-processing'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
