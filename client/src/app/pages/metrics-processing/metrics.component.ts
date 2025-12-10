/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, map, switchMap, tap } from 'rxjs';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { STIGManagerMetricsComponent } from './stigman-metrics/stigman-metrics.component';
import { TenableMetricsComponent } from './tenable-metrics/tenable-metrics.component';

@Component({
  selector: 'cpat-metrics',
  templateUrl: './metrics.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, ToastModule, TooltipModule, STIGManagerMetricsComponent, TenableMetricsComponent],
  providers: [MessageService]
})
export class MetricsComponent implements OnInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);

  private subscriptions = new Subscription();

  selectedCollection = signal<any>(null);
  selectedCollectionId = signal<any>(null);
  collectionOrigin = signal<string>('C-PAT');
  isLoading = signal<boolean>(false);

  stigManagerMetrics?: STIGManagerMetricsComponent;
  tenableMetrics?: TenableMetricsComponent;

  ngOnInit() {
    this.initializeComponent();
  }

  private initializeComponent() {
    this.subscriptions.add(
      this.sharedService.selectedCollection
        .pipe(
          tap((collectionId) => this.selectedCollectionId.set(collectionId)),
          switchMap((collectionId) => this.collectionsService.getCollectionBasicList().pipe(map((collections) => collections.find((c: any) => c.collectionId === collectionId)))),
          tap((collection) => {
            this.selectedCollection.set(collection);

            if (collection?.collectionOrigin) {
              this.collectionOrigin.set(collection.collectionOrigin);
            }
          })
        )
        .subscribe()
    );
  }

  refreshMetrics() {
    const origin = this.collectionOrigin();

    if (origin === 'STIG Manager' && this.stigManagerMetrics) {
      this.stigManagerMetrics.refreshMetrics();
    } else if (this.tenableMetrics) {
      this.tenableMetrics.refreshMetrics();
    }
  }

  onSTIGManagerMetricsInit(component: STIGManagerMetricsComponent) {
    this.stigManagerMetrics = component;
  }

  onTenableMetricsInit(component: TenableMetricsComponent) {
    this.tenableMetrics = component;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
