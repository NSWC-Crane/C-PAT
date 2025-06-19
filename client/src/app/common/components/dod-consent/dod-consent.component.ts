/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'cpat-consent',
  templateUrl: './dod-consent.component.html',
  styleUrls: ['./dod-consent.component.scss'],
  standalone: true,
  imports: [DialogModule, FormsModule, ButtonModule]
})
export class DoDConsentComponent implements OnInit {
  visible: boolean = false;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.visible = true;
  }

  consentOk() {
    this.visible = false;
    this.router.navigate(['/poam-processing']);
  }
}
