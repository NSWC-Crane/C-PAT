import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpResponse } from '@angular/common/http';
import { PoamAttachmentService } from './poam-attachments.service';
import { Subscription } from 'rxjs';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'cpat-poam-attachments',
  templateUrl: './poam-attachments.component.html',
  styleUrls: ['./poam-attachments.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    FileUploadModule,
    TableModule,
    ProgressBarModule,
    BadgeModule,
    ToastModule,
    TooltipModule,
    DatePipe,
  ],
})
export class PoamAttachmentsComponent implements OnInit, OnDestroy {
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  @Input() poamId: number;
  protected accessLevel: any;
  user: any;
  payload: any;
  totalSize: string = '0';
  totalSizePercent: number = 0;
  attachedFiles: any[] = [];
  allowedTypes: any = [
    '.xls',
    '.xlsx',
    '.xlsm',
    '.xlsb',
    '.xltx',
    '.xltm',
    '.xlt',
    '.doc',
    '.docx',
    '.docm',
    '.dotx',
    '.dotm',
    '.dot',
    '.ppt',
    '.pptx',
    '.pptm',
    '.potx',
    '.potm',
    '.pot',
    '.pdf',
    '.txt',
    '.rtf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.tiff',
    '.tif',
    '.svg',
    '.csv',
    '.xml',
    '.json',
    '.msg',
  ];
  private payloadSubscription: Subscription[] = [];

  constructor(
    private messageService: MessageService,
    private poamAttachmentService: PoamAttachmentService,
    private setPayloadService: PayloadService
  ) {}

  async ngOnInit() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.loadAttachedFiles();
        }
      })
    );
  }

  loadAttachedFiles() {
    this.poamAttachmentService.getAttachmentsByPoamId(this.poamId).subscribe({
      next: (attachments: any) => {
        this.attachedFiles = attachments;
      },
      error: (error) => {
        console.error('Error fetching attached files:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch attached files'
        });
      }
    });
  }

  downloadFile(attachment: any) {
    this.poamAttachmentService.downloadAttachment(this.poamId, attachment.attachmentId)
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.filename;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading file:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to download file'
          });
        }
      });
  }

  deleteAttachment(attachment: any) {
    this.poamAttachmentService.deleteAttachment(this.poamId, attachment.attachmentId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully'
          });
          this.loadAttachedFiles();
        },
        error: (error) => {
          console.error('Error deleting file:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete file'
          });
        }
      });
  }

  onUpload() {
    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: '',
    });
  }

  onSelect(_event: any) {
    this.updateTotalSize();
  }

  validateFile(file: File): boolean {
    if (file.size > 5242880) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'File size exceeds 5MB limit.',
      });
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedTypes.includes(fileExtension)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'File type not allowed.',
      });
      return false;
    }

    return true;
  }

  customUploadHandler(event: any) {
    const file = event.files[0];
    if (!file) {
      console.error('No file selected');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No file selected'
      });
      return;
    }

    if (!this.user?.userId) {
      console.error('User ID is not available');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID is not available'
      });
      return;
    }

    if (this.validateFile(file)) {
      this.poamAttachmentService.uploadAttachment(file, +this.poamId)
        .subscribe({
          next: (event: any) => {
            if (event instanceof HttpResponse) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'File uploaded successfully'
              });
              this.fileUpload.clear();
              this.loadAttachedFiles();
            }
          },
          error: (error) => {
            console.error('Error during file upload:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'File upload failed: ' + (error.error?.message || 'Unknown error')
            });
          },
          complete: () => {
            this.updateTotalSize();
          }
        });
    } else {
      this.fileUpload.clear();
    }
  }

  choose(event: Event, chooseCallback: Function) {
    event.stopPropagation();
    chooseCallback();
  }

  uploadEvent(uploadCallback: Function) {
    uploadCallback();
  }

  onRemoveFile(event: Event, file: File, removeCallback: Function) {
    event.stopPropagation();
    removeCallback(file);
    this.updateTotalSize();
  }

  updateTotalSize() {
    let totalSize = 0;
    if (this.fileUpload.files) {
      for (const file of this.fileUpload.files) {
        totalSize += file.size;
      }
    }
    this.totalSize = this.formatSize(totalSize);
    this.totalSizePercent = (totalSize / 5242880) * 100;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
