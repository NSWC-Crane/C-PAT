/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { NotificationsComponent } from './notifications.component';
import { NotificationService } from './notifications.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { MessageService } from 'primeng/api';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

beforeAll(() => {
  (globalThis as any).CPAT = {
    Env: {
      basePath: '/',
      apiBase: '/api'
    }
  };
});

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let mockNotificationService: {
    getAllNotifications: ReturnType<typeof vi.fn>;
    deleteNotification: ReturnType<typeof vi.fn>;
    dismissAllNotifications: ReturnType<typeof vi.fn>;
    deleteAllNotifications: ReturnType<typeof vi.fn>;
  };
  let mockPayloadService: {
    setPayload: ReturnType<typeof vi.fn>;
    user$: BehaviorSubject<any>;
    payload$: BehaviorSubject<any>;
    accessLevel$: BehaviorSubject<number>;
  };
  let mockMessageService: {
    add: ReturnType<typeof vi.fn>;
    messageObserver: Subject<any>;
    clearObserver: Subject<any>;
  };

  const mockNotifications = [
    {
      notificationId: 1,
      title: 'Test Notification 1',
      message: 'This is a test message for POAM 123',
      read: 0,
      timestamp: new Date().toISOString()
    },
    {
      notificationId: 2,
      title: 'Test Notification 2',
      message: 'This is another test message',
      read: 1,
      timestamp: new Date().toISOString()
    },
    {
      notificationId: 3,
      title: 'Test Notification 3',
      message: 'Unread notification',
      read: 0,
      timestamp: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    mockNotificationService = {
      getAllNotifications: vi.fn().mockReturnValue(of(mockNotifications)),
      deleteNotification: vi.fn().mockReturnValue(of({})),
      dismissAllNotifications: vi.fn().mockReturnValue(of({})),
      deleteAllNotifications: vi.fn().mockReturnValue(of({}))
    };

    mockPayloadService = {
      setPayload: vi.fn(),
      user$: new BehaviorSubject({ userId: 1, userName: 'testuser' }),
      payload$: new BehaviorSubject({}),
      accessLevel$: new BehaviorSubject(1)
    };

    mockMessageService = {
      add: vi.fn(),
      messageObserver: new Subject<any>(),
      clearObserver: new Subject<any>()
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent, NoopAnimationsModule],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default filterStatus of Unread', () => {
      expect(component.filterStatus).toBe('Unread');
    });

    it('should have default layout of list', () => {
      expect(component.layout).toBe('list');
    });

    it('should have default sortField of timestamp', () => {
      expect(component.sortField).toBe('timestamp');
    });

    it('should have default sortOrder of -1 (descending)', () => {
      expect(component.sortOrder).toBe(-1);
    });

    it('should have default sortKey of !timestamp', () => {
      expect(component.sortKey).toBe('!timestamp');
    });

    it('should have sortOptions defined', () => {
      expect(component.sortOptions).toEqual([
        { label: 'Newest First', value: '!timestamp' },
        { label: 'Oldest First', value: 'timestamp' },
        { label: 'Title', value: 'title' }
      ]);
    });
  });

  describe('setPayload', () => {
    it('should call setPayload on PayloadService', () => {
      component.setPayload();
      expect(mockPayloadService.setPayload).toHaveBeenCalled();
    });

    it('should subscribe to user$', () => {
      component.setPayload();
      expect(component.user).toEqual({ userId: 1, userName: 'testuser' });
    });

    it('should subscribe to payload$', () => {
      component.setPayload();
      expect(component.payload).toEqual({});
    });

    it('should fetch notifications when accessLevel > 0', () => {
      component.setPayload();
      expect(mockNotificationService.getAllNotifications).toHaveBeenCalled();
    });

    it('should not fetch notifications when accessLevel is 0', () => {
      mockPayloadService.accessLevel$ = new BehaviorSubject(0);
      mockNotificationService.getAllNotifications.mockClear();
      component.setPayload();
      expect(mockNotificationService.getAllNotifications).not.toHaveBeenCalled();
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch and format notifications', () => {
      component.fetchNotifications();

      expect(component.notifications.length).toBe(3);
      expect(component.notifications[0].formattedMessage).toBeTruthy();
    });

    it('should filter notifications after fetching', () => {
      component.fetchNotifications();

      expect(component.filteredNotifications.length).toBe(2);
    });

    it('should show error message on fetch failure', () => {
      mockNotificationService.getAllNotifications.mockReturnValue(throwError(() => new Error('Fetch failed')));

      component.fetchNotifications();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });

    it('should handle empty notifications array', () => {
      mockNotificationService.getAllNotifications.mockReturnValue(of([]));

      component.fetchNotifications();

      expect(component.notifications).toEqual([]);
      expect(component.filteredNotifications).toEqual([]);
    });

    it('should handle notification without timestamp', () => {
      mockNotificationService.getAllNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message: 'Test message', read: 0 }]));

      component.fetchNotifications();

      expect(component.notifications.length).toBe(1);
    });
  });

  describe('formatMessage', () => {
    it('should format message with POAM link', () => {
      const message = 'This is a test message for POAM 123';
      const result = component.formatMessage(message);

      expect(result.toString()).toContain('POAM 123');
    });

    it('should return plain message when no POAM reference', () => {
      const message = 'This is a plain message';
      const result = component.formatMessage(message);

      expect(result).toBe(message);
    });

    it('should handle multiple digit POAM numbers', () => {
      const message = 'Check POAM 12345 for details';
      const result = component.formatMessage(message);

      expect(result.toString()).toContain('12345');
    });
  });

  describe('filterNotifications', () => {
    beforeEach(() => {
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
    });

    it('should filter to show only unread notifications by default', () => {
      component.filterStatus = 'Unread';
      component.filterNotifications();
      expect(component.filteredNotifications.every((n) => n.read === 0)).toBe(true);
    });

    it('should filter to show only read notifications', () => {
      component.filterStatus = 'Read';
      component.filterNotifications();
      expect(component.filteredNotifications.every((n) => n.read === 1)).toBe(true);
    });

    it('should show all notifications when filter is All', () => {
      component.filterStatus = 'All';
      component.filterNotifications();
      expect(component.filteredNotifications.length).toBe(3);
    });
  });

  describe('resetFilter', () => {
    beforeEach(() => {
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
    });

    it('should reset filterStatus to Unread', () => {
      component.filterStatus = 'All';
      component.resetFilter();
      expect(component.filterStatus).toBe('Unread');
    });

    it('should call filterNotifications after reset', () => {
      const filterSpy = vi.spyOn(component, 'filterNotifications');

      component.resetFilter();
      expect(filterSpy).toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
    });

    it('should call deleteNotification service method', () => {
      const notification = component.notifications[0];

      component.deleteNotification(notification);
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(notification.notificationId);
    });

    it('should refresh notifications after deletion', () => {
      const notification = component.notifications[0];

      mockNotificationService.getAllNotifications.mockClear();

      component.deleteNotification(notification);

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalled();
    });

    it('should show error message on delete failure', () => {
      mockNotificationService.deleteNotification.mockReturnValue(throwError(() => new Error('Delete failed')));
      const notification = component.notifications[0];

      component.deleteNotification(notification);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });
  });

  describe('dismissAllNotifications', () => {
    beforeEach(() => {
      component.user = { userId: 1, userName: 'testuser' };
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
    });

    it('should call dismissAllNotifications service method', () => {
      component.dismissAllNotifications();
      expect(mockNotificationService.dismissAllNotifications).toHaveBeenCalled();
    });

    it('should refresh notifications after dismissing all', () => {
      mockNotificationService.getAllNotifications.mockClear();
      component.dismissAllNotifications();

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalled();
    });

    it('should not call service if user is not available', () => {
      component.user = null;
      mockNotificationService.dismissAllNotifications.mockClear();
      component.dismissAllNotifications();
      expect(mockNotificationService.dismissAllNotifications).not.toHaveBeenCalled();
    });

    it('should show error message on dismiss failure', () => {
      mockNotificationService.dismissAllNotifications.mockReturnValue(throwError(() => new Error('Dismiss failed')));
      component.dismissAllNotifications();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });
  });

  describe('deleteAllNotifications', () => {
    beforeEach(() => {
      component.user = { userId: 1, userName: 'testuser' };
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
    });

    it('should call deleteAllNotifications service method', () => {
      component.deleteAllNotifications();
      expect(mockNotificationService.deleteAllNotifications).toHaveBeenCalled();
    });

    it('should set empty state notifications after deleting all', () => {
      component.deleteAllNotifications();

      expect(component.notifications).toEqual([{ title: 'You have no new notifications...', read: 1 }]);
      expect(component.filteredNotifications).toEqual([{ title: 'You have no new notifications...', read: 1 }]);
    });

    it('should not call service if user is not available', () => {
      component.user = null;
      mockNotificationService.deleteAllNotifications.mockClear();
      component.deleteAllNotifications();
      expect(mockNotificationService.deleteAllNotifications).not.toHaveBeenCalled();
    });

    it('should show error message on delete all failure', () => {
      mockNotificationService.deleteAllNotifications.mockReturnValue(throwError(() => new Error('Delete all failed')));
      component.deleteAllNotifications();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
    });
  });

  describe('onSortChange', () => {
    it('should set descending sort order for values starting with !', () => {
      component.onSortChange({ value: '!timestamp' });
      expect(component.sortOrder).toBe(-1);
      expect(component.sortField).toBe('timestamp');
    });

    it('should set ascending sort order for values without !', () => {
      component.onSortChange({ value: 'timestamp' });
      expect(component.sortOrder).toBe(1);
      expect(component.sortField).toBe('timestamp');
    });

    it('should set sortField to title', () => {
      component.onSortChange({ value: 'title' });
      expect(component.sortField).toBe('title');
      expect(component.sortOrder).toBe(1);
    });
  });

  describe('onNotificationClick', () => {
    it('should navigate to POAM when clicking a poam-link', () => {
      const navigateSpy = vi.spyOn(component, 'navigateToPOAM').mockImplementation(() => Promise.resolve());

      const mockEvent = {
        target: {
          classList: {
            contains: vi.fn().mockReturnValue(true)
          },
          getAttribute: vi.fn().mockReturnValue('123')
        },
        preventDefault: vi.fn()
      } as unknown as MouseEvent;

      component.onNotificationClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(123);
    });

    it('should not navigate when clicking non-poam-link element', () => {
      const navigateSpy = vi.spyOn(component, 'navigateToPOAM').mockImplementation(() => Promise.resolve());

      const mockEvent = {
        target: {
          classList: {
            contains: vi.fn().mockReturnValue(false)
          }
        },
        preventDefault: vi.fn()
      } as unknown as MouseEvent;

      component.onNotificationClick(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.setPayload();

      const subscriptionCount = component['payloadSubscription'].length;

      expect(subscriptionCount).toBeGreaterThan(0);

      component.ngOnDestroy();

      component['payloadSubscription'].forEach((sub) => {
        expect(sub.closed).toBe(true);
      });
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.user = { userId: 1, userName: 'testuser' };
      component.notifications = mockNotifications.map((n) => ({
        ...n,
        formattedMessage: component.formatMessage(n.message)
      }));
      component.filteredNotifications = component.notifications.filter((n) => n.read === 0);
      fixture.detectChanges();
    });

    it('should render p-card', () => {
      const card = fixture.debugElement.query(By.css('p-card'));

      expect(card).toBeTruthy();
    });

    it('should render sort select', () => {
      const selects = fixture.debugElement.queryAll(By.css('p-select'));

      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('should render p-table for notifications', () => {
      const table = fixture.debugElement.query(By.css('p-table'));

      expect(table).toBeTruthy();
    });

    it('should render mark all as read button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const markAllButton = buttons.find((btn) => btn.attributes['label'] === 'Mark all as read');

      expect(markAllButton).toBeTruthy();
    });

    it('should render delete all button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const deleteAllButton = buttons.find((btn) => btn.attributes['label'] === 'Delete all');

      expect(deleteAllButton).toBeTruthy();
    });

    it('should render p-toast for messages', () => {
      const toast = fixture.debugElement.query(By.css('p-toast'));

      expect(toast).toBeTruthy();
    });
  });

  describe('accessLevel changes', () => {
    it('should fetch notifications when accessLevel changes from 0 to > 0', () => {
      mockPayloadService.accessLevel$ = new BehaviorSubject(0);
      mockNotificationService.getAllNotifications.mockClear();

      component.setPayload();

      expect(mockNotificationService.getAllNotifications).not.toHaveBeenCalled();

      mockPayloadService.accessLevel$.next(1);

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalled();
    });
  });
});
