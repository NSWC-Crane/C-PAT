import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PoamsComponent } from './poams.component';

const routes: Routes = [{
  path: '',
  component: PoamsComponent,
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoamsRoutingModule { }
