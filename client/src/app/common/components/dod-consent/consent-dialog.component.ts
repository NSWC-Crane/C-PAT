/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'cpat-consent-dialog',
  template: `
    <p-header>DoD Consent</p-header>
    <div>
      <p>
        You are accessing a U.S. Government (USG) Information System (IS) that is provided for
        USG-authorized use only. By using this IS (which includes any device attached to this IS),
        you consent to the following conditions: The USG routinely intercepts and monitors
        communications on this IS for purposes including, but not limited to, penetration testing,
        COMSEC monitoring, network operations and defense, personnel misconduct (PM), law
        enforcement (LE), and counterintelligence (CI) investigations. At any time, the USG may
        inspect and seize data stored on this IS.
      </p>
      <p>
        Communications using, or data stored on, this IS are not private, are subject to routine
        monitoring, interception, and search, and may be disclosed or used for any USG-authorized
        purpose. This IS includes security measures (e.g., authentication and access controls) to
        protect USG interests--not for your personal benefit or privacy. Notwithstanding the above,
        using this IS does not constitute consent to PM, LE or CI investigative searching or
        monitoring of the content of privileged communications, or work product, related to personal
        representation or services by attorneys, psychotherapists, or clergy, and their assistants.
        Such communications and work product are private and confidential. See User Agreement for
        details.
      </p>
    </div>
    <p-footer>
      <button
        pButton
        type="button"
        label="OK"
        icon="pi pi-check"
        (click)="consentOk()"
        class="p-button-text consent-button"
      ></button>
    </p-footer>
  `,
  styleUrls: ['./dod-consent.component.scss'],
  standalone: true,
  imports: [DialogModule, FormsModule],
})
export class ConsentDialogComponent {
  constructor(
    private router: Router,
    public ref: DynamicDialogRef
  ) {}

  consentOk() {
    this.router.navigate(['/poam-processing']);
    this.ref.close();
  }
}
