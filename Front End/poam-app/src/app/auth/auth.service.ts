import { Injectable } from '@angular/core';
import { LoginResponse, LogoutAuthOptions, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from '../pages/admin-processing/user-processing/users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(
    private router: Router,
    private oidcSecurityService: OidcSecurityService,
    private usersService: UsersService
  ) { }

  async initializeAuthentication(): Promise<void> {    
    const authResult = await firstValueFrom(this.oidcSecurityService.checkAuthMultiple());
    await this.usersService.loginOut("logIn");

    const isAuthenticatedStigman = authResult.find(auth => auth.configId === 'stigman')?.isAuthenticated;
    const isAuthenticatedCpat = authResult.find(auth => auth.configId === 'cpat')?.isAuthenticated;

    if (!isAuthenticatedStigman) {
      await this.oidcSecurityService.authorize('stigman');
    } else if (!isAuthenticatedCpat) {
      await this.oidcSecurityService.authorize('cpat');
    } else {
      this.router.navigate(['/poam-processing']);
    }
  }


  getAccessToken(configId: string): Observable<string> {
    return this.oidcSecurityService.getAccessToken(configId).pipe(
      map(token => token || '')
    );
  }

  isAuthenticated(configId: string): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated(configId);
  }

  async getUserData(configId: string) {
    return firstValueFrom(this.oidcSecurityService.getUserData(configId));
  }

  login(configId: string): void {
    this.oidcSecurityService.authorize(configId);
  }

  logout(configId: string): void {
    this.oidcSecurityService.logoff(configId, undefined).subscribe((result) => console.log(result));
  }
}
