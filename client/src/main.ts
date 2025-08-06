/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAuth, withAppInitializerAuthCheck } from 'angular-auth-oidc-client';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app/app-routing.module';
import Noir from './app/app-theme';
import { AppComponent } from './app/app.component';
import { authErrorInterceptor } from './app/core/auth/interceptor/auth-error.interceptor';
import { authInterceptor } from './app/core/auth/interceptor/auth.interceptor';
import { environment } from './environments/environment';
import { DialogService } from 'primeng/dynamicdialog';

if (environment.production) {
  enableProdMode();
}

const basePath = CPAT.Env.basePath || '';

document.documentElement.style.setProperty('--app-base-path', basePath + '/');

function parseScopes(scopeValue: string | string[] | undefined): string[] {
  if (typeof scopeValue === 'string') {
    return scopeValue.split(' ');
  } else if (Array.isArray(scopeValue)) {
    return scopeValue;
  } else {
    return [];
  }
}

function getScopeStr(configId: string) {
  const cpatScopePrefix = CPAT.Env.oauth.scopePrefix;
  const stigmanScopePrefix = CPAT.Env.stigman.scopePrefix;
  let scopes: string[] = [];

  if (configId === 'cpat') {
    scopes = [`${cpatScopePrefix}c-pat:read`, `${cpatScopePrefix}c-pat:write`, `${cpatScopePrefix}c-pat:op`, 'openid'];
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
    scopes.push(...parseScopes(CPAT.Env.oauth.extraScopes));
  } else if (CPAT.Env.stigman.extraScopes && configId === 'stigman') {
    scopes.push(...parseScopes(CPAT.Env.stigman.extraScopes));
  }

  return scopes.join(' ');
}

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: APP_BASE_HREF,
      useFactory: () => document.querySelector('base')?.getAttribute('href') || '/'
    },
    provideAnimationsAsync(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    providePrimeNG({ theme: Noir, ripple: false, inputStyle: 'outlined' }),
    importProvidersFrom(BrowserModule, BrowserAnimationsModule, FormsModule),
    provideAuth(
      {
        config: [
          {
            configId: 'cpat',
            authority: CPAT.Env.oauth.authority,
            redirectUrl: window.location.origin + (CPAT.Env.basePath || ''),
            postLogoutRedirectUri: window.location.origin + (CPAT.Env.basePath || ''),
            clientId: CPAT.Env.oauth.clientId,
            scope: getScopeStr('cpat'),
            responseType: 'code',
            useRefreshToken: true,
            silentRenew: true,
            silentRenewUrl: `${window.location.origin}${CPAT.Env.basePath || ''}/silent-renew.html`,
            autoUserInfo: false,
            renewUserInfoAfterTokenRenew: false,
            triggerAuthorizationResultEvent: true,
            startCheckSession: true,
            postLoginRoute: '/',
            unauthorizedRoute: '/401',
            forbiddenRoute: '/403',
            renewTimeBeforeTokenExpiresInSeconds: 15,
            ignoreNonceAfterRefresh: true,
            triggerRefreshWhenIdTokenExpired: false,
            maxIdTokenIatOffsetAllowedInSeconds: 300,
            disableRefreshIdTokenAuthTimeValidation: true
          },
          {
            configId: 'stigman',
            authority: CPAT.Env.oauth.authority,
            redirectUrl: window.location.origin + (CPAT.Env.basePath || ''),
            postLogoutRedirectUri: window.location.origin + (CPAT.Env.basePath || ''),
            clientId: CPAT.Env.stigman.clientId,
            scope: getScopeStr('stigman'),
            responseType: 'code',
            useRefreshToken: true,
            silentRenew: true,
            silentRenewUrl: `${window.location.origin}${CPAT.Env.basePath || ''}/silent-renew.html`,
            autoUserInfo: false,
            renewUserInfoAfterTokenRenew: false,
            triggerAuthorizationResultEvent: true,
            startCheckSession: true,
            unauthorizedRoute: '/401',
            forbiddenRoute: '/403',
            renewTimeBeforeTokenExpiresInSeconds: 15,
            ignoreNonceAfterRefresh: true,
            triggerRefreshWhenIdTokenExpired: false,
            maxIdTokenIatOffsetAllowedInSeconds: 300,
            disableRefreshIdTokenAuthTimeValidation: true
          }
        ]
      },
      withAppInitializerAuthCheck()
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, authErrorInterceptor])),
    MessageService,
    ConfirmationService,
    DialogService
  ]
}).catch((err) => console.error(err));
