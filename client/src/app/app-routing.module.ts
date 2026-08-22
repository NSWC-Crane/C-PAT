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
import { adminRoutes } from './pages/admin/admin-routing.module';
import { assetRoutes } from './pages/assets/assets.routing';
import { integrationRoutes } from './pages/integrations/integration-routing.module';
import { labelRoutes } from './pages/labels/labels.routing';
import { metricsRoutes } from './pages/metrics/metrics.routing';
import { marketplaceRoutes } from './pages/marketplace/marketplace.routing';
import { homeRoutes } from './pages/home/home.routing';
import { poamRoutes } from './pages/poams/poams-routing.module';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled'
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/components/app.navigation.component').then((m) => m.AppNavigationComponent),
    children: [
      {
        path: '',
        redirectTo: CPAT.Env.dodDeployment ? 'consent' : 'home',
        pathMatch: 'full'
      },
      {
        path: 'admin',
        canActivate: [AuthGuard],
        data: { guardType: 'admin' },
        children: adminRoutes
      },
      {
        path: 'app-info',
        canActivate: [AuthGuard],
        data: { guardType: 'admin' },
        children: adminRoutes
      },
      {
        path: 'assets',
        canActivate: [AuthGuard],
        children: assetRoutes
      },
      {
        path: 'consent',
        canActivate: [AuthGuard],
        children: consentRoute
      },
      {
        path: 'integrations',
        canActivate: [AuthGuard],
        children: integrationRoutes
      },
      {
        path: 'labels',
        canActivate: [AuthGuard],
        children: labelRoutes
      },
      {
        path: 'metrics',
        canActivate: [AuthGuard],
        children: metricsRoutes
      },
      {
        path: 'notifications',
        canActivate: [AuthGuard],
        loadComponent: () => import('./common/components/notifications/notifications.component').then((m) => m.NotificationsComponent)
      },
      {
        path: 'poams',
        canActivate: [AuthGuard],
        children: poamRoutes
      },
      {
        path: 'marketplace',
        canActivate: [AuthGuard],
        children: marketplaceRoutes
      },
      {
        path: 'home',
        canActivate: [AuthGuard],
        children: homeRoutes
      }
    ]
  },
  {
    path: '401',
    loadComponent: () => import('./common/components/status-message/status-message.component').then((m) => m.StatusMessageComponent),
    data: { statusCode: 401 }
  },
  {
    path: '403',
    loadComponent: () => import('./common/components/status-message/status-message.component').then((m) => m.StatusMessageComponent),
    data: { statusCode: 403 }
  },
  {
    path: '404',
    loadComponent: () => import('./common/components/status-message/status-message.component').then((m) => m.StatusMessageComponent),
    data: { statusCode: 404 }
  },
  {
    path: '418',
    loadComponent: () => import('./common/components/status-message/status-message.component').then((m) => m.StatusMessageComponent),
    data: { statusCode: 418 }
  },
  {
    path: 'not-activated',
    loadComponent: () => import('./common/components/status-message/status-message.component').then((m) => m.StatusMessageComponent),
    data: { statusCode: 999 }
  },
  { path: '**', redirectTo: CPAT.Env.dodDeployment ? 'consent' : 'home' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
