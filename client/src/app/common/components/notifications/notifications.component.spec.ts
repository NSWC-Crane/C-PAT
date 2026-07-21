/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { NotificationsComponent } from './notifications.component';
import { NotificationService } from './notifications.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { MessageService } from 'primeng/api';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { createMockMessageService } from '../../../../testing/mocks/service-mocks';
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
    user: WritableSignal<any>;
    accessLevel$: BehaviorSubject<number>;
  };
  let mockMessageService: any;

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
      user: signal<any>({ userId: 1, userName: 'testuser' }),
      accessLevel$: new BehaviorSubject(1)
    };

    mockMessageService = createMockMessageService();

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
      expect(component.filterStatus()).toBe('Unread');
    });

    it('should have default sortField of timestamp', () => {
      expect(component.sortField()).toBe('timestamp');
    });

    it('should have default sortOrder of -1 (descending)', () => {
      expect(component.sortOrder()).toBe(-1);
    });

    it('should have default sortKey of !timestamp', () => {
      expect(component.sortKey()).toBe('!timestamp');
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
    it('should expose current user from the payload service', () => {
      expect(component['user']()).toEqual({ userId: 1, userName: 'testuser' });
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

      expect(component.notifications().length).toBe(3);
      expect(component.notifications()[0].messageParts).toBeTruthy();
    });

    it('should filter notifications after fetching', () => {
      component.fetchNotifications();

      expect(component.filteredNotifications().length).toBe(2);
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

      expect(component.notifications()).toEqual([]);
      expect(component.filteredNotifications()).toEqual([]);
    });

    it('should handle notification without timestamp', () => {
      mockNotificationService.getAllNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message: 'Test message', read: 0 }]));

      component.fetchNotifications();

      expect(component.notifications().length).toBe(1);
    });
  });

  describe('parseMessage', () => {
    it('should split message around the POAM link', () => {
      const message = 'This is a test message for POAM 123';
      const result = component.parseMessage(message);

      expect(result.before).toBe('This is a test message for ');
      expect(result.poamId).toBe(123);
      expect(result.after).toBe('');
    });

    it('should return plain message when no POAM reference', () => {
      const message = 'This is a plain message';
      const result = component.parseMessage(message);

      expect(result.before).toBe(message);
      expect(result.poamId).toBeNull();
    });

    it('should handle multiple digit POAM numbers', () => {
      const message = 'Check POAM 12345 for details';
      const result = component.parseMessage(message);

      expect(result.poamId).toBe(12345);
      expect(result.after).toBe(' for details');
    });

    it('should build the POAM details href', () => {
      const result = component.parseMessage('Check POAM 456');

      expect(result.href).toContain('poam-processing/poam-details/456');
    });
  });

  describe('message rendering', () => {
    it.each(['You have been assigned as an approver for POAM 123.', 'POAM 123 has been rejected. Please review the comments.', 'A message with no reference at all', 'POAM 0 has expired.'])('should render %s verbatim', (message) => {
      mockNotificationService.getAllNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message, read: 0, timestamp: new Date().toISOString() }]));

      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('.notification-item p'));

      expect(paragraph.nativeElement.textContent).toBe(message);
    });

    it('should render the POAM reference as a link', () => {
      mockNotificationService.getAllNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message: 'Check POAM 123 now', read: 0, timestamp: new Date().toISOString() }]));

      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.notification-item p a.poam-link'));

      expect(link.nativeElement.textContent).toBe('POAM 123');
      expect(link.nativeElement.getAttribute('href')).toBe('/poam-processing/poam-details/123');
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
    });

    it('should filter to show only unread notifications by default', () => {
      component.filterStatus.set('Unread');
      expect(component.filteredNotifications().every((n) => n.read === 0)).toBe(true);
    });

    it('should filter to show only read notifications', () => {
      component.filterStatus.set('Read');
      expect(component.filteredNotifications().every((n) => n.read === 1)).toBe(true);
    });

    it('should show all notifications when filter is All', () => {
      component.filterStatus.set('All');
      expect(component.filteredNotifications().length).toBe(3);
    });
  });

  describe('resetFilter', () => {
    beforeEach(() => {
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
    });

    it('should reset filterStatus to Unread', () => {
      component.filterStatus.set('All');
      component.resetFilter();
      expect(component.filterStatus()).toBe('Unread');
    });

    it('should update filtered notifications after reset', () => {
      component.filterStatus.set('All');
      expect(component.filteredNotifications().length).toBe(3);

      component.resetFilter();
      expect(component.filteredNotifications().every((n) => n.read === 0)).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
    });

    it('should call deleteNotification service method', () => {
      const notification = component.notifications()[0];

      component.deleteNotification(notification);
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(notification.notificationId);
    });

    it('should refresh notifications after deletion', () => {
      const notification = component.notifications()[0];

      mockNotificationService.getAllNotifications.mockClear();

      component.deleteNotification(notification);

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalled();
    });

    it('should show error message on delete failure', () => {
      mockNotificationService.deleteNotification.mockReturnValue(throwError(() => new Error('Delete failed')));
      const notification = component.notifications()[0];

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
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
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
      mockPayloadService.user.set(null);
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
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
    });

    it('should call deleteAllNotifications service method', () => {
      component.deleteAllNotifications();
      expect(mockNotificationService.deleteAllNotifications).toHaveBeenCalled();
    });

    it('should set empty state notifications after deleting all', () => {
      component.deleteAllNotifications();

      expect(component.notifications()).toEqual([{ title: 'You have no new notifications...', read: 1 }]);
      expect(component.filteredNotifications()).toEqual([{ title: 'You have no new notifications...', read: 1 }]);
    });

    it('should not call service if user is not available', () => {
      mockPayloadService.user.set(null);
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
      expect(component.sortOrder()).toBe(-1);
      expect(component.sortField()).toBe('timestamp');
    });

    it('should set ascending sort order for values without !', () => {
      component.onSortChange({ value: 'timestamp' });
      expect(component.sortOrder()).toBe(1);
      expect(component.sortField()).toBe('timestamp');
    });

    it('should set sortField to title', () => {
      component.onSortChange({ value: 'title' });
      expect(component.sortField()).toBe('title');
      expect(component.sortOrder()).toBe(1);
    });
  });

  describe('onPoamLinkClick', () => {
    it('should navigate to POAM instead of following the href', () => {
      const navigateSpy = vi.spyOn(component, 'navigateToPOAM').mockImplementation(() => Promise.resolve());

      const mockEvent = { preventDefault: vi.fn() } as unknown as MouseEvent;

      component.onPoamLinkClick(mockEvent, 123);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(123);
    });
  });

  describe('cleanup', () => {
    it('should stop reacting to accessLevel changes after destroy', () => {
      component.setPayload();
      mockNotificationService.getAllNotifications.mockClear();

      fixture.destroy();

      mockPayloadService.accessLevel$.next(2);

      expect(mockNotificationService.getAllNotifications).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
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
      const buttons = fixture.debugElement.queryAll(By.css('button[pButton]'));
      const markAllButton = buttons.find((btn) => btn.nativeElement.textContent.includes('Mark all as read'));

      expect(markAllButton).toBeTruthy();
    });

    it('should render delete all button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button[pButton]'));
      const deleteAllButton = buttons.find((btn) => btn.nativeElement.textContent.includes('Delete all'));

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
