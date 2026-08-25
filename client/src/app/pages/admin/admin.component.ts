/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { filter } from 'rxjs';
import { PayloadService } from '../../common/services/setPayload.service';
import { AAPackagesComponent } from './aa-packages/aa-packages.component';
import { AppConfigurationComponent } from './app-configuration/app-configuration.component';
import { AssetDeltaComponent } from './asset-delta/asset-delta.component';
import { AssignedTeamsComponent } from './assigned-teams/assigned-teams.component';
import { CollectionsComponent } from './collections/collections.component';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping/nessus-plugin-mapping.component';
import { UsersComponent } from './users/users.component';
import { VRAMImportComponent } from './vram-import/vram-import.component';

@Component({
  selector: 'cpat-admin',
  templateUrl: './admin.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AAPackagesComponent, AppConfigurationComponent, AssignedTeamsComponent, ButtonModule, CollectionsComponent, FormsModule, NessusPluginMappingComponent, TabsModule, UsersComponent, AssetDeltaComponent, VRAMImportComponent]
})
export class AdminComponent implements OnInit {
  private readonly payloadService = inject(PayloadService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly nessusPluginMappingComponent = viewChild(NessusPluginMappingComponent);
  readonly usersComponent = viewChild(UsersComponent);
  readonly value = signal(0);
  tenableEnabled = CPAT.Env.features.tenableEnabled;

  ngOnInit() {
    this.payloadService.isAdmin$
      .pipe(
        filter((isAdmin) => isAdmin !== null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (isAdmin) => {
          if (!isAdmin) {
            this.router.navigate(['/403']);
          }
        }
      });
  }

  navigateToAppInfo() {
    this.router.navigate(['/admin/app-info']);
  }

  switchToPluginMapping() {
    this.value.set(4);

    setTimeout(() => {
      const nessusPluginMappingComponent = this.nessusPluginMappingComponent();

      if (nessusPluginMappingComponent) {
        nessusPluginMappingComponent.updatePluginIds();
      }
    }, 0);
  }

  openUserInUserManagement(userId: number) {
    this.value.set(0);

    setTimeout(() => {
      this.usersComponent()?.openUserById(userId);
    }, 0);
  }
}
