/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app-routing.module';
import { providePrimeNG } from 'primeng/config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, withAppInitializerAuthCheck } from 'angular-auth-oidc-client';
import { APP_BASE_HREF } from '@angular/common';
import Noir from './app/app-theme';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { authInterceptor } from './app/core/auth/interceptor/auth.interceptor';
import { authErrorInterceptor } from './app/core/auth/interceptor/auth-error.interceptor';
import { ConfirmationService, MessageService } from 'primeng/api';

if (environment.production) {
  enableProdMode();
}

function getScopeStr(configId: string) {
  const cpatScopePrefix = CPAT.Env.oauth.scopePrefix;
  const stigmanScopePrefix = CPAT.Env.stigman.scopePrefix;
  let scopes: string[] = [];

  if (configId === 'cpat') {
    scopes = [
      `${cpatScopePrefix}c-pat:read`,
      `${cpatScopePrefix}c-pat:write`,
      `${cpatScopePrefix}c-pat:op`,
      'openid'
    ];
  } else if (configId === 'stigman') {
    scopes = [
      `${stigmanScopePrefix}stig-manager:stig`,
      `${stigmanScopePrefix}stig-manager:stig:read`,
      `${stigmanScopePrefix}stig-manager:collection`,
      `${stigmanScopePrefix}stig-manager:user`,
      `${stigmanScopePrefix}stig-manager:user:read`,
      `${stigmanScopePrefix}stig-manager:op`,
      'openid'
    ];
  }

  if (CPAT.Env.oauth.extraScopes && configId === 'cpat') {
    scopes.push(...CPAT.Env.oauth.extraScopes.split(' '));
  } else if (CPAT.Env.stigman.extraScopes && configId === 'stigman') {
    scopes.push(...CPAT.Env.stigman.extraScopes.split(' '));
  }
  return scopes.join(' ');
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: APP_BASE_HREF, useValue: "/" },
    provideAnimationsAsync(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    providePrimeNG({ theme: Noir, ripple: false, inputStyle: 'outlined' }),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule
    ),
    provideAuth({
      config: [
        {
          configId: 'cpat',
          authority: CPAT.Env.oauth.authority,
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: CPAT.Env.oauth.clientId,
          scope: getScopeStr('cpat'),
          responseType: 'code',
          useRefreshToken: true,
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          autoUserInfo: true,
          renewUserInfoAfterTokenRenew: false,
          triggerAuthorizationResultEvent: true,
          startCheckSession: true,
          postLoginRoute: '/poam-processing',
          unauthorizedRoute: '/403',
          forbiddenRoute: '/401',
          tokenRefreshInSeconds: 6,
          refreshTokenRetryInSeconds: 6,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          disableRefreshIdTokenAuthTimeValidation: true
        },
        {
          configId: 'stigman',
          authority: CPAT.Env.oauth.authority,
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: CPAT.Env.stigman.clientId,
          scope: getScopeStr('stigman'),
          responseType: 'code',
          useRefreshToken: true,
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          autoUserInfo: true,
          renewUserInfoAfterTokenRenew: false,
          triggerAuthorizationResultEvent: true,
          startCheckSession: true,
          unauthorizedRoute: '/403',
          forbiddenRoute: '/401',
          tokenRefreshInSeconds: 6,
          refreshTokenRetryInSeconds: 6,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          disableRefreshIdTokenAuthTimeValidation: true
        }
      ]
    }, withAppInitializerAuthCheck()),
    provideHttpClient(withInterceptors([authInterceptor, authErrorInterceptor])),
    MessageService,
    ConfirmationService
  ]
}).catch(err => console.error(err));
