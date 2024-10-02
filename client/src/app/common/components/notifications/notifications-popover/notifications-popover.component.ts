/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../notifications.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { Router } from '@angular/router';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subscription, firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PoamService } from '../../../../pages/poam-processing/poams.service';
import { UsersService } from '../../../../pages/admin-processing/user-processing/users.service';

@Component({
  selector: 'cpat-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  @Input() overlayPanel: OverlayPanel;
  notifications: any[] = [];
  public isLoggedIn = false;
  protected accessLevel: any;
  user: any;
  payload: any;
  poam: any;
  private payloadSubscription: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private setPayloadService: PayloadService,
    private poamService: PoamService,
    private userService: UsersService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.fetchNotifications();
        }
      }),
    );
  }

  closeOverlay() {
    if (this.overlayPanel) {
      this.overlayPanel.hide();
    }
  }

  async fetchNotifications() {
    (await this.notificationService.getUnreadNotifications()).subscribe(
      (notifications) => {
        this.notifications = notifications.map(notification => ({
          ...notification,
          formattedMessage: this.formatMessage(notification.message)
        }));
      },
      (error) => {
        console.error('Failed to fetch notifications:', error);
      },
    );
  }

  formatMessage(message: string): SafeHtml {
    const poamRegex = /POAM (\d+)/;
    const match = message.match(poamRegex);

    if (match) {
      const poamNumber = match[1];
      const formattedMessage = message.replace(
        poamRegex,
        `<a href="#" data-poam="${poamNumber}" class="poam-link">POAM ${poamNumber}</a>`
      );
      return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
    }

    return message;
  }

  async dismissNotification(notification: any) {
    (
      await this.notificationService.dismissNotification(
        notification.notificationId,
      )
    ).subscribe(
      () => {
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
      },
      (error) => {
        console.error('Failed to dismiss notification:', error);
      },
    );
  }

  async dismissAllNotifications() {
    (await this.notificationService.dismissAllNotifications()).subscribe(
      () => {
        this.notifications = [];
      },
      (error) => {
        console.error('Failed to dismiss all notifications:', error);
      },
    );
  }

  viewAllNotifications() {
    this.router.navigateByUrl('/notifications');
    this.closeOverlay();
  }

  async navigateToPOAM(poamId: string) {
    try {
      this.poam = await firstValueFrom(await this.poamService.getPoam(poamId));
      if (this.user.lastCollectionAccessedId !== this.poam?.collectionId) {
        const userUpdate = {
          userId: this.user.userId,
          lastCollectionAccessedId: this.poam?.collectionId,
        };

        const result = await firstValueFrom(
          await this.userService.updateUserLastCollection(userUpdate)
        );
        this.user = result;
      }
      window.location.pathname = `/poam-processing/poam-details/${poamId}`;
    } catch (error) {
      console.error('Error navigating to POAM:', error);
    }
    this.closeOverlay();
  }

  onNotificationClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('poam-link')) {
      event.preventDefault();
      const poamNumber = target.getAttribute('data-poam');
      if (poamNumber) {
        this.navigateToPOAM(poamNumber);
      }
    }
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
