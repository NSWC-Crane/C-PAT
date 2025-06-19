/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { Popover } from 'primeng/popover';
import { Subscription, map } from 'rxjs';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { NotificationService } from '../notifications.service';

@Component({
  selector: 'cpat-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
  standalone: true,
  imports: [ButtonModule, CommonModule, FormsModule, ListboxModule],
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  @Input() overlayPanel: Popover;
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
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    this.setPayloadService.setPayload();
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

    fetchNotifications() {
        this.notificationService.getUnreadNotifications().pipe(
            map(notifications =>
                notifications.map(notification => ({
                    ...notification,
                    formattedMessage: this.formatMessage(notification.message),
                }))
            )
        ).subscribe({
            next: (notifications) => {
                this.notifications = notifications;
            },
            error: (error) => {
                console.error('Failed to fetch notifications:', error);
            }
        });
    }

  formatMessage(message: string): SafeHtml {
    const poamRegex = /POAM (\d+)/;
    const match = message.match(poamRegex);
    if (match) {
      const poamNumber = match[1];
      const formattedMessage = message.replace(
        poamRegex,
        `<a href="${CPAT.Env.basePath}poam-processing/poam-details/${poamNumber}" data-poam="${poamNumber}" class="poam-link">POAM ${poamNumber}</a>`
      );
      return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
    }
    return message;
  }

    dismissNotification(notification: any) {
        this.notificationService.dismissNotification(notification.notificationId).subscribe({
            next: () => {
                const index = this.notifications.indexOf(notification);
                if (index !== -1) {
                    this.notifications.splice(index, 1);
                }
            },
            error: (error) => {
                console.error('Failed to dismiss notification:', error);
            }
        });
    }

    dismissAllNotifications() {
        this.notificationService.dismissAllNotifications().subscribe({
            next: () => {
                this.notifications = [];
            },
            error: (error) => {
                console.error('Failed to dismiss all notifications:', error);
            }
        });
    }

  viewAllNotifications() {
    this.router.navigateByUrl('/notifications');
    this.closeOverlay();
  }

  async navigateToPOAM(poamId: number) {
    try {
      window.location.pathname = `${CPAT.Env.basePath}poam-processing/poam-details/${poamId}`;
    } catch (error) {
      console.error('Error navigating to POAM:', error);
    }
    this.closeOverlay();
  }

  onNotificationClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('poam-link')) {
      event.preventDefault();
      const poamId = target.getAttribute('data-poam');
      if (poamId) {
        this.navigateToPOAM(+poamId);
      }
    }
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
