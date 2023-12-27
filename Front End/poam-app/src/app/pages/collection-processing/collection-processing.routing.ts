import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CollectionProcessingComponent } from './collection-processing.component';

const routes: Routes = [{
  path: '',
  component: CollectionProcessingComponent,
}]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionProcessingRoutingModule { }
