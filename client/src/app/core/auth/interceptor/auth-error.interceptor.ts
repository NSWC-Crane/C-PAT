/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService, LoginResponse } from 'angular-auth-oidc-client';
import { MessageService } from 'primeng/api';
import { catchError, throwError, from, switchMap, mergeMap, firstValueFrom, defer } from 'rxjs';

let refreshTokenPromise: Promise<[LoginResponse, LoginResponse]> | null = null;

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const oidcSecurityService = inject(OidcSecurityService);
  const messageService = inject(MessageService);

  const handleReauthentication = () => {
    sessionStorage.setItem('auth-redirect-url', globalThis.location.pathname + globalThis.location.search);

    if (req.method !== 'GET') {
      messageService.add({
        severity: 'error',
        summary: 'Session Expired',
        detail: 'Please save your work and login again.',
        sticky: true
      });

      setTimeout(() => {
        if (confirm('Your session has expired. Click OK to login again. Make sure to save your work first!')) {
          oidcSecurityService.authorize('stigman');
        }
      }, 100);
    } else {
      oidcSecurityService.authorize('stigman');
    }
  };

  const performTokenRefresh = (): Promise<[LoginResponse, LoginResponse]> => {
    if (!refreshTokenPromise) {
      refreshTokenPromise = Promise.all([firstValueFrom(oidcSecurityService.forceRefreshSession({}, 'stigman')), firstValueFrom(oidcSecurityService.forceRefreshSession({}, 'cpat'))]).finally(() => {
        refreshTokenPromise = null;
      });
    }

    return refreshTokenPromise;
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.detail?.includes('jwt audience invalid')) {
        console.error('JWT audience validation failed:', error.error.detail);

        sessionStorage.setItem('audience-validation-failed', 'true');

        router.navigate(['/401']);

        return throwError(() => new Error('Audience validation failed'));
      }

      if (error.status === 401 && (error.error?.detail?.includes('jwt expired') || error.error?.detail?.includes('token expired'))) {
        const stigmanApiUrl = CPAT.Env.stigman.apiUrl;
        const configId = req.url.includes(stigmanApiUrl) ? 'stigman' : 'cpat';

        return defer(() => from(performTokenRefresh())).pipe(
          mergeMap(([stigmanResult, cpatResult]) => {
            const stigmanSuccess = stigmanResult?.isAuthenticated || false;
            const cpatSuccess = cpatResult?.isAuthenticated || false;

            if (!stigmanSuccess || !cpatSuccess) {
              handleReauthentication();

              return throwError(() => new Error('Token refresh failed'));
            }

            return from(oidcSecurityService.getAccessToken(configId)).pipe(
              switchMap((newToken) => {
                if (!newToken) {
                  throw new Error('No token available after refresh');
                }

                const clonedRequest = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });

                return next(clonedRequest);
              })
            );
          }),
          catchError((refreshError) => {
            handleReauthentication();

            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
