import { NgModule } from '@angular/core';
import {  FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CollectionProcessingComponent } from './collection-processing.component';
import { CollectionProcessingRoutingModule } from './collection-processing.routing';
import { SharedModule } from '../../Shared/shared.module';
import { CollectionComponent } from './collection/collection.component';
import { ConfirmationDialogComponent } from 'src/app/Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbCardModule, NbTreeGridModule, NbSpinnerModule, NbSelectModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { CsvDataService } from 'src/app/Shared/utils/cvs-data.service';

@NgModule({
  declarations: [
    CollectionProcessingComponent,
    CollectionComponent,
  ],
  imports: [
    CommonModule,
    CollectionProcessingRoutingModule,
    FormsModule,
    NbCardModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTreeGridModule,
    Ng2SmartTableModule,
    SharedModule, 
  ],
  entryComponents: [
    ConfirmationDialogComponent,
    CsvDataService

  ]
})
export class CollectionProcessingModule { }
