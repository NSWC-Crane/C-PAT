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
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, isAfter, parseISO, startOfDay } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { MultiSelectDirective } from '../../../common/directives/multi-select.directive';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { LabelService } from '../../label-processing/label.service';
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
    ToastModule,
    ConfirmDialogModule,
    DatePipe,
    PoamMitigationGeneratorComponent
  ],
  providers: [ConfirmationService, MessageService]
})
export class PoamExtendComponent implements OnInit {
  readonly table = viewChild.required<Table>('dt');
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
  poam: any;
  poamId: any;
  poamLabels: [{ poamId: number; labelId: number; labelName: string }] | undefined;
  readonly poamMilestones = signal<any[]>([]);
  clonedMilestones: { [s: string]: any } = {};
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
        this.router.navigate(['/poam-processing/poam-approve', this.poam.poamId]);
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

  isExtensionInvalid(field: string): boolean {
    return this.computeInvalidExtensionFields().has(field);
  }

  private computeInvalidExtensionFields(): Set<string> {
    const invalid = new Set<string>();

    if (!this.poam) {
      return invalid;
    }

    if (!this.poam.extensionDays) {
      invalid.add('extensionDays');
    }

    if (!this.extensionJustification()) {
      invalid.add('extensionJustification');
    }

    if (this.poam.isGlobalFinding) {
      if (!this.poam.mitigations) {
        invalid.add('mitigations');
      }
    } else if (this.poamAssignedTeams() && this.poamAssignedTeams().length > 0) {
      this.teamMitigations()
        .filter((m) => m.isActive)
        .forEach((m) => {
          if (!m.mitigationText?.trim()) {
            invalid.add(`teamMitigation:${m.assignedTeamId}`);
          }
        });
    } else if (!this.poam.mitigations) {
      invalid.add('mitigations');
    }

    return invalid;
  }

  ngOnInit() {
    this.openModal();
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

      if (this.accessLevel() > 0) {
        this.getData();
      }
    });
  }

  getData() {
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
          const extensionDataset = extension;

          this.poamMilestones.set(
            poamMilestones.map((milestone: any) => ({
              ...milestone,
              milestoneDate: milestone.milestoneDate ? milestone.milestoneDate.split('T')[0] : null,
              milestoneChangeDate: milestone.milestoneChangeDate ? milestone.milestoneChangeDate.split('T')[0] : null,
              assignedTeamIds: milestone.assignedTeamIds || milestone.assignedTeams?.map((t: any) => t.assignedTeamId) || []
            }))
          );

          this.assignedTeamOptions.set(assignedTeamOptions);
          this.poamAssignedTeams.set(poamAssignedTeams || []);

          if (extensionDataset.length > 0) {
            const extensionData = extensionDataset[0];

            this.poam = {
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
              extensionDays: extensionData.extensionDays,
              extensionDeadline: extensionData.extensionDeadline ? extensionData.extensionDeadline.split('T')[0] : undefined,
              extensionJustification: extensionData.extensionJustification,
              scheduledCompletionDate: extensionData.scheduledCompletionDate ? extensionData.scheduledCompletionDate.split('T')[0] : ''
            };

            this.extensionHistory.set(extensionData.extensionHistory || []);
            this.extensionJustification.set(this.poam.extensionJustification);

            if (this.poam.scheduledCompletionDate) {
              this.computeDeadlineWithExtension();
            } else {
              this.completionDateWithExtension.set('');
            }
          } else {
            this.poam = {
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
              extensionDays: 0,
              extensionJustification: '',
              scheduledCompletionDate: '',
              mitigations: poamData.mitigations || '',
              requiredResources: poamData.requiredResources || '',
              residualRisk: poamData.residualRisk || '',
              likelihood: poamData.likelihood || '',
              localImpact: poamData.localImpact || '',
              impactDescription: poamData.impactDescription || ''
            };

            this.extensionHistory.set([]);
            this.extensionJustification.set('');
            this.completionDateWithExtension.set('');
          }

          this.loadTeamMitigations();
          this.getPoamLabels();
        }
      });
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
  }

  generateTempId(): string {
    return 'temp_' + Date.now();
  }

  onRowEditInit(milestone: any) {
    milestone.editing = true;
    this.clonedMilestones[milestone.milestoneId] = { ...milestone };
  }

  async onRowEditSave(milestone: any) {
    if (!this.validateMilestoneFields(milestone)) return;
    if (!this.validateMilestoneDates(milestone)) return;

    if (milestone.isNew) {
      await this.addNewMilestone(milestone);
    } else {
      await this.updateExistingMilestone(milestone);
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

  private validateMilestoneDates(milestone: any): boolean {
    if (milestone.milestoneChangeDate) {
      const today = startOfDay(new Date());

      const changeDate = typeof milestone.milestoneChangeDate === 'string' ? startOfDay(parseISO(milestone.milestoneChangeDate)) : startOfDay(milestone.milestoneChangeDate);

      if (changeDate < today) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Milestone change date cannot be set to a past date.'
        });

        return false;
      }

      const milestoneDate = format(milestone.milestoneChangeDate, 'yyyy-MM-dd');
      const scheduledCompletionDate = format(this.poam.scheduledCompletionDate, 'yyyy-MM-dd');
      const extensionDays = this.poam.extensionDays;

      if (extensionDays === 0 || extensionDays == null) {
        if (isAfter(milestoneDate, scheduledCompletionDate)) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Information',
            detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
          });

          return false;
        }
      } else if (isAfter(milestoneDate, this.completionDateWithExtension())) {
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
        .addPoamMilestone(this.poam.poamId, newMilestone)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            if (res.null) {
              this.messageService.add({
                severity: 'error',
                summary: 'Information',
                detail: 'Unable to insert row, please validate entry and try again.'
              });
              reject(new Error('Failed to add milestone'));
            } else {
              milestone.milestoneId = res.milestoneId;
              milestone.isNew = false;

              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Milestone added successfully'
              });
              resolve();
            }
          },
          error: (error) => reject(error)
        });
    });
  }

  private updateExistingMilestone(milestone: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const milestoneUpdate = {
        ...(milestone.milestoneDate && {
          milestoneDate: milestone.milestoneDate ? (typeof milestone.milestoneDate === 'string' ? milestone.milestoneDate : format(milestone.milestoneDate, 'yyyy-MM-dd')) : null
        }),
        ...(milestone.milestoneComments && {
          milestoneComments: milestone.milestoneComments
        }),
        ...(milestone.milestoneChangeDate && {
          milestoneChangeDate: milestone.milestoneChangeDate ? (typeof milestone.milestoneChangeDate === 'string' ? milestone.milestoneChangeDate : format(milestone.milestoneChangeDate, 'yyyy-MM-dd')) : null
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
        .updatePoamMilestone(this.poam.poamId, milestone.milestoneId, milestoneUpdate)
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
      .filter((name) => name)
      .join(', ');
  }

  getTeamNameList(teamIds: number[]): string[] {
    if (!teamIds?.length || !this.assignedTeamOptions()) return [];

    return teamIds
      .map((id) => {
        const team = this.assignedTeamOptions().find((t) => t.assignedTeamId === id);

        return team ? team.assignedTeamName : '';
      })
      .filter((name) => name);
  }

  onRowEditCancel(milestone: any, index: number) {
    if (milestone.isNew) {
      this.poamMilestones.set(this.poamMilestones().filter((_m, i) => i !== index));
    } else if (this.clonedMilestones[milestone.milestoneId]) {
      const cloned = this.clonedMilestones[milestone.milestoneId];

      this.poamMilestones.set(this.poamMilestones().map((m, i) => (i === index ? cloned : m)));
      delete this.clonedMilestones[milestone.milestoneId];
    }

    milestone.editing = false;

    const table = this.table();

    if (table) {
      table.cancelRowEdit(milestone);
    }
  }

  deleteMilestone(milestone: any, index: number) {
    if (!milestone.milestoneId) {
      this.poamMilestones.set(this.poamMilestones().filter((_m, i) => i !== index));

      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this milestone?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-outlined p-button-primary',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        this.poamService
          .deletePoamMilestone(this.poam.poamId, milestone.milestoneId, false)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.poamMilestones.set(this.poamMilestones().filter((_m, i) => i !== index));
          });
      }
    });
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
    if (!this.poam?.poamId) {
      this._ensureUniqueTeamMitigations();

      return;
    }

    this.poamMitigationService
      .loadTeamMitigations(this.poam.poamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (mitigations) => {
          this.teamMitigations.set(mitigations || []);
          this._ensureUniqueTeamMitigations();

          const needsInitialization = this.teamMitigations().length === 0 && this.poamAssignedTeams()?.length > 0;
          const needsSync = this.teamMitigations().length > 0 && this.poamAssignedTeams()?.length > 0;

          if (needsInitialization) {
            this.teamMitigations.set(await this.poamMitigationService.initializeTeamMitigations(this.poam, this.poamAssignedTeams(), this.teamMitigations()));
          } else if (needsSync) {
            this.poamMitigationService
              .syncTeamMitigations(this.poam, this.poamAssignedTeams(), this.teamMitigations())
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((changes) => {
                if (changes.length > 0) {
                  this.teamMitigations.update((current) => applyTeamSyncChanges(current, changes));

                  if (this.activeTabIndex() > 0 && this.activeTabIndex() > this.teamMitigations().length) {
                    this.activeTabIndex.set(0);
                  }
                }
              });
          }

          this._ensureUniqueTeamMitigations();

          if (this.activeTabIndex() > 0 && this.activeTabIndex() > this.teamMitigations().length) {
            this.activeTabIndex.set(0);
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

  saveTeamMitigation(teamMitigation: any) {
    if (!this.poam || !teamMitigation?.assignedTeamId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot save, missing data.' });

      return;
    }

    this.mitigationSaving.set(true);
    this.poamMitigationService
      .saveTeamMitigation(this.poam, teamMitigation)
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
    if (this.poam.isGlobalFinding || !event.teamId) {
      this.poam.mitigations = event.mitigation;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Mitigation added'
      });
    } else {
      const teamMitigation = this.teamMitigations().find((m) => m.assignedTeamId === event.teamId);

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

  private _ensureUniqueTeamMitigations(): void {
    if (Array.isArray(this.teamMitigations())) {
      this.teamMitigations.set(this.teamMitigations().filter((mitigation, index, self) => index === self.findIndex((m) => m.assignedTeamId === mitigation.assignedTeamId)));
    } else {
      this.teamMitigations.set([]);
    }
  }

  computeDeadlineWithExtension() {
    if (this.poam.extensionDays === 0 || this.poam.extensionDays == null) {
      if (!this.poam.scheduledCompletionDate) {
        this.completionDateWithExtension.set('');

        return;
      }

      const scheduledDate = typeof this.poam.scheduledCompletionDate === 'string' ? parseISO(this.poam.scheduledCompletionDate) : this.poam.scheduledCompletionDate;

      this.completionDateWithExtension.set(format(scheduledDate, 'EEE MMM dd yyyy'));
    } else {
      const extendedDate = addDays(new Date(), this.poam.extensionDays);

      this.completionDateWithExtension.set(format(extendedDate, 'EEE MMM dd yyyy'));
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this POAM extension request? This will remove the existing extension justification and the extension days requested.',
      header: 'Delete Extension Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Proceed',
      rejectLabel: 'Cancel',
      closable: false,
      acceptButtonStyleClass: 'p-button-outlined p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => {
        this.poamExtensionService
          .deletePoamExtension(this.poamId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'POAM extension deleted successfully.'
              });
              this.getData();
            },
            error: (error) => {
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
    const hasUnsavedMilestones = this.poamMilestones().some((milestone) => milestone.editing || milestone.isNew);

    if (hasUnsavedMilestones) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsaved Changes',
        detail: 'Please save all milestone changes before submitting the extension request.'
      });

      return;
    }

    if (!this.poam.extensionDays) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Extension Time Requested is required.'
      });

      return;
    }

    if (!this.extensionJustification()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Justification for Extension is required.'
      });

      return;
    }

    if (!this.poam.isGlobalFinding && this.poamAssignedTeams() && this.poamAssignedTeams().length > 0) {
      const activeTeamMitigations = this.teamMitigations().filter((m) => m.isActive);
      const teamsMissingMitigation = activeTeamMitigations.filter((m) => !m.mitigationText?.trim());

      if (activeTeamMitigations.length === 0 || teamsMissingMitigation.length > 0) {
        const missingTeamNames = teamsMissingMitigation.map((m) => m.assignedTeamName).filter((name) => name);

        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: missingTeamNames.length > 0 ? `A mitigation is required for the following team(s): ${missingTeamNames.join(', ')}.` : 'A mitigation is required for each assigned team.'
        });

        return;
      }
    } else if (!this.poam.mitigations) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Mitigations are required.'
      });

      return;
    }

    if (this.poam.extensionDays > 0) {
      const milestoneWithChangeDateButNoComment = this.poamMilestones().some((milestone) => milestone.milestoneChangeDate && !milestone.milestoneChangeComments);

      if (milestoneWithChangeDateButNoComment) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'All milestones with a change date must also have change comments.'
        });

        return;
      }

      const today = startOfDay(new Date());
      const pastDueMilestonesWithoutChanges = this.poamMilestones().some((milestone) => {
        if (!milestone.milestoneDate) return false;

        const milestoneDate = typeof milestone.milestoneDate === 'string' ? startOfDay(parseISO(milestone.milestoneDate)) : startOfDay(milestone.milestoneDate);

        return milestoneDate < today && !milestone.milestoneChangeDate;
      });

      if (pastDueMilestonesWithoutChanges) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'All past-due milestones must have a milestone change date and comments before submitting an extension request.'
        });

        return;
      }

      const hasChangedMilestone = this.poamMilestones().some((milestone) => milestone.milestoneChangeComments && milestone.milestoneChangeDate);

      if (!hasChangedMilestone) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'At least one milestone must have both change comments and change date filled before submitting an extension request.'
        });

        return;
      }

      if (!this.poam.isGlobalFinding && this.poamAssignedTeams() && this.poamAssignedTeams().length > 0) {
        const teamsWithoutOpenMilestone = this.poamAssignedTeams().filter((team) => {
          const teamMilestones = this.poamMilestones().filter((milestone) => milestone.assignedTeamIds?.includes(team.assignedTeamId));

          return !teamMilestones.some((milestone) => milestone.milestoneStatus !== 'Completed');
        });

        if (teamsWithoutOpenMilestone.length > 0) {
          const missingTeamNames = teamsWithoutOpenMilestone.map((team) => team.assignedTeamName).filter((name) => name);

          this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: `Each assigned team must have at least one milestone that is not in a Completed status. Missing for: ${missingTeamNames.join(', ')}.`
          });

          return;
        }
      }

      this.putPoamExtension('Extension Requested');
    }
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

  putPoamExtension(status: string) {
    const extensionData = {
      poamId: Number.parseInt(this.poamId, 10),
      extensionDays: this.poam.extensionDays,
      extensionJustification: this.extensionJustification(),
      status: status,
      mitigations: this.poam.mitigations,
      requiredResources: this.poam.requiredResources,
      residualRisk: this.poam.residualRisk,
      likelihood: this.poam.likelihood,
      localImpact: this.poam.localImpact,
      impactDescription: this.poam.impactDescription
    };

    if (status === 'Rejected') {
      extensionData.extensionDays = 0;
    }

    if (status !== 'Rejected' && extensionData.extensionDays > 0) {
      this.findOrCreateExtendedLabel();
    }

    try {
      this.poamExtensionService
        .putPoamExtension(extensionData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            if (res.null || res.null == 'null') {
              this.messageService.add({
                severity: 'error',
                summary: 'Information',
                detail: 'Unexpected error adding POAM Extension'
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

            if (status !== 'Rejected' && extensionData.extensionDays > 0) {
              this.poamService.updatePoamStatus(this.poamId, extensionData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
            }

            if (!this.poam.isGlobalFinding && this.teamMitigations().length > 0) {
              this.poamMitigationService.saveAllTeamMitigations(this.poam, this.teamMitigations());
            }

            setTimeout(() => {
              this.displayExtensionDialog.set(false);
              this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
            }, 1000);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Unexpected error adding POAM Extension: ${getErrorMessage(error)}`
            });
          }
        });
    } catch (error) {
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
