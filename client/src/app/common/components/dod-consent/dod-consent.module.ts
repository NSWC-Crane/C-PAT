/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoDConsentComponent } from './dod-consent.component';
import { ConsentDialogComponent } from './consent-dialog.component';
import { DodConsentRoutingModule } from './dod-consent.routing';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [DoDConsentComponent, ConsentDialogComponent],
  exports: [DoDConsentComponent],
  imports: [
    CommonModule,
    FormsModule,
    DodConsentRoutingModule,
    DialogModule,
    ButtonModule,
    DynamicDialogModule,
  ],
})
export class DoDConsentModule {}
