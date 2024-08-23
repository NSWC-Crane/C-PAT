/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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
import { NgxParticlesModule } from "@tsparticles/angular";
import { NotFoundComponent } from './common/components/not-found/not-found.component';
import { UnauthorizedComponent } from './common/components/unauthorized/unauthorized.component';
import { NotActivatedComponent } from './common/components/notActivated/notActivated.component';
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
      `${cpatScopePrefix}c-pat:op`,
      'openid',
      'profile',
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
      'offline_access'
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
  declarations: [
    AppComponent,
    NotFoundComponent,
    UnauthorizedComponent,
    NotActivatedComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    AppConfigModule,
    NgxParticlesModule,
    AuthModule.forRoot({
      config: [
        {
          configId: 'cpat',
          postLoginRoute: '/verify',
          authority: CPAT.Env.oauth.authority,
          redirectUrl: window.location.origin + '/verify',
          postLogoutRedirectUri: window.location.origin + '/verify',
          clientId: CPAT.Env.oauth.clientId,
          scope: getScopeStr('cpat'),
          responseType: 'code',
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          renewTimeBeforeTokenExpiresInSeconds: 60,
          useRefreshToken: true,
          autoUserInfo: true,
          ignoreNonceAfterRefresh: true,
          triggerRefreshWhenIdTokenExpired: false,
        },
        {
          configId: 'stigman',
          authority: CPAT.Env.oauth.authority,
          redirectUrl: window.location.origin + '/verify',
          postLogoutRedirectUri: window.location.origin + '/verify',
          clientId: CPAT.Env.stigman.clientId,
          scope: getScopeStr('stigman'),
          responseType: 'code',
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          renewTimeBeforeTokenExpiresInSeconds: 60,
          useRefreshToken: true,
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
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: "/" },
    provideCharts(withDefaultRegisterables()),
    PrimeNGConfig,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
