/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConsentDialogComponent } from './consent-dialog.component';

@Component({
  selector: 'cpat-consent',
  templateUrl: './dod-consent.component.html',
  providers: [DialogService]
})
export class DoDConsentComponent implements AfterViewInit {
  modalWindow: DynamicDialogRef | undefined;

  constructor(
    private router: Router,
    private dialogService: DialogService
  ) { }

  async ngAfterViewInit() {
    this.modalWindow = this.dialogService.open(ConsentDialogComponent, {
      header: 'DoD Consent',
      width: '70%'
    });
  }

  consentOk() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
  }
}
