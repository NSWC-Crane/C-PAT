import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PoamApproveComponent } from './poam-approve.component';

const routes: Routes = [{
  path: '',
  component: PoamApproveComponent},
  {
  path: 'poam-approve/:poamId',
  component: PoamApproveComponent},
  {
    path: 'approve',
    component: PoamApproveComponent},
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoamApproveRoutingModule { }
