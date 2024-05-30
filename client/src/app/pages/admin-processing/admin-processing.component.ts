/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { UserProcessingComponent } from './user-processing/user-processing.component';
import { CollectionProcessingComponent } from './collection-processing/collection-processing.component';
import { STIGManagerAdminComponent } from './stigmanager-admin/stigmanager-admin.component';
import { StatusDialogComponent } from '../../Shared/components/status-dialog/status-dialog.component';
import { FileUploadService } from '../import-processing/emass-import/file-upload.service';
import { UsersService } from './user-processing/users.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { SubSink } from 'subsink';
import { Router } from '@angular/router';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss']
})
export class AdminProcessingComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  user: any;
  private subs = new SubSink();
  statusCards = [
    {
      title: 'User Management',
      icon: { icon: 'people-outline' },
      type: 'primary',
      component: 'cpat-user-processing',
    },
    {
      title: 'Collection Management',
      icon: { icon: 'archive-outline' },
      type: 'success',
      component: 'cpat-collection-processing',
    },
    {
      title: 'STIG Manager',
      icon: { icon: 'flag-outline' },
      type: 'info',
      component: 'cpat-stigmanager-admin',
    },
    {
      title: 'eMASS Excel Import',
      icon: { icon: 'upload-outline' },
      type: 'warning',
    }
  ];

  constructor(
    private dialogService: NbDialogService,
    private fileUploadService: FileUploadService,
    private userService: UsersService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.user = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        this.user = response;
      },
      error: async (error) => {
        console.error('An error occurred:', error.message)
      }
    });
  }  

  openModal(component?: string) {
    switch (component) {
      case 'cpat-user-processing':
        this.router.navigate(['/admin-processing/user-processing']);
        break;
      case 'cpat-collection-processing':
        this.router.navigate(['/admin-processing/collection-processing']);
        break;
      case 'cpat-stigmanager-admin':
        this.router.navigate(['/admin-processing/stigmanager-admin']);
        break;
      default:
        break;
    }
  }
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      if (!this.user) {
        console.error('User information or lastCollectionAccessedId is not available');
        return;
      }

      const dialogRef = this.dialogService.open(StatusDialogComponent, {
        context: { progress: 0, message: '' }
      });

      (await this.fileUploadService.upload(file, this.user.userId)).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
            dialogRef.componentRef.instance.progress = progress;
          } else if (event instanceof HttpResponse) {
            dialogRef.componentRef.instance.uploadComplete = true;
            dialogRef.componentRef.instance.message = 'Upload successful!';
            setTimeout(() => dialogRef.close(), 1500);
          }
        },
        error: (error) => {
          console.error('Error during file upload:', error);
          dialogRef.componentRef.instance.message = 'An error occurred during upload.';
        },
      });
    }
  }
}
