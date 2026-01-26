/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PoamChatService } from './poam-chat.service';

describe('PoamChatService', () => {
  let service: PoamChatService;
  let httpMock: HttpTestingController;
  const apiBase = '/api';

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        PoamChatService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PoamChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMessagesByPoamId', () => {
    it('should fetch messages for a poam', () => {
      const poamId = 123;
      const mockMessages = [
        { messageId: 1, poamId: 123, userId: 1, text: 'Hello', createdAt: '2024-01-01T10:00:00Z' },
        { messageId: 2, poamId: 123, userId: 2, text: 'Hi there', createdAt: '2024-01-01T10:05:00Z' }
      ];

      service.getMessagesByPoamId(poamId).subscribe(messages => {
        expect(messages).toEqual(mockMessages);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      expect(req.request.method).toBe('GET');
      req.flush(mockMessages);
    });

    it('should return empty array when no messages exist', () => {
      const poamId = 456;

      service.getMessagesByPoamId(poamId).subscribe(messages => {
        expect(messages).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.flush([]);
    });

    it('should handle server error and log it', () => {
      const poamId = 789;
      let errorReceived: Error | null = null;

      service.getMessagesByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle client-side error', () => {
      const poamId = 123;
      let errorReceived: Error | null = null;

      service.getMessagesByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.error(new ProgressEvent('error'));

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle 404 not found error', () => {
      const poamId = 999;
      let errorReceived: Error | null = null;

      service.getMessagesByPoamId(poamId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });
  });

  describe('createMessage', () => {
    it('should create a new message', () => {
      const poamId = 123;
      const messageText = 'This is a test message';
      const mockResponse = {
        messageId: 1,
        poamId: 123,
        userId: 1,
        text: messageText,
        createdAt: '2024-01-01T10:00:00Z'
      };

      service.createMessage(poamId, messageText).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ text: messageText });
      req.flush(mockResponse);
    });

    it('should send correct payload structure', () => {
      const poamId = 456;
      const messageText = 'Test payload';

      service.createMessage(poamId, messageText).subscribe();

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      expect(req.request.body).toHaveProperty('text');
      expect(req.request.body.text).toBe(messageText);
      req.flush({ messageId: 1 });
    });

    it('should handle empty message', () => {
      const poamId = 123;
      const messageText = '';

      service.createMessage(poamId, messageText).subscribe();

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      expect(req.request.body).toEqual({ text: '' });
      req.flush({ messageId: 1 });
    });

    it('should handle message with special characters', () => {
      const poamId = 123;
      const messageText = 'Test <script>alert("xss")</script> & "quotes" \'apostrophes\'';

      service.createMessage(poamId, messageText).subscribe();

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      expect(req.request.body.text).toBe(messageText);
      req.flush({ messageId: 1 });
    });

    it('should handle server error when creating message', () => {
      const poamId = 123;
      const messageText = 'Test message';
      let errorReceived: Error | null = null;

      service.createMessage(poamId, messageText).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });

    it('should handle unauthorized error when creating message', () => {
      const poamId = 123;
      const messageText = 'Test message';
      let errorReceived: Error | null = null;

      service.createMessage(poamId, messageText).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat`);

      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message', () => {
      const poamId = 123;
      const messageId = 456;
      const mockResponse = { success: true };

      service.deleteMessage(poamId, messageId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat/${messageId}`);

      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle successful delete with empty response', () => {
      const poamId = 123;
      const messageId = 456;

      service.deleteMessage(poamId, messageId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat/${messageId}`);

      req.flush(null);
    });

    it('should handle 404 when deleting non-existent message', () => {
      const poamId = 123;
      const messageId = 999;
      let errorReceived: Error | null = null;

      service.deleteMessage(poamId, messageId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat/${messageId}`);

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });

    it('should handle forbidden delete attempt', () => {
      const poamId = 123;
      const messageId = 456;
      let errorReceived: Error | null = null;

      service.deleteMessage(poamId, messageId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat/${messageId}`);

      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });

    it('should handle server error during delete', () => {
      const poamId = 123;
      const messageId = 456;
      let errorReceived: Error | null = null;

      service.deleteMessage(poamId, messageId).subscribe({
        error: (error) => {
          errorReceived = error;
        }
      });

      const req = httpMock.expectOne(`${apiBase}/poam/${poamId}/chat/${messageId}`);

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).not.toBeNull();
      expect(errorReceived!.message).toBe('Something bad happened; please try again later.');
    });
  });

  describe('formatMessagesForUI', () => {
    it('should format messages correctly for current user', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 1, text: 'My message', createdAt: '2024-01-01T10:00:00Z' },
        { messageId: 2, userId: 2, text: 'Their message', createdAt: '2024-01-01T10:05:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result.length).toBe(2);
      expect(result[0].isCurrentUser).toBe(true);
      expect(result[1].isCurrentUser).toBe(false);
    });

    it('should convert createdAt to timestamp', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 1, text: 'Test', createdAt: '2024-01-01T10:00:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(typeof result[0].createdAt).toBe('number');
      expect(result[0].createdAt).toBe(new Date('2024-01-01T10:00:00Z').getTime());
    });

    it('should return empty array for null messages', () => {
      const userId = 1;

      const result = service.formatMessagesForUI(userId, null as any);

      expect(result).toEqual([]);
    });

    it('should return empty array for undefined messages', () => {
      const userId = 1;

      const result = service.formatMessagesForUI(userId, undefined as any);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty messages array', () => {
      const userId = 1;

      const result = service.formatMessagesForUI(userId, []);

      expect(result).toEqual([]);
    });

    it('should preserve text content', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 2, text: 'Hello <b>world</b>', createdAt: '2024-01-01T10:00:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result[0].text).toBe('Hello <b>world</b>');
    });

    it('should include ownerId from userId', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 42, text: 'Test', createdAt: '2024-01-01T10:00:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result[0].ownerId).toBe(42);
    });

    it('should include messageId', () => {
      const userId = 1;
      const messages = [
        { messageId: 999, userId: 1, text: 'Test', createdAt: '2024-01-01T10:00:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result[0].messageId).toBe(999);
    });

    it('should handle multiple messages from same user', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 1, text: 'First', createdAt: '2024-01-01T10:00:00Z' },
        { messageId: 2, userId: 1, text: 'Second', createdAt: '2024-01-01T10:01:00Z' },
        { messageId: 3, userId: 1, text: 'Third', createdAt: '2024-01-01T10:02:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result.length).toBe(3);
      expect(result.every(m => m.isCurrentUser)).toBe(true);
    });

    it('should handle messages from multiple different users', () => {
      const userId = 1;
      const messages = [
        { messageId: 1, userId: 1, text: 'User 1', createdAt: '2024-01-01T10:00:00Z' },
        { messageId: 2, userId: 2, text: 'User 2', createdAt: '2024-01-01T10:01:00Z' },
        { messageId: 3, userId: 3, text: 'User 3', createdAt: '2024-01-01T10:02:00Z' },
        { messageId: 4, userId: 1, text: 'User 1 again', createdAt: '2024-01-01T10:03:00Z' }
      ];

      const result = service.formatMessagesForUI(userId, messages);

      expect(result[0].isCurrentUser).toBe(true);
      expect(result[1].isCurrentUser).toBe(false);
      expect(result[2].isCurrentUser).toBe(false);
      expect(result[3].isCurrentUser).toBe(true);
    });
  });
});
