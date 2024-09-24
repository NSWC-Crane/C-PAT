/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import {
  AsyncPipe,
  CommonModule,
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { StatusDialogComponent } from './components/status-dialog/status-dialog.component';
import { NotificationsPanelComponent } from './components/notifications/notifications-popover/notifications-popover.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ListboxModule } from 'primeng/listbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { VramPopupComponent } from './components/vram-popup/vram-popup.component';
import { StepperModule } from 'primeng/stepper';
import { ImageModule } from 'primeng/image';

@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    NotificationsComponent,
    NotificationsPanelComponent,
    StatusDialogComponent,
    VramPopupComponent,
  ],
  imports: [
    ButtonModule,
    CardModule,
    DataViewModule,
    DialogModule,
    DropdownModule,
    StepperModule,
    ImageModule,
    ListboxModule,
    ProgressBarModule,
    CommonModule,
    FormsModule,
  ],
  exports: [
    StatusDialogComponent,
    ConfirmationDialogComponent,
    NotificationsComponent,
    NotificationsPanelComponent,
    VramPopupComponent,
    StepperModule,
  ],
  providers: [CurrencyPipe, DatePipe, DecimalPipe, PercentPipe, AsyncPipe],
})
export class SharedModule {}
