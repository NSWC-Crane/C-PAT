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

import { SharedModule } from '../../common/shared.module';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { TenableAdminComponent } from './tenable-admin/tenable-admin.component';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { UserComponent } from './user-processing/user/user.component';
import { AdminProcessingRoutingModule } from './admin-processing-routing.module';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { CollectionComponent } from './collection-processing/collection/collection.component';
import { AdminProcessingComponent } from './admin-processing.component';
import { EmassImportComponent } from './emass-import/emass-import.component';
import { VRAMImportComponent } from './vram-import/vram-import.component';
import { NessusPluginMappingComponent } from './nessus-plugin-mapping/nessus-plugin-mapping.component';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TreeTableModule } from 'primeng/treetable';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { MessageModule } from 'primeng/message';

@NgModule({
  declarations: [
    CollectionProcessingComponent,
    CollectionComponent,
    STIGManagerAdminComponent,
    TenableAdminComponent,
    UserProcessingComponent,
    UserComponent,
    AdminProcessingComponent,
    EmassImportComponent,
    VRAMImportComponent,
    NessusPluginMappingComponent,
  ],
  imports: [
    BadgeModule,
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    TabViewModule,
    FileUploadModule,
    ProgressBarModule,
    DropdownModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    InputSwitchModule,
    InputTextareaModule,
    IconFieldModule,
    InputIconModule,
    TableModule,
    ToggleButtonModule,
    TreeTableModule,
    MessageModule,
    AdminProcessingRoutingModule,
    CommonModule,
    FormsModule,
    SharedModule,
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  exports: [
    CollectionProcessingComponent,
    CollectionComponent,
    STIGManagerAdminComponent,
    UserProcessingComponent,
    UserComponent,
  ],
})
export class AdminProcessingModule { }
