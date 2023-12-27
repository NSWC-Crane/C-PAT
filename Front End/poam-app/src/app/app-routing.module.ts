import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { HomeComponent } from './pages/home/home.component';
//import { PagesComponent } from './pages/pages.component';
import { PoamDetailsComponent } from './pages/poam-processing/poam-details/poam-details.component';
import { PoamApproveComponent } from './pages/poam-processing/poam-approve/poam-approve.component';
import { NbAuthComponent, NbLoginComponent, NbRegisterComponent, NbLogoutComponent, NbRequestPasswordComponent, NbResetPasswordComponent } from '@nebular/auth';
import { AuthGuard } from './auth.guard'
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { LoginCallbackComponent } from './pages/login/loginCallback.component';
import { DoDConsentComponent } from './pages/dod-consent/dod-consent.component';


const routes: Routes = [
  //{ path: 'home', canActivate: [AuthGuard], component: PagesComponent},
  {
    path: '', canActivate: [AuthGuard],
    component: AppComponent, //LoginComponent, //AppComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'callback',
    component: LoginCallbackComponent, //AppComponent,
  },  
  //{ path: 'home', canActivate: [AuthGuard], loadChildren: () => import('./pages/poam-processing/poams.module').then(m => m.PoamsModule) },
  //{path: '', redirectTo: 'poam-processing', pathMatch: 'full'},
  //{ path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)},
  //{ path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)},
  // { path: 'pages', canActivate: [AuthGuard], loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule)},

  { path: 'consent',  loadChildren: () => import('./pages/dod-consent/dod-consent.module').then(m => m.DoDConsentModule) },
  { path: 'approve',  loadChildren: () => import('./pages/poam-processing/poam-approve/poam-approve.module').then(m => m.PoamApproveModule) },
  { path: 'asset-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/asset-processing/asset-processing.module').then(m => m.AssetProcessingModule) },
  { path: 'collection-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/collection-processing/collection-processing.module').then(m => m.CollectionProcessingModule) },
  { path: 'label-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/label-processing/label-processing.module').then(m => m.LabelProcessingModule) },
  { path: 'poam-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/poam-processing/poams.module').then(m => m.PoamsModule) },
  { path: 'poam-details/:poamId', canActivate: [AuthGuard], component: PoamDetailsComponent},
  { path: 'poam-approve/:poamId', canActivate: [AuthGuard], component: PoamApproveComponent},
  { path: 'user-processing', canActivate: [AuthGuard], loadChildren: () => import('./pages/user-processing/user-processing.module').then(m => m.UserProcessingModule) },


  {path: '**', redirectTo: 'poam-processing'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
