/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';
import { SharedService } from '../../../common/services/shared.service';


@Component({
  selector: 'cpat-tenable-import',
  templateUrl: './tenable-import.component.html',
  styleUrls: ['./tenable-import.component.scss']
})
export class TenableImportComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  scanResults: string = '';
  scans: any = [];
  repositoryOptions = [
    { label: 'Placeholder 1', value: '1' },
    { label: 'Placeholder 2', value: '2' },
    { label: 'Placeholder 3', value: '3' },
    { label: 'Placeholder 4', value: '4' },
    { label: 'Placeholder 5', value: '5' }
  ];
  selectedRepository?: string;
  constructor(
    private sharedService: SharedService,
  ) { }

  async ngOnInit() {
  }

  importRepository() {
    console.log('Selected Repository:', this.selectedRepository);
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
  }

  ngOnDestroy() {
  }
}
