import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { NotFoundComponent } from '../Shared/components/not-found/not-found.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NbCardModule, NbWindowModule, NbDialogModule, NbIconModule, NbLayoutModule,NbSidebarModule, NbThemeModule, 
  NbSelectModule, NbSpinnerModule, NbAlertModule, NbTreeGridModule, NbRadioModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    NotFoundComponent,
    ConfirmationDialogComponent,
  ],
  imports: [
    CommonModule,
    NbAlertModule,
    NbCardModule,
    NbDialogModule,
    NbEvaIconsModule,
    NbIconModule,
    NbLayoutModule,
    NbRadioModule,  
    NbSelectModule,
    NbSidebarModule,
    NbSpinnerModule,
    NbTreeGridModule,
    NbThemeModule,
    NbWindowModule.forChild(),
    Ng2SmartTableModule, 
  ],
  exports: [
    NotFoundComponent,
    ConfirmationDialogComponent,

  ],
  providers: [
    // pipes for dynamic.pipe must be listed here
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe,
    AsyncPipe,
  ],
})
export class SharedModule { }
