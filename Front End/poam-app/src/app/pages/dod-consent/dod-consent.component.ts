/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { Router } from '@angular/router';
import { UsersService } from '../user-processing/users.service';

@Component({
  selector: 'cpat-consent',
  templateUrl: './dod-consent.component.html',
})
export class DoDConsentComponent implements OnInit {
  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;

  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private login: UsersService,
  ) {}

  @ViewChild('consentTemplate') consentTemplate!: TemplateRef<any>;

  public async ngOnInit() {
  }

  async ngAfterViewInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.modalWindow = this.dialogService.open(this.consentTemplate)
    } else {
      this.router.navigateByUrl("/poam-processing");
    } 
  }

  consentOk() {    
    this.login.loginOut("logIn").subscribe(data =>{
      this.router.navigateByUrl("/poam-processing");
    })    
  }
}
