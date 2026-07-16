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
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs';
import { PayloadService } from '../../common/services/setPayload.service';
import { AAPackageProcessingComponent } from './aaPackage-processing/aaPackage-processing.component';
import { AppConfigurationComponent } from './app-configuration/app-configuration.component';
import { AssetDeltaComponent } from './asset-delta/asset-delta.component';
import { AssignedTeamProcessingComponent } from './assignedTeam-processing/assignedTeam-processing.component';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping/nessus-plugin-mapping.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { VRAMImportComponent } from './vram-import/vram-import.component';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AAPackageProcessingComponent,
    AppConfigurationComponent,
    AssignedTeamProcessingComponent,
    ButtonModule,
    CollectionProcessingComponent,
    FormsModule,
    NessusPluginMappingComponent,
    TabsModule,
    ToastModule,
    UserProcessingComponent,
    AssetDeltaComponent,
    VRAMImportComponent
  ]
})
export class AdminProcessingComponent implements OnInit {
  private readonly payloadService = inject(PayloadService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly nessusPluginMappingComponent = viewChild(NessusPluginMappingComponent);
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
    this.router.navigate(['/admin-processing/app-info']);
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
}
