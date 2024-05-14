/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
import { APP_BASE_HREF } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import { NbAccordionModule, NbActionsModule, NbAlertModule, NbAutocompleteModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbDatepickerModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbStepperModule, NbThemeModule, NbToggleModule, NbTooltipModule, NbUserModule } from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeGridModule } from '@syncfusion/ej2-angular-treegrid';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CoreModule } from '../app/@core/core.module';
import { FileUploadService } from '../app/pages/import-processing/emass-import/file-upload.service';
import { SharedModule } from './Shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { NgParticlesModule } from 'ng-particles';
import { UnauthorizedComponent } from './Shared/components/unauthorized/unauthorized.component';

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
          authority: environment.oauth.authority,
          redirectUrl: window.location.origin + '/consent',
          postLogoutRedirectUri: window.location.origin,
          clientId: environment.oauth.clientId,
          scope: `${environment.oauth.scopePrefix}c-pat:read ${environment.oauth.scopePrefix}c-pat:op openid profile email`,
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
          authority: environment.oauth.authority,
          redirectUrl: window.location.origin + '/consent',
          postLogoutRedirectUri: window.location.origin,
          clientId: environment.oauth.stigmanClientId,
          scope: `${environment.oauth.scopePrefix}stig-manager:stig ${environment.oauth.scopePrefix}stig-manager:stig:read ${environment.oauth.scopePrefix}stig-manager:collection ${environment.oauth.scopePrefix}stig-manager:user ${environment.oauth.scopePrefix}stig-manager:user:read ${environment.oauth.scopePrefix}stig-manager:op openid`,
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
