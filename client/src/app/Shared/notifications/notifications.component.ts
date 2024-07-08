/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { NotificationService } from './notifications.service';
import { SubSink } from 'subsink';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { firstValueFrom } from 'rxjs';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  filterStatus: string = 'Unread';
  public isLoggedIn = false;
  user: any;
  payload: any;
  private subs = new SubSink();
  layout: 'list' | 'grid' = 'list';
  sortField: string = 'timestamp';
  sortOrder: number = -1;
  sortOptions = [
    { label: 'Newest First', value: '!timestamp' },
    { label: 'Oldest First', value: 'timestamp' },
    { label: 'Title', value: 'title' }
  ];
  sortKey: string = '!timestamp';

  constructor(
    private notificationService: NotificationService,
    private userService: UsersService,
  ) { }

  async ngOnInit() {
    await this.setPayload();
    await this.fetchNotifications();
  }

  async setPayload() {
    this.user = null;
    this.payload = null;
    try {
      const response: any = await firstValueFrom(await this.userService.getCurrentUser());
      if (response && response.userId) {
        this.user = response;

        if (this.user.accountStatus === 'ACTIVE') {
          this.payload = {
            ...this.user,
            collections: this.user.permissions.map(
              (permission: Permission) => ({
                collectionId: permission.collectionId,
                accessLevel: permission.accessLevel,
              })
            ),
          };
          await this.fetchNotifications();
        }
      } else {
        console.error('User data is not available or user is not active');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  async fetchNotifications() {
    try {
      const notifications = await firstValueFrom(await this.notificationService.getAllNotificationsByUserId(this.user.userId));
      this.notifications = notifications;
      this.filterNotifications();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  filterNotifications() {
    if (this.filterStatus === 'Read') {
      this.filteredNotifications = this.notifications.filter(notification => notification.read === 1);
    } else if (this.filterStatus === 'Unread') {
      this.filteredNotifications = this.notifications.filter(notification => notification.read === 0);
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
      await firstValueFrom(await this.notificationService.deleteNotificationByNotificationId(notification.notificationId));
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
    if (!this.user || !this.user.userId) {
      console.error('User ID is not available');
      return;
    }
    try {
      await firstValueFrom(await this.notificationService.dismissAllNotificationsByUserId(this.user.userId));
      this.fetchNotifications();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }

  async deleteAllNotifications() {
    if (!this.user || !this.user.userId) {
      console.error('User ID is not available');
      return;
    }
    try {
      await firstValueFrom(await this.notificationService.deleteAllNotificationsByUserId(this.user.userId));
      this.fetchNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
    this.notifications = [{ title: "You have no new notifications...", read: 1 }];
    this.filteredNotifications = [{ title: "You have no new notifications...", read: 1 }];
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

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
