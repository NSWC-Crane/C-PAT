/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  NbAlertModule,
  NbInputModule,
  NbButtonModule,
  NbCheckboxModule,
  NbCardModule,
  NbStepperModule,
  NbSpinnerModule,
} from "@nebular/theme";
import { AuthRoutingModule } from "./auth.routing";
import { NbAuthModule } from "@nebular/auth";
import { Angular2SmartTableModule } from 'angular2-smart-table';

@NgModule({
  
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbCardModule,
    NbStepperModule,
    AuthRoutingModule,
    NbAuthModule,
    NbSpinnerModule,
    Angular2SmartTableModule,
  ]
})
export class AuthModule {}
