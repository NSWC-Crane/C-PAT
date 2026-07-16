/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parse, parseISO } from 'date-fns';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { AAPackage } from '../../../common/models/aaPackage.model';
import { AppConfiguration } from '../../../common/models/appConfiguration.model';
import { Collections } from '../../../common/models/collections.model';
import { Permission } from '../../../common/models/permission.model';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AppConfigurationService } from '../../admin-processing/app-configuration/app-configuration.service';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { PoamApproversComponent } from './components/poam-approvers/poam-approvers.component';
import { PoamAssetsComponent } from './components/poam-assets/poam-assets.component';
import { PoamAssociatedVulnerabilitiesComponent } from './components/poam-associated-vulnerabilities/poam-associated-vulnerabilities.component';
import { PoamAttachmentsComponent } from './components/poam-attachments/poam-attachments.component';
import { PoamChatComponent } from './components/poam-chat/poam-chat.component';
import { PoamLabelsComponent } from './components/poam-labels/poam-labels.component';
import { PoamMilestonesComponent } from './components/poam-milestones/poam-milestones.component';
import { PoamMitigationGeneratorComponent } from './components/poam-mitigation-generator/poam-mitigation-generator.component';
import { PoamTeamsComponent } from './components/poam-teams/poam-teams.component';
import { AssetTeamMappingService } from './services/asset-team-mapping.service';
import { PoamCreationService } from './services/poam-creation.service';
import { AssetData, PoamDataService } from './services/poam-data.service';
import { PoamMitigationService } from './services/poam-mitigation.service';
import { PoamResourceService } from './services/poam-resource.service';
import { PoamValidationService } from './services/poam-validation.service';
import { PoamVariableMappingService } from './services/poam-variable-mapping.service';
import { applyTeamSyncChanges } from './services/team-sync-changes';
import { Direction, TourPrimeNg, TourService } from 'ngx-ui-tour-primeng';

interface PoamAction {
  label: string;
  tourAnchor: string;
  icon: string;
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger';
  command: () => void;
  visible?: boolean;
}

@Component({
  selector: 'cpat-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AccordionModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    ButtonGroupModule,
    DatePicker,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    ToggleSwitch,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    TextareaModule,
    StepperModule,
    TabsModule,
    TagModule,
    ToastModule,
    TooltipModule,
    PoamAttachmentsComponent,
    PoamMitigationGeneratorComponent,
    PoamApproversComponent,
    PoamAssetsComponent,
    PoamAssociatedVulnerabilitiesComponent,
    PoamChatComponent,
    PoamMilestonesComponent,
    PoamLabelsComponent,
    PoamTeamsComponent,
    TourPrimeNg,
    DatePipe
  ],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class PoamDetailsComponent implements OnInit {
  private readonly appConfigurationService = inject(AppConfigurationService);
  private readonly assignedTeamService = inject(AssignedTeamService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  protected poamService = inject(PoamService);
  private readonly poamDataService = inject(PoamDataService);
  private readonly poamCreationService = inject(PoamCreationService);
  private readonly poamMitigationService = inject(PoamMitigationService);
  private readonly poamResourceService = inject(PoamResourceService);
  private readonly assetTeamMappingService = inject(AssetTeamMappingService);
  private readonly poamValidationService = inject(PoamValidationService);
  private readonly route = inject(ActivatedRoute);
  private readonly sharedService = inject(SharedService);
  private readonly router = inject(Router);
  private readonly collectionsService = inject(CollectionsService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly mappingService = inject(PoamVariableMappingService);
  private readonly location = inject(Location);
  private readonly tourService = inject(TourService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeStep = signal<number>(1);
  private readonly tourAnchorToStep: Record<string, number> = {
    'poam-personnel': 1,
    'poam-assets': 2,
    'poam-mitigations': 4,
    'poam-milestones': 7,
    'poam-associated-vulnerabilities': 9
  };

  appConfigSettings: AppConfiguration[] = [];
  readonly accessLevel = signal<number>(0);
  readonly loadingTeams = signal<boolean>(false);
  aiEnabled: boolean = CPAT.Env.features.aiEnabled;
  assetDeltaList: any;
  externalAssets: AssetData[] = [];
  collectionAAPackage: any;
  collectionPredisposingConditions: string;
  readonly poamLabels = signal<any[]>([]);
  readonly poamAssociatedVulnerabilities = signal<any[]>([]);
  readonly labelList = signal<any[]>([]);
  readonly poam = signal<any>(undefined);
  readonly poamId = signal<any>('');
  readonly dates = signal<any>({});
  readonly completionDateWithExtension = signal<any>(undefined);
  readonly assignedTeamOptions = signal<any>(undefined);
  readonly collectionUsers = signal<any>(undefined);
  readonly collectionApprovers = signal<any[]>([]);
  readonly collectionType = signal<string>('');
  readonly aaPackages = signal<AAPackage[]>([]);
  readonly poamApprovers = signal<any[]>([]);
  readonly poamMilestones = signal<any[]>([]);
  readonly assetList = signal<any[]>([]);
  readonly poamAssets = signal<any[]>([]);
  readonly poamAssignedTeams = signal<any[]>([]);
  readonly showStigCheckData = signal<boolean>(false);
  readonly showTenablePluginData = signal<boolean>(false);
  stigmanSTIGs: any;
  readonly tenablePluginData = signal<string>('');
  filteredStigmanSTIGs: string[] = [];
  protected readonly selectedCollection = this.sharedService.selectedCollectionSig;
  readonly originCollectionId = signal<number | undefined>(undefined);
  readonly collectionData = signal<Collections | undefined>(undefined);
  readonly stateData = signal<any>(undefined);
  readonly submitDialogVisible = signal<boolean>(false);
  readonly user = this.setPayloadService.user;
  readonly payload = this.setPayloadService.payload;
  readonly teamMitigations = signal<any[]>([]);
  readonly teamResources = signal<any[]>([]);
  readonly milestoneTeamOptions = signal<any[]>([]);
  readonly activeTabIndex = signal<number>(0);
  readonly activeResourceTabIndex = signal<number>(0);
  readonly showPoamNotes = signal<boolean>(false);
  private readonly invalidFields = computed(() => this.poamValidationService.getInvalidSubmissionFields(this.poam(), this.teamMitigations(), this.teamResources(), this.poamMilestones(), this.dates()));

  vulnerabilitySources: string[] = ['Assured Compliance Assessment Solution (ACAS) Nessus Scanner', 'STIG', 'Other'];

  statusOptions = ['Draft', 'Closed', 'Expired', 'Submitted', 'Pending CAT-I Approval', 'Extension Requested', 'Approved', 'Rejected', 'False-Positive'];

  filteredStatusOptions = computed(() => {
    const accessLevel = this.accessLevel();

    if (accessLevel >= 4) {
      return this.statusOptions;
    } else if (accessLevel === 3) {
      return this.statusOptions.filter((status) => status !== 'Approved');
    } else {
      return ['Draft', 'Closed', 'Expired'];
    }
  });

  severityOptions = [
    { value: 'CAT I - Critical', label: 'CAT I - Critical' },
    { value: 'CAT I - High', label: 'CAT I - High' },
    { value: 'CAT II - Medium', label: 'CAT II - Medium' },
    { value: 'CAT III - Low', label: 'CAT III - Low' },
    { value: 'CAT III - Informational', label: 'CAT III - Informational' }
  ];

  ratingOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' }
  ];

  readonly menuItems = computed<PoamAction[]>(() => {
    const items: PoamAction[] = [
      {
        label: 'POAM History',
        tourAnchor: 'poam-history',
        icon: 'pi pi-history',
        severity: 'secondary',
        command: () => {
          this.poamLog();
        }
      },
      {
        label: 'POAM Chat',
        tourAnchor: 'poam-chat',
        icon: 'pi pi-comment',
        severity: 'info',
        command: () => {
          this.showPoamNotes.set(true);
        },
        visible: this.poam()?.poamId !== 'ADDPOAM'
      },
      {
        label: 'POAM Extension',
        tourAnchor: 'poam-extensions',
        icon: 'pi pi-hourglass',
        severity: 'warn',
        command: () => {
          this.extendPoam();
        }
      }
    ];

    if (this.accessLevel() >= 2) {
      items.push({
        label: 'Submit for Review',
        tourAnchor: 'poam-submission',
        icon: 'pi pi-file-plus',
        severity: 'success',
        command: () => {
          this.verifySubmitPoam();
        }
      });
    }

    if (this.accessLevel() >= 3) {
      items.push({
        label: 'POAM Approval',
        tourAnchor: 'poam-approval',
        icon: 'pi pi-verified',
        severity: 'info',
        command: () => {
          if (this.poam().status === 'Extension Requested') {
            this.extendPoam();
          } else {
            this.poamApproval();
          }
        }
      });
    }

    if (this.accessLevel() >= 3 || (this.poam()?.submitterId === this.user()?.userId && this.poam()?.status === 'Draft')) {
      items.push({
        label: 'Delete POAM',
        tourAnchor: 'poam-deletion',
        icon: 'pi pi-trash',
        severity: 'danger',
        command: () => {
          this.deletePoam();
        }
      });
    }

    return items;
  });

  protected readonly fieldDisabled = computed<boolean>(() => {
    if (this.accessLevel() < 2) {
      return true;
    }

    const editableStatuses = ['Draft', 'Extension Requested', 'Rejected', 'Submitted'];

    return !editableStatuses.includes(this.poam()?.status) && this.accessLevel() < 3;
  });

  private formatDate(date: string | Date | null | undefined): string | null {
    if (typeof date === 'string') {
      return date;
    }

    if (date) {
      return format(date, 'yyyy-MM-dd');
    }

    return null;
  }

  protected patchDates(partial: Record<string, Date | null | undefined>): void {
    this.dates.update((dates: any) => ({ ...dates, ...partial }));
  }

  protected patchPoam(partial: Record<string, any>): void {
    this.poam.update((poam: any) => ({ ...poam, ...partial }));
  }

  protected patchTeamMitigation(assignedTeamId: number, mitigationText: string): void {
    this.teamMitigations.update((mitigations: any[]) => mitigations.map((m) => (m.assignedTeamId === assignedTeamId ? { ...m, mitigationText } : m)));
  }

  protected patchTeamResource(assignedTeamId: number, resourceText: string): void {
    this.teamResources.update((resources: any[]) => resources.map((r) => (r.assignedTeamId === assignedTeamId ? { ...r, resourceText } : r)));
  }

  isInvalid(field: string): boolean {
    return this.invalidFields().has(field);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const previousPoamId = this.poamId();

      this.stateData.set(history.state);
      this.poamId.set(params['poamId']);

      if (previousPoamId && previousPoamId !== this.poamId() && this.accessLevel() > 0) {
        this.activeStep.set(1);
        this.activeTabIndex.set(0);
        this.activeResourceTabIndex.set(0);
        this.completionDateWithExtension.set(undefined);
        this.teamMitigations.set([]);
        this.teamResources.set([]);
        this.getData();
      }
    });
    this.tourService.stepHide$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ step, direction }) => {
      const steps = this.tourService.steps;
      const currentIdx = steps.indexOf(step);
      const nextIdx = direction === Direction.Forwards ? currentIdx + 1 : currentIdx - 1;
      const nextStep = steps[nextIdx];
      const target = nextStep?.anchorId ? this.tourAnchorToStep[nextStep.anchorId] : undefined;

      if (target !== undefined && this.activeStep() !== target) {
        this.activeStep.set(target);
      }
    });
    this.tourService.stepShow$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ step }) => {
      const target = this.tourAnchorToStep[step.anchorId];

      if (target !== undefined && this.activeStep() !== target) {
        this.activeStep.set(target);
      }
    });
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (level) => {
      this.accessLevel.set(level);

      if (this.accessLevel() > 0) {
        await this.obtainCollectionDataAsync(true);
        this.getData();
      }
    });

    if (this.selectedCollection()) {
      this.getLabelData();
    }
  }

  obtainCollectionDataAsync(background: boolean = false): Promise<any> {
    return new Promise((resolve) => {
      this.poamDataService
        .obtainCollectionData(this.selectedCollection(), background)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (collectionInfo) => {
            const collectionData: Collections = collectionInfo;

            collectionData.collectionId = this.selectedCollection();
            this.collectionData.set(collectionData);
            this.collectionAAPackage = collectionInfo.collectionAAPackage;
            this.collectionPredisposingConditions = collectionInfo.collectionPredisposingConditions;
            this.collectionType.set(collectionInfo.collectionType);
            this.originCollectionId.set(collectionInfo.originCollectionId);
            resolve(collectionInfo);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error loading collection data: ${getErrorMessage(error)}`
            });
            resolve(null);
          }
        });
    });
  }

  async getData() {
    this.loadAppConfiguration();
    this.loadAAPackages();
    this.loadAssetDeltaList();
    const isNewPoam = this.poamId() === 'ADDPOAM';
    const source = this.stateData()?.vulnerabilitySource;

    if (this.poamId() === undefined || !this.poamId()) {
      console.error('Failed to create POAM. POAM ID is undefined.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create POAM'
      });
    } else if (isNewPoam && source === 'Assured Compliance Assessment Solution (ACAS) Nessus Scanner') {
      try {
        await this.createNewACASPoam();
        this.loadAssets();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to create ACAS POAM: ${getErrorMessage(error)}`
        });
      }
    } else if (isNewPoam && source === 'STIG') {
      try {
        await this.createNewSTIGManagerPoam();
        this.loadAssets();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to create STIG Manager POAM: ${getErrorMessage(error)}`
        });
      }
    } else if (isNewPoam) {
      try {
        await this.createNewPoam();
        this.loadAssets();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to create POAM: ${getErrorMessage(error)}`
        });
      }
    } else {
      forkJoin([
        this.poamService.getPoam(
          this.poamId(),
          true, // includeApprovers
          true, // includeAssignedTeams
          false, // includeAssets
          true, // includeLabels
          true, // includeMilestones
          true, // includeAssociatedVulnerabilities
          true // includeTeamMitigations
        ),
        this.collectionsService.getCollectionPermissions(this.payload().lastCollectionAccessedId),
        this.assignedTeamService.getAssignedTeams()
      ])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ([poam, users, assignedTeamOptions]) => {
            if (poam.extensionDeadline && poam.extensionDays > 0) {
              poam.extensionDeadline = format(parseISO(poam.extensionDeadline.split('T')[0]), 'yyyy-MM-dd');
              this.completionDateWithExtension.set(poam.extensionDeadline);
            }

            this.poam.set(poam);

            this.dates.set({
              scheduledCompletionDate: poam.scheduledCompletionDate ? parse(poam.scheduledCompletionDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
              iavComplyByDate: poam.iavComplyByDate ? parse(poam.iavComplyByDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
              submittedDate: poam.submittedDate ? parse(poam.submittedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
              closedDate: poam.closedDate ? parse(poam.closedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
            });

            this.assignedTeamOptions.set(assignedTeamOptions);
            this.collectionUsers.set(users);

            this.poamAssignedTeams.set(poam.assignedTeams || []);
            this.poamApprovers.set(
              (poam.approvers || []).map((approver: any) => ({
                ...approver,
                approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
              }))
            );
            this.poamMilestones.set(
              (poam.milestones || []).map((milestone: any) => ({
                ...milestone,
                milestoneDate: milestone.milestoneDate ? parse(milestone.milestoneDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
                milestoneChangeDate: milestone.milestoneChangeDate ? parse(milestone.milestoneChangeDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
                assignedTeamIds: milestone.assignedTeamIds || milestone.assignedTeams?.map((t: any) => t.assignedTeamId) || []
              }))
            );
            this.poamLabels.set(poam.labels || []);
            this.poamAssociatedVulnerabilities.set(poam.associatedVulnerabilities || []);
            this.teamMitigations.set(poam.teamMitigations || []);
            this._ensureUniqueTeamMitigations();

            this.collectionApprovers.set(Array.isArray(this.collectionUsers()) ? this.collectionUsers().filter((user: Permission) => user.accessLevel >= 3) : []);

            if (this.collectionApprovers().length > 0 && (this.poamApprovers() == undefined || this.poamApprovers().length == 0)) {
              this.addDefaultApprovers();
            }

            if (poam.tenablePluginData) {
              this.tenablePluginData.set(this.poamCreationService.parsePluginData(poam.tenablePluginData));
            } else {
              this.poamDataService
                .loadSTIGsFromSTIGMAN()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: (stigmanSTIGs) => {
                    this.stigmanSTIGs = stigmanSTIGs;
                  },
                  error: (error) => {
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: `Error loading STIGs: ${getErrorMessage(error)}`
                    });
                  }
                });
            }

            this.loadTeamMitigations();
            this.loadTeamResources();
            this.loadAssets();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to load POAM data: ${getErrorMessage(error)}`
            });
          }
        });
    }
  }

  getLabelData() {
    this.poamDataService
      .getLabelData(this.selectedCollection())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (labels: any) => {
          this.labelList.set(labels);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching labels: ${getErrorMessage(error)}`
          });
        }
      });
  }

  private loadAssets() {
    this.loadingTeams.set(true);

    this.poamDataService
      .loadAssets(this.collectionType(), this.originCollectionId(), this.poam(), this.payload().lastCollectionAccessedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.externalAssets) {
            this.externalAssets = result.externalAssets;
            this.compareAssetsAndAssignTeams();
          }

          if (result.assetList) {
            this.assetList.set(result.assetList);
          }

          if (result.poamAssets) {
            this.poamAssets.set(result.poamAssets);
          }

          this.loadingTeams.set(false);
          this.updateMilestoneTeamOptions();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load assets: ${getErrorMessage(error)}`
          });
          this.loadingTeams.set(false);
        }
      });
  }

  loadAssetDeltaList() {
    this.poamDataService
      .loadAssetDeltaList(this.selectedCollection())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.assetDeltaList = response || [];
        }
      });
  }

  async compareAssetsAndAssignTeams() {
    const updatedTeams = this.assetTeamMappingService.compareAssetsAndAssignTeams(this.poam(), this.assetDeltaList, this.collectionType(), this.poamAssets(), this.externalAssets, this.assetList(), this.poamAssignedTeams());

    this.poamAssignedTeams.set(updatedTeams);
    this.updateMilestoneTeamOptions();

    if (this.poam()?.poamId && this.poam().poamId !== 'ADDPOAM') {
      this.syncTeamMitigations();
      this._ensureUniqueTeamMitigations();
    } else if (this.poamAssignedTeams()?.length > 0) {
      const teamMitigations = [...this.teamMitigations()];

      this.poamAssignedTeams().forEach((team) => {
        const existingMitigationIndex = teamMitigations.findIndex((m) => m.assignedTeamId === team.assignedTeamId);

        if (existingMitigationIndex === -1) {
          teamMitigations.push({
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            mitigationText: '',
            isActive: true
          });
        }
      });
      this.teamMitigations.set(teamMitigations);
      this._ensureUniqueTeamMitigations();
    }
  }

  async createNewACASPoam(): Promise<void> {
    try {
      const collectionInfo = {
        collectionId: this.payload().lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewACASPoam(this.stateData(), collectionInfo, this.payload().userId);

      this.dates.set(result.dates);
      this.tenablePluginData.set(result.tenablePluginData);
      this.assignedTeamOptions.set(result.assignedTeamOptions);
      this.collectionUsers.set(result.collectionUsers);
      this.collectionApprovers.set(result.collectionApprovers);
      this.poamApprovers.set(
        (result.poamApprovers || []).map((approver: any) => ({
          ...approver,
          approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
        }))
      );
      this.poam.set(result.poam);
      this.teamMitigations.set([]);
      this.teamResources.set([]);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create new POAM: ${getErrorMessage(error)}`
      });
    }
  }

  async createNewSTIGManagerPoam(): Promise<void> {
    try {
      const collectionInfo = {
        collectionId: this.payload().lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewSTIGManagerPoam(this.stateData(), collectionInfo, this.payload().userId);

      this.dates.set(result.dates);
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions.set(result.assignedTeamOptions);
      this.collectionUsers.set(result.collectionUsers);
      this.collectionApprovers.set(result.collectionApprovers);
      this.poamApprovers.set(
        (result.poamApprovers || []).map((approver: any) => ({
          ...approver,
          approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
        }))
      );
      this.poam.set(result.poam);
      this.teamMitigations.set([]);
      this.teamResources.set([]);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create new STIG Manager POAM: ${getErrorMessage(error)}`
      });
    }
  }

  async createNewPoam(): Promise<void> {
    try {
      const collectionInfo = {
        collectionId: this.payload().lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewPoam(collectionInfo, this.payload().userId);

      this.dates.set(result.dates);
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions.set(result.assignedTeamOptions);
      this.collectionUsers.set(result.collectionUsers);
      this.collectionApprovers.set(result.collectionApprovers);
      this.poamApprovers.set(
        (result.poamApprovers || []).map((approver: any) => ({
          ...approver,
          approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
        }))
      );
      this.poam.set(result.poam);
      this.teamMitigations.set([]);
      this.teamResources.set([]);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create new POAM: ${getErrorMessage(error)}`
      });
    }
  }

  addDefaultApprovers() {
    const defaultApprovers = this.collectionApprovers().map((collectionApprover: any) => ({
      poamId: +this.poamId(),
      collectionId: +collectionApprover.collectionId,
      userId: +collectionApprover.userId,
      approvalStatus: 'Not Reviewed'
    }));

    this.poamApprovers.set([...this.poamApprovers(), ...defaultApprovers]);
  }

  extendPoam() {
    if (this.poam().poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'You may not extend POAM until after it has been saved.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-extend', this.poam().poamId]);
  }

  poamApproval() {
    if (this.poam().status === 'Draft' || this.poam().poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'Approvals can not be entered until after a POAM has been submitted.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-approve', this.poam().poamId]);
  }

  poamLog() {
    if (this.poam().poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'POAM Log is not created until after a POAM has been saved.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-log', this.poam().poamId]);
  }

  savePoam(saveState: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.validateData()) {
        resolve(false);

        return;
      }

      const dates = this.dates();

      this.poam.update((poam: any) => ({
        ...poam,
        scheduledCompletionDate: this.formatDate(dates.scheduledCompletionDate),
        submittedDate: this.formatDate(dates.submittedDate),
        iavComplyByDate: this.formatDate(dates.iavComplyByDate),
        closedDate: poam.status === 'Closed' ? format(new Date(), 'yyyy-MM-dd') : this.formatDate(dates.closedDate),
        requiredResources: poam.requiredResources ? poam.requiredResources : '',
        isGlobalFinding: poam.isGlobalFinding ?? false
      }));

      const poamToSubmit = { ...this.poam() };

      if (this.poamAssignedTeams()?.length > 0) {
        poamToSubmit.assignedTeams = this.poamAssignedTeams()
          .filter((team) => team.assignedTeamId)
          .map((team) => ({
            assignedTeamId: +team.assignedTeamId,
            automated: team.automated || false
          }));
      } else {
        poamToSubmit.assignedTeams = [];
      }

      if (this.poamAssets()?.length > 0) {
        poamToSubmit.assets = this.poamAssets()
          .filter((asset) => asset.assetId || asset.assetName)
          .map((asset) => (asset.assetId ? { assetId: asset.assetId } : { assetName: asset.assetName }));
      } else {
        poamToSubmit.assets = [];
      }

      poamToSubmit.approvers = (this.poamApprovers() ?? [])
        .filter((approver) => approver.userId)
        .map((approver) => ({
          userId: approver.userId,
          approvalStatus: approver.approvalStatus || 'Not Reviewed',
          comments: approver.comments || '',
          approvedDate: this.formatDate(approver.approvedDate)
        }));

      if (this.poamLabels()?.length > 0) {
        poamToSubmit.labels = this.poamLabels()
          .filter((label) => label.labelId)
          .map((label) => ({ labelId: label.labelId }));
      } else {
        poamToSubmit.labels = [];
      }

      poamToSubmit.milestones = (this.poamMilestones() ?? [])
        .filter((milestone) => milestone.milestoneComments || (milestone.milestoneId && !String(milestone.milestoneId).startsWith('temp_')))
        .map((milestone) => ({
          milestoneDate: this.formatDate(milestone.milestoneDate),
          milestoneComments: milestone.milestoneComments || null,
          milestoneChangeComments: milestone.milestoneChangeComments || null,
          milestoneChangeDate: this.formatDate(milestone.milestoneChangeDate),
          milestoneStatus: milestone.milestoneStatus || 'In Progress',
          assignedTeamIds: milestone.assignedTeamIds || []
        }));

      if (this.poamAssociatedVulnerabilities()?.length > 0) {
        const normalizedVulnerabilities = this.poamAssociatedVulnerabilities()
          .map((vuln) => (typeof vuln === 'string' ? vuln : vuln?.associatedVulnerability || vuln))
          .filter(Boolean);

        poamToSubmit.associatedVulnerabilities = normalizedVulnerabilities;
      } else {
        poamToSubmit.associatedVulnerabilities = [];
      }

      if (this.teamMitigations()?.length > 0) {
        poamToSubmit.teamMitigations = this.teamMitigations()
          .filter((mitigation) => mitigation.assignedTeamId)
          .map((mitigation) => ({
            assignedTeamId: mitigation.assignedTeamId,
            mitigationText: mitigation.mitigationText || '',
            isActive: mitigation.isActive ?? true
          }));
      } else {
        poamToSubmit.teamMitigations = [];
      }

      poamToSubmit.teamResources = (this.teamResources() ?? [])
        .filter((resource) => resource.assignedTeamId)
        .map((resource) => ({
          assignedTeamId: resource.assignedTeamId,
          resourceText: resource.resourceText || '',
          isActive: resource.isActive ?? true
        }));

      if (poamToSubmit.poamId === 'ADDPOAM') {
        poamToSubmit.poamId = 0;

        this.poamService
          .postPoam(poamToSubmit)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (!res?.poamId) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Information',
                  detail: 'Unexpected error adding POAM'
                });
                resolve(false);
              } else {
                this.poam.update((poam: any) => ({ ...poam, poamId: res.poamId }));
                this.poamId.set(res.poamId);
                this.location.replaceState(`/poam-processing/poam-details/${res.poamId}`);
                this.updateLocalReferences(res.poamId);

                if (!saveState) {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Added POAM: ${res.poamId}`
                  });
                }

                resolve(true);
              }
            },
            error: (error) => {
              if (error?.status === 409) {
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Duplicate POAM',
                  detail: getErrorMessage(error)
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Unexpected error: ${getErrorMessage(error)}`
                });
              }

              resolve(false);
            }
          });
      } else {
        this.poamService
          .updatePoam(poamToSubmit)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => {
              this.poam.set(data);

              if (!saveState) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'POAM successfully updated'
                });
              }

              resolve(true);
            },
            error: (error) => {
              if (error?.status === 409) {
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Duplicate POAM',
                  detail: getErrorMessage(error)
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: `Failed to update POAM: ${getErrorMessage(error)}`
                });
              }

              resolve(false);
            }
          });
      }
    });
  }

  private updateLocalReferences(poamId: number) {
    const stampPoamId = (items: any[]) => (Array.isArray(items) ? items.map((item) => ({ ...item, poamId })) : items);

    this.poamAssets.update(stampPoamId);
    this.poamAssignedTeams.update(stampPoamId);
    this.poamApprovers.update(stampPoamId);
    this.poamLabels.update(stampPoamId);
    this.poamMilestones.update(stampPoamId);
    this.teamMitigations.update(stampPoamId);
    this.teamResources.update(stampPoamId);
  }

  onStigSelected(event: any) {
    const selectedTitle = event.value;
    const matchedStig = this.stigmanSTIGs?.find((stig: any) => stig.title === selectedTitle);

    this.poam.update((poam: any) => ({
      ...poam,
      vulnerabilityTitle: selectedTitle,
      ...(matchedStig ? { stigBenchmarkId: matchedStig.benchmarkId } : {})
    }));
  }

  onMitigationGenerated(event: { mitigation: string; teamId?: number }) {
    if (this.poam().isGlobalFinding || !event.teamId) {
      this.poam.update((poam: any) => ({ ...poam, mitigations: event.mitigation }));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    } else {
      const teamMitigation = this.teamMitigations().find((m) => m.assignedTeamId === event.teamId);

      if (teamMitigation) {
        this.teamMitigations.set(this.teamMitigations().map((m) => (m.assignedTeamId === event.teamId ? { ...m, mitigationText: event.mitigation } : m)));
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Mitigation updated for team ${teamMitigation.assignedTeamName}`
        });
      }
    }

    this._ensureUniqueTeamMitigations();
  }

  async verifySubmitPoam(showDialog: boolean = true): Promise<boolean> {
    const milestonesInEditMode = this.poamMilestones() ? this.poamMilestones().filter((m) => m.editing || m.isNew) : [];

    if (milestonesInEditMode.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'Please save or cancel all milestone edits before submitting the POAM.'
      });

      return false;
    }

    const saveSuccess = await this.savePoam(true);

    if (!saveSuccess) {
      return false;
    }

    this._ensureUniqueTeamMitigations();

    const validations = [
      this.poamValidationService.validateSubmissionRequirements(this.poam(), this.teamMitigations(), this.teamResources(), this.poamMilestones(), this.dates()),
      this.poamValidationService.validateMilestoneDates(this.poam(), this.poamMilestones()),
      this.poamValidationService.validateMilestoneCompleteness(this.poamMilestones())
    ];

    for (const validation of validations) {
      if (!validation.valid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Information',
          detail: validation.message
        });

        return false;
      }
    }

    if (showDialog) {
      this.submitDialogVisible.set(true);
    }

    return true;
  }

  async confirmSubmit() {
    const previousStatus = this.poam().status;
    const previousSubmittedDate = this.dates().submittedDate;

    this.poam.update((poam: any) => ({ ...poam, status: 'Submitted' }));
    this.patchDates({ submittedDate: new Date() });

    const saveSuccess = await this.savePoam();

    if (!saveSuccess) {
      this.poam.update((poam: any) => ({ ...poam, status: previousStatus }));
      this.patchDates({ submittedDate: previousSubmittedDate });

      return;
    }

    this.submitDialogVisible.set(false);
    this.router.navigate(['/poam-processing/poam-manage']);
  }

  cancelSubmit() {
    this.submitDialogVisible.set(false);
  }

  validateScheduledCompletion() {
    const getConfigValue = (settingName: string, fallbackValue: number): number => {
      if (this.appConfigSettings) {
        const setting = this.appConfigSettings.find((config) => config.settingName === settingName);

        if (setting) {
          return Number.parseInt(setting.settingValue, 10);
        }
      }

      return fallbackValue;
    };

    let daysToAdd: number;

    switch (this.poam().adjSeverity ? this.poam().adjSeverity : this.poam().rawSeverity) {
      case 'CAT I - Critical':
      case 'CAT I - High':
        daysToAdd = getConfigValue('cat-i_scheduled_completion_max', 30);
        break;
      case 'CAT II - Medium':
        daysToAdd = getConfigValue('cat-ii_scheduled_completion_max', 180);
        break;
      case 'CAT III - Low':
      case 'CAT III - Informational':
        daysToAdd = getConfigValue('cat-iii_scheduled_completion_max', 365);
        break;
      default:
        daysToAdd = getConfigValue('default_milestone_due_date_max', 30);
    }

    const currentDate = new Date();
    const maxAllowedDate = new Date(currentDate);

    maxAllowedDate.setDate(currentDate.getDate() + daysToAdd);

    if (this.accessLevel() < 4 && this.dates().scheduledCompletionDate > maxAllowedDate) {
      this.patchDates({ scheduledCompletionDate: maxAllowedDate });
      const formattedDate = maxAllowedDate.toLocaleDateString();

      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: `The scheduled completion date for ${this.poam().adjSeverity ? this.poam().adjSeverity : this.poam().rawSeverity} POAMs must not exceed ${daysToAdd} days. The scheduled completion date has been reverted to ${formattedDate}`
      });
    }
  }

  validateData(): boolean {
    const result = this.poamValidationService.validateData(this.poam());

    if (!result.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: result.message
      });

      return false;
    }

    return true;
  }

  cancelPoam() {
    this.location.back();
  }

  handleAssetsChanged(assets: any[]) {
    this.poamAssets.set([...assets]);
    this.compareAssetsAndAssignTeams();
  }

  handleLabelsChanged(labels: any[]) {
    this.poamLabels.set(labels);
  }

  handleMilestonesChanged(milestones: any[]) {
    milestones.forEach((milestone) => {
      if (milestone.milestoneDate && milestone.milestoneDate instanceof Date) {
        milestone.milestoneDate = format(milestone.milestoneDate, 'yyyy-MM-dd');
      }

      if (milestone.milestoneChangeDate && milestone.milestoneChangeDate instanceof Date) {
        milestone.milestoneChangeDate = format(milestone.milestoneChangeDate, 'yyyy-MM-dd');
      }
    });
    this.poamMilestones.set([...milestones]);
  }

  handleApproversChanged(approvers: any[]) {
    this.poamApprovers.set(approvers);
  }

  handleAssociatedVulnerabilitiesChanged(vulnerabilities: any[]) {
    this.poamAssociatedVulnerabilities.set(vulnerabilities);
  }

  handleTeamsChanged(event: { teams: any[]; action: string; team?: any }) {
    this.poamAssignedTeams.set([...event.teams]);
    this.updateMilestoneTeamOptions();

    if (event.action === 'added' && event.team?.assignedTeamId) {
      this.activateTeamEntries(event.team);
    } else if (event.action === 'deleted' && event.team?.assignedTeamId) {
      this.deactivateTeamEntries(event.team);
    }

    this._ensureUniqueTeamMitigations();
    this._ensureUniqueTeamResources();

    if (this.poam() && event.action !== 'save-request') {
      const assignedTeams = this.poamAssignedTeams()
        .filter((team) => team.assignedTeamId)
        .map((team) => ({
          assignedTeamId: +team.assignedTeamId,
          automated: team.automated || false
        }))
        .filter((team, index, self) => index === self.findIndex((t) => t.assignedTeamId === team.assignedTeamId));

      this.poam.update((poam: any) => ({ ...poam, assignedTeams }));
    }

    this.clampActiveTabIndexes();
  }

  private activateTeamEntries(team: any) {
    const mitigationExists = this.teamMitigations().some((m) => m.assignedTeamId === team.assignedTeamId);

    if (mitigationExists) {
      this.teamMitigations.set(this.teamMitigations().map((m) => (m.assignedTeamId === team.assignedTeamId ? { ...m, isActive: true, assignedTeamName: team.assignedTeamName } : m)));
    } else {
      this.teamMitigations.set([
        ...this.teamMitigations(),
        {
          assignedTeamId: team.assignedTeamId,
          assignedTeamName: team.assignedTeamName,
          mitigationText: '',
          isActive: true
        }
      ]);
    }

    if (!this.poam()?.isGlobalFinding && this.teamMitigations().filter((m) => m.isActive).length === 1) {
      this.activeTabIndex.set(0);
    }

    const resourceExists = this.teamResources().some((r) => r.assignedTeamId === team.assignedTeamId);

    if (resourceExists) {
      this.teamResources.set(this.teamResources().map((r) => (r.assignedTeamId === team.assignedTeamId ? { ...r, isActive: true, assignedTeamName: team.assignedTeamName } : r)));
    } else {
      this.teamResources.set([
        ...this.teamResources(),
        {
          assignedTeamId: team.assignedTeamId,
          assignedTeamName: team.assignedTeamName,
          resourceText: '',
          isActive: true
        }
      ]);
    }

    if (!this.poam()?.isGlobalFinding && this.teamResources().filter((r) => r.isActive).length === 1) {
      this.activeResourceTabIndex.set(0);
    }
  }

  private deactivateTeamEntries(team: any) {
    const mitigationIndex = this.teamMitigations().findIndex((m) => m.assignedTeamId === team.assignedTeamId);

    if (mitigationIndex > -1) {
      this.teamMitigations.set(this.teamMitigations().map((m) => (m.assignedTeamId === team.assignedTeamId ? { ...m, isActive: false } : m)));

      if (!this.poam()?.isGlobalFinding && this.activeTabIndex() === mitigationIndex) {
        this.activeTabIndex.set(0);
      }
    }

    const resourceIndex = this.teamResources().findIndex((r) => r.assignedTeamId === team.assignedTeamId);

    if (resourceIndex > -1) {
      this.teamResources.set(this.teamResources().map((r) => (r.assignedTeamId === team.assignedTeamId ? { ...r, isActive: false } : r)));

      if (!this.poam()?.isGlobalFinding && this.activeResourceTabIndex() === resourceIndex) {
        this.activeResourceTabIndex.set(0);
      }
    }
  }

  private clampActiveTabIndexes() {
    if (this.poam()?.isGlobalFinding) {
      return;
    }

    const activeTeams = this.teamMitigations().filter((m) => m.isActive);

    if (this.activeTabIndex() >= activeTeams.length && activeTeams.length > 0) {
      this.activeTabIndex.set(0);
    }

    const activeResourceTeams = this.teamResources().filter((r) => r.isActive);

    if (this.activeResourceTabIndex() >= activeResourceTeams.length && activeResourceTeams.length > 0) {
      this.activeResourceTabIndex.set(0);
    }
  }

  updateMilestoneTeamOptions() {
    if (!this.poamAssignedTeams() || !this.assignedTeamOptions()) {
      this.milestoneTeamOptions.set([]);

      return;
    }

    const currentAssignedTeams = Array.isArray(this.poamAssignedTeams()) ? this.poamAssignedTeams() : [];

    const activeTeamIds = new Set(currentAssignedTeams.filter((team) => team.isActive !== false).map((team) => team.assignedTeamId));

    const filteredTeams = (this.assignedTeamOptions() || []).filter((teamOption: any) => activeTeamIds.has(teamOption.assignedTeamId));

    this.milestoneTeamOptions.set([...filteredTeams]);
  }

  async loadTeamMitigations() {
    this._ensureUniqueTeamMitigations();

    if (!this.poam()?.poamId || this.poam().poamId === 'ADDPOAM') {
      return;
    }

    const needsInitialization = this.teamMitigations().length === 0 && this.poamAssignedTeams()?.length > 0;
    const needsSync = this.teamMitigations().length > 0 && this.poamAssignedTeams()?.length > 0;

    if (needsInitialization) {
      await this.initializeTeamMitigations();
    } else if (needsSync) {
      this.syncTeamMitigations();
    }

    this._ensureUniqueTeamMitigations();

    if (this.activeTabIndex() > 0 && this.activeTabIndex() > this.teamMitigations().length) {
      this.activeTabIndex.set(0);
    }
  }

  syncTeamMitigations() {
    if (!this.poam() || !this.poamAssignedTeams() || !this.teamMitigations()) {
      console.warn('Cannot sync team mitigations: Missing required data.');

      return;
    }

    this.poamMitigationService
      .syncTeamMitigations(this.poam(), this.poamAssignedTeams(), this.teamMitigations())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changes) => {
        if (changes.length > 0) {
          this.teamMitigations.update((current) => applyTeamSyncChanges(current, changes));
          this.clampActiveTabIndexes();
        }
      });
  }

  async initializeTeamMitigations() {
    this.teamMitigations.set(await this.poamMitigationService.initializeTeamMitigations(this.poam(), this.poamAssignedTeams(), this.teamMitigations()));
  }

  onGlobalFindingToggle(isGlobalFinding: boolean): void {
    if (isGlobalFinding) {
      this.activeTabIndex.set(0);
      this.activeResourceTabIndex.set(0);
      this.messageService.add({
        severity: 'info',
        summary: 'Global Finding Mode',
        detail: 'Team-specific mitigations are now hidden. Use the global mitigation section below.'
      });
    } else if (this.teamMitigations()?.length > 0) {
      this.activeTabIndex.set(0);
      this.activeResourceTabIndex.set(0);
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Team Assignment Required',
        detail: 'Please assign teams to this POAM in the Personnel section to enter team-specific mitigations, or enable Global Finding mode.'
      });
    }
  }

  onTabChange(value: string | number): void {
    const index = typeof value === 'number' ? value : Number(value);
    const maxIndex = this.teamMitigations().length - 1;

    if ((this.poam()?.isGlobalFinding && index !== 0) || index < 0 || Number.isNaN(index) || (!this.poam()?.isGlobalFinding && index > maxIndex)) {
      this.activeTabIndex.set(0);

      return;
    }

    this.activeTabIndex.set(index);
  }

  openIavLink(iavmNumber: string) {
    globalThis.open(`https://vram.navy.mil/standalone_pages/iav_display?notice_number=${encodeURIComponent(iavmNumber)}`, '_blank');
  }

  searchStigTitles(event: any) {
    const query = event?.query?.toLowerCase() || '';

    if (!this.stigmanSTIGs) {
      this.filteredStigmanSTIGs = [];

      return;
    }

    this.filteredStigmanSTIGs = this.stigmanSTIGs.filter((stig: any) => stig?.title?.toLowerCase().includes(query)).map((stig: any) => stig.title);
  }

  loadAppConfiguration() {
    this.appConfigurationService
      .getAppConfiguration()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.appConfigSettings = response || [];
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load custom configuration settings: ${getErrorMessage(error)}`
          });
          this.appConfigSettings = [];
        }
      });
  }

  loadAAPackages() {
    this.poamDataService
      .loadAAPackages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.aaPackages.set(response || []);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load A&A Packages: ${getErrorMessage(error)}`
          });
          this.aaPackages.set([]);
        }
      });
  }

  onAdjSeverityChange() {
    const mappedRating = this.mappingService.getSeverityRating(this.poam().adjSeverity ?? this.poam().rawSeverity);

    this.poam.update((poam: any) => ({ ...poam, likelihood: mappedRating, residualRisk: mappedRating }));
  }

  deletePoam() {
    if (!this.poam()?.poamId || this.poam().poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Delete',
        detail: 'POAM must be saved before it can be deleted.'
      });

      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete POAM ${this.poam().poamId}? This action is irreversable.`,
      header: 'Confirm POAM Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        this.poamService
          .deletePoam(this.poam().poamId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `POAM ${this.poam().poamId} has been successfully deleted.`
              });
              this.router.navigate(['/poam-processing/poam-manage']);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to delete POAM ${this.poam().poamId}: : ${getErrorMessage(error)}`
              });
            }
          });
      }
    });
  }

  isIavmNumberValid(iavmNumber: string): boolean {
    return this.mappingService.isIavmNumberValid(iavmNumber);
  }

  loadTeamResources() {
    if (!this.poam()?.poamId || this.poam().poamId === 'ADDPOAM') {
      this._ensureUniqueTeamResources();

      return;
    }

    this.poamResourceService
      .loadTeamResources(this.poam().poamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (resources) => {
          this.teamResources.set(resources || []);
          this._ensureUniqueTeamResources();

          const needsInitialization = this.teamResources().length === 0 && this.poamAssignedTeams()?.length > 0;
          const needsSync = this.teamResources().length > 0 && this.poamAssignedTeams()?.length > 0;

          if (needsInitialization) {
            await this.initializeTeamResources();
          } else if (needsSync) {
            this.syncTeamResources();
          }

          this._ensureUniqueTeamResources();

          if (this.activeResourceTabIndex() > 0 && this.activeResourceTabIndex() > this.teamResources().length) {
            this.activeResourceTabIndex.set(0);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load team resources: ${getErrorMessage(error)}`
          });
          this._ensureUniqueTeamResources();
        }
      });
  }

  syncTeamResources() {
    if (!this.poam() || !this.poamAssignedTeams() || !this.teamResources()) {
      console.warn('Cannot sync team resources: Missing required data.');

      return;
    }

    this.poamResourceService
      .syncTeamResources(this.poam(), this.poamAssignedTeams(), this.teamResources())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changes) => {
        if (changes.length > 0) {
          this.teamResources.update((current) => applyTeamSyncChanges(current, changes));
          this.clampActiveTabIndexes();
        }
      });
  }

  async initializeTeamResources() {
    this.teamResources.set(await this.poamResourceService.initializeTeamResources(this.poam(), this.poamAssignedTeams(), this.teamResources()));
  }

  onResourceTabChange(value: string | number): void {
    const index = typeof value === 'number' ? value : Number(value);
    const maxIndex = this.teamResources().length - 1;

    if ((this.poam()?.isGlobalFinding && index !== 0) || index < 0 || Number.isNaN(index) || (!this.poam()?.isGlobalFinding && index > maxIndex)) {
      this.activeResourceTabIndex.set(0);

      return;
    }

    this.activeResourceTabIndex.set(index);
  }

  private _ensureUniqueTeamMitigations(): void {
    if (Array.isArray(this.teamMitigations())) {
      this.teamMitigations.set(this.teamMitigations().filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId)));
    } else {
      this.teamMitigations.set([]);
    }
  }

  private _ensureUniqueTeamResources(): void {
    if (Array.isArray(this.teamResources())) {
      this.teamResources.set(this.teamResources().filter((resource, index, self) => index === self.findIndex((r) => r.assignedTeamId === resource.assignedTeamId)));
    } else {
      this.teamResources.set([]);
    }
  }
}
