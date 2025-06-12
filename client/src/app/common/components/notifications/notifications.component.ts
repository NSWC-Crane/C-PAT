/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from './notifications.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { Subscription, map } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { getErrorMessage } from '../../../common/utils/error-utils';

@Component({
  selector: 'cpat-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [ButtonModule, CardModule, CommonModule, TableModule, ToastModule, Select, FormsModule],
  providers: [MessageService]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  filterStatus: string = 'Unread';
  public isLoggedIn = false;
  protected accessLevel: any;
  user: any;
  payload: any;
  poam: any;
  private payloadSubscription: Subscription[] = [];
  layout: 'list' | 'grid grid-cols-12 gap-4' = 'list';
  sortField: string = 'timestamp';
  sortOrder: number = -1;
  sortOptions = [
    { label: 'Newest First', value: '!timestamp' },
    { label: 'Oldest First', value: 'timestamp' },
    { label: 'Title', value: 'title' },
  ];
  sortKey: string = '!timestamp';

  constructor(
    private notificationService: NotificationService,
    private setPayloadService: PayloadService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.setPayload();
    this.fetchNotifications();
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

    fetchNotifications() {
        this.notificationService.getAllNotifications().pipe(
            map(notifications =>
                notifications.map(notification => ({
                    ...notification,
                    formattedMessage: this.formatMessage(notification.message),
                }))
            )
        ).subscribe({
            next: (formattedNotifications) => {
                this.notifications = formattedNotifications;
                this.filterNotifications();
            },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to fetch notifications: ${getErrorMessage(error)}`
            });
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
        `<a href="#" data-poam="${poamNumber}" class="poam-link">POAM ${poamNumber}</a>`
      );
      return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
    }

    return message;
  }

  filterNotifications() {
    if (this.filterStatus === 'Read') {
      this.filteredNotifications = this.notifications.filter(
        notification => notification.read === 1
      );
    } else if (this.filterStatus === 'Unread') {
      this.filteredNotifications = this.notifications.filter(
        notification => notification.read === 0
      );
    } else {
      this.filteredNotifications = [...this.notifications];
    }
  }

  resetFilter() {
    this.filterStatus = 'Unread';
    this.filterNotifications();
  }

    deleteNotification(notification: any) {
        this.notificationService.deleteNotification(notification.notificationId).subscribe({
            next: () => {
                const index = this.notifications.indexOf(notification);
                if (index !== -1) {
                    this.notifications.splice(index, 1);
                }
                this.fetchNotifications();
            },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to delete notification: ${getErrorMessage(error)}`
            });
            }
        });
    }

    dismissAllNotifications() {
        if (!this.user?.userId) {
            console.error('User ID is not available');
            return;
        }

        this.notificationService.dismissAllNotifications().subscribe({
            next: () => {
                this.fetchNotifications();
            },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to dismiss all notifications: ${getErrorMessage(error)}`
            });
            }
        });
    }


    deleteAllNotifications() {
        if (!this.user?.userId) {
            console.error('User ID is not available');
            return;
        }

        this.notificationService.deleteAllNotifications().subscribe({
            next: () => {
                this.fetchNotifications();
                this.notifications = [{ title: 'You have no new notifications...', read: 1 }];
                this.filteredNotifications = [{ title: 'You have no new notifications...', read: 1 }];
            },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to delete all notifications: ${getErrorMessage(error)}`
            });
            }
        });
    }


  onSortChange(event: any) {
    const value = event.value;

    if (value.indexOf('!') === 0) {
      this.sortOrder = -1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = 1;
      this.sortField = value;
    }
  }

  async navigateToPOAM(poamId: number) {
    try {
      window.location.pathname = `/poam-processing/poam-details/${poamId}`;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error navigating to POAM: ${getErrorMessage(error)}`
      });
    }
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
