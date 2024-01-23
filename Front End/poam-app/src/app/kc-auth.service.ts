/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Injectable } from '@angular/core';
import { NbAuthJWTToken } from '@nebular/auth';
import { KeycloakService } from 'keycloak-angular'
import { Observable, of } from 'rxjs';

@Injectable()
export class KcAuthService {

  constructor(
    private keyCloakService: KeycloakService
  ) {}

  getLoggedUser() {
    try{
      let userDetails = this.keyCloakService.getKeycloakInstance().idTokenParsed;
      console.log('UserDetails: ', userDetails)
      console.log('userRoles: ', this.keyCloakService.getUserRoles());
      return userDetails;
    } catch (e) {
      console.log('getLoggedUser Exception:', e);
      return undefined;
    }
  }

  resetRole(payload: any) {
    // console.log("resetRole payload: ", payload);
  }

  onTokenChange(): Observable<NbAuthJWTToken>{
    console.log("In onTokenChange kc-auth.service")
    return of();
  }

  logout() {
    this.keyCloakService.logout();
  }

  redirectToProfile() {
    this.keyCloakService.getKeycloakInstance().accountManagement();
  }

  getRoles(): string[]{
    return this.keyCloakService.getUserRoles();
  }
}
