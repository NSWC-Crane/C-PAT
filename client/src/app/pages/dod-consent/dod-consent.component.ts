/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, Component, TemplateRef, ViewChild } from '@angular/core';
import { NbDialogService } from "@nebular/theme";
import { Router } from '@angular/router';

@Component({
  selector: 'cpat-consent',
  templateUrl: './dod-consent.component.html',
})
export class DoDConsentComponent implements AfterViewInit {
  modalWindow: any;

  constructor(
    private router: Router,
    private dialogService: NbDialogService,
  ) { }

  @ViewChild('consentTemplate') consentTemplate!: TemplateRef<any>;

  async ngAfterViewInit() {
    this.modalWindow = this.dialogService.open(this.consentTemplate);
  }

  async consentOk() {
      this.router.navigate(['/poam-processing']);
  }

}
