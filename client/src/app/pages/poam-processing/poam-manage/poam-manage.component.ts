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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { Observable, catchError, combineLatest, filter, forkJoin, of, switchMap, take, tap } from 'rxjs';
import { SubSink } from 'subsink';
import { Poam } from '../../../common/models/poam.model';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { ImportService } from '../../import-processing/import.service';
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
  imports: [CommonModule, ButtonModule, CardModule, TabsModule, ToastModule, PoamAdvancedPieComponent, PoamMainchartComponent, PoamAssignedGridComponent, PoamGridComponent]
})
export class PoamManageComponent implements OnInit, AfterViewInit, OnDestroy {
  private collectionsService = inject(CollectionsService);
  private sharedService = inject(SharedService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private setPayloadService = inject(PayloadService);
  private importService = inject(ImportService);
  private messageService = inject(MessageService);

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
  private subs = new SubSink();

  private readonly CLOSED_STATUSES = new Set(['Closed', 'Draft', 'False-Positive']);
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

  async ngOnInit() {
    this.subs.sink = this.sharedService.selectedCollection.pipe(tap((collectionId) => this.selectedCollectionId.set(collectionId))).subscribe();

    await this.setPayload();
  }

  private async setPayload() {
    this.setPayloadService.setPayload();

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
          this.selectedCollection.set(basicListData.find((collection: any) => collection.collectionId === this.selectedCollectionId()));
          this.updateGridData();

          if (this.selectedCollection()) {
            this.fetchFindingsData(this.selectedCollection().originCollectionId, this.selectedCollection().collectionOrigin);
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

  private fetchFindingsData(collectionId: number, collectionOrigin: string): void {
    if (collectionOrigin === 'STIG Manager') {
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
    } else if (collectionOrigin === 'Tenable') {
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
            }
          ]
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln'
      };

      this.subs.sink = forkJoin([this.importService.postTenableAnalysis(allFindingsQuery), this.importService.postTenableAnalysis(thirtyDaysQuery)])
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

    const severityToCategoryMap: { [key: string]: string } = {
      critical: 'CAT I',
      high: 'CAT I',
      medium: 'CAT II',
      low: 'CAT III',
      informational: 'CAT III'
    };

    for (const finding of this.findingsData()) {
      const category = severityToCategoryMap[finding.severity] || 'CAT III';

      stats[category].total++;

      const matchingPoams = this.poams().filter((poam) => poam.status !== 'Draft' && (poam.vulnerabilityId === finding.groupId || (poam.associatedVulnerabilities && poam.associatedVulnerabilities.includes(finding.groupId))));

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
      case 'low':
        return 'low';
      default:
        return 'informational';
    }
  }

  private getPoamData(collectionId: number): Observable<[any[], any[]]> {
    return forkJoin([this.collectionsService.getPoamsByCollection(collectionId), this.collectionsService.getCollectionBasicList()]);
  }

  managePoam(row: any) {
    const poamId = row.data.poamId;

    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  updateGridData() {
    this.allPoams.set(this.poams());
    const needingAttention = this.poams().filter((poam) => {
      if (!poam.scheduledCompletionDate) return false;
      const completionDate = new Date(poam.scheduledCompletionDate);
      const thresholdDate = new Date();

      thresholdDate.setDate(thresholdDate.getDate() + 30);

      return !Number.isNaN(completionDate.getTime()) && completionDate <= thresholdDate && !this.CLOSED_STATUSES.has(poam.status);
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
    const severityToCategoryMap: { [key: string]: string } = {
      critical: 'CAT I',
      high: 'CAT I',
      medium: 'CAT II',
      low: 'CAT III',
      informational: 'CAT III'
    };

    const approvedPoams = this.poams().filter((poam) => poam.status === 'Approved');
    const submittedPoams = this.poams().filter((poam) => poam.status === 'Submitted');
    const extensionRequestedPoams = this.poams().filter((poam) => poam.status === 'Extension Requested');
    const falsePositivePoams = this.poams().filter((poam) => poam.status === 'False-Positive');
    const pendingApprovalPoams = this.poams().filter((poam) => poam.status === 'Pending CAT-I Approval');
    const expiredPoams = this.poams().filter((poam) => poam.status === 'Expired');
    const rejectedPoams = this.poams().filter((poam) => poam.status === 'Rejected');
    const closedPoams = this.poams().filter((poam) => poam.status === 'Closed');

    if (this.findingsData().length === 0) {
      const fallbackCategoryData = {
        'CAT I': {
          approvedPoams: 0,
          submittedPoams: 0,
          extensionPoams: 0,
          falsePositivePoams: 0,
          pendingApprovalPoams: 0,
          expiredPoams: 0,
          rejectedPoams: 0,
          closedPoams: 0,
          openFindings: 0
        },
        'CAT II': {
          approvedPoams: 0,
          submittedPoams: 0,
          extensionPoams: 0,
          falsePositivePoams: 0,
          pendingApprovalPoams: 0,
          expiredPoams: 0,
          rejectedPoams: 0,
          closedPoams: 0,
          openFindings: 0
        },
        'CAT III': {
          approvedPoams: 0,
          submittedPoams: 0,
          extensionPoams: 0,
          falsePositivePoams: 0,
          pendingApprovalPoams: 0,
          expiredPoams: 0,
          rejectedPoams: 0,
          closedPoams: 0,
          openFindings: 0
        }
      };

      const categorizePOAM = (poam: any): string => {
        const severity = poam.rawSeverity?.toLowerCase() || 'low';

        if (severity === 'critical' || severity === 'high' || severity === 'cat i - high' || severity === 'cat i - critical') return 'CAT I';
        if (severity === 'medium' || severity === 'cat ii - medium') return 'CAT II';

        return 'CAT III';
      };

      for (const poam of approvedPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].approvedPoams++;
      }

      for (const poam of submittedPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].submittedPoams++;
      }

      for (const poam of extensionRequestedPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].extensionPoams++;
      }

      for (const poam of falsePositivePoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].falsePositivePoams++;
      }

      for (const poam of pendingApprovalPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].pendingApprovalPoams++;
      }

      for (const poam of expiredPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].expiredPoams++;
      }

      for (const poam of rejectedPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].rejectedPoams++;
      }

      for (const poam of closedPoams) {
        const category = categorizePOAM(poam);

        fallbackCategoryData[category].closedPoams++;
      }

      this.catIPieChartData.set(this.createCategoryChartData('CAT I', fallbackCategoryData['CAT I']));
      this.catIIPieChartData.set(this.createCategoryChartData('CAT II', fallbackCategoryData['CAT II']));
      this.catIIIPieChartData.set(this.createCategoryChartData('CAT III', fallbackCategoryData['CAT III']));

      return;
    }

    const approvedVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const submittedVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const extensionVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const falsePositiveVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const pendingApprovalVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const expiredVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const rejectedVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const closedVulnIdsByCategory = {
      'CAT I': new Set<string>(),
      'CAT II': new Set<string>(),
      'CAT III': new Set<string>()
    };

    const addVulnerabilityToCategory = (vulnId: string, categoryMap: { [key: string]: Set<string> }) => {
      const matchingFinding = this.findingsData().find((finding) => finding.groupId === vulnId);

      if (matchingFinding) {
        const category = severityToCategoryMap[matchingFinding.severity] || 'CAT III';

        categoryMap[category].add(vulnId);
      }
    };

    for (const poam of approvedPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, approvedVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, approvedVulnIdsByCategory);
        }
      }
    }

    for (const poam of submittedPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, submittedVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, submittedVulnIdsByCategory);
        }
      }
    }

    for (const poam of extensionRequestedPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, extensionVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, extensionVulnIdsByCategory);
        }
      }
    }

    for (const poam of falsePositivePoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, falsePositiveVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, falsePositiveVulnIdsByCategory);
        }
      }
    }

    for (const poam of pendingApprovalPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, pendingApprovalVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, pendingApprovalVulnIdsByCategory);
        }
      }
    }

    for (const poam of expiredPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, expiredVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, expiredVulnIdsByCategory);
        }
      }
    }

    for (const poam of rejectedPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, rejectedVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, rejectedVulnIdsByCategory);
        }
      }
    }

    for (const poam of closedPoams) {
      addVulnerabilityToCategory(poam.vulnerabilityId, closedVulnIdsByCategory);

      if (Array.isArray(poam?.associatedVulnerabilities)) {
        for (const assocVulnId of poam.associatedVulnerabilities) {
          addVulnerabilityToCategory(assocVulnId, closedVulnIdsByCategory);
        }
      }
    }

    const categoryData = {
      'CAT I': {
        approvedPoams: 0,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 0
      },
      'CAT II': {
        approvedPoams: 0,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 0
      },
      'CAT III': {
        approvedPoams: 0,
        submittedPoams: 0,
        extensionPoams: 0,
        falsePositivePoams: 0,
        pendingApprovalPoams: 0,
        expiredPoams: 0,
        rejectedPoams: 0,
        closedPoams: 0,
        openFindings: 0
      }
    };

    for (const finding of this.findingsData()) {
      const category = severityToCategoryMap[finding.severity] || 'CAT III';

      if (approvedVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].approvedPoams++;
      } else if (submittedVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].submittedPoams++;
      } else if (extensionVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].extensionPoams++;
      } else if (falsePositiveVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].falsePositivePoams++;
      } else if (pendingApprovalVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].pendingApprovalPoams++;
      } else if (expiredVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].expiredPoams++;
      } else if (rejectedVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].rejectedPoams++;
      } else if (closedVulnIdsByCategory[category].has(finding.groupId)) {
        categoryData[category].closedPoams++;
      } else {
        categoryData[category].openFindings++;
      }
    }

    this.catIPieChartData.set(this.createCategoryChartData('CAT I', categoryData['CAT I']));
    this.catIIPieChartData.set(this.createCategoryChartData('CAT II', categoryData['CAT II']));
    this.catIIIPieChartData.set(this.createCategoryChartData('CAT III', categoryData['CAT III']));
  }

  private createCategoryChartData(
    category: string,
    data: {
      approvedPoams: number;
      submittedPoams: number;
      extensionPoams: number;
      falsePositivePoams: number;
      pendingApprovalPoams: number;
      expiredPoams: number;
      rejectedPoams: number;
      closedPoams: number;
      openFindings: number;
    }
  ): any[] {
    const chartData: any[] = [];

    if (data.approvedPoams > 0) {
      chartData.push({
        name: 'Approved',
        value: data.approvedPoams,
        extra: {
          category,
          type: 'approved'
        }
      });
    }

    if (data.submittedPoams > 0) {
      chartData.push({
        name: 'Submitted',
        value: data.submittedPoams,
        extra: {
          category,
          type: 'submitted'
        }
      });
    }

    if (data.extensionPoams > 0) {
      chartData.push({
        name: 'Extension Requested',
        value: data.extensionPoams,
        extra: {
          category,
          type: 'extension'
        }
      });
    }

    if (data.falsePositivePoams > 0) {
      chartData.push({
        name: 'False-Positive',
        value: data.falsePositivePoams,
        extra: {
          category,
          type: 'falsePositive'
        }
      });
    }

    if (data.pendingApprovalPoams > 0) {
      chartData.push({
        name: 'Pending CAT-I Approval',
        value: data.pendingApprovalPoams,
        extra: {
          category,
          type: 'pendingApproval'
        }
      });
    }

    if (data.expiredPoams > 0) {
      chartData.push({
        name: 'Expired',
        value: data.expiredPoams,
        extra: {
          category,
          type: 'expired'
        }
      });
    }

    if (data.rejectedPoams > 0) {
      chartData.push({
        name: 'Rejected',
        value: data.rejectedPoams,
        extra: {
          category,
          type: 'rejected'
        }
      });
    }

    if (data.closedPoams > 0) {
      chartData.push({
        name: 'Closed',
        value: data.closedPoams,
        extra: {
          category,
          type: 'closed'
        }
      });
    }

    if (data.openFindings > 0) {
      chartData.push({
        name: 'Open Findings',
        value: data.openFindings,
        extra: {
          category,
          type: 'open'
        }
      });
    }

    if (chartData.length === 0) {
      chartData.push({
        name: 'No Data',
        value: 1,
        extra: {
          category,
          type: 'empty'
        }
      });
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
