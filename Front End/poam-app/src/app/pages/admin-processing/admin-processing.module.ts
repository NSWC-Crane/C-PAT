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
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTableModule,
  NbTabsetModule,
  NbToggleModule,
  NbTooltipModule,
  NbTreeGridModule,
} from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { SharedModule } from '../../Shared/shared.module';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { UserComponent } from './user-processing/user/user.component';
import { AdminProcessingRoutingModule } from './admin-processing-routing.module';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { CollectionComponent } from './collection-processing/collection/collection.component';
import { AdminProcessingComponent } from './admin-processing.component';
import { StatusCardComponent } from '../../Shared/components/status-card/status-card.component';

@NgModule({
  declarations: [
    CollectionProcessingComponent,
    CollectionComponent,
    STIGManagerAdminComponent,
    UserProcessingComponent,
    UserComponent,
    AdminProcessingComponent,
    StatusCardComponent,
  ],
  imports: [
    AdminProcessingRoutingModule,
    CommonModule,
    FormsModule,
    NbAutocompleteModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbIconModule,
    NbInputModule,
    NbFormFieldModule,
    NbLayoutModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTableModule,
    NbTabsetModule,
    NbToggleModule,
    NbTooltipModule,
    NbTreeGridModule,
    Angular2SmartTableModule,
    SharedModule,
  ],
  providers: [],
  exports: [
    CollectionProcessingComponent,
    CollectionComponent,
    STIGManagerAdminComponent,
    UserProcessingComponent,
    UserComponent,
  ],
})
export class AdminProcessingModule { }
