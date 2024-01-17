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
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssetProcessingComponent } from './asset-processing.component';
import { AssetProcessingRoutingModule } from './asset-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { AssetComponent } from './asset/asset.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbButtonModule, NbInputModule, NbCardModule,NbLayoutModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule, NbIconModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@NgModule({
  declarations: [
    AssetProcessingComponent,
    AssetComponent,
  ],
  imports: [
    InfiniteScrollModule,
    CommonModule,
    AssetProcessingRoutingModule,
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbIconModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTreeGridModule,
    Ng2SmartTableModule,
    SharedModule,
   
  ],
  exports: [
    // BilletTaskProcessComponent,
  ],
  entryComponents: [
    ConfirmationDialogComponent,

  ]
})
export class AssetProcessingModule { }
