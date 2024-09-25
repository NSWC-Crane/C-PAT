/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND 
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { eMASSImportService } from './emass-import.service';
import { UsersService } from '../user-processing/users.service';
import { firstValueFrom } from 'rxjs';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-emass-import',
  templateUrl: './emass-import.component.html',
  styleUrls: ['./emass-import.component.scss'],
})
export class EmassImportComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  uploadUrl: string = '/api/import/poams';
  user: any;
  totalSize: string = '0';
  totalSizePercent: number = 0;

  constructor(
    private messageService: MessageService,
    private eMASSImportService: eMASSImportService,
    private userService: UsersService,
  ) {}

  async ngOnInit() {
    try {
      this.user = await firstValueFrom(await this.userService.getCurrentUser());
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch user data',
      });
    }
  }

  onUpload() {
    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: '',
    });
  }

  onSelect(event: any) {
    this.updateTotalSize();
  }

  async customUploadHandler(event: any) {
    const file = event.files[0];
    if (!file) {
      console.error('No file selected');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No file selected',
      });
      return;
    }

    if (!this.user || !this.user.userId) {
      console.error('User ID is not available');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID is not available',
      });
      return;
    }

    try {
      const upload$ = await this.eMASSImportService.upload(
        file,
        this.user.userId,
      );
      upload$.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
          } else if (event instanceof HttpResponse) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'File uploaded successfully',
            });
            this.fileUpload.clear();
          }
        },
        error: (error) => {
          console.error('Error during file upload:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'File upload failed: ' +
              (error.error?.message || 'Unknown error'),
          });
        },
        complete: () => {
          this.updateTotalSize();
        },
      });
    } catch (error) {
      console.error('Error initiating file upload:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initiate file upload',
      });
    }
  }

  choose(event: Event, chooseCallback: Function) {
    chooseCallback();
  }

  uploadEvent(uploadCallback: Function) {
    uploadCallback();
  }

  onRemoveFile(
    event: Event,
    file: File,
    removeCallback: Function,
    index: number,
  ) {
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
