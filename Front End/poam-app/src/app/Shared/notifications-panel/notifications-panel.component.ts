/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component } from '@angular/core';

interface Notification {
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
}

@Component({
  selector: 'cpat-notifications-panel',
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss']
})
export class NotificationsPanelComponent {
  notifications: Notification[] = [
    {
      title: 'Notification 1',
      message: 'something something something something something something something something something something something something something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 2',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 3',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
    {
      title: 'Notification 1',
      message: 'something something something',
      icon: 'calendar-outline',
      timestamp: new Date()
    },
  ];

  dismissNotification(notification: Notification) {
    const index = this.notifications.indexOf(notification);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }
}
