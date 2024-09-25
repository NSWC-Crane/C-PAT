/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import {
  MarketplaceComponent,
  ImageDialogComponent,
} from './marketplace.component';
import { MarketplaceRoutingModule } from './marketplace.routing';
import { DividerModule } from 'primeng/divider';

@NgModule({
  declarations: [MarketplaceComponent, ImageDialogComponent],
  imports: [
    CommonModule,
    DividerModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChipModule,
    ConfirmDialogModule,
    ToastModule,
    DynamicDialogModule,
    MarketplaceRoutingModule,
  ],
})
export class MarketplaceModule {}
