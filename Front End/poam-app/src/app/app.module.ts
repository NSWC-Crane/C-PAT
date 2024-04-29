/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { APP_BASE_HREF } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbAuthModule, NbAuthOAuth2Token, NbOAuth2AuthStrategy, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import { NbAccordionModule, NbActionsModule, NbAlertModule, NbAutocompleteModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbDatepickerModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbStepperModule, NbThemeModule, NbToggleModule, NbTooltipModule, NbUserModule } from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeGridModule } from '@syncfusion/ej2-angular-treegrid';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { environment } from 'src/environments/environment';
import { CoreModule } from '../app/@core/core.module';
import { FileUploadService } from '../app/pages/import-processing/emass-import/file-upload.service';
import { SharedModule } from './Shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { STIGManagerImportModule } from './pages/import-processing/stigmanager-import/stigmanager-import.module';
import { TenableImportModule } from './pages/import-processing/tenable-import/tenable-import.module';
import { PoamApproveModule } from "./pages/poam-processing/poam-approve/poam-approve.module";
import { PoamDetailsComponent } from './pages/poam-processing/poam-details/poam-details.component';
import { PoamExtendModule } from "./pages/poam-processing/poam-extend/poam-extend.module";
import { PoamLogModule } from "./pages/poam-processing/poam-log/poam-log.module";
import { PoamManageModule } from "./pages/poam-processing/poam-manage/poam-manage.module";

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: environment.OIDC_PROVIDER_URL,
        realm: 'RMFTools',
        clientId: 'c-pat'
      },
      initOptions: {
        redirectUri: `${environment.CPAT_FRONTEND_URL}/consent`,
        checkLoginIframe: false
      }
    })
}


@NgModule({
  declarations: [
    AppComponent,
    PoamDetailsComponent,
  ],
  providers: [
    KeycloakService,
    { provide: APP_BASE_HREF, useValue: "/" },
    KeycloakService,
    { provide: APP_INITIALIZER, useFactory: initializeKeycloak, multi: true, deps: [KeycloakService] },
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
    KeycloakAngularModule,
    CoreModule,
    PoamApproveModule,
    PoamManageModule,
    PoamExtendModule,
    PoamLogModule,
    STIGManagerImportModule,
    TenableImportModule,
    NbDialogModule.forChild(),
    NbDatepickerModule.forRoot(),
    NbThemeModule.forRoot({ name: 'dark' }),
    NbMenuModule.forRoot(),
    NbSecurityModule.forRoot(),
    NbSidebarModule.forRoot(),
    NbAuthModule.forRoot({
      strategies: [
        NbOAuth2AuthStrategy.setup({
          name: environment.OIDC_PROVIDER_NAME,
          clientId: 'c-pat',
          authorize: {
            endpoint: `${environment.OIDC_PROVIDER_URL}/realms/RMFTools/protocol/openid-connect/auth`,
            responseType: NbOAuth2ResponseType.CODE,
            redirectUri: `${environment.CPAT_FRONTEND_URL}/callback`,
            params: {
              p: '',
            },
          },
          token: {
            endpoint: `${environment.OIDC_PROVIDER_URL}/realms/RMFTools/protocol/openid-connect/token`,
            grantType: NbOAuth2GrantType.AUTHORIZATION_CODE,
            redirectUri: `${environment.CPAT_FRONTEND_URL}/callback`,
            class: NbAuthOAuth2Token,
          },
        }),
      ],
      forms: {},
    }),
  ]
})
export class AppModule { }
