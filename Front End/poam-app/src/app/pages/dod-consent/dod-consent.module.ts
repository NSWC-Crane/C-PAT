/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoDConsentComponent } from './dod-consent.component';
import { DodConsentRoutingModule } from './dod-consent.routing';
import { NbButtonModule, NbCardModule, NbThemeModule, NbSelectModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        DoDConsentComponent,
    ],
    exports: [
        DoDConsentComponent,
    ],
    imports: [
        CommonModule,
        NgChartsModule,
        FormsModule,
        DodConsentRoutingModule,
        NbButtonModule,
        NbCardModule,
        NbThemeModule,
        Angular2SmartTableModule,
        NbSelectModule,
    ]
})
export class DoDConsentModule { }
