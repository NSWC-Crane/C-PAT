/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

(globalThis as any).CPAT = {
  Env: {
    apiBase: '/api',
    stigman: {
      apiUrl: '/stigman/api'
    },
    basePath: '',
    classification: 'U',
    inactivityTimeout: 900000,
    adminInactivityTimeout: 600000,
    dodDeployment: false,
    features: {
      tenableEnabled: true,
      aiEnabled: false,
      marketplaceDisabled: false,
      docsDisabled: false,
      swaggerUiEnabled: true
    }
  }
};
