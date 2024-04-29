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
import { NotificationService } from '../notifications.service';
import { SubSink } from 'subsink';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { Router } from '@angular/router';

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss']
})
export class NotificationsPanelComponent implements OnInit {
  notifications: any[] = [];
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  user: any;
  payload: any;
  private subs = new SubSink();

  constructor(
    private notificationService: NotificationService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.isLoggedIn = this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.setPayload();
    }
  }

  setPayload() {
    this.user = null;
    this.payload = null;
    this.subs.sink = this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
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
            this.fetchNotifications();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }

  fetchNotifications() {
    this.notificationService.getUnreadNotificationsByUserId(this.user.userId).subscribe(
      notifications => {
        notifications.length >= 1 ?
          (this.notifications = notifications) :
          (this.notifications = [{ title: "No new notifications.." }]);
      },
      error => {
        console.error('Failed to fetch notifications:', error);
      }
    );
  }

  dismissNotification(notification: any) {
    console.log(notification);
    this.notificationService.dismissNotificationByNotificationId(notification.notificationId).subscribe(
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

  dismissAllNotifications() {
    this.notificationService.dismissAllNotificationsByUserId(this.user.userId).subscribe(
      () => {   
      },
      error => {
        console.error('Failed to dismiss notification:', error);
      }
    );
    this.notifications = [{
      title: "No new notifications..",
}];
  }

  viewAllNotifications() {
    this.router.navigateByUrl('/notifications');
  }
}
