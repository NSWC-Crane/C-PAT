import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { VRAMImportService } from './vram-import.service';
import { UsersService } from '../user-processing/users.service';
import { firstValueFrom } from 'rxjs';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-vram-import',
  templateUrl: './vram-import.component.html',
  styleUrls: ['./vram-import.component.scss']
})
export class VRAMImportComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  uploadUrl: string = '/api/import/vram';
  user: any;
  totalSize: string = '0';
  totalSizePercent: number = 0;
  vramUpdatedDate: string = '';

  constructor(
    private messageService: MessageService,
    private vramImportService: VRAMImportService,
    private userService: UsersService
  ) { }

  async ngOnInit() {
    try {
      this.user = await firstValueFrom(await this.userService.getCurrentUser());
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch user data' });
    }
    this.getVramUpdatedDate();
  }

  async getVramUpdatedDate(): Promise<void> {
    (await this.vramImportService.getVramDataUpdatedDate()).subscribe({
      next: (response: any) => {
        if (response && response.value) {
          this.vramUpdatedDate = response.value;
          console.log('VRAM Updated Date:', this.vramUpdatedDate);
        } else {
          console.error('Invalid response format:', response);
          this.vramUpdatedDate = 'N/A';
        }
      },
      error: (error) => {
        console.error('Error fetching VRAM updated date:', error);
        this.vramUpdatedDate = 'Error';
      }
    });
  }

  onUpload() {
    this.messageService.add({ severity: 'info', summary: 'File Uploaded', detail: '' });
  }

  onSelect(event: any) {
    this.updateTotalSize();
  }

  async customUploadHandler(event: any) {
    const file = event.files[0];
    if (!file) {
      console.error('No file selected');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No file selected' });
      return;
    }

    try {
      const upload$ = await this.vramImportService.upload(file);
      upload$.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          } else if (event instanceof HttpResponse) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File uploaded successfully' });
            this.fileUpload.clear();
          }
        },
        error: (error: any) => {
          console.error('Error during file upload:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'File upload failed: ' + (error.error?.message || 'Unknown error') });
        },
        complete: () => {
          this.updateTotalSize();
        }
      });
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
    this.totalSizePercent = (totalSize / 10000000) * 100;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
