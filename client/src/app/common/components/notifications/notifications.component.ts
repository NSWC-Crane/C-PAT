/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { filter, map } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { NotificationService } from './notifications.service';

@Component({
  selector: 'cpat-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, TableModule, ToastModule, SelectModule, FormsModule, DatePipe]
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<any[]>([]);
  readonly filterStatus = signal<string>('Unread');
  readonly filteredNotifications = linkedSignal(() => {
    const notifications = this.notifications();
    const filterStatus = this.filterStatus();

    if (filterStatus === 'Read') {
      return notifications.filter((notification) => notification.read === 1);
    } else if (filterStatus === 'Unread') {
      return notifications.filter((notification) => notification.read === 0);
    }

    return [...notifications];
  });
  private readonly user = this.setPayloadService.user;
  readonly sortField = signal<string>('timestamp');
  readonly sortOrder = signal<number>(-1);
  sortOptions = [
    { label: 'Newest First', value: '!timestamp' },
    { label: 'Oldest First', value: 'timestamp' },
    { label: 'Title', value: 'title' }
  ];
  readonly sortKey = signal<string>('!timestamp');

  ngOnInit() {
    this.setPayload();
    this.fetchNotifications();
  }

  setPayload() {
    this.setPayloadService.accessLevel$
      .pipe(
        filter((level) => level > 0),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.fetchNotifications();
      });
  }

  fetchNotifications() {
    this.notificationService
      .getAllNotifications()
      .pipe(
        map((notifications) =>
          notifications.map((notification) => ({
            ...notification,
            messageParts: this.parseMessage(notification.message)
          }))
        )
      )
      .subscribe({
        next: (formattedNotifications) => {
          this.notifications.set(formattedNotifications);
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

  parseMessage(message: string): { before: string; poamId: number | null; href: string; after: string } {
    const match = /POAM (\d+)/.exec(message);

    if (!match) {
      return { before: message, poamId: null, href: '', after: '' };
    }

    const poamId = +match[1];

    return {
      before: message.slice(0, match.index),
      poamId,
      href: `${CPAT.Env.basePath ?? ''}poam-processing/poam-details/${poamId}`,
      after: message.slice(match.index + match[0].length)
    };
  }

  resetFilter() {
    this.filterStatus.set('Unread');
  }

  deleteNotification(notification: any) {
    this.notificationService.deleteNotification(notification.notificationId).subscribe({
      next: () => {
        this.notifications.update((current) => current.filter((item) => item !== notification));
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
    if (!this.user()?.userId) {
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
    if (!this.user()?.userId) {
      console.error('User ID is not available');

      return;
    }

    this.notificationService.deleteAllNotifications().subscribe({
      next: () => {
        this.fetchNotifications();
        this.notifications.set([{ title: 'You have no new notifications...', read: 1 }]);
        this.filteredNotifications.set([{ title: 'You have no new notifications...', read: 1 }]);
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
      this.sortOrder.set(-1);
      this.sortField.set(value.substring(1, value.length));
    } else {
      this.sortOrder.set(1);
      this.sortField.set(value);
    }
  }

  async navigateToPOAM(poamId: number) {
    try {
      globalThis.location.pathname = `${CPAT.Env.basePath ?? ''}poam-processing/poam-details/${poamId}`;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error navigating to POAM: ${getErrorMessage(error)}`
      });
    }
  }

  onPoamLinkClick(event: MouseEvent, poamId: number) {
    event.preventDefault();
    this.navigateToPOAM(poamId);
  }
}
