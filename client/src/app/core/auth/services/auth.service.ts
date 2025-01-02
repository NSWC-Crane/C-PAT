import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, firstValueFrom, from } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { Users } from '../../../pages/admin-processing/user-processing/users.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStateInitialized = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<any>(null);
  private accessLevel = new BehaviorSubject<number>(0);
  accessLevel$ = this.accessLevel.asObservable();
  user$ = this.currentUser.asObservable();

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private usersService: UsersService
  ) {}

  async initializeApplication(): Promise<void> {
    try {
      await this.initializeAuthentication();
      await firstValueFrom(this.waitForAuthInitialized());

      const userData = await firstValueFrom(this.getUserData('cpat'));
      this.currentUser.next(userData);
      this.accessLevel.next(this.calculateAccessLevel(userData));
    } catch (error) {
      console.error('Application initialization error:', error);
      throw error;
    }
  }

  private calculateAccessLevel(userData: any): number {
    return (
      userData?.permissions?.reduce(
        (max: number, p: { accessLevel: number }) => Math.max(max, p.accessLevel),
        0
      ) || 0
    );
  }

  async initializeAuthentication(): Promise<void> {
    try {
      const authResult = await firstValueFrom(this.oidcSecurityService.checkAuthMultiple());

      const isAuthenticatedStigman = authResult.find(
        auth => auth.configId === 'stigman'
      )?.isAuthenticated;
      const isAuthenticatedCpat = authResult.find(
        auth => auth.configId === 'cpat'
      )?.isAuthenticated;

      if (!isAuthenticatedStigman) {
        await this.oidcSecurityService.authorize('stigman');
      } else if (!isAuthenticatedCpat) {
        await this.oidcSecurityService.authorize('cpat');
      } else {
        this.authStateInitialized.next(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.authStateInitialized.next(false);
    }
  }

  waitForAuthInitialized(): Observable<boolean> {
    return this.authStateInitialized.pipe(
      filter(initialized => initialized === true),
      take(1)
    );
  }

  getAccessToken(configId: string): Observable<string> {
    return this.oidcSecurityService.getAccessToken(configId).pipe(map(token => token || ''));
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
    await this.oidcSecurityService.logoff('stigman', undefined);
    await this.oidcSecurityService
      .logoff('cpat', undefined)
      .subscribe(() => console.log('[C-PAT] Logout Success'));
  }
}
