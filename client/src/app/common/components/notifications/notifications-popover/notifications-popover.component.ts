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
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { Popover } from 'primeng/popover';
import { filter, map } from 'rxjs';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { NotificationService } from '../notifications.service';

@Component({
  selector: 'cpat-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, FormsModule, ListboxModule, DatePipe]
})
export class NotificationsPanelComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly overlayPanel = input<Popover>(undefined);
  readonly notifications = signal<any[]>([]);

  ngOnInit() {
    this.setPayload();
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

  closeOverlay() {
    const overlayPanel = this.overlayPanel();

    if (overlayPanel) {
      overlayPanel.hide();
    }
  }

  fetchNotifications() {
    this.notificationService
      .getUnreadNotifications()
      .pipe(
        map((notifications) =>
          notifications.map((notification) => ({
            ...notification,
            messageParts: this.parseMessage(notification.message)
          }))
        )
      )
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
        },
        error: (error) => {
          console.error('Failed to fetch notifications:', error);
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

  dismissNotification(notification: any) {
    this.notificationService.dismissNotification(notification.notificationId).subscribe({
      next: () => {
        this.notifications.update((current) => current.filter((n) => n.notificationId !== notification.notificationId));
      },
      error: (error) => {
        console.error('Failed to dismiss notification:', error);
      }
    });
  }

  dismissAllNotifications() {
    this.notificationService.dismissAllNotifications().subscribe({
      next: () => {
        this.notifications.set([]);
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
      globalThis.location.pathname = `${CPAT.Env.basePath ?? ''}poam-processing/poam-details/${poamId}`;
    } catch (error) {
      console.error('Error navigating to POAM:', error);
    }

    this.closeOverlay();
  }

  onPoamLinkClick(event: MouseEvent, poamId: number) {
    event.preventDefault();
    this.navigateToPOAM(poamId);
  }
}
