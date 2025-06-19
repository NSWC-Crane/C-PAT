/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, ViewChild, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { VramPopupComponent } from '../../../common/components/vram-popup/vram-popup.component';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { UsersService } from '../user-processing/users.service';
import { VRAMImportService } from './vram-import.service';

@Component({
  selector: 'cpat-vram-import',
  templateUrl: './vram-import.component.html',
  styleUrls: ['./vram-import.component.scss'],
  standalone: true,
  imports: [BadgeModule, ButtonModule, CardModule, CommonModule, FileUploadModule, FormsModule, ProgressBarModule, ToastModule, VramPopupComponent],
  providers: [MessageService]
})
export class VRAMImportComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private vramImportService = inject(VRAMImportService);
  private userService = inject(UsersService);

  @ViewChild('fileUpload') fileUpload!: FileUpload;
  @Output() navigateToPluginMapping = new EventEmitter<void>();
  uploadUrl: string = '/api/import/vram';
  user: any;
  totalSize: string = '0';
  totalSizePercent: number = 0;
  vramUpdatedDate: string = '';
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.userService
      .getCurrentUser()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to fetch user data: ${getErrorMessage(error)}`
          });

          return EMPTY;
        })
      )
      .subscribe((user) => {
        this.user = user;
      });

    this.getVramUpdatedDate();
  }

  getVramUpdatedDate() {
    this.vramImportService
      .getVramDataUpdatedDate()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.vramUpdatedDate = response?.value || 'N/A';
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching VRAM updated date: ${getErrorMessage(error)}`
          });
          this.vramUpdatedDate = 'Error';
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

  customUploadHandler(event: any) {
    const file = event.files[0];

    if (!file) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No file selected'
      });

      return;
    }

    this.vramImportService
      .upload(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            if (event.body?.message === 'File is not newer than the last update. No changes made.') {
              this.messageService.add({
                severity: 'info',
                summary: 'Information',
                detail: event.body.message
              });
            } else {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'File uploaded successfully'
              });
              setTimeout(() => this.navigateToPluginMapping.emit(), 1000);
            }

            this.fileUpload.clear();
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
    this.totalSizePercent = (totalSize / 10485760) * 100;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
