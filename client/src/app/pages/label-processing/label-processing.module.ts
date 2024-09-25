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
import { SharedModule } from '../../common/shared.module';
import { LabelProcessingComponent } from './label-processing.component';
import { LabelProcessingRoutingModule } from './label-processing.routing';
import { LabelComponent } from './label/label.component';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';

@NgModule({
  declarations: [LabelProcessingComponent, LabelComponent],
  imports: [
    ButtonModule,
    CardModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    RippleModule,
    TableModule,
    TreeTableModule,
    CommonModule,
    LabelProcessingRoutingModule,
    FormsModule,
    SharedModule,
  ],
  exports: [],
})
export class LabelProcessingModule {}
