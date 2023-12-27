import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoamsComponent } from './poams.component';
import { PoamsRoutingModule } from './poams.routing';
import { NbCardModule, NbThemeModule, NbSelectModule, NbRadioModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';

@NgModule({
    declarations: [
        PoamsComponent,
    ],
    exports: [
        PoamsComponent,
    ],
    imports: [
        CommonModule,
        ChartsModule,
        FormsModule,
        PoamsRoutingModule,
        NbCardModule,
        NbThemeModule,
        Ng2SmartTableModule,
        NbRadioModule,
        NbSelectModule,
        TreeviewModule,
    ]
})
export class PoamsModule { }
