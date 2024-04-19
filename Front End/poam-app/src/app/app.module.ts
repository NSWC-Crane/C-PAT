/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { TreeGridModule } from '@syncfusion/ej2-angular-treegrid';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { APP_BASE_HREF } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PoamDetailsComponent } from './pages/poam-processing/poam-details/poam-details.component';
import { CoreModule } from '../app/@core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbActionsModule, NbAutocompleteModule, NbCardModule, NbDialogModule, NbMenuModule, NbSidebarModule, NbLayoutModule, NbAlertModule, NbSelectModule, NbIconModule, NbSpinnerModule, NbThemeModule, NbStepperModule, NbCheckboxModule, NbButtonModule, NbInputModule, NbAccordionModule, NbDatepickerModule, NbTooltipModule, NbFormFieldModule, NbToggleModule, NbUserModule, NbPopoverModule } from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { NbAuthModule, NbOAuth2AuthStrategy, NbOAuth2ResponseType, NbOAuth2GrantType, NbAuthOAuth2Token, } from '@nebular/auth';
import { AuthGuard } from "./auth.guard";
import { NbSecurityModule } from '@nebular/security';
import { SharedModule } from './Shared/shared.module';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { environment } from 'src/environments/environment';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { KcAuthService } from './kc-auth.service';
import { RoleProvider } from './auth';
import { PoamManageModule } from "./pages/poam-processing/poam-manage/poam-manage.module";
import { PoamExtendModule } from "./pages/poam-processing/poam-extend/poam-extend.module";
import { PoamLogModule } from "./pages/poam-processing/poam-log/poam-log.module";
import { FileUploadService } from '../app/pages/import-processing/emass-import/file-upload.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { STIGManagerImportModule } from './pages/import-processing/stigmanager-import/stigmanager-import.module';
import { TenableImportModule } from './pages/import-processing/tenable-import/tenable-import.module';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: environment.keycloakUrl,
        realm: 'RMFTools',
        clientId: 'c-pat'
      },
      initOptions: {
        redirectUri: environment.CPATRedirectUri,
        checkLoginIframe: false
      }
    })
}


@NgModule({
  declarations: [
    AppComponent,
    PoamDetailsComponent,
  ],
  providers: [AuthGuard,
    KeycloakService,
    { provide: APP_BASE_HREF, useValue: "/" },
    KeycloakService,
    { provide: APP_INITIALIZER, useFactory: initializeKeycloak, multi: true, deps: [KeycloakService] },
    AuthGuard,
    KcAuthService,
    RoleProvider,
    FileUploadService,
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
  exports: [],
  imports: [
    TreeGridModule,
    AppRoutingModule,
    SharedModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NbAccordionModule,
    NbActionsModule,
    NbAuthModule,
    NbAlertModule,
    NbAutocompleteModule,
    NbButtonModule,
    NbCardModule,
    NbToggleModule,
    NbCheckboxModule,
    NbDatepickerModule.forRoot(),
    NbDialogModule.forChild(),
    NbEvaIconsModule,
    NbFormFieldModule,
    NbInputModule,
    NbIconModule,
    NbLayoutModule,
    NbPopoverModule,
    NbSelectModule,
    NbSpinnerModule,
    NbSecurityModule.forRoot(),
    NbSidebarModule.forRoot(),
    NbStepperModule,
    NbTooltipModule,
    NbMenuModule.forRoot(),
    NbUserModule,
    NgbModule,
    NbThemeModule.forRoot({ name: 'default' }),
    SharedModule,
    Angular2SmartTableModule,
    KeycloakAngularModule,
    NbAuthModule.forRoot({
      strategies: [
        NbOAuth2AuthStrategy.setup({
          name: 'redHat',
          clientId: 'c-pat',
          authorize: {
            endpoint: environment.authizeEndpoint,
            responseType: NbOAuth2ResponseType.CODE,
            redirectUri: environment.redirectUri,
            params: {
              p: '',
            },
          },
          token: {
            endpoint: environment.tokeEndpoint,
            grantType: NbOAuth2GrantType.AUTHORIZATION_CODE,
            redirectUri: environment.redirectUri,
            class: NbAuthOAuth2Token,
          },
        }),
      ],
      forms: {},
    }),
    CoreModule,
    PoamManageModule,
    PoamExtendModule,
    PoamLogModule,
    STIGManagerImportModule,
    TenableImportModule,
  ]
})
export class AppModule { }
