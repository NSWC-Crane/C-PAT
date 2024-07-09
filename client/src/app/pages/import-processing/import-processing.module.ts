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

import { SharedModule } from '../../Shared/shared.module';
import { STIGManagerImportComponent } from './stigmanager-import/stigmanager-import.component';
import { TenableImportComponent } from './tenable-import/tenable-import.component';
import { ImportProcessingRoutingModule } from './import-processing-routing.module';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { TreeTableModule } from 'primeng/treetable';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';

@NgModule({
  declarations: [
    STIGManagerImportComponent,
    TenableImportComponent,
  ],
  imports: [
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TooltipModule,
    TabViewModule,
    TreeTableModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    RippleModule,
    CommonModule,
    FormsModule,
    ImportProcessingRoutingModule,
    SharedModule,
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
})
export class ImportProcessingModule { }
