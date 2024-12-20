/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SubSink } from 'subsink';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { Observable, Subject, Subscription, combineLatest, distinctUntilChanged, filter, forkJoin, from, map, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { Router } from '@angular/router';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { PoamAdvancedPieComponent } from '../poam-advanced-pie/poam-advanced-pie.component';
import { PoamAssignedGridComponent } from '../poam-assigned-grid/poam-assigned-grid.component';
import { PoamGridComponent } from '../poam-grid/poam-grid.component';
import { PoamMainchartComponent } from '../poam-mainchart/poam-mainchart.component';

@Component({
  selector: 'cpat-poam-manage',
  templateUrl: './poam-manage.component.html',
  styleUrls: ['./poam-manage.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TabViewModule,
    PoamAdvancedPieComponent,
    PoamMainchartComponent,
    PoamAssignedGridComponent,
    PoamGridComponent
  ]
})
export class PoamManageComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dataRefresh$ = new Subject<void>();

  advancedSeverityseverityPieChartData: any[] = [];
  advancedStatusPieChartData: any[] = [];
  isLoggedIn = false;
  monthlyPoamStatus: any[] = [];
  poams: any[] = [];
  poamsForChart: any[] = [];
  selectedPoamId: any;
  users: any;
  collection: any;
  selectedCollection: any;
  selectedCollectionId: any;
  allPoams: any[] = [];
  poamsNeedingAttention: any[] = [];
  submittedPoams: any[] = [];
  poamsPendingApproval: any[] = [];
  teamPoams: any[] = [];
  user: any;
  payload: any;
  protected accessLevel: number = 0;
  private subs = new SubSink();

  constructor(
    private collectionService: CollectionsService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService,
  ) { }

  async ngOnInit() {
    await this.initializeDataStreams();
  }

  private async initializeDataStreams() {
    try {
      await this.setPayloadService.setPayload();

      const payloadData$ = combineLatest([
        this.setPayloadService.user$,
        this.setPayloadService.payload$,
        this.setPayloadService.accessLevel$,
        this.sharedService.selectedCollection
      ]).pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => {
          return prev[1]?.lastCollectionAccessedId === curr[1]?.lastCollectionAccessedId &&
            prev[3] === curr[3];
        }),
        filter(([user, payload, accessLevel]) => {
          const isValid = !!user && !!payload && accessLevel > 0;
          return isValid;
        }),
        switchMap(([user, payload, accessLevel, collectionId]): Observable<[any[], any[]]> => {
          this.user = user;
          this.payload = payload;
          this.accessLevel = accessLevel;
          this.selectedCollectionId = collectionId;

          if (payload?.lastCollectionAccessedId) {
            return this.getPoamData().pipe(
            );
          }
          return of([[], []]);
        }),
        tap(([poamsResponse, basicListResponse]) => {
          if (poamsResponse && basicListResponse) {
            this.poams = poamsResponse;
            this.selectedCollection = basicListResponse.find(
              (collection: any) => collection.collectionId === this.selectedCollectionId
            );
            this.updateGridData();
            this.updateAdvancedPieChart();
            this.cdr.detectChanges();
          }
        })
      );

      payloadData$.pipe(take(1)).subscribe({
        error: (error) => console.error('Error in data stream:', error)
      });
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  private getPoamData(): Observable<[any[], any[]]> {
    return forkJoin([
      from(this.collectionService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId
      )).pipe(
        switchMap(observable => observable),
        map(response => Array.isArray(response) ? response : [])
      ),
      from(this.collectionService.getCollectionBasicList()).pipe(
        switchMap(observable => observable),
        map(response => Array.isArray(response) ? response : [])
      )
    ]).pipe(
      takeUntil(this.destroy$)
    );
  }

  private updateEmptyState() {
    this.poams = [];
    this.allPoams = [];
    this.poamsNeedingAttention = [];
    this.submittedPoams = [];
    this.poamsPendingApproval = [];
    this.advancedSeverityseverityPieChartData = [];
    this.advancedStatusPieChartData = [];
  }

  onPoamsChange(updatedPoams: any[]) {
    this.poamsForChart = updatedPoams;
  }

  managePoam(row: any) {
    const poamId = row.data.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  updateGridData() {
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date(
      currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    this.allPoams = [...this.poams];

    this.poamsNeedingAttention = this.poams.filter(poam => {
      if (!poam.scheduledCompletionDate) return false;
      const completionDate = new Date(poam.scheduledCompletionDate);
      return !isNaN(completionDate.getTime()) &&
        completionDate <= thirtyDaysFromNow &&
        !['Closed', 'Draft', 'False-Positive'].includes(poam.status);
    });

    this.submittedPoams = this.poams.filter(poam =>
      poam.status !== 'Closed' && poam.submitterId === this.user.userId
    );

    this.poamsPendingApproval = this.poams.filter(poam =>
      ['Submitted', 'Extension Requested', 'Pending CAT-I Approval'].includes(poam.status)
    );

    this.teamPoams = this.poams.filter(poam =>
      poam.assignedTeams?.some((poamTeam: any) =>
        this.user.assignedTeams?.some((userTeam: any) =>
          userTeam.assignedTeamId === poamTeam.assignedTeamId
        )
      )
    );
  }

  updateAdvancedPieChart() {
    const severityMapping: any = {
      'CAT I - Critical': 'CAT I',
      'CAT I - High': 'CAT I',
      'CAT II - Medium': 'CAT II',
      'CAT III - Low': 'CAT III',
      'CAT III - Informational': 'CAT III'
    };

    const statusOrder = [
      'Submitted', 'Pending CAT-I Approval', 'Approved', 'Closed',
      'False-Positive', 'Rejected', 'Extension Requested', 'Expired', 'Draft'
    ];

    const severityCounts = this.poams.reduce((acc, poam) => {
      const mappedSeverity = severityMapping[poam.rawSeverity] || poam.rawSeverity;
      acc[mappedSeverity] = (acc[mappedSeverity] || 0) + 1;
      return acc;
    }, {});

    this.advancedSeverityseverityPieChartData = Object.entries(severityCounts)
      .map(([name, value]) => ({ name, value }));

    const statusCounts = this.poams.reduce((acc, poam) => {
      acc[poam.status] = (acc[poam.status] || 0) + 1;
      return acc;
    }, {});

    this.advancedStatusPieChartData = statusOrder
      .map(status => ({
        name: status,
        value: statusCounts[status] || 0
      }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
