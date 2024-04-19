import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbTabsetModule, NbFormFieldModule, NbIconModule, NbSelectModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PoamCountChartComponent } from './poam-count-chart.component';

@NgModule({
  declarations: [PoamCountChartComponent],
  imports: [
    CommonModule,
    NbTabsetModule,
    NbTabsetModule,
    NbFormFieldModule,
    NbIconModule,
    NbSelectModule,
    NbButtonModule,
    NbCardModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
  ],
  exports: [PoamCountChartComponent],
})
export class PoamAdvancedPieModule { }
