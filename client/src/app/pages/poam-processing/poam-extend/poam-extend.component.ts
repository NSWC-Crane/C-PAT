/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepperModule } from 'primeng/stepper';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, Subject, catchError, forkJoin, from, of, switchMap, tap } from 'rxjs';
import { MultiSelectDirective } from '../../../common/directives/multi-select.directive';
import { approvalLevelForSeverity } from '../../../common/constants/poam-severity';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssignedTeamService } from '../../admin-processing/assigned-teams/assigned-teams.service';
import { LabelService } from '../../labels/labels.service';
import { PoamMitigationGeneratorComponent } from '../poam-details/components/poam-mitigation-generator/poam-mitigation-generator.component';
import { PoamMitigationService } from '../poam-details/services/poam-mitigation.service';
import { applyTeamSyncChanges } from '../poam-details/services/team-sync-changes';
import { PoamExtensionService } from '../poam-extend/poam-extend.service';
import { PoamService } from '../poams.service';

@Component({
  selector: 'cpat-poam-extend',
  templateUrl: './poam-extend.component.html',
  styleUrls: ['./poam-extend.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    CheckboxModule,
    DatePicker,
    DialogModule,
    ProgressBarModule,
    SelectModule,
    MultiSelectDirective,
    SplitButtonModule,
    InputTextModule,
    TabsModule,
    TextareaModule,
    TooltipModule,
    StepperModule,
    TableModule,
    TagModule,
    ConfirmDialogModule,
    DatePipe,
    PoamMitigationGeneratorComponent
  ],
  providers: [ConfirmationService]
})
export class PoamExtendComponent implements OnInit {
  readonly table = viewChild<Table>('dt');
  private readonly assignedTeamService = inject(AssignedTeamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly poamService = inject(PoamService);
  private readonly sharedService = inject(SharedService);
  private readonly poamExtensionService = inject(PoamExtensionService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly labelService = inject(LabelService);
  private readonly messageService = inject(MessageService);
  private readonly poamMitigationService = inject(PoamMitigationService);
  private readonly setPayloadService = inject(PayloadService);
  private readonly destroyRef = inject(DestroyRef);

  selectedCollection: any;
  user: any;
  payload: any;
  readonly accessLevel = signal<number>(0);
  readonly completionDateWithExtension = signal<any>(undefined);
  labelList: any;
  readonly assignedTeamOptions = signal<any>(undefined);
  readonly poamAssignedTeams = signal<any[]>([]);
  readonly teamMitigations = signal<any[]>([]);
  readonly activeTabIndex = signal<number>(0);
  readonly mitigationSaving = signal<boolean>(false);
  aiEnabled: boolean = CPAT.Env.features.aiEnabled;
  readonly displayExtensionDialog = signal<boolean>(false);
  readonly poam = signal<any>(undefined);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly restartExtensionPeriod = signal<boolean>(false);
  private readonly serverToday = signal<string | null>(null);
  private readonly loadedExtensionDays = signal<number | null>(0);
  private loadedExtensionDeadline: string | undefined;
  private loadGeneration = 0;
  private readonly teamMitigationsReload$ = new Subject<number>();
  poamId: any;
  poamLabels: [{ poamId: number; labelId: number; labelName: string }] | undefined;
  readonly poamMilestones = signal<any[]>([]);
  clonedMilestones: { [s: string]: any } = {};
  private tempIdSequence = 0;
  milestoneStatusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Delayed', value: 'Delayed' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Archived', value: 'Archived' }
  ];
  readonly extensionHistory = signal<any[]>([]);
  readonly extensionJustification = signal<string>('');
  extensionJustificationPlaceholder: string = 'Select from the available options, modify a provided option, or provide a custom justification';
  justifications: string[] = [
    'Security Vulnerability Remediation - More Time Required',
    'Unforeseen Technical/Infrastructure Challenges',
    'Third-Party/Vendor Delays',
    'External Non-Crane Support Requested',
    'Project Scope Changes',
    'Resource Constraints',
    'Procurement Required',
    'Unanticipated Risks'
  ];
  filteredJustifications: string[] = [];
  extensionTimeOptions = [
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '21 Days', value: 21 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
    { label: '180 Days', value: 180 },
    { label: '365 Days', value: 365 }
  ];

  rejectButtonItems = [
    {
      label: 'Reject (With comments)',
      command: () => {
        this.router.navigate(['/poam-processing/poam-approve', this.poam().poamId]);
      }
    }
  ];

  selectableRatingOptions = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' }
  ];

  readonly invalidExtensionFields = computed<Set<string>>(() => {
    const invalid = new Set<string>();
    const poam = this.poam();

    if (!poam) {
      return invalid;
    }

    if (!poam.extensionDays) {
      invalid.add('extensionDays');
    }

    if (!this.extensionJustification()) {
      invalid.add('extensionJustification');
    }

    if (poam.isGlobalFinding) {
      if (!poam.mitigations) {
        invalid.add('mitigations');
      }
    } else if (this.poamAssignedTeams().length > 0) {
      this.teamMitigations()
        .filter((m) => m.isActive)
        .forEach((m) => {
          if (!m.mitigationText?.trim()) {
            invalid.add(`teamMitigation:${m.assignedTeamId}`);
          }
        });
    } else if (!poam.mitigations) {
      invalid.add('mitigations');
    }

    return invalid;
  });

  readonly requiredApprovalAccessLevel = computed<number>(() => approvalLevelForSeverity(this.poam()?.rawSeverity));

  readonly canApproveExtension = computed<boolean>(() => this.accessLevel() >= this.requiredApprovalAccessLevel());

  readonly hasPersistedExtensionDays = computed<boolean>(() => (this.loadedExtensionDays() ?? 0) > 0);

  readonly hasPersistedExtension = computed<boolean>(() => this.hasPersistedExtensionDays() || this.poam()?.status === 'Extension Requested');

  readonly extensionPeriodExpired = computed<boolean>(() => {
    const poam = this.poam();

    if (!poam?.extensionDeadline) {
      return false;
    }

    const deadline = this.toLocalDate(poam.extensionDeadline);

    return !!deadline && deadline < this.today();
  });

  readonly deleteExtensionRevertsStatus = computed<boolean>(() => this.poam()?.status === 'Extension Requested');

  readonly deleteExtensionTooltip = computed<string>(() =>
    this.deleteExtensionRevertsStatus()
      ? 'Clears the requested extension days, the extension deadline, and the extension justification. The POAM status returns to Submitted, any of its approvers who hold approver-level access on this collection are notified, and the POAM re-enters normal expiry processing, so a POAM whose scheduled completion date has already passed may be marked Expired.'
      : 'Clears the requested extension days, the extension deadline, and the extension justification. The POAM status is not changed, but with the extension deadline removed the POAM re-enters normal expiry processing, so a POAM whose scheduled completion date has already passed may be marked Expired.'
  );

  readonly editingRowKeys = computed<Record<string, boolean>>(() => {
    const keys: Record<string, boolean> = {};

    for (const milestone of this.poamMilestones()) {
      if (milestone.editing) {
        keys[String(milestone.milestoneId)] = true;
      }
    }

    return keys;
  });

  isExtensionInvalid(field: string): boolean {
    return this.invalidExtensionFields().has(field);
  }

  protected onRestartExtensionPeriodChange(checked: boolean): void {
    this.restartExtensionPeriod.set(checked);

    if (checked) {
      this.patchPoam({ extensionDeadline: null });
    } else {
      this.patchPoam({ extensionDays: this.loadedExtensionDays(), extensionDeadline: this.loadedExtensionDeadline });
    }

    this.computeDeadlineWithExtension();
  }

  protected patchPoam(partial: Record<string, any>): void {
    this.poam.update((poam: any) => ({ ...poam, ...partial }));
  }

  protected patchTeamMitigation(assignedTeamId: number, mitigationText: string): void {
    this.teamMitigations.update((mitigations: any[]) => mitigations.map((m) => (m.assignedTeamId === assignedTeamId ? { ...m, mitigationText } : m)));
  }

  ngOnInit() {
    this.openModal();
    this.subscribeTeamMitigationsReload();
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.poamId = params['poamId'];
    });
    this.sharedService.selectedCollection.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((collectionId) => {
      this.selectedCollection = collectionId;
    });
    this.setPayload();
  }

  setPayload() {
    this.setPayloadService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user = user;
    });
    this.setPayloadService.payload$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((payload) => {
      this.payload = payload;
    });
    this.setPayloadService.accessLevel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((level) => {
      this.accessLevel.set(level);

      if (level > 0) {
        this.getData();
      }
    });
  }

  getData() {
    const gen = ++this.loadGeneration;

    this.loading.set(true);
    forkJoin([
      this.poamService.getPoam(this.poamId),
      this.poamExtensionService.getPoamExtension(this.poamId),
      this.poamService.getPoamMilestones(this.poamId),
      this.assignedTeamService.getAssignedTeams(),
      this.poamService.getPoamAssignedTeams(this.poamId)
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([poamData, extension, poamMilestones, assignedTeamOptions, poamAssignedTeams]: any) => {
          if (gen !== this.loadGeneration) {
            return;
          }

          this.clonedMilestones = {};

          const table = this.table();

          if (table) {
            table.editingRowKeys = {};
          }

          this.poamMilestones.set(this.mapMilestones(poamMilestones));

          this.assignedTeamOptions.set(assignedTeamOptions);
          this.poamAssignedTeams.set(poamAssignedTeams || []);

          const extensionData = extension?.length > 0 ? extension[0] : null;

          this.serverToday.set(extensionData?.serverToday ?? null);
          this.loadedExtensionDays.set(extensionData ? extensionData.extensionDays : 0);
          this.loadedExtensionDeadline = extensionData?.extensionDeadline ? extensionData.extensionDeadline.split('T')[0] : undefined;
          this.restartExtensionPeriod.set((this.loadedExtensionDays() ?? 0) <= 0);

          this.poam.set({
            poamId: +poamData.poamId,
            status: poamData.status,
            isGlobalFinding: poamData.isGlobalFinding ?? false,
            vulnerabilitySource: poamData.vulnerabilitySource,
            vulnerabilityTitle: poamData.vulnerabilityTitle,
            vulnerabilityId: poamData.vulnerabilityId,
            stigCheckData: poamData.stigCheckData,
            tenablePluginData: poamData.tenablePluginData,
            rawSeverity: poamData.rawSeverity,
            adjSeverity: poamData.adjSeverity,
            ownerName: poamData.ownerName,
            submitterName: poamData.submitterName,
            mitigations: poamData.mitigations,
            requiredResources: poamData.requiredResources,
            residualRisk: poamData.residualRisk,
            likelihood: poamData.likelihood,
            localImpact: poamData.localImpact,
            impactDescription: poamData.impactDescription,
            extensionDays: extensionData ? extensionData.extensionDays : 0,
            extensionDeadline: this.loadedExtensionDeadline,
            extensionJustification: extensionData ? extensionData.extensionJustification : '',
            scheduledCompletionDate: extensionData?.scheduledCompletionDate ? extensionData.scheduledCompletionDate.split('T')[0] : ''
          });

          this.extensionHistory.set(extensionData?.extensionHistory || []);
          this.extensionJustification.set(this.poam().extensionJustification);
          this.computeDeadlineWithExtension();
          this.loading.set(false);
          this.loadTeamMitigations();
          this.getPoamLabels();
        },
        error: (error) => {
          if (gen !== this.loadGeneration) {
            return;
          }

          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load POAM extension data: ${getErrorMessage(error)}`
          });
        }
      });
  }

  private mapMilestones(poamMilestones: any[]): any[] {
    return (poamMilestones || []).map((milestone: any) => ({
      ...milestone,
      milestoneDate: milestone.milestoneDate ? milestone.milestoneDate.split('T')[0] : null,
      milestoneChangeDate: milestone.milestoneChangeDate ? milestone.milestoneChangeDate.split('T')[0] : null,
      assignedTeamIds: milestone.assignedTeamIds || milestone.assignedTeams?.map((t: any) => t.assignedTeamId) || []
    }));
  }

  private refreshMilestones(): void {
    this.poamService
      .getPoamMilestones(this.poamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (poamMilestones: any) => this.reconcileMilestones(this.mapMilestones(poamMilestones)),
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to refresh the milestone list: ${getErrorMessage(error)}. Reload the page to see the current milestones.`
          });
        }
      });
  }

  private isMilestonePending(milestone: any): boolean {
    return milestone?.isNew === true || milestone?.editing === true || this.table()?.isRowEditing(milestone) === true;
  }

  private reconcileMilestones(serverMilestones: any[]): void {
    const pending = new Map<string, any>();

    for (const milestone of this.poamMilestones()) {
      if (this.isMilestonePending(milestone)) {
        pending.set(String(milestone.milestoneId), milestone);
      }
    }

    const serverKeys = new Set(serverMilestones.map((milestone) => String(milestone.milestoneId)));
    const merged = serverMilestones.map((milestone) => pending.get(String(milestone.milestoneId)) ?? milestone);
    const orphans = [...pending].filter(([key]) => !serverKeys.has(key)).map(([, milestone]) => milestone);
    const next = [...orphans, ...merged];
    const liveKeys = new Set(next.map((milestone) => String(milestone.milestoneId)));

    for (const key of Object.keys(this.clonedMilestones)) {
      if (!liveKeys.has(key)) {
        delete this.clonedMilestones[key];
      }
    }

    this.poamMilestones.set(next);
  }

  onAddNewMilestone() {
    const newMilestone = {
      milestoneId: this.generateTempId(),
      milestoneComments: null,
      milestoneDate: null,
      milestoneChangeComments: null,
      milestoneChangeDate: new Date(),
      milestoneStatus: 'In Progress',
      assignedTeamIds: [],
      isNew: true,
      editing: true
    };

    this.poamMilestones.set([newMilestone, ...this.poamMilestones()]);
    this.onRowEditInit(newMilestone);

    const table = this.table();

    if (table) {
      table.initRowEdit(newMilestone);
    }
  }

  generateTempId(): string {
    this.tempIdSequence = Math.max(Date.now(), this.tempIdSequence + 1);

    return 'temp_' + this.tempIdSequence;
  }

  private isTempMilestoneId(milestoneId: any): boolean {
    return typeof milestoneId === 'string' && milestoneId.startsWith('temp_');
  }

  onRowEditInit(milestone: any) {
    this.clonedMilestones[milestone.milestoneId] = { ...milestone, editing: false };
    milestone.editing = true;
    this.poamMilestones.set([...this.poamMilestones()]);
  }

  async onRowEditSave(milestone: any) {
    if (!this.validateMilestoneFields(milestone)) return;
    if (!this.validateMilestoneDates(milestone)) return;

    if (!milestone.isNew && this.isTempMilestoneId(milestone.milestoneId)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'This milestone is out of sync with the server. Reload the page before editing it.'
      });

      return;
    }

    try {
      if (milestone.isNew) {
        await this.addNewMilestone(milestone);
      } else {
        await this.updateExistingMilestone(milestone);
      }
    } catch {
      return;
    }

    this.finalizeRowEdit(milestone);
  }

  private finalizeRowEdit(milestone: any) {
    milestone.editing = false;
    delete this.clonedMilestones[milestone.milestoneId];
    this.poamMilestones.set([...this.poamMilestones()]);

    const table = this.table();

    if (table) {
      table.cancelRowEdit(milestone);
    }
  }

  private validateMilestoneFields(milestone: any): boolean {
    if (milestone.milestoneChangeDate && !milestone.milestoneChangeComments) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'When providing a milestone change date, you must also include milestone change comments.'
      });

      return false;
    }

    const requiredFields = [
      {
        field: 'milestoneChangeComments',
        message: 'Milestone Change Comments is a required field.'
      },
      {
        field: 'milestoneChangeDate',
        message: 'Milestone Change Date is a required field.'
      },
      {
        field: 'milestoneStatus',
        message: 'Milestone Status is a required field.'
      }
    ];

    for (const { field, message } of requiredFields) {
      if (!milestone[field]) {
        this.messageService.add({
          severity: 'error',
          summary: 'Information',
          detail: message
        });

        return false;
      }
    }

    if (!milestone.assignedTeamIds?.length) {
      this.messageService.add({
        severity: 'error',
        summary: 'Information',
        detail: 'At least one Milestone Team is required.'
      });

      return false;
    }

    return true;
  }

  private today(): Date {
    return this.toLocalDate(this.serverToday()) ?? startOfDay(new Date());
  }

  private inputToday(): Date {
    return startOfDay(new Date());
  }

  private earliestToday(): Date {
    const browserToday = this.inputToday();
    const serverAnchoredToday = this.today();

    return browserToday < serverAnchoredToday ? browserToday : serverAnchoredToday;
  }

  private toLocalDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = typeof value === 'string' ? parseISO(value) : value;

    return Number.isNaN(date.getTime()) ? null : startOfDay(date);
  }

  private extensionDeadlineDate(): Date | null {
    const poam = this.poam();
    const storedDeadline = this.toLocalDate(poam.extensionDeadline);

    if (storedDeadline) {
      return storedDeadline;
    }

    if (poam.extensionDays > 0) {
      return startOfDay(addDays(this.today(), poam.extensionDays));
    }

    return null;
  }

  private milestoneDeadlineDate(): Date | null {
    return this.extensionDeadlineDate();
  }

  private validateMilestoneDates(milestone: any): boolean {
    const changeDate = this.toLocalDate(milestone.milestoneChangeDate);

    if (!changeDate) {
      return true;
    }

    if (changeDate < this.earliestToday()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Milestone change date cannot be set to a past date.'
      });

      return false;
    }

    const extensionDays = this.poam().extensionDays;

    if (extensionDays === 0 || extensionDays == null) {
      const scheduledCompletionDate = this.toLocalDate(this.poam().scheduledCompletionDate);

      if (scheduledCompletionDate && isAfter(changeDate, scheduledCompletionDate)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Information',
          detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
        });

        return false;
      }
    } else {
      const extensionDeadline = this.milestoneDeadlineDate();

      if (extensionDeadline && isBefore(extensionDeadline, this.today())) {
        this.messageService.add({
          severity: 'error',
          summary: 'Extension Period Ended',
          detail: `The extension period ended on ${format(extensionDeadline, 'MM/dd/yyyy')}. Check "Restart extension period from today" to schedule milestones against a new extension period. The new deadline only takes effect once you save the extension.`
        });

        return false;
      }

      if (extensionDeadline && isAfter(changeDate, extensionDeadline)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Information',
          detail: 'The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.'
        });

        return false;
      }
    }

    return true;
  }

  private addNewMilestone(milestone: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const newMilestone: any = {
        milestoneDate: null,
        milestoneComments: null,
        milestoneChangeComments: milestone.milestoneChangeComments || null,
        milestoneChangeDate: format(milestone.milestoneChangeDate, 'yyyy-MM-dd'),
        milestoneStatus: milestone.milestoneStatus || 'In Progress',
        assignedTeamIds: milestone.assignedTeamIds || []
      };

      this.poamService
        .addPoamMilestone(this.poam().poamId, newMilestone)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            if (res?.null || res?.error) {
              this.messageService.add({
                severity: 'error',
                summary: 'Information',
                detail: 'Unable to insert row, please validate entry and try again.'
              });
              reject(new Error('Failed to add milestone'));

              return;
            }

            const table = this.table();

            if (table) {
              table.cancelRowEdit(milestone);
            }

            delete this.clonedMilestones[milestone.milestoneId];
            milestone.isNew = false;

            if (res?.milestoneId == null) {
              milestone.editing = false;
              this.poamMilestones.set(this.poamMilestones().filter((existing) => existing !== milestone));
              this.messageService.add({
                severity: 'warn',
                summary: 'Milestone Saved',
                detail: 'The milestone was saved, but the server response was not recognized. Refreshing the milestone list.'
              });
              this.refreshMilestones();
              resolve();

              return;
            }

            milestone.milestoneId = res.milestoneId;

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Milestone added successfully'
            });
            resolve();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to add milestone: ${getErrorMessage(error)}`
            });
            reject(error);
          }
        });
    });
  }

  private formatMilestoneDate(value: string | Date): string {
    return typeof value === 'string' ? value : format(value, 'yyyy-MM-dd');
  }

  private updateExistingMilestone(milestone: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const milestoneUpdate = {
        ...(milestone.milestoneDate && {
          milestoneDate: this.formatMilestoneDate(milestone.milestoneDate)
        }),
        ...(milestone.milestoneComments && {
          milestoneComments: milestone.milestoneComments
        }),
        ...(milestone.milestoneChangeDate && {
          milestoneChangeDate: this.formatMilestoneDate(milestone.milestoneChangeDate)
        }),
        ...(milestone.milestoneChangeComments && {
          milestoneChangeComments: milestone.milestoneChangeComments
        }),
        ...(milestone.milestoneStatus && {
          milestoneStatus: milestone.milestoneStatus
        }),
        assignedTeamIds: milestone.assignedTeamIds || []
      };

      this.poamService
        .updatePoamMilestone(this.poam().poamId, milestone.milestoneId, milestoneUpdate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Milestone updated successfully'
            });
            resolve();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to update milestone: ${getErrorMessage(error)}`
            });
            reject(error);
          }
        });
    });
  }

  getTeamNames(teamIds: number[]): string {
    if (!teamIds?.length || !this.assignedTeamOptions()) return '';

    return teamIds
      .map((id) => {
        const team = this.assignedTeamOptions().find((t) => t.assignedTeamId === id);

        return team ? team.assignedTeamName : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  getTeamNameList(teamIds: number[]): string[] {
    if (!teamIds?.length || !this.assignedTeamOptions()) return [];

    return teamIds
      .map((id) => {
        const team = this.assignedTeamOptions().find((t) => t.assignedTeamId === id);

        return team ? team.assignedTeamName : '';
      })
      .filter(Boolean);
  }

  onRowEditCancel(milestone: any) {
    if (milestone.isNew) {
      this.poamMilestones.set(this.poamMilestones().filter((m) => m !== milestone));
    } else if (this.clonedMilestones[milestone.milestoneId]) {
      const cloned = { ...this.clonedMilestones[milestone.milestoneId], editing: false };

      this.poamMilestones.set(this.poamMilestones().map((m) => (m === milestone ? cloned : m)));
    }

    delete this.clonedMilestones[milestone.milestoneId];
    milestone.editing = false;
    this.poamMilestones.set([...this.poamMilestones()]);

    const table = this.table();

    if (table) {
      table.cancelRowEdit(milestone);
    }
  }

  getPoamLabels() {
    this.poamService
      .getPoamLabelsByPoam(this.poamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((poamLabels: any) => {
        this.poamLabels = poamLabels;
      });
  }

  loadTeamMitigations() {
    const poamId = this.poam()?.poamId;

    if (!poamId) {
      this._ensureUniqueTeamMitigations();

      return;
    }

    this.teamMitigationsReload$.next(poamId);
  }

  private subscribeTeamMitigationsReload() {
    this.teamMitigationsReload$
      .pipe(
        switchMap((poamId) =>
          this.poamMitigationService.loadTeamMitigations(poamId).pipe(
            switchMap((mitigations) => {
              this.teamMitigations.set(mitigations || []);
              this._ensureUniqueTeamMitigations();

              if (this.poamAssignedTeams().length === 0) {
                return of(null);
              }

              if (this.teamMitigations().length === 0) {
                return from(this.poamMitigationService.initializeTeamMitigations(this.poam(), this.poamAssignedTeams(), [...this.teamMitigations()])).pipe(tap((initialized) => this.teamMitigations.set(initialized)));
              }

              return this.poamMitigationService.syncTeamMitigations(this.poam(), this.poamAssignedTeams(), this.teamMitigations()).pipe(
                tap((changes) => {
                  if (changes.length > 0) {
                    this.teamMitigations.update((current) => applyTeamSyncChanges(current, changes));
                  }
                })
              );
            }),
            tap(() => {
              if (this.activeTabIndex() > 0 && this.activeTabIndex() >= this.teamMitigations().length) {
                this.activeTabIndex.set(0);
              }
            }),
            catchError((error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to load team mitigations: ${getErrorMessage(error)}`
              });

              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  saveTeamMitigation(teamMitigation: any) {
    if (!this.poam() || !teamMitigation?.assignedTeamId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot save, missing data.' });

      return;
    }

    this.mitigationSaving.set(true);
    this.poamMitigationService
      .saveTeamMitigation(this.poam(), teamMitigation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mitigationSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Mitigation for ${teamMitigation.assignedTeamName} saved successfully`
          });
        },
        error: (error) => {
          this.mitigationSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to save team mitigation: ${getErrorMessage(error)}`
          });
        }
      });
  }

  onMitigationGenerated(event: { mitigation: string; teamId?: number }) {
    if (this.poam().isGlobalFinding || !event.teamId) {
      this.patchPoam({ mitigations: event.mitigation });
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    } else {
      const teamMitigation = this.teamMitigations().find((m) => m.assignedTeamId === event.teamId);

      if (teamMitigation) {
        this.patchTeamMitigation(teamMitigation.assignedTeamId, event.mitigation);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Mitigation updated for team ${teamMitigation.assignedTeamName}`
        });
      }
    }

    this._ensureUniqueTeamMitigations();
  }

  private _ensureUniqueTeamMitigations(): void {
    if (Array.isArray(this.teamMitigations())) {
      this.teamMitigations.set(this.teamMitigations().filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId)));
    } else {
      this.teamMitigations.set([]);
    }
  }

  computeDeadlineWithExtension() {
    const poam = this.poam();

    if (poam.extensionDays === 0 || poam.extensionDays == null) {
      const scheduledDate = this.toLocalDate(poam.scheduledCompletionDate);

      this.completionDateWithExtension.set(scheduledDate ? format(scheduledDate, 'EEE MMM dd yyyy') : '');
    } else {
      const extensionDeadline = this.extensionDeadlineDate();

      this.completionDateWithExtension.set(extensionDeadline ? format(extensionDeadline, 'EEE MMM dd yyyy') : '');
    }
  }

  showConfirmation(message: string, severity: string = 'warn') {
    this.messageService.add({
      severity: severity,
      summary: 'Notification',
      detail: message
    });
  }

  openModal() {
    this.displayExtensionDialog.set(true);
  }

  cancelExtension() {
    this.displayExtensionDialog.set(false);
    this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
  }

  deletePoamExtension() {
    if (this.poamMilestones().some((milestone) => milestone.editing || milestone.isNew)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsaved Changes',
        detail: 'Please save or cancel all milestone changes before removing the extension.'
      });

      return;
    }

    this.confirmationService.confirm({
      message: this.deleteExtensionRevertsStatus()
        ? 'Are you sure you want to delete this POAM extension request? This removes the extension days requested, the extension deadline, and the extension justification. The POAM status returns to Submitted and any of its approvers who hold approver-level access on this collection are notified. The POAM re-enters normal expiry processing, so if its scheduled completion date has already passed it may be marked Expired.'
        : 'Are you sure you want to delete this POAM extension request? This removes the extension days requested, the extension deadline, and the extension justification. The POAM status is not changed, but with the extension deadline removed the POAM re-enters normal expiry processing, so if its scheduled completion date has already passed it may be marked Expired.',
      header: 'Delete Extension Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Proceed',
      rejectLabel: 'Cancel',
      closable: false,
      acceptButtonStyleClass: 'p-button-outlined p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        this.saving.set(true);
        this.poamExtensionService
          .deletePoamExtension(this.poamId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.saving.set(false);
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'POAM extension deleted successfully.'
              });
              this.getData();
            },
            error: (error) => {
              this.saving.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to delete POAM extension: ${getErrorMessage(error)}`
              });
            }
          });
      }
    });
  }

  async submitPoamExtension() {
    const validationError = this.getExtensionValidationError();

    if (validationError) {
      this.messageService.add({ severity: 'error', ...validationError });

      return;
    }

    if (this.poam().extensionDays > 0) {
      if (this.restartExtensionPeriod()) {
        this.putPoamExtension('Extension Requested');
      } else {
        this.putPoamExtension(null, { dataOnly: true });
      }
    }
  }

  private getExtensionValidationError(): { summary: string; detail: string } | null {
    if (this.poamMilestones().some((milestone) => milestone.editing || milestone.isNew)) {
      return { summary: 'Unsaved Changes', detail: 'Please save all milestone changes before submitting the extension request.' };
    }

    if (!this.poam().extensionDays) {
      return { summary: 'Validation Error', detail: 'Extension Time Requested is required.' };
    }

    if (!this.extensionJustification()) {
      return { summary: 'Validation Error', detail: 'Justification for Extension is required.' };
    }

    const mitigationError = this.getMitigationValidationError();

    if (mitigationError) {
      return mitigationError;
    }

    return this.poam().extensionDays > 0 ? this.getMilestoneValidationError() : null;
  }

  private hasTeamScopedRequirements(): boolean {
    return !this.poam().isGlobalFinding && (this.poamAssignedTeams()?.length ?? 0) > 0;
  }

  private getMitigationValidationError(): { summary: string; detail: string } | null {
    if (!this.hasTeamScopedRequirements()) {
      return this.poam().mitigations ? null : { summary: 'Validation Error', detail: 'Mitigations are required.' };
    }

    const activeTeamMitigations = this.teamMitigations().filter((m) => m.isActive);
    const teamsMissingMitigation = activeTeamMitigations.filter((m) => !m.mitigationText?.trim());

    if (activeTeamMitigations.length > 0 && teamsMissingMitigation.length === 0) {
      return null;
    }

    const missingTeamNames = teamsMissingMitigation.map((m) => m.assignedTeamName).filter(Boolean);

    return {
      summary: 'Validation Error',
      detail: missingTeamNames.length > 0 ? `A mitigation is required for the following team(s): ${missingTeamNames.join(', ')}.` : 'A mitigation is required for each assigned team.'
    };
  }

  private getMilestoneValidationError(): { summary: string; detail: string } | null {
    const milestones = this.poamMilestones();

    if (milestones.some((milestone) => milestone.milestoneChangeDate && !milestone.milestoneChangeComments)) {
      return { summary: 'Validation Error', detail: 'All milestones with a change date must also have change comments.' };
    }

    if (milestones.some((milestone) => this.isPastDueWithoutChange(milestone))) {
      return { summary: 'Validation Error', detail: 'All past-due milestones must have a milestone change date and comments before submitting an extension request.' };
    }

    if (!milestones.some((milestone) => milestone.milestoneChangeComments && milestone.milestoneChangeDate)) {
      return { summary: 'Validation Error', detail: 'At least one milestone must have both change comments and change date filled before submitting an extension request.' };
    }

    return this.getTeamMilestoneValidationError();
  }

  private isPastDueWithoutChange(milestone: any): boolean {
    if (!milestone.milestoneDate || milestone.milestoneChangeDate) {
      return false;
    }

    const milestoneDate = typeof milestone.milestoneDate === 'string' ? startOfDay(parseISO(milestone.milestoneDate)) : startOfDay(milestone.milestoneDate);

    return milestoneDate < this.earliestToday();
  }

  private getTeamMilestoneValidationError(): { summary: string; detail: string } | null {
    if (!this.hasTeamScopedRequirements()) {
      return null;
    }

    const teamsWithoutOpenMilestone = this.poamAssignedTeams().filter((team) => !this.poamMilestones().some((milestone) => milestone.assignedTeamIds?.includes(team.assignedTeamId) && milestone.milestoneStatus !== 'Completed'));

    if (teamsWithoutOpenMilestone.length === 0) {
      return null;
    }

    const missingTeamNames = teamsWithoutOpenMilestone.map((team) => team.assignedTeamName).filter(Boolean);

    return {
      summary: 'Validation Error',
      detail: `Each assigned team must have at least one milestone that is not in a Completed status. Missing for: ${missingTeamNames.join(', ')}.`
    };
  }

  approveExtension() {
    const hasUnsavedMilestones = this.poamMilestones().some((milestone) => milestone.editing || milestone.isNew);

    if (hasUnsavedMilestones) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsaved Changes',
        detail: 'Please save all milestone changes before approving the extension.'
      });

      return;
    }

    if (this.restartExtensionPeriod() && this.poam().extensionDays > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Restart Extension Period',
        detail: 'A restarted extension period is a new request and must be submitted with Save. Uncheck "Restart extension period from today" to approve the request as it was submitted.'
      });

      return;
    }

    this.putPoamExtension('Approved');
  }

  rejectExtension() {
    const hasUnsavedMilestones = this.poamMilestones().some((milestone) => milestone.editing || milestone.isNew);

    if (hasUnsavedMilestones) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsaved Changes',
        detail: 'Please save or remove any milestone changes before rejecting the extension.'
      });

      return;
    }

    this.putPoamExtension('Rejected');
  }

  putPoamExtension(status: string | null, options: { dataOnly?: boolean } = {}) {
    const dataOnly = options.dataOnly === true;
    const requestedExtensionDays = status === 'Rejected' ? 0 : this.poam().extensionDays;
    const extensionData: any = {
      poamId: Number.parseInt(this.poamId, 10),
      extensionJustification: this.extensionJustification(),
      reanchorDeadline: !dataOnly && status === 'Extension Requested',
      mitigations: this.poam().mitigations,
      requiredResources: this.poam().requiredResources,
      residualRisk: this.poam().residualRisk,
      likelihood: this.poam().likelihood,
      localImpact: this.poam().localImpact,
      impactDescription: this.poam().impactDescription
    };

    if (!dataOnly) {
      if (status !== 'Approved') {
        extensionData.extensionDays = requestedExtensionDays;
      }

      extensionData.status = status;
    }

    this.saving.set(true);

    try {
      this.poamExtensionService
        .putPoamExtension(extensionData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            if (dataOnly) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Extension updated for POAM: ${res.poamId}`
              });
            } else if (status === 'Approved') {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Extension Approved for POAM: ${res.poamId}`
              });
            } else if (status === 'Rejected') {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Extension Rejected for POAM: ${res.poamId}`
              });
            } else {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Extension requested for POAM: ${res.poamId}`
              });
            }

            if (!dataOnly && status !== 'Rejected' && requestedExtensionDays > 0) {
              this.findOrCreateExtendedLabel();
            }

            if (!this.poam().isGlobalFinding && this.teamMitigations().length > 0) {
              this.poamMitigationService.saveAllTeamMitigations(this.poam(), this.teamMitigations());
            }

            this.saving.set(false);

            setTimeout(() => {
              this.displayExtensionDialog.set(false);
              this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
            }, 1000);
          },
          error: (error) => {
            this.saving.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Unexpected error adding POAM Extension: ${getErrorMessage(error)}`
            });
          }
        });
    } catch (error) {
      this.saving.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to submit POAM extension: ${getErrorMessage(error)}`
      });
    }
  }

  findOrCreateExtendedLabel() {
    const extendedLabel = this.poamLabels?.find((label: any) => label.labelName === 'Extended');

    if (extendedLabel) {
      return;
    }

    this.poamService
      .getLabels(this.selectedCollection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((labels: any) => {
        this.labelList = labels;

        if (this.labelList) {
          const extendedLabel = this.labelList.find((label: any) => label.labelName === 'Extended');

          if (extendedLabel) {
            const extendedPoamLabel = {
              poamId: +this.poamId,
              labelId: +extendedLabel.labelId
            };

            this.poamService.postPoamLabel(extendedPoamLabel).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          }
        } else {
          const extendLabel = {
            collectionId: this.selectedCollection,
            labelName: 'Extended',
            description: 'POAM has been extended'
          };

          this.labelService
            .addLabel(this.selectedCollection, extendLabel)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.findOrCreateExtendedLabel();
            });
        }
      });
  }

  get extensionHistoryTooltip(): string {
    if (!this.extensionHistory()?.length) return '';

    return this.extensionHistory()
      .map((e, i) => {
        const dateStr = e.extensionRequestedDate ? e.extensionRequestedDate.split('T')[0] : '';
        const date = dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US') : 'N/A';

        return `Extension ${i + 1}: Requested ${date} &mdash; ${e.extensionDays} days`;
      })
      .join('<br>');
  }

  filterJustifications(event: any) {
    const query = event.query;

    this.filteredJustifications = this.justifications.filter((justification) => justification.toLowerCase().includes(query.toLowerCase()));
  }
}
