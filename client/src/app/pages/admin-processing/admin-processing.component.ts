/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { UsersService } from './user-processing/users.service';
import { Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { AssignedTeamProcessingComponent } from './assignedTeam-processing/assignedTeam-processing.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AAPackageProcessingComponent } from './aaPackage-processing/aaPackage-processing.component';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping/nessus-plugin-mapping.component';
import { VRAMImportComponent } from './vram-import/vram-import.component';
//import { AssetDeltaComponent } from './asset-delta/asset-delta.component';
import { TenableAdminComponent } from './tenable-admin/tenable-admin.component';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { ButtonModule } from 'primeng/button';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss'],
  standalone: true,
  imports: [
    AAPackageProcessingComponent,
    AssignedTeamProcessingComponent,
    ButtonModule,
    CollectionProcessingComponent,
    CommonModule,
    FormsModule,
    NessusPluginMappingComponent,
    STIGManagerAdminComponent,
    TabsModule,
    TenableAdminComponent,
    UserProcessingComponent,
    //AssetDeltaComponent,
    VRAMImportComponent,
  ],
})
export class AdminProcessingComponent implements OnInit {
  value: number = 0;
  user: any;
  private destroy$ = new Subject<void>();
  tenableEnabled = CPAT.Env.features.tenableEnabled;
  constructor(
    private userService: UsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = null;
    this.userService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.user = response;
        if (!this.user.isAdmin) {
          this.router.navigate(['/403']);
        }
      },
      error: error => {
        console.error('An error occurred:', error.message);
      }
    });
  }

  navigateToAppInfo() {
    this.router.navigate(['/admin-processing/app-info']);
  }

  switchToPluginMapping() {
    this.value = 6;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
