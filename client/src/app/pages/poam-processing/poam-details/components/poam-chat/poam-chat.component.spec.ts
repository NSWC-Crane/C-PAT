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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { createMockMessageService } from '../../../../../../testing/mocks/service-mocks';
import { PoamChatComponent } from './poam-chat.component';
import { PoamChatService } from '../../services/poam-chat.service';

describe('PoamChatComponent', () => {
  let component: PoamChatComponent;
  let fixture: ComponentFixture<PoamChatComponent>;
  let mockMessageService: any;
  let mockPoamChatService: any;
  let mockChatWindow: any;

  const mockMessagesData = [
    {
      messageId: 1,
      userId: 10,
      poamId: 100,
      text: 'Hello team',
      createdAt: '2026-01-15T10:30:00Z',
      user: { firstName: 'John', lastName: 'Doe', userName: 'jdoe' }
    },
    {
      messageId: 2,
      userId: 20,
      poamId: 100,
      text: 'Hi John',
      createdAt: '2026-01-15T10:35:00Z',
      user: { firstName: 'Jane', lastName: 'Smith', userName: 'jsmith' }
    },
    {
      messageId: 3,
      userId: 10,
      poamId: 100,
      text: 'Status update?',
      createdAt: '2026-01-16T09:00:00Z',
      user: { firstName: 'John', lastName: 'Doe', userName: 'jdoe' }
    }
  ];

  beforeEach(async () => {
    mockMessageService = createMockMessageService();

    mockPoamChatService = {
      getMessagesByPoamId: vi.fn().mockReturnValue(of(mockMessagesData)),
      createMessage: vi.fn().mockReturnValue(
        of({
          messageId: 4,
          userId: 10,
          poamId: 100,
          text: 'New message',
          createdAt: '2026-01-16T10:00:00Z',
          user: { firstName: 'John', lastName: 'Doe', userName: 'jdoe' }
        })
      )
    };

    mockChatWindow = {
      nativeElement: { scrollTop: 0, scrollHeight: 500 }
    };

    await TestBed.configureTestingModule({
      imports: [PoamChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MessageService, useValue: mockMessageService }, { provide: PoamChatService, useValue: mockPoamChatService }]
    }).compileComponents();

    fixture = TestBed.createComponent(PoamChatComponent);
    component = fixture.componentInstance;
    component.poamId = 100;
    component.userId = 10;

    Object.defineProperty(component, 'chatWindow', {
      value: () => mockChatWindow,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation & Defaults', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty messages array', () => {
      expect(component.messages).toEqual([]);
    });

    it('should have empty groupedMessages array', () => {
      expect(component.groupedMessages).toEqual([]);
    });

    it('should have empty textContent', () => {
      expect(component.textContent).toBe('');
    });

    it('should have emojis array populated', () => {
      expect(component.emojis.length).toBeGreaterThan(0);
      expect(component.emojis).toContain('😀');
    });
  });

  describe('ngOnInit', () => {
    it('should load messages when poamId is set', () => {
      const loadSpy = vi.spyOn(component, 'loadMessages');

      component.ngOnInit();

      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not load messages when poamId is falsy', () => {
      component.poamId = 0 as any;
      const loadSpy = vi.spyOn(component, 'loadMessages');

      component.ngOnInit();

      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should not load messages when poamId is undefined', () => {
      component.poamId = undefined as any;
      const loadSpy = vi.spyOn(component, 'loadMessages');

      component.ngOnInit();

      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadMessages', () => {
    it('should call getMessagesByPoamId with poamId', () => {
      component.loadMessages();

      expect(mockPoamChatService.getMessagesByPoamId).toHaveBeenCalledWith(100);
    });

    it('should format and store messages', () => {
      component.loadMessages();

      expect(component.messages).toHaveLength(3);
      expect(component.messages[0].ownerId).toBe(10);
      expect(component.messages[0].text).toBe('Hello team');
    });

    it('should group messages after loading', () => {
      component.loadMessages();

      expect(component.groupedMessages.length).toBeGreaterThan(0);
    });

    it('should scroll chat window to bottom after loading', () => {
      vi.useFakeTimers();

      component.loadMessages();
      vi.runAllTimers();

      expect(mockChatWindow.nativeElement.scrollTop).toBe(500);

      vi.useRealTimers();
    });

    it('should handle null chatWindow gracefully', () => {
      vi.useFakeTimers();
      Object.defineProperty(component, 'chatWindow', {
        value: () => null,
        writable: true
      });

      expect(() => {
        component.loadMessages();
        vi.runAllTimers();
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('should show error message on failure', () => {
      mockPoamChatService.getMessagesByPoamId.mockReturnValue(throwError(() => ({ error: { detail: 'Not authorized' } })));

      component.loadMessages();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: expect.stringContaining('Not authorized')
        })
      );
    });
  });

  describe('formatMessages', () => {
    it('should map message data to expected format', () => {
      const result = component.formatMessages(mockMessagesData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        messageId: 1,
        ownerId: 10,
        poamId: 100,
        text: 'Hello team',
        createdAt: '2026-01-15T10:30:00Z',
        user: { firstName: 'John', lastName: 'Doe', userName: 'jdoe' }
      });
    });

    it('should handle empty array', () => {
      expect(component.formatMessages([])).toEqual([]);
    });

    it('should map userId to ownerId', () => {
      const data = [{ messageId: 1, userId: 42, poamId: 100, text: 'test', createdAt: '2026-01-01T00:00:00Z', user: null }];
      const result = component.formatMessages(data);

      expect(result[0].ownerId).toBe(42);
    });
  });

  describe('groupMessages', () => {
    it('should group messages by date', () => {
      component.messages = [
        { messageId: 1, ownerId: 10, text: 'msg1', createdAt: '2026-01-15T10:00:00Z' },
        { messageId: 2, ownerId: 20, text: 'msg2', createdAt: '2026-01-15T11:00:00Z' },
        { messageId: 3, ownerId: 10, text: 'msg3', createdAt: '2026-01-16T09:00:00Z' }
      ];

      component.groupMessages();

      expect(component.groupedMessages).toHaveLength(2);
      expect(component.groupedMessages[0].messages).toHaveLength(2);
      expect(component.groupedMessages[1].messages).toHaveLength(1);
    });

    it('should handle empty messages', () => {
      component.messages = [];

      component.groupMessages();

      expect(component.groupedMessages).toEqual([]);
    });

    it('should handle all messages on same date', () => {
      component.messages = [
        { messageId: 1, createdAt: '2026-01-15T10:00:00Z' },
        { messageId: 2, createdAt: '2026-01-15T11:00:00Z' }
      ];

      component.groupMessages();

      expect(component.groupedMessages).toHaveLength(1);
      expect(component.groupedMessages[0].messages).toHaveLength(2);
    });
  });

  describe('getMessageDate', () => {
    it('should extract date portion from ISO string', () => {
      expect(component.getMessageDate('2026-01-15T10:30:00Z')).toBe('2026-01-15');
    });

    it('should handle different dates', () => {
      expect(component.getMessageDate('2025-12-31T23:59:59Z')).toBe('2025-12-31');
    });
  });

  describe('getMessageTime', () => {
    it('should extract time portion from ISO string', () => {
      expect(component.getMessageTime('2026-01-15T10:30:00Z')).toBe('10:30');
    });

    it('should handle midnight', () => {
      expect(component.getMessageTime('2026-01-15T00:00:00Z')).toBe('00:00');
    });

    it('should handle end of day', () => {
      expect(component.getMessageTime('2026-01-15T23:59:59Z')).toBe('23:59');
    });
  });

  describe('formatDateForHeader', () => {
    it("should return Today for today's date", () => {
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10);

      expect(component.formatDateForHeader(dateStr)).toBe('Today');
    });

    it("should return Yesterday for yesterday's date", () => {
      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().substring(0, 10);

      expect(component.formatDateForHeader(dateStr)).toBe('Yesterday');
    });

    it('should return formatted date for older dates', () => {
      const result = component.formatDateForHeader('2025-01-01');

      expect(result).toContain('2025');
      expect(result).toContain('January');
    });
  });

  describe('isFirstMessageFromSender', () => {
    const messages = [
      { ownerId: 10, text: 'A' },
      { ownerId: 10, text: 'B' },
      { ownerId: 20, text: 'C' },
      { ownerId: 20, text: 'D' }
    ];

    it('should return true for the first message overall', () => {
      expect(component.isFirstMessageFromSender(messages[0], messages)).toBe(true);
    });

    it('should return false for consecutive message from same sender', () => {
      expect(component.isFirstMessageFromSender(messages[1], messages)).toBe(false);
    });

    it('should return true when sender changes', () => {
      expect(component.isFirstMessageFromSender(messages[2], messages)).toBe(true);
    });

    it('should return false for second consecutive from new sender', () => {
      expect(component.isFirstMessageFromSender(messages[3], messages)).toBe(false);
    });
  });

  describe('isLastMessageFromSender', () => {
    const messages = [
      { ownerId: 10, text: 'A' },
      { ownerId: 10, text: 'B' },
      { ownerId: 20, text: 'C' },
      { ownerId: 20, text: 'D' }
    ];

    it('should return false for first of consecutive same-sender messages', () => {
      expect(component.isLastMessageFromSender(messages[0], messages)).toBe(false);
    });

    it('should return true for last before sender change', () => {
      expect(component.isLastMessageFromSender(messages[1], messages)).toBe(true);
    });

    it('should return false for first of next sender group', () => {
      expect(component.isLastMessageFromSender(messages[2], messages)).toBe(false);
    });

    it('should return true for last message overall', () => {
      expect(component.isLastMessageFromSender(messages[3], messages)).toBe(true);
    });
  });

  describe('shouldShowSender', () => {
    it('should delegate to isFirstMessageFromSender', () => {
      const messages = [{ ownerId: 10 }, { ownerId: 20 }];
      const spy = vi.spyOn(component, 'isFirstMessageFromSender');

      component.shouldShowSender(messages[0], messages);

      expect(spy).toHaveBeenCalledWith(messages[0], messages);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name when firstName and lastName exist', () => {
      const message = { user: { firstName: 'John', lastName: 'Doe', userName: 'jdoe' } };

      expect(component.getUserDisplayName(message)).toBe('John Doe');
    });

    it('should return userName when no firstName/lastName', () => {
      const message = { user: { firstName: '', lastName: '', userName: 'jdoe' } };

      expect(component.getUserDisplayName(message)).toBe('jdoe');
    });

    it('should return Unknown User when user is null', () => {
      expect(component.getUserDisplayName({ user: null })).toBe('Unknown User');
    });

    it('should return Unknown User when user is undefined', () => {
      expect(component.getUserDisplayName({ user: undefined })).toBe('Unknown User');
    });

    it('should return Unknown User when no name fields exist', () => {
      const message = { user: {} };

      expect(component.getUserDisplayName(message)).toBe('Unknown User');
    });

    it('should return userName when only firstName is missing', () => {
      const message = { user: { firstName: '', lastName: 'Doe', userName: 'jdoe' } };

      expect(component.getUserDisplayName(message)).toBe('jdoe');
    });

    it('should return userName when only lastName is missing', () => {
      const message = { user: { firstName: 'John', lastName: '', userName: 'jdoe' } };

      expect(component.getUserDisplayName(message)).toBe('jdoe');
    });
  });

  describe('sendMessage', () => {
    it('should not send if textContent is empty', () => {
      component.textContent = '';

      component.sendMessage();

      expect(mockPoamChatService.createMessage).not.toHaveBeenCalled();
    });

    it('should not send if textContent is only whitespace', () => {
      component.textContent = '   ';

      component.sendMessage();

      expect(mockPoamChatService.createMessage).not.toHaveBeenCalled();
    });

    it('should call createMessage with trimmed text', () => {
      component.textContent = '  Hello world  ';

      component.sendMessage();

      expect(mockPoamChatService.createMessage).toHaveBeenCalledWith(100, 'Hello world');
    });

    it('should append new message to messages array', () => {
      component.messages = [];
      component.textContent = 'Hello';

      component.sendMessage();

      expect(component.messages).toHaveLength(1);
      expect(component.messages[0].text).toBe('New message');
      expect(component.messages[0].messageId).toBe(4);
    });

    it('should regroup messages after sending', () => {
      const groupSpy = vi.spyOn(component, 'groupMessages');

      component.textContent = 'Hello';

      component.sendMessage();

      expect(groupSpy).toHaveBeenCalled();
    });

    it('should clear textContent after sending', () => {
      component.textContent = 'Hello';

      component.sendMessage();

      expect(component.textContent).toBe('');
    });

    it('should scroll chat window to bottom after sending', () => {
      vi.useFakeTimers();
      component.textContent = 'Hello';

      component.sendMessage();
      vi.runAllTimers();

      expect(mockChatWindow.nativeElement.scrollTop).toBe(500);

      vi.useRealTimers();
    });

    it('should handle null chatWindow gracefully after send', () => {
      vi.useFakeTimers();
      Object.defineProperty(component, 'chatWindow', {
        value: () => null,
        writable: true
      });
      component.textContent = 'Hello';

      expect(() => {
        component.sendMessage();
        vi.runAllTimers();
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('should show error message on send failure', () => {
      mockPoamChatService.createMessage.mockReturnValue(throwError(() => ({ error: { detail: 'Send failed' } })));
      component.textContent = 'Hello';

      component.sendMessage();

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Send failed')
        })
      );
    });

    it('should not clear textContent on error', () => {
      mockPoamChatService.createMessage.mockReturnValue(throwError(() => ({ message: 'Error' })));
      component.textContent = 'Hello';

      component.sendMessage();

      expect(component.textContent).toBe('Hello');
    });
  });

  describe('onEmojiSelect', () => {
    it('should append emoji to textContent', () => {
      component.textContent = 'Hello ';

      component.onEmojiSelect('😀');

      expect(component.textContent).toBe('Hello 😀');
    });

    it('should append emoji to empty textContent', () => {
      component.textContent = '';

      component.onEmojiSelect('😊');

      expect(component.textContent).toBe('😊');
    });

    it('should support multiple emoji appends', () => {
      component.textContent = '';

      component.onEmojiSelect('😀');
      component.onEmojiSelect('😎');

      expect(component.textContent).toBe('😀😎');
    });
  });

  describe('parseDate', () => {
    it("should return time only for today's date", () => {
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10) + 'T14:30:00Z';

      expect(component.parseDate(dateStr)).toBe('14:30');
    });

    it('should return date and time for past dates', () => {
      const result = component.parseDate('2025-01-15T10:30:00Z');

      expect(result).toBe('2025-01-15 10:30');
    });

    it('should handle midnight', () => {
      const result = component.parseDate('2025-06-01T00:00:00Z');

      expect(result).toBe('2025-06-01 00:00');
    });
  });
});
