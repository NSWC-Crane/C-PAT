/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, DatePipe, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { add, addDays, format, isAfter } from 'date-fns';
import { Subscription, firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { AssetService } from '../../asset-processing/assets.service';
import { ImportService } from '../../import-processing/import.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { jsonToPlainText } from 'json-to-plain-text';
import { AAPackageService } from '../../admin-processing/aaPackage-processing/aaPackage-processing.service';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { PayloadService } from '../../../common/services/setPayload.service';
import { Menu, MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { PoamAttachmentsComponent } from '../poam-attachments/poam-attachments.component';
import { TagModule } from 'primeng/tag';
import { StepperModule } from 'primeng/stepper';
import { TenableAssetsTableComponent } from '../../import-processing/tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';
import { STIGManagerPoamAssetsTableComponent } from '../../import-processing/stigmanager-import/stigManagerPoamAssetsTable/stigManagerPoamAssetsTable.component';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { InputGroupModule } from 'primeng/inputgroup';
import { AAPackage } from '../../../common/models/aaPackage.model';
import { Permission } from '../../../common/models/permission.model';
import { AssetDeltaService } from '../../admin-processing/asset-delta/asset-delta.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { PoamMitigationGeneratorComponent } from '../poam-mitigation-generator/poam-mitigation-generator.component';

interface AssetData {
  assetName: string;
  dnsName?: string;
  fqdn?: string;
  source: 'CPAT' | 'Tenable' | 'STIG Manager';
}

function calculateScheduledCompletionDate(rawSeverity: string) {
  let daysToAdd: number;
  switch (rawSeverity) {
    case 'CAT I - Critical':
    case 'CAT I - High':
      daysToAdd = 30;
      break;
    case 'CAT II - Medium':
      daysToAdd = 180;
      break;
    case 'CAT III - Low':
    case 'CAT III - Informational':
      daysToAdd = 365;
      break;
    default:
      daysToAdd = 30;
  }

  const currentDate = new Date();
  const scheduledCompletionDate = new Date(currentDate.setDate(currentDate.getDate() + daysToAdd));

  return format(scheduledCompletionDate, 'yyyy-MM-dd');
}

@Component({
  selector: 'cpat-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  standalone: true,
  imports: [
    AccordionModule,
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    DatePicker,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    Select,
    ToggleSwitch,
    InputTextModule,
    InputGroupModule,
    TextareaModule,
    MenuModule,
    StepperModule,
    STIGManagerPoamAssetsTableComponent,
    TableModule,
    TagModule,
    TenableAssetsTableComponent,
    ToastModule,
    TooltipModule,
    PoamAttachmentsComponent,
    PoamMitigationGeneratorComponent,
    ProgressBarModule
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
})
export class PoamDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table: Table;
  @ViewChild('menu') menu!: Menu;
  accessLevel = signal<number>(0);
  loadingTeams = signal<boolean>(false);
  editingMilestoneId = signal<string | null>(null);
  mitigationLoading = signal<boolean>(false);
  aiEnabled: boolean = CPAT.Env.features.aiEnabled;
  assetDeltaList: any;
  externalAssets: AssetData[] = [];
  clonedMilestones: { [s: string]: any } = {};
  collectionAAPackage: any;
  collectionPredisposingConditions: string;
  poamLabels: any[] = [];
  poamAssociatedVulnerabilities: any[] = [];
  labelList: any[] = [];
  errorDialogVisible: boolean = false;
  errorMessage: string = '';
  errorHeader: string = 'Error';
  poam: any;
  poamId: any = '';
  dates: any = {};
  assignedTeamOptions: any;
  collectionUsers: any;
  collectionApprovers: any = [];
  collectionBasicList: any[] = [];
  collectionType: string = '';
  aaPackages: AAPackage[] = [];
  filteredAAPackages: string[] = [];
  poamApprovers: any[] = [];
  poamMilestones: any;
  pluginData: any;
  assets: any = [];
  assetList: any[] = [];
  poamAssets: any[] = [];
  poamAssignedTeams: any[] = [];
  showCheckData: boolean = false;
  stigmanSTIGs: any;
  tenableVulnResponse: any;
  tenablePluginData: string;
  filteredStigmanSTIGs: string[] = [];
  filteredVulnerabilitySources: string[] = [];
  selectedStigTitle: string = '';
  selectedStigObject: any = null;
  selectedStigBenchmarkId: string = '';
  originCollectionId: number;
  stateData: any;
  selectedCollection: any;
  submitDialogVisible: boolean = false;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];
  private subscriptions = new Subscription();
  private subs = new SubSink();

  milestoneStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Complete', value: 'Complete' },
  ];

  vulnerabilitySources: string[] = [
    'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
    'STIG',
  ];

  statusOptions = [
    { label: 'Draft', value: 'Draft', disabled: false },
    { label: 'Closed', value: 'Closed', disabled: false },
    { label: 'Expired', value: 'Expired', disabled: false },
    { label: 'Submitted', value: 'Submitted', disabled: true },
    {
      label: 'Pending CAT-I Approval',
      value: 'Pending CAT-I Approval',
      disabled: true,
    },
    {
      label: 'Extension Requested',
      value: 'Extension Requested',
      disabled: true,
    },
    { label: 'Approved', value: 'Approved', disabled: true },
    { label: 'Rejected', value: 'Rejected', disabled: true },
    { label: 'False-Positive', value: 'False-Positive', disabled: true },
  ];

  severityOptions = [
    { value: 'CAT I - Critical', label: 'CAT I - Critical' },
    { value: 'CAT I - High', label: 'CAT I - High' },
    { value: 'CAT II - Medium', label: 'CAT II - Medium' },
    { value: 'CAT III - Low', label: 'CAT III - Low' },
    { value: 'CAT III - Informational', label: 'CAT III - Informational' },
  ];

  ratingOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  severityToRatingMap: any = {
    'CAT I - Critical': 'Very High',
    'CAT I - High': 'High',
    'CAT II - Medium': 'Moderate',
    'CAT III - Low': 'Low',
    'CAT III - Informational': 'Very Low',
  };

  residualRisk = computed(() => {
    const poamData = this.poam;
    return poamData?.adjSeverity ?
      this.severityToRatingMap[poamData.adjSeverity] :
      poamData?.rawSeverity ?
        this.severityToRatingMap[poamData.rawSeverity] : '';
  });

  likelihood = computed(() => {
    const poamData = this.poam;
    return poamData?.adjSeverity ?
      this.severityToRatingMap[poamData.adjSeverity] :
      poamData?.rawSeverity ?
        this.severityToRatingMap[poamData.rawSeverity] : '';
  });

  menuItems = computed(() => {
    const items: MenuItem[] = [
      {
        label: 'POAM History',
        icon: 'pi pi-history',
        styleClass: 'menu-item-secondary',
        command: () => {
          this.poamLog();
          this.menu?.hide();
        },
      },
      {
        label: 'Request Extension',
        icon: 'pi pi-hourglass',
        styleClass: 'menu-item-warning',
        command: () => {
          this.extendPoam();
          this.menu?.hide();
        },
      }
    ];

    if (this.accessLevel() >= 2) {
      items.push({
        label: 'Submit for Review',
        icon: 'pi pi-file-plus',
        styleClass: 'menu-item-success',
        command: () => {
          this.verifySubmitPoam();
          this.menu?.hide();
        },
      });
    }

    if (this.accessLevel() >= 3) {
      items.push({
        label: 'POAM Approval',
        icon: 'pi pi-verified',
        styleClass: 'menu-item-primary',
        command: () => {
          this.poamApproval();
          this.menu?.hide();
        },
      });
    }

    if (this.accessLevel() >= 4 || (this.poam?.submitterId === this.user?.userId && this.poam?.status === 'Draft')) {
      items.push({
        label: 'Delete POAM',
        icon: 'pi pi-trash',
        styleClass: 'menu-item-danger',
        command: () => {
          this.deletePoam();
          this.menu?.hide();
        },
      });
    }

    return items;
  });


  constructor(
    private assetDeltaService: AssetDeltaService,
    private aaPackageService: AAPackageService,
    private assignedTeamService: AssignedTeamService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router,
    private assetService: AssetService,
    private importService: ImportService,
    private collectionsService: CollectionsService,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService,
    private location: Location
  ) { }

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.stateData = history.state;
      this.poamId = params['poamId'];
    });
    this.subscriptions.add(
      await this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
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
      this.setPayloadService.accessLevel$.subscribe(async level => {
        this.accessLevel.set(level);
        if (this.accessLevel() > 0) {
          this.obtainCollectionData(true);
          this.getData();
        }
      })
    );
  }

  async getData() {
    this.loadAAPackages();
    this.loadAssetDeltaList();
    if (this.poamId === undefined || !this.poamId) {
      return;
    } else if (
      this.poamId === 'ADDPOAM' &&
      this.stateData.vulnerabilitySource ===
      'Assured Compliance Assessment Solution (ACAS) Nessus Scanner'
    ) {
      await this.createNewACASPoam();
      this.loadAssets();
    } else if (this.poamId === 'ADDPOAM' && this.stateData.vulnerabilitySource === 'STIG') {
      await this.createNewSTIGManagerPoam();
      this.loadAssets();
    } else if (this.poamId === 'ADDPOAM') {
      await this.createNewPoam();
      this.loadAssets();
    } else {
      forkJoin([
        this.poamService.getPoam(this.poamId),
        this.collectionsService.getCollectionPermissions(
          this.payload.lastCollectionAccessedId
        ),
        this.poamService.getPoamAssignedTeams(this.poamId),
        this.assignedTeamService.getAssignedTeams(),
        this.poamService.getPoamApprovers(this.poamId),
        this.poamService.getPoamMilestones(this.poamId),
        this.poamService.getPoamLabelsByPoam(this.poamId),
        this.poamService.getPoamAssociatedVulnerabilitiesByPoam(this.poamId),
      ]).subscribe({
        next: ([
          poam,
          users,
          assignedTeams,
          assignedTeamOptions,
          poamApprovers,
          poamMilestones,
          poamLabels,
          poamAssociatedVulnerabilities,
        ]) => {
          this.poam = poam;
          this.dates.scheduledCompletionDate = poam.scheduledCompletionDate
            ? poam.scheduledCompletionDate.split('T')[0]
            : null;
          this.dates.iavComplyByDate = poam.iavComplyByDate
            ? poam.iavComplyByDate.split('T')[0]
            : null;
          this.dates.submittedDate = poam.submittedDate ? poam.submittedDate.split('T')[0] : null;
          this.dates.closedDate = poam.closedDate ? poam.closedDate.split('T')[0] : null;
          this.assignedTeamOptions = assignedTeamOptions;
          this.collectionUsers = users;
          this.poamAssignedTeams = assignedTeams;
          this.poamApprovers = poamApprovers;
          this.poamMilestones = poamMilestones.poamMilestones.map((milestone: any) => ({
            ...milestone,
            milestoneDate: milestone.milestoneDate ? milestone.milestoneDate.split('T')[0] : null,
            assignedTeamId: +milestone.assignedTeamId
          }));
          this.selectedStigTitle = this.poam.vulnerabilityTitle;
          this.selectedStigBenchmarkId = this.poam.stigBenchmarkId;
          this.collectionApprovers = this.collectionUsers.filter(
            (user: Permission) => user.accessLevel >= 3
          );
          this.getLabelData();
          if (
            this.collectionApprovers.length > 0 &&
            (this.poamApprovers == undefined || this.poamApprovers.length == 0)
          ) {
            this.addDefaultApprovers();
          }

          if (this.poam.tenablePluginData) {
            this.parsePluginData(this.poam.tenablePluginData);
          }

          this.poamLabels = poamLabels;
          this.poamAssociatedVulnerabilities = poamAssociatedVulnerabilities;
          this.loadAssets();
        },
        error: (error) => {
          console.error('Error loading POAM data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load POAM data'
          });
        }
      });
    }
  }

  private loadAssets() {
    this.loadingTeams.set(true);
    if (this.collectionType === 'C-PAT') {
      this.fetchAssets();
      this.loadingTeams.set(false);
    }
    else if (this.collectionType === 'STIG Manager' && this.originCollectionId && this.poam.vulnerabilityId && this.poam.stigBenchmarkId) {
      forkJoin({
        poamAssets: this.sharedService.getPOAMAssetsFromSTIGMAN(
          this.originCollectionId,
          this.poam.stigBenchmarkId
        ),
        assetDetails: this.sharedService.getAssetDetailsFromSTIGMAN(this.originCollectionId)
      }).subscribe({
        next: ({ poamAssets, assetDetails }) => {
          const matchingItem = poamAssets.find(item => item.groupId === this.poam.vulnerabilityId);
          if (!matchingItem) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `No assets found with vulnerabilityId: ${this.poam.vulnerabilityId}`
            });
            this.loadingTeams.set(false);
            return;
          }

          const standardizedAssets: AssetData[] = matchingItem.assets.map((asset: any) => {
            const details = assetDetails.find(detail => detail.assetId === asset.assetId);
            return {
              assetName: asset.name,
              fqdn: details?.fqdn || undefined,
              source: 'STIG Manager' as const
            };
          });

          this.externalAssets = standardizedAssets;
          this.compareAssetsAndAssignTeams();
          this.loadingTeams.set(false);
        },
        error: (error) => {
          console.error('Error loading STIG Manager assets:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load STIG Manager assets'
          });
          this.loadingTeams.set(false);
        },
        complete: () => {
          this.loadingTeams.set(false);
        }
      });
    }
    else if (this.collectionType === 'Tenable' && this.originCollectionId && this.poam.vulnerabilityId) {
      const analysisParams = {
        query: {
          description: '',
          context: '',
          status: -1,
          createdTime: 0,
          modifiedTime: 0,
          groups: [],
          type: 'vuln',
          tool: 'listvuln',
          sourceType: 'cumulative',
          startOffset: 0,
          endOffset: 5000,
          filters: [
            {
              id: 'pluginID',
              filterName: 'pluginID',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: this.poam.vulnerabilityId,
            },
            {
              id: 'repository',
              filterName: 'repository',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: [{ id: this.originCollectionId.toString() }],
            },
          ],
          vulnTool: 'listvuln',
        },
        sourceType: 'cumulative',
        columns: [],
        type: 'vuln',
      };

      this.importService.postTenableAnalysis(analysisParams).subscribe({
        next: (data) => {
          if (!data?.response?.results) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No assets found for this vulnerability'
            });
            this.loadingTeams.set(false);
            return;
          }

          const standardizedAssets: AssetData[] = data.response.results.map((asset: any) => ({
            assetName: asset.netbiosName || '',
            dnsName: asset.dnsName || '',
            source: 'Tenable' as const
          }));

          this.externalAssets = standardizedAssets;
          this.compareAssetsAndAssignTeams();
          this.loadingTeams.set(false);
        },
        error: (error) => {
          console.error('Error loading Tenable assets:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load Tenable assets'
          });
          this.loadingTeams.set(false);
        },
        complete: () => {
          this.loadingTeams.set(false);
        }
      });
    }
    else {
      this.loadingTeams.set(false);
    }
  }

  loadAssetDeltaList() {
    this.assetDeltaService.getAssetDeltaList().subscribe({
      next: (response) => {
        this.assetDeltaList = response || [];
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load Asset Delta List'
      })
    });
  }

  async compareAssetsAndAssignTeams() {
    if (!this.assetDeltaList?.assets) return;
    if (this.collectionType === 'C-PAT' && (!this.poamAssets || this.poamAssets.length === 0)) return;
    if ((this.collectionType === 'STIG Manager' || this.collectionType === 'Tenable') &&
      (!this.externalAssets || this.externalAssets.length === 0)) return;

    const newTeamsToAdd = new Set<any>();
    const assetsToCheck = this.collectionType === 'C-PAT' ?
      this.poamAssets.map(asset => ({
        assetName: this.getAssetName(asset.assetId),
        source: 'CPAT' as const
      })) :
      this.externalAssets;

    const teamsWithAssets = new Set<number>();

    assetsToCheck.forEach(asset => {
      this.assetDeltaList.assets.forEach(deltaAsset => {
        const assetName = asset.assetName?.toLowerCase() || '';
        const deltaKey = deltaAsset.key.toLowerCase();

        let assetMatchesRule = false;

        if (asset.source === 'STIG Manager' && assetName === deltaKey) {
          assetMatchesRule = true;
        }
        else if (asset.source === 'Tenable' &&
          (asset.dnsName?.toLowerCase().includes(deltaKey) ||
            assetName.includes(deltaKey))) {
          assetMatchesRule = true;
        }
        else if (asset.source === 'CPAT' && assetName === deltaKey) {
          assetMatchesRule = true;
        }

        if (assetMatchesRule) {
          if (deltaAsset.assignedTeams && Array.isArray(deltaAsset.assignedTeams)) {
            deltaAsset.assignedTeams.forEach(team => {
              newTeamsToAdd.add(team);
              teamsWithAssets.add(team.assignedTeamId);
            });
          }
          else if (deltaAsset.assignedTeam) {
            newTeamsToAdd.add(deltaAsset.assignedTeam);
            teamsWithAssets.add(deltaAsset.assignedTeam.assignedTeamId);
          }
        }
      });
    });

    if (this.poam.poamId === 'ADDPOAM') {
      this.poam.poamId = 0;
      await firstValueFrom(
        this.poamService.postPoam(this.poam).pipe(
          tap({
            next: (res) => {
              if (!res.poamId) {
                throw new Error('Failed to save POAM');
              }
              this.poam.poamId = res.poamId;
            },
            error: (error) => {
              console.error('Error saving POAM:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save POAM before adding teams'
              });
            }
          })
        )
      ).catch(() => {
        return;
      });
    }

    if (this.poam.poamId && this.poam.poamId !== 'ADDPOAM') {
      for (const team of newTeamsToAdd) {
        const teamAlreadyAssigned = this.poamAssignedTeams.some(
          assignedTeam => assignedTeam.assignedTeamId === team.assignedTeamId
        );

        if (!teamAlreadyAssigned) {
          const newTeam = {
            poamId: +this.poam.poamId,
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            isNew: false,
            automated: true
          };

          try {
            await firstValueFrom(
              this.poamService.postPoamAssignedTeam({
                poamId: +this.poam.poamId,
                assignedTeamId: +team.assignedTeamId,
                automated: true
              })
            );
            this.poamAssignedTeams = [newTeam, ...this.poamAssignedTeams];
          } catch (error) {
            console.error('Error adding team:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to add team ${team.assignedTeamName}`
            });
          }
        }
      }

      const teamsToRemove = this.poamAssignedTeams.filter(team =>
        team.automated && !teamsWithAssets.has(team.assignedTeamId)
      );

      for (const team of teamsToRemove) {
        try {
          await firstValueFrom(
            this.poamService.deletePoamAssignedTeam(+this.poam.poamId, team.assignedTeamId)
          );

          this.poamAssignedTeams = this.poamAssignedTeams.filter(
            assignedTeam => assignedTeam.assignedTeamId !== team.assignedTeamId
          );

          this.messageService.add({
            severity: 'info',
            summary: 'Team Removed',
            detail: `Automated team ${team.assignedTeamName} was removed as it no longer has assets on this POAM`
          });
        } catch (error) {
          console.error('Error removing team:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to remove team ${team.assignedTeamName}`
          });
        }
      }
    }
  }

  private loadVulnerability(pluginId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const analysisParams = {
        query: {
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
          endOffset: 50,
          filters: [
            {
              id: 'pluginID',
              filterName: 'pluginID',
              operator: '=',
              type: 'vuln',
              isPredefined: true,
              value: pluginId,
            },
          ],
          sortColumn: 'severity',
          sortDirection: 'desc',
          vulnTool: 'sumid',
        },
        sourceType: 'cumulative',
        sortField: 'severity',
        sortOrder: 'desc',
        columns: [],
        type: 'vuln',
      };

      this.importService.postTenableAnalysis(analysisParams).subscribe({
        next: (data) => {
          if (!data.error_msg) {
            this.tenableVulnResponse = data.response.results[0];
            resolve();
          } else {
            reject(new Error('Error in vulnerability data'));
          }
        },
        error: (error) => {
          console.error('Error fetching Vulnerabilities:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch vulnerability data'
          });
          reject(error);
        }
      });
    });
  }

  async createNewACASPoam(): Promise<void> {
    try {
      this.pluginData = this.stateData.pluginData;
      await this.loadVulnerability(this.pluginData.id);
      const mappedSeverity = this.mapTenableSeverity(this.tenableVulnResponse?.severity?.id);
      const [users, assignedTeamOptions] = await firstValueFrom(forkJoin([
        this.collectionsService.getCollectionPermissions(this.payload.lastCollectionAccessedId),
        this.assignedTeamService.getAssignedTeams()
      ]));

      const currentDate = new Date();
      this.poam = {
        poamId: 'ADDPOAM',
        collectionId: this.payload.lastCollectionAccessedId,
        vulnerabilitySource: 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
        aaPackage: this.collectionAAPackage ?? '',
        predisposingConditions: this.collectionPredisposingConditions ?? '',
        iavmNumber: this.stateData.iavNumber ?? '',
        iavComplyByDate: this.stateData.iavComplyByDate
          ? format(new Date(this.stateData.iavComplyByDate), 'yyyy-MM-dd')
          : null,
        submittedDate: format(currentDate, 'yyyy-MM-dd'),
        vulnerabilityId: this.pluginData.id ?? '',
        vulnerabilityTitle: this.pluginData.name ?? '',
        description: `Title:
${this.pluginData.name ?? ''}
Description:
${this.pluginData.description ?? ''}`,
        rawSeverity: mappedSeverity,
        adjSeverity: mappedSeverity,
        submitterId: this.payload.userId,
        status: 'Draft',
        tenablePluginData: this.pluginData ? JSON.stringify(this.pluginData) : '',
        hqs: false,
      };

      this.assignedTeamOptions = assignedTeamOptions;
      this.poam.scheduledCompletionDate = calculateScheduledCompletionDate(this.poam.rawSeverity);
      this.dates.scheduledCompletionDate = new Date(this.poam.scheduledCompletionDate);
      this.poam.residualRisk = this.mapToEmassValues(this.poam.rawSeverity);
      this.poam.likelihood = this.mapToEmassValues(this.poam.rawSeverity);
      this.dates.iavComplyByDate = this.poam.iavComplyByDate
        ? new Date(this.poam.iavComplyByDate)
        : null;
      this.dates.submittedDate = new Date(this.poam.submittedDate);
      this.collectionUsers = users;
      this.collectionApprovers = this.collectionUsers.filter(
        (user: Permission) => user.accessLevel >= 3
      );
      this.poamApprovers = this.collectionApprovers.map((approver: any) => ({
        userId: approver.userId,
        approvalStatus: 'Not Reviewed',
        comments: '',
      }));

      if (this.poam.tenablePluginData) {
        this.parsePluginData(this.poam.tenablePluginData);
      }
    } catch (error) {
      console.error('Error in createNewACASPoam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create new POAM'
      });
    }
  }

  private parsePluginData(pluginData: string) {
    try {
      let dataObject: any;

      if (typeof pluginData === 'string') {
        dataObject = JSON.parse(pluginData);
      } else if (typeof pluginData === 'object') {
        dataObject = pluginData;
      } else {
        throw new Error('Invalid plugin data format');
      }

      this.tenablePluginData = jsonToPlainText(dataObject, {});
    } catch (error) {
      this.tenablePluginData = this.poam.tenablePluginData;
    }
  }

  mapTenableSeverity(severity: string) {
    switch (severity) {
      case '0':
        return 'CAT III - Informational';
      case '1':
        return 'CAT III - Low';
      case '2':
        return 'CAT II - Medium';
      case '3':
        return 'CAT I - High';
      case '4':
        return 'CAT I - Critical';
      default:
        return '';
    }
  }

  mapToEmassValues(severity: string) {
    switch (severity) {
      case 'CAT III - Informational':
      case 'CAT III - Low':
        return 'Low';
      case 'CAT II - Medium':
        return 'Moderate';
      case 'CAT I - High':
      case 'CAT I - Critical':
        return 'High';
      default:
        return '';
    }
  }

  async createNewSTIGManagerPoam(): Promise<void> {
    return new Promise((resolve, reject) => {
      forkJoin([
        this.collectionsService.getCollectionPermissions(this.payload.lastCollectionAccessedId),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([users, assignedTeamOptions]) => {
          const currentDate = new Date();
          this.poam = {
            poamId: 'ADDPOAM',
            collectionId: this.payload.lastCollectionAccessedId,
            vulnerabilitySource: this.stateData.vulnerabilitySource ?? '',
            aaPackage: this.collectionAAPackage ?? '',
            predisposingConditions: this.collectionPredisposingConditions ?? '',
            vulnerabilityId: this.stateData.vulnerabilityId ?? '',
            description: this.stateData.description ?? '',
            rawSeverity: this.stateData.severity ?? '',
            adjSeverity: this.stateData.severity ?? '',
            residualRisk: this.mapToEmassValues(this.stateData.severity),
            likelihood: this.mapToEmassValues(this.stateData.severity),
            submitterId: this.payload.userId,
            status: 'Draft',
            submittedDate: format(currentDate, 'yyyy-MM-dd'),
            hqs: false
          };

          this.poam.scheduledCompletionDate = calculateScheduledCompletionDate(this.poam.rawSeverity);
          this.dates.scheduledCompletionDate = new Date(this.poam.scheduledCompletionDate);
          this.dates.iavComplyByDate = null;
          this.dates.submittedDate = new Date(this.poam.submittedDate);
          this.assignedTeamOptions = assignedTeamOptions;
          this.collectionUsers = users;
          this.collectionApprovers = this.collectionUsers.filter(
            (user: Permission) => user.accessLevel >= 3
          );
          this.poamApprovers = this.collectionApprovers.map((approver: any) => ({
            userId: approver.userId,
            approvalStatus: 'Not Reviewed',
            comments: ''
          }));

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: data => {
              this.stigmanSTIGs = data.map((stig: any) => ({
                title: stig.title,
                benchmarkId: stig.benchmarkId,
                lastRevisionStr: stig.lastRevisionStr,
                lastRevisionDate: stig.lastRevisionDate
              }));

              if (!data || data.length === 0) {
                console.warn('Unable to retrieve list of current STIGs from STIGMAN.');
              }

              this.poam.vulnerabilitySource = this.stateData.vulnerabilitySource;
              this.poam.vulnerabilityId = this.stateData.vulnerabilityId;
              this.poam.rawSeverity = this.stateData.severity;
              this.poam.stigCheckData = this.stateData.ruleData;
              this.poam.stigBenchmarkId = this.stateData.benchmarkId;

              const selectedStig = this.stigmanSTIGs.find(
                (stig: any) => stig.benchmarkId === this.poam.stigBenchmarkId
              );

              if (selectedStig) {
                this.selectedStigObject = selectedStig;
                this.selectedStigTitle = selectedStig.title;
                this.poam.vulnerabilityName = selectedStig.title;
                this.onStigSelected(selectedStig);
              } else {
                this.poam.vulnerabilityName = this.poam.stigBenchmarkId;
              }
              resolve();
            },
            error: (error) => {
              console.error('Error loading STIGs:', error);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load required data'
          });
          reject(error);
        }
      });
    });
  }

  async createNewPoam(): Promise<void> {
    return new Promise((resolve, reject) => {
      forkJoin([
        this.collectionsService.getCollectionPermissions(this.payload.lastCollectionAccessedId),
        this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([users, collectionAssets, assignedTeamOptions]) => {
          const currentDate = new Date();
          const dateIn30Days = add(currentDate, { days: 30 });

          this.poam = {
            poamId: 'ADDPOAM',
            collectionId: this.payload.lastCollectionAccessedId,
            vulnerabilitySource: '',
            aaPackage: this.collectionAAPackage ?? '',
            predisposingConditions: this.collectionPredisposingConditions ?? '',
            vulnerabilityId: '',
            description: '',
            rawSeverity: '',
            submitterId: this.payload.userId,
            status: 'Draft',
            submittedDate: format(currentDate, 'yyyy-MM-dd'),
            scheduledCompletionDate: format(dateIn30Days, 'yyyy-MM-dd'),
            hqs: false
          };

          this.dates.scheduledCompletionDate = new Date(this.poam.scheduledCompletionDate);
          this.dates.iavComplyByDate = null;
          this.dates.submittedDate = new Date(this.poam.submittedDate);
          this.assignedTeamOptions = assignedTeamOptions;
          this.collectionUsers = users;
          this.assets = collectionAssets;

          this.collectionApprovers = this.collectionUsers.filter(
            (user: Permission) => user.accessLevel >= 3
          );

          this.poamApprovers = this.collectionApprovers.map((approver: any) => ({
            userId: approver.userId,
            approvalStatus: 'Not Reviewed',
            comments: ''
          }));

          this.sharedService.getSTIGsFromSTIGMAN().subscribe({
            next: data => {
              this.stigmanSTIGs = data.map((stig: any) => ({
                title: stig.title,
                benchmarkId: stig.benchmarkId,
                lastRevisionStr: stig.lastRevisionStr,
                lastRevisionDate: stig.lastRevisionDate
              }));

              if (!data || data.length === 0) {
                console.warn('Unable to retrieve list of current STIGs from STIGMAN.');
              }
              resolve();
            },
            error: (error) => {
              console.error('Error loading STIGs:', error);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load required data'
          });
          reject(error);
        }
      });
    });
  }

  getLabelData() {
    this.poamService.getLabels(this.selectedCollection).subscribe({
      next: (labels: any) => {
        this.labelList = labels;
      },
      error: (error) => {
        console.error('Error fetching labels:', error);
      }
    });
  }

  getPoamLabels() {
    this.poamService.getPoamLabelsByPoam(this.poamId).subscribe({
      next: (poamLabels: any) => {
        this.poamLabels = poamLabels;
      },
      error: (error) => {
        console.error('Error fetching POAM labels:', error);
      }
    });
  }

  async addLabel() {
    if (this.poam.poamId === 'ADDPOAM') {
      await this.savePoam(true);
    }
    const newLabel = {
      poamId: this.poam.poamId,
      labelId: null,
      isNew: true,
    };
    this.poamLabels = [newLabel, ...this.poamLabels];
  }

  async onLabelChange(label: any, rowIndex: number) {
    if (label.labelId) {
      await this.confirmCreateLabel(label);
      label.isNew = false;
    } else {
      this.poamLabels.splice(rowIndex, 1);
    }
  }

  async deleteLabel(label: any, rowIndex: number) {
    if (label.labelId) {
      await this.confirmDeleteLabel(label);
    } else {
      this.poamLabels.splice(rowIndex, 1);
    }
  }

  confirmCreateLabel(event: any) {
    if (event.labelId) {
      const poamLabel = {
        poamId: +this.poam.poamId,
        labelId: +event.labelId,
      };
      this.poamService.postPoamLabel(poamLabel).pipe(
        tap({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Label added successfully.',
            });
            this.getPoamLabels();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to add label.',
            });
          }
        })
      ).subscribe();
    }
  }

  confirmDeleteLabel(event: any) {
    if (this.poam.poamId === 'ADDPOAM') {
      return;
    }
    this.poamService.deletePoamLabel(+event.poamId, +event.labelId).pipe(
      tap({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Label deleted successfully.',
          });
          this.poamLabels = this.poamLabels.filter(l => l.labelId !== event.labelId);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete label.',
          });
        }
      })
    ).subscribe();
  }

  getPoamAssociatedVulnerabilities() {
    this.poamService.getPoamAssociatedVulnerabilitiesByPoam(this.poamId).subscribe({
      next: (poamAssociatedVulnerabilities: any) => {
        this.poamAssociatedVulnerabilities = poamAssociatedVulnerabilities;
      },
      error: (error) => {
        console.error('Error fetching associated vulnerabilities:', error);
      }
    });
  }

  async addAssociatedVulnerability() {
    if (this.poam.poamId === 'ADDPOAM') {
      await this.savePoam(true);
    }
    const newAssociatedVulnerability = {
      poamId: this.poam.poamId,
      associatedVulnerability: null,
      isNew: true,
    };
    this.poamAssociatedVulnerabilities = [
      newAssociatedVulnerability,
      ...this.poamAssociatedVulnerabilities,
    ];
  }

  async onAssociatedVulnerabilityChange(associatedVulnerability: any, rowIndex: number) {
    if (associatedVulnerability.associatedVulnerability) {
      await this.postAssociatedVulnerability(associatedVulnerability);
      associatedVulnerability.isNew = false;
    } else {
      this.poamAssociatedVulnerabilities.splice(rowIndex, 1);
    }
  }

  postAssociatedVulnerability(event: any) {
    if (event.associatedVulnerability) {
      const poamAssociatedVulnerability = {
        poamId: +this.poam.poamId,
        associatedVulnerability: event.associatedVulnerability,
      };

      this.poamService.postPoamAssociatedVulnerability(poamAssociatedVulnerability).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Associated Vulnerability added successfully.',
          });
          this.getPoamAssociatedVulnerabilities();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add associated vulnerability.',
          });
        }
      });
    }
  }

  async deleteAssociatedVulnerability(associatedVulnerability: any, rowIndex: number) {
    if (associatedVulnerability.associatedVulnerability) {
      await this.confirmDeleteAssociatedVulnerability(associatedVulnerability);
    } else {
      this.poamAssociatedVulnerabilities.splice(rowIndex, 1);
    }
  }

  confirmDeleteAssociatedVulnerability(event: any) {
    if (this.poam.poamId === 'ADDPOAM') {
      return;
    }

    this.poamService.deletePoamAssociatedVulnerability(+event.poamId, event.associatedVulnerability)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Associated Vulnerability deleted successfully.',
          });
          this.poamAssociatedVulnerabilities = this.poamAssociatedVulnerabilities
            .filter(a => a.associatedVulnerability !== event.associatedVulnerability);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete associated vulnerability.',
          });
        }
      });
  }

  async addDefaultApprovers() {
    this.collectionApprovers.forEach((collectionApprover: any) => {
      const approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed',
      };

      this.poamService.addPoamApprover(approver).subscribe({
        next: () => {
          approver.fullName = collectionApprover.fullName;
          approver.firstName = collectionApprover.firstName;
          approver.lastName = collectionApprover.lastName;
          approver.email = collectionApprover.email;

          if (approver) {
            this.poamApprovers.push(approver);
            this.poamApprovers = [...this.poamApprovers];
          }
        },
        error: (error) => {
          console.error('Error adding approver:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add approver'
          });
        }
      });
    });
  }

  async approvePoam() {
    await this.router.navigateByUrl('/poam-processing/poam-approve/' + this.poam.poamId);
  }

  extendPoam() {
    if (this.poam.poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'You may not extend POAM until after it has been saved.',
      });
      return;
    }
    this.router.navigate(['/poam-processing/poam-extend', this.poam.poamId]);
  }

  poamApproval() {
    if (this.poam.poamId === 'ADDPOAM') {
      this.savePoam(true);
    }
    if (this.poam.status === 'Draft') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail:
          "The POAM is currently in 'Draft' status. Approvals can not be entered until after a POAM has been submitted.",
      });
      return;
    }
    this.router.navigate(['/poam-processing/poam-approve', this.poam.poamId]);
  }

  poamLog() {
    if (this.poam.poamId === 'ADDPOAM') {
      this.savePoam(true);
    }
    this.router.navigate(['/poam-processing/poam-log', this.poam.poamId]);
  }

  savePoam(quiet: boolean = false) {
    if (!this.validateData()) return;
    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate
      ? format(this.dates.scheduledCompletionDate, 'yyyy-MM-dd')
      : null;
    this.poam.submittedDate = this.dates.submittedDate
      ? format(this.dates.submittedDate, 'yyyy-MM-dd')
      : null;
    this.poam.iavComplyByDate = this.dates.iavComplyByDate
      ? format(this.dates.iavComplyByDate, 'yyyy-MM-dd')
      : null;
    this.poam.requiredResources = this.poam.requiredResources ? this.poam.requiredResources : '';
    if (this.poam.status === 'Closed') {
      this.poam.closedDate = format(new Date(), 'yyyy-MM-dd');
    } else {
      this.poam.closedDate = null;
    }

    if (this.poam.poamId === 'ADDPOAM') {
      this.poam.poamId = 0;
      const assignedTeams: any[] = [];
      const assets: any[] = [];

      if (this.poamAssignedTeams) {
        this.poamAssignedTeams.forEach((team: any) => {
          assignedTeams.push({ assignedTeamId: +team.assignedTeamId });
        });
      }
      this.poam.assignedTeams = assignedTeams;

      if (this.poamAssets) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetName: asset.assetName });
        });
        this.poam.assets = assets;
      }

      if (this.collectionApprovers) {
        this.poam.approvers = this.poamApprovers.map((approver: any) => ({
          userId: approver.userId,
          approvalStatus: approver.approvalStatus,
          comments: approver.comments,
        }));
      }

      this.poamService.postPoam(this.poam).subscribe({
        next: (res) => {
          if (res.null || (res.null == 'null' && !quiet)) {
            this.messageService.add({
              severity: 'error',
              summary: 'Information',
              detail: 'Unexpected error adding POAM'
            });
          } else {
            this.poam.poamId = res.poamId;
            if (!quiet) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Added POAM: ${res.poamId}`
              });
            }
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Information',
            detail: 'Unexpected error, please try again.'
          });
          console.error('Error saving POAM:', error);
        }
      });
    } else {
      const assets: any[] = [];
      this.poamAssets.forEach((asset: any) => {
        assets.push({ assetName: asset.assetName });
      });
      this.poam.assets = assets;

      this.poamService.updatePoam(this.poam).subscribe({
        next: (data) => {
          this.poam = data;
          if (!quiet) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'POAM successfully updated'
            });
          }
        },
        error: (error) => {
          console.error('Error updating POAM:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update POAM'
          });
        }
      });
    }
  }

  onStigSelected(event: any) {
    let selectedStig;
    if (typeof event === 'string') {
      selectedStig = this.stigmanSTIGs.find((stig: any) => stig.title === event);
    } else {
      selectedStig = event;
    }
    if (selectedStig) {
      this.selectedStigTitle = selectedStig.title;
      this.selectedStigBenchmarkId = selectedStig.benchmarkId;
      this.poam.stigBenchmarkId = this.selectedStigBenchmarkId;
      this.poam.vulnerabilityTitle = (() => {
        const [version, release] = selectedStig.lastRevisionStr?.match(/\d+/g) || [];
        const formattedRevision =
          version && release
            ? `Version ${version}, Release: ${release}`
            : selectedStig.lastRevisionStr;

        return `${selectedStig.title} :: ${formattedRevision} Benchmark Date: ${selectedStig.lastRevisionDate}`;
      })();
    }
  }

  onMitigationGenerated(mitigation: string) {
    this.poam.mitigations = mitigation;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Mitigation content saved to POAM'
    });
  }

  obtainCollectionData(background: boolean = false) {
    this.collectionsService.getCollectionBasicList()
      .pipe(
        catchError(err => {
          console.error('Failed to fetch basic collection list:', err);
          return of([]);
        })
      )
      .subscribe({
        next: (basicListData) => {
          const currentCollection = basicListData.find(
            collection => +collection.collectionId === this.selectedCollection
          );

          if (!currentCollection) {
            if (!background) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Information',
                detail:
                  'Unable to find the selected collection. Please ensure that you are creating the POAM in the correct collection.',
              });
            }
            return;
          }

          this.collectionAAPackage = currentCollection.aaPackage;
          this.collectionPredisposingConditions = currentCollection.predisposingConditions;
          this.collectionType = currentCollection.collectionOrigin
            ? currentCollection.collectionOrigin
            : 'C-PAT';
          if (
            currentCollection.collectionOrigin === 'STIG Manager' ||
            currentCollection.collectionOrigin === 'Tenable'
          ) {
            this.originCollectionId = currentCollection.originCollectionId;
          } else {
            this.originCollectionId = undefined;
          }

          if (!this.originCollectionId && !background) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Information',
              detail:
                'This collection is not associated with a STIG Manager collection. Asset association may not be available.',
            });
          }
        },
        error: (error) => {
          console.error('Error fetching collection data:', error);
          if (!background) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to fetch collection data'
            });
          }
        }
      });
  }

  verifySubmitPoam() {
    if (!this.poamMilestones || this.poamMilestones?.milestoneComments < 1) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'A minimum of 1 POAM milestone is required before a POAM can be submitted for review.',
      });
    } else if (this.poamMilestones[0]?.milestoneComments?.length < 15) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'A milestone comment has a 15 character count minimum to satisfy the requirement for POAM submission.',
      });
    } else {
      this.submitDialogVisible = true;
    }
  }

  async confirmSubmit() {
    this.savePoam(true);
    if (!this.poamMilestones || this.poamMilestones.length < 1) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'A minimum of 1 POAM milestone is required before a POAM can be submitted for review.',
      });
      return;
    }

    if (this.poamMilestones[0].milestoneComments.length < 15) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'A milestone comment has a 15 character count minimum to satisfy the POAM milestone requirement for POAM submission.',
      });
      return;
    }
    this.poam.status = 'Submitted';
    this.poam.iavComplyByDate = this.dates.iavComplyByDate
      ? format(this.dates.iavComplyByDate, 'yyyy-MM-dd')
      : null;
    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate
      ? format(this.dates.scheduledCompletionDate, 'yyyy-MM-dd')
      : null;
    this.poam.submittedDate = this.dates.submittedDate
      ? format(this.dates.submittedDate, 'yyyy-MM-dd')
      : null;
    await this.savePoam();
    this.submitDialogVisible = false;
    this.router.navigate(['/poam-processing/poam-manage']);
  }

  cancelSubmit() {
    this.submitDialogVisible = false;
  }

  validateData() {
    if (!this.poam.description) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'Description is a required field',
      });
      return false;
    }
    if (!this.poam.status) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'POAM Status is a required field',
      });
      return false;
    }
    if (!this.poam.aaPackage) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'A&A Package is a required field',
      });
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'Vulnerability Source is a required field',
      });
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'Raw Severity is a required field',
      });
      return false;
    }
    if (!this.poam.submitterId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'POAM Submitter is a required field',
      });
      return false;
    }
    if (!this.dates.scheduledCompletionDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'Scheduled Completion Date is a required field',
      });
      return false;
    }
    if (this.isIavmNumberValid(this.poam.iavmNumber) && !this.dates.iavComplyByDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'IAV Comply By Date is required if an IAVM Number is provided.',
      });
      return false;
    }
    if (
      this.poam.adjSeverity &&
      this.poam.adjSeverity != this.poam.rawSeverity &&
      !this.poam.mitigations
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'If Adjusted Severity deviates from the Raw Severity, Mitigations becomes a required field.',
      });
      return false;
    }
    if (
      this.poam.localImpact === 'Moderate' ||
      this.poam.localImpact === 'High' ||
      (this.poam.localImpact === 'Very High' && this.poam.impactDescription.length < 1)
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail:
          'If Local Impact is Moderate or higher, Impact Description becomes a required field.',
      });
      return false;
    }
    return true;
  }

  cancelPoam() {
    this.location.back();
  }

  isIavmNumberValid(iavmNumber: string): boolean {
    return /^\d{4}-[A-Za-z]-\d{4}$/.test(iavmNumber);
  }

  onAddNewMilestone() {
    if (this.poam.poamId === 'ADDPOAM') {
      this.savePoam(true);
    }
    if (!Array.isArray(this.poamMilestones)) {
      this.poamMilestones = [];
    }

    const tempId = this.generateTempId();
    const newMilestone = {
      milestoneId: tempId,
      milestoneComments: null,
      milestoneDate: new Date(),
      milestoneStatus: 'Pending',
      assignedTeamId: null,
      isNew: true,
      editing: true,
    };

    this.poamMilestones = [newMilestone, ...this.poamMilestones];
    this.editingMilestoneId.set(tempId);
    this.clonedMilestones[tempId] = { ...newMilestone };

    setTimeout(() => {
      if (this.table) {
        this.table.initRowEdit(newMilestone);
      }
    });

    this.cdr.detectChanges();
  }

  getTeamName(teamId: number): string {
    if (!teamId || !this.assignedTeamOptions?.length) return '';
    const team = this.assignedTeamOptions.find(t => t.assignedTeamId === teamId);
    return team ? team.assignedTeamName : '';
  }

  onRowEditInit(milestone: any) {
    milestone.editing = true;
    this.editingMilestoneId.set(milestone.milestoneId);
    this.clonedMilestones[milestone.milestoneId] = { ...milestone };
  }

  async onRowEditSave(milestone: any) {
    if (!this.validateMilestoneFields(milestone) || !this.validateMilestoneDate(milestone)) {
      return;
    }

    try {
      if (milestone.isNew) {
        await this.addNewMilestone(milestone);
      } else {
        await this.updateExistingMilestone(milestone);
      }
      milestone.editing = false;
      this.editingMilestoneId.set(null);
      delete this.clonedMilestones[milestone.milestoneId];

      if (this.table) {
        this.table.cancelRowEdit(milestone);
      }
    } catch (error) {
      return;
    }
  }

  onRowEditCancel(milestone: any, index: number) {
    if (milestone.isNew) {
      this.poamMilestones.splice(index, 1);
    } else if (this.clonedMilestones[milestone.milestoneId]) {
      this.poamMilestones[index] = this.clonedMilestones[milestone.milestoneId];
      delete this.clonedMilestones[milestone.milestoneId];
    }
    milestone.editing = false;
    this.editingMilestoneId.set(null);
  }

  private generateTempId(): string {
    return 'temp_' + new Date().getTime();
  }

  private validateMilestoneFields(milestone: any): boolean {
    const requiredFields = [
      { field: 'milestoneComments', message: 'Milestone Comments is a required field.' },
      { field: 'milestoneDate', message: 'Milestone Date is a required field.' },
      { field: 'milestoneStatus', message: 'Milestone Status is a required field.' },
      { field: 'assignedTeamId', message: 'Milestone Team is a required field.' },
    ];

    for (const { field, message } of requiredFields) {
      if (!milestone[field]) {
        this.messageService.add({
          severity: 'error',
          summary: 'Information',
          detail: message,
        });
        return false;
      }
    }

    return true;
  }

  private validateMilestoneDate(milestone: any): boolean {
    const milestoneDate = format(milestone.milestoneDate, 'yyyy-MM-dd');
    const scheduledCompletionDate = this.dates.scheduledCompletionDate;
    const extensionTimeAllowed = this.poam.extensionTimeAllowed;

    if (extensionTimeAllowed === 0 || extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Information',
          detail: 'The Milestone date provided exceeds the POAM scheduled completion date.',
        });
        return false;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, extensionTimeAllowed);
      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Information',
          detail:
            'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.',
        });
        return false;
      }
    }

    return true;
  }

  addNewMilestone(milestone: any) {
    const newMilestone = {
      milestoneDate: format(milestone.milestoneDate, 'yyyy-MM-dd'),
      milestoneComments: milestone.milestoneComments || null,
      milestoneStatus: milestone.milestoneStatus || 'Pending',
      assignedTeamId: milestone.assignedTeamId || null,
    };

    this.poamService.addPoamMilestone(this.poam.poamId, newMilestone).subscribe({
      next: (res: any) => {
        if (res.null) {
          this.messageService.add({
            severity: 'error',
            summary: 'Information',
            detail: 'Unable to insert row, please validate entry and try again.'
          });
          return;
        } else {
          milestone.milestoneId = res.milestoneId;
          milestone.isNew = false;
          milestone.editing = false;
          this.editingMilestoneId.set(null);
          this.getData();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Milestone added successfully.'
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add milestone.'
        });
        console.error('Error adding milestone:', error);
      }
    });
  }

  private async updateExistingMilestone(milestone: any) {
    const milestoneUpdate = {
      ...(milestone.milestoneDate && {
        milestoneDate: format(milestone.milestoneDate, 'yyyy-MM-dd'),
      }),
      ...(milestone.milestoneComments && { milestoneComments: milestone.milestoneComments }),
      ...(milestone.milestoneStatus && { milestoneStatus: milestone.milestoneStatus }),
      ...(milestone.assignedTeamId !== undefined && { assignedTeamId: +milestone.assignedTeamId }),
    };

    (
      await this.poamService.updatePoamMilestone(
        this.poam.poamId,
        milestone.milestoneId,
        milestoneUpdate
      )
    ).subscribe({
      next: () => {
        this.getData();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Milestone updated successfully.',
        });
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update milestone.',
        });
        console.error('Error updating milestone:', error);
      },
    });
  }

  async deleteMilestone(milestone: any, index: number) {
    if (!milestone.milestoneId) {
      this.poamMilestones.splice(index, 1);
      return;
    }
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this milestone?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: async () => {
        (
          await this.poamService.deletePoamMilestone(this.poam.poamId, milestone.milestoneId, false)
        ).subscribe(() => {
          this.poamMilestones.splice(index, 1);
        });
      },
    });
  }

  getApproverName(userId: number): string {
    const user = this.collectionApprovers.find((user: any) => user.userId === userId);
    return user ? user.fullName : '';
  }

  addApprover() {
    const newApprover = {
      poamId: +this.poam.poamId,
      userId: null,
      approvalStatus: 'Not Reviewed',
      approvedDate: null,
      comments: '',
      isNew: true,
    };
    this.poamApprovers = [newApprover, ...this.poamApprovers];
  }

  async onApproverChange(approver: any, rowIndex: number) {
    if (approver.userId) {
      await this.confirmCreateApprover(approver);
      approver.isNew = false;
    } else {
      this.poamApprovers.splice(rowIndex, 1);
    }
  }

  async deleteApprover(approver: any, rowIndex: number) {
    if (approver.userId) {
      await this.confirmDeleteApprover(approver);
    } else {
      this.poamApprovers.splice(rowIndex, 1);
    }
  }

  confirmCreateApprover(newApprover: any) {
    if (this.poam.poamId !== 'ADDPOAM' && this.poam.poamId && newApprover.userId) {
      const approver: any = {
        poamId: +this.poam.poamId,
        userId: +newApprover.userId,
        approvalStatus: newApprover.approvalStatus,
        approvedDate: newApprover.approvedDate,
        comments: newApprover.comments,
      };

      this.poamService.addPoamApprover(approver).subscribe({
        next: () => {
          this.poamService.getPoamApprovers(this.poamId).subscribe({
            next: (poamApprovers: any) => {
              this.poamApprovers = poamApprovers;
            }
          });
        },
        error: (error) => {
          console.error('Error adding approver:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add POAM Approver'
          });
        }
      });
    }
  }

  confirmDeleteApprover(approver: any) {
    if (this.poam.poamId !== 'ADDPOAM' && this.poam.status === 'Draft') {
      this.poamService.deletePoamApprover(approver.poamId, approver.userId).subscribe({
        next: () => {
          this.poamApprovers = this.poamApprovers.filter((a: any) => a.userId !== approver.userId);
        },
        error: (error) => {
          console.error('Error deleting approver:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete approver'
          });
        }
      });
    }
  }

  async onAssignedTeamChange(assignedTeam: any, rowIndex: number) {
    if (assignedTeam.assignedTeamId) {
      const selectedTeam = this.assignedTeamOptions.find(
        (team: any) => team.assignedTeamId === assignedTeam.assignedTeamId
      );
      assignedTeam.assignedTeamName = selectedTeam ? selectedTeam.assignedTeamName : '';

      await this.confirmCreateAssignedTeam(assignedTeam);
      assignedTeam.isNew = false;
    } else {
      this.poamAssignedTeams.splice(rowIndex, 1);
    }
  }

  async addAssignedTeam() {
    if (this.poam.poamId === 'ADDPOAM') {
      await this.savePoam(true);
    }
    const newAssignedTeam = {
      poamId: +this.poam.poamId,
      assignedTeamId: null,
      assignedTeamName: '',
      isNew: true,
    };
    this.poamAssignedTeams = [newAssignedTeam, ...this.poamAssignedTeams];
  }

  async deleteAssignedTeam(assignedTeam: any, rowIndex: number) {
    if (assignedTeam.assignedTeamId) {
      await this.confirmDeleteAssignedTeam(assignedTeam);
    } else {
      this.poamAssignedTeams.splice(rowIndex, 1);
    }
  }

  confirmCreateAssignedTeam(newAssignedTeam: any) {
    let assignedTeamName = newAssignedTeam.assignedTeamName;
    if (!assignedTeamName) {
      const matchingTeam = this.assignedTeamOptions.find(
        (team: any) => team.assignedTeamId === newAssignedTeam.assignedTeamId
      );
      assignedTeamName = matchingTeam ? matchingTeam.assignedTeamName : 'Team';
    }
    if (this.poam.poamId !== 'ADDPOAM' && newAssignedTeam.assignedTeamId) {
      const poamAssignedTeam = {
        poamId: +this.poam.poamId,
        assignedTeamId: +newAssignedTeam.assignedTeamId,
      };
      this.poamService.postPoamAssignedTeam(poamAssignedTeam).pipe(
        switchMap(() => this.poamService.getPoamAssignedTeams(this.poamId)),
        tap({
          next: (poamAssignedTeams: any) => {
            this.poamAssignedTeams = poamAssignedTeams;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `${assignedTeamName} was successfully added to the assigned teams list`,
            });
          },
          error: (error: Error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to add team: ${error.message}`,
            });
          }
        })
      ).subscribe();
    } else if (this.poam.poamId === 'ADDPOAM' && newAssignedTeam.assignedTeamId) {
      newAssignedTeam.assignedTeamName = assignedTeamName;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${assignedTeamName} was successfully added to the assigned teams list`,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create entry. Invalid input.',
      });
    }
  }

  confirmDeleteAssignedTeam(assignedTeamData: any) {
    let assignedTeamName = '';
    if (assignedTeamData.assignedTeamName) {
      assignedTeamName = assignedTeamData.assignedTeamName;
    }

    if (this.poam.poamId !== 'ADDPOAM' && assignedTeamData.assignedTeamId) {
      this.poamService.deletePoamAssignedTeam(
        +this.poam.poamId,
        +assignedTeamData.assignedTeamId
      ).subscribe({
        next: () => {
          this.poamAssignedTeams = this.poamAssignedTeams.filter(
            (a: any) => a.assignedTeamId !== assignedTeamData.assignedTeamId
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${assignedTeamName} was removed as an assigned team`,
          });
        },
        error: (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to remove assigned team: ${error.message}`,
          });
        }
      });
    } else if (this.poam.poamId === 'ADDPOAM' && assignedTeamData.assignedTeamId) {
      this.poamAssignedTeams = this.poamAssignedTeams.filter(
        (a: any) => a.assignedTeamId !== assignedTeamData.assignedTeamId
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${assignedTeamName} was removed as an assigned team`,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete entry. Invalid input.',
      });
    }
  }

  fetchAssets() {
    this.assetService.getAssetsByCollection(this.payload.lastCollectionAccessedId)
      .subscribe({
        next: (response: any) => {
          this.assetList = response.map((asset: any) => ({
            assetId: asset.assetId,
            assetName: asset.assetName,
          }));
        },
        error: (error) => {
          console.error('Error fetching assets:', error);
        }
      });

    this.poamService.getPoamAssets(this.poamId).subscribe({
      next: (poamAssets: any) => {
        this.poamAssets = poamAssets;
      },
      error: (error) => {
        console.error('Error fetching POAM assets:', error);
      }
    });
  }

  async addAsset() {
    if (this.poam.poamId === 'ADDPOAM') {
      await this.savePoam(true);
    }
    this.poamAssets = [
      { poamId: this.poam.poamId, assetId: null, isNew: true },
      ...this.poamAssets,
    ];
  }

  async onAssetChange(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmCreateAsset(asset);
      asset.isNew = false;
    } else {
      this.poamAssets.splice(rowIndex, 1);
    }
  }

  async deleteAsset(asset: any, rowIndex: number) {
    if (asset.assetId) {
      await this.confirmDeleteAsset(asset);
    } else {
      this.poamAssets.splice(rowIndex, 1);
    }
  }

  getAssetName(assetId: number): string {
    const asset = this.assetList.find((asset: any) => asset.assetId === assetId);
    return asset ? asset.assetName : `Asset ID: ${assetId}`;
  }

  confirmCreateAsset(event: any) {
    if (event.assetId) {
      const poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +event.assetId,
      };
      this.poamService.postPoamAsset(poamAsset).pipe(
        tap({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Asset added successfully.',
            });
            this.fetchAssets();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to add asset.',
            });
          }
        })
      ).subscribe();
    }
  }

  confirmDeleteAsset(event: any) {
    if (this.poam.poamId === 'ADDPOAM') {
      this.poamAssets = this.poamAssets.filter(a => a.assetId !== event.assetId);
      return;
    }
    this.poamService.deletePoamAsset(event.poamId, event.assetId).pipe(
      tap({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset deleted successfully.',
          });
          this.poamAssets = this.poamAssets.filter(a => a.assetId !== event.assetId);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete asset.',
          });
        }
      })
    ).subscribe();
  }

  openIavLink(iavmNumber: string) {
    window.open(
      `https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavmNumber}`,
      '_blank'
    );
  }

  searchVulnerabilitySources(event: any) {
    const query = event.query;
    this.filteredVulnerabilitySources = this.vulnerabilitySources.filter(source =>
      source.toLowerCase().includes(query.toLowerCase())
    );
  }

  searchStigTitles(event: any) {
    const query = event.query.toLowerCase();
    this.filteredStigmanSTIGs = this.stigmanSTIGs.filter((stig: any) =>
      stig.title.toLowerCase().includes(query)
    );
  }

  loadAAPackages() {
    this.aaPackageService.getAAPackages().subscribe({
      next: (response) => {
        this.aaPackages = response || [];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load A&A Packages'
        });
      }
    });
  }

  filterAAPackages(event: { query: string }) {
    const query = event.query.toLowerCase();
    this.filteredAAPackages = this.aaPackages
      .filter(aaPackage => aaPackage.aaPackage.toLowerCase().includes(query))
      .map(aaPackage => aaPackage.aaPackage);
  }

  onAdjSeverityChange() {
    let mappedRating: string;
    if (!this.poam.adjSeverity && this.poam.rawSeverity) {
      mappedRating = this.severityToRatingMap[this.poam.rawSeverity];
    } else {
      mappedRating = this.severityToRatingMap[this.poam.adjSeverity];
    }
    this.poam.likelihood = mappedRating;
    this.poam.residualRisk = mappedRating;
  }

  deletePoam() {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete POAM ${this.poam.poamId}? This action is irreversable.`,
      header: 'Confirm POAM Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.poamService.deletePoam(this.poam.poamId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `POAM ${this.poam.poamId} has been successfully deleted.`
            });
            this.router.navigate(['/poam-processing/poam-manage']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to delete POAM ${this.poam.poamId}: ${error.message}`
            });
          }
        });
      }
    });
  }

  async poamSaved(): Promise<boolean> {
    if (this.poam.poamId === 'ADDPOAM') {
      await this.savePoam(true);
      return true;
    }
    return true;
  }

  confirm(options: { header: string; message: string; accept: () => void }) {
    this.confirmationService.confirm({
      message: options.message,
      header: options.header,
      icon: 'pi pi-exclamation-triangle',
      accept: options.accept,
    });
  }

  showError(message: string, header?: string) {
    this.errorMessage = message;
    this.errorHeader = header || 'Error';
    this.errorDialogVisible = true;
  }

  hideErrorDialog() {
    this.errorDialogVisible = false;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
