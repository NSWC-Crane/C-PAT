/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { consentRoute } from './common/components/dod-consent/dod-consent.routing';


import { AuthGuard } from './core/auth/guards/auth.guard';

import { adminProcessingRoutes } from './pages/admin-processing/admin-processing-routing.module';
import { assetProcessingRoutes } from './pages/asset-processing/asset-processing.routing';
import { importProcessingRoutes } from './pages/import-processing/import-processing-routing.module';
import { labelProcessingRoutes } from './pages/label-processing/label-processing.routing';
import { marketplaceRoutes } from './pages/marketplace/marketplace.routing';
import { poamProcessingRoutes } from './pages/poam-processing/poam-processing-routing.module';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled'
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/components/app.navigation.component').then(m => m.AppNavigationComponent),
    children: [
      {
        path: '',
        redirectTo: CPAT.Env.dodDeployment ? 'consent' : 'poam-processing',
        pathMatch: 'full'
      },
      {
        path: 'admin-processing',
        canActivate: [AuthGuard],
        data: { guardType: 'admin' },
        children: adminProcessingRoutes
      },
      {
        path: 'app-info',
        canActivate: [AuthGuard],
        data: { guardType: 'admin' },
        children: adminProcessingRoutes
      },
      {
        path: 'asset-processing',
        canActivate: [AuthGuard],
        children: assetProcessingRoutes
      },
      {
        path: 'consent',
        canActivate: [AuthGuard],
        children: consentRoute
      },
      {
        path: 'import-processing',
        canActivate: [AuthGuard],
        children: importProcessingRoutes
      },
      {
        path: 'label-processing',
        canActivate: [AuthGuard],
        children: labelProcessingRoutes
      },
      {
        path: 'notifications',
        canActivate: [AuthGuard],
        loadComponent: () => import('./common/components/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'poam-processing',
        canActivate: [AuthGuard],
        children: poamProcessingRoutes
      },
      {
        path: 'marketplace',
        canActivate: [AuthGuard],
        children: marketplaceRoutes
      }
    ]
  },
  {
    path: '401',
    loadComponent: () => import('./common/components/status-message/status-message.component').then(m => m.StatusMessageComponent),
    data: { statusCode: 401 }
  },
  {
    path: '403',
    loadComponent: () => import('./common/components/status-message/status-message.component').then(m => m.StatusMessageComponent),
    data: { statusCode: 403 }
  },
  {
    path: '404',
    loadComponent: () => import('./common/components/status-message/status-message.component').then(m => m.StatusMessageComponent),
    data: { statusCode: 404 }
  },
  {
    path: '418',
    loadComponent: () => import('./common/components/status-message/status-message.component').then(m => m.StatusMessageComponent),
    data: { statusCode: 418 }
  },
  {
    path: 'not-activated',
    loadComponent: () => import('./common/components/status-message/status-message.component').then(m => m.StatusMessageComponent),
    data: { statusCode: 999 }
  },
  { path: '**', redirectTo: CPAT.Env.dodDeployment ? 'consent' : 'poam-processing' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
