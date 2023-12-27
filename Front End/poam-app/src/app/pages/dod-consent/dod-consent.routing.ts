import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DoDConsentComponent } from './dod-consent.component';

const routes: Routes = [{
  path: '',
  component: DoDConsentComponent,
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DodConsentRoutingModule { }
