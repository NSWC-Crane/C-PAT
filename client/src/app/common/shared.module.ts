/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  AsyncPipe,  
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { StatusDialogComponent } from './components/status-dialog/status-dialog.component';
import { NotificationsPanelComponent } from './components/notifications/notifications-popover/notifications-popover.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { VramPopupComponent } from './components/vram-popup/vram-popup.component';

@NgModule({
    imports: [
        ConfirmationDialogComponent,
        NotificationsComponent,
        NotificationsPanelComponent,
        StatusDialogComponent,
        VramPopupComponent,
    ],
    exports: [
        StatusDialogComponent,
        ConfirmationDialogComponent,
        NotificationsComponent,
        NotificationsPanelComponent,
        VramPopupComponent,
    ],
    providers: [CurrencyPipe, DatePipe, DecimalPipe, PercentPipe, AsyncPipe],
})
export class SharedModule {}
