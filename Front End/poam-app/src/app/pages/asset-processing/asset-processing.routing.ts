import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AssetProcessingComponent } from './asset-processing.component';

const routes: Routes = [{
  path: '',
  component: AssetProcessingComponent,
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssetProcessingRoutingModule { }
