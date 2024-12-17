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
import { Subscription, firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { PoamService } from '../../../pages/poam-processing/poams.service';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';

@Component({
  selector: 'cpat-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    DataViewModule,
    DropdownModule,
    FormsModule,
  ],
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
  layout: 'list' | 'grid' = 'list';
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
    private router: Router,
    private poamService: PoamService,
    private userService: UsersService
  ) { }

  async ngOnInit() {
    await this.setPayload();
    await this.fetchNotifications();
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

  async fetchNotifications() {
    try {
      const notifications = await firstValueFrom(
        await this.notificationService.getAllNotifications(),
      );
      this.notifications = notifications.map(notification => ({
        ...notification,
        formattedMessage: this.formatMessage(notification.message)
      }));
      this.filterNotifications();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
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
        (notification) => notification.read === 1,
      );
    } else if (this.filterStatus === 'Unread') {
      this.filteredNotifications = this.notifications.filter(
        (notification) => notification.read === 0,
      );
    } else {
      this.filteredNotifications = [...this.notifications];
    }
  }

  resetFilter() {
    this.filterStatus = 'Unread';
    this.filterNotifications();
  }

  async deleteNotification(notification: any) {
    try {
      await firstValueFrom(
        await this.notificationService.deleteNotification(
          notification.notificationId,
        ),
      );
      const index = this.notifications.indexOf(notification);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
      this.fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  async dismissAllNotifications() {
    if (!this.user?.userId) {
      console.error('User ID is not available');
      return;
    }
    try {
      await firstValueFrom(
        await this.notificationService.dismissAllNotifications(),
      );
      this.fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }

  async deleteAllNotifications() {
    if (!this.user?.userId) {
      console.error('User ID is not available');
      return;
    }
    try {
      await firstValueFrom(
        await this.notificationService.deleteAllNotifications(),
      );
      this.fetchNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
    this.notifications = [
      { title: 'You have no new notifications...', read: 1 },
    ];
    this.filteredNotifications = [
      { title: 'You have no new notifications...', read: 1 },
    ];
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
