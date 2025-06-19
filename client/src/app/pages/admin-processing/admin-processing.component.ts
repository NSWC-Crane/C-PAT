/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { Subject, takeUntil } from 'rxjs';
import { getErrorMessage } from '../../common/utils/error-utils';
import { AAPackageProcessingComponent } from './aaPackage-processing/aaPackage-processing.component';
import { AppConfigurationComponent } from './app-configuration/app-configuration.component';
import { AssetDeltaComponent } from './asset-delta/asset-delta.component';
import { AssignedTeamProcessingComponent } from './assignedTeam-processing/assignedTeam-processing.component';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping/nessus-plugin-mapping.component';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { TenableAdminComponent } from './tenable-admin/tenable-admin.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { UsersService } from './user-processing/users.service';
import { VRAMImportComponent } from './vram-import/vram-import.component';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss'],
  standalone: true,
  imports: [
    AAPackageProcessingComponent,
    AppConfigurationComponent,
    AssignedTeamProcessingComponent,
    ButtonModule,
    CollectionProcessingComponent,
    FormsModule,
    NessusPluginMappingComponent,
    STIGManagerAdminComponent,
    TabsModule,
    ToastModule,
    TenableAdminComponent,
    UserProcessingComponent,
    AssetDeltaComponent,
    VRAMImportComponent
  ],
  providers: [MessageService]
})
export class AdminProcessingComponent implements OnInit, OnDestroy {
  private userService = inject(UsersService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  value: number = 0;
  user: any;
  private destroy$ = new Subject<void>();
  tenableEnabled = CPAT.Env.features.tenableEnabled;

  ngOnInit() {
    this.user = null;
    this.userService
      .getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.user = response;

          if (!this.user.isAdmin) {
            this.router.navigate(['/403']);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `An error occurred: ${getErrorMessage(error)}`
          });
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
