/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AuthModule } from 'angular-auth-oidc-client';
import { APP_BASE_HREF } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import { NbAccordionModule, NbActionsModule, NbAlertModule, NbAutocompleteModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbContextMenuModule, NbDatepickerModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbStepperModule, NbThemeModule, NbToggleModule, NbTooltipModule, NbUserModule } from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeGridModule } from '@syncfusion/ej2-angular-treegrid';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CoreModule } from '../app/@core/core.module';
import { FileUploadService } from '../app/pages/import-processing/emass-import/file-upload.service';
import { SharedModule } from './Shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgParticlesModule } from 'ng-particles';
import { UnauthorizedComponent } from './Shared/components/unauthorized/unauthorized.component';

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
    UnauthorizedComponent,
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: "/" },
    FileUploadService,
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
  exports: [],
  imports: [
    AuthModule.forRoot({
      config: [
        {
          configId: 'cpat',
          postLoginRoute: '/consent',
          authority: CPAT.Env.oauth.authority,
          redirectUrl: window.location.origin + '/consent',
          postLogoutRedirectUri: window.location.origin + '/consent',
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
          redirectUrl: window.location.origin + '/consent',
          postLogoutRedirectUri: window.location.origin + '/consent',
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
    TreeGridModule,
    AppRoutingModule,
    SharedModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NbAccordionModule,
    NbActionsModule,
    NbAlertModule,
    NbAutocompleteModule,
    NbButtonModule,
    NbCardModule,
    NbContextMenuModule,
    NbToggleModule,
    NbCheckboxModule,
    NbEvaIconsModule,
    NbFormFieldModule,
    NbInputModule,
    NbIconModule,
    NbLayoutModule,
    NbListModule,
    NbPopoverModule,
    NbSelectModule,
    NbSpinnerModule,
    NbStepperModule,
    NbTooltipModule,
    NbUserModule,
    NgbModule,
    Angular2SmartTableModule,
    CoreModule,
    NbDialogModule.forChild(),
    NbDatepickerModule.forRoot(),
    NbThemeModule.forRoot({ name: 'dark' }),
    NbMenuModule.forRoot(),
    NbSecurityModule.forRoot(),
    NbSidebarModule.forRoot(),
    NgParticlesModule,
  ]
})
export class AppModule { }
