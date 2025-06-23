/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, ElementRef, Input, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { ToastModule } from 'primeng/toast';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { PoamChatService } from '../../services/poam-chat.service';

@Component({
  selector: 'cpat-poam-chat',
  templateUrl: './poam-chat.component.html',
  styleUrls: ['./poam-chat.component.scss'],
  standalone: true,
  imports: [FormsModule, PopoverModule, InputTextModule, ButtonModule, InputGroupModule, InputGroupAddonModule, ToastModule],
  providers: [MessageService]
})
export class PoamChatComponent implements OnInit {
  private poamChatService = inject(PoamChatService);
  private messageService = inject(MessageService);

  @Input() poamId!: number;
  @Input() userId!: number;

  readonly chatWindow = viewChild.required<ElementRef>('chatWindow');

  messages: any[] = [];
  groupedMessages: { date: string; messages: any[] }[] = [];
  textContent: string = '';

  emojis = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😇',
    '😉',
    '😊',
    '🙂',
    '🙃',
    '😋',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '🤪',
    '😜',
    '😝',
    '😛',
    '🤑',
    '😎',
    '🤓',
    '🧐',
    '🤠',
    '🥳',
    '🤗',
    '🤡',
    '😏',
    '😶',
    '😐',
    '😑',
    '😒',
    '🙄',
    '🤨',
    '🤔',
    '🤫',
    '🤭',
    '🤥',
    '😳',
    '😞',
    '😟',
    '😠',
    '😡',
    '🤬',
    '😔',
    '😕',
    '🙁',
    '😬',
    '🥺',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥱',
    '😤',
    '😮',
    '😱',
    '😨',
    '😰',
    '😯',
    '😦',
    '😧',
    '😢',
    '😥'
  ];

  ngOnInit() {
    if (this.poamId) {
      this.loadMessages();
    }
  }

  loadMessages() {
    this.poamChatService.getMessagesByPoamId(this.poamId).subscribe({
      next: (data) => {
        this.messages = this.formatMessages(data);
        this.groupMessages();
        setTimeout(() => {
          const chatWindow = this.chatWindow();

          if (chatWindow) {
            chatWindow.nativeElement.scrollTop = chatWindow.nativeElement.scrollHeight;
          }
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error loading chat messages: ${getErrorMessage(error)}`
        });
      }
    });
  }

  formatMessages(data: any[]) {
    return data.map((message) => ({
      messageId: message.messageId,
      ownerId: message.userId,
      poamId: message.poamId,
      text: message.text,
      createdAt: message.createdAt,
      user: message.user
    }));
  }

  groupMessages() {
    const groups: { [key: string]: any[] } = {};

    this.messages.forEach((message) => {
      const date = this.getMessageDate(message.createdAt);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(message);
    });

    this.groupedMessages = Object.keys(groups).map((date) => ({
      date: this.formatDateForHeader(date),
      messages: groups[date]
    }));
  }

  getMessageDate(dateString: string): string {
    return dateString.substring(0, 10);
  }

  getMessageTime(dateString: string): string {
    return dateString.substring(11, 16);
  }

  formatDateForHeader(dateStr: string): string {
    const messageDate = new Date(dateStr + 'T00:00:00');

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      return messageDate.toLocaleDateString(undefined, options);
    }
  }

  isFirstMessageFromSender(message: any, messages: any[]): boolean {
    const index = messages.indexOf(message);

    return index === 0 || messages[index - 1].ownerId !== message.ownerId;
  }

  isLastMessageFromSender(message: any, messages: any[]): boolean {
    const index = messages.indexOf(message);

    return index === messages.length - 1 || messages[index + 1].ownerId !== message.ownerId;
  }

  shouldShowSender(message: any, messages: any[]): boolean {
    return this.isFirstMessageFromSender(message, messages);
  }

  getUserDisplayName(message: any): string {
    if (!message.user) return 'Unknown User';

    if (message.user.firstName && message.user.lastName) {
      return `${message.user.firstName} ${message.user.lastName}`;
    }

    if (message.user.userName) {
      return message.user.userName;
    }

    return 'Unknown User';
  }

  sendMessage() {
    if (!this.textContent || this.textContent.trim() === '') {
      return;
    }

    this.poamChatService.createMessage(this.poamId, this.textContent.trim()).subscribe({
      next: (response) => {
        const newMessage = {
          messageId: response.messageId,
          ownerId: response.userId,
          poamId: response.poamId,
          text: response.text,
          createdAt: response.createdAt,
          user: response.user
        };

        this.messages.push(newMessage);
        this.groupMessages();
        this.textContent = '';

        setTimeout(() => {
          const chatWindow = this.chatWindow();

          if (chatWindow) {
            chatWindow.nativeElement.scrollTop = chatWindow.nativeElement.scrollHeight;
          }
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error sending message: ${getErrorMessage(error)}`
        });
      }
    });
  }

  onEmojiSelect(emoji: string) {
    this.textContent += emoji;
  }

  parseDate(dateString: string) {
    const datePart = dateString.substring(0, 10);
    const timePart = dateString.substring(11, 16);

    const messageDate = new Date(datePart + 'T00:00:00');
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return timePart;
    }

    return `${datePart} ${timePart}`;
  }
}
