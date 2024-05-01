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
import { STIGManagerImportComponent } from './stigmanager-import/stigmanager-import.component';
import { TenableImportComponent } from './tenable-import/tenable-import.component';
import { AuthGuard } from '../../auth.guard'

const routes: Routes = [
  { path: 'stigmanager-import', canActivate: [AuthGuard], component: STIGManagerImportComponent },
  { path: 'tenable-import', canActivate: [AuthGuard], component: TenableImportComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImportProcessingRoutingModule { }
