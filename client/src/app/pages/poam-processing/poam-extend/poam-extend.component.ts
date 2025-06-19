/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, forkJoin } from 'rxjs';
import { PayloadService } from '../../../common/services/setPayload.service';
import { SharedService } from '../../../common/services/shared.service';
import { getErrorMessage } from '../../../common/utils/error-utils';
import { AssignedTeamService } from '../../admin-processing/assignedTeam-processing/assignedTeam-processing.service';
import { LabelService } from '../../label-processing/label.service';
import { PoamExtensionService } from '../poam-extend/poam-extend.service';
import { PoamService } from '../poams.service';

@Component({
    selector: 'cpat-poam-extend',
    templateUrl: './poam-extend.component.html',
    styleUrls: ['./poam-extend.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, DatePicker, DialogModule, Select, InputTextModule, TextareaModule, TooltipModule, StepperModule, TableModule, ToastModule, ConfirmDialogModule, DatePipe],
    providers: [ConfirmationService, MessageService]
})
export class PoamExtendComponent implements OnInit, OnDestroy {
    assignedTeamOptions: any;
    displayExtensionDialog: boolean = false;
    dates: any = {};
    poam: any;
    poamId: any;
    poamLabels: [{ poamId: number; labelId: number; labelName: string }] | undefined;
    poamMilestones: any[] = [];
    clonedMilestones: { [s: string]: any } = {};
    milestoneStatusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Complete', value: 'Complete' }
    ];
    extensionJustification: string = '';
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
        { label: '3 Days', value: 3 },
        { label: '7 Days', value: 7 },
        { label: '14 Days', value: 14 },
        { label: '30 Days', value: 30 },
        { label: '60 Days', value: 60 },
        { label: '90 Days', value: 90 },
        { label: '180 Days', value: 180 },
        { label: '365 Days', value: 365 }
    ];
    residualRiskOptions = [
        { label: 'Very Low', value: 'Very Low' },
        { label: 'Low', value: 'Low' },
        { label: 'Moderate', value: 'Moderate' },
        { label: 'High', value: 'High' },
        { label: 'Very High', value: 'Very High' }
    ];

    likelihoodOptions = [
        { label: 'Very Low', value: 'Very Low' },
        { label: 'Low', value: 'Low' },
        { label: 'Moderate', value: 'Moderate' },
        { label: 'High', value: 'High' },
        { label: 'Very High', value: 'Very High' }
    ];

    localImpactOptions = [
        { label: 'Very Low', value: 'Very Low' },
        { label: 'Low', value: 'Low' },
        { label: 'Moderate', value: 'Moderate' },
        { label: 'High', value: 'High' },
        { label: 'Very High', value: 'Very High' }
    ];

    selectedCollection: any;
    user: any;
    payload: any;
    protected accessLevel: any;
    completionDate: any;
    completionDateWithExtension: any;
    labelList: any;

    private subscriptions = new Subscription();
    private payloadSubscription: Subscription[] = [];

    constructor(
        private assignedTeamService: AssignedTeamService,
        private router: Router,
        private route: ActivatedRoute,
        private poamService: PoamService,
        private sharedService: SharedService,
        private poamExtensionService: PoamExtensionService,
        private confirmationService: ConfirmationService,
        private labelService: LabelService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef,
        private setPayloadService: PayloadService
    ) {}

    ngOnInit() {
        this.openModal();
        this.route.params.subscribe(async (params) => {
            this.poamId = params['poamId'];
        });
        this.subscriptions.add(
            this.sharedService.selectedCollection.subscribe((collectionId) => {
                this.selectedCollection = collectionId;
            })
        );
        this.setPayload();
    }

    async setPayload() {
        this.setPayloadService.setPayload();
        this.payloadSubscription.push(
            this.setPayloadService.user$.subscribe((user) => {
                this.user = user;
            }),
            this.setPayloadService.payload$.subscribe((payload) => {
                this.payload = payload;
            }),
            this.setPayloadService.accessLevel$.subscribe((level) => {
                this.accessLevel = level;
                if (this.accessLevel > 0) {
                    this.getData();
                }
            })
        );
    }

    getData() {
        this.subscriptions.add(
            forkJoin([this.poamService.getPoam(this.poamId), this.poamExtensionService.getPoamExtension(this.poamId), this.poamService.getPoamMilestones(this.poamId), this.assignedTeamService.getAssignedTeams()]).subscribe({
                next: ([poamData, extension, poamMilestones, assignedTeamOptions]: any) => {
                    const extensionDataset = extension;
                    this.poamMilestones = poamMilestones.map((milestone: any) => ({
                        ...milestone,
                        milestoneDate: milestone.milestoneDate ? milestone.milestoneDate.split('T')[0] : null,
                        milestoneChangeDate: milestone.milestoneChangeDate ? milestone.milestoneChangeDate.split('T')[0] : null
                    }));

                    this.assignedTeamOptions = assignedTeamOptions;

                    if (extensionDataset.length > 0) {
                        const extensionData = extensionDataset[0];
                        this.poam = {
                            poamId: +poamData.poamId,
                            status: poamData.status,
                            mitigations: poamData.mitigations,
                            requiredResources: poamData.requiredResources,
                            residualRisk: poamData.residualRisk,
                            likelihood: poamData.likelihood,
                            localImpact: poamData.localImpact,
                            impactDescription: poamData.impactDescription,
                            extensionTimeAllowed: extensionData.extensionTimeAllowed,
                            extensionJustification: extensionData.extensionJustification,
                            scheduledCompletionDate: extensionData.scheduledCompletionDate ? extensionData.scheduledCompletionDate.split('T')[0] : ''
                        };

                        this.extensionJustification = this.poam.extensionJustification;

                        if (this.poam.scheduledCompletionDate) {
                            const extendedDate = addDays(parseISO(this.poam.scheduledCompletionDate), this.poam.extensionTimeAllowed);
                            this.completionDateWithExtension = format(extendedDate, 'EEE MMM dd yyyy');
                        } else {
                            this.completionDateWithExtension = '';
                        }
                    } else {
                        this.poam = {
                            extensionTimeAllowed: 0,
                            extensionJustification: '',
                            scheduledCompletionDate: '',
                            mitigations: '',
                            requiredResources: '',
                            residualRisk: '',
                            likelihood: '',
                            localImpact: '',
                            impactDescription: ''
                        };

                        this.extensionJustification = '';
                        this.completionDateWithExtension = '';
                    }

                    this.getPoamLabels();
                }
            })
        );
    }

    onAddNewMilestone() {
        const newMilestone = {
            milestoneId: this.generateTempId(),
            milestoneComments: null,
            milestoneDate: null,
            milestoneChangeComments: null,
            milestoneChangeDate: new Date(),
            milestoneStatus: 'Pending',
            assignedTeamId: null,
            isNew: true,
            editing: true
        };
        this.poamMilestones = [newMilestone, ...this.poamMilestones];
        this.onRowEditInit(newMilestone);
        this.cdr.detectChanges();
    }

    generateTempId(): string {
        return 'temp_' + new Date().getTime();
    }

    onRowEditInit(milestone: any) {
        this.clonedMilestones[milestone.milestoneId] = { ...milestone };
    }

    async onRowEditSave(milestone: any) {
        if (!this.validateMilestoneFields(milestone)) return;
        if (!this.validateMilestoneDate(milestone)) return;

        if (milestone.isNew) {
            await this.addNewMilestone(milestone);
        } else {
            await this.updateExistingMilestone(milestone);
        }

        delete this.clonedMilestones[milestone.milestoneId];
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
            },
            {
                field: 'assignedTeamId',
                message: 'Milestone Team is a required field.'
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

        return true;
    }

    private validateMilestoneDate(milestone: any): boolean {
        const milestoneDate = format(milestone.milestoneChangeDate, 'yyyy-MM-dd');
        const scheduledCompletionDate = format(this.poam.scheduledCompletionDate, 'yyyy-MM-dd');
        const extensionTimeAllowed = this.poam.extensionTimeAllowed;

        if (extensionTimeAllowed === 0 || extensionTimeAllowed == null) {
            if (isAfter(milestoneDate, scheduledCompletionDate)) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Information',
                    detail: 'The Milestone date provided exceeds the POAM scheduled completion date.'
                });
                return false;
            }
        } else {
            const maxAllowedDate = addDays(scheduledCompletionDate, extensionTimeAllowed);
            if (isAfter(milestoneDate, maxAllowedDate)) {
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

    private addNewMilestone(milestone: any) {
        const newMilestone: any = {
            milestoneDate: null,
            milestoneComments: null,
            milestoneChangeComments: milestone.milestoneChangeComments || null,
            milestoneChangeDate: format(milestone.milestoneChangeDate, 'yyyy-MM-dd'),
            milestoneStatus: milestone.milestoneStatus || 'Pending',
            assignedTeamId: milestone.assignedTeamId || null
        };

        this.poamService.addPoamMilestone(this.poam.poamId, newMilestone).subscribe((res: any) => {
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
                delete milestone.editing;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Milestone added successfully'
                });
            }
        });
    }

    private updateExistingMilestone(milestone: any) {
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
            ...(milestone.assignedTeamId && {
                assignedTeamId: milestone.assignedTeamId
            })
        };

        this.poamService.updatePoamMilestone(this.poam.poamId, milestone.milestoneId, milestoneUpdate).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Milestone updated successfully'
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to update milestone: ${getErrorMessage(error)}`
                });
            }
        });
    }

    getTeamName(teamId: number): string {
        if (!teamId || !this.assignedTeamOptions) return '';
        const team = this.assignedTeamOptions.find((t) => t.assignedTeamId === teamId);
        return team ? team.assignedTeamName : '';
    }

    onRowEditCancel(milestone: any, index: number) {
        if (milestone.isNew) {
            this.poamMilestones.splice(index, 1);
        } else if (this.clonedMilestones[milestone.milestoneId]) {
            this.poamMilestones[index] = this.clonedMilestones[milestone.milestoneId];
            delete this.clonedMilestones[milestone.milestoneId];
        }
    }

    deleteMilestone(milestone: any, index: number) {
        if (!milestone.milestoneId) {
            this.poamMilestones.splice(index, 1);
            return;
        }
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this milestone?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.poamService.deletePoamMilestone(this.poam.poamId, milestone.milestoneId, false).subscribe(() => {
                    this.poamMilestones.splice(index, 1);
                });
            }
        });
    }

    getPoamLabels() {
        this.subscriptions.add(
            this.poamService.getPoamLabelsByPoam(this.poamId).subscribe((poamLabels: any) => {
                this.poamLabels = poamLabels;
            })
        );
    }

    computeDeadlineWithExtension() {
        if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
            this.completionDateWithExtension = format(this.poam.scheduledCompletionDate, 'EEE MMM dd yyyy');
        } else {
            const extendedDate = addDays(parseISO(this.poam.scheduledCompletionDate), this.poam.extensionTimeAllowed);
            this.completionDateWithExtension = format(extendedDate, 'EEE MMM dd yyyy');
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
        this.displayExtensionDialog = true;
    }

    cancelExtension() {
        this.displayExtensionDialog = false;
        this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
    }

    async submitPoamExtension() {
        if (!this.poam.extensionTimeAllowed) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Extension Time Requested is required.'
            });
            return;
        }

        if (!this.extensionJustification) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Justification for Extension is required.'
            });
            return;
        }

        if (!this.poam.mitigations) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Mitigations are required.'
            });
            return;
        }

        if (this.poam.extensionTimeAllowed > 0) {
            const milestoneWithChangeDateButNoComment = this.poamMilestones.some((milestone) => milestone.milestoneChangeDate && !milestone.milestoneChangeComments);

            if (milestoneWithChangeDateButNoComment) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'All milestones with a change date must also have change comments.'
                });
                return;
            }

            const today = new Date();
            const pastDueMilestonesWithoutChanges = this.poamMilestones.some((milestone) => {
                if (!milestone.milestoneDate) return false;

                const milestoneDate = new Date(milestone.milestoneDate);
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

            const hasChangedMilestone = this.poamMilestones.some((milestone) => milestone.milestoneChangeComments && milestone.milestoneChangeDate);

            if (!hasChangedMilestone) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'At least one milestone must have both change comments and change date filled before submitting an extension request.'
                });
                return;
            }

            this.putPoamExtension('Extension Requested');
        }
    }

    approveExtension() {
        this.putPoamExtension('Approved');
    }

    putPoamExtension(status: string) {
        const extensionData = {
            poamId: parseInt(this.poamId, 10),
            extensionTimeAllowed: this.poam.extensionTimeAllowed,
            extensionJustification: this.extensionJustification,
            status: status,
            mitigations: this.poam.mitigations,
            requiredResources: this.poam.requiredResources,
            residualRisk: this.poam.residualRisk,
            likelihood: this.poam.likelihood,
            localImpact: this.poam.localImpact,
            impactDescription: this.poam.impactDescription
        };

        if (this.poam.extensionTimeAllowed > 0) {
            this.findOrCreateExtendedLabel();
        }

        try {
            this.poamExtensionService.putPoamExtension(extensionData).subscribe({
                next: (res: any) => {
                    if (res.null || res.null == 'null') {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Information',
                            detail: 'Unexpected error adding POAM Extension'
                        });
                    } else {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Extension requested for POAM: ${res.poamId}`
                        });

                        if (this.poam.extensionTimeAllowed > 0) {
                            this.poamService.updatePoamStatus(this.poamId, extensionData).subscribe();
                        }
                        setTimeout(() => {
                            this.displayExtensionDialog = false;
                            this.router.navigateByUrl(`/poam-processing/poam-details/${this.poamId}`);
                        }, 1000);
                    }
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
        this.subscriptions.add(
            this.poamService.getLabels(this.selectedCollection).subscribe((labels: any) => {
                this.labelList = labels;
                if (this.labelList) {
                    const extendedLabel = this.labelList.find((label: any) => label.labelName === 'Extended');
                    if (extendedLabel) {
                        const extendedPoamLabel = {
                            poamId: +this.poamId,
                            labelId: +extendedLabel.labelId
                        };
                        this.poamService.postPoamLabel(extendedPoamLabel).subscribe();
                    }
                } else {
                    const extendLabel = {
                        collectionId: this.selectedCollection,
                        labelName: 'Extended',
                        description: 'POAM has been extended'
                    };
                    this.subscriptions.add(
                        this.labelService.addLabel(this.selectedCollection, extendLabel).subscribe(() => {
                            this.findOrCreateExtendedLabel();
                        })
                    );
                }
            })
        );
    }

    filterJustifications(event: any) {
        const query = event.query;
        this.filteredJustifications = this.justifications.filter((justification) => justification.toLowerCase().includes(query.toLowerCase()));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.payloadSubscription.forEach((subscription) => subscription.unsubscribe());
    }
}
