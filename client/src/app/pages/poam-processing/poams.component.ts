/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { PoamService } from './poams.service';
import { Subscription, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { PayloadService } from '../../common/services/setPayload.service';

interface LabelInfo {
  poamId: number;
  labelId: number;
  labelName: string;
}

@Component({
  selector: 'cpat-poams',
  templateUrl: './poams.component.html',
  styleUrls: ['./poams.component.scss'],
})

export class PoamsComponent implements OnInit, AfterViewInit, OnDestroy {
  protected accessLevel: any;
  private subs = new SubSink();
  public isLoggedIn = false;
  poams: any[] = [];
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];

  constructor(
    private poamService: PoamService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService
  ) {
  }

  async ngOnInit() {
      this.setPayload();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }


  async setPayload() {
    await this.setPayloadService.setPayload();
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
          this.getPoamData();
        }
      })
    );
  }

  async getPoamData() {
    this.subs.sink = forkJoin([
      await this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      ),
      await this.poamService.getPoamLabels(
        this.payload.lastCollectionAccessedId
      )
    ]).subscribe(([poams, poamLabelResponse]: any) => {
      if (!Array.isArray(poamLabelResponse)) {
        console.error(
          'poamLabelResponse.poamLabels is not an array',
          poamLabelResponse
        );
        return;
      }
      const poamLabelMap: { [poamId: number]: string[] } = {};
      (poamLabelResponse as LabelInfo[]).forEach(labelInfo => {
        if (!poamLabelMap[labelInfo.poamId]) {
          poamLabelMap[labelInfo.poamId] = [];
        }
        poamLabelMap[labelInfo.poamId].push(labelInfo.labelName);
      });
      this.poams = poams.map((poam: any) => ({
        ...poam,
        labels: poamLabelMap[poam.poamId] || ['']
      }));
    });
  }

  addPoam() {
    this.router.navigateByUrl('/poam-processing/poam-details/ADDPOAM');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
