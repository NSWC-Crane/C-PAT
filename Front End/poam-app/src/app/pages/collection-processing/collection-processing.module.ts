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
import { CollectionProcessingComponent } from './collection-processing.component';
import { CollectionProcessingRoutingModule } from './collection-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { CollectionComponent } from './collection/collection.component';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule, NbTableModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';

@NgModule({
  declarations: [
    CollectionProcessingComponent,
    CollectionComponent,
  ],
  imports: [
    CommonModule,
    CollectionProcessingRoutingModule,
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTableModule,
    NbTreeGridModule,
    Angular2SmartTableModule,
    SharedModule, 
  ]
})
export class CollectionProcessingModule { }
