import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LabelProcessingComponent } from './label-processing.component';

const routes: Routes = [{
  path: '',
  component: LabelProcessingComponent,
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LabelProcessingRoutingModule { }
