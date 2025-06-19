/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oidcSecurityService = inject(OidcSecurityService);
  const stigmanApiUrl = CPAT.Env.stigman.apiUrl;
  const cpatApiUrl = CPAT.Env.apiBase;

  if (!req.url.includes(stigmanApiUrl) && !req.url.includes(cpatApiUrl)) {
    return next(req);
  }

  const configId = req.url.includes(stigmanApiUrl) ? 'stigman' : 'cpat';

  return from(oidcSecurityService.getAccessToken(configId)).pipe(
    map((token) => {
      if (!token) {
        throw new Error(`No token available for ${configId}`);
      }

      return req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }),
    switchMap((request) => next(request))
  );
};
