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
import { ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, parse } from 'date-fns';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { ProgressBarModule } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
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
import { PoamValidationService } from './services/poam-validation.service';
import { PoamVariableMappingService } from './services/poam-variable-mapping.service';

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
    InputGroupAddonModule,
    TextareaModule,
    MenuModule,
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
    ProgressBarModule
  ],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class PoamDetailsComponent implements OnInit, OnDestroy {
  private appConfigurationService = inject(AppConfigurationService);
  private assignedTeamService = inject(AssignedTeamService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  protected poamService = inject(PoamService);
  private poamDataService = inject(PoamDataService);
  private poamCreationService = inject(PoamCreationService);
  private poamMitigationService = inject(PoamMitigationService);
  private assetTeamMappingService = inject(AssetTeamMappingService);
  private poamValidationService = inject(PoamValidationService);
  private route = inject(ActivatedRoute);
  private sharedService = inject(SharedService);
  private router = inject(Router);
  private collectionsService = inject(CollectionsService);
  private setPayloadService = inject(PayloadService);
  private mappingService = inject(PoamVariableMappingService);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  readonly menu = viewChild.required<Menu>('menu');
  appConfigSettings: AppConfiguration[] = [];
  accessLevel = signal<number>(0);
  loadingTeams = signal<boolean>(false);
  aiEnabled: boolean = CPAT.Env.features.aiEnabled;
  assetDeltaList: any;
  externalAssets: AssetData[] = [];
  collectionAAPackage: any;
  collectionPredisposingConditions: string;
  poamLabels: any[] = [];
  poamAssociatedVulnerabilities: any[] = [];
  labelList: any[] = [];
  poam: any;
  poamId: any = '';
  dates: any = {};
  completionDateWithExtension: any;
  assignedTeamOptions: any;
  collectionUsers: any;
  collectionApprovers: any = [];
  collectionType: string = '';
  aaPackages: AAPackage[] = [];
  poamApprovers: any[] = [];
  poamMilestones: any;
  assetList: any[] = [];
  poamAssets: any[] = [];
  poamAssignedTeams: any[] = [];
  showCheckData: boolean = false;
  stigmanSTIGs: any;
  tenableVulnResponse: any;
  tenablePluginData: string;
  filteredStigmanSTIGs: string[] = [];
  selectedCollection: any;
  originCollectionId: number;
  collectionData: Collections;
  stateData: any;
  submitDialogVisible: boolean = false;
  user: any;
  payload: any;
  teamMitigations: any[] = [];
  milestoneTeamOptions: any[] = [];
  activeTabIndex: number = 0;
  mitigationSaving: boolean = false;
  isGlobalFinding: boolean;
  showPoamNotes: boolean = false;
  private subs = new SubSink();

  vulnerabilitySources: string[] = ['Assured Compliance Assessment Solution (ACAS) Nessus Scanner', 'STIG', 'Other'];

  statusOptions = ['Draft', 'Closed', 'Expired', 'Submitted', 'Pending CAT-I Approval', 'Extension Requested', 'Approved', 'Rejected', 'False-Positive'];

  get filteredStatusOptions(): string[] {
    const accessLevel = this.accessLevel();

    if (accessLevel >= 4) {
      return this.statusOptions;
    } else if (accessLevel === 3) {
      return this.statusOptions.filter((status) => status !== 'Approved');
    } else {
      return ['Draft', 'Closed', 'Expired'];
    }
  }

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

  menuItems = computed(() => {
    const items: MenuItem[] = [
      {
        label: 'POAM History',
        icon: 'pi pi-history',
        styleClass: 'menu-item-secondary',
        command: () => {
          this.poamLog();
          this.menu()?.hide();
        }
      },
      {
        label: 'POAM Chat',
        icon: 'pi pi-comment',
        styleClass: 'menu-item-info',
        command: () => {
          this.showPoamNotes = true;
          this.menu()?.hide();
        },
        visible: this.poam?.poamId !== 'ADDPOAM'
      },
      {
        label: 'POAM Extension',
        icon: 'pi pi-hourglass',
        styleClass: 'menu-item-warning',
        command: () => {
          this.extendPoam();
          this.menu()?.hide();
        }
      }
    ];

    if (this.accessLevel() >= 2) {
      items.push({
        label: 'Submit for Review',
        icon: 'pi pi-file-plus',
        styleClass: 'menu-item-success',
        command: () => {
          this.verifySubmitPoam();
          this.menu()?.hide();
        }
      });
    }

    if (this.accessLevel() >= 3) {
      items.push({
        label: 'POAM Approval',
        icon: 'pi pi-verified',
        styleClass: 'menu-item-primary',
        command: () => {
          this.poamApproval();
          this.menu()?.hide();
        }
      });
    }

    if (this.accessLevel() >= 3 || (this.poam?.submitterId === this.user?.userId && this.poam?.status === 'Draft')) {
      items.push({
        label: 'Delete POAM',
        icon: 'pi pi-trash',
        styleClass: 'menu-item-danger',
        command: () => {
          this.deletePoam();
          this.menu()?.hide();
        }
      });
    }

    return items;
  });

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      this.stateData = history.state;
      this.poamId = params['poamId'];
    });
    this.subs.add(
      this.sharedService.selectedCollection.subscribe((collectionId) => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.setPayload();
    this.subs.add(
      this.setPayloadService.user$.subscribe((user) => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe((payload) => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(async (level) => {
        this.accessLevel.set(level);

        if (this.accessLevel() > 0) {
          await this.obtainCollectionDataAsync(true);
          this.getData();
        }
      })
    );

    if (this.selectedCollection) {
      this.getLabelData();
    }
  }

  obtainCollectionDataAsync(background: boolean = false): Promise<any> {
    return new Promise((resolve) => {
      this.poamDataService.obtainCollectionData(this.selectedCollection, background).subscribe({
        next: (collectionInfo) => {
          this.collectionData = collectionInfo;
          this.collectionData.collectionId = this.selectedCollection;
          this.collectionAAPackage = collectionInfo.collectionAAPackage;
          this.collectionPredisposingConditions = collectionInfo.collectionPredisposingConditions;
          this.collectionType = collectionInfo.collectionType;
          this.originCollectionId = collectionInfo.originCollectionId;
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
    const isNewPoam = this.poamId === 'ADDPOAM';
    const source = this.stateData.vulnerabilitySource;

    if (this.poamId === undefined || !this.poamId) {
      console.error('Failed to create POAM. POAM ID is undefined.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create POAM'
      });

      return;
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
          this.poamId,
          true, // includeApprovers
          true, // includeAssignedTeams
          false, // includeAssets
          true, // includeLabels
          true, // includeMilestones
          true, // includeAssociatedVulnerabilities
          true // includeTeamMitigations
        ),
        this.collectionsService.getCollectionPermissions(this.payload.lastCollectionAccessedId),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([poam, users, assignedTeamOptions]) => {
          this.poam = poam;

          this.dates.scheduledCompletionDate = poam.scheduledCompletionDate ? parse(poam.scheduledCompletionDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null;

          if (this.dates.scheduledCompletionDate && this.poam.extensionTimeAllowed > 0) {
            this.completionDateWithExtension = format(addDays(this.dates.scheduledCompletionDate, this.poam.extensionTimeAllowed), 'yyyy-MM-dd');
          }

          this.dates.iavComplyByDate = poam.iavComplyByDate ? parse(poam.iavComplyByDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null;
          this.dates.submittedDate = poam.submittedDate ? parse(poam.submittedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null;
          this.dates.closedDate = poam.closedDate ? parse(poam.closedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null;
          this.assignedTeamOptions = assignedTeamOptions;
          this.collectionUsers = users;

          this.poamAssignedTeams = poam.assignedTeams || [];
          this.poamApprovers = (poam.approvers || []).map((approver: any) => ({
            ...approver,
            approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
          }));
          this.poamMilestones = (poam.milestones || []).map((milestone: any) => ({
            ...milestone,
            milestoneDate: milestone.milestoneDate ? parse(milestone.milestoneDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null,
            assignedTeamId: +milestone.assignedTeamId
          }));
          this.poamLabels = poam.labels || [];
          this.poamAssociatedVulnerabilities = poam.associatedVulnerabilities || [];
          this.teamMitigations = poam.teamMitigations || [];
          this._ensureUniqueTeamMitigations();

          this.collectionApprovers = Array.isArray(this.collectionUsers) ? this.collectionUsers.filter((user: Permission) => user.accessLevel >= 3) : [];

          if (this.collectionApprovers.length > 0 && (this.poamApprovers == undefined || this.poamApprovers.length == 0)) {
            this.addDefaultApprovers();
          }

          if (this.poam.tenablePluginData) {
            this.tenablePluginData = this.poamCreationService.parsePluginData(this.poam.tenablePluginData);
          } else {
            this.poamDataService.loadSTIGsFromSTIGMAN().subscribe({
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
    this.poamDataService.getLabelData(this.selectedCollection).subscribe({
      next: (labels: any) => {
        this.labelList = labels;
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

    this.poamDataService.loadAssets(this.collectionType, this.originCollectionId, this.poam, this.payload.lastCollectionAccessedId).subscribe({
      next: (result) => {
        if (result.externalAssets) {
          this.externalAssets = result.externalAssets;
          this.compareAssetsAndAssignTeams();
        }

        if (result.assetList) {
          this.assetList = result.assetList;
        }

        if (result.poamAssets) {
          this.poamAssets = result.poamAssets;
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
    this.poamDataService.loadAssetDeltaList(this.selectedCollection).subscribe({
      next: (response) => {
        this.assetDeltaList = response || [];
      }
    });
  }

  async compareAssetsAndAssignTeams() {
    const updatedTeams = this.assetTeamMappingService.compareAssetsAndAssignTeams(this.poam, this.assetDeltaList, this.collectionType, this.poamAssets, this.externalAssets, this.assetList, this.poamAssignedTeams);

    this.poamAssignedTeams = updatedTeams;
    this.updateMilestoneTeamOptions();

    if (this.poam?.poamId && this.poam.poamId !== 'ADDPOAM') {
      this.syncTeamMitigations();
      this._ensureUniqueTeamMitigations();
    } else if (this.poamAssignedTeams && this.poamAssignedTeams.length > 0) {
      this.poamAssignedTeams.forEach((team) => {
        const existingMitigationIndex = this.teamMitigations.findIndex((m) => m.assignedTeamId === team.assignedTeamId);

        if (existingMitigationIndex === -1) {
          this.teamMitigations.push({
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            mitigationText: '',
            isActive: true
          });
        }
      });
      this._ensureUniqueTeamMitigations();
    }
  }

  async createNewACASPoam(): Promise<void> {
    try {
      const collectionInfo = {
        collectionId: this.payload.lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewACASPoam(this.stateData, collectionInfo, this.payload.userId);

      this.dates = result.dates;
      this.tenableVulnResponse = result.tenableVulnResponse;
      this.tenablePluginData = result.tenablePluginData;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = (result.poamApprovers || []).map((approver: any) => ({
        ...approver,
        approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
      }));
      this.poam = result.poam;
      this.teamMitigations = [];
      this.cdr.detectChanges();
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
        collectionId: this.payload.lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewSTIGManagerPoam(this.stateData, collectionInfo, this.payload.userId);

      this.dates = result.dates;
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = (result.poamApprovers || []).map((approver: any) => ({
        ...approver,
        approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
      }));
      this.poam = result.poam;
      this.teamMitigations = [];
      this.cdr.detectChanges();
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
        collectionId: this.payload.lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewPoam(collectionInfo, this.payload.userId);

      this.dates = result.dates;
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = (result.poamApprovers || []).map((approver: any) => ({
        ...approver,
        approvedDate: approver.approvedDate ? parse(approver.approvedDate.split('T')[0], 'yyyy-MM-dd', new Date()) : null
      }));
      this.poam = result.poam;
      this.teamMitigations = [];
      this.cdr.detectChanges();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create new POAM: ${getErrorMessage(error)}`
      });
    }
  }

  async addDefaultApprovers() {
    this.collectionApprovers.forEach((collectionApprover: any) => {
      const approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed'
      };

      if (approver) {
        this.poamApprovers.push(approver);
        this.poamApprovers = [...this.poamApprovers];
      }
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
        detail: 'You may not extend POAM until after it has been saved.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-extend', this.poam.poamId]);
  }

  poamApproval() {
    if (this.poam.status === 'Draft' || this.poam.poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'Approvals can not be entered until after a POAM has been submitted.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-approve', this.poam.poamId]);
  }

  poamLog() {
    if (this.poam.poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: 'POAM Log is not created until after a POAM has been saved.'
      });

      return;
    }

    this.router.navigate(['/poam-processing/poam-log', this.poam.poamId]);
  }

  savePoam(saveState: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.validateData()) {
        resolve(false);

        return;
      }

      this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate ? (typeof this.dates.scheduledCompletionDate === 'string' ? this.dates.scheduledCompletionDate : format(this.dates.scheduledCompletionDate, 'yyyy-MM-dd')) : null;

      this.poam.submittedDate = this.dates.submittedDate ? (typeof this.dates.submittedDate === 'string' ? this.dates.submittedDate : format(this.dates.submittedDate, 'yyyy-MM-dd')) : null;

      this.poam.iavComplyByDate = this.dates.iavComplyByDate ? (typeof this.dates.iavComplyByDate === 'string' ? this.dates.iavComplyByDate : format(this.dates.iavComplyByDate, 'yyyy-MM-dd')) : null;
      this.poam.closedDate = this.dates.closedDate ? (typeof this.dates.closedDate === 'string' ? this.dates.closedDate : format(this.dates.closedDate, 'yyyy-MM-dd')) : null;
      this.poam.requiredResources = this.poam.requiredResources ? this.poam.requiredResources : '';
      this.poam.isGlobalFinding = this.poam.isGlobalFinding ?? false;

      if (this.poam.status === 'Closed') {
        this.poam.closedDate = format(new Date(), 'yyyy-MM-dd');
      }

      const poamToSubmit = { ...this.poam };

      if (this.poamAssignedTeams && this.poamAssignedTeams.length > 0) {
        poamToSubmit.assignedTeams = this.poamAssignedTeams
          .filter((team) => team.assignedTeamId)
          .map((team) => ({
            assignedTeamId: +team.assignedTeamId,
            automated: team.automated || false
          }));
      } else {
        poamToSubmit.assignedTeams = [];
      }

      if (this.poamAssets && this.poamAssets.length > 0) {
        poamToSubmit.assets = this.poamAssets.filter((asset) => asset.assetId || asset.assetName).map((asset) => (asset.assetId ? { assetId: asset.assetId } : { assetName: asset.assetName }));
      } else {
        poamToSubmit.assets = [];
      }

      if (this.poamApprovers && this.poamApprovers.length > 0) {
        poamToSubmit.approvers = this.poamApprovers
          .filter((approver) => approver.userId)
          .map((approver) => ({
            userId: approver.userId,
            approvalStatus: approver.approvalStatus || 'Not Reviewed',
            comments: approver.comments || '',
            approvedDate: approver.approvedDate ? (typeof approver.approvedDate === 'string' ? approver.approvedDate : format(approver.approvedDate, 'yyyy-MM-dd')) : null
          }));
      } else {
        poamToSubmit.approvers = [];
      }

      if (this.poamLabels && this.poamLabels.length > 0) {
        poamToSubmit.labels = this.poamLabels.filter((label) => label.labelId).map((label) => ({ labelId: label.labelId }));
      } else {
        poamToSubmit.labels = [];
      }

      if (this.poamMilestones && this.poamMilestones.length > 0) {
        poamToSubmit.milestones = this.poamMilestones
          .filter((milestone) => milestone.milestoneComments)
          .map((milestone) => ({
            milestoneDate: milestone.milestoneDate ? (typeof milestone.milestoneDate === 'string' ? milestone.milestoneDate : format(milestone.milestoneDate, 'yyyy-MM-dd')) : null,
            milestoneComments: milestone.milestoneComments || null,
            milestoneStatus: milestone.milestoneStatus || 'Pending',
            assignedTeamId: milestone.assignedTeamId || null
          }));
      } else {
        poamToSubmit.milestones = [];
      }

      if (this.poamAssociatedVulnerabilities && this.poamAssociatedVulnerabilities.length > 0) {
        const normalizedVulnerabilities = this.poamAssociatedVulnerabilities.map((vuln) => (typeof vuln === 'string' ? vuln : typeof vuln === 'object' && vuln.associatedVulnerability ? vuln.associatedVulnerability : vuln)).filter((vuln) => vuln);

        poamToSubmit.associatedVulnerabilities = normalizedVulnerabilities;
      } else {
        poamToSubmit.associatedVulnerabilities = [];
      }

      if (this.teamMitigations && this.teamMitigations.length > 0) {
        poamToSubmit.teamMitigations = this.teamMitigations
          .filter((mitigation) => mitigation.assignedTeamId)
          .map((mitigation) => ({
            assignedTeamId: mitigation.assignedTeamId,
            mitigationText: mitigation.mitigationText || '',
            isActive: mitigation.isActive !== undefined ? mitigation.isActive : true
          }));
      } else {
        poamToSubmit.teamMitigations = [];
      }

      if (poamToSubmit.poamId === 'ADDPOAM') {
        poamToSubmit.poamId = 0;

        this.poamService.postPoam(poamToSubmit).subscribe({
          next: (res) => {
            if (res.null || (res.null == 'null' && !saveState)) {
              this.messageService.add({
                severity: 'error',
                summary: 'Information',
                detail: 'Unexpected error adding POAM'
              });
              resolve(false);
            } else {
              this.poam.poamId = res.poamId;
              this.poamId = res.poamId;
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
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Unexpected error: ${getErrorMessage(error)}`
            });
            resolve(false);
          }
        });
      } else {
        this.poamService.updatePoam(poamToSubmit).subscribe({
          next: (data) => {
            this.poam = data;

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
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to update POAM: ${getErrorMessage(error)}`
            });
            resolve(false);
          }
        });
      }
    });
  }

  private updateLocalReferences(poamId: number) {
    if (this.poamAssets) {
      this.poamAssets.forEach((asset) => (asset.poamId = poamId));
    }

    if (this.poamAssignedTeams) {
      this.poamAssignedTeams.forEach((team) => (team.poamId = poamId));
    }

    if (this.poamApprovers) {
      this.poamApprovers.forEach((approver) => (approver.poamId = poamId));
    }

    if (this.poamLabels) {
      this.poamLabels.forEach((label) => (label.poamId = poamId));
    }

    if (this.poamMilestones) {
      this.poamMilestones.forEach((milestone) => (milestone.poamId = poamId));
    }

    if (this.teamMitigations) {
      this.teamMitigations.forEach((mitigation) => (mitigation.poamId = poamId));
    }
  }

  onStigSelected(event: any) {
    this.poam.vulnerabilityTitle = event.value.title;
    this.poam.stigBenchmarkId = event.value.benchmarkId;
  }

  onMitigationGenerated(event: { mitigation: string; teamId?: number }) {
    if (this.poam.isGlobalFinding || !event.teamId) {
      this.poam.mitigations = event.mitigation;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    } else {
      const teamMitigation = this.teamMitigations.find((m) => m.assignedTeamId === event.teamId);

      if (teamMitigation) {
        teamMitigation.mitigationText = event.mitigation;
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
    const milestonesInEditMode = this.poamMilestones ? this.poamMilestones.filter((m) => m.editing || m.isNew) : [];

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
      this.poamValidationService.validateSubmissionRequirements(this.poam, this.teamMitigations, this.poamMilestones, this.dates),
      this.poamValidationService.validateMilestoneDates(this.poam, this.poamMilestones),
      this.poamValidationService.validateMilestoneCompleteness(this.poamMilestones)
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
      this.submitDialogVisible = true;
    }

    return true;
  }

  async confirmSubmit() {
    if (!(await this.verifySubmitPoam(false))) {
      return;
    }

    this.poam.status = 'Submitted';
    this.poam.iavComplyByDate = this.dates.iavComplyByDate ? format(this.dates.iavComplyByDate, 'yyyy-MM-dd') : null;
    this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate ? format(this.dates.scheduledCompletionDate, 'yyyy-MM-dd') : null;
    this.dates.submittedDate = new Date();
    this.poam.submittedDate = this.dates.submittedDate ? format(this.dates.submittedDate, 'yyyy-MM-dd') : null;
    await this.savePoam();
    this.submitDialogVisible = false;
    this.router.navigate(['/poam-processing/poam-manage']);
  }

  cancelSubmit() {
    this.submitDialogVisible = false;
  }

  validateScheduledCompletion() {
    const getConfigValue = (settingName: string, fallbackValue: number): number => {
      if (this.appConfigSettings) {
        const setting = this.appConfigSettings.find((config) => config.settingName === settingName);

        if (setting) {
          return parseInt(setting.settingValue, 10);
        }
      }

      return fallbackValue;
    };

    let daysToAdd: number;

    switch (this.poam.adjSeverity ? this.poam.adjSeverity : this.poam.rawSeverity) {
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

    if (!(this.accessLevel() === 4) && this.dates.scheduledCompletionDate > maxAllowedDate) {
      this.dates.scheduledCompletionDate = maxAllowedDate;
      const formattedDate = maxAllowedDate.toLocaleDateString();

      this.messageService.add({
        severity: 'warn',
        summary: 'Information',
        detail: `The scheduled completion date for ${this.poam.adjSeverity ? this.poam.adjSeverity : this.poam.rawSeverity} POAMs must not exceed ${daysToAdd} days. The scheduled completion date has been reverted to ${formattedDate}`
      });
    }
  }

  validateData(): boolean {
    const result = this.poamValidationService.validateData(this.poam);

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
    this.poamAssets = assets;
    this.compareAssetsAndAssignTeams();
  }

  handleLabelsChanged(labels: any[]) {
    this.poamLabels = labels;
  }

  handleMilestonesChanged(milestones: any[]) {
    this.poamMilestones = milestones;

    this.poamMilestones.forEach((milestone) => {
      if (milestone.milestoneDate) {
        if (milestone.milestoneDate instanceof Date) {
          milestone.milestoneDate = format(milestone.milestoneDate, 'yyyy-MM-dd');
        }
      }
    });
  }

  handleApproversChanged(approvers: any[]) {
    this.poamApprovers = approvers;
  }

  handleAssociatedVulnerabilitiesChanged(vulnerabilities: any[]) {
    this.poamAssociatedVulnerabilities = vulnerabilities;
  }

  handleTeamsChanged(event: { teams: any[]; action: string; team?: any }) {
    this.poamAssignedTeams = event.teams;
    this.updateMilestoneTeamOptions();

    if (event.action === 'added' && event.team?.assignedTeamId) {
      const existingMitigationIndex = this.teamMitigations.findIndex((m) => m.assignedTeamId === event.team.assignedTeamId);

      if (existingMitigationIndex === -1) {
        this.teamMitigations.push({
          assignedTeamId: event.team.assignedTeamId,
          assignedTeamName: event.team.assignedTeamName,
          mitigationText: '',
          isActive: true
        });
      } else {
        this.teamMitigations[existingMitigationIndex].isActive = true;
        this.teamMitigations[existingMitigationIndex].assignedTeamName = event.team.assignedTeamName;
      }

      if (!this.poam.isGlobalFinding && this.teamMitigations.filter((m) => m.isActive).length === 1) {
        this.activeTabIndex = 0;
      }
    } else if (event.action === 'deleted' && event.team?.assignedTeamId) {
      const mitigationIndex = this.teamMitigations.findIndex((m) => m.assignedTeamId === event.team.assignedTeamId);

      if (mitigationIndex > -1) {
        this.teamMitigations[mitigationIndex].isActive = false;

        if (!this.poam.isGlobalFinding && this.activeTabIndex === mitigationIndex) {
          const activeTeams = this.teamMitigations.filter((m) => m.isActive);

          this.activeTabIndex = activeTeams.length > 0 ? 0 : 0;
        }
      }
    }

    this._ensureUniqueTeamMitigations();

    if (this.poam && event.action !== 'save-request') {
      this.poam.assignedTeams = this.poamAssignedTeams
        .filter((team) => team.assignedTeamId)
        .map((team) => ({
          assignedTeamId: +team.assignedTeamId,
          automated: team.automated || false
        }))
        .filter((team, index, self) => index === self.findIndex((t) => t.assignedTeamId === team.assignedTeamId));
    }

    if (!this.poam.isGlobalFinding) {
      const activeTeams = this.teamMitigations.filter((m) => m.isActive);

      if (this.activeTabIndex >= activeTeams.length && activeTeams.length > 0) {
        this.activeTabIndex = 0;
      }
    }
  }

  updateMilestoneTeamOptions() {
    if (!this.poamAssignedTeams || !this.assignedTeamOptions) {
      this.milestoneTeamOptions = [];

      return;
    }

    const currentAssignedTeams = Array.isArray(this.poamAssignedTeams) ? this.poamAssignedTeams : [];

    const activeTeamIds = currentAssignedTeams.filter((team) => team.isActive !== false).map((team) => team.assignedTeamId);

    const filteredTeams = (this.assignedTeamOptions || []).filter((teamOption: any) => activeTeamIds.includes(teamOption.assignedTeamId));

    this.milestoneTeamOptions = [...filteredTeams];
  }

  loadTeamMitigations() {
    if (!this.poam?.poamId || this.poam.poamId === 'ADDPOAM') {
      this._ensureUniqueTeamMitigations();

      return;
    }

    this.poamMitigationService.loadTeamMitigations(this.poam.poamId).subscribe({
      next: async (mitigations) => {
        this.teamMitigations = mitigations || [];
        this._ensureUniqueTeamMitigations();

        const needsInitialization = this.teamMitigations.length === 0 && this.poamAssignedTeams && this.poamAssignedTeams.length > 0;
        const needsSync = this.teamMitigations.length > 0 && this.poamAssignedTeams && this.poamAssignedTeams.length > 0;

        if (needsInitialization) {
          await this.initializeTeamMitigations();
        } else if (needsSync) {
          this.syncTeamMitigations();
        }

        this._ensureUniqueTeamMitigations();

        if (this.activeTabIndex > 0 && this.activeTabIndex > this.teamMitigations.length) {
          this.activeTabIndex = 0;
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load team mitigations: ${getErrorMessage(error)}`
        });
        this._ensureUniqueTeamMitigations();
      }
    });
  }

  syncTeamMitigations() {
    if (!this.poam || !this.poamAssignedTeams || !this.teamMitigations) {
      console.warn('Cannot sync team mitigations: Missing required data.');

      return;
    }

    this.poamMitigationService.syncTeamMitigations(this.poam, this.poamAssignedTeams, this.teamMitigations);
  }

  saveTeamMitigation(teamMitigation: any) {
    if (!this.poam || !teamMitigation || !teamMitigation.assignedTeamId) {
      console.error('Cannot save team mitigation: Missing POAM or team mitigation data.');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot save, missing data.' });

      return;
    }

    this.mitigationSaving = true;
    this.poamMitigationService.saveTeamMitigation(this.poam, teamMitigation).subscribe({
      next: () => {
        this.mitigationSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Mitigation for ${teamMitigation.assignedTeamName} saved successfully`
        });
      },
      error: (error) => {
        this.mitigationSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to save team mitigation: ${getErrorMessage(error)}`
        });
      }
    });
  }

  async initializeTeamMitigations() {
    this.teamMitigations = await this.poamMitigationService.initializeTeamMitigations(this.poam, this.poamAssignedTeams, this.teamMitigations);
  }

  onGlobalFindingToggle(): void {
    if (this.poam.isGlobalFinding) {
      this.activeTabIndex = 0;
      this.messageService.add({
        severity: 'info',
        summary: 'Global Finding Mode',
        detail: 'Team-specific mitigations are now hidden. Use the global mitigation section below.'
      });
    } else {
      if (this.teamMitigations && this.teamMitigations.length > 0) {
        this.activeTabIndex = 0;
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Team Assignment Required',
          detail: 'Please assign teams to this POAM in the Personnel section to enter team-specific mitigations, or enable Global Finding mode.'
        });
      }
    }
  }

  onTabChange(event: any): void {
    if (this.poam.isGlobalFinding && event.index !== 0) {
      setTimeout(() => (this.activeTabIndex = 0), 0);

      return;
    }

    if (!this.poam.isGlobalFinding && this.teamMitigations) {
      const maxIndex = this.teamMitigations.length - 1;

      if (event.index > maxIndex) {
        setTimeout(() => (this.activeTabIndex = 0), 0);
      }
    }
  }

  openIavLink(iavmNumber: string) {
    window.open(`https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavmNumber}`, '_blank');
  }

  searchStigTitles(event: any) {
    const query = event?.query?.toLowerCase() || '';

    if (!this.stigmanSTIGs) {
      this.filteredStigmanSTIGs = [];

      return;
    }

    this.filteredStigmanSTIGs = this.stigmanSTIGs.filter((stig: any) => stig?.title && stig.title.toLowerCase().includes(query));
  }

  loadAppConfiguration() {
    this.appConfigurationService.getAppConfiguration().subscribe({
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
    this.poamDataService.loadAAPackages().subscribe({
      next: (response) => {
        this.aaPackages = response || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load A&A Packages: ${getErrorMessage(error)}`
        });
        this.aaPackages = [];
      }
    });
  }

  onAdjSeverityChange() {
    const mappedRating = this.mappingService.getSeverityRating(this.poam.adjSeverity ?? this.poam.rawSeverity);

    this.poam.likelihood = mappedRating;
    this.poam.residualRisk = mappedRating;
  }

  deletePoam() {
    if (!this.poam || !this.poam.poamId || this.poam.poamId === 'ADDPOAM') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Delete',
        detail: 'POAM must be saved before it can be deleted.'
      });

      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete POAM ${this.poam.poamId}? This action is irreversable.`,
      header: 'Confirm POAM Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
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
              detail: `Failed to delete POAM ${this.poam.poamId}: : ${getErrorMessage(error)}`
            });
          }
        });
      }
    });
  }

  isIavmNumberValid(iavmNumber: string): boolean {
    return this.mappingService.isIavmNumberValid(iavmNumber);
  }

  confirm(options: { header: string; message: string; accept: () => void }) {
    this.confirmationService.confirm({
      message: options.message,
      header: options.header,
      icon: 'pi pi-exclamation-triangle',
      accept: options.accept
    });
  }

  private _ensureUniqueTeamMitigations(): void {
    if (this.teamMitigations && Array.isArray(this.teamMitigations)) {
      this.teamMitigations = this.teamMitigations.filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId));
    } else {
      this.teamMitigations = [];
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
