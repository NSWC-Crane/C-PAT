/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PayloadService } from '../../common/services/setPayload.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { CommonModule } from '@angular/common';
import { PoamMainchartComponent } from './poam-mainchart/poam-mainchart.component';

@Component({
  selector: 'cpat-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
  standalone: true,
  imports: [CommonModule, PoamMainchartComponent],
})
export class PoamsComponent implements OnInit, AfterViewInit, OnDestroy {
  protected accessLevel: any;
  private subs = new SubSink();
  public isLoggedIn = false;
  poams: any;
  user: any;
  payload: any;
  selectedCollection: any;
  private payloadSubscription: Subscription[] = [];

  constructor(
    private collectionsService: CollectionsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService
  ) {}

  async ngOnInit() {
    this.setPayload();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  async setPayload() {
    this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.selectedCollection = this.user.lastCollectionAccessedId;
          this.getPoamData();
        }
      })
    );
  }

  getPoamData() {
    this.collectionsService.getPoamsByCollection(this.selectedCollection)
      .subscribe({
        next: (poamData: any) => {
          this.poams = poamData;
        },
        error: (error) => {
          console.error('Error fetching POAM data:', error);
        }
      });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
