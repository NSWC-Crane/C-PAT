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
import { NbCardModule, NbWindowModule, NbDialogModule, NbIconModule, NbLayoutModule,NbSidebarModule, NbThemeModule, 
  NbSelectModule, NbSpinnerModule, NbAlertModule, NbTreeGridModule, NbRadioModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    NotFoundComponent,
    ConfirmationDialogComponent,
  ],
  imports: [
    CommonModule,
    NbAlertModule,
    NbCardModule,
    NbDialogModule,
    NbEvaIconsModule,
    NbIconModule,
    NbLayoutModule,
    NbRadioModule,  
    NbSelectModule,
    NbSidebarModule,
    NbSpinnerModule,
    NbTreeGridModule,
    NbThemeModule,
    NbWindowModule.forChild(),
    Ng2SmartTableModule, 
  ],
  exports: [
    NotFoundComponent,
    ConfirmationDialogComponent,

  ],
  providers: [
    // pipes for dynamic.pipe must be listed here
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe,
    AsyncPipe,
  ],
})
export class SharedModule { }
