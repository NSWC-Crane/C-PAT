import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, firstValueFrom, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { Users } from '../../../pages/admin-processing/user-processing/users.model';

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
    const isAuthenticatedStigman = authResult.find(auth => auth.configId === 'stigman')?.isAuthenticated;
    const isAuthenticatedCpat = authResult.find(auth => auth.configId === 'cpat')?.isAuthenticated;

    if (!isAuthenticatedStigman) {
      await this.oidcSecurityService.authorize('stigman');
    } else if (!isAuthenticatedCpat) {
      await this.oidcSecurityService.authorize('cpat');
    } else {
      (await this.usersService.loginState("logIn")).subscribe((result: any) => console.log("[C-PAT] ", result.message));
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

  getUserData(configId: string): Observable<any> {
    return this.oidcSecurityService.getUserData(configId).pipe(
      switchMap(oidcUserData => {
        return from(this.usersService.getCurrentUser()).pipe(
          switchMap((currentUserObservable: Observable<Users>) => {
            return currentUserObservable.pipe(
              map(currentUser => {
                return { ...oidcUserData, ...currentUser };
              })
            );
          })
        );
      })
    );
  }

  async login(configId: string): Promise<void> {
    await this.oidcSecurityService.authorize(configId);
  }

  async logout() {
    await (await this.usersService.loginState("logOut")).subscribe((result: any) => console.log("[C-PAT] ", result.message));
    await this.oidcSecurityService.logoff('stigman', undefined);
    await this.oidcSecurityService.logoff('cpat', undefined).subscribe((result) => console.log(result));
  }
}
