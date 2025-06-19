/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';

interface AuthState {
  isAuthenticatedStigman: boolean;
  isAuthenticatedCpat: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oidcSecurityService = inject(OidcSecurityService);
  private usersService = inject(UsersService);

  private currentUser = new BehaviorSubject<any>(null);
  private accessLevel = new BehaviorSubject<number>(0);
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticatedStigman: false,
    isAuthenticatedCpat: false
  });

  accessLevel$ = this.accessLevel.asObservable();
  user$ = this.currentUser.asObservable();
  authState$ = this.authState.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    if (this.shouldSkipAuth()) {
      return;
    }

    this.oidcSecurityService
      .checkAuthMultiple()
      .pipe(
        tap((authResults) => this.updateAuthState(authResults)),
        switchMap((authResults) => {
          const isAuthenticatedCpat = authResults?.find((auth) => auth.configId === 'cpat')?.isAuthenticated ?? false;

          if (isAuthenticatedCpat) {
            return this.getUserData('cpat').pipe(
              tap((userData) => {
                this.currentUser.next(userData);
                this.accessLevel.next(this.calculateAccessLevel(userData));
              })
            );
          }

          return of(null);
        }),
        catchError((error) => {
          console.error('Auth initialization error:', error);
          this.authState.next({
            isAuthenticatedStigman: false,
            isAuthenticatedCpat: false
          });

          return of(null);
        })
      )
      .subscribe();
  }

  private updateAuthState(authResults: any): void {
    const isAuthenticatedStigman = authResults?.find((auth) => auth.configId === 'stigman')?.isAuthenticated ?? false;
    const isAuthenticatedCpat = authResults?.find((auth) => auth.configId === 'cpat')?.isAuthenticated ?? false;

    this.authState.next({ isAuthenticatedStigman, isAuthenticatedCpat });
  }

  handleAuthFlow(): void {
    if (this.shouldSkipAuth()) {
      return;
    }

    const { isAuthenticatedStigman, isAuthenticatedCpat } = this.authState.getValue();

    if (!isAuthenticatedStigman) {
      this.login('stigman');
    } else if (!isAuthenticatedCpat) {
      this.login('cpat');
    }
  }

  private calculateAccessLevel(userData: any): number {
    return userData?.permissions?.reduce((max: number, p: { accessLevel: number }) => Math.max(max, p.accessLevel), 0) || 0;
  }

  getAccessToken(configId: string): Observable<string> {
    return this.oidcSecurityService.getAccessToken(configId).pipe(
      map((token) => {
        if (!token) {
          throw new Error(`Access token not available for config: ${configId}`);
        }

        return token;
      })
    );
  }

  isAuthenticated(configId: string): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated(configId);
  }

  getUserData(configId: string): Observable<any> {
    return this.oidcSecurityService.getUserData(configId).pipe(switchMap((oidcUserData) => this.usersService.getCurrentUser().pipe(map((currentUser) => ({ ...oidcUserData, ...currentUser })))));
  }

  login(configId: string): void {
    this.oidcSecurityService.authorize(configId);
  }

  logout(): Observable<void> {
    return this.oidcSecurityService.logoff('stigman', undefined).pipe(
      switchMap(() => this.oidcSecurityService.logoff('cpat', undefined)),
      tap(() => {
        this.authState.next({
          isAuthenticatedStigman: false,
          isAuthenticatedCpat: false
        });
        this.currentUser.next(null);
        this.accessLevel.next(0);
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('Logout error:', error);

        return of(undefined);
      })
    );
  }

  private shouldSkipAuth(): boolean {
    if (sessionStorage.getItem('audience-validation-failed') === 'true') {
      return true;
    }

    const errorPaths = ['/401', '/403', '/404', '/not-activated'];
    const currentPath = window.location.pathname;

    return errorPaths.some((path) => currentPath.includes(path));
  }

  clearValidationFailure(): void {
    sessionStorage.removeItem('audience-validation-failed');
  }
}
