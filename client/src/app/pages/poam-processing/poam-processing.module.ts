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
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PoamAdvancedPieComponent } from './poam-components/poam-advanced-pie/poam-advanced-pie.component';
import { PoamAssignedGridComponent } from './poam-components/poam-assigned-grid/poam-assigned-grid.component';
import { PoamGridComponent } from './poam-components/poam-grid/poam-grid.component';
import { PoamMainchartComponent } from './poam-components/poam-mainchart/poam-mainchart.component';
import { PoamApproveComponent } from './poam-approve/poam-approve.component';
import { PoamAttachmentsComponent } from './poam-components/poam-attachments/poam-attachments.component';
import { PoamDetailsComponent } from './poam-details/poam-details.component';
import { PoamExtendComponent } from './poam-extend/poam-extend.component';
import { PoamLogComponent } from './poam-log/poam-log.component';
import { PoamManageComponent } from './poam-manage/poam-manage.component';
import { PoamsComponent } from './poams.component';
import { PoamProcessingRoutingModule } from './poam-processing-routing.module';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Footer, MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { MultiSelectModule } from 'primeng/multiselect';
import { SplitterModule } from 'primeng/splitter';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ImportProcessingModule } from '../import-processing/import-processing.module';

@NgModule({
  declarations: [
    PoamApproveComponent,
    PoamAttachmentsComponent,
    PoamDetailsComponent,
    PoamExtendComponent,
    PoamLogComponent,
    PoamManageComponent,
    PoamsComponent,
    PoamAdvancedPieComponent,
    PoamAssignedGridComponent,
    PoamGridComponent,
    PoamMainchartComponent,
  ],
  imports: [
    AutoCompleteModule,
    BadgeModule,
    ButtonModule,
    CalendarModule,
    CardModule,
    ConfirmDialogModule,
    CheckboxModule,
    DialogModule,
    DropdownModule,
    FileUploadModule,
    Footer,
    InputSwitchModule,
    InputTextModule,
    InputTextareaModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    SplitterModule,
    StepperModule,
    TableModule,
    TabViewModule,
    TagModule,
    TooltipModule,
    ToastModule,
    CommonModule,
    FormsModule,
    RouterModule,
    NgxChartsModule,
    PoamProcessingRoutingModule,
    ImportProcessingModule,
  ],
  providers: [provideCharts(withDefaultRegisterables()), MessageService],
  exports: [
    PoamAdvancedPieComponent,
    PoamAssignedGridComponent,
    PoamGridComponent,
    PoamMainchartComponent,
  ],
})
export class PoamProcessingModule {}
