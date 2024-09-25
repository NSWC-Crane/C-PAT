/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { SharedModule } from '../../common/shared.module';
import { AssetProcessingComponent } from './asset-processing.component';
import { AssetProcessingRoutingModule } from './asset-processing.routing';
import { AssetComponent } from './asset/asset.component';

import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ImportProcessingModule } from '../import-processing/import-processing.module';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [AssetProcessingComponent, AssetComponent],
  imports: [
    CommonModule,
    ImportProcessingModule,
    AssetProcessingRoutingModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    TooltipModule,
    ToastModule,
    TabViewModule,
    DialogModule,
    SharedModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
    ConfirmationService,
    MessageService,
  ],
})
export class AssetProcessingModule {}
