import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NbCardModule } from '@nebular/theme';
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
