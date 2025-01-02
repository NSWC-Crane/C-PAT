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
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing.module';
import { providePrimeNG } from 'primeng/config';
import { provideHttpClient } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AuthModule } from 'angular-auth-oidc-client';
import { APP_BASE_HREF } from '@angular/common';
import Noir from './app/app-theme';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

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
      'openid',
      'offline_access'
    ];
  } else if (configId === 'stigman') {
    scopes = [
      `${stigmanScopePrefix}stig-manager:stig`,
      `${stigmanScopePrefix}stig-manager:stig:read`,
      `${stigmanScopePrefix}stig-manager:collection`,
      `${stigmanScopePrefix}stig-manager:user`,
      `${stigmanScopePrefix}stig-manager:user:read`,
      `${stigmanScopePrefix}stig-manager:op`,
      'openid',
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
    provideHttpClient(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    providePrimeNG({ theme: Noir, ripple: false, inputStyle: 'outlined' }),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      AuthModule.forRoot({
        config: [
          {
            configId: 'cpat',
            postLoginRoute: '/poam-processing',
            unauthorizedRoute: '/403',
            forbiddenRoute: '/401',
            authority: CPAT.Env.oauth.authority,
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: CPAT.Env.oauth.clientId,
            scope: getScopeStr('cpat'),
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: `${window.location.origin}/silent-renew.html`,
            renewTimeBeforeTokenExpiresInSeconds: 60,
            allowUnsafeReuseRefreshToken: true,
            useRefreshToken: true,
            refreshTokenRetryInSeconds: 6,
            tokenRefreshInSeconds: 6,
            autoUserInfo: true,
            ignoreNonceAfterRefresh: true,
            triggerRefreshWhenIdTokenExpired: false,
          },
          {
            configId: 'stigman',
            unauthorizedRoute: '/403',
            forbiddenRoute: '/401',
            authority: CPAT.Env.oauth.authority,
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: CPAT.Env.stigman.clientId,
            scope: getScopeStr('stigman'),
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: `${window.location.origin}/silent-renew.html`,
            renewTimeBeforeTokenExpiresInSeconds: 60,
            allowUnsafeReuseRefreshToken: true,
            useRefreshToken: true,
            refreshTokenRetryInSeconds: 6,
            tokenRefreshInSeconds: 6,
            ignoreNonceAfterRefresh: true,
            triggerRefreshWhenIdTokenExpired: false,
          },
        ],
      })
    )
  ]
}).catch(err => console.error(err));
