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
import {  FormsModule  } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PoamDetailsComponent } from './pages/poam-processing/poam-details/poam-details.component';
import { DoDConsentComponent } from './pages/dod-consent/dod-consent.component';
import { CoreModule } from '../app/@core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbActionsModule, NbCardModule, NbDialogModule, NbMenuModule, NbSidebarModule, NbLayoutModule, NbAlertModule, NbSelectModule, NbIconModule, NbSpinnerModule, NbThemeModule, NbStepperModule, NbCheckboxModule, NbButtonModule, NbInputModule, NbAccordionModule} from '@nebular/theme';
import { LoginComponent } from './pages/login/login.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { NbPasswordAuthStrategy, NbAuthModule, NbAuthResult, NbAuthJWTToken, NbOAuth2AuthStrategy, NbOAuth2ResponseType, NbOAuth2GrantType, NbAuthOAuth2Token,  } from '@nebular/auth';
import { AuthGuard } from "./auth.guard";
import { NbSecurityModule } from '@nebular/security';
import { SharedModule } from './Shared/shared.module';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { TreeviewModule } from 'ngx-treeview';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { environment } from 'src/environments/environment';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { KcAuthService } from './kc-auth.service';
import { RoleProvider } from './auth';
import { PoamApproveModule } from "./pages/poam-processing/poam-approve/poam-approve.module";
import { FileUploadService } from './file-upload.service';

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
        LoginComponent,
        PoamDetailsComponent,
        //DoDConsentComponent
    ],
    providers: [AuthGuard,
        KeycloakService,
        { provide: APP_BASE_HREF, useValue: "/" },
        //{ provide: APP_INITIALIZER, useFactory: initializeKeycloak, multi: true, deps: [KeycloakService]},
        KeycloakService,
        { provide: APP_INITIALIZER, useFactory: initializeKeycloak, multi: true, deps: [KeycloakService] },
        KcAuthService,
      RoleProvider,
      FileUploadService,
    ],
    bootstrap: [AppComponent],
    exports: [
    // PoamDetailsComponent,
    ],
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
        NbButtonModule,
        NbCardModule,
        NbCheckboxModule,
        NbDialogModule.forChild(),
        NbEvaIconsModule,
        NbInputModule,
        NbIconModule,
        NbLayoutModule,
        NbSelectModule,
        NbSpinnerModule,
        NbSecurityModule.forRoot(),
        NbSidebarModule.forRoot(),
        NbStepperModule,
        NbMenuModule.forRoot(),
        NgbModule,
        TreeviewModule.forRoot(),
        NbThemeModule.forRoot({ name: 'default' }),
        Ng2SmartTableModule,
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
        PoamApproveModule
    ]
})
export class AppModule { }
