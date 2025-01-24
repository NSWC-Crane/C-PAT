/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import {
  Observable,
  combineLatest,
  filter,
  forkJoin,
  switchMap,
  tap,
} from 'rxjs';
import { Router } from '@angular/router';
import { PayloadService } from '../../../common/services/setPayload.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { PoamAdvancedPieComponent } from '../poam-advanced-pie/poam-advanced-pie.component';
import { PoamAssignedGridComponent } from '../poam-assigned-grid/poam-assigned-grid.component';
import { PoamGridComponent } from '../poam-grid/poam-grid.component';
import { PoamMainchartComponent } from '../poam-mainchart/poam-mainchart.component';

@Component({
  selector: 'cpat-poam-manage',
  templateUrl: './poam-manage.component.html',
  styleUrls: ['./poam-manage.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TabsModule,
    PoamAdvancedPieComponent,
    PoamMainchartComponent,
    PoamAssignedGridComponent,
    PoamGridComponent,
  ],
})
export class PoamManageComponent implements OnInit, AfterViewInit, OnDestroy {
  advancedSeverityseverityPieChartData: any[] = [];
  advancedStatusPieChartData: any[] = [];
  poams: any[] = [];
  selectedPoamId: any;
  selectedCollection: any;
  selectedCollectionId: any;
  allPoams: any[] = [];
  poamsNeedingAttention: any[] = [];
  submittedPoams: any[] = [];
  poamsPendingApproval: any[] = [];
  teamPoams: any[] = [];
  user: any;
  payload: any;
  private readonly CLOSED_STATUSES = new Set(['Closed', 'Draft', 'False-Positive']);
  private readonly PENDING_STATUSES = new Set([
    'Submitted',
    'Extension Requested',
    'Pending CAT-I Approval'
  ]);
  private readonly SEVERITY_MAPPING: { [key: string]: string } = {
    'CAT I - Critical': 'CAT I',
    'CAT I - High': 'CAT I',
    'CAT II - Medium': 'CAT II',
    'CAT III - Low': 'CAT III',
    'CAT III - Informational': 'CAT III',
  };

  private readonly STATUS_ORDER: string[] = [
    'Submitted',
    'Pending CAT-I Approval',
    'Approved',
    'Closed',
    'False-Positive',
    'Rejected',
    'Extension Requested',
    'Expired',
    'Draft',
  ];
  private memoizedResults = new Map<string, any>();
  protected accessLevel: number = 0;
  private subs = new SubSink();

  constructor(
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService
  ) { }

  async ngOnInit() {
    this.subs.sink = this.sharedService.selectedCollection.pipe(
      tap(collectionId => this.selectedCollectionId = collectionId)
    ).subscribe();

    await this.setPayload();
  }

  private async setPayload() {
    await this.setPayloadService.setPayload();

    this.subs.sink = combineLatest([
      this.setPayloadService.user$,
      this.setPayloadService.payload$,
      this.setPayloadService.accessLevel$
    ]).pipe(
      filter(([user, payload, level]) => !!user && !!payload && level > 0),
      tap(([user, payload, level]) => {
        this.user = user;
        this.payload = payload;
        this.accessLevel = level;
      }),
      switchMap(([, payload]) => this.getPoamData(payload.lastCollectionAccessedId))
    ).subscribe({
      next: ([poams, basicListData]: any) => {
        this.poams = poams;
        this.selectedCollection = basicListData.find(
          (collection: any) => collection.collectionId === this.selectedCollectionId
        );
        this.updateGridData();
        this.updateAdvancedPieChart();
      },
      error: (error) => console.error('Error loading POAM data:', error)
    });
  }

  private getPoamData(collectionId: number): Observable<[any[], any[]]> {
    return forkJoin([
      this.collectionsService.getPoamsByCollection(collectionId),
      this.collectionsService.getCollectionBasicList()
    ]);
  }

  private getMemoizedResult(key: string, computeFn: () => any): any {
    if (!this.memoizedResults.has(key)) {
      this.memoizedResults.set(key, computeFn());
    }
    return this.memoizedResults.get(key);
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
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.allPoams = this.poams;

    this.poamsNeedingAttention = this.getMemoizedResult(
      'needingAttention',
      () => this.poams.filter(poam => {
        if (!poam.scheduledCompletionDate) return false;
        const completionDate = new Date(poam.scheduledCompletionDate);
        return (
          !isNaN(completionDate.getTime()) &&
          completionDate <= thirtyDaysFromNow &&
          !this.CLOSED_STATUSES.has(poam.status)
        );
      })
    );

    this.submittedPoams = this.getMemoizedResult(
      'submitted',
      () => this.poams.filter(poam =>
        poam.status !== 'Closed' &&
        poam.submitterId === this.user.userId
      )
    );

    this.poamsPendingApproval = this.getMemoizedResult(
      'pendingApproval',
      () => this.poams.filter(poam =>
        this.PENDING_STATUSES.has(poam.status)
      )
    );

    const userTeamIds = new Set(
      this.user.assignedTeams?.map((team: any) => team.assignedTeamId)
    );

    this.teamPoams = this.getMemoizedResult(
      'teamPoams',
      () => this.poams.filter(poam =>
        poam.assignedTeams?.some((poamTeam: any) =>
          userTeamIds.has(poamTeam.assignedTeamId)
        )
      )
    );
  }

  updateAdvancedPieChart() {
    const { severityData, statusData } = this.getMemoizedResult(
      'chartData',
      () => {
        const severityCounts = new Map();
        const statusCounts = new Map();

        for (const poam of this.poams) {
          const mappedSeverity = this.SEVERITY_MAPPING[poam.rawSeverity] || poam.rawSeverity;
          severityCounts.set(
            mappedSeverity,
            (severityCounts.get(mappedSeverity) || 0) + 1
          );

          statusCounts.set(
            poam.status,
            (statusCounts.get(poam.status) || 0) + 1
          );
        }

        return {
          severityData: Array.from(severityCounts.entries())
            .map(([name, value]) => ({ name, value })),
          statusData: this.STATUS_ORDER
            .map(status => ({
              name: status,
              value: statusCounts.get(status) || 0
            }))
        };
      }
    );

    this.advancedSeverityseverityPieChartData = severityData;
    this.advancedStatusPieChartData = statusData;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.memoizedResults.clear();
  }
}
