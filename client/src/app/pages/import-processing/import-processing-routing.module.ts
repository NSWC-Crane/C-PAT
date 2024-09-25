/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { STIGManagerImportComponent } from './stigmanager-import/stigmanager-import.component';
import { TenableVulnerabilitiesComponent } from './tenable-import/tenableVulnerabilities.component';
import { AuthGuard } from '../../core/auth/guards/auth.guard';

const routes: Routes = [
  {
    path: 'stigmanager-import',
    canActivate: [AuthGuard],
    component: STIGManagerImportComponent,
  },
  {
    path: 'tenable-import',
    canActivate: [AuthGuard],
    component: TenableVulnerabilitiesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImportProcessingRoutingModule {}
