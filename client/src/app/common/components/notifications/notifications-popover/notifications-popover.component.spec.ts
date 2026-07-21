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
import { NotificationsPanelComponent } from './notifications-popover.component';
import { NotificationService } from '../notifications.service';
import { PayloadService } from '../../../../common/services/setPayload.service';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Popover } from 'primeng/popover';

beforeAll(() => {
  (globalThis as any).CPAT = {
    Env: {
      basePath: '/',
      apiBase: '/api'
    }
  };
});

describe('NotificationsPanelComponent', () => {
  let component: NotificationsPanelComponent;
  let fixture: ComponentFixture<NotificationsPanelComponent>;
  let mockNotificationService: {
    getUnreadNotifications: ReturnType<typeof vi.fn>;
    dismissNotification: ReturnType<typeof vi.fn>;
    dismissAllNotifications: ReturnType<typeof vi.fn>;
  };
  let mockPayloadService: {
    user$: BehaviorSubject<any>;
    payload$: BehaviorSubject<any>;
    accessLevel$: BehaviorSubject<number>;
  };
  let mockRouter: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };
  let mockOverlayPanel: {
    hide: ReturnType<typeof vi.fn>;
  };

  const mockNotifications = [
    {
      notificationId: 1,
      title: 'Test Notification 1',
      message: 'This is a test message for POAM 123',
      icon: 'pi pi-info-circle',
      timestamp: new Date().toISOString()
    },
    {
      notificationId: 2,
      title: 'Test Notification 2',
      message: 'This is another test message',
      icon: 'pi pi-bell',
      timestamp: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    mockNotificationService = {
      getUnreadNotifications: vi.fn().mockReturnValue(of(mockNotifications)),
      dismissNotification: vi.fn().mockReturnValue(of({})),
      dismissAllNotifications: vi.fn().mockReturnValue(of({}))
    };

    mockPayloadService = {
      user$: new BehaviorSubject({ userId: 1, userName: 'testuser' }),
      payload$: new BehaviorSubject({}),
      accessLevel$: new BehaviorSubject(1)
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true)
    };

    mockOverlayPanel = {
      hide: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PayloadService, useValue: mockPayloadService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('overlayPanel', mockOverlayPanel as unknown as Popover);
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty notifications array initially', () => {
      expect(component.notifications()).toEqual([]);
    });
  });

  describe('setPayload', () => {
    it('should fetch notifications when accessLevel > 0', () => {
      component.setPayload();
      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalled();
    });

    it('should not fetch notifications when accessLevel is 0', () => {
      mockPayloadService.accessLevel$ = new BehaviorSubject(0);
      mockNotificationService.getUnreadNotifications.mockClear();
      component.setPayload();
      expect(mockNotificationService.getUnreadNotifications).not.toHaveBeenCalled();
    });
  });

  describe('closeOverlay', () => {
    it('should call hide on overlayPanel', () => {
      component.closeOverlay();
      expect(mockOverlayPanel.hide).toHaveBeenCalled();
    });

    it('should not throw if overlayPanel is not set', () => {
      (component as any).overlayPanel = () => undefined;
      expect(() => component.closeOverlay()).not.toThrow();
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch and format unread notifications', () => {
      component.fetchNotifications();

      expect(component.notifications().length).toBe(2);
      expect(component.notifications()[0].messageParts).toBeTruthy();
    });

    it('should handle fetch error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNotificationService.getUnreadNotifications.mockReturnValue(throwError(() => new Error('Fetch failed')));

      component.fetchNotifications();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch notifications:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle notification without notificationId', () => {
      mockNotificationService.getUnreadNotifications.mockReturnValue(of([{ title: 'No ID notification', message: 'Test', timestamp: new Date().toISOString() }]));

      component.fetchNotifications();

      expect(component.notifications().length).toBe(1);
      expect(component.notifications()[0].notificationId).toBeUndefined();
    });

    it('should handle notification without icon', () => {
      mockNotificationService.getUnreadNotifications.mockReturnValue(of([{ notificationId: 1, title: 'No icon', message: 'Test', timestamp: new Date().toISOString() }]));

      component.fetchNotifications();

      expect(component.notifications().length).toBe(1);
      expect(component.notifications()[0].icon).toBeUndefined();
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
      const message = 'Check POAM 99999 for details';
      const result = component.parseMessage(message);

      expect(result.poamId).toBe(99999);
      expect(result.after).toBe(' for details');
    });

    it('should create link with correct href', () => {
      const message = 'Check POAM 456';
      const result = component.parseMessage(message);

      expect(result.href).toContain('poam-processing/poam-details/456');
    });
  });

  describe('message rendering', () => {
    it.each(['You have been assigned as an approver for POAM 123.', 'POAM 123 has been rejected. Please review the comments.', 'A message with no reference at all', 'POAM 0 has expired.'])('should render %s verbatim', (message) => {
      mockNotificationService.getUnreadNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message, icon: 'pi pi-bell', timestamp: new Date().toISOString() }]));

      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('.notification-content p'));

      expect(paragraph.nativeElement.textContent).toBe(message);
    });

    it('should render the POAM reference as a link', () => {
      mockNotificationService.getUnreadNotifications.mockReturnValue(of([{ notificationId: 1, title: 'Test', message: 'Check POAM 123 now', icon: 'pi pi-bell', timestamp: new Date().toISOString() }]));

      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.notification-content p a.poam-link'));

      expect(link.nativeElement.textContent).toBe('POAM 123');
      expect(link.nativeElement.getAttribute('href')).toBe('/poam-processing/poam-details/123');
    });
  });

  describe('dismissNotification', () => {
    beforeEach(() => {
      component.notifications.set(
        mockNotifications.map((n) => ({
          ...n,
          messageParts: component.parseMessage(n.message)
        }))
      );
    });

    it('should call dismissNotification service method', () => {
      const notification = component.notifications()[0];

      component.dismissNotification(notification);
      expect(mockNotificationService.dismissNotification).toHaveBeenCalledWith(notification.notificationId);
    });

    it('should remove notification from array after dismissal', () => {
      const notification = component.notifications()[0];
      const initialLength = component.notifications().length;

      component.dismissNotification(notification);

      expect(component.notifications().length).toBe(initialLength - 1);
      expect(component.notifications().find((n) => n.notificationId === notification.notificationId)).toBeUndefined();
    });

    it('should handle dismiss error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNotificationService.dismissNotification.mockReturnValue(throwError(() => new Error('Dismiss failed')));

      const notification = component.notifications()[0];

      component.dismissNotification(notification);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to dismiss notification:', expect.any(Error));
      consoleSpy.mockRestore();
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

    it('should clear notifications array after dismissing all', () => {
      expect(component.notifications().length).toBeGreaterThan(0);

      component.dismissAllNotifications();

      expect(component.notifications()).toEqual([]);
    });

    it('should handle dismiss all error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockNotificationService.dismissAllNotifications.mockReturnValue(throwError(() => new Error('Dismiss all failed')));

      component.dismissAllNotifications();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to dismiss all notifications:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('viewAllNotifications', () => {
    it('should navigate to /notifications', () => {
      component.viewAllNotifications();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/notifications');
    });

    it('should close overlay after navigation', () => {
      component.viewAllNotifications();
      expect(mockOverlayPanel.hide).toHaveBeenCalled();
    });
  });

  describe('navigateToPOAM', () => {
    it('should close overlay after navigation', async () => {
      await component.navigateToPOAM(123);
      expect(mockOverlayPanel.hide).toHaveBeenCalled();
    });

    it('should handle navigation error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalLocation = globalThis.location;

      Object.defineProperty(globalThis, 'location', {
        value: {
          get pathname() {
            throw new Error('Navigation error');
          },
          set pathname(_value) {
            throw new Error('Navigation error');
          }
        },
        writable: true
      });

      await component.navigateToPOAM(123);

      expect(consoleSpy).toHaveBeenCalledWith('Error navigating to POAM:', expect.any(Error));

      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true
      });
      consoleSpy.mockRestore();
    });
  });

  describe('onPoamLinkClick', () => {
    it('should navigate to POAM instead of following the href', () => {
      const navigateSpy = vi.spyOn(component, 'navigateToPOAM').mockImplementation(() => Promise.resolve());

      const mockEvent = { preventDefault: vi.fn() } as unknown as MouseEvent;

      component.onPoamLinkClick(mockEvent, 456);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(456);
    });
  });

  describe('cleanup', () => {
    it('should stop reacting to accessLevel changes after destroy', () => {
      component.setPayload();
      mockNotificationService.getUnreadNotifications.mockClear();

      fixture.destroy();

      mockPayloadService.accessLevel$.next(2);

      expect(mockNotificationService.getUnreadNotifications).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    describe('with notifications', () => {
      beforeEach(() => {
        component.notifications.set(
          mockNotifications.map((n) => ({
            ...n,
            messageParts: component.parseMessage(n.message)
          }))
        );
        fixture.detectChanges();
      });

      it('should render notifications-popover container', () => {
        const container = fixture.debugElement.query(By.css('.notifications-popover'));

        expect(container).toBeTruthy();
      });

      it('should render p-listbox when notifications exist', () => {
        const listbox = fixture.debugElement.query(By.css('p-listbox'));

        expect(listbox).toBeTruthy();
      });

      it('should render see all notifications button', () => {
        const button = fixture.debugElement.query(By.css('button[pButton]'));

        expect(button).toBeTruthy();
        expect(button.nativeElement.textContent).toContain('See all notifications');
      });
    });

    describe('without notifications', () => {
      beforeEach(() => {
        mockNotificationService.getUnreadNotifications.mockReturnValue(of([]));
        component.notifications.set([]);
        fixture.detectChanges();
      });

      it('should render empty state message', () => {
        const emptyMessage = fixture.debugElement.query(By.css('.text-center p'));

        expect(emptyMessage).toBeTruthy();
        expect(emptyMessage.nativeElement.textContent).toContain('No notifications found');
      });

      it('should render inbox icon in empty state', () => {
        const icon = fixture.debugElement.query(By.css('.pi-inbox'));

        expect(icon).toBeTruthy();
      });

      it('should not render p-listbox when no notifications', () => {
        const listbox = fixture.debugElement.query(By.css('p-listbox'));

        expect(listbox).toBeFalsy();
      });
    });
  });

  describe('accessLevel changes', () => {
    it('should fetch notifications when accessLevel changes from 0 to > 0', () => {
      mockPayloadService.accessLevel$ = new BehaviorSubject(0);
      mockNotificationService.getUnreadNotifications.mockClear();

      component.setPayload();

      expect(mockNotificationService.getUnreadNotifications).not.toHaveBeenCalled();

      mockPayloadService.accessLevel$.next(1);

      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalled();
    });
  });

  describe('overlayPanel handling', () => {
    it('should handle overlayPanel input being set after init', () => {
      (component as any).overlayPanel = () => undefined;

      (component as any).overlayPanel = () => mockOverlayPanel as unknown as Popover;
      component.closeOverlay();

      expect(mockOverlayPanel.hide).toHaveBeenCalled();
    });
  });
});
