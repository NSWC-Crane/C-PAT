/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { SubSink } from 'subsink';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import {
  Observable,
  combineLatest,
  filter,
  forkJoin,
  switchMap,
  take,
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
import { Poam } from '../../../common/models/poam.model';

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
  advancedSeverityseverityPieChartData = signal<any[]>([]);
  advancedStatusPieChartData = signal<any[]>([]);
  poams = signal<Poam[]>([]);
  selectedPoamId = signal<any>(null);
  selectedCollection = signal<any>(null);
  selectedCollectionId = signal<any>(null);
  allPoams = signal<any[]>([]);
  poamsNeedingAttention = signal<any[]>([]);
  submittedPoams = signal<any[]>([]);
  poamsPendingApproval = signal<any[]>([]);
  teamPoams = signal<any[]>([]);
  user = signal<any>(null);
  payload = signal<any>(null);
  accessLevel = signal<number>(0);
  private subs = new SubSink();


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

  constructor(
    private collectionsService: CollectionsService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService
  ) { }

  async ngOnInit() {
    this.subs.sink = this.sharedService.selectedCollection.pipe(
      tap(collectionId => this.selectedCollectionId.set(collectionId))
    ).subscribe();

    await this.setPayload();
  }

  private async setPayload() {
    this.setPayloadService.setPayload();

    this.subs.sink = combineLatest([
      this.setPayloadService.user$,
      this.setPayloadService.payload$,
      this.setPayloadService.accessLevel$
    ]).pipe(
      filter(([user, payload, level]) => !!user && !!payload && level > 0),
      take(1),
      tap(([user, payload, level]) => {
        this.user.set(user);
        this.payload.set(payload);
        this.accessLevel.set(level);
      }),
      switchMap(([, payload]) => this.getPoamData(payload.lastCollectionAccessedId))
    ).subscribe({
      next: ([poams, basicListData]: any) => {
        this.poams.set(poams);
        this.selectedCollection.set(basicListData.find(
          (collection: any) => collection.collectionId === this.selectedCollectionId()
        ));
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

  managePoam(row: any) {
    const poamId = row.data.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  private readonly userTeamIds = computed(() => {
    return new Set(
      this.user()?.assignedTeams?.map((team: any) => team.assignedTeamId)
    );
  });

  updateGridData() {
    this.allPoams.set(this.poams());
    const needingAttention = this.poams().filter(poam => {
      if (!poam.scheduledCompletionDate) return false;
      const completionDate = new Date(poam.scheduledCompletionDate);
      const thresholdDate = new Date();

      thresholdDate.setDate(thresholdDate.getDate() + 30);
      return (
        !isNaN(completionDate.getTime()) &&
        completionDate <= thresholdDate &&
        !this.CLOSED_STATUSES.has(poam.status)
      );
    });
    this.poamsNeedingAttention.set(needingAttention);
    const submitted = this.poams().filter(poam =>
      poam.status !== 'Closed' &&
      poam.submitterId === this.user()?.userId
    );
    this.submittedPoams.set(submitted);
    const pendingApproval = this.poams().filter(poam =>
      this.PENDING_STATUSES.has(poam.status)
    );
    this.poamsPendingApproval.set(pendingApproval);
    const teamPoams = this.poams().filter(poam =>
      poam.assignedTeams?.some((poamTeam: any) =>
        this.userTeamIds().has(poamTeam.assignedTeamId)
      )
    );
    this.teamPoams.set(teamPoams);
  }

  updateAdvancedPieChart() {
    const severityCounts = new Map();
    const statusCounts = new Map();

    for (const poam of this.poams()) {
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

    const severityData = Array.from(severityCounts.entries())
      .map(([name, value]) => ({ name, value }));

    const statusData = this.STATUS_ORDER
      .map(status => ({
        name: status,
        value: statusCounts.get(status) || 0
      }));

    this.advancedSeverityseverityPieChartData.set(severityData);
    this.advancedStatusPieChartData.set(statusData);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
