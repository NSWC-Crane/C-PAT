/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { PayloadService } from '../../common/services/setPayload.service';
import { getErrorMessage } from '../../common/utils/error-utils';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { PoamMainchartComponent } from './poam-mainchart/poam-mainchart.component';

@Component({
  selector: 'cpat-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
  standalone: true,
  imports: [PoamMainchartComponent, ToastModule]
})
export class PoamsComponent implements OnInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private router = inject(Router);
  private setPayloadService = inject(PayloadService);
  private messageService = inject(MessageService);

  protected accessLevel: any;
  private subs = new SubSink();
  public isLoggedIn = false;
  poams: any;
  user: any;
  payload: any;
  selectedCollection: any;
  private payloadSubscription: Subscription[] = [];

  ngOnInit() {
    this.setPayload();
  }

  async setPayload() {
    this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe((level) => {
        this.accessLevel = level;

        if (this.accessLevel > 0) {
          this.selectedCollection = this.user.lastCollectionAccessedId;
          this.getPoamData();
        }
      })
    );
  }

  getPoamData() {
    this.collectionsService.getPoamsByCollection(this.selectedCollection).subscribe({
      next: (poamData: any) => {
        this.poams = poamData;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error fetching POAM data: ${getErrorMessage(error)}`
        });
      }
    });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
  }
}
