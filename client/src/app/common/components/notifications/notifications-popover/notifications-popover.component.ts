/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../notifications.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { Router } from '@angular/router';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpat-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss']
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  @Input() overlayPanel: OverlayPanel;
  notifications: any[] = [];
  public isLoggedIn = false;
  protected accessLevel: any;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private setPayloadService: PayloadService,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.fetchNotifications();
        }
      })
    );
  }

  closeOverlay() {
    if (this.overlayPanel) {
      this.overlayPanel.hide();
    }
  }

  async fetchNotifications() {
    (await this.notificationService.getUnreadNotifications()).subscribe(
      notifications => {
        this.notifications = notifications;
      },
      error => {
        console.error('Failed to fetch notifications:', error);
      }
    );
  }

  async dismissNotification(notification: any) {
    (await this.notificationService.dismissNotification(notification.notificationId)).subscribe(
      () => {
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
      },
      error => {
        console.error('Failed to dismiss notification:', error);
      }
    );
  }

  async dismissAllNotifications() {
    (await this.notificationService.dismissAllNotifications()).subscribe(
      () => {
        this.notifications = [];
      },
      error => {
        console.error('Failed to dismiss all notifications:', error);
      }
    );
  }

  viewAllNotifications() {
    this.router.navigateByUrl('/notifications');
    this.closeOverlay();
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
