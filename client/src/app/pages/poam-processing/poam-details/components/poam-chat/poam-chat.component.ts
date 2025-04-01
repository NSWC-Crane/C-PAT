import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PoamChatService } from '../../services/poam-chat.service';

@Component({
  selector: 'cpat-poam-chat',
  standalone: true,
  imports: [FormsModule, CommonModule, PopoverModule, InputTextModule, ButtonModule, InputGroupModule, InputGroupAddonModule],
  template: `<div class="flex flex-col h-full">
            <div class="flex items-center border-b border-surface-200 dark:border-surface-700">
            </div>
            <div class="user-message-container p-4 md:px-6 lg:px-6 mt-2 overflow-y-auto" #chatWindow>
              <ng-container *ngFor="let messageGroup of groupedMessages">
                 <div class="date-divider flex items-center my-4">
                    <div class="flex-1 border-t border-surface-300 dark:border-surface-600"></div>
                    <div class="mx-4 px-3 py-1 text-xs font-medium bg-surface-200 dark:bg-surface-700 rounded-full">
                       {{ messageGroup.date }}
                    </div>
                    <div class="flex-1 border-t border-surface-300 dark:border-surface-600"></div>
                 </div>
                 <div *ngFor="let message of messageGroup.messages">
                    <div *ngIf="message.ownerId !== userId" class="grid gap-4 grid-nogutter mb-2">
                       <div class="col mt-2">
                          <p class="font-semibold mb-1" *ngIf="shouldShowSender(message, messageGroup.messages)">
                             {{ getUserDisplayName(message) }}
                          </p>
                          <span class="inline-block font-medium bg-zinc-600 pl-3 pb-4 pt-2 whitespace-normal rounded-2xl ml-0 relative"
                             style="word-break: break-word; max-width:80%;">
                          <span class="inline-block pr-4 pb-3">{{ message.text }}</span>
                          <span class="text-xs opacity-70 absolute left-4 bottom-2">
                          {{ getMessageTime(message.createdAt) }}
                          </span>
                          </span>
                       </div>
                    </div>
                    <div *ngIf="message.ownerId === userId" class="grid gap-4 grid-nogutter mb-2">
                       <div class="col text-right">
                          <span class="inline-block text-left font-medium bg-blue-500 pl-3 pb-4 pt-2 whitespace-normal rounded-2xl relative"
                             style="word-break: break-word; max-width:80%;">
                          <span class="inline-block pr-4 pb-3">{{ message.text }}</span>
                          <span class="text-xs opacity-70 absolute left-4 bottom-2">
                          {{ getMessageTime(message.createdAt) }}
                          </span>
                          </span>
                       </div>
                    </div>
                 </div>
              </ng-container>

                <div *ngIf="messages.length === 0" class="text-center p-4">
                    No messages yet. Start the conversation!
                </div>
            </div>
            <div class="p-4 md:p-6 flex flex-col sm:flex-row items-center mt-auto border-t border-surface-200 dark:border-surface-700 gap-4">
                <p-inputgroup>
                <input id="message" type="text" pInputText placeholder="Type a message" class="w-full" [(ngModel)]="textContent" (keydown.enter)="sendMessage()" />
                <p-inputgroup-addon>
                  <p-button icon="pi pi-face-smile" severity="secondary" variant="text" (click)="op.toggle($event)" />
                </p-inputgroup-addon>
                </p-inputgroup>
                <div class="flex w-full sm:w-auto gap-4">
                    <button pButton pRipple [text]="true" size="large" icon="pi pi-send" class="!text-blue-500" (click)="sendMessage()"></button>
                </div>
            </div>
        </div>

        <p-popover #op [styleClass]="'emoji-popover'" [autoZIndex]="true">
            <ng-template pTemplate="content">
                <div class="emoji-container" style="max-height: 200px; max-width: 250px; overflow-y: auto; display: flex; flex-wrap: wrap; justify-content: center;">
                    <button *ngFor="let emoji of emojis"
                            pButton
                            pRipple
                            (click)="op.hide(); onEmojiSelect(emoji)"
                            type="button"
                            [label]="emoji"
                            class="p-1 text-2xl"
                            style="min-width: 40px; margin: 2px;"
                            text>
                    </button>
                </div>
            </ng-template>
        </p-popover>`
})
export class PoamChatComponent implements OnInit {
  @Input() poamId!: number;
  @Input() userId!: number;

  @ViewChild('chatWindow') chatWindow!: ElementRef;

  messages: any[] = [];
  groupedMessages: { date: string; messages: any[] }[] = [];
  textContent: string = '';

  emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😇', '😉',
    '😊', '🙂', '🙃', '😋', '😌', '😍', '🥰', '😘', '😗', '😙',
    '😚', '🤪', '😜', '😝', '😛', '🤑', '😎', '🤓', '🧐', '🤠',
    '🥳', '🤗', '🤡', '😏', '😶', '😐', '😑', '😒', '🙄', '🤨',
    '🤔', '🤫', '🤭', '🤥', '😳', '😞', '😟', '😠', '😡', '🤬',
    '😔', '😕', '🙁', '😬', '🥺', '😣', '😖', '😫', '😩', '🥱',
    '😤', '😮', '😱', '😨', '😰', '😯', '😦', '😧', '😢', '😥'
  ];

  constructor(private poamChatService: PoamChatService) { }

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
          if (this.chatWindow) {
            this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
          }
        });
      },
      error: (err) => {
        console.error('Error loading chat messages:', err);
      }
    });
  }

  formatMessages(data: any[]) {
    return data.map(message => ({
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

    this.messages.forEach(message => {
      const date = this.getMessageDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    this.groupedMessages = Object.keys(groups).map(date => ({
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
          if (this.chatWindow) {
            this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
          }
        });
      },
      error: (err) => {
        console.error('Error sending message:', err);
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
