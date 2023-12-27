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
    console.log("resetRole payload: ", payload);
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
