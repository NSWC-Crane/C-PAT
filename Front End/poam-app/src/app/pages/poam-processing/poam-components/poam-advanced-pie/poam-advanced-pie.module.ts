import { NgModule } from '@angular/core';
import { NbCardModule } from '@nebular/theme';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { PoamAdvancedPieComponent } from './poam-advanced-pie.component';

@NgModule({
  imports: [
    NbCardModule,
    NgxChartsModule,
  ],
  declarations: [PoamAdvancedPieComponent],
  exports: [PoamAdvancedPieComponent],
})
export class PoamAdvancedPieModule { }
