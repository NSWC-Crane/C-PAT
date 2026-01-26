import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from './notifications.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const apiBase = CPAT.Env.apiBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllNotifications', () => {
    it('should fetch all notifications', () => {
      const mockNotifications = [
        { notificationId: 1, title: 'POAM Due', message: 'POAM 123 is due tomorrow', read: false },
        { notificationId: 2, title: 'System Update', message: 'Scheduled maintenance', read: true }
      ];

      service.getAllNotifications().subscribe((notifications) => {
        expect(notifications).toEqual(mockNotifications);
        expect(notifications.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/all`);

      expect(req.request.method).toBe('GET');
      req.flush(mockNotifications);
    });

    it('should handle error when fetching all notifications fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getAllNotifications().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/all`);

      req.flush('Error', { status: 500, statusText: 'Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getUnreadNotifications', () => {
    it('should fetch unread notifications', () => {
      const mockUnread = [{ notificationId: 1, title: 'POAM Due', message: 'POAM 123 is due tomorrow', read: false }];

      service.getUnreadNotifications().subscribe((notifications) => {
        expect(notifications).toEqual(mockUnread);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/unread`);

      expect(req.request.method).toBe('GET');
      req.flush(mockUnread);
    });

    it('should return empty array when no unread notifications', () => {
      service.getUnreadNotifications().subscribe((notifications) => {
        expect(notifications).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/unread`);

      req.flush([]);
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should fetch unread notification count', () => {
      const mockCount = { count: 5 };

      service.getUnreadNotificationCount().subscribe((result) => {
        expect(result).toEqual(mockCount);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/unread/count`);

      expect(req.request.method).toBe('GET');
      req.flush(mockCount);
    });

    it('should return zero count when no unread notifications', () => {
      const mockCount = { count: 0 };

      service.getUnreadNotificationCount().subscribe((result) => {
        expect(result).toEqual(mockCount);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/unread/count`);

      req.flush(mockCount);
    });
  });

  describe('dismissNotification', () => {
    it('should dismiss a single notification', () => {
      const notificationId = 1;
      const mockResponse = { success: true, notificationId: 1 };

      service.dismissNotification(notificationId).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/dismiss/${notificationId}`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });

    it('should handle error when dismissing notification fails', () => {
      const notificationId = 999;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.dismissNotification(notificationId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/dismiss/${notificationId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('dismissAllNotifications', () => {
    it('should dismiss all notifications', () => {
      const mockResponse = { success: true, dismissed: 10 };

      service.dismissAllNotifications().subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/all/dismiss`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a single notification', () => {
      const notificationId = 1;
      const mockResponse = { success: true, deleted: true };

      service.deleteNotification(notificationId).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/delete/${notificationId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when deleting notification fails', () => {
      const notificationId = 999;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.deleteNotification(notificationId).subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/delete/${notificationId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications', () => {
      const mockResponse = { success: true, deleted: 15 };

      service.deleteAllNotifications().subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/all/delete`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('handleError', () => {
    it('should handle client-side errors (ErrorEvent)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorEvent = new ErrorEvent('Network error', { message: 'Network failure' });

      service.getAllNotifications().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
          expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', 'Network failure');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/all`);

      req.error(errorEvent);

      consoleSpy.mockRestore();
    });

    it('should handle server-side errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getUnreadNotifications().subscribe({
        error: (error) => {
          expect(error.message).toBe('Something bad happened; please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiBase}/notifications/unread`);

      req.flush({ error: 'Internal error' }, { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });
});
