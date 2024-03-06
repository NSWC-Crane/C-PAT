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
import { AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { NotFoundComponent } from '../Shared/components/not-found/not-found.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { StatusDialogComponent } from './components/status-dialog/status-dialog.component';
import { NbButtonModule, NbCardModule, NbWindowModule, NbDialogModule, NbIconModule, NbLayoutModule,
         NbProgressBarModule, NbSidebarModule, NbThemeModule, NbSelectModule, NbSpinnerModule, NbAlertModule, 
         NbTreeGridModule, NbRadioModule, NbDatepickerComponent, NbDatepickerModule, NbInputModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { SmartTableDatepickerComponent } from './components/smart-table/smart-table-datepicker.component';
import { FormsModule } from '@angular/forms';
import { SmartTableInputComponent } from './components/smart-table/smart-table-input.component';
import { SmartTableTextareaComponent } from './components/smart-table/smart-table-textarea.component';
import { SmartTableInputDisabledComponent } from './components/smart-table/smart-table-inputDisabled.component';
import { SmartTableSelectComponent } from './components/smart-table/smart-table-select.component';

@NgModule({
  declarations: [
    NotFoundComponent,
    ConfirmationDialogComponent,
    StatusDialogComponent,
    SmartTableDatepickerComponent,
    SmartTableInputComponent,
    SmartTableInputDisabledComponent,
    SmartTableSelectComponent,
    SmartTableTextareaComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbDatepickerModule,
    NbDialogModule,
    NbDialogModule.forChild(),
    NbEvaIconsModule,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbProgressBarModule,
    NbRadioModule,  
    NbSelectModule,
    NbSidebarModule,
    NbSpinnerModule,
    NbTreeGridModule,
    NbThemeModule,
    NbWindowModule.forChild(),
    Angular2SmartTableModule, 
  ],
  exports: [
    NotFoundComponent,
    ConfirmationDialogComponent,
    SmartTableDatepickerComponent,
    SmartTableInputComponent,
    SmartTableInputDisabledComponent,
    SmartTableSelectComponent,
    SmartTableTextareaComponent,
  ],
  providers: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe,
    AsyncPipe,
  ]
})
export class SharedModule { }
