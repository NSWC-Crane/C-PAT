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
import { AuthService } from '../../auth';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from './login.service';
import { NbPasswordAuthStrategy, NbAuthModule, NbAuthResult, NbAuthJWTToken, NbOAuth2AuthStrategy, NbOAuth2ResponseType, NbOAuth2GrantType, NbAuthOAuth2Token, NbAuthToken,  } from '@nebular/auth';
import { KeycloakService } from 'keycloak-angular'
import { KeycloakProfile, KeycloakRoles } from 'keycloak-js';

@Component({
  selector: 'nb-playground-oauth2-callback',
  templateUrl: './loginCallback.component.html',
})
export class LoginCallbackComponent implements OnDestroy {

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  private destroy$ = new Subject<void>();

  constructor(private AuthService: AuthService, 
    private router: Router, 
    private activateRoute: ActivatedRoute,
    private login: LoginService,
    private readonly keycloak: KeycloakService) {

    this.AuthService.authenticate('redHat')
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (authResult: NbAuthResult) => {
       
        console.log("authResult: ", authResult)
        //let usrName = this.keycloak.getUsername();

        this.userProfile = await this.keycloak.loadUserProfile();
        console.log("userProfile: ",this.userProfile)
        
        // if (authResult.isSuccess()) {
        //   this.AuthService.getToken().subscribe((tk: any) => {
        //     console.log("token: ", tk)
        //   })
//          let payload = token.getPayload();
          
         // console.log("token: ", token)
  //        console.log("payload: ", payload)
          //let t2: NbAuthJWTToken  = payload.access_token.getToken()
          
          //console.log("payload: ", t2.getPayload())


          this.router.navigateByUrl('/');
          //this.router.navigateByUrl('/pages/dashboard');
        //}
      });
  }

  public async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      console.log("userProfile: ",this.userProfile)
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
