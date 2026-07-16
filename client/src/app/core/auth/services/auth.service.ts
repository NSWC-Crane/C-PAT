/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { UsersService } from '../../../pages/admin-processing/user-processing/users.service';
import { Router } from '@angular/router';

interface AuthState {
  isAuthenticatedStigman: boolean;
  isAuthenticatedCpat: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<any>(null);
  private readonly _accessLevel = signal<number>(0);
  private readonly _authState = signal<AuthState>({
    isAuthenticatedStigman: false,
    isAuthenticatedCpat: false
  });

  readonly user = this._currentUser.asReadonly();
  readonly accessLevel = this._accessLevel.asReadonly();
  readonly authState = this._authState.asReadonly();

  accessLevel$ = toObservable(this._accessLevel);
  user$ = toObservable(this._currentUser);
  authState$ = toObservable(this._authState);

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
            return this.getUserData().pipe(
              tap((userData) => {
                this._currentUser.set(userData);
                this._accessLevel.set(this.calculateAccessLevel(userData));
              })
            );
          }

          return of(null);
        }),
        tap(() => {
          const { isAuthenticatedStigman, isAuthenticatedCpat } = this._authState();
          const redirectUrl = sessionStorage.getItem('auth-redirect-url');

          if (redirectUrl && isAuthenticatedStigman && isAuthenticatedCpat) {
            sessionStorage.removeItem('auth-redirect-url');
            this.router.navigateByUrl(redirectUrl);
          }
        }),
        catchError((error) => {
          console.error('Auth initialization error:', error);
          this._authState.set({
            isAuthenticatedStigman: false,
            isAuthenticatedCpat: false
          });

          return of(null);
        })
      )
      .subscribe(() => {
        this.handleAuthFlow();
      });
  }

  private updateAuthState(authResults: any): void {
    const isAuthenticatedStigman = authResults?.find((auth) => auth.configId === 'stigman')?.isAuthenticated ?? false;
    const isAuthenticatedCpat = authResults?.find((auth) => auth.configId === 'cpat')?.isAuthenticated ?? false;

    this._authState.set({ isAuthenticatedStigman, isAuthenticatedCpat });
  }

  handleAuthFlow(): void {
    if (this.shouldSkipAuth()) {
      return;
    }

    const { isAuthenticatedStigman, isAuthenticatedCpat } = this._authState();

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

  getUserData(): Observable<any> {
    return this.usersService.getCurrentUser();
  }

  login(configId: string): void {
    this.oidcSecurityService.authorize(configId);
  }

  logout(): Observable<void> {
    return this.oidcSecurityService.logoff('stigman').pipe(
      switchMap(() => this.oidcSecurityService.logoff('cpat')),
      tap(() => {
        this._authState.set({
          isAuthenticatedStigman: false,
          isAuthenticatedCpat: false
        });
        this._currentUser.set(null);
        this._accessLevel.set(0);
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
    const currentPath = globalThis.location.pathname;

    return errorPaths.some((path) => currentPath.includes(path));
  }

  clearValidationFailure(): void {
    sessionStorage.removeItem('audience-validation-failed');
  }
}
