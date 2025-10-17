/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { PayloadService } from '../../../../../common/services/setPayload.service';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { PoamAttachmentService } from '../../services/poam-attachments.service';

@Component({
  selector: 'cpat-poam-attachments',
  templateUrl: './poam-attachments.component.html',
  styleUrls: ['./poam-attachments.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, FileUploadModule, TableModule, ProgressBarModule, BadgeModule, ToastModule, TooltipModule, DatePipe]
})
export class PoamAttachmentsComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private poamAttachmentService = inject(PoamAttachmentService);
  private setPayloadService = inject(PayloadService);

  readonly fileUpload = viewChild.required<FileUpload>('fileUpload');
  @Input() poamId: number | string;
  private accessLevelSubscription: Subscription;
  protected accessLevel: any;
  totalSize: string = '0';
  totalSizePercent: number = 0;
  attachedFiles: any[] = [];
  allowedTypes: any = [
    '.xccdf',
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
    '.html',
    '.zip',
    '.tar.gz',
    '.tar.bz2',
    '.log',
    '.md',
    '.yaml',
    '.yml',
    '.nessus',
    '.txt'
  ];

  async ngOnInit() {
    this.setPayloadService.setPayload();
    this.accessLevelSubscription = this.setPayloadService.accessLevel$.subscribe((level) => {
      this.accessLevel = level;

      if (this.accessLevel > 0) {
        this.loadAttachedFiles();
      }
    });
  }

  loadAttachedFiles() {
    if (this.poamId === 'ADDPOAM') {
      return;
    }

    this.poamAttachmentService.getAttachmentsByPoamId(+this.poamId).subscribe({
      next: (attachments: any) => {
        this.attachedFiles = attachments;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to fetch attached files: ${getErrorMessage(error)}`
        });
      }
    });
  }

  downloadFile(attachment: any) {
    this.poamAttachmentService.downloadAttachment(+this.poamId, attachment.attachmentId).subscribe({
      next: (blob: any) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = attachment.filename;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to download file: ${getErrorMessage(error)}`
        });
      }
    });
  }

  deleteAttachment(attachment: any) {
    this.poamAttachmentService.deleteAttachment(+this.poamId, attachment.attachmentId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'File deleted successfully'
        });
        this.loadAttachedFiles();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to delete file: ${getErrorMessage(error)}`
        });
      }
    });
  }

  onUpload() {
    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: ''
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
        detail: 'File size exceeds 5MB limit.'
      });

      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!this.allowedTypes.includes(fileExtension)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'File type not allowed.'
      });

      return false;
    }

    return true;
  }
  customUploadHandler(event: any) {
    if (this.poamId === 'ADDPOAM') {
      return;
    }

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

    if (this.validateFile(file)) {
      this.poamAttachmentService.uploadAttachment(file, +this.poamId).subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'File uploaded successfully'
            });
            this.fileUpload().clear();
            this.loadAttachedFiles();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `File upload failed: ${getErrorMessage(error)}`
          });
        },
        complete: () => {
          this.updateTotalSize();
        }
      });
    } else {
      this.fileUpload().clear();
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

    const fileUpload = this.fileUpload();

    if (fileUpload.files) {
      for (const file of fileUpload.files) {
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

  ngOnDestroy() {
    if (this.accessLevelSubscription) {
      this.accessLevelSubscription.unsubscribe();
    }
  }
}
