/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { AppConfigModule } from './layout/app.config.module';
import { AuthModule } from 'angular-auth-oidc-client';
import { APP_BASE_HREF } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardModule } from 'primeng/card';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { SharedModule } from './common/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StatusMessageComponent } from './common/components/status-message/status-message.component';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { DropdownModule } from 'primeng/dropdown';
import { MessagesModule } from 'primeng/messages';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PrimeNGConfig } from 'primeng/api';
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
      //'offline_access'
    ];
  }

  if (CPAT.Env.oauth.extraScopes && configId === 'cpat') {
    scopes.push(...CPAT.Env.oauth.extraScopes.split(' '));
  } else if (CPAT.Env.stigman.extraScopes && configId === 'stigman') {
    scopes.push(...CPAT.Env.stigman.extraScopes.split(' '));
  }
  return scopes.join(' ');
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        SharedModule,
        AppConfigModule,
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
        }),
        AvatarModule,
        ButtonModule,
        RippleModule,
        CardModule,
        MenuModule,
        PanelMenuModule,
        DropdownModule,
        MessagesModule,
        OverlayPanelModule,
        SelectButtonModule,
        AppComponent,
        StatusMessageComponent,
    ],
  providers: [
    { provide: APP_BASE_HREF, useValue: "/" },
    provideCharts(withDefaultRegisterables()),
    PrimeNGConfig,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
