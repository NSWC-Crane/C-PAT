/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../../Shared/shared.service';



@Component({
  selector: 'cpat-tenable-import',
  templateUrl: './tenable-import.component.html',
  styleUrls: ['./tenable-import.component.scss']
})
export class TenableImportComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userProfile: KeycloakProfile | null = null;
  scanResults: string = '';
  scans: any = [];
  private subs = new SubSink()
  constructor(
    private sharedService: SharedService,
    private dialogService: NbDialogService,
    private http: HttpClient,
    private keycloak: KeycloakService
  ) { }

  async ngOnInit() {
    this.isLoggedIn = this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }
  }


  importScans(): void {
    this.sharedService.getTenableScans('id,name')
      .subscribe({
        next: (data: any) => {
          this.scans = data
        },
        error: (error: any) => {
          console.warn('Unable to retrieve list of scans.');
        }
      });
  }

  importScanResults(scanResultId: any): void {
    const fields = 'id,name,description,status,initiator,owner,ownerGroup,repository,scan,job,details,importStatus,importStart,importFinish,importDuration,downloadAvailable,downloadFormat,dataFormat,resultType,resultSource,running,errorDetails,importErrorDetails,totalIPs,scannedIPs,startTime,finishTime,scanDuration,completedIPs,completedChecks,totalChecks,agentScanUUID,agentScanContainerUUID,progress';
    this.sharedService.getTenableScanResults(scanResultId, fields)
      .subscribe({
        next: (data: any) => {
          const plainText = this.parseJsonToPlainText(data);
          this.scanResults = plainText;
        },
        error: (error: any) => {
          this.showPopup('Tenable API key is not properly configured, please contact your C-PAT administrator.');
        }
      });
  }

  parseJsonToPlainText(data: any, indent: string = ''): string {
    let plainText = '';
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object' && data[key] !== null) {
        plainText += `${indent}${key}:\n${this.parseJsonToPlainText(data[key], indent + '  ')}`;
      } else {
        plainText += `${indent}${key}: ${data[key]}\n`;
      }
    });
    return plainText;
  }


  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false'
    };

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        options: dialogOptions
      }
    });
  }

  ngOnDestroy() {
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;
}
