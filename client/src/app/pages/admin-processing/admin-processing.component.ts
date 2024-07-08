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
import { FileUploadService } from '../import-processing/emass-import/file-upload.service';
import { UsersService } from './user-processing/users.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { SubSink } from 'subsink';
import { Router } from '@angular/router';
import { StatusDialogComponent } from '../../Shared/components/status-dialog/status-dialog.component';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss']
})
export class AdminProcessingComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild(StatusDialogComponent) statusDialog!: StatusDialogComponent;

  user: any;
  private subs = new SubSink();
  statusCards = [
    {
      title: 'User Management',
      icon: 'pi-user',
      type: 'primary',
      component: 'cpat-user-processing',
    },
    {
      title: 'Collection Management',
      icon: 'pi-inbox',
      type: 'success',
      component: 'cpat-collection-processing',
    },
    {
      title: 'STIG Manager',
      icon: 'pi-flag',
      type: 'info',
      component: 'cpat-stigmanager-admin',
    },
    {
      title: 'eMASS Excel Import',
      icon: 'pi-upload',
      type: 'warning',
    }
  ];

  constructor(
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

      this.statusDialog.display = true;
      this.statusDialog.progress = 0;
      this.statusDialog.message = '';

      (await this.fileUploadService.upload(file, this.user.userId)).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.statusDialog.progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          } else if (event instanceof HttpResponse) {
            this.statusDialog.uploadComplete = true;
            this.statusDialog.message = 'Upload successful!';
            setTimeout(() => this.statusDialog.display = false, 1500);
          }
        },
        error: (error) => {
          console.error('Error during file upload:', error);
          this.statusDialog.message = 'An error occurred during upload.';
        },
      });
    }
  }
}
