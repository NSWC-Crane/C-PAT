/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { Observable, catchError, combineLatest, filter, forkJoin, of, switchMap, take, tap } from 'rxjs';
import { SubSink } from 'subsink';
import { Poam } from '../../../common/models/poam.model';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin/collections/collections.service';
import { IntegrationService } from '../../integrations/integration.service';
import { PoamAdvancedPieComponent } from '../poam-advanced-pie/poam-advanced-pie.component';
import { PoamGridComponent } from '../poam-grid/poam-grid.component';
import { PoamMilestoneGridComponent } from '../poam-milestone-grid/poam-milestone-grid.component';
import { TourPrimeNg } from 'ngx-ui-tour-primeng';

const CATEGORIES = ['CAT I', 'CAT II', 'CAT III'] as const;

const SEVERITY_TO_CATEGORY: Record<string, string> = {
  critical: 'CAT I',
  high: 'CAT I',
  medium: 'CAT II',
  low: 'CAT III'
};

const RAW_SEVERITY_TO_CATEGORY: Record<string, string> = {
  critical: 'CAT I',
  high: 'CAT I',
  'cat i - high': 'CAT I',
  'cat i - critical': 'CAT I',
  medium: 'CAT II',
  'cat ii - medium': 'CAT II'
};

const POAM_CHART_SERIES = [
  { status: 'Approved', key: 'approvedPoams', name: 'Approved', type: 'approved' },
  { status: 'Submitted', key: 'submittedPoams', name: 'Submitted', type: 'submitted' },
  { status: 'Extension Requested', key: 'extensionPoams', name: 'Extension Requested', type: 'extension' },
  { status: 'False-Positive', key: 'falsePositivePoams', name: 'False-Positive', type: 'falsePositive' },
  { status: 'Pending CAT-I Approval', key: 'pendingApprovalPoams', name: 'Pending CAT-I Approval', type: 'pendingApproval' },
  { status: 'Expired', key: 'expiredPoams', name: 'Expired', type: 'expired' },
  { status: 'Rejected', key: 'rejectedPoams', name: 'Rejected', type: 'rejected' },
  { status: 'Closed', key: 'closedPoams', name: 'Closed', type: 'closed' }
] as const;

const OPEN_FINDINGS_SERIES = { key: 'openFindings', name: 'Open Findings', type: 'open' } as const;

function createEmptyCategoryCounts(): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};

  for (const category of CATEGORIES) {
    counts[category] = { [OPEN_FINDINGS_SERIES.key]: 0 };

    for (const series of POAM_CHART_SERIES) {
      counts[category][series.key] = 0;
    }
  }

  return counts;
}

function categorizePoamBySeverity(poam: any): string {
  const severity = poam.rawSeverity?.toLowerCase() || 'low';

  return RAW_SEVERITY_TO_CATEGORY[severity] ?? 'CAT III';
}

@Component({
  selector: 'cpat-poam-manage',
  templateUrl: './poam-manage.component.html',
  styleUrls: ['./poam-manage.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, TabsModule, PoamAdvancedPieComponent, PoamGridComponent, PoamMilestoneGridComponent, TourPrimeNg]
})
export class PoamManageComponent implements OnInit, OnDestroy {
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly router = inject(Router);
  private readonly setPayloadService = inject(PayloadService);
  private readonly integrationService = inject(IntegrationService);
  private readonly messageService = inject(MessageService);

  catIPieChartData = signal<any[]>([]);
  catIIPieChartData = signal<any[]>([]);
  catIIIPieChartData = signal<any[]>([]);

  catIPieChartData30Days = signal<any[]>([]);
  catIIPieChartData30Days = signal<any[]>([]);
  catIIIPieChartData30Days = signal<any[]>([]);

  findingsData = signal<any[]>([]);
  findingsData30Days = signal<any[]>([]);

  poams = signal<Poam[]>([]);
  selectedPoamId = signal<any>(null);
  selectedCollection = signal<any>(null);
  selectedCollectionId = signal<any>(null);
  allPoams = signal<any[]>([]);
  poamsNeedingAttention = signal<any[]>([]);
  submittedPoams = signal<any[]>([]);
  poamsPendingApproval = signal<any[]>([]);
  teamPoams = signal<any[]>([]);
  affectedAssetCounts = signal<{ vulnerabilityId: string; assetCount: number }[]>([]);
  user = signal<any>(null);
  payload = signal<any>(null);
  accessLevel = signal<number>(0);
  isGridExpanded = signal<boolean>(false);
  private readonly subs = new SubSink();

  private readonly NEEDS_ATTENTION_STATUSES = new Set(['Draft', 'False-Positive']);
  private readonly PENDING_STATUSES = new Set(['Submitted', 'Extension Requested', 'Pending CAT-I Approval']);
  private readonly userTeamIds = computed(() => new Set(this.user()?.assignedTeams?.map((team: any) => team.assignedTeamId)));

  findingsByCategory = signal<{ [key: string]: { total: number; withPoam: number; percentage: number } }>({
    'CAT I': { total: 0, withPoam: 0, percentage: 0 },
    'CAT II': { total: 0, withPoam: 0, percentage: 0 },
    'CAT III': { total: 0, withPoam: 0, percentage: 0 }
  });

  catITotal = computed(() => this.catIPieChartData().reduce((sum, item) => sum + item.value, 0));

  catIITotal = computed(() => this.catIIPieChartData().reduce((sum, item) => sum + item.value, 0));

  catIIITotal = computed(() => this.catIIIPieChartData().reduce((sum, item) => sum + item.value, 0));

  catITotal30Days = computed(() => this.catIPieChartData30Days().reduce((sum, item) => sum + item.value, 0));

  catIITotal30Days = computed(() => this.catIIPieChartData30Days().reduce((sum, item) => sum + item.value, 0));

  catIIITotal30Days = computed(() => this.catIIIPieChartData30Days().reduce((sum, item) => sum + item.value, 0));

  ngOnInit() {
    this.subs.sink = this.sharedService.selectedCollection.pipe(tap((collectionId) => this.selectedCollectionId.set(collectionId))).subscribe();

    this.setPayload();
  }

  private setPayload() {
    this.subs.sink = combineLatest([this.setPayloadService.user$, this.setPayloadService.payload$, this.setPayloadService.accessLevel$])
      .pipe(
        filter(([user, payload, level]) => !!user && !!payload && level > 0),
        take(1),
        tap(([user, payload, level]) => {
          this.user.set(user);
          this.payload.set(payload);
          this.accessLevel.set(level);
        }),
        switchMap(([, payload]) => this.getPoamData(payload.lastCollectionAccessedId))
      )
      .subscribe({
        next: ([poams, basicListData]: any) => {
          this.poams.set(poams);

          const effectiveCollectionId = this.selectedCollectionId() ?? this.payload()?.lastCollectionAccessedId;

          this.selectedCollection.set(basicListData.find((collection: any) => collection.collectionId === effectiveCollectionId));
          this.updateGridData();

          if (this.selectedCollection()) {
            this.fetchFindingsData(this.selectedCollection().originCollectionId, this.selectedCollection().collectionType);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading POAM data: ${getErrorMessage(error)}`
          });
        }
      });
  }

  private fetchFindingsData(collectionId: number, collectionType: string): void {
    if (collectionType === 'STIG Manager') {
      this.subs.sink = this.sharedService.getFindingsMetricsFromSTIGMAN(collectionId).subscribe({
        next: (data) => {
          this.findingsData.set(data);

          const assetCounts = data.map((finding: any) => ({
            vulnerabilityId: finding.groupId,
            assetCount: finding.assetCount || 0
          }));

          this.affectedAssetCounts.set(assetCounts);
          this.calculateFindingStats();
          this.updateCategoryPieCharts();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error loading findings data: ${getErrorMessage(error)}`
          });
        }
      });
    } else if (collectionType === 'Tenable') {
      const baseQuery = {
        description: '',
        context: '',
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: 'vuln',
        tool: 'sumid',
        sourceType: 'cumulative',
        startOffset: 0,
        endOffset: 10000,
        vulnTool: 'sumid'
      };

      const allFindingsQuery = {
        query: {
          ...baseQuery,
          filters: [
            {
              id: 'repository',
              filterName: 'repository',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: [{ id: collectionId.toString() }]
            },
            {
              id: 'severity',
              filterName: 'severity',
              operator: '=',
              value: '1,2,3,4',
              type: 'vuln',
              isPredefined: true
            }
          ]
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      };

      const thirtyDaysQuery = {
        query: {
          ...baseQuery,
          filters: [
            {
              id: 'repository',
              filterName: 'repository',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: [{ id: collectionId.toString() }]
            },
            {
              id: 'lastSeen',
              filterName: 'lastSeen',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: '0:30'
            },
            {
              id: 'pluginPublished',
              filterName: 'pluginPublished',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: '30:all'
            },
            {
              id: 'severity',
              filterName: 'severity',
              operator: '=',
              value: '1,2,3,4',
              type: 'vuln',
              isPredefined: true
            }
          ]
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      };

      this.subs.sink = forkJoin([this.integrationService.postTenableAnalysis(allFindingsQuery), this.integrationService.postTenableAnalysis(thirtyDaysQuery)])
        .pipe(
          catchError((error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error fetching Tenable findings: ${getErrorMessage(error)}`
            });

            return of([{ response: { results: [] } }, { response: { results: [] } }]);
          })
        )
        .subscribe({
          next: ([allData, thirtyDaysData]) => {
            const processFindings = (data: any) => {
              if (data.error_msg) {
                console.error('Error in Tenable response:', data.error_msg);

                return [];
              }

              return data.response.results.map((vuln: any) => ({
                groupId: vuln.pluginID,
                severity: this.mapTenableSeverityToCategory(vuln.severity?.name || ''),
                pluginName: vuln.name || '',
                family: vuln.family?.name || ''
              }));
            };

            const assetCounts = allData.response.results.map((vuln: any) => ({
              vulnerabilityId: vuln.pluginID?.toString() || '',
              assetCount: vuln.hostTotal || 0
            }));

            this.affectedAssetCounts.set(assetCounts);

            const allFindings = processFindings(allData);
            const thirtyDaysFindings = processFindings(thirtyDaysData);

            this.findingsData.set(allFindings);
            this.findingsData30Days.set(thirtyDaysFindings);

            this.calculateFindingStats();
            this.updateCategoryPieCharts();

            const originalFindings = this.findingsData();

            this.findingsData.set(thirtyDaysFindings);
            this.calculateFindingStats();

            this.catIPieChartData30Days.set(this.catIPieChartData());
            this.catIIPieChartData30Days.set(this.catIIPieChartData());
            this.catIIIPieChartData30Days.set(this.catIIIPieChartData());

            this.findingsData.set(originalFindings);
            this.calculateFindingStats();
            this.updateCategoryPieCharts();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error processing Tenable findings data: ${getErrorMessage(error)}`
            });
          }
        });
    } else {
      this.affectedAssetCounts.set([]);
      this.calculateFindingStats();
      this.updateCategoryPieCharts();
    }
  }

  private calculateFindingStats(): void {
    const stats = {
      'CAT I': { total: 0, withPoam: 0, percentage: 0 },
      'CAT II': { total: 0, withPoam: 0, percentage: 0 },
      'CAT III': { total: 0, withPoam: 0, percentage: 0 }
    };

    for (const finding of this.findingsData()) {
      const category = SEVERITY_TO_CATEGORY[finding.severity] || 'CAT III';

      stats[category].total++;

      const matchingPoams = this.poams().filter((poam) => poam.status !== 'Draft' && (poam.vulnerabilityId === finding.groupId || poam.associatedVulnerabilities?.includes(finding.groupId)));

      if (matchingPoams.length > 0) {
        stats[category].withPoam++;
      }
    }

    for (const category in stats) {
      if (stats[category].total > 0) {
        stats[category].percentage = (stats[category].withPoam / stats[category].total) * 100;
      }
    }

    this.findingsByCategory.set(stats);
    this.updateCategoryPieCharts();
  }

  private mapTenableSeverityToCategory(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getPoamData(collectionId: number): Observable<[any[], any[]]> {
    return forkJoin([this.collectionsService.getPoamsByCollection(collectionId), this.collectionsService.getCollectionBasicList()]);
  }

  managePoam(row: any) {
    const poamId = row.data.poamId;

    this.router.navigateByUrl(`/poams/poam-details/${poamId}`);
  }

  updateGridData() {
    this.allPoams.set(this.poams());
    const needingAttention = this.poams().filter((poam) => {
      if (!poam.scheduledCompletionDate) return false;
      const completionDate = new Date(poam.scheduledCompletionDate);
      const thresholdDate = new Date();

      thresholdDate.setDate(thresholdDate.getDate() + 30);

      return !Number.isNaN(completionDate.getTime()) && completionDate <= thresholdDate && !this.NEEDS_ATTENTION_STATUSES.has(poam.status);
    });

    this.poamsNeedingAttention.set(needingAttention);
    const submitted = this.poams().filter((poam) => (poam.status !== 'Closed' && poam.submitterId === this.user()?.userId) || poam.ownerId === this.user()?.userId);

    this.submittedPoams.set(submitted);
    const pendingApproval = this.poams().filter((poam) => this.PENDING_STATUSES.has(poam.status));

    this.poamsPendingApproval.set(pendingApproval);
    const teamPoams = this.poams().filter((poam) => poam.assignedTeams?.some((poamTeam: any) => this.userTeamIds().has(poamTeam.assignedTeamId)));

    this.teamPoams.set(teamPoams);
  }

  updateCategoryPieCharts() {
    const poamsByStatus = this.groupPoamsByStatus();
    const categoryData = this.findingsData().length === 0 ? this.buildFallbackCategoryCounts(poamsByStatus) : this.buildFindingsCategoryCounts(poamsByStatus);

    this.catIPieChartData.set(this.createCategoryChartData('CAT I', categoryData['CAT I']));
    this.catIIPieChartData.set(this.createCategoryChartData('CAT II', categoryData['CAT II']));
    this.catIIIPieChartData.set(this.createCategoryChartData('CAT III', categoryData['CAT III']));
  }

  private groupPoamsByStatus(): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const series of POAM_CHART_SERIES) {
      grouped[series.status] = [];
    }

    for (const poam of this.poams()) {
      grouped[poam.status]?.push(poam);
    }

    return grouped;
  }

  private buildFallbackCategoryCounts(poamsByStatus: Record<string, any[]>): Record<string, Record<string, number>> {
    const counts = createEmptyCategoryCounts();

    for (const series of POAM_CHART_SERIES) {
      for (const poam of poamsByStatus[series.status]) {
        counts[categorizePoamBySeverity(poam)][series.key]++;
      }
    }

    return counts;
  }

  private buildFindingCategoryIndex(): Map<string, string> {
    const index = new Map<string, string>();

    for (const finding of this.findingsData()) {
      if (!index.has(finding.groupId)) {
        index.set(finding.groupId, SEVERITY_TO_CATEGORY[finding.severity] || 'CAT III');
      }
    }

    return index;
  }

  private collectVulnIdsByCategory(poams: any[], findingCategories: Map<string, string>): Record<string, Set<string>> {
    const byCategory: Record<string, Set<string>> = {};

    for (const category of CATEGORIES) {
      byCategory[category] = new Set<string>();
    }

    for (const poam of poams) {
      const vulnIds = Array.isArray(poam?.associatedVulnerabilities) ? [poam.vulnerabilityId, ...poam.associatedVulnerabilities] : [poam.vulnerabilityId];

      for (const vulnId of vulnIds) {
        const category = findingCategories.get(vulnId);

        if (category) {
          byCategory[category].add(vulnId);
        }
      }
    }

    return byCategory;
  }

  private buildFindingsCategoryCounts(poamsByStatus: Record<string, any[]>): Record<string, Record<string, number>> {
    const counts = createEmptyCategoryCounts();
    const findingCategories = this.buildFindingCategoryIndex();
    const vulnIdsBySeries = POAM_CHART_SERIES.map((series) => ({
      key: series.key,
      vulnIdsByCategory: this.collectVulnIdsByCategory(poamsByStatus[series.status], findingCategories)
    }));

    for (const finding of this.findingsData()) {
      const category = SEVERITY_TO_CATEGORY[finding.severity] || 'CAT III';
      const owningSeries = vulnIdsBySeries.find((series) => series.vulnIdsByCategory[category].has(finding.groupId));

      counts[category][owningSeries?.key ?? OPEN_FINDINGS_SERIES.key]++;
    }

    return counts;
  }

  private createCategoryChartData(category: string, data: Record<string, number>): any[] {
    const chartData = [...POAM_CHART_SERIES, OPEN_FINDINGS_SERIES].filter((series) => data[series.key] > 0).map((series) => ({ name: series.name, value: data[series.key], extra: { category, type: series.type } }));

    if (chartData.length === 0) {
      return [{ name: 'No Data', value: 1, extra: { category, type: 'empty' } }];
    }

    return chartData;
  }

  toggleGridExpanded(): void {
    this.isGridExpanded.set(!this.isGridExpanded());
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
