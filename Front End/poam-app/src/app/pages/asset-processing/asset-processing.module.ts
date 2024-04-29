/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule, NbSelectModule, NbSpinnerModule, NbTableModule, NbTabsetModule, NbTooltipModule, NbTreeGridModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '../../Shared/shared.module';
import { AssetProcessingComponent } from './asset-processing.component';
import { AssetProcessingRoutingModule } from './asset-processing.routing';
import { AssetComponent } from './asset/asset.component';

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
    NbTableModule,
    NbCardModule,
    NbInputModule,
    NbIconModule,
    NbFormFieldModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbTooltipModule,
    NbTreeGridModule,
    Angular2SmartTableModule,
    SharedModule,
   
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
  ],
})
export class AssetProcessingModule { }
