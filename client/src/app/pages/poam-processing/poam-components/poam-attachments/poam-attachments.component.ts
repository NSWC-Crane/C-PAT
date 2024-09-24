import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { PoamAttachmentService } from './poam-attachments.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { FileUpload } from 'primeng/fileupload';
import { PayloadService } from '../../../../common/services/setPayload.service';

@Component({
  selector: 'app-poam-attachments',
  templateUrl: './poam-attachments.component.html',
  styleUrls: ['./poam-attachments.component.scss']
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
    '.xls', '.xlsx', '.xlsm', '.xlsb', '.xltx', '.xltm', '.xlt',
    '.doc', '.docx', '.docm', '.dotx', '.dotm', '.dot', '.ppt',
    '.pptx', '.pptm', '.potx', '.potm', '.pot', '.pdf', '.txt',
    '.rtf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
    '.tif', '.svg', '.csv', '.xml', '.json', '.msg'
  ];
  private payloadSubscription: Subscription[] = [];

  constructor(
    private messageService: MessageService,
    private poamAttachmentService: PoamAttachmentService,
    private setPayloadService: PayloadService
  ) { }

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

  async loadAttachedFiles() {
    try {
      const attachments$ = await this.poamAttachmentService.getAttachmentsByPoamId(this.poamId);
      this.attachedFiles = await firstValueFrom(attachments$);
    } catch (error) {
      console.error('Error fetching attached files:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch attached files' });
    }
  }

  async downloadFile(attachment: any) {
    try {
      const blob = await (await this.poamAttachmentService.downloadAttachment(this.poamId, attachment.attachmentId)).toPromise();
      const url = window.URL.createObjectURL(blob!);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download file' });
    }
  }

  async deleteAttachment(attachment: any) {
    try {
      await (await this.poamAttachmentService.deleteAttachment(this.poamId, attachment.attachmentId)).toPromise();
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File deleted successfully' });
      this.loadAttachedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete file' });
    }
  }

  onUpload() {
    this.messageService.add({ severity: 'info', summary: 'File Uploaded', detail: '' });
  }

  onSelect(event: any) {
    this.updateTotalSize();
  }

  validateFile(file: File): boolean {
    if (file.size > 5242880) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'File size exceeds 5MB limit.' });
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedTypes.includes(fileExtension)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'File type not allowed.' });
      return false;
    }

    return true;
  }

  async customUploadHandler(event: any) {
    const file = event.files[0];
    if (!file) {
      console.error('No file selected');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No file selected' });
      return;
    }

    if (!this.user?.userId) {
      console.error('User ID is not available');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User ID is not available' });
      return;
    }

    try {
      if (this.validateFile(file)) {
        const upload$ = await this.poamAttachmentService.uploadAttachment(file, +this.poamId);
        upload$.subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              const percentDone = event.total ? Math.round(100 * event.loaded / event.total) : 0;
            } else if (event instanceof HttpResponse) {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File uploaded successfully' });
              this.fileUpload.clear();
              this.loadAttachedFiles();
            }
          },
          error: (error) => {
            console.error('Error during file upload:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'File upload failed: ' + (error.error?.message || 'Unknown error') });
          },
          complete: () => {
            this.updateTotalSize();
          }
        });
      } else {
        this.fileUpload.clear();
      }
    } catch (error) {
      console.error('Error initiating file upload:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initiate file upload' });
    }
  }

  choose(event: Event, chooseCallback: Function) {
    chooseCallback();
  }

  uploadEvent(uploadCallback: Function) {
    uploadCallback();
  }

  onRemoveFile(event: Event, file: File, removeCallback: Function, index: number) {
    removeCallback(file);
    this.updateTotalSize();
  }

  updateTotalSize() {
    let totalSize = 0;
    if (this.fileUpload.files) {
      for (let file of this.fileUpload.files) {
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
