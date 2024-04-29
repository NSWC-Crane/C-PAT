import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbSelectModule, NbTabsetModule } from '@nebular/theme';
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
