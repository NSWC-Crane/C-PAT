/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbAuthJWTInterceptor, NbAuthModule, NbDummyAuthStrategy, NB_AUTH_TOKEN_INTERCEPTOR_FILTER } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { WebsocketService } from './websocket.service';
import { ACCESS_CONTROL_LIST } from '../access-control-list';
import { AUTH_OPTIONS } from '../auth/auth-options';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TOKEN_INTERCEPTOR_FILTER } from '../auth/token-interceptor-filter';
import { RoleProvider } from '../auth';

const socialLinks = [
  {
    url: 'https://github.com/akveo/nebular',
    target: '_blank',
    icon: 'socicon-github',
  },
  {
    url: 'https://www.facebook.com/akveo/',
    target: '_blank',
    icon: 'socicon-facebook',
  },
  {
    url: 'https://twitter.com/akveo_inc',
    target: '_blank',
    icon: 'socicon-twitter',
  },
];

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return observableOf('guest');
  }
}

export const NB_CORE_PROVIDERS = [
  NbAuthModule.forRoot(AUTH_OPTIONS).providers,

  NbSecurityModule.forRoot(ACCESS_CONTROL_LIST).providers,
  {
    provide: HTTP_INTERCEPTORS, useClass: NbAuthJWTInterceptor, multi: true
  },
  {
    provide: NB_AUTH_TOKEN_INTERCEPTOR_FILTER, useValue: TOKEN_INTERCEPTOR_FILTER
  },
  {
    provide: NbRoleProvider, useClass: RoleProvider,
  },
  WebsocketService,
];

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    NbAuthModule,
  ],
  declarations: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot() {
    return {
      ngModule: CoreModule,
      providers: [
        ...NB_CORE_PROVIDERS,
      ],
    };
  }
}
