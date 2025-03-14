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
import { Component, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { addDays, format, parseISO } from 'date-fns';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { SharedService } from '../../../common/services/shared.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
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
import { PoamAttachmentsComponent } from './components/poam-attachments/poam-attachments.component';
import { TagModule } from 'primeng/tag';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { InputGroupModule } from 'primeng/inputgroup';
import { AAPackage } from '../../../common/models/aaPackage.model';
import { Permission } from '../../../common/models/permission.model';
import { ProgressBarModule } from 'primeng/progressbar';
import { PoamMitigationGeneratorComponent } from './components/poam-mitigation-generator/poam-mitigation-generator.component';
import { TabsModule } from 'primeng/tabs';
import { PoamApproversComponent } from './components/poam-approvers/poam-approvers.component';
import { PoamAssetsComponent } from './components/poam-assets/poam-assets.component';
import { PoamAssociatedVulnerabilitiesComponent } from './components/poam-associated-vulnerabilities/poam-associated-vulnerabilities.component';
import { PoamMilestonesComponent } from './components/poam-milestones/poam-milestones.component';
import { PoamLabelsComponent } from './components/poam-labels/poam-labels.component';
import { PoamTeamsComponent } from './components/poam-teams/poam-teams.component';
import { PoamVariableMappingService } from './services/poam-variable-mapping.service';
import { AssetData, PoamDataService } from './services/poam-data.service';
import { PoamMitigationService } from './services/poam-mitigation.service';
import { PoamCreationService } from './services/poam-creation.service';
import { AssetTeamMappingService } from './services/asset-team-mapping.service';
import { PoamValidationService } from './services/poam-validation.service';


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
    TabsModule,
    TagModule,
    ToastModule,
    TooltipModule,
    PoamAttachmentsComponent,
    PoamMitigationGeneratorComponent,
    PoamApproversComponent,
    PoamAssetsComponent,
    PoamAssociatedVulnerabilitiesComponent,
    PoamMilestonesComponent,
    PoamLabelsComponent,
    PoamTeamsComponent,
    ProgressBarModule
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
})
export class PoamDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu!: Menu;
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
  errorDialogVisible: boolean = false;
  errorMessage: string = '';
  errorHeader: string = 'Error';
  poam: any;
  poamId: any = '';
  dates: any = {};
  completionDateWithExtension: any;
  assignedTeamOptions: any;
  collectionUsers: any;
  collectionApprovers: any = [];
  collectionBasicList: any[] = [];
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
  stateData: any;
  submitDialogVisible: boolean = false;
  user: any;
  payload: any;
  teamMitigations: any[] = [];
  milestoneTeamOptions: any[] = [];
  activeTabIndex: number = 0;
  mitigationSaving: boolean = false;
  isGlobalFinding: boolean;
  private subs = new SubSink();

  vulnerabilitySources: string[] = [
    'Assured Compliance Assessment Solution (ACAS) Nessus Scanner',
    'STIG'
  ];

  statusOptions = [
    { label: 'Draft', value: 'Draft', disabled: false },
    { label: 'Closed', value: 'Closed', disabled: false },
    { label: 'Expired', value: 'Expired', disabled: false },
    { label: 'Submitted', value: 'Submitted', disabled: true },
    { label: 'Pending CAT-I Approval', value: 'Pending CAT-I Approval', disabled: true },
    { label: 'Extension Requested', value: 'Extension Requested', disabled: true },
    { label: 'Approved', value: 'Approved', disabled: true },
    { label: 'Rejected', value: 'Rejected', disabled: true },
    { label: 'False-Positive', value: 'False-Positive', disabled: true }
  ];

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
          this.menu?.hide();
        },
      },
      {
        label: 'POAM Extension',
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
    private assignedTeamService: AssignedTeamService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    protected poamService: PoamService,
    private poamDataService: PoamDataService,
    private poamCreationService: PoamCreationService,
    private poamMitigationService: PoamMitigationService,
    private assetTeamMappingService: AssetTeamMappingService,
    private poamValidationService: PoamValidationService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router,
    private collectionsService: CollectionsService,
    private setPayloadService: PayloadService,
    private mappingService: PoamVariableMappingService,
    private location: Location
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.stateData = history.state;
      this.poamId = params['poamId'];
    });
    this.subs.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.setPayload();
    this.subs.add(
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
          if (this.selectedCollection) {
            this.getLabelData();
          }
        }
      })
    );

    this.subs.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
        if (this.selectedCollection) {
          this.getLabelData();
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
        this.poamService.getPoam(
          this.poamId,
          true,  // includeApprovers
          true,  // includeAssignedTeams
          false, // includeAssets
          true,  // includeLabels
          true,  // includeMilestones
          true,  // includeAssociatedVulnerabilities
          true   // includeTeamMitigations
        ),
        this.collectionsService.getCollectionPermissions(
          this.payload.lastCollectionAccessedId
        ),
        this.assignedTeamService.getAssignedTeams()
      ]).subscribe({
        next: ([
          poam,
          users,
          assignedTeamOptions
        ]) => {
          this.poam = poam;
          this.dates.scheduledCompletionDate = poam.scheduledCompletionDate
            ? poam.scheduledCompletionDate.split('T')[0]
            : null;

          if (this.poam.scheduledCompletionDate && this.poam.extensionTimeAllowed > 0) {
            this.completionDateWithExtension = format(addDays(
              parseISO(this.poam.scheduledCompletionDate),
              this.poam.extensionTimeAllowed
            ), 'yyyy-MM-dd');
          }
          this.dates.iavComplyByDate = poam.iavComplyByDate
            ? poam.iavComplyByDate.split('T')[0]
            : null;
          this.dates.submittedDate = poam.submittedDate ? poam.submittedDate.split('T')[0] : null;
          this.dates.closedDate = poam.closedDate ? poam.closedDate.split('T')[0] : null;
          this.assignedTeamOptions = assignedTeamOptions;
          this.collectionUsers = users;

          this.poamAssignedTeams = poam.assignedTeams || [];
          this.poamApprovers = poam.approvers || [];
          this.poamMilestones = (poam.milestones || []).map((milestone: any) => ({
            ...milestone,
            milestoneDate: milestone.milestoneDate ? milestone.milestoneDate.split('T')[0] : null,
            assignedTeamId: +milestone.assignedTeamId
          }));
          this.poamLabels = poam.labels || [];
          this.poamAssociatedVulnerabilities = poam.associatedVulnerabilities || [];
          this.teamMitigations = poam.teamMitigations || [];

          this.collectionApprovers = this.collectionUsers.filter(
            (user: Permission) => user.accessLevel >= 3
          );

          if (
            this.collectionApprovers.length > 0 &&
            (this.poamApprovers == undefined || this.poamApprovers.length == 0)
          ) {
            this.addDefaultApprovers();
          }

          if (this.poam.tenablePluginData) {
            this.tenablePluginData = this.poamCreationService.parsePluginData(this.poam.tenablePluginData);
          } else {
            this.poamDataService.loadSTIGsFromSTIGMAN().subscribe({
              next: stigmanSTIGs => {
                this.stigmanSTIGs = stigmanSTIGs;
              },
              error: (error) => {
                console.error('Error loading STIGs:', error);
              }
            });
          }
          this.loadTeamMitigations();
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

  getLabelData() {
    this.poamDataService.getLabelData(this.selectedCollection).subscribe({
      next: (labels: any) => {
        this.labelList = labels;
      },
      error: (error) => {
        console.error('Error fetching labels:', error);
      }
    });
  }

  private loadAssets() {
    this.loadingTeams.set(true);

    this.poamDataService.loadAssets(
      this.collectionType,
      this.originCollectionId,
      this.poam,
      this.payload.lastCollectionAccessedId
    ).subscribe({
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
        console.error('Error loading assets:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load assets'
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
    const updatedTeams = this.assetTeamMappingService.compareAssetsAndAssignTeams(
      this.poam,
      this.assetDeltaList,
      this.collectionType,
      this.poamAssets,
      this.externalAssets,
      this.assetList,
      this.poamAssignedTeams
    );
    this.poamAssignedTeams = updatedTeams;
    this.updateMilestoneTeamOptions();
    if (this.poam?.poamId && this.poam.poamId !== 'ADDPOAM') {
      this.syncTeamMitigations();
    }
    else if (this.poamAssignedTeams && this.poamAssignedTeams.length > 0) {
      this.poamAssignedTeams.forEach(team => {
        const hasTeamMitigation = this.teamMitigations.some(
          m => m.assignedTeamId === team.assignedTeamId
        );

        if (!hasTeamMitigation) {
          this.teamMitigations.push({
            assignedTeamId: team.assignedTeamId,
            assignedTeamName: team.assignedTeamName,
            mitigationText: '',
            isActive: true
          });
        }
      });
    }
  }

  async createNewACASPoam(): Promise<void> {
    try {
      const collectionInfo = {
        collectionId: this.payload.lastCollectionAccessedId,
        collectionAAPackage: this.collectionAAPackage,
        collectionPredisposingConditions: this.collectionPredisposingConditions
      };

      const result = await this.poamCreationService.createNewACASPoam(
        this.stateData,
        collectionInfo,
        this.payload.userId
      );

      this.poam = result.poam;
      this.dates = result.dates;
      this.tenableVulnResponse = result.tenableVulnResponse;
      this.tenablePluginData = result.tenablePluginData;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = result.poamApprovers;

    } catch (error) {
      console.error('Error in createNewACASPoam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create new POAM'
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

      const result = await this.poamCreationService.createNewSTIGManagerPoam(
        this.stateData,
        collectionInfo,
        this.payload.userId
      );

      this.poam = result.poam;
      this.dates = result.dates;
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = result.poamApprovers;

    } catch (error) {
      console.error('Error in createNewSTIGManagerPoam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create new STIG Manager POAM'
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

      const result = await this.poamCreationService.createNewPoam(
        collectionInfo,
        this.payload.userId
      );

      this.poam = result.poam;
      this.dates = result.dates;
      this.stigmanSTIGs = result.stigmanSTIGs;
      this.assignedTeamOptions = result.assignedTeamOptions;
      this.collectionUsers = result.collectionUsers;
      this.collectionApprovers = result.collectionApprovers;
      this.poamApprovers = result.poamApprovers;

    } catch (error) {
      console.error('Error in createNewPoam:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create new POAM'
      });
    }
  }

  async addDefaultApprovers() {
    this.collectionApprovers.forEach((collectionApprover: any) => {
      const approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed',
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
        detail: 'You may not extend POAM until after it has been saved.',
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
        detail:
          "Approvals can not be entered until after a POAM has been submitted.",
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
        detail:
          "POAM Log is not created until after a POAM has been saved.",
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
      this.poam.isGlobalFinding = this.poam.isGlobalFinding ?? false;

      if (this.poam.status === 'Closed') {
        this.poam.closedDate = format(new Date(), 'yyyy-MM-dd');
      }

      const poamToSubmit = { ...this.poam };

      if (this.poamAssignedTeams && this.poamAssignedTeams.length > 0) {
        poamToSubmit.assignedTeams = this.poamAssignedTeams
          .filter(team => team.assignedTeamId)
          .map(team => ({
            assignedTeamId: +team.assignedTeamId,
            automated: team.automated || false
          }));
      } else {
        poamToSubmit.assignedTeams = [];
      }

      if (this.poamAssets && this.poamAssets.length > 0) {
        poamToSubmit.assets = this.poamAssets
          .filter(asset => asset.assetId || asset.assetName)
          .map(asset => asset.assetId
            ? { assetId: asset.assetId }
            : { assetName: asset.assetName }
          );
      } else {
        poamToSubmit.assets = [];
      }

      if (this.poamApprovers && this.poamApprovers.length > 0) {
        poamToSubmit.approvers = this.poamApprovers
          .filter(approver => approver.userId)
          .map(approver => ({
            userId: approver.userId,
            approvalStatus: approver.approvalStatus || 'Not Reviewed',
            comments: approver.comments || '',
            approvedDate: approver.approvedDate ? format(new Date(approver.approvedDate), 'yyyy-MM-dd') : null
          }));
      } else {
        poamToSubmit.approvers = [];
      }

      if (this.poamLabels && this.poamLabels.length > 0) {
        poamToSubmit.labels = this.poamLabels
          .filter(label => label.labelId)
          .map(label => ({ labelId: label.labelId }));
      } else {
        poamToSubmit.labels = [];
      }

      if (this.poamMilestones && this.poamMilestones.length > 0) {
        poamToSubmit.milestones = this.poamMilestones
          .filter(milestone => milestone.milestoneComments)
          .map(milestone => ({
            milestoneDate: milestone.milestoneDate ? format(new Date(milestone.milestoneDate), 'yyyy-MM-dd') : null,
            milestoneComments: milestone.milestoneComments || null,
            milestoneStatus: milestone.milestoneStatus || 'Pending',
            assignedTeamId: milestone.assignedTeamId || null
          }));
      } else {
        poamToSubmit.milestones = [];
      }

      if (this.poamAssociatedVulnerabilities && this.poamAssociatedVulnerabilities.length > 0) {
        const normalizedVulnerabilities = this.poamAssociatedVulnerabilities.map(vuln =>
          typeof vuln === 'string' ? vuln :
            (typeof vuln === 'object' && vuln.associatedVulnerability) ? vuln.associatedVulnerability : vuln
        ).filter(vuln => vuln);

        poamToSubmit.associatedVulnerabilities = normalizedVulnerabilities;
      } else {
        poamToSubmit.associatedVulnerabilities = [];
      }

      if (this.teamMitigations && this.teamMitigations.length > 0) {
        poamToSubmit.teamMitigations = this.teamMitigations
          .filter(mitigation => mitigation.assignedTeamId)
          .map(mitigation => ({
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
              summary: 'Information',
              detail: 'Unexpected error, please try again.'
            });
            console.error('Error saving POAM:', error);
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
            console.error('Error updating POAM:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update POAM'
            });
            resolve(false);
          }
        });
      }
    });
  }

  private updateLocalReferences(poamId: number) {
    if (this.poamAssets) {
      this.poamAssets.forEach(asset => asset.poamId = poamId);
    }

    if (this.poamAssignedTeams) {
      this.poamAssignedTeams.forEach(team => team.poamId = poamId);
    }

    if (this.poamApprovers) {
      this.poamApprovers.forEach(approver => approver.poamId = poamId);
    }

    if (this.poamLabels) {
      this.poamLabels.forEach(label => label.poamId = poamId);
    }

    if (this.poamMilestones) {
      this.poamMilestones.forEach(milestone => milestone.poamId = poamId);
    }

    if (this.teamMitigations) {
      this.teamMitigations.forEach(mitigation => mitigation.poamId = poamId);
    }
  }

  onStigSelected(event: any) {
    this.poam.vulnerabilityTitle = event.value.title;
    this.poam.stigBenchmarkId = event.value.benchmarkId;
  }

  onMitigationGenerated(event: { mitigation: string, teamId?: number }) {
    if (this.poam.isGlobalFinding || !event.teamId) {
      this.poam.mitigations = event.mitigation;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    } else {
      const teamMitigation = this.teamMitigations.find(m => m.assignedTeamId === event.teamId);
      if (teamMitigation) {
        teamMitigation.mitigationText = event.mitigation;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Mitigation updated for team ${teamMitigation.assignedTeamName}`
        });
      }
    }
  }

  obtainCollectionData(background: boolean = false) {
    this.poamDataService.obtainCollectionData(this.selectedCollection, background).subscribe({
      next: (collectionInfo) => {
        this.collectionAAPackage = collectionInfo.collectionAAPackage;
        this.collectionPredisposingConditions = collectionInfo.collectionPredisposingConditions;
        this.collectionType = collectionInfo.collectionType;
        this.originCollectionId = collectionInfo.originCollectionId;
      }
    });
  }

  verifySubmitPoam(showDialog: boolean = true): boolean {
    const milestoneValidation = this.poamValidationService.validateMilestones(this.poamMilestones);
    if (!milestoneValidation.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: milestoneValidation.message
      });
      return false;
    }

    const submissionValidation = this.poamValidationService.validateSubmissionRequirements(this.poam, this.teamMitigations, this.dates);
    if (!submissionValidation.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: submissionValidation.message
      });
      return false;
    }

    if (showDialog) {
      this.submitDialogVisible = true;
    }
    return true;
  }

  async confirmSubmit() {
    if (!this.verifySubmitPoam(false)) {
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
  }

  handleLabelsChanged(labels: any[]) {
    this.poamLabels = labels;
  }

  handleMilestonesChanged(milestones: any[]) {
    this.poamMilestones = milestones;

    this.poamMilestones.forEach(milestone => {
      if (milestone.milestoneDate) {
        milestone.milestoneDate = typeof milestone.milestoneDate === 'string'
          ? milestone.milestoneDate
          : format(milestone.milestoneDate, 'yyyy-MM-dd');
      }
    });
  }

  handleApproversChanged(approvers: any[]) {
    this.poamApprovers = approvers;
  }

  handleAssociatedVulnerabilitiesChanged(vulnerabilities: any[]) {
    this.poamAssociatedVulnerabilities = vulnerabilities;
  }

  handleTeamsChanged(event: { teams: any[], action: string, team?: any }) {
    this.poamAssignedTeams = event.teams;
    this.updateMilestoneTeamOptions();

    if (event.action === 'added' && event.team?.assignedTeamId) {
      const hasTeamMitigation = this.teamMitigations.some(
        m => m.assignedTeamId === event.team.assignedTeamId
      );

      if (!hasTeamMitigation) {
        this.teamMitigations.push({
          assignedTeamId: event.team.assignedTeamId,
          assignedTeamName: event.team.assignedTeamName,
          mitigationText: '',
          isActive: true
        });
      }

      this.updateMilestoneTeamOptions();
    }

    if (this.poam && event.action !== 'save-request') {
      this.poam.assignedTeams = this.poamAssignedTeams
        .filter(team => team.assignedTeamId)
        .map(team => ({
          assignedTeamId: +team.assignedTeamId,
          automated: team.automated || false
        }));
    }

    if (event.action === 'added' && event.team?.assignedTeamId) {
      const hasTeamMitigation = this.teamMitigations.some(
        m => m.assignedTeamId === event.team.assignedTeamId
      );

      if (!hasTeamMitigation) {
        this.teamMitigations.push({
          assignedTeamId: event.team.assignedTeamId,
          assignedTeamName: event.team.assignedTeamName,
          mitigationText: '',
          isActive: true
        });
      }
    }
    else if (event.action === 'deleted' && event.team?.assignedTeamId) {
      const mitigation = this.teamMitigations.find(
        m => m.assignedTeamId === event.team.assignedTeamId
      );

      if (mitigation) {
        mitigation.isActive = false;

        if (this.activeTabIndex > 0) {
          const teamIndex = this.teamMitigations.findIndex(
            t => t.assignedTeamId === event.team.assignedTeamId
          );
          if (this.activeTabIndex === teamIndex + 1) {
            this.activeTabIndex = 0;
          }
        }
      }
    }

    if (this.activeTabIndex > 0 && this.activeTabIndex > this.teamMitigations.length) {
      this.activeTabIndex = 0;
    }
  }

  updateMilestoneTeamOptions() {
    if (!this.poamAssignedTeams || !this.assignedTeamOptions) {
      this.milestoneTeamOptions = [];
      return;
    }

    const activeTeamIds = this.poamAssignedTeams
      .filter(team => team.isActive !== false)
      .map(team => team.assignedTeamId);

    const filteredTeams = this.assignedTeamOptions
      .filter(team => activeTeamIds.includes(team.assignedTeamId));

    this.milestoneTeamOptions = [...filteredTeams];
  }

  loadTeamMitigations() {
    if (!this.poam?.poamId || this.poam.poamId === 'ADDPOAM') {
      return;
    }

    this.poamMitigationService.loadTeamMitigations(this.poam.poamId).subscribe({
      next: (mitigations) => {
        this.teamMitigations = mitigations;

        if (this.teamMitigations.length === 0 &&
          this.poamAssignedTeams &&
          this.poamAssignedTeams.length > 0) {
          this.initializeTeamMitigations();
        } else {
          this.syncTeamMitigations();
        }
      },
      error: (error) => {
        console.error('Error loading team mitigations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load team mitigations'
        });
      }
    });
  }

  syncTeamMitigations() {
    this.poamMitigationService.syncTeamMitigations(
      this.poam,
      this.poamAssignedTeams,
      this.teamMitigations
    );
  }

  saveTeamMitigation(teamMitigation: any) {
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
        console.error('Error saving team mitigation:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save team mitigation'
        });
      }
    });
  }

  async initializeTeamMitigations() {
    this.teamMitigations = await this.poamMitigationService.initializeTeamMitigations(
      this.poam,
      this.poamAssignedTeams,
      this.teamMitigations
    );

    if (this.activeTabIndex > 0 && this.activeTabIndex > this.teamMitigations.length) {
      this.activeTabIndex = 0;
    }
  }

  onGlobalFindingToggle(): void {
    if (this.poam.isGlobalFinding) {
      this.activeTabIndex = 0;

      if (!this.poam.isGlobalFinding) {
        this.messageService.add({
          severity: 'info',
          summary: 'Global Finding Mode',
          detail: 'Team-specific mitigations are now hidden. They will be preserved but not displayed.'
        });
      }
    }
  }

  onTabChange(_event: any): void {
    if (this.poam.isGlobalFinding && this.activeTabIndex !== 0) {
      this.activeTabIndex = 0;
    }
  }

  openIavLink(iavmNumber: string) {
    window.open(
      `https://vram.navy.mil/standalone_pages/iav_display?notice_number=${iavmNumber}`,
      '_blank'
    );
  }

  searchStigTitles(event: any) {
    const query = event.query.toLowerCase();
    this.filteredStigmanSTIGs = this.stigmanSTIGs.filter((stig: any) =>
      stig.title.toLowerCase().includes(query)
    );
  }

  loadAAPackages() {
    this.poamDataService.loadAAPackages().subscribe({
      next: (response) => {
        this.aaPackages = response || [];
      }
    });
  }

  onAdjSeverityChange() {
    const mappedRating = this.mappingService.getSeverityRating(this.poam.adjSeverity ?? this.poam.rawSeverity);
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

  isIavmNumberValid(iavmNumber: string): boolean {
  return this.mappingService.isIavmNumberValid(iavmNumber);
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
  }
}
